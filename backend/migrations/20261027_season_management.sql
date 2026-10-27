-- 执行前备份 zgzt_team，并确认 seasons.name 没有重复值。
-- 只新增名称唯一索引和本赛季，不修改历史赛季 ID 或比赛归属。
-- 老数据库执行一次；新安装的 schema.sql 已包含此索引，不要重复添加。
USE zgzt_team;

ALTER TABLE seasons ADD UNIQUE KEY uq_seasons_name (name);
INSERT IGNORE INTO seasons (name) VALUES ('2026-2027');
