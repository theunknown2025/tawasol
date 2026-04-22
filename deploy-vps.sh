#!/usr/bin/env bash
set -euo pipefail

# Tawasol VPS deployment script (frontend + nginx + optional SSL)
# Usage example:
# sudo bash deploy-vps.sh \
#   --domain app.example.com \
#   --email admin@example.com \
#   --repo https://github.com/theunknown2025/tawasol.git \
#   --branch main \
#   --supabase-url https://YOUR_PROJECT.supabase.co \
#   --supabase-anon-key YOUR_SUPABASE_ANON_KEY
#
# What this script does:
# 1) Installs required packages (git, curl, nginx, certbot, nodejs)
# 2) Clones/updates the repository on VPS
# 3) Writes .env.local with required Vite variables
# 4) Installs dependencies and builds the app (npm run build)
# 5) Publishes dist/ to nginx web root
# 6) Creates nginx config for SPA routing
# 7) Optionally enables SSL with Let's Encrypt
#
# IMPORTANT:
# - Run this script as root (or with sudo).
# - Update REPO_URL default below if your repository changes.
# - Keep your .env.local secrets safe (chmod 600 is applied).

APP_NAME="tawasol"
APP_USER="www-data"
REPO_URL_DEFAULT="https://github.com/theunknown2025/tawasol.git"
BRANCH_DEFAULT="main"
APP_DIR="/opt/${APP_NAME}"
WEB_ROOT="/var/www/${APP_NAME}"
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
NGINX_LINK="/etc/nginx/sites-enabled/${APP_NAME}"

DOMAIN=""
EMAIL=""
REPO_URL="${REPO_URL_DEFAULT}"
BRANCH="${BRANCH_DEFAULT}"
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
ENABLE_SSL="true"

print_help() {
  cat <<'EOF'
Deploy Tawasol to VPS with Nginx.

Required:
  --domain               Public domain name (e.g. app.example.com)
  --supabase-url         Supabase project URL
  --supabase-anon-key    Supabase anon key

Optional:
  --email                Email for Let's Encrypt (required if SSL enabled)
  --repo                 Git repository URL
  --branch               Git branch name (default: main)
  --no-ssl               Skip certbot SSL setup
  --help                 Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="${2:-}"; shift 2 ;;
    --email)
      EMAIL="${2:-}"; shift 2 ;;
    --repo)
      REPO_URL="${2:-}"; shift 2 ;;
    --branch)
      BRANCH="${2:-}"; shift 2 ;;
    --supabase-url)
      SUPABASE_URL="${2:-}"; shift 2 ;;
    --supabase-anon-key)
      SUPABASE_ANON_KEY="${2:-}"; shift 2 ;;
    --no-ssl)
      ENABLE_SSL="false"; shift ;;
    --help|-h)
      print_help; exit 0 ;;
    *)
      echo "Unknown argument: $1"
      print_help
      exit 1 ;;
  esac
done

if [[ -z "${DOMAIN}" || -z "${SUPABASE_URL}" || -z "${SUPABASE_ANON_KEY}" ]]; then
  echo "Missing required parameters."
  print_help
  exit 1
fi

if [[ "${ENABLE_SSL}" == "true" && -z "${EMAIL}" ]]; then
  echo "--email is required when SSL is enabled."
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root (use sudo)."
  exit 1
fi

log() { echo -e "\n==> $*"; }

install_packages() {
  log "Installing system packages"
  apt-get update
  apt-get install -y git curl nginx certbot python3-certbot-nginx ca-certificates gnupg

  if ! command -v node >/dev/null 2>&1; then
    log "Installing Node.js LTS"
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt-get install -y nodejs
  fi

  npm install -g npm@latest
}

prepare_directories() {
  log "Preparing directories"
  mkdir -p "${APP_DIR}" "${WEB_ROOT}"
  chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}" "${WEB_ROOT}"
}

sync_repo() {
  log "Cloning/updating repository"
  if [[ -d "${APP_DIR}/.git" ]]; then
    git -C "${APP_DIR}" fetch --all
    git -C "${APP_DIR}" checkout "${BRANCH}"
    git -C "${APP_DIR}" pull --ff-only origin "${BRANCH}"
  else
    rm -rf "${APP_DIR:?}/"*
    git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
  fi
}

write_env_file() {
  log "Writing .env.local"
  cat > "${APP_DIR}/.env.local" <<EOF
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
EOF
  chmod 600 "${APP_DIR}/.env.local"
  chown "${APP_USER}:${APP_USER}" "${APP_DIR}/.env.local"
}

build_frontend() {
  log "Installing dependencies and building app"
  cd "${APP_DIR}"
  npm ci
  npm run build
}

publish_build() {
  log "Publishing dist/ to nginx web root"
  rm -rf "${WEB_ROOT:?}/"*
  cp -R "${APP_DIR}/dist/." "${WEB_ROOT}/"
  chown -R "${APP_USER}:${APP_USER}" "${WEB_ROOT}"
}

write_nginx_config() {
  log "Writing nginx configuration"
  cat > "${NGINX_CONF}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    root ${WEB_ROOT};
    index index.html;

    # Vite SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Basic static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
}
EOF

  ln -sf "${NGINX_CONF}" "${NGINX_LINK}"
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
}

enable_ssl() {
  if [[ "${ENABLE_SSL}" != "true" ]]; then
    log "Skipping SSL setup (--no-ssl used)"
    return
  fi

  log "Enabling Let's Encrypt SSL"
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect
  systemctl reload nginx
}

post_deploy_info() {
  cat <<EOF

Deployment complete.

Included configuration information:
- App source directory: ${APP_DIR}
- Build output served from: ${WEB_ROOT}
- Nginx config file: ${NGINX_CONF}
- Environment file: ${APP_DIR}/.env.local
- Domain: ${DOMAIN}
- SSL enabled: ${ENABLE_SSL}

Useful update commands:
  cd ${APP_DIR}
  git pull origin ${BRANCH}
  npm ci
  npm run build
  sudo rm -rf ${WEB_ROOT}/*
  sudo cp -R dist/. ${WEB_ROOT}/
  sudo systemctl reload nginx
EOF
}

install_packages
prepare_directories
sync_repo
write_env_file
build_frontend
publish_build
write_nginx_config
enable_ssl
post_deploy_info
