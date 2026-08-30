# 数据库与样例数据说明

`backend/schema.sql` 是空数据库的完整结构基线，包含用户、队员、赛季、比赛、内容、相册、评论、留言板等表及外键、索引。

## 数据边界

- 公开仓库只保留 `schema.sql` 与 `sample_data.sql`；
- `sample_data.sql` 仅包含虚构队员、虚构对手和演示文案；
- 生产导出、成员原始表格、上传文件和数据库备份不得提交；
- 生产结构升级使用 `backend/migrations/` 中的增量迁移，执行前必须备份。

## 备份原则

迁移或批量操作前，使用生产 `.env` 中的应用连接信息创建备份；备份应放在项目目录外、仅授权人员可读的位置。建议使用：

```text
--single-transaction --quick --no-tablespaces --default-character-set=utf8mb4
```

数据搬运时使用 `--complete-insert`，避免不同环境的列顺序导致写入错位。
