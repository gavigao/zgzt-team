# ⚽ 政国中统联队 — 球队官方网站

> 对外经济贸易大学 · 政国中统联队（政府管理学院 + 国际关系学院 + 中文学院 + 统计学院）  
> 成立于 2019 年，全栈互动社区型官网

[![Tech Stack](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vite.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)](https://expressjs.com)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql)](https://mysql.com)
[![Node](https://img.shields.io/badge/Node-20-339933?logo=nodedotjs)](https://nodejs.org)

## ✨ 功能概览

### 前台页面（无需登录即可浏览）

| 页面 | 功能 |
|------|------|
| 🏠 首页 | 全屏照片轮播 Hero + 最新比赛 + 球队新闻 |
| 📖 球队历史 | 时间线大事记，从 2019 年建队至今 |
| 👥 队员名录 | 现役/历届队员卡片，含姓名、号码、位置、学院 |
| ⚔️ 比赛记录 | 按赛季筛选，大号比分展示，含赛后总结 |
| 🏆 荣誉墙 | 团队荣誉 + 个人荣誉分类展示 |
| 📰 新闻公告 | 球队新闻列表 + 详情页 |
| 🖼️ 照片墙 | 相册封面 → 照片网格 → 全屏浏览（键盘翻页） |
| 📅 训练活动 | 训练/活动日程，支持即将/已完成/已取消状态 |

### 互动功能

- 🔐 开放注册 + JWT 登录（7 天有效期）
- 💬 比赛评论区：登录后可发表评论，支持删除自己的评论
- 📸 管理后台图片上传（拖拽 + 点击上传）

### 管理后台（仅管理员）

- 📊 仪表盘：统计概览
- 👤 队员管理、⚔️ 比赛管理、📰 新闻管理
- 🏆 荣誉管理、🖼️ 相册 & 照片管理
- 📅 训练管理、👥 用户管理、⚙️ 网站设置

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | React 19 + Vite 8 + Tailwind CSS v3 | SPA 单页应用 |
| **路由** | react-router-dom v7 | 前台 13 页面 + 后台 11 页面 |
| **图标** | lucide-react | 统一图标库 |
| **HTTP** | axios | 请求拦截 + JWT 注入 + 401 自动跳转 |
| **后端** | Express 4 + mysql2/promise | RESTful API，共 ~40 个接口 |
| **认证** | jsonwebtoken + bcrypt | 单一 JWT，7 天有效期 |
| **上传** | multer | 本地磁盘存储，5MB 限制 |
| **数据库** | MySQL 8 | 11 张表，utf8mb4 编码 |
| **部署** | Nginx + PM2 | 反向代理 + SPA 回退 + 进程守护 |

## 📁 项目结构

```
球队网站/
├── frontend/                  # React 前端
│   ├── public/
│   │   ├── images/            # 首页轮播图等静态资源
│   │   └── favicon.ico
│   └── src/
│       ├── api/               # API 接口封装（index/auth/public/comments/admin）
│       ├── components/        # 可复用组件（MatchCard/PlayerCard/CommentSection/ImageUploader...）
│       ├── context/           # AuthContext — 认证状态管理
│       ├── layouts/           # PublicLayout（顶部导航+页脚）/ AdminLayout（侧边栏）
│       ├── pages/             # 前台页面 + admin/ 后台页面
│       ├── App.jsx            # 路由定义
│       ├── index.css          # Tailwind + 全局样式
│       └── main.jsx           # 入口
├── backend/                   # Express 后端
│   ├── public/uploads/        # 图片上传目录
│   └── src/
│       ├── config/auth.js     # JWT 密钥配置
│       ├── db/index.js        # MySQL 连接池
│       ├── middleware/        # auth（JWT 验证）/ admin（管理员权限）/ upload（图片上传）
│       ├── controllers/      # 4 个控制器（auth/public/comment/admin）
│       ├── routes/           # 4 组路由
│       └── app.js            # 应用入口
├── schema.sql                 # 数据库建表（11 张表）
├── seeds/setup.js             # 数据库初始化脚本（建库 + 建表 + 种子数据）
├── deploy.sh                  # 一键部署脚本
└── README.md
```

## 🚀 本地开发

### 环境要求

- Node.js 20+
- MySQL 8.0+
- npm 或 yarn

### 1. 克隆项目

```bash
git clone https://github.com/gavigao/zgzt-team.git
cd zgzt-team
```

### 2. 初始化数据库

```bash
# 用 Node.js 一键初始化（推荐）
cd backend
npm install
node seeds/setup.js

# 或手动执行 SQL
# mysql -u root -p < backend/schema.sql
```

> setup.js 会自动：创建数据库 → 执行建表 → 创建默认管理员（admin / admin123）

### 3. 配置环境变量

```bash
cp backend/.env.example backend/.env
# 按需修改 DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME / JWT_SECRET
```

`.env.example` 内容：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=zgzt_team
JWT_SECRET=your_random_secret_key
PORT=3002
```

### 4. 启动后端

```bash
cd backend
npm run dev        # nodemon 热重载，默认监听 3002 端口
```

### 5. 启动前端

```bash
cd frontend
npm install
npm run dev        # Vite 开发服务器，默认 5174 端口
```

浏览器打开 `http://localhost:5174`，前端自动代理 `/api` 请求到 `localhost:3002`。

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |

## 🌐 部署上线

项目配套了一键部署脚本 `deploy.sh`，适用于 Ubuntu 服务器：

```bash
# 在服务器上执行
bash <(curl -s https://raw.githubusercontent.com/gavigao/zgzt-team/main/deploy.sh)
```

部署流程：
1. 安装 Node.js 20 / Nginx / PM2
2. 从 GitHub 拉取最新代码
3. 配置 `.env` 环境变量
4. 初始化 MySQL 数据库
5. `npm run build` 构建前端
6. 配置 Nginx（反向代理 + SPA 回退）+ PM2 启动

部署后通过服务器 IP 或域名访问。

## 🔌 API 接口

| 前缀 | 用途 | 认证 |
|------|------|------|
| `/api/auth` | 注册、登录、获取用户信息 | 部分需登录 |
| `/api/public` | 公开内容（队员、比赛、荣誉、新闻、照片、训练等） | 无需认证 |
| `/api/comments` | 比赛评论 | 发表需登录 |
| `/api/admin` | 管理后台 CRUD | 需管理员 |

## 🎨 设计风格

- **配色**：白色主背景 + 红色 `#C41E3A` / 蓝色 `#1A3A8A` 点缀（与球队球衣一致）
- **风格**：参考巴塞罗那官网，深色导航栏 + 大面积白色内容区 + 卡片式列表
- **响应式**：桌面端宽屏大气，移动端折叠导航 + 自适应布局

---

<p align="center">
  <sub>Made with ⚽ by 政国中统联队 · Since 2019</sub>
</p>
