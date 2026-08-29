-- 独立的首页轮播管理。
-- 生产环境执行前必须备份数据库；脚本可重复执行。
USE zgzt_team;

CREATE TABLE IF NOT EXISTS home_slides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(120) NOT NULL COMMENT '图片替代文字',
  object_position ENUM('center', 'top', 'bottom') NOT NULL DEFAULT 'center' COMMENT '不同屏幕裁剪焦点',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_home_slides_active_sort (is_active, sort_order),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO home_slides (image_url, alt_text, object_position, sort_order, is_active)
SELECT '/images/捧杯时刻.jpg', '捧杯时刻', 'center', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM home_slides WHERE image_url = '/images/捧杯时刻.jpg');

INSERT INTO home_slides (image_url, alt_text, object_position, sort_order, is_active)
SELECT '/images/26年6月颁奖典礼合照.jpg', '颁奖典礼合照', 'center', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM home_slides WHERE image_url = '/images/26年6月颁奖典礼合照.jpg');

INSERT INTO home_slides (image_url, alt_text, object_position, sort_order, is_active)
SELECT '/images/毕业礼物.jpg', '毕业礼物', 'center', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM home_slides WHERE image_url = '/images/毕业礼物.jpg');

INSERT INTO home_slides (image_url, alt_text, object_position, sort_order, is_active)
SELECT '/images/决赛庆祝2.jpg', '决赛庆祝', 'center', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM home_slides WHERE image_url = '/images/决赛庆祝2.jpg');

INSERT INTO home_slides (image_url, alt_text, object_position, sort_order, is_active)
SELECT '/images/决赛后聚餐.jpg', '决赛后聚餐', 'center', 4, 1
WHERE NOT EXISTS (SELECT 1 FROM home_slides WHERE image_url = '/images/决赛后聚餐.jpg');
