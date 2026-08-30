# 开发说明

## 本地环境

- Node.js 20+
- MySQL 8+

在项目根目录复制 `backend/.env.example` 为 `backend/.env`，填写本地数据库连接信息。`.env` 不得提交。

## 初始化

仅在确认目标数据库为空时执行：

```powershell
mysql -u <user> -p < backend/schema.sql
mysql -u <user> -p zgzt_team < backend/sample_data.sql
```

`sample_data.sql` 只包含虚构脱敏内容，用于页面演示；生产数据不应从 Git 导入。

## 启动

```powershell
cd backend
npm.cmd install
npm.cmd run dev

cd ../frontend
npm.cmd install
npm.cmd run dev
```

后端默认监听 `3002`，前端通过 Vite 开发代理访问 `/api`。

## 本地验证

- 前端：`npm.cmd run build`；
- 后端修改后：对变更的 JavaScript 文件执行 `node --check <file>`；
- 手工验证登录、公开页面、管理权限和相关 API。
