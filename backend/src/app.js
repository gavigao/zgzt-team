require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务（上传的图片）
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// 路由挂载
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ code: 200, data: { status: 'ok' }, message: '服务运行正常' });
});

// 全局错误处理
app.use((err, _req, res, _next) => {
  console.error('服务器错误:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: statusCode,
    data: null,
    message: err.message || '服务器内部错误',
  });
});

app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
});
