-- 将“用户名登录”迁移为“唯一账号登录 + 可重复、可修改的公开用户名”。
-- 部署时仅执行一次；执行前请先备份数据库。
USE zgzt_team;

ALTER TABLE users
  ADD COLUMN account VARCHAR(32) NULL COMMENT '唯一登录账号' AFTER id;

-- 保留所有现有用户的登录方式：旧用户名就是迁移后的账号。
UPDATE users
SET account = LOWER(username)
WHERE account IS NULL;

ALTER TABLE users
  MODIFY account VARCHAR(32) NOT NULL COMMENT '唯一登录账号',
  ADD UNIQUE KEY uk_users_account (account),
  DROP INDEX username,
  MODIFY username VARCHAR(20) NULL COMMENT '公开用户名，可重复、可修改';
