#!/usr/bin/env bash
# InstallMail.sh — Clean Postfix + Dovecot SMTP setup (Ubuntu 24.04)
# Domain: beta-remess.pro | User: noreply | Port: 587 (STARTTLS)
#
# Prerequisites:
#   1. Run Reset.sh first if an old broken install exists
#   2. Let's Encrypt cert already present for the domain
#   3. DNS (can be done in parallel): A mail → VPS IP, MX, SPF
#
# Usage:
#   chmod +x InstallMail.sh
#   sudo ./InstallMail.sh
#
# Optional:
#   MAIL_PASSWORD='secret' TEST_TO='you@gmail.com' sudo -E ./InstallMail.sh

set -euo pipefail

MAIL_DOMAIN="${MAIL_DOMAIN:-beta-remess.pro}"
MAIL_USER="${MAIL_USER:-noreply}"
MAIL_FROM="${MAIL_USER}@${MAIL_DOMAIN}"
CERT_DIR="${CERT_DIR:-/etc/letsencrypt/live/${MAIL_DOMAIN}}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[ERR]${NC} $*" >&2; }

require_root() {
  [[ "${EUID}" -eq 0 ]] || { err "Run: sudo ./InstallMail.sh"; exit 1; }
}

detect_ip() {
  PUBLIC_IP="$(curl -4 -s --max-time 10 ifconfig.me || true)"
  [[ -n "${PUBLIC_IP}" ]] || PUBLIC_IP="$(hostname -I | awk '{print $1}')"
  [[ -n "${PUBLIC_IP}" ]] || { err "Cannot detect public IP"; exit 1; }
  log "Public IP: ${PUBLIC_IP}"
}

check_prereqs() {
  if [[ -d /etc/dovecot ]] || [[ -d /etc/postfix ]]; then
    if [[ "${FORCE:-}" != "yes" ]]; then
      warn "Existing /etc/postfix or /etc/dovecot found."
      warn "Run Reset.sh first, or re-run with: FORCE=yes sudo -E ./InstallMail.sh"
      exit 1
    fi
    warn "FORCE=yes — continuing over existing install"
  fi

  if [[ ! -f "${CERT_DIR}/fullchain.pem" || ! -f "${CERT_DIR}/privkey.pem" ]]; then
    err "Missing TLS cert in ${CERT_DIR}"
    err "Create it first (Nginx): certbot --nginx -d ${MAIL_DOMAIN}"
    exit 1
  fi
  log "TLS cert OK: ${CERT_DIR}"
}

install_packages() {
  log "Installing packages..."
  export DEBIAN_FRONTEND=noninteractive
  echo "postfix postfix/main_mailer_type select Internet Site" | debconf-set-selections
  echo "postfix postfix/mailname string ${MAIL_DOMAIN}" | debconf-set-selections
  apt-get update -qq
  apt-get install -y postfix dovecot-core dovecot-imapd dovecot-lmtpd swaks
  echo "${MAIL_DOMAIN}" > /etc/mailname
  log "Packages installed; mailname=${MAIL_DOMAIN}"
}

create_user() {
  if ! id -u "${MAIL_USER}" >/dev/null 2>&1; then
    adduser --disabled-password --gecos "REMESS Mail" "${MAIL_USER}"
    log "Created user ${MAIL_USER}"
  else
    warn "User ${MAIL_USER} already exists"
  fi

  if [[ -n "${MAIL_PASSWORD:-}" ]]; then
    echo "${MAIL_USER}:${MAIL_PASSWORD}" | chpasswd
    log "Password set from MAIL_PASSWORD"
  else
    echo
    echo "Set SMTP password for '${MAIL_USER}':"
    passwd "${MAIL_USER}"
  fi

  install -d -o "${MAIL_USER}" -g "${MAIL_USER}" -m 700 \
    "/home/${MAIL_USER}/Maildir" \
    "/home/${MAIL_USER}/Maildir/cur" \
    "/home/${MAIL_USER}/Maildir/new" \
    "/home/${MAIL_USER}/Maildir/tmp"
}

configure_postfix() {
  log "Configuring Postfix..."
  postconf -e "myhostname = ${MAIL_DOMAIN}"
  postconf -e "mydomain = ${MAIL_DOMAIN}"
  postconf -e "myorigin = \$mydomain"
  postconf -e "inet_interfaces = all"
  postconf -e "inet_protocols = ipv4"
  postconf -e "mydestination = \$myhostname, localhost.\$mydomain, localhost, \$mydomain"
  postconf -e "home_mailbox = Maildir/"
  postconf -e "smtpd_sasl_type = dovecot"
  postconf -e "smtpd_sasl_path = private/auth"
  postconf -e "smtpd_sasl_auth_enable = yes"
  postconf -e "smtpd_sasl_security_options = noanonymous"
  postconf -e "smtpd_sasl_local_domain = \$myhostname"
  postconf -e "smtpd_recipient_restrictions = permit_sasl_authenticated, permit_mynetworks, reject_unauth_destination"
  postconf -e "smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, defer_unauth_destination"
  postconf -e "smtpd_tls_cert_file = ${CERT_DIR}/fullchain.pem"
  postconf -e "smtpd_tls_key_file = ${CERT_DIR}/privkey.pem"
  postconf -e "smtpd_tls_security_level = may"
  postconf -e "smtp_tls_security_level = may"
  postconf -e "smtpd_tls_auth_only = yes"
  postconf -e "smtpd_helo_required = yes"
  postconf -e "disable_vrfy_command = yes"

  local master_cf="/etc/postfix/master.cf"
  local marker="# --- InstallMail.sh: submission 587 ---"
  if ! grep -qF "${marker}" "${master_cf}"; then
    # Comment any active stock submission line to avoid duplicates
    if grep -qE '^submission[[:space:]]' "${master_cf}"; then
      sed -i -E 's/^submission([[:space:]])/#submission\1/' "${master_cf}"
    fi
    cat >> "${master_cf}" <<EOF

${marker}
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_recipient_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING
EOF
  fi
  log "Postfix ready (submission :587)"
}

configure_dovecot() {
  log "Configuring Dovecot (safe edits only)..."

  # mail location
  sed -i -E 's|^#?mail_location\s*=.*|mail_location = maildir:~/Maildir|' /etc/dovecot/conf.d/10-mail.conf

  # auth mechanisms + system users (!include — never *!include)
  sed -i -E 's/^#?auth_mechanisms\s*=.*/auth_mechanisms = plain login/' /etc/dovecot/conf.d/10-auth.conf
  sed -i -E 's/^#!include auth-system\.conf\.ext/!include auth-system.conf.ext/' /etc/dovecot/conf.d/10-auth.conf
  # Repair if a previous broken script left *!include
  sed -i -E 's/^\*!include auth-system\.conf\.ext/!include auth-system.conf.ext/' /etc/dovecot/conf.d/10-auth.conf

  # Enable Postfix SASL socket inside existing service auth (Python = exact, no corrupt sed)
  python3 - <<'PY'
from pathlib import Path
path = Path("/etc/dovecot/conf.d/10-master.conf")
text = path.read_text()
new = """  # Postfix smtp-auth (InstallMail.sh)
  unix_listener /var/spool/postfix/private/auth {
    mode = 0660
    user = postfix
    group = postfix
  }"""
variants = [
"""  # Postfix smtp-auth
  #unix_listener /var/spool/postfix/private/auth {
  #  mode = 0666
  #}""",
"""  #unix_listener /var/spool/postfix/private/auth {
  #  mode = 0666
  #  user = postfix
  #  group = postfix
  #}""",
"""  #unix_listener /var/spool/postfix/private/auth {
  #  mode = 0666
  #}""",
]
if "unix_listener /var/spool/postfix/private/auth {" in text and not text.count("#unix_listener /var/spool/postfix/private/auth"):
    # Already enabled (uncommented)
    print("Postfix SASL listener already active")
elif any(v in text for v in variants):
    for old in variants:
        if old in text:
            path.write_text(text.replace(old, new, 1))
            print("Enabled Postfix SASL listener")
            break
else:
    # Insert before the closing brace of service auth { ... } at column 0
    lines = text.splitlines(keepends=True)
    out, in_auth, depth, done = [], False, 0, False
    for line in lines:
        if line.startswith("service auth {"):
            in_auth, depth = True, 1
            out.append(line)
            continue
        if in_auth and not done:
            if "{" in line:
                depth += line.count("{")
            if "}" in line:
                depth -= line.count("}")
            if depth == 0:
                out.append(new + "\n")
                out.append(line)
                done = True
                in_auth = False
                continue
        out.append(line)
    if not done:
        raise SystemExit("Could not locate service auth { } in 10-master.conf")
    path.write_text("".join(out))
    print("Inserted Postfix SASL listener")
PY

  # TLS via drop-in only (do not rewrite 10-ssl.conf)
  tee /etc/dovecot/conf.d/99-ssl-letsencrypt.conf >/dev/null <<EOF
# InstallMail.sh
ssl = required
ssl_cert = <${CERT_DIR}/fullchain.pem
ssl_key = <${CERT_DIR}/privkey.pem
EOF

  if ! doveconf -n >/dev/null 2>&1; then
    err "Dovecot config invalid:"
    doveconf -n 2>&1 || true
    exit 1
  fi
  log "Dovecot config OK"
}

configure_firewall() {
  if command -v ufw >/dev/null 2>&1; then
    ufw allow 587/tcp comment 'SMTP submission' || true
    ufw allow 25/tcp comment 'SMTP inbound' || true
    log "UFW: allowed 25 and 587"
  else
    warn "Open 25 and 587 in Hostinger firewall if needed"
  fi
}

restart_and_verify() {
  systemctl restart dovecot
  systemctl restart postfix
  systemctl enable dovecot postfix >/dev/null 2>&1 || true

  systemctl is-active --quiet dovecot && log "dovecot: active" || { err "dovecot failed"; journalctl -u dovecot -n 40 --no-pager; exit 1; }
  systemctl is-active --quiet postfix && log "postfix: active" || { err "postfix failed"; exit 1; }

  ss -lntp | grep -E ':25|:587' || warn "Ports 25/587 not listed"
}

optional_test() {
  if [[ -n "${TEST_TO:-}" && -n "${MAIL_PASSWORD:-}" ]]; then
    log "Sending test to ${TEST_TO}..."
    swaks --to "${TEST_TO}" --from "${MAIL_FROM}" \
      --server 127.0.0.1 --port 587 \
      --auth LOGIN --auth-user "${MAIL_USER}" \
      --auth-password "${MAIL_PASSWORD}" --tls
  else
    warn "Skip auto-test (set TEST_TO + MAIL_PASSWORD to enable)"
  fi
}

print_summary() {
  cat <<EOF

============================================================
 STEP 1 COMPLETE — Postfix + Dovecot
============================================================
 DNS for ${MAIL_DOMAIN} (Hostinger):

   A     mail    ${PUBLIC_IP}
   MX    @       mail.${MAIL_DOMAIN}   (priority 10)
   TXT   @       v=spf1 ip4:${PUBLIC_IP} mx ~all

 SMTP for your app:

   Host:       ${MAIL_DOMAIN}
   Port:       587
   Username:   ${MAIL_USER}
   Password:   (the one you set)
   From:       ${MAIL_FROM}
   Encryption: STARTTLS

 Manual test:

   swaks --to you@gmail.com \\
     --from ${MAIL_FROM} \\
     --server 127.0.0.1 --port 587 \\
     --auth LOGIN --auth-user ${MAIL_USER} \\
     --auth-password 'YOUR_PASSWORD' --tls

 Next step (when ready): wire the app / notifications to this SMTP.
============================================================
EOF
}

main() {
  require_root
  echo "=== InstallMail.sh (Step 1) ==="
  echo "Domain: ${MAIL_DOMAIN} | User: ${MAIL_USER}"
  echo
  detect_ip
  check_prereqs
  install_packages
  create_user
  configure_postfix
  configure_dovecot
  configure_firewall
  restart_and_verify
  optional_test
  print_summary
  log "Step 1 done."
}

main "$@"
