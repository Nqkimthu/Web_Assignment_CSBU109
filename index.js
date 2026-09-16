require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas: Kết nối thành công!'))
  .catch(err => console.error('❌ MongoDB Atlas lỗi:', err.message));

// Route kiểm tra server và TiDB
app.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: process.env.TIDB_PORT,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE,
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });
    
    await connection.end();
    res.json({
      status: 'success',
      message: 'Hệ thống backend và 2 database (TiDB & MongoDB) hoạt động bình thường!'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});