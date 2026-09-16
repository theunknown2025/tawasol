#!/usr/bin/env bash
# FixDove.sh — Repair Dovecot after SMTPConfig.sh (duplicate service auth / SSL)
# Target: Ubuntu 24.04 + Let's Encrypt cert for MAIL_DOMAIN
#
# Usage (on the VPS as root):
#   chmod +x FixDove.sh
#   sudo ./FixDove.sh

set -euo pipefail

MAIL_DOMAIN="${MAIL_DOMAIN:-beta-remess.pro}"
CERT_DIR="${CERT_DIR:-/etc/letsencrypt/live/${MAIL_DOMAIN}}"
MASTER_CF="/etc/dovecot/conf.d/10-master.conf"
SSL_DROPIN="/etc/dovecot/conf.d/99-ssl-letsencrypt.conf"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[ERR]${NC} $*" >&2; }

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    err "Run as root: sudo ./FixDove.sh"
    exit 1
  fi
}

check_cert() {
  if [[ ! -f "${CERT_DIR}/fullchain.pem" || ! -f "${CERT_DIR}/privkey.pem" ]]; then
    err "TLS cert missing in ${CERT_DIR}"
    exit 1
  fi
  log "TLS cert found: ${CERT_DIR}"
}

show_error_before() {
  warn "Current doveconf status (before fix):"
  if doveconf -n >/dev/null 2>&1; then
    log "Config already valid — still applying safe fixes"
  else
    doveconf -n 2>&1 || true
  fi
  echo
}

remove_duplicate_auth() {
  if [[ -f /etc/dovecot/conf.d/99-postfix-auth.conf ]]; then
    rm -f /etc/dovecot/conf.d/99-postfix-auth.conf
    log "Removed /etc/dovecot/conf.d/99-postfix-auth.conf (duplicate service auth)"
  else
    log "No 99-postfix-auth.conf present"
  fi
}

write_ssl_dropin() {
  tee "${SSL_DROPIN}" >/dev/null <<EOF
# Managed by FixDove.sh
ssl = required
ssl_cert = <${CERT_DIR}/fullchain.pem
ssl_key = <${CERT_DIR}/privkey.pem
EOF
  log "Wrote ${SSL_DROPIN}"
}

enable_postfix_sasl_listener() {
  if [[ ! -f "${MASTER_CF}" ]]; then
    err "Missing ${MASTER_CF}"
    exit 1
  fi

  cp -a "${MASTER_CF}" "${MASTER_CF}.bak.$(date +%Y%m%d%H%M%S)"

  # Repair broken "mode = = 0660" from older script versions
  sed -i -E 's/mode[[:space:]]*=[[:space:]]*=[[:space:]]*([0-9]+)/mode = \1/g' "${MASTER_CF}"

  # Uncomment Ubuntu stock Postfix auth listener if present
  sed -i 's|#unix_listener /var/spool/postfix/private/auth {|unix_listener /var/spool/postfix/private/auth {|' "${MASTER_CF}"
  sed -i '/unix_listener \/var\/spool\/postfix\/private\/auth {/,/}/ s|#  mode = 0666|  mode = 0660|' "${MASTER_CF}"
  sed -i '/unix_listener \/var\/spool\/postfix\/private\/auth {/,/}/ s|#  mode = 0660|  mode = 0660|' "${MASTER_CF}"
  sed -i '/unix_listener \/var\/spool\/postfix\/private\/auth {/,/}/ s|#  user = postfix|  user = postfix|' "${MASTER_CF}"
  sed -i '/unix_listener \/var\/spool\/postfix\/private\/auth {/,/}/ s|#  group = postfix|  group = postfix|' "${MASTER_CF}"

  # If still not active, insert listener into existing service auth { } block
  if ! grep -qE '^[[:space:]]*unix_listener /var/spool/postfix/private/auth \{' "${MASTER_CF}"; then
    awk '
      BEGIN { in_auth=0; done=0 }
      /^service auth \{/ { in_auth=1 }
      in_auth && /^\}/ && !done {
        print "  # FixDove.sh — Postfix SASL"
        print "  unix_listener /var/spool/postfix/private/auth {"
        print "    mode = 0660"
        print "    user = postfix"
        print "    group = postfix"
        print "  }"
        done=1
        in_auth=0
      }
      { print }
    ' "${MASTER_CF}" > "${MASTER_CF}.tmp" && mv "${MASTER_CF}.tmp" "${MASTER_CF}"
    log "Inserted Postfix SASL unix_listener into service auth"
  else
    log "Postfix SASL unix_listener is enabled in 10-master.conf"
  fi
}

fix_mail_location() {
  local mail_cf="/etc/dovecot/conf.d/10-mail.conf"
  if [[ -f "${mail_cf}" ]]; then
    if grep -qE '^#?mail_location\s*=' "${mail_cf}"; then
      sed -i -E 's|^#?mail_location\s*=.*|mail_location = maildir:~/Maildir|' "${mail_cf}"
    else
      echo 'mail_location = maildir:~/Maildir' >> "${mail_cf}"
    fi
    log "mail_location = maildir:~/Maildir"
  fi
}

fix_auth_mechanisms() {
  local auth_cf="/etc/dovecot/conf.d/10-auth.conf"
  if [[ -f "${auth_cf}" ]]; then
    sed -i -E 's/^#?auth_mechanisms\s*=.*/auth_mechanisms = plain login/' "${auth_cf}"
    # Must be "!include" — never "*!include" (that breaks doveconf with Expecting '{')
    sed -i -E 's/^#?\*?!include auth-system\.conf\.ext/!include auth-system.conf.ext/' "${auth_cf}"
    log "auth_mechanisms = plain login"
  fi
}

validate_and_restart() {
  echo
  if ! doveconf -n >/dev/null 2>&1; then
    err "Dovecot config still invalid:"
    doveconf -n 2>&1 || true
    exit 1
  fi
  log "doveconf: OK"

  systemctl restart dovecot
  systemctl restart postfix
  systemctl is-active --quiet dovecot && log "dovecot: active" || { err "dovecot still failed"; systemctl status dovecot --no-pager; exit 1; }
  systemctl is-active --quiet postfix && log "postfix: active" || warn "postfix not active"

  echo
  log "Listeners:"
  ss -lntp | grep -E ':25|:587' || warn "Ports 25/587 not visible yet"
}

print_next() {
  cat <<EOF

============================================================
 FixDove.sh finished
============================================================
 Test SMTP (replace PASSWORD and EMAIL):

   swaks --to EMAIL@example.com \\
     --from noreply@${MAIL_DOMAIN} \\
     --server 127.0.0.1 --port 587 \\
     --auth LOGIN --auth-user noreply \\
     --auth-password 'PASSWORD' --tls

 SMTP for the app:
   Host: ${MAIL_DOMAIN}
   Port: 587
   User: noreply
   TLS:  STARTTLS
============================================================
EOF
}

main() {
  require_root
  echo "=== FixDove.sh ==="
  echo "Domain: ${MAIL_DOMAIN}"
  echo
  check_cert
  show_error_before
  remove_duplicate_auth
  write_ssl_dropin
  enable_postfix_sasl_listener
  fix_mail_location
  fix_auth_mechanisms
  validate_and_restart
  print_next
  log "Done."
}

main "$@"
