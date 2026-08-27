require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function setup() {
  // 先连接 MySQL（不指定数据库），创建数据库
  const initPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
  });

  console.log('1/3 创建数据库...');
  await initPool.execute(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'zgzt_team'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log('  数据库 zgzt_team 已就绪');
  await initPool.end();

  // 连接目标数据库，执行建表
  const pool = require('../src/db/index');
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('2/3 执行建表...');
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.toUpperCase().startsWith('USE '));

  for (const stmt of statements) {
    try {
      await pool.execute(stmt);
    } catch (err) {
      if (!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
        console.error('  跳过:', err.message.substring(0, 80));
      }
    }
  }
  console.log('  11 张表创建完成');

  // 种子数据
  console.log('3/3 填充种子数据...');
  const passwordHash = await bcrypt.hash('admin123', 12);
  await pool.execute(
    'INSERT IGNORE INTO users (account, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    ['admin', 'admin', 'admin@zgzt.team', passwordHash, 'owner']
  );
  console.log('  管理员登录账号: admin / admin123');

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

  console.log('\n✅ 数据库初始化完成！');
  process.exit(0);
}

setup().catch(err => {
  console.error('❌ 初始化失败:', err.message);
  process.exit(1);
});
