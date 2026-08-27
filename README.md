# ⚽ 政国中统联队

> 政府管理学院 · 国际关系学院 · 中文学院 · 统计学院 —— 四院同心，绿茵逐梦
>
> 对外经济贸易大学 | 成立于 2019 年

政国中统联队网站用于记录球队的比赛、队员、荣誉、新闻、照片和训练活动，也为新老队员提供评论与互动空间。

- **线上地址**：[http://zgzt-fc.cn](http://zgzt-fc.cn)
- **用户指南**：[用户使用指南.md](用户使用指南.md)
- **仓库地址**：[github.com/gavigao/zgzt-team](https://github.com/gavigao/zgzt-team)

> 当前网站使用 HTTP，HTTPS 尚未配置。注册用户应使用一套仅用于本网站的独立密码。

---

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19 · Vite 8 · Tailwind CSS · React Router 7 · Axios · lucide-react |
| 后端 | Node.js · Express 4 · jsonwebtoken（JWT）· bcrypt · multer |
| 数据库 | MySQL 8（mysql2 连接池、utf8mb4） |
| 部署 | Nginx · PM2 · Ubuntu 22.04（阿里云轻量服务器） |

---

## 功能

### 访客与普通用户

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 首页 | `/` | 照片轮播、近期训练/活动、未来赛程、最近战绩和新闻 |
| 球队历史 | `/history` | 2019 年以来的大事记时间线 |
| 队员名录 | `/players` | 历届队长、现役/历届筛选和队员卡片 |
| 队员详情 | `/players/:id` | 照片、号码、位置、学院、简介与寄语 |
| 比赛记录 | `/matches` | 赛季和赛事分类筛选、比分卡片 |
| 比赛详情 | `/matches/:id` | 比分、赛后总结、评论与点赞 |
| 荣誉墙 | `/honors` | 团队和个人荣誉 |
| 新闻 | `/news`、`/news/:id` | 新闻列表与正文 |
| 照片墙 | `/photos`、`/photos/:albumId` | 相册、全屏浏览和键盘翻页 |
| 训练活动 | `/training` | 训练日程与状态筛选 |
| 登录 / 注册 | `/login`、`/register` | 独立账号登录、bcrypt 密码哈希、JWT 会话 |
| 新用户欢迎页 | `/welcome` | 注册后设置公开用户名 |
| 账户资料 | `/profile` | 查看登录账号、修改公开用户名 |
| 留言板 | `/board` | 发帖、帖子点赞和公开署名评论 |

### 账号模型

- `account`：唯一登录账号，4–32 位，支持字母、数字、下划线和短横线；
- `username`：公开用户名，2–20 个字符，允许重复并可随时修改；
- `password_hash`：只保存 bcrypt 哈希，不保存明文密码；
- 注册成功后自动登录，并强制进入欢迎页设置用户名；
- JWT 只携带内部用户 ID；权限角色在每次认证时从数据库读取，撤权立即生效；
- 每个注册账户可以上传自己的社区头像。

手机号或 QQ 号可以被用户当作自定义账号，但当前系统不提供短信/QQ 验证，也不代表完成了第三方账号绑定。

### 管理后台（仅管理员，`/admin`）

| 页面 | 说明 |
| --- | --- |
| 仪表盘 | 数据概览 |
| 队员管理 | CRUD、队长标记、照片上传、入队年份和寄语 |
| 比赛管理 | CRUD、赛事类型、阶段和赛后总结 |
| 新闻管理 | 草稿/发布、封面上传 |
| 荣誉管理 | 团队/个人荣誉 CRUD |
| 照片管理 | 相册 CRUD、批量上传和照片移动 |
| 训练管理 | 日程 CRUD |
| 管理员管理 | 仅总负责人可任命或撤销管理员；管理员不能继续任命管理员 |
| 网站设置 | 球队介绍和历史大事记 |

### 互动功能

- 登录用户可以发表评论、删除自己的评论；
- 管理员可以删除任意评论；
- 登录用户可以点赞或取消点赞，同一用户不会重复计数；
- 留言板帖子支持点赞与评论；公开接口只返回点赞数，不提供点赞者名单；
- 队员照片、新闻封面和相册照片共用图片上传接口，单张上限 5 MB。

---

## 数据库（15 张表）

| 表名 | 说明 |
| --- | --- |
| `users` | 登录账号、公开用户名、社区头像、密码哈希与角色 |
| `players` | 队员档案 |
| `seasons` | 赛季 |
| `team_info` | 球队介绍和历史大事记 |
| `matches` | 比赛记录 |
| `honors` | 荣誉 |
| `news` | 新闻 |
| `photo_albums` | 相册 |
| `photos` | 相册照片 |
| `comments` | 比赛评论与点赞数 |
| `comment_likes` | 评论点赞去重记录 |
| `training_schedules` | 训练/活动安排 |
| `board_posts` | 留言板帖子与公开计数 |
| `board_post_likes` | 帖子点赞去重记录，不公开点赞者名单 |
| `board_comments` | 留言板公开署名评论 |

新建数据库使用 `backend/schema.sql`。生产数据库的历史结构升级脚本位于 `backend/migrations/`，迁移脚本只能按说明执行一次，并应先备份数据库。

---

## 目录结构

```text
├── backend/
│   ├── src/                 # Express 入口、路由、控制器、中间件和数据库连接
│   ├── migrations/          # 生产数据库增量迁移
│   ├── schema.sql           # 新数据库完整结构
│   └── seeds/               # 初始化与种子数据
├── frontend/
│   ├── public/images/       # 首页静态轮播图
│   └── src/
│       ├── pages/           # 前台、账户页和 admin 后台页
│       ├── components/      # 通用组件
│       ├── api/             # Axios API 封装
│       ├── context/         # AuthContext 登录状态
│       └── layouts/         # 前后台布局
├── 用户使用指南.md          # 面向访客、队员和管理员的使用说明
├── 项目开发进度.md          # 当前完成度与后续计划
├── codex接管项目指南.md      # 本地敏感接管资料，不得提交
└── deploy.sh                # 部署入口，执行前先审阅实际内容
```

---

## 本地开发

当前本地项目路径：`D:\学习\vibe-coding\球队网站`。

```powershell
# 窗口 1：后端
cd D:\学习\vibe-coding\球队网站\backend
npm.cmd run dev

# 窗口 2：前端
cd D:\学习\vibe-coding\球队网站\frontend
npm.cmd run dev
```

- 后端默认地址：`http://localhost:3002`
- 前端默认地址：以 Vite 启动输出为准；开发代理将 `/api` 转发到 3002
- 本地需配置 `backend/.env`，不要提交真实密钥
- 首次初始化数据库：在确认目标数据库为空后运行 `node backend/seeds/setup.js`

---

## 生产发布原则

生产目录为 `/opt/zgzt-team`。日常发布遵循：

1. 检查本地和服务器 Git 状态；
2. 明确暂存本次文件，不使用未经检查的 `git add -A`；
3. 推送并在服务器使用 `git pull --ff-only`；
4. 后端执行 `npm ci --omit=dev`；
5. 前端执行 `npm ci && npm run build`；
6. 执行 `chmod -R 755 frontend/dist`；
7. `pm2 reload zgzt-team --update-env`；
8. `nginx -t` 通过后再 reload；
9. 检查 `/api/health`、页面资源与关键接口。

如果改动涉及数据库结构，顺序必须是：

1. 备份生产数据库并记录备份路径；
2. 将待发布代码推送到远端，但暂不重载生产进程；
3. 执行经过检查、可重复判断状态的迁移；
4. 立即拉取代码、构建并重载后端；
5. 核验数据库、健康检查和前端页面。

上传文件位于 `backend/public/uploads/`，属于生产数据，不应通过 Git 删除、覆盖或清理。服务器已使用 `.git/info/exclude` 忽略该目录中的运行时文件。

---

## 运维备忘

### 修改用户密码

后台暂时没有自助改密/找回密码入口。需要由管理员在服务器端通过 bcrypt 生成新哈希，并按用户的唯一 `account` 更新。不要把新密码直接写入 SQL、Git 历史或共享文档。

### 数据备份

迁移前使用应用 `.env` 中的数据库连接信息执行 `mysqldump`，推荐至少包含：

```text
--single-transaction --quick --no-tablespaces --default-character-set=utf8mb4
```

备份文件应设为仅 root 可读，并存放在项目目录之外，例如 `/opt/backups/zgzt-team/`。数据搬运场景应使用 `--complete-insert`，避免不同环境列顺序不一致导致错位。

### 常见问题

| 现象 | 常见原因 | 处理方向 |
| --- | --- | --- |
| 网页 403 | `dist` 权限不足 | `chmod -R 755 frontend/dist` |
| 上传图片出现 413/网络失败 | 图片超过 Nginx 或 multer 限制 | 保持三层上限一致，当前为 5 MB |
| 后端重载后首次探测拒绝连接 | PM2 进程尚在启动 | 稍后重试并检查 `pm2 logs` 与 3002 端口 |
| Git 拉取被阻止 | 服务器存在运行时文件或本地改动 | 先辨认并保留数据，禁止直接 reset/clean |
| 新后端报缺少字段 | 数据库迁移晚于代码重载 | 恢复服务并按“先迁移、后重载”处理 |

---

## 文档分工

- 普通使用问题：先看 `用户使用指南.md`；
- 项目功能与开发入口：看本 README；
- 当前进度与待办：看 `项目开发进度.md`；
- 服务器接管与事故恢复：看本地的 `codex接管项目指南.md`。

---

*最后更新：2026-08-27*
