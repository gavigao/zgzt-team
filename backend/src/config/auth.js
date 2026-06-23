module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'zgzt-team-dev-secret-change-in-production',
  JWT_EXPIRY: '7d',       // 单一 JWT，7 天有效
  BCRYPT_ROUNDS: 12,
};
