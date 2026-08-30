-- 政国中统联队官网：脱敏演示数据。
-- 仅用于本地空数据库演示，不能用于生产环境，也不包含真实成员或账号数据。
USE zgzt_team;

INSERT IGNORE INTO seasons (id, name) VALUES
  (1, '2025-2026');

INSERT IGNORE INTO players
  (id, name, position, jersey_number, grade, college, status, bio, join_year, is_captain, sort_order)
VALUES
  (1, '示例队员 A', '前锋', 9, 2023, '政管', 'active', '用于本地演示的虚构队员资料。', 2023, 1, 1),
  (2, '示例队员 B', '中场', 10, 2024, '国关', 'active', '用于本地演示的虚构队员资料。', 2024, 0, 2),
  (3, '示例队员 C', '后卫', 5, 2022, '文传', 'alumni', '用于本地演示的虚构队员资料。', 2022, 0, 3);

INSERT IGNORE INTO matches
  (id, season_id, opponent, match_date, competition, stage, our_score, opponent_score, summary)
VALUES
  (1, 1, '示例学院联队', '2025-10-18', '联赛', '第一轮', 3, 1, '这是一条用于本地演示的虚构比赛记录。');

INSERT IGNORE INTO team_info (`key`, title, content) VALUES
  ('introduction', '示例球队介绍', '此处为本地演示内容。请在生产环境通过管理后台维护真实球队介绍。'),
  ('history', '示例大事记', '2025：用于验证时间线展示的虚构节点。');
