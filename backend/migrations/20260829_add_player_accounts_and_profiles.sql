-- 用户—队员绑定、首次改密与队员社交资料。
-- 生产环境仅执行一次；执行前必须备份数据库。
-- 本迁移只升级结构和学院简称，不批量创建账号。
USE zgzt_team;

ALTER TABLE users
  ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 COMMENT '首次登录或重置后必须修改密码' AFTER role,
  ADD COLUMN auth_version INT NOT NULL DEFAULT 0 COMMENT '密码修改后使旧登录凭证失效' AFTER must_change_password;

ALTER TABLE players
  ADD COLUMN bio_visible TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否公开个人简介' AFTER bio,
  ADD COLUMN workplace VARCHAR(120) NULL COMMENT '毕业去向或工作单位' AFTER bio_visible,
  ADD COLUMN workplace_visible TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否公开工作单位' AFTER workplace,
  ADD COLUMN city VARCHAR(80) NULL COMMENT '所在城市' AFTER workplace_visible,
  ADD COLUMN city_visible TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否公开所在城市' AFTER city;

CREATE TABLE user_player_bindings (
  user_id INT NOT NULL PRIMARY KEY,
  player_id INT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 学院已更名；球队历史 team_info 中的历史表述不在本迁移中修改。
UPDATE players SET college = '文传' WHERE college = '中文';
