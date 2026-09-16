#!/usr/bin/env bash
# Reset.sh — Fully remove Postfix + Dovecot and revert mail setup from this project
# Does NOT touch: Nginx, Docker, Let's Encrypt certs, or your web app.
#
# Usage (on the VPS as root):
#   chmod +x Reset.sh
#   sudo CONFIRM=yes ./Reset.sh
#
# Optional:
#   REMOVE_NOREPLY=yes   also delete the noreply Linux user + home
#   REMOVE_UFW=yes       delete UFW rules for ports 25 and 587 (default: yes)

set -euo pipefail

CONFIRM="${CONFIRM:-}"
REMOVE_NOREPLY="${REMOVE_NOREPLY:-yes}"
REMOVE_UFW="${REMOVE_UFW:-yes}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[ERR]${NC} $*" >&2; }

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    err "Run as root: sudo CONFIRM=yes ./Reset.sh"
    exit 1
  fi
}

confirm_or_exit() {
  if [[ "${CONFIRM}" != "yes" ]]; then
    cat <<EOF
${YELLOW}This will REMOVE Postfix, Dovecot, their configs, and mail-related setup.${NC}

Safe (kept):
  - Nginx / your websites
  - Docker
  - Let's Encrypt certificates (/etc/letsencrypt)
  - Application code

Removed:
  - postfix, dovecot-* packages
  - /etc/postfix, /etc/dovecot
  - mail queues under /var/spool/postfix (package purge)
  - optional: user 'noreply' and UFW 25/587 rules

Re-run with:
  sudo CONFIRM=yes ./Reset.sh

Optional flags:
  REMOVE_NOREPLY=no   keep the noreply user
  REMOVE_UFW=no       keep firewall rules for 25/587
EOF
    exit 1
  fi
}

stop_services() {
  systemctl stop postfix 2>/dev/null || true
  systemctl stop dovecot 2>/dev/null || true
  systemctl disable postfix 2>/dev/null || true
  systemctl disable dovecot 2>/dev/null || true
  log "Stopped/disabled postfix + dovecot (if present)"
}

purge_packages() {
  export DEBIAN_FRONTEND=noninteractive
  apt-get purge -y \
    postfix \
    postfix-sqlite \
    dovecot-core \
    dovecot-imapd \
    dovecot-pop3d \
    dovecot-lmtpd \
    dovecot-sieve \
    dovecot-managesieved \
    swaks \
    2>/dev/null || true

  # Catch leftover dovecot/postfix packages
  apt-get purge -y 'dovecot-*' 2>/dev/null || true
  apt-get autoremove -y --purge
  apt-get clean
  log "Purged Postfix / Dovecot / swaks packages"
}

remove_configs() {
  rm -rf /etc/postfix
  rm -rf /etc/dovecot
  rm -f /etc/aliases.db
  # Keep /etc/aliases if other tools use it; recreate empty later only if needed
  rm -f /var/lib/postfix/master.lock 2>/dev/null || true

  # Temp extract / reset leftovers from our troubleshooting
  rm -rf /tmp/dovecot-reset
  rm -rf /tmp/dovecot-reset.*
  rm -f /tmp/dovecot-core_*.deb

  # Our helper scripts in root home (optional cleanup of copies only)
  # Do not delete project files — only common VPS home copies if present
  for f in SMTPConfig.sh FixDove.sh ResetDovecot.sh Reset.sh; do
    if [[ -f "/root/${f}" ]]; then
      warn "Left in place: /root/${f} (delete manually if you want)"
    fi
  done

  log "Removed /etc/postfix and /etc/dovecot"
}

reset_mailname() {
  # Restore a neutral mailname to the VPS hostname (Hostinger style)
  local host
  host="$(hostname -f 2>/dev/null || hostname)"
  echo "${host}" > /etc/mailname
  log "Reset /etc/mailname → ${host}"
}

remove_ufw_rules() {
  if [[ "${REMOVE_UFW}" != "yes" ]]; then
    warn "Skipping UFW cleanup (REMOVE_UFW=${REMOVE_UFW})"
    return 0
  fi
  if ! command -v ufw >/dev/null 2>&1; then
    warn "ufw not installed — check Hostinger panel for ports 25/587 if you opened them"
    return 0
  fi
  # Delete matching rules (ignore errors if rule missing)
  ufw status numbered | sed -n 's/^\[\([0-9]\+\)\].*\(25\/tcp\|587\/tcp\).*/\1/p' | sort -rn | while read -r n; do
    yes | ufw delete "${n}" >/dev/null 2>&1 || true
  done
  # Also try comment-based deletes
  ufw delete allow 25/tcp 2>/dev/null || true
  ufw delete allow 587/tcp 2>/dev/null || true
  log "Removed UFW rules for 25/587 (if any)"
}

remove_noreply_user() {
  if [[ "${REMOVE_NOREPLY}" != "yes" ]]; then
    warn "Skipping noreply user removal (REMOVE_NOREPLY=${REMOVE_NOREPLY})"
    return 0
  fi
  if id noreply >/dev/null 2>&1; then
    deluser --remove-home noreply 2>/dev/null || userdel -r noreply 2>/dev/null || true
    log "Removed user noreply and home directory"
  else
    log "User noreply not present"
  fi
}

verify_clean() {
  echo
  warn "Verification:"
  if dpkg -l | grep -E '^ii\s+(postfix|dovecot)' >/dev/null 2>&1; then
    err "Some packages still installed:"
    dpkg -l | grep -E '^ii\s+(postfix|dovecot)' || true
  else
    log "No postfix/dovecot packages installed"
  fi

  [[ ! -d /etc/postfix ]] && log "/etc/postfix gone" || warn "/etc/postfix still exists"
  [[ ! -d /etc/dovecot ]] && log "/etc/dovecot gone" || warn "/etc/dovecot still exists"
  ss -lntp 2>/dev/null | grep -E ':25|:587' && warn "Something still listens on 25/587" || log "Ports 25/587 not listening"

  cat <<EOF

============================================================
 Reset complete — mail stack removed
============================================================
 Kept intact:
   - Nginx / websites
   - /etc/letsencrypt (TLS for beta-remess.pro)
   - Docker / app data

 DNS tip:
   You can leave or remove the mail A / MX / SPF records
   for beta-remess.pro until you set up mail again.

 To start over later (clean install):
   1. Decide mail approach again (Postfix, or external SMTP)
   2. Install packages fresh
   3. Configure carefully (or use a single new script)

 Example wipe confirmation used:
   sudo CONFIRM=yes ./Reset.sh
============================================================
EOF
}

main() {
  require_root
  confirm_or_exit
  echo "=== Reset.sh — removing Postfix + Dovecot ==="
  echo
  stop_services
  purge_packages
  remove_configs
  reset_mailname
  remove_ufw_rules
  remove_noreply_user
  verify_clean
  log "Done. Server mail setup reverted."
}

main "$@"
