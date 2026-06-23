#!/bin/bash
set -e

# ============================================
#  政国中统联队球队网站 - 一键部署脚本
#  服务器: Ubuntu 22.04
# ============================================

echo "========================================"
echo " 政国中统联队 - 部署开始"
echo "========================================"

PROJECT_DIR=/opt/zgzt-team
BACKEND_PORT=3002
MYSQL_PASS="REDACTED"
DB_NAME="zgzt_team"

# ===== 1. 安装基础依赖 =====
echo "[1/6] 检查基础环境..."
apt update -y 2>/dev/null
for pkg in curl git nginx; do
  if ! command -v $pkg &> /dev/null; then
    apt install -y $pkg
  fi
done

# Node.js 20
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "Node.js $(node -v)"

# PM2
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

# ===== 2. 拉取代码 =====
echo "[2/6] 拉取项目代码..."
if [ -d "$PROJECT_DIR" ]; then
  cd "$PROJECT_DIR"
  git pull
else
  git clone https://github.com/gavigao/zgzt-team.git "$PROJECT_DIR"
  cd "$PROJECT_DIR"
fi

# ===== 3. 配置环境变量 =====
echo "[3/6] 配置环境变量..."
cat > "$PROJECT_DIR/backend/.env" <<ENV
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=${MYSQL_PASS}
DB_NAME=${DB_NAME}
JWT_SECRET=zgzt-team-prod-$(date +%s)-$(head -c 8 /dev/urandom | base64)
PORT=${BACKEND_PORT}
ENV

# ===== 4. 初始化数据库 =====
echo "[4/6] 初始化数据库..."
mysql -u root -p${MYSQL_PASS} <<SQL 2>/dev/null
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL

cd "$PROJECT_DIR/backend"
npm install --production
node seeds/setup.js 2>/dev/null || echo "  数据库已存在，跳过初始化"

# ===== 5. 构建前端 =====
echo "[5/6] 构建前端..."
cd "$PROJECT_DIR/frontend"
npm install --production
npm run build

# ===== 6. 配置 Nginx + 启动 =====
echo "[6/6] 配置 Nginx 和 PM2..."

cat > /etc/nginx/sites-available/zgzt-team <<NGINX
server {
    listen 80;
    server_name _;

    root /opt/zgzt-team/frontend/dist;
    index index.html;

    # 图片上传目录
    location /uploads {
        alias /opt/zgzt-team/backend/public/uploads;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # SPA 路由回退
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/zgzt-team /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# PM2 启动后端
cd "$PROJECT_DIR/backend"
pm2 delete zgzt-team 2>/dev/null || true
pm2 start src/app.js --name zgzt-team
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# 防火墙
ufw allow 80/tcp 2>/dev/null || true
ufw allow 22/tcp 2>/dev/null || true

echo ""
echo "========================================"
echo " 部署完成!"
echo ""
echo " IP 访问: http://$(curl -s ifconfig.me)"
echo " 后端端口: ${BACKEND_PORT}"
echo "========================================"
