-- 比赛评论一级回复与删除占位。
-- 生产环境执行前必须备份数据库；本迁移只执行一次。
USE zgzt_team;

ALTER TABLE comments
  ADD COLUMN parent_id INT NULL COMMENT '一级回复所属的主评论' AFTER user_id,
  ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '有回复的评论删除后保留占位' AFTER content,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER is_deleted,
  ADD INDEX idx_comments_parent (parent_id, created_at),
  ADD CONSTRAINT fk_comments_parent
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
