# 部署说明

## 生产结构

- 项目目录：`/opt/zgzt-team`
- 前端产物：`frontend/dist`
- 后端：PM2 进程 `zgzt-team`，默认监听 `3002`
- 网关：Nginx 提供静态资源，将 `/api/` 反向代理至后端，将 `/uploads/` 映射至上传目录
- 正式入口：[https://zgzt-fc.cn](https://zgzt-fc.cn)
- 临时兼容入口：服务器公网 IP 的 `8082` 端口，不作为公开作品集地址

同一服务器还运行其他项目。部署时只能修改本项目对应的 Nginx 站点和 PM2 进程，禁止覆盖默认站点、批量删除 `sites-enabled` 或重启无关进程。

## 普通发布

1. 检查本地和服务器 `git status`；
2. 仅暂存本次文件，确认后推送；
3. 服务器使用 `git pull --ff-only`；
4. 后端执行 `npm ci --omit=dev`；
5. 前端执行 `npm ci && npm run build`，并保证 `dist` 可被 Nginx 读取；
6. 重载 `zgzt-team` PM2 进程；
7. `nginx -t` 通过后再 reload；
8. 验证健康检查、页面资源和关键接口。

## 数据库变更

严格按以下顺序：备份数据库 → 检查迁移 → 执行迁移 → 拉取代码并构建 → 重载本项目后端 → 验证数据库、页面和接口。

迁移脚本只应执行一次。先检查生产表结构和迁移状态，不要以重跑脚本代替问题排查。

## 域名与 HTTPS

正式域名和 HTTPS 已于 2026-09-03 配置完成：

- `zgzt-fc.cn` 与 `www.zgzt-fc.cn` 均已解析至生产服务器；
- Let's Encrypt 证书同时覆盖根域名与 `www`；
- Nginx 监听 443，仅启用 TLS 1.2 与 TLS 1.3；
- HTTP 与 `www` 请求统一跳转至 `https://zgzt-fc.cn`；
- `/api/` 继续反向代理到 `127.0.0.1:3002`，`/uploads/` 继续映射生产上传目录；
- Certbot 定时器已启用并处于 active 状态；
- ACME 验证路径 `/.well-known/acme-challenge/` 必须优先于 SPA fallback，不能删除；
- 首次完整 `certbot renew --dry-run` 因 Certbot 随机延迟未完成，应在后续维护窗口复核；
- HSTS 尚未启用，待 HTTPS 稳定运行并确认子域策略后再评估。

HTTPS 日常检查：

```bash
nginx -t
systemctl status certbot.timer
certbot certificates
curl -I http://zgzt-fc.cn
curl -I https://zgzt-fc.cn
curl https://zgzt-fc.cn/api/health
```

只允许修改 `/etc/nginx/sites-available/zgzt-team`。旧项目的 Nginx 站点、PM2 进程和数据库不得随球队网站证书维护一起改动。
