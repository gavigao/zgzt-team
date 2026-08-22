# ⚽ 政国中统联队

> 政府管理学院 · 国际关系学院 · 中文学院 · 统计学院 —— 四院同心，绿茵逐梦
>
> 对外经济贸易大学 | 成立于 2019 年

**政国中统联队** 由对外经济贸易大学四个学院联合组建，自 2019 年成立以来在校联赛中屡创佳绩。这个网站记录球队的比赛、荣誉、队员和每一个值得铭记的瞬间。

- **线上地址**：http://39.106.198.141:8082
- **仓库地址**：https://github.com/gavigao/zgzt-team

---

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19 · Vite 8 · Tailwind CSS · React Router 7 · Axios · lucide-react |
| 后端 | Node.js · Express 4 · jsonwebtoken(JWT) · bcrypt · multer |
| 数据库 | MySQL 8（mysql2 连接池） |
| 部署 | Nginx · PM2 · Ubuntu 22.04（阿里云轻量服务器） |

---

## 功能

### 🏠 前台（访客，无需登录）

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 首页 | `/` | 全屏照片轮播 + 最新比赛 + 球队新闻 |
| 球队历史 | `/history` | 2019–2026 时间线大事记 |
| 队员名录 | `/players` | 历届队长展示 + 现役/历届筛选 + 队员卡片 |
| 队员详情 | `/players/:id` | 照片、姓名、号码、位置、学院、入队年份、个人简介、寄语 |
| 比赛记录 | `/matches` | 赛季筛选 + 新生赛/联赛分类 + 比分卡片 |
| 比赛详情 | `/matches/:id` | 比分 + 赛后总结 + 评论区（含点赞） |
| 荣誉墙 | `/honors` | 团队/个人荣誉分类 |
| 新闻列表 | `/news` | 新闻卡片 + 置顶 |
| 新闻详情 | `/news/:id` | 封面图 + 全文 |
| 照片墙 | `/photos` | 相册封面网格 |
| 相册浏览 | `/photos/:albumId` | 照片网格 + 全屏大图 + 键盘翻页 |
| 训练活动 | `/training` | 训练日程 + 状态筛选 |
| 登录 / 注册 | `/login` `/register` | JWT 认证，登录保持 7 天 |

### 🛠️ 管理后台（仅管理员，`/admin`）

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 仪表盘 | `/admin` | 数据概览 |
| 队员管理 | `/admin/players` | CRUD + 队长标记 + 照片上传 + 入队年份 + 寄语 |
| 比赛管理 | `/admin/matches` | CRUD + 赛事类型/阶段 |
| 新闻管理 | `/admin/news` | 草稿/发布 |
| 荣誉管理 | `/admin/honors` | 团队/个人荣誉 CRUD |
| 照片管理 | `/admin/photos` | 相册 CRUD + 批量上传 + 照片移动 |
| 训练管理 | `/admin/training` | 日程 CRUD |
| 用户管理 | `/admin/users` | 角色变更 |
| 网站设置 | `/admin/settings` | 球队介绍/历史编辑 |

### 💬 互动功能

- **评论**：登录后可发表、删除自己的评论（管理员可删任意）；
- **评论点赞**：登录后点赞/取消点赞（防重复，同一人只能赞一次）；
- **图片上传**：队员照片、相册照片均支持上传（拖拽/点击，5MB 限制）。

---

## 数据库（12 张表）

| 表名 | 说明 |
| --- | --- |
| `users` | 用户（管理员/注册用户） |
| `players` | 队员档案（含照片、入队年份、寄语、队长标记） |
| `seasons` | 赛季 |
| `team_info` | 球队介绍/历史（键值对） |
| `matches` | 比赛记录 |
| `honors` | 荣誉 |
| `news` | 新闻 |
| `photo_albums` | 相册 |
| `photos` | 照片 |
| `comments` | 比赛评论（含点赞数） |
| `comment_likes` | 评论点赞记录（防重复） |
| `training_schedules` | 训练/活动安排 |

建表脚本见 `backend/schema.sql`。

---

## 目录结构

```
├── backend/                # 后端（Express）
│   ├── src/
│   │   ├── app.js          # 入口，挂载路由与中间件
│   │   ├── routes/         # 路由：auth / public / comments / admin
│   │   ├── controllers/    # 控制器（业务逻辑）
│   │   ├── middleware/     # 中间件：JWT 认证、管理员、图片上传
│   │   ├── db/index.js     # MySQL 连接池
│   │   └── config/auth.js  # JWT 配置
│   ├── schema.sql          # 建表脚本
│   └── seeds/              # 种子数据（setup.js / seed.js）
├── frontend/               # 前端（React + Vite）
│   └── src/
│       ├── pages/          # 页面（前台 + admin）
│       ├── components/     # 组件（PlayerCard、CommentSection 等）
│       ├── api/            # API 封装（axios）
│       ├── context/        # 全局状态（AuthContext）
│       └── layouts/        # 布局（PublicLayout / AdminLayout）
├── deploy.sh               # 一键部署脚本（IP/域名通用）
└── 球员信息.xlsx           # 原始队员数据
```

---

## 本地开发

```powershell
# 后端（窗口 1）
cd backend
npm run dev          # http://localhost:3002

# 前端（窗口 2）
cd frontend
npm run dev          # http://localhost:5174（Vite 代理 /api 到 3002）
```

> 本地需自备 MySQL，并配置 `backend/.env`（参考 `backend/.env.example`），数据库初始化：`node backend/seeds/setup.js`。

---

## 部署上线

### 一键部署脚本（推荐）

```bash
bash deploy.sh               # 自动检测公网 IP，网页用 80 端口
bash deploy.sh 1.2.3.4       # 指定公网 IP
bash deploy.sh zgzt.top      # 指定域名（需先做 DNS 解析）
```

可选环境变量：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `WEB_PORT` | 80 | 网页对外端口（服务器已有其他项目时换空闲端口） |
| `BACKEND_PORT` | 3002 | 后端服务端口 |
| `MYSQL_USER` | root | 数据库用户 |

示例（与服务器上其他项目共存时指定端口）：

```bash
WEB_PORT=8082 BACKEND_PORT=3002 MYSQL_USER=deploy bash deploy.sh 39.106.198.141
```

### 手动更新（改代码后重新部署）

```bash
# 本地：提交并推送（需可访问 GitHub）
git add -A && git commit -m "..." && git push

# 服务器：拉取 + 重启后端 + 重新构建前端
cd /opt/zgzt-team
git pull --ff-only
cd backend && pm2 reload zgzt-team --update-env
cd ../frontend && npm run build && chmod -R 755 dist
```

> ⚠️ 若改动涉及**数据库结构**（新增字段/表），需先在服务器上执行对应的 `ALTER TABLE` / `CREATE TABLE`，再重启后端。

---

## 运维备忘

### 改管理员密码

项目后台暂无改密码入口，可在服务器上执行（`backend` 目录下）：

```bash
node -e "require('dotenv').config();const b=require('bcrypt');const p=require('./src/db/index');(async()=>{const h=await b.hash('新密码',12);await p.execute('UPDATE users SET password_hash=? WHERE username=?',[h,'admin']);console.log('done');process.exit(0)})()"
```

### 数据备份 / 迁移

导出（**务必带 `--complete-insert`，否则字段列错位**）：

```bash
mysqldump -u root -p --no-create-info --skip-add-drop-table --complete-insert --result-file=数据.sql zgzt_team players matches
```

导入：

```bash
mysql -u deploy -p zgzt_team < 数据.sql
```

### 常见问题

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| 网页 403 | `dist` 目录权限 700 | `chmod -R 755 frontend/dist` |
| 上传照片报"网络请求失败" | Nginx 默认限 1MB | 配置加 `client_max_body_size 5m;` |
| 照片 >1MB 传不上去 | 同上 | 同上 |
| GitHub pull/push 卡或 reset | 网络需代理 | `git config --global http.version HTTP/1.1` 或挂代理 |
| 队员标签错乱 | 导出未带列名导致字段错位 | 用 `--complete-insert` 重新导出导入 |

---

## 反馈

网站仍在不断完善。如有想法或发现问题，欢迎联系队长，或在 GitHub 提 Issue。

<p align="center">
  <sub>⚽ 政国中统 · 四院同心 · Since 2019</sub>
</p>
