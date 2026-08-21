#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  政国中统联队球队网站 · Ubuntu 22.04 部署脚本
#  【IP / 域名通用版 · 支持自定义端口】
#
#  用法：
#    bash deploy.sh                 # 自动检测公网 IP，网页用 80 端口
#    bash deploy.sh 1.2.3.4         # 指定公网 IP
#    bash deploy.sh zgzt.top        # 指定域名（需先做 DNS 解析）
#
#  可选环境变量：
#    WEB_PORT=8082       网页对外端口（默认 80；服务器已有其他项目时请换成空闲端口）
#    BACKEND_PORT=3002   后端服务端口（默认 3002；被占用时也请更换）
#    MYSQL_USER=deploy_user bash deploy.sh <主机>
#
#  说明：本脚本用 Nginx 的 server_name _ 匹配「公网 IP 或任意域名」，
#        因此用公网 IP 直接访问也能正常工作，无需域名、无需备案。
#        换 WEB_PORT 后即可与服务器上已有的其他项目井水不犯河水。
# ============================================================

PROJECT_DIR="/opt/zgzt-team"
WEB_PORT="${WEB_PORT:-80}"
BACKEND_PORT="${BACKEND_PORT:-3002}"
DB_NAME="zgzt_team"
MYSQL_USER="${MYSQL_USER:-root}"
REPOSITORY_URL="https://github.com/gavigao/zgzt-team.git"

# 访问地址（公网 IP 或域名）；留空则稍后自动检测公网 IP
SITE_HOST="${1:-}"

echo "=============================================="
echo " 政国中统联队球队网站 · 部署开始"
echo "=============================================="

# ---------- 1. 安装基础依赖（先确保 curl 可用，用于检测 IP） ----------
if ! command -v curl >/dev/null 2>&1; then
  apt update -y
  apt install -y curl
fi
for pkg in git nginx; do
  if ! command -v "$pkg" >/dev/null 2>&1; then
    apt update -y
    apt install -y "$pkg"
  fi
done

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

# ---------- 2. 确定访问地址（公网 IP 或域名） ----------
if [ -z "$SITE_HOST" ]; then
  echo "未指定访问地址，尝试自动检测公网 IP ..."
  SITE_HOST="$(curl -fsS --max-time 10 https://api.ipify.org 2>/dev/null || true)"
  if [ -z "$SITE_HOST" ]; then
    SITE_HOST="$(curl -fsS --max-time 10 https://ifconfig.me 2>/dev/null || true)"
  fi
  if [ -z "$SITE_HOST" ]; then
    echo "❌ 无法自动检测公网 IP，请手动运行：bash deploy.sh <公网IP或域名>"
    exit 1
  fi
  echo "✔ 已检测到公网 IP：${SITE_HOST}"
fi

# 拼出完整访问地址（80 端口可省略端口号）
if [ "$WEB_PORT" = "80" ]; then
  SITE_URL="http://${SITE_HOST}"
else
  SITE_URL="http://${SITE_HOST}:${WEB_PORT}"
fi

# ---------- 3. 读取 MySQL 密码 ----------
read -r -s -p "请输入 MySQL 用户 ${MYSQL_USER} 的密码: " MYSQL_PASS
echo
if [ -z "$MYSQL_PASS" ]; then
  echo "MySQL 密码不能为空。"
  exit 1
fi

echo "目标访问地址：${SITE_URL}"
echo "网页端口：${WEB_PORT}，后端端口：${BACKEND_PORT}"
echo "本脚本不会改动服务器上已有的其他站点或 PM2 进程。"

# ---------- 4. 拉取代码 ----------
if [ -d "$PROJECT_DIR/.git" ]; then
  git -C "$PROJECT_DIR" pull --ff-only
else
  git clone "$REPOSITORY_URL" "$PROJECT_DIR"
fi

# ---------- 5. 生成环境变量（.env 不会提交到 Git） ----------
umask 077
cat > "$PROJECT_DIR/backend/.env" <<ENV
DB_HOST=localhost
DB_PORT=3306
DB_USER=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASS}
DB_NAME=${DB_NAME}
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
PORT=${BACKEND_PORT}
ENV

# ---------- 6. 初始化数据库 + 构建前端 ----------
cd "$PROJECT_DIR/backend"
npm ci --omit=dev
node seeds/setup.js

cd "$PROJECT_DIR/frontend"
npm ci
npm run build

# ---------- 7. 配置 Nginx（server_name _ 匹配 IP 和任意域名，监听自定义端口） ----------
cat > /etc/nginx/sites-available/zgzt-team <<NGINX
server {
    listen ${WEB_PORT};
    server_name _;

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

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

ln -sfn /etc/nginx/sites-available/zgzt-team /etc/nginx/sites-enabled/zgzt-team
nginx -t
systemctl reload nginx

# ---------- 8. 用 PM2 启动后端 ----------
cd "$PROJECT_DIR/backend"
if pm2 describe zgzt-team >/dev/null 2>&1; then
  pm2 reload zgzt-team --update-env
else
  pm2 start src/app.js --name zgzt-team
fi
pm2 save

# ---------- 9. 完成 ----------
echo ""
echo "=============================================="
echo " ✅ 部署完成"
echo " 访问地址：${SITE_URL}"
echo " 健康检查：${SITE_URL}/api/health"
echo "=============================================="
echo " 本机自检："
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/health" 2>/dev/null && echo "" || echo "（后端可能仍在启动中，稍后重试上面的健康检查地址）"
echo ""
echo " 后台登录：${SITE_URL}/login（默认账号 admin / admin123，上线后请尽快修改密码）"
