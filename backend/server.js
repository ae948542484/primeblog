const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let db;

function saveDB() {
  const data = db.export();
  fs.writeFileSync('./database.sqlite', Buffer.from(data));
}

function queryToArray(result) {
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });
}

function queryToObject(result) {
  if (result.length === 0 || result[0].values.length === 0) return null;
  const columns = result[0].columns;
  const obj = {};
  columns.forEach((col, index) => {
    obj[col] = result[0].values[0][index];
  });
  return obj;
}

async function initDB() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });
  
  const dbPath = './database.sqlite';
  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath);
    db = new SQL.Database(new Uint8Array(data));
  } else {
    db = new SQL.Database();
  }
  
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  saveDB();
  console.log('Connected to SQLite database');
  console.log('Tables ready: posts, messages');
}

app.get('/api/posts', (req, res) => {
  try {
    const category = req.query.category;
    let sql = 'SELECT * FROM posts ORDER BY created_at DESC';
    let params = [];
    
    if (category) {
      sql = 'SELECT * FROM posts WHERE category = ? ORDER BY created_at DESC';
      params = [category];
    }
    
    const result = db.exec(sql, params);
    res.json(queryToArray(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts/:id', (req, res) => {
  try {
    const id = req.params.id;
    const result = db.exec('SELECT * FROM posts WHERE id = ?', [id]);
    const post = queryToObject(result);
    if (!post) {
      res.status(404).json({ error: '文章不存在' });
    } else {
      res.json(post);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: '标题、内容和分类不能为空' });
    }
    db.run('INSERT INTO posts (title, content, category) VALUES (?, ?, ?)', [title, content, category]);
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    saveDB();
    res.json({ id, title, content, category, message: '文章发布成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/posts/:id', (req, res) => {
  try {
    const id = req.params.id;
    const { title, content, category } = req.body;
    db.run('UPDATE posts SET title = ?, content = ?, category = ? WHERE id = ?', [title, content, category, id]);
    const checkResult = db.exec('SELECT changes() as changes');
    const changes = checkResult[0].values[0][0];
    if (changes === 0) {
      res.status(404).json({ error: '文章不存在' });
    } else {
      saveDB();
      res.json({ id, title, content, category, message: '文章更新成功' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.run('DELETE FROM posts WHERE id = ?', [id]);
    const checkResult = db.exec('SELECT changes() as changes');
    const changes = checkResult[0].values[0][0];
    if (changes === 0) {
      res.status(404).json({ error: '文章不存在' });
    } else {
      saveDB();
      res.json({ message: '文章删除成功' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(queryToArray(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', (req, res) => {
  try {
    const { nickname, content } = req.body;
    if (!nickname || !content) {
      return res.status(400).json({ error: '昵称和内容不能为空' });
    }
    db.run('INSERT INTO messages (nickname, content) VALUES (?, ?)', [nickname, content]);
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    const timeResult = db.exec('SELECT created_at FROM messages WHERE id = ?', [id]);
    const createdAt = timeResult[0].values[0][0];
    saveDB();
    res.json({ id, nickname, content, created_at: createdAt, message: '留言发表成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/messages/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.run('DELETE FROM messages WHERE id = ?', [id]);
    const checkResult = db.exec('SELECT changes() as changes');
    const changes = checkResult[0].values[0][0];
    if (changes === 0) {
      res.status(404).json({ error: '留言不存在' });
    } else {
      saveDB();
      res.json({ message: '留言删除成功' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});