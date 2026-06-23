-- 政国中统联队球队网站 - 数据库建表脚本
-- 使用方法: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS zgzt_team
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE zgzt_team;

-- =====================
-- 1. 用户表
-- =====================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'player') NOT NULL DEFAULT 'player',
  player_id INT DEFAULT NULL COMMENT '关联 players 表（可为空）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 2. 队员档案表
-- =====================
CREATE TABLE IF NOT EXISTS players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  photo_url VARCHAR(500) DEFAULT NULL,
  position VARCHAR(50) DEFAULT NULL COMMENT '场上位置',
  jersey_number INT DEFAULT NULL COMMENT '球衣号码',
  grade YEAR DEFAULT NULL COMMENT '入学年份',
  college VARCHAR(50) DEFAULT NULL COMMENT '所属学院（政管/国关/中文/统计）',
  status ENUM('active', 'alumni') NOT NULL DEFAULT 'active' COMMENT '现役/离队',
  bio TEXT DEFAULT NULL COMMENT '个人简介',
  is_captain TINYINT(1) DEFAULT 0 COMMENT '是否队长',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_college (college)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- users.player_id 外键
ALTER TABLE users ADD CONSTRAINT fk_users_player
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL;

-- =====================
-- 3. 赛季表
-- =====================
CREATE TABLE IF NOT EXISTS seasons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL COMMENT '赛季名称，如 2019-2020',
  description TEXT DEFAULT NULL,
  is_current TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 4. 球队信息表（键值对存介绍/历史等长文本）
-- =====================
CREATE TABLE IF NOT EXISTS team_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(50) NOT NULL UNIQUE COMMENT '标识，如 history/introduction',
  title VARCHAR(100) DEFAULT NULL,
  content LONGTEXT DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 5. 比赛记录表
-- =====================
CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  season_id INT DEFAULT NULL,
  opponent VARCHAR(100) NOT NULL COMMENT '对手',
  match_date DATE NOT NULL,
  location VARCHAR(200) DEFAULT NULL,
  home_away ENUM('home', 'away') DEFAULT 'home',
  competition VARCHAR(20) DEFAULT NULL COMMENT '赛事类型：新生赛/联赛',
  stage VARCHAR(50) DEFAULT NULL COMMENT '阶段：小组赛第一轮/半决赛/决赛/第一轮等',
  our_score INT DEFAULT NULL,
  opponent_score INT DEFAULT NULL,
  summary TEXT DEFAULT NULL COMMENT '赛后总结（支持 Markdown）',
  is_highlighted TINYINT(1) DEFAULT 0 COMMENT '精选/焦点战',
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_match_date (match_date),
  INDEX idx_season (season_id),
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 6. 荣誉墙
-- =====================
CREATE TABLE IF NOT EXISTS honors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  honor_date DATE DEFAULT NULL,
  type ENUM('team', 'individual') NOT NULL DEFAULT 'team',
  recipient VARCHAR(100) DEFAULT NULL COMMENT '个人荣誉获得者',
  image_url VARCHAR(500) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 7. 新闻公告
-- =====================
CREATE TABLE IF NOT EXISTS news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content LONGTEXT DEFAULT NULL,
  cover_image VARCHAR(500) DEFAULT NULL,
  summary VARCHAR(500) DEFAULT NULL,
  is_pinned TINYINT(1) DEFAULT 0,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP NULL DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 8. 照片相册
-- =====================
CREATE TABLE IF NOT EXISTS photo_albums (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  cover_photo_url VARCHAR(500) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 9. 照片
-- =====================
CREATE TABLE IF NOT EXISTS photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  album_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  caption VARCHAR(300) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  uploaded_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_album (album_id),
  FOREIGN KEY (album_id) REFERENCES photo_albums(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 10. 比赛评论
-- =====================
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_match (match_id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 11. 训练/活动安排
-- =====================
CREATE TABLE IF NOT EXISTS training_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  schedule_date DATE NOT NULL,
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  location VARCHAR(200) DEFAULT NULL,
  status ENUM('upcoming', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming',
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_schedule_date (schedule_date),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
