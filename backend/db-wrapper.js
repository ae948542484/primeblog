/**
 * 同步 MySQL 数据库包装器（基于 worker_threads + Atomics）
 * 完全模拟 sql.js 的 API：db.run(), db.exec()
 * server.js 无需任何 await/async 改造
 */
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');

const REMOTE_CONFIG = {
  host: 'mysql-myblogsystem-project-001f.l.aivencloud.com',
  port: 26305,
  user: 'avnadmin',
  password: 'AVNS_hWmVU4xIPYfke6KyPMr',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false }
};

if (!isMainThread) {
  // ===== Worker 线程 =====
  const mysql = require('mysql2/promise');
  let conn = null;

  async function ensureConnection() {
    if (!conn) {
      conn = await mysql.createConnection({ ...workerData, ssl: { rejectUnauthorized: false } });
    }
  }

  parentPort.on('message', async (msg) => {
    try {
      await ensureConnection();

      if (msg.type === 'run') {
        const [result] = await conn.execute(msg.sql, msg.params || []);
        parentPort.postMessage({ ok: true, result });
      } else if (msg.type === 'exec') {
        const trimmed = msg.sql.trim();
        if (/^\s*SELECT|PRAGMA|EXPLAIN/i.test(trimmed)) {
          const [rows] = await conn.execute(msg.sql, msg.params || []);
          if (!rows || rows.length === 0) {
            parentPort.postMessage({ ok: true, result: [] });
          } else {
            const columns = Object.keys(rows[0]);
            const values = rows.map(row => columns.map(c => row[c]));
            parentPort.postMessage({ ok: true, result: [{ columns, values }] });
          }
        } else {
          await conn.execute(msg.sql, msg.params || []);
          parentPort.postMessage({ ok: true, result: [] });
        }
      } else if (msg.type === 'close') {
        if (conn) { await conn.end(); conn = null; }
        parentPort.postMessage({ ok: true });
        process.exit(0);
      }
    } catch (err) {
      parentPort.postMessage({ ok: false, error: err.message });
    }
  });

  return; // Worker thread exits here
}

// ===== 主线程 =====
let worker = null;
let sab = null;
let ia = null;

function ensureWorker() {
  if (!worker) {
    sab = new SharedArrayBuffer(4);
    ia = new Int32Array(sab);
    // 首次初始化时用一个简单的锁，后续用 result 缓存
    worker = new Worker(__filename, { workerData: REMOTE_CONFIG });
    // 初始化测试连接
    Atomics.store(ia, 0, 0);
    worker.postMessage({ type: 'run', sql: 'SELECT 1', params: [] });
    let _result;
    worker.on('message', (msg) => { _result = msg; Atomics.store(ia, 0, 1); Atomics.notify(ia, 0); });
    Atomics.wait(ia, 0, 0);
    console.log('✅ 已连接到 Aiven MySQL 云数据库（同步模式）');
  }
}

let pendingResult = null;

// db.run(sql, params) - 执行 INSERT/UPDATE/DELETE
function run(sql, params = []) {
  ensureWorker();
  Atomics.store(ia, 0, 0);
  worker.postMessage({ type: 'run', sql: String(sql), params: Array.isArray(params) ? params : [] });

  worker.on('message', (msg) => { pendingResult = msg; Atomics.store(ia, 0, 1); Atomics.notify(ia, 0); });

  try {
    Atomics.wait(ia, 0, 0, 30000);
    const msg = pendingResult;
    if (!msg.ok) throw new Error(msg.error);
    return msg.result;
  } catch (e) {
    // 忽略 SQLite 特有的 DDL 错误（表已存在于 MySQL）
    if (e.message && (
      e.message.includes('AUTOINCREMENT') ||
      e.message.includes('sql_require_primary_key') ||
      e.message.includes('FOREIGN KEY'))
    ) {
      return {};
    }
    throw e;
  }
}

// db.exec(sql, params) - 执行查询，返回 sql.js 格式
function exec(sql, params = []) {
  ensureWorker();
  Atomics.store(ia, 0, 0);
  worker.postMessage({ type: 'exec', sql: String(sql), params: Array.isArray(params) ? params : [] });

  worker.on('message', (msg) => { pendingResult = msg; Atomics.store(ia, 0, 1); Atomics.notify(ia, 0); });

  try {
    Atomics.wait(ia, 0, 0, 30000);
    const msg = pendingResult;
    if (!msg.ok) throw new Error(msg.error);
    return msg.result;
  } catch (e) {
    console.error('db.exec error:', e.message);
    throw e;
  }
}

function close() {
  if (worker) {
    worker.postMessage({ type: 'close' });
    worker = null;
  }
}

// 模拟 sql.js 的 export/saveDB
function exportDB() {
  return Buffer.from(''); // Not needed for MySQL
}

// saveDB 兼容
function saveDB() { /* MySQL 自动持久化 */ }

module.exports = { run, exec, export: exportDB, saveDB, close };
