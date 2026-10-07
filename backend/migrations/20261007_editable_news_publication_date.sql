-- 新闻发布日期改为不做时区转换的日历日期时间，保留原有新闻及日期。
-- 生产执行前备份 zgzt_team；勿重新导入 schema.sql 或样例数据。
USE zgzt_team;

-- 应用连接默认使用全局时区。按同一时区转换，保持原前台显示值。
SET @news_original_time_zone = @@session.time_zone;
SET SESSION time_zone = @@global.time_zone;
ALTER TABLE news MODIFY COLUMN published_at DATETIME NULL DEFAULT NULL;
SET SESSION time_zone = @news_original_time_zone;
