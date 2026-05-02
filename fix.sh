#!/usr/bin/env bash
# fix.sh — VPS one-shot: sync repo from GitHub, rebuild, reload nginx.
#
# Usage (from project dir):
#   chmod +x fix.sh && ./fix.sh
# Or:
#   bash fix.sh /var/www/tawasol
#
# If this file is not in git yet, copy it to /tmp and run:
#   bash /tmp/fix.sh /var/www/tawasol
# (bash keeps the script in memory; git clean will not stop execution.)

set -euo pipefail

ROOT="${1:-$(pwd)}"
if command -v realpath >/dev/null 2>&1; then
  cd "$(realpath "$ROOT")"
else
  cd "$ROOT"
fi

echo "==> Directory: $(pwd)"

REMOTE_URL="${GIT_REMOTE_URL:-https://github.com/theunknown2025/tawasol.git}"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "ERROR: Not a git repository: $ROOT"
  exit 1
fi

# `git clean -fdx` removes ignored env files — back up all common Vite env files.
ENV_BACKUP_DIR="$(mktemp -d /tmp/tawasol-env-backup.XXXXXX)"
for name in .env .env.local .env.production .env.production.local; do
  if [[ -f $name ]]; then
    cp -a "$name" "$ENV_BACKUP_DIR/$name"
    echo "==> Backed up $name"
  fi
done

if git remote get-url origin >/dev/null 2>&1; then
  echo "==> Remote origin: $(git remote get-url origin)"
else
  echo "==> Adding origin: $REMOTE_URL"
  git remote add origin "$REMOTE_URL"
fi

echo "==> Fetching origin..."
git fetch origin

if ! git show-ref --verify --quiet refs/remotes/origin/main; then
  echo "ERROR: origin/main not found after fetch. Check remote URL and repo branch name."
  exit 1
fi

echo "==> Cleaning untracked and ignored files (node_modules, dist, etc.)..."
git clean -fdx

echo "==> Resetting branch main to match origin/main..."
git checkout -B main origin/main

for name in .env .env.local .env.production .env.production.local; do
  if [[ -f "$ENV_BACKUP_DIR/$name" ]]; then
    cp -a "$ENV_BACKUP_DIR/$name" "./$name"
    echo "==> Restored $name"
  fi
done
rm -rf "$ENV_BACKUP_DIR"

# Vite loads .env* in production build; at least one file should exist with your keys.
if [[ ! -f .env && ! -f .env.local && ! -f .env.production && ! -f .env.production.local ]]; then
  echo "ERROR: No Vite env file found after restore (.env, .env.local, .env.production, or .env.production.local)."
  echo "Create e.g. /var/www/tawasol/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then re-run this script."
  echo "Vite bakes VITE_* into the build; without them the site cannot reach Supabase."
  exit 1
fi

echo "==> npm ci..."
npm ci

echo "==> npm run build..."
npm run build

echo "==> Reloading nginx..."
if command -v sudo >/dev/null 2>&1; then
  sudo systemctl reload nginx
else
  systemctl reload nginx
fi

echo "==> Done. Site should serve from dist/ (check nginx root)."
