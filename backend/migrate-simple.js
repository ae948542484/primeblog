/**
 * 博客数据迁移脚本 v3.1
 * 本地 SQLite → Aiven 云 MySQL
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const SQLITE_PATH = path.join(__dirname, 'database.sqlite');

const REMOTE_CONFIG = {
  host: 'mysql-myblogsystem-project-001f.l.aivencloud.com',
  port: 26305,
  user: 'avnadmin',
  password: 'AVNS_hWmVU4xIPYfke6KyPMr',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false },
  connectTimeout: 30000
};

async function migrate() {
  console.log('=== 博客数据迁移 v3.1 ===\n');

  let sqlDb, remoteConn;

  try {
    // 1. 加载 SQLite
    console.log('[1/5] 加载本地 SQLite...');
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    const buf = fs.readFileSync(SQLITE_PATH);
    sqlDb = new SQL.Database(new Uint8Array(buf));
    console.log('  OK\n');

    // 2. 获取所有表
    console.log('[2/5] 扫描表...');
    const result = sqlDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const tableNames = result[0].values.map(r => r[0]);
    console.log(`  OK, ${tableNames.length} 个表: ${tableNames.join(', ')}\n`);

    // 3. 连接 MySQL
    console.log('[3/5] 连接 Aiven MySQL...');
    remoteConn = await mysql.createConnection(REMOTE_CONFIG);
    console.log('  OK\n');

    // 4. 迁移
    await remoteConn.execute('SET FOREIGN_KEY_CHECKS = 0');
    let totalRows = 0;

    for (const tableName of tableNames) {
      const data = sqlDb.exec(`SELECT * FROM "${tableName}"`);
      const columns = data[0]?.columns || [];
      const rows = data[0]?.values || [];

      console.log(`[4/5] ${tableName}: ${rows.length} 行`);

      if (rows.length === 0) continue;

      // 删旧表建新表
      await remoteConn.execute(`DROP TABLE IF EXISTS \`${tableName}\``);

      // Aiven 强制要求主键，第一个 id 相关列作为主键
      const pkIndex = columns.findIndex(c => c.toLowerCase().includes('id'));
      const pkCol = pkIndex >= 0 ? pkIndex : 0;
      const colDefs = columns.map((c, i) => {
        if (i === pkCol) return `\`${c}\` VARCHAR(255) PRIMARY KEY`;
        return `\`${c}\` LONGTEXT`;
      }).join(', ');
      await remoteConn.execute(`CREATE TABLE \`${tableName}\` (${colDefs})`);

      // 批量插入
      const sql = `INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(',')}) VALUES (${columns.map(() => '?').join(',')})`;
      for (const row of rows) {
        await remoteConn.execute(sql, row);
      }
      totalRows += rows.length;
    }

    // 5. 完成
    console.log(`\n[5/5] ✅ 完成! 共迁移 ${tableNames.length} 张表, ${totalRows} 条数据`);
    console.log('========================================');
    console.log('🎉 线上数据库同步成功！');

  } catch (err) {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  } finally {
    if (sqlDb) sqlDb.close();
    if (remoteConn) await remoteConn.end();
  }
}

migrate();
