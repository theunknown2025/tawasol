#!/usr/bin/env bash
# SMTPConfig.sh — Install & configure Postfix + Dovecot SMTP (submission :587)
# Target: Ubuntu 24.04 on Hostinger VPS (send notifications via noreply@domain)
#
# Usage (on the VPS as root):
#   chmod +x SMTPConfig.sh
#   sudo ./SMTPConfig.sh
#
# Optional env overrides:
#   MAIL_DOMAIN=beta-remess.pro MAIL_USER=noreply ./SMTPConfig.sh

set -euo pipefail

MAIL_DOMAIN="${MAIL_DOMAIN:-beta-remess.pro}"
MAIL_USER="${MAIL_USER:-noreply}"
MAIL_FROM="${MAIL_USER}@${MAIL_DOMAIN}"
CERT_DIR="${CERT_DIR:-/etc/letsencrypt/live/${MAIL_DOMAIN}}"
HOME_MAILBOX="Maildir/"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[ERR]${NC} $*" >&2; }

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    err "Run as root: sudo ./SMTPConfig.sh"
    exit 1
  fi
}

detect_ip() {
  PUBLIC_IP="$(curl -4 -s --max-time 10 ifconfig.me 2>/dev/null || true)"
  if [[ -z "${PUBLIC_IP}" ]]; then
    PUBLIC_IP="$(hostname -I | awk '{print $1}')"
  fi
  if [[ -z "${PUBLIC_IP}" ]]; then
    err "Could not detect public IP"
    exit 1
  fi
  log "Public IP: ${PUBLIC_IP}"
}

check_cert() {
  if [[ ! -f "${CERT_DIR}/fullchain.pem" || ! -f "${CERT_DIR}/privkey.pem" ]]; then
    err "TLS cert not found in ${CERT_DIR}"
    err "Create one first, e.g.: certbot --nginx -d ${MAIL_DOMAIN}"
    exit 1
  fi
  log "Using TLS cert: ${CERT_DIR}"
}

install_packages() {
  log "Installing Postfix, Dovecot, certbot, swaks..."
  export DEBIAN_FRONTEND=noninteractive
  echo "postfix postfix/main_mailer_type select Internet Site" | debconf-set-selections
  echo "postfix postfix/mailname string ${MAIL_DOMAIN}" | debconf-set-selections
  apt-get update -qq
  apt-get install -y postfix dovecot-core dovecot-imapd dovecot-lmtpd dovecot-pop3d certbot swaks
  log "Packages installed"
}

set_mailname() {
  echo "${MAIL_DOMAIN}" > /etc/mailname
  log "Set /etc/mailname → ${MAIL_DOMAIN}"
}

create_mail_user() {
  if id -u "${MAIL_USER}" >/dev/null 2>&1; then
    warn "User ${MAIL_USER} already exists"
  else
    adduser --disabled-password --gecos "REMESS Mail" "${MAIL_USER}"
    log "Created user ${MAIL_USER}"
  fi

  if [[ -z "${MAIL_PASSWORD:-}" ]]; then
    echo
    echo "Set SMTP password for user '${MAIL_USER}' (used by the app):"
    passwd "${MAIL_USER}"
  else
    echo "${MAIL_USER}:${MAIL_PASSWORD}" | chpasswd
    log "Password set from MAIL_PASSWORD env"
  fi

  install -d -o "${MAIL_USER}" -g "${MAIL_USER}" -m 700 \
    "/home/${MAIL_USER}/Maildir" \
    "/home/${MAIL_USER}/Maildir/cur" \
    "/home/${MAIL_USER}/Maildir/new" \
    "/home/${MAIL_USER}/Maildir/tmp"
  log "Maildir ready for ${MAIL_USER}"
}

configure_postfix() {
  log "Configuring Postfix..."
  postconf -e "myhostname = ${MAIL_DOMAIN}"
  postconf -e "mydomain = ${MAIL_DOMAIN}"
  postconf -e "myorigin = \$mydomain"
  postconf -e "inet_interfaces = all"
  postconf -e "inet_protocols = ipv4"
  postconf -e "mydestination = \$myhostname, localhost.\$mydomain, localhost, \$mydomain"
  postconf -e "home_mailbox = ${HOME_MAILBOX}"
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

  ensure_submission_service
  log "Postfix configured"
}

ensure_submission_service() {
  local master_cf="/etc/postfix/master.cf"
  local marker="# --- SMTPConfig.sh: authenticated submission (port 587) ---"

  cp -a "${master_cf}" "${master_cf}.bak.$(date +%Y%m%d%H%M%S)"

  # Already configured by this script — leave as-is
  if grep -qF "${marker}" "${master_cf}"; then
    log "Submission service already present (SMTPConfig.sh marker)"
    return 0
  fi

  # Disable any stock/active submission entry so we own a single clean block
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
  log "Submission service (587) ensured in master.cf"
}

configure_dovecot() {
  log "Configuring Dovecot..."

  # Remove older broken drop-in (duplicate "service auth" breaks dovecot)
  rm -f /etc/dovecot/conf.d/99-postfix-auth.conf

  if grep -qE '^#?mail_location\s*=' /etc/dovecot/conf.d/10-mail.conf; then
    sed -i -E 's|^#?mail_location\s*=.*|mail_location = maildir:~/Maildir|' /etc/dovecot/conf.d/10-mail.conf
  else
    echo 'mail_location = maildir:~/Maildir' >> /etc/dovecot/conf.d/10-mail.conf
  fi

  sed -i -E 's/^#?auth_mechanisms\s*=.*/auth_mechanisms = plain login/' /etc/dovecot/conf.d/10-auth.conf

  # Ensure system user auth is enabled (default on Ubuntu)
  if [[ -f /etc/dovecot/conf.d/10-auth.conf ]]; then
    # Must be "!include" — never "*!include" (that breaks doveconf)
    sed -i -E 's/^#?\*?!include auth-system\.conf\.ext/!include auth-system.conf.ext/' /etc/dovecot/conf.d/10-auth.conf
  fi

  # Enable Postfix SASL listener inside the EXISTING service auth block (do not add a 2nd service auth)
  local master="/etc/dovecot/conf.d/10-master.conf"

  # Repair broken "mode = = 0660" from older script versions
  sed -i -E 's/mode[[:space:]]*=[[:space:]]*=[[:space:]]*([0-9]+)/mode = \1/g' "${master}"

  # Uncomment stock Ubuntu Postfix auth listener (safe, targeted)
  sed -i \
    -e 's|^[[:space:]]*#unix_listener /var/spool/postfix/private/auth {|  unix_listener /var/spool/postfix/private/auth {|' \
    -e '/unix_listener \/var\/spool\/postfix\/private\/auth {/,/}/ s|^[[:space:]]*#[[:space:]]*mode = .*|    mode = 0660|' \
    -e '/unix_listener \/var\/spool\/postfix\/private\/auth {/,/}/ s|^[[:space:]]*#[[:space:]]*user = postfix|    user = postfix|' \
    -e '/unix_listener \/var\/spool\/postfix\/private\/auth {/,/}/ s|^[[:space:]]*#[[:space:]]*group = postfix|    group = postfix|' \
    "${master}"

  if ! grep -qE '^[[:space:]]*unix_listener /var/spool/postfix/private/auth \{' "${master}"; then
    awk '
      BEGIN { in_auth=0; done=0 }
      /^service auth \{/ { in_auth=1 }
      in_auth && /^\}/ && !done {
        print "  # SMTPConfig.sh — Postfix SASL"
        print "  unix_listener /var/spool/postfix/private/auth {"
        print "    mode = 0660"
        print "    user = postfix"
        print "    group = postfix"
        print "  }"
        done=1
        in_auth=0
      }
      { print }
    ' "${master}" > "${master}.tmp" && mv "${master}.tmp" "${master}"
  fi

  # SSL via drop-in (avoids breaking commented lines in 10-ssl.conf)
  tee /etc/dovecot/conf.d/99-ssl-letsencrypt.conf >/dev/null <<EOF
ssl = required
ssl_cert = <${CERT_DIR}/fullchain.pem
ssl_key = <${CERT_DIR}/privkey.pem
EOF

  # Final auth include repair
  if [[ -f /etc/dovecot/conf.d/10-auth.conf ]]; then
    sed -i -E 's/^#?\*?!include auth-system\.conf\.ext/!include auth-system.conf.ext/' /etc/dovecot/conf.d/10-auth.conf
  fi

  if ! doveconf -n >/dev/null 2>&1; then
    err "Dovecot config still invalid. Full error:"
    doveconf -n 2>&1 || true
    exit 1
  fi

  log "Dovecot configured"
}

configure_firewall() {
  if command -v ufw >/dev/null 2>&1; then
    ufw allow 587/tcp comment 'SMTP submission' || true
    ufw allow 25/tcp comment 'SMTP inbound' || true
    log "UFW rules for 25/587 applied (enable ufw separately if not already)"
  else
    warn "ufw not found — open ports 25 and 587 in Hostinger firewall panel"
  fi
}

restart_services() {
  if ! systemctl restart dovecot; then
    err "dovecot failed to start — run: doveconf -n"
    journalctl -u dovecot -n 30 --no-pager || true
    exit 1
  fi
  systemctl restart postfix
  systemctl enable dovecot postfix >/dev/null 2>&1 || true
  log "Services restarted"
}

verify() {
  echo
  log "Listening ports:"
  ss -lntp | grep -E ':25|:587' || warn "Ports 25/587 not visible — check logs"
  echo
  systemctl is-active --quiet postfix && log "postfix: active" || err "postfix: not active"
  systemctl is-active --quiet dovecot && log "dovecot: active" || err "dovecot: not active"
}

print_dns_and_smtp() {
  cat <<EOF

============================================================
 DNS records to set for ${MAIL_DOMAIN}
============================================================
 Type  Name    Value
 A     mail    ${PUBLIC_IP}
 MX    @       mail.${MAIL_DOMAIN}  (priority 10)
 TXT   @       v=spf1 ip4:${PUBLIC_IP} mx ~all

 Check:
   dig +short A mail.${MAIL_DOMAIN}
   dig +short MX ${MAIL_DOMAIN}
   dig +short TXT ${MAIL_DOMAIN}

============================================================
 SMTP settings for your app
============================================================
 Host:       ${MAIL_DOMAIN}
 Port:       587
 Username:   ${MAIL_USER}
 Password:   (the password you set for ${MAIL_USER})
 From:       ${MAIL_FROM}
 Encryption: STARTTLS

 Local test (replace EMAIL and PASSWORD):
   swaks --to EMAIL@example.com \\
     --from ${MAIL_FROM} \\
     --server 127.0.0.1 --port 587 \\
     --auth LOGIN --auth-user ${MAIL_USER} \\
     --auth-password 'PASSWORD' --tls

 Logs:
   journalctl -u postfix -u dovecot -f
============================================================
EOF
}

optional_test() {
  if [[ -n "${TEST_TO:-}" && -n "${MAIL_PASSWORD:-}" ]]; then
    log "Sending test mail to ${TEST_TO}..."
    swaks --to "${TEST_TO}" \
      --from "${MAIL_FROM}" \
      --server 127.0.0.1 \
      --port 587 \
      --auth LOGIN \
      --auth-user "${MAIL_USER}" \
      --auth-password "${MAIL_PASSWORD}" \
      --tls
    log "Test command finished — check inbox/spam"
  else
    warn "Skip auto-test (set TEST_TO and MAIL_PASSWORD to enable)"
  fi
}

main() {
  require_root
  echo "=== SMTPConfig.sh ==="
  echo "Domain: ${MAIL_DOMAIN} | User: ${MAIL_USER} | From: ${MAIL_FROM}"
  echo

  detect_ip
  check_cert
  install_packages
  set_mailname
  create_mail_user
  configure_postfix
  configure_dovecot
  configure_firewall
  restart_services
  verify
  optional_test
  print_dns_and_smtp
  log "Done."
}

main "$@"
