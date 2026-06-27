/**
 * 博客数据迁移脚本
 * 功能：从本地 SQLite (database.sqlite) 读取数据 → 写入 Aiven 线上 MySQL
 *
 * 运行方式：node migrate.js
 */

const mysql = require('mysql2/promise');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================

// 本地 SQLite 数据库文件路径
const SQLITE_PATH = path.join(__dirname, 'database.sqlite');

// 线上 Aiven MySQL 数据库配置
const REMOTE_CONFIG = {
  host: 'mysql-myblogsystem-project-001f.l.aivencloud.com',
  port: 26305,
  user: 'avnadmin',
  password: 'AVNS_hWmVU4xIPYfke6KyPMr',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false }
};

// SQLite → MySQL 类型映射
function sqliteTypeToMySQL(type) {
  const upper = (type || '').toUpperCase();
  if (upper.includes('INT')) return 'INT';
  if (upper.includes('TEXT') || upper.includes('CLOB')) return 'LONGTEXT';
  if (upper.includes('REAL') || upper.includes('FLOA') || upper.includes('DOUB')) return 'DOUBLE';
  if (upper.includes('BLOB')) return 'LONGBLOB';
  if (upper.includes('BOOL')) return 'TINYINT(1)';
  return 'LONGTEXT'; // 默认
}

// 解析 SQLite CREATE TABLE 中的列定义
function parseSQLiteColumns(createSQL) {
  // 提取括号内的内容
  const match = createSQL.match(/CREATE TABLE[^(]*\(([\s\S]*)\)/i);
  if (!match) return [];

  const body = match[1];
  const columns = [];
  // 简单按逗号+换行分割，忽略约束行
  const lines = body.split(',\n').map(s => s.trim());
  
  for (const line of lines) {
    // 跳过纯约束行
    if (/^(PRIMARY KEY|FOREIGN KEY|UNIQUE|CHECK|CONSTRAINT)/i.test(line)) continue;
    
    const colMatch = line.match(/^[`"]?(\w+)[`"]?\s+(\w+)/);
    if (!colMatch) continue;
    
    const name = colMatch[1];
    const rawType = colMatch[2];
    const mysqlType = sqliteTypeToMySQL(rawType);
    
    let nullable = !line.toUpperCase().includes('NOT NULL');
    let defaultValue = null;
    let autoIncrement = line.toUpperCase().includes('AUTOINCREMENT');
    let isPrimaryKey = line.toUpperCase().includes('PRIMARY KEY');

    // 提取默认值
    const defMatch = line.match(/DEFAULT\s+(.+?)(?:,|\s*$)/i);
    if (defMatch) {
      let val = defMatch[1].trim();
      if (val.toUpperCase() === 'CURRENT_TIMESTAMP') {
        defaultValue = 'CURRENT_TIMESTAMP';
      } else if (val.toUpperCase() === 'NULL') {
        defaultValue = null;
      } else {
        // 去掉引号
        defaultValue = val.replace(/^['"]|['"]$/g, '');
      }
    }

    columns.push({
      name,
      mysqlType,
      nullable,
      defaultValue,
      autoIncrement,
      isPrimaryKey,
      rawLine: line
    });
  }
  return columns;
}

// 从 SQLite DDL 生成 MySQL CREATE TABLE 语句
function buildMySQLCreateTable(tableName, createSQL) {
  const columns = parseSQLiteColumns(createSQL);
  if (columns.length === 0) return null;

  const parts = [];
  let pkColumn = null;

  for (const col of columns) {
    let def = `\`${col.name}\` ${col.mysqlType}`;
    if (!col.nullable) def += ' NOT NULL';
    if (col.autoIncrement) {
      def += ' AUTO_INCREMENT';
      pkColumn = col.name;
    }
    if (col.defaultValue === 'CURRENT_TIMESTAMP') {
      def += ' DEFAULT CURRENT_TIMESTAMP';
    } else if (col.defaultValue !== null && col.defaultValue !== undefined) {
      def += ` DEFAULT ${mysql.escape(col.defaultValue)}`;
    } else if (col.nullable && !col.autoIncrement) {
      def += ' DEFAULT NULL';
    }
    parts.push(def);

    if (col.isPrimaryKey && !col.autoIncrement) {
      pkColumn = col.name;
    }
  }

  // 添加主键
  if (pkColumn) {
    parts.push(`PRIMARY KEY (\`${pkColumn}\`)`);
  }

  return `CREATE TABLE \`${tableName}\` (\n  ${parts.join(',\n  ')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
}

// ==================== 主流程 ====================

async function migrate() {
  let remoteConn = null;
  let sqlDb = null;

  try {
    // ===== 第1步：加载本地 SQLite =====
    console.log('📂 正在加载本地 SQLite 数据库...');
    if (!fs.existsSync(SQLITE_PATH)) {
      throw new Error(`找不到 SQLite 文件: ${SQLITE_PATH}`);
    }

    const SQL = await initSqlJs({
      locateFile: file => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
    });
    const fileBuffer = fs.readFileSync(SQLITE_PATH);
    sqlDb = new SQL.Database(new Uint8Array(fileBuffer));
    console.log(`✅ 本地 SQLite 加载成功 (${SQLITE_PATH})\n`);

    // ===== 第2步：连接线上 Aiven MySQL =====
    console.log('🔗 正在连接线上 Aiven MySQL...');
    remoteConn = await mysql.createConnection(REMOTE_CONFIG);
    console.log(`✅ 线上数据库连接成功 (${REMOTE_CONFIG.host}:${REMOTE_CONFIG.port}/${REMOTE_CONFIG.database})\n`);

    // ===== 第3步：获取 SQLite 中所有表名 =====
    console.log('📋 正在读取本地表结构...');
    const tableResult = sqlDb.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_%' ORDER BY name"
    );
    const tableNames = tableResult.length > 0
      ? tableResult[0].values.map(row => row[0])
      : [];
    console.log(`   发现 ${tableNames.length} 个表: ${tableNames.join(', ')}\n`);

    if (tableNames.length === 0) {
      throw new Error('本地 SQLite 中没有找到任何表');
    }

    // ===== 第4步：读取表结构 + 数据 =====
    const tableData = {};       // 存数据
    const tableSchemas = {};    // 存 SQLite DDL

    for (const tableName of tableNames) {
      // 读取 CREATE TABLE SQL
      const ddlResult = sqlDb.exec(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`
      );
      const createSQL = ddlResult.length > 0 ? ddlResult[0].values[0][0] : '';
      tableSchemas[tableName] = createSQL;

      // 读取所有数据
      const dataResult = sqlDb.exec(`SELECT * FROM "${tableName}"`);
      if (dataResult.length > 0) {
        const columns = dataResult[0].columns;
        const rows = dataResult[0].values;
        tableData[tableName] = { columns, rows };
        console.log(`   ✔ ${tableName}: ${columns.length} 列, ${rows.length} 行`);
      } else {
        tableData[tableName] = { columns: [], rows: [] };
        console.log(`   ─ ${tableName}: 空表`);
      }
    }
    console.log('');

    // ===== 第5步：线上建表 =====
    console.log('🏗️  正在线上数据库创建表结构...');
    await remoteConn.execute('SET FOREIGN_KEY_CHECKS = 0');

    for (const tableName of tableNames) {
      const createSQL = tableSchemas[tableName];

      // 删除旧表
      await remoteConn.execute(`DROP TABLE IF EXISTS \`${tableName}\``);

      // 序列依赖：有些表有外键，需按正确顺序创建
      // 尝试用 SQLite DDL 直接转 MySQL 格式
      const mysqlDDL = buildMySQLCreateTable(tableName, createSQL);
      if (mysqlDDL) {
        try {
          await remoteConn.execute(mysqlDDL);
          console.log(`   ✔ 已创建表: ${tableName}`);
        } catch (err) {
          console.log(`   ⚠ ${tableName} 建表略有调整: ${err.message}`);
          // 降级：用简单的列定义
          await createTableFallback(remoteConn, tableName, tableData[tableName].columns);
          console.log(`   ✔ 已创建表(fallback): ${tableName}`);
        }
      } else {
        await createTableFallback(remoteConn, tableName, tableData[tableName].columns);
        console.log(`   ✔ 已创建表(fallback): ${tableName}`);
      }
    }

    console.log('✅ 表结构创建完成\n');

    // ===== 第6步：迁移数据 =====
    console.log('📦 正在迁移数据...');
    await remoteConn.execute('SET FOREIGN_KEY_CHECKS = 0');

    for (const tableName of tableNames) {
      const { columns, rows } = tableData[tableName];

      if (columns.length === 0 || rows.length === 0) {
        console.log(`   ─ ${tableName}: 0 条数据，跳过`);
        continue;
      }

      // 去重：跳过可能重复的列（SQLite 迁移后有时会有重复列问题）
      const safeColumns = [...new Set(columns)];

      // 分批插入
      const BATCH_SIZE = 500;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const colList = safeColumns.map(c => `\`${c}\``).join(', ');
        const placeholders = batch.map(() => `(${safeColumns.map(() => '?').join(', ')})`).join(', ');
        const values = batch.flatMap(row => {
          // row 是一个数组，按 columns 顺序
          return safeColumns.map(col => {
            const idx = columns.indexOf(col);
            return idx >= 0 ? row[idx] : null;
          });
        });

        await remoteConn.execute(
          `INSERT INTO \`${tableName}\` (${colList}) VALUES ${placeholders}`,
          values
        );
      }

      console.log(`   ✔ ${tableName}: ${rows.length} 条数据已迁移`);
    }

    await remoteConn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('');

    // ===== 第7步：验证 =====
    console.log('🔍 正在验证迁移结果...');
    let allOK = true;
    for (const tableName of tableNames) {
      const localCount = tableData[tableName].rows.length;
      const [remoteResult] = await remoteConn.execute(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
      const remoteCount = remoteResult[0].cnt;
      const status = localCount === remoteCount ? '✅' : '❌';
      if (localCount !== remoteCount) allOK = false;
      console.log(`   ${status} ${tableName}: 本地 ${localCount} 条 ↔ 线上 ${remoteCount} 条`);
    }
    console.log('');

    if (allOK) {
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║     🎉 线上数据库同步成功！                  ║');
      console.log('╚══════════════════════════════════════════════╝');
    } else {
      console.log('⚠️  部分表数据量不一致，请检查上方的验证结果');
    }

  } catch (err) {
    console.error('\n❌ 迁移失败:', err.message);
    console.error('详细错误:', err);
    process.exit(1);
  } finally {
    if (sqlDb) sqlDb.close();
    if (remoteConn) await remoteConn.end().catch(() => {});
    console.log('\n👋 数据库连接已关闭');
  }
}

// ===== 降级建表函数 =====
async function createTableFallback(conn, tableName, columns) {
  const uniqueCols = [...new Set(columns)];
  const parts = uniqueCols.map((col, i) => {
    if (i === 0) {
      return `\`${col}\` INT AUTO_INCREMENT PRIMARY KEY`;
    }
    return `\`${col}\` LONGTEXT DEFAULT NULL`;
  });
  await conn.execute(`CREATE TABLE \`${tableName}\` (${parts.join(', ')}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

// ===== 启动 =====
console.log('╔══════════════════════════════════════════════╗');
console.log('║       博客数据迁移工具 v2.0                   ║');
console.log('║       本地 SQLite → Aiven 云 MySQL           ║');
console.log('╚══════════════════════════════════════════════╝\n');

migrate();
