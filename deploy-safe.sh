#!/usr/bin/env bash
set -euo pipefail

# 只发布本应用。绝不改 MySQL root、不覆盖已有 .env、也不自动建库/写种子数据。
# 首次部署前，必须由管理员单独创建 zgzt_team 及其专用应用账号。

PROJECT_DIR="/opt/zgzt-team"
ENV_FILE="$PROJECT_DIR/backend/.env"
WEB_PORT="${WEB_PORT:-8082}"
BACKEND_PORT="${BACKEND_PORT:-3002}"
DB_NAME="${DB_NAME:-zgzt_team}"
REPOSITORY_URL="https://github.com/gavigao/zgzt-team.git"
SITE_HOST="${1:-}"

if [[ ! "$SITE_HOST" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo "用法：DB_USER=<专用应用账号> DB_PASSWORD='...' bash deploy.sh <公网 IP 或域名>"
  exit 1
fi

for command in git node npm nginx pm2; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "缺少 $command。请先由服务器管理员安装运行环境；本脚本不会自动修改系统软件。"
    exit 1
  fi
done

if [ -d "$PROJECT_DIR/.git" ]; then
  git -C "$PROJECT_DIR" pull --ff-only
else
  git clone "$REPOSITORY_URL" "$PROJECT_DIR"
fi

if [ ! -f "$ENV_FILE" ]; then
  : "${DB_USER:?首次部署必须设置 DB_USER（专用应用账号，不能是 root）}"
  : "${DB_PASSWORD:?首次部署必须设置 DB_PASSWORD}"
  if [ "$DB_USER" = "root" ]; then
    echo "拒绝使用 MySQL root 作为应用账号。请创建专用应用账号后重试。"
    exit 1
  fi
  umask 077
  cat > "$ENV_FILE" <<ENV
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
PORT=${BACKEND_PORT}
ENV
  chmod 600 "$ENV_FILE"
  echo "已创建 backend/.env。"
else
  echo "保留已有 backend/.env；未修改数据库账号或密钥。"
fi

echo "跳过数据库建库、建表和种子数据：常规部署不得改动生产数据。"

cd "$PROJECT_DIR/backend"
npm ci --omit=dev
cd "$PROJECT_DIR/frontend"
npm ci
npm run build
chmod -R 755 "$PROJECT_DIR/frontend/dist"

cat > /etc/nginx/sites-available/zgzt-team <<NGINX
server {
    listen ${WEB_PORT};
    server_name ${SITE_HOST};
    client_max_body_size 5m;
    root ${PROJECT_DIR}/frontend/dist;
    index index.html;
    location /uploads/ {
        alias ${PROJECT_DIR}/backend/public/uploads/;
        try_files \$uri =404;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location / { try_files \$uri \$uri/ /index.html; }
}
NGINX

ln -sfn /etc/nginx/sites-available/zgzt-team /etc/nginx/sites-enabled/zgzt-team
nginx -t
systemctl reload nginx

cd "$PROJECT_DIR/backend"
if pm2 describe zgzt-team >/dev/null 2>&1; then
  pm2 reload zgzt-team --update-env
else
  pm2 start src/app.js --name zgzt-team
fi
pm2 save
echo "部署完成：${SITE_HOST}:${WEB_PORT}"
