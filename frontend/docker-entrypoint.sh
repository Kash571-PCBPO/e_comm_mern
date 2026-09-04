#!/bin/sh

set -e

: "${API_BASE_URL:=http://localhost:5002/api}"

cat > /usr/share/nginx/html/env-config.js << CONFIG
window._env_ = {
  API_BASE_URL: "${API_BASE_URL}"
};
CONFIG

echo "[env-config] API_BASE_URL set to ${API_BASE_URL}"