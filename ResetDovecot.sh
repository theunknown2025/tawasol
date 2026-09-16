#!/usr/bin/env bash
# ResetDovecot.sh — Restore clean Ubuntu Dovecot configs, then enable Postfix SASL + TLS
# Use when 10-master.conf / 10-auth.conf are corrupted.
#
# Usage (on the VPS as root):
#   chmod +x ResetDovecot.sh
#   sudo ./ResetDovecot.sh

set -euo pipefail

MAIL_DOMAIN="${MAIL_DOMAIN:-beta-remess.pro}"
CERT_DIR="${CERT_DIR:-/etc/letsencrypt/live/${MAIL_DOMAIN}}"
WORKDIR="$(mktemp -d /tmp/dovecot-reset.XXXXXX)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[ERR]${NC} $*" >&2; }

cleanup() { rm -rf "${WORKDIR}"; }
trap cleanup EXIT

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    err "Run as root: sudo ./ResetDovecot.sh"
    exit 1
  fi
}

check_cert() {
  if [[ ! -f "${CERT_DIR}/fullchain.pem" || ! -f "${CERT_DIR}/privkey.pem" ]]; then
    err "TLS cert missing in ${CERT_DIR}"
    exit 1
  fi
  log "TLS cert: ${CERT_DIR}"
}

restore_stock_configs() {
  log "Downloading stock dovecot-core package files..."
  cd "${WORKDIR}"
  apt-get download dovecot-core >/dev/null
  local deb
  deb="$(ls -1 dovecot-core_*.deb | head -1)"
  dpkg-deb -x "${deb}" pkg

  local src="${WORKDIR}/pkg/etc/dovecot/conf.d"
  local dst="/etc/dovecot/conf.d"
  local bak="/etc/dovecot/backup-reset-$(date +%Y%m%d%H%M%S)"
  mkdir -p "${bak}"

  for f in 10-master.conf 10-auth.conf 10-mail.conf 10-ssl.conf; do
    if [[ -f "${dst}/${f}" ]]; then
      cp -a "${dst}/${f}" "${bak}/"
    fi
    cp -a "${src}/${f}" "${dst}/${f}"
    log "Restored stock ${f}"
  done

  # Remove broken drop-ins from earlier attempts
  rm -f "${dst}/99-postfix-auth.conf"
  log "Backups in ${bak}"
}

enable_postfix_sasl() {
  local master="/etc/dovecot/conf.d/10-master.conf"

  # Exact stock Ubuntu block — uncomment cleanly with Python for reliability
  python3 - <<'PY'
from pathlib import Path
path = Path("/etc/dovecot/conf.d/10-master.conf")
text = path.read_text()
old = """  # Postfix smtp-auth
  #unix_listener /var/spool/postfix/private/auth {
  #  mode = 0666
  #}"""
# Ubuntu noble may include user/group lines — handle both shapes
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
new = """  # Postfix smtp-auth (ResetDovecot.sh)
  unix_listener /var/spool/postfix/private/auth {
    mode = 0660
    user = postfix
    group = postfix
  }"""
replaced = False
for old in variants:
    if old in text:
        text = text.replace(old, new, 1)
        replaced = True
        break
if not replaced:
    # Fallback: inject before closing brace of service auth
    lines = text.splitlines(keepends=True)
    out = []
    in_auth = False
    done = False
    for line in lines:
        if line.startswith("service auth {"):
            in_auth = True
        if in_auth and line.startswith("}") and not done:
            out.append("  # Postfix smtp-auth (ResetDovecot.sh)\n")
            out.append("  unix_listener /var/spool/postfix/private/auth {\n")
            out.append("    mode = 0660\n")
            out.append("    user = postfix\n")
            out.append("    group = postfix\n")
            out.append("  }\n")
            done = True
            in_auth = False
        out.append(line)
    text = "".join(out)
    if not done:
        raise SystemExit("Could not find service auth { } to insert Postfix listener")
path.write_text(text)
print("Postfix SASL listener enabled")
PY
  log "Postfix SASL listener configured"
}

configure_mail_and_auth() {
  sed -i -E 's|^#?mail_location\s*=.*|mail_location = maildir:~/Maildir|' /etc/dovecot/conf.d/10-mail.conf
  sed -i -E 's/^#?auth_mechanisms\s*=.*/auth_mechanisms = plain login/' /etc/dovecot/conf.d/10-auth.conf
  # Stock Ubuntu uses #!include — uncomment to !include (NOT *!include)
  sed -i -E 's/^#!include auth-system\.conf\.ext/!include auth-system.conf.ext/' /etc/dovecot/conf.d/10-auth.conf
  log "mail_location + auth_mechanisms + auth-system include set"
}

configure_ssl() {
  tee /etc/dovecot/conf.d/99-ssl-letsencrypt.conf >/dev/null <<EOF
# Managed by ResetDovecot.sh
ssl = required
ssl_cert = <${CERT_DIR}/fullchain.pem
ssl_key = <${CERT_DIR}/privkey.pem
EOF
  log "SSL drop-in written"
}

validate_restart() {
  if ! doveconf -n >/dev/null 2>&1; then
    err "Config still invalid:"
    doveconf -n 2>&1 || true
    exit 1
  fi
  log "doveconf: OK"
  systemctl restart dovecot
  systemctl restart postfix
  systemctl is-active --quiet dovecot && log "dovecot: active" || { systemctl status dovecot --no-pager; exit 1; }
  systemctl is-active --quiet postfix && log "postfix: active" || warn "postfix not active"
  ss -lntp | grep -E ':25|:587' || warn "SMTP ports not visible"
}

print_next() {
  cat <<EOF

============================================================
 ResetDovecot.sh finished
============================================================
 Test:

   swaks --to EMAIL@example.com \\
     --from noreply@${MAIL_DOMAIN} \\
     --server 127.0.0.1 --port 587 \\
     --auth LOGIN --auth-user noreply \\
     --auth-password 'PASSWORD' --tls
============================================================
EOF
}

main() {
  require_root
  echo "=== ResetDovecot.sh ==="
  check_cert
  restore_stock_configs
  enable_postfix_sasl
  configure_mail_and_auth
  configure_ssl
  validate_restart
  print_next
  log "Done."
}

main "$@"
