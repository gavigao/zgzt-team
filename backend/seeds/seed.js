require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const pool = require('../src/db/index');

async function seed() {
  console.log('开始填充种子数据...');

  // 创建默认管理员: admin / admin123
  const passwordHash = await bcrypt.hash('admin123', 12);
  await pool.execute(
    'INSERT IGNORE INTO users (account, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    ['admin', 'admin', 'admin@zgzt.team', passwordHash, 'admin']
  );
  console.log('  管理员登录账号: admin / admin123');

  // 插入几个示例赛季
  const seasons = [
    '2019-2020', '2020-2021', '2021-2022', '2022-2023',
    '2023-2024', '2024-2025', '2025-2026',
  ];
  for (const name of seasons) {
    await pool.execute(
      'INSERT IGNORE INTO seasons (name) VALUES (?)',
      [name]
    );
  }
  console.log('  赛季数据已填充（7 个赛季）');

  console.log('种子数据填充完成！');
  process.exit(0);
}

seed().catch(err => {
  console.error('种子数据填充失败:', err);
  process.exit(1);
});
