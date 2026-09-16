require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

let mongoStatus = 'Chưa kết nối';
let tidbStatus = 'Chưa kết nối';

// Kết nối MongoDB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      mongoStatus = 'Connected (Healthy)';
      console.log('MongoDB Atlas: Kết nối thành công!');
    })
    .catch(err => {
      mongoStatus = 'Lỗi kết nối: ' + err.message;
      console.error('MongoDB Atlas lỗi:', err.message);
    });
}

// Kiểm tra kết nối TiDB
async function checkTiDB() {
  if (!process.env.TIDB_HOST) return;
  try {
    const connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: process.env.TIDB_PORT || 4000,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE || 'test',
      ssl: { rejectUnauthorized: true }
    });
    await connection.ping();
    tidbStatus = 'Connected (Healthy)';
    console.log('TiDB Cloud: Kết nối thành công!');
    await connection.end();
  } catch (err) {
    tidbStatus = 'Lỗi kết nối: ' + err.message;
    console.error('TiDB Cloud lỗi:', err.message);
  }
}
checkTiDB();

// Các route RESTful API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus,
      tidb: tidbStatus,
      uptime: process.uptime()
    }
  });
});

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Nguyễn Kim Thư', role: 'Leader / Developer', status: 'Active' },
    { id: 2, name: 'Guest Tester', role: 'Auditor', status: 'Pending' }
  ]);
});

// Trang Dashboard giao diện trực quan
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cloud RESTful API Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; }
    body { background: #0b0f19; color: #e2e8f0; padding: 30px 20px; min-height: 100vh; display: flex; justify-content: center; }
    .container { max-width: 800px; width: 100%; }
    .header { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
    .badge { background: #064e3b; color: #34d399; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 14px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    h2 { font-size: 16px; margin-bottom: 15px; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .stat-box { background: #1f2937; padding: 15px; border-radius: 8px; border-left: 4px solid #38bdf8; }
    .stat-title { font-size: 12px; color: #94a3b8; }
    .stat-value { font-size: 15px; font-weight: 600; margin-top: 4px; word-break: break-all; }
    .btn { background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; margin-right: 8px; transition: 0.2s; }
    .btn:hover { background: #1d4ed8; }
    pre { background: #030712; padding: 15px; border-radius: 8px; font-size: 13px; color: #a5f3fc; overflow-x: auto; max-height: 250px; border: 1px solid #1e293b; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 style="font-size: 22px; font-weight: 700; color: #f8fafc;">⚡ RESTful API Gateway</h1>
        <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Node.js + Express deployed on Render Cloud</p>
      </div>
      <span class="badge">● SERVICE ACTIVE</span>
    </div>

    <div class="card">
      <h2>Database Health Check</h2>
      <div class="grid">
        <div class="stat-box" style="border-left-color: #10b981;">
          <div class="stat-title">MongoDB Atlas Status</div>
          <div class="stat-value" style="color: #34d399;">${mongoStatus}</div>
        </div>
        <div class="stat-box" style="border-left-color: #06b6d4;">
          <div class="stat-title">TiDB Cloud MySQL Status</div>
          <div class="stat-value" style="color: #38bdf8;">${tidbStatus}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Interactive Endpoint Tester</h2>
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">Nhấn vào nút bên dưới để gửi request test trực tiếp:</p>
      <button class="btn" onclick="testRoute('/api/health')">GET /api/health</button>
      <button class="btn" onclick="testRoute('/api/users')">GET /api/users</button>
      <pre id="output">// JSON Response sẽ xuất hiện tại đây...</pre>
    </div>
  </div>

  <script>
    async function testRoute(url) {
      const out = document.getElementById('output');
      out.textContent = 'Đang gọi ' + url + '...';
      try {
        const res = await fetch(url);
        const data = await res.json();
        out.textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        out.textContent = 'Lỗi: ' + e.message;
      }
    }
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log('🚀 Server đang chạy tại: http://localhost:' + PORT);
});
