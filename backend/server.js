const express = require('express');
const cors = require('cors');
const db = require('./db-wrapper');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const WebSocket = require('ws');

const app = express();
const PORT = 3001;

// JWT密钥配置
const JWT_SECRET = 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// 中间件配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session配置
app.use(session({
  secret: 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // 生产环境设为true
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// ===================== 敏感词过滤系统 =====================
class SensitiveWordFilter {
  constructor() {
    this.tree = {};
    this.sensitiveWords = new Set();
    this.initSensitiveWords();
  }

  initSensitiveWords() {
    const words = [
      '敏感词1', '敏感词2', '敏感词3',
      '暴力', '杀人', '虐待',
      '色情', '裸体', '赌博',
      '毒品', '枪支', '恐怖'
    ];
    words.forEach(word => this.addWord(word));
  }

  addWord(word) {
    let node = this.tree;
    for (const char of word.toLowerCase()) {
      if (!node[char]) {
        node[char] = {};
      }
      node = node[char];
    }
    node['isEnd'] = true;
    this.sensitiveWords.add(word.toLowerCase());
  }

  containsSensitive(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    for (let i = 0; i < lowerText.length; i++) {
      let node = this.tree;
      for (let j = i; j < lowerText.length; j++) {
        const char = lowerText[j];
        if (!node[char]) break;
        node = node[char];
        if (node['isEnd']) {
          return true;
        }
      }
    }
    return false;
  }

  filter(text) {
    if (!text || !this.containsSensitive(text)) return text;
    let result = text;
    this.sensitiveWords.forEach(word => {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(regex, '*'.repeat(word.length));
    });
    return result;
  }
}

const sensitiveFilter = new SensitiveWordFilter();

// ===================== 数据库配置（已切换 Aiven MySQL） =====================

function saveDB() { /* MySQL 自动持久化，无需手动保存 */ }

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
  try {
    console.log('✅ 使用 Aiven MySQL 云数据库（14 张表已就绪）');
    initDefaultData(db);
    console.log('✅ 数据库初始化成功');
    migratePostTags(db);
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err);
    throw err;
  }
}

// ===================== 工具函数：时区处理 =====================
const TIMEZONE_OFFSET = 8;

function getShanghaiTime() {
  const now = new Date();
  const shanghaiDate = new Date(now.getTime() + TIMEZONE_OFFSET * 60 * 60 * 1000);
  return shanghaiDate.toISOString().replace('T', ' ').substring(0, 19);
}

function formatToShanghaiTime(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const shanghaiDate = new Date(date.getTime() + TIMEZONE_OFFSET * 60 * 60 * 1000);
  return shanghaiDate.toISOString().replace('T', ' ').substring(0, 19);
}

// ===================== 中间件：获取真实IP =====================
const getRealIp = (req, res, next) => {
  const realIp = (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
  
  const cleanIp = realIp.split(',')[0].trim();
  req.realIp = cleanIp;
  
  next();
};

// ===================== JWT认证中间件 =====================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

// ===================== 管理员认证中间件 =====================
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: '令牌无效或已过期' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    
    req.user = user;
    next();
  });
};

// ===================== 敏感词中间件 =====================
const contentModeration = (req, res, next) => {
  const { content, nickname } = req.body;
  
  if (nickname && sensitiveFilter.containsSensitive(nickname)) {
    return res.status(422).json({
      success: false,
      error: '内容包含敏感词，请文明发言',
      field: 'nickname'
    });
  }
  
  if (content && sensitiveFilter.containsSensitive(content)) {
    return res.status(422).json({
      success: false,
      error: '内容包含敏感词，请文明发言',
      field: 'content'
    });
  }
  
  next();
};

// ===================== 访客记录 Model =====================
const VisitorModel = {
  findByIp(ip) {
    try {
      const result = db.exec('SELECT * FROM visitors WHERE ip = ?', [ip]);
      return queryToObject(result);
    } catch (err) {
      console.error('❌ 查询访客失败:', err);
      return null;
    }
  },

  create(ip, nickname) {
    try {
      const now = getShanghaiTime();
      db.run(
        'INSERT INTO visitors (ip, nickname, visit_count, first_visit_at, last_visit_at) VALUES (?, ?, 1, ?, ?)',
        [ip, nickname, now, now]
      );
      
      const result = db.exec('SELECT last_insert_rowid() as id');
      const id = result[0].values[0][0];
      
      return { id, ip, nickname, visit_count: 1, first_visit_at: now, last_visit_at: now };
    } catch (err) {
      console.error('❌ 创建访客失败:', err);
      return null;
    }
  },

  updateVisit(ip) {
    try {
      const now = getShanghaiTime();
      db.run(
        'UPDATE visitors SET visit_count = visit_count + 1, last_visit_at = ? WHERE ip = ?',
        [now, ip]
      );
      
      const visitor = this.findByIp(ip);
      return visitor ? this.formatVisitor(visitor) : null;
    } catch (err) {
      console.error('❌ 更新访客失败:', err);
      return null;
    }
  },

  getAll() {
    try {
      const result = db.exec('SELECT * FROM visitors ORDER BY last_visit_at DESC');
      return queryToArray(result).map(visitor => this.formatVisitor(visitor));
    } catch (err) {
      console.error('❌ 获取访客列表失败:', err);
      return [];
    }
  },

  getTotalCount() {
    try {
      const result = db.exec('SELECT COUNT(*) as total FROM visitors');
      return result[0].values[0][0];
    } catch (err) {
      console.error('❌ 获取访客总数失败:', err);
      return 0;
    }
  },

  formatVisitor(visitor) {
    return {
      id: visitor.id,
      ip: visitor.ip,
      nickname: visitor.nickname,
      visit_count: visitor.visit_count,
      first_visit_at: formatToShanghaiTime(visitor.first_visit_at),
      last_visit_at: formatToShanghaiTime(visitor.last_visit_at)
    };
  }
};

// ===================== 访客记录 Controller =====================
const VisitorController = {
  generateNickname() {
    const adjectives = ['可爱的', '聪明的', '神秘的', '勇敢的', '快乐的', '优雅的', '幽默的', '勤奋的'];
    const nouns = ['小猫', '小狗', '兔子', '熊猫', '狐狸', '海豚', '考拉', '仓鼠'];
    const random = Math.floor(Math.random() * 1000);
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj}${noun}${random}`;
  },

  recordVisit(req, res) {
    try {
      const ip = req.realIp;
      
      let visitor = VisitorModel.findByIp(ip);
      
      if (visitor) {
        const updatedVisitor = VisitorModel.updateVisit(ip);
        res.json({
          success: true,
          data: updatedVisitor,
          message: '访问记录已更新'
        });
      } else {
        const nickname = this.generateNickname();
        const newVisitor = VisitorModel.create(ip, nickname);
        res.json({
          success: true,
          data: VisitorModel.formatVisitor(newVisitor),
          message: '欢迎新访客！'
        });
      }
      
      saveDB();
    } catch (err) {
      console.error('❌ 记录访问失败:', err);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  },

  getVisitorList(req, res) {
    try {
      const visitors = VisitorModel.getAll();
      res.json({
        success: true,
        data: visitors,
        pagination: {
          total: visitors.length
        }
      });
    } catch (err) {
      console.error('❌ 获取访客列表失败:', err);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  },

  getVisitorStats(req, res) {
    try {
      const totalCount = VisitorModel.getTotalCount();
      const visitors = VisitorModel.getAll();
      
      const today = getShanghaiTime().substring(0, 10);
      const todayVisits = visitors.filter(v => 
        v.last_visit_at && v.last_visit_at.startsWith(today)
      ).length;
      
      res.json({
        success: true,
        data: {
          total_visitors: totalCount,
          today_visits: todayVisits,
          total_visits: visitors.reduce((sum, v) => sum + v.visit_count, 0)
        }
      });
    } catch (err) {
      console.error('❌ 获取访客统计失败:', err);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  },

  getCurrentVisitor(req, res) {
    try {
      const ip = req.realIp;
      const visitor = VisitorModel.findByIp(ip);
      
      if (visitor) {
        res.json({
          success: true,
          data: VisitorModel.formatVisitor(visitor)
        });
      } else {
        res.json({
          success: true,
          data: null,
          message: '首次访问'
        });
      }
    } catch (err) {
      console.error('❌ 获取当前访客失败:', err);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }
};

// ===================== API 路由 =====================

// ===================== 认证相关API =====================

// 初始化管理员账户
app.post('/api/auth/init-admin', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }
    
    // 检查是否已存在管理员
    const existingAdmin = db.exec('SELECT id FROM admin_users WHERE username = ?', [username]);
    if (existingAdmin.length > 0 && existingAdmin[0].values.length > 0) {
      return res.status(400).json({
        success: false,
        error: '该用户名已存在'
      });
    }
    
    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = getShanghaiTime();
    
    // 创建管理员账户
    db.run(
      'INSERT INTO admin_users (username, password, role, created_at) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, 'admin', now]
    );
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    saveDB();
    
    res.json({
      success: true,
      message: '管理员账户创建成功',
      data: { id, username, role: 'admin' }
    });
  } catch (err) {
    console.error('创建管理员账户失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 管理员登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }
    
    const result = db.exec('SELECT * FROM admin_users WHERE username = ?', [username]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    const admin = queryToObject(result);
    
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    const now = getShanghaiTime();
    
    db.run('UPDATE admin_users SET last_login = ? WHERE id = ?', [now, admin.id]);
    
    setImmediate(() => {
      try {
        saveDB();
      } catch (e) {
        console.error('保存数据库失败:', e);
      }
    });
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
          last_login: now
        }
      }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 验证令牌
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// 修改用户名
app.post('/api/admin/update-username', authenticateAdmin, (req, res) => {
  try {
    const { newUsername, currentPassword } = req.body;
    const userId = req.user.id;
    
    if (!newUsername || !currentPassword) {
      return res.status(400).json({
        success: false,
        error: '新用户名和当前密码不能为空'
      });
    }
    
    const result = db.exec('SELECT * FROM admin_users WHERE id = ?', [userId]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    const admin = queryToObject(result);
    const isPasswordValid = bcrypt.compareSync(currentPassword, admin.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '当前密码错误'
      });
    }
    
    db.run('UPDATE admin_users SET username = ? WHERE id = ?', [newUsername, userId]);
    saveDB();
    
    res.json({
      success: true,
      message: '用户名修改成功'
    });
  } catch (err) {
    console.error('修改用户名失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 修改密码
app.post('/api/admin/update-password', authenticateAdmin, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '当前密码和新密码不能为空'
      });
    }
    
    const result = db.exec('SELECT * FROM admin_users WHERE id = ?', [userId]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    const admin = queryToObject(result);
    const isPasswordValid = bcrypt.compareSync(currentPassword, admin.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '当前密码错误'
      });
    }
    
    const hashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
    db.run('UPDATE admin_users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    saveDB();
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (err) {
    console.error('修改密码失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 管理员登出
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // 在实际应用中，这里可以将令牌加入黑名单
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  try {
    const result = db.exec('SELECT 1 AS health_check');
    if (result.length > 0 && result[0].values.length > 0) {
      res.json({
        success: true,
        status: 'ok',
        message: '服务运行正常',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        status: 'error',
        message: '数据库连接异常',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('健康检查失败:', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: '健康检查失败',
      database: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// 初始化测试数据
app.post('/api/init-data', authenticateAdmin, (req, res) => {
  try {
    // 插入测试分类
    const categories = [
      { name: '后端技术', slug: 'backend', description: '后端开发相关技术文章' },
      { name: '前端技术', slug: 'frontend', description: '前端开发相关技术文章' },
      { name: 'DevOps', slug: 'devops', description: '运维与部署相关' },
      { name: '数据库', slug: 'database', description: '数据库相关技术' }
    ];
    
    categories.forEach(cat => {
      db.run(`INSERT OR IGNORE INTO categories (name, slug, description, count, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`,
        [cat.name, cat.slug, cat.description, getShanghaiTime(), getShanghaiTime()]);
    });
    
    // 插入测试标签
    const tagColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const tagNames = ['Vue3', 'TypeScript', 'Node.js', 'Python', 'Docker', '数据库', '算法', '性能优化'];
    
    tagNames.forEach((tag, i) => {
      const slug = tag.toLowerCase().replace(/\s+/g, '-');
      db.run(`INSERT OR IGNORE INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`,
        [tag, slug, tagColors[i % tagColors.length], getShanghaiTime(), getShanghaiTime()]);
    });
    
    // 插入测试文章
    const testPosts = [
      { title: 'Vue 3 Composition API 实战指南', content: 'Vue 3 引入了全新的 Composition API...', category: '前端技术', tags: ['Vue3', 'TypeScript'] },
      { title: 'Node.js 性能优化技巧', content: '本文介绍如何优化 Node.js 应用的性能...', category: '后端技术', tags: ['Node.js', '性能优化'] },
      { title: 'Docker 容器化部署实战', content: 'Docker 是现代应用部署的重要工具...', category: 'DevOps', tags: ['Docker', 'Node.js'] }
    ];
    
    testPosts.forEach(post => {
      const tagResult = db.exec(`SELECT id FROM tags WHERE name IN (${post.tags.map(() => '?').join(',')})`, post.tags);
      const tagIds = tagResult.length > 0 ? tagResult[0].values.map(v => v[0]) : [];
      
      const result = db.exec(`SELECT id FROM categories WHERE name = ?`, [post.category]);
      const categoryId = result.length > 0 ? result[0].values[0][0] : null;
      
      db.run(`INSERT INTO posts (title, content, category, views, likes, favorites, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [post.title, post.content, post.category, Math.floor(Math.random() * 500), Math.floor(Math.random() * 100), Math.floor(Math.random() * 50), 'published', getShanghaiTime(), getShanghaiTime()]);
      
      const postResult = db.exec('SELECT last_insert_rowid() as id');
      const postId = postResult[0].values[0][0];
      
      tagIds.forEach(tagId => {
        db.run(`INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`, [postId, tagId]);
      });
    });
    
    saveDB();
    res.json({ success: true, message: '测试数据初始化成功' });
  } catch (err) {
    console.error('初始化数据失败:', err);
    res.status(500).json({ success: false, error: '初始化失败' });
  }
});

// 获取文章列表
app.get('/api/posts', (req, res) => {
  try {
    const category = req.query.category;
    const tag = req.query.tag;
    const columnId = req.query.column_id;
    const search = req.query.search;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    let whereClauses = [];
    let params = [];
    
    whereClauses.push('status = ?');
    params.push('published');
    
    if (category) {
      whereClauses.push('category = ?');
      params.push(category);
    }
    if (tag) {
      whereClauses.push('tags LIKE ?');
      params.push(`%${tag}%`);
    }
    if (columnId) {
      whereClauses.push('column_id = ?');
      params.push(columnId);
    }
    if (search) {
      whereClauses.push('(title LIKE ? OR content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    let sql = 'SELECT * FROM posts';
    let countSql = 'SELECT COUNT(*) as total FROM posts';
    
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
      countSql += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    
    const result = db.exec(sql, params);
    const countResult = db.exec(countSql, params.slice(0, -2));
    
    const posts = queryToArray(result);
    const total = countResult.length > 0 && countResult[0].values.length > 0 
      ? countResult[0].values[0][0] 
      : 0;
    
    const postsWithCommentCount = posts.map(post => {
      const commentCountResult = db.exec(
        'SELECT COUNT(*) as count FROM comments WHERE post_id = ?',
        [post.id]
      );
      const commentCount = commentCountResult[0].values[0][0];
      let tagNames = [];
      try {
        tagNames = JSON.parse(post.tags || '[]');
      } catch {
        tagNames = [];
      }
      return {
        ...post,
        comments_count: commentCount,
        tagNames
      };
    });
    
    res.json({
      success: true,
      data: {
        records: postsWithCommentCount,
        total,
        page,
        pageSize
      }
    });
  } catch (err) {
    console.error('获取文章列表失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 文章归档 API =====================

/**
 * 获取文章归档（按年月分组）
 * 核心逻辑搬运自 FeiTwnd-Website Backend ArticleServiceImpl.getArchive()
 */
app.get('/api/posts/archive', (req, res) => {
  try {
    // 查询所有已发布文章（参考：FeiTwnd getArchiveList）
    const result = db.exec(`
      SELECT 
        id, 
        title, 
        slug,
        content,
        category,
        likes as like_count,
        views as view_count,
        created_at as publish_time
      FROM posts 
      ORDER BY created_at DESC
    `);
    
    const allPosts = queryToArray(result);
    
    // 按年月分组（参考：FeiTwnd ArticleServiceImpl.getArchive()）
    const archiveMap = {};
    
    allPosts.forEach(post => {
      if (!post.publish_time) {
        return;
      }
      
      const date = new Date(post.publish_time);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;
      
      if (!archiveMap[key]) {
        archiveMap[key] = {
          year: year,
          month: month,
          articles: []
        };
      }
      
      // 添加文章到对应月份
      archiveMap[key].articles.push({
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content ? post.content.substring(0, 200) + '...' : '',
        category: post.category,
        like_count: post.like_count || 0,
        view_count: post.view_count || 0,
        publish_time: post.publish_time,
        publish_day: date.getDate()
      });
    });
    
    // 转换为数组并按年月排序（最新的在前面）
    const archiveList = Object.values(archiveMap)
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });
    
    res.json({
      success: true,
      data: archiveList
    });
  } catch (err) {
    console.error('获取文章归档失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 获取单篇文章
app.get('/api/posts/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = db.exec('SELECT * FROM posts WHERE id = ?', [id]);
    const post = queryToObject(result);
    
    if (!post) {
      res.status(404).json({ success: false, error: '文章不存在' });
    } else {
      let tagNames = [];
      try {
        tagNames = JSON.parse(post.tags || '[]');
      } catch {
        tagNames = [];
      }
      res.json({ success: true, data: { ...post, tagNames } });
    }
  } catch (err) {
    console.error('获取文章详情失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 创建文章
app.post('/api/posts', contentModeration, (req, res) => {
  try {
    const { title, content, summary, category, tags, status, column_id, column_order } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        error: '标题、内容和分类不能为空'
      });
    }
    
    const now = getShanghaiTime();
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : '[]');
    
    db.run(
      'INSERT INTO posts (title, content, summary, category, tags, status, column_id, column_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, content, summary || '', category, tagsJson, status || 'published', column_id || null, column_order || 0, now, now]
    );
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    saveDB();
    
    res.json({
      success: true,
      data: { id, title, content, summary, category, tags, status, column_id, column_order, created_at: now }
    });
  } catch (err) {
    console.error('创建文章失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 更新文章
app.put('/api/posts/:id', contentModeration, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, summary, category, tags, status } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, error: '标题、内容和分类不能为空' });
    }
    
    const now = getShanghaiTime();
    
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : '[]');
    
    db.run(
      'UPDATE posts SET title = ?, content = ?, summary = ?, category = ?, tags = ?, status = ?, updated_at = ? WHERE id = ?',
      [title, content, summary || '', category, tagsJson, status || 'published', now, id]
    );
    
    saveDB();
    res.json({ success: true, message: '文章更新成功' });
  } catch (err) {
    console.error('更新文章失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 删除文章
app.delete('/api/posts/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.run('DELETE FROM posts WHERE id = ?', [id]);
    saveDB();
    res.json({ success: true, message: '文章删除成功' });
  } catch (err) {
    console.error('删除文章失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 点赞文章
app.post('/api/posts/:id/like', (req, res) => {
  try {
    const { id } = req.params;
    db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [id]);
    saveDB();
    
    const result = db.exec('SELECT likes FROM posts WHERE id = ?', [id]);
    const likes = result[0].values[0][0];
    
    res.json({ success: true, data: { likes } });
  } catch (err) {
    console.error('点赞失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 收藏文章
app.post('/api/posts/:id/favorite', (req, res) => {
  try {
    const { id } = req.params;
    db.run('UPDATE posts SET favorites = favorites + 1 WHERE id = ?', [id]);
    saveDB();
    
    const result = db.exec('SELECT favorites FROM posts WHERE id = ?', [id]);
    const favorites = result[0].values[0][0];
    
    res.json({ success: true, data: { favorites } });
  } catch (err) {
    console.error('收藏失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 增加浏览量
app.post('/api/posts/:id/view', (req, res) => {
  try {
    const { id } = req.params;
    db.run('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);
    saveDB();
    
    const result = db.exec('SELECT views FROM posts WHERE id = ?', [id]);
    const views = result[0].values[0][0];
    
    res.json({ success: true, data: { views } });
  } catch (err) {
    console.error('增加浏览量失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 专栏 API =====================

// 获取所有专栏
app.get('/api/columns', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM columns ORDER BY created_at DESC');
    res.json({
      success: true,
      data: queryToArray(result)
    });
  } catch (err) {
    console.error('获取专栏列表失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 获取专栏详情及文章
app.get('/api/columns/:id', (req, res) => {
  try {
    const { id } = req.params;
    const columnResult = db.exec('SELECT * FROM columns WHERE id = ?', [id]);
    const column = queryToObject(columnResult);
    
    if (!column) {
      return res.status(404).json({ success: false, error: '专栏不存在' });
    }
    
    const postsResult = db.exec(
      'SELECT * FROM posts WHERE column_id = ? ORDER BY column_order ASC, created_at DESC',
      [id]
    );
    const posts = queryToArray(postsResult);
    
    res.json({
      success: true,
      data: {
        ...column,
        posts
      }
    });
  } catch (err) {
    console.error('获取专栏详情失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 创建专栏
app.post('/api/columns', contentModeration, (req, res) => {
  try {
    const { name, description, cover_image, author_id } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '专栏名称不能为空'
      });
    }
    
    const now = getShanghaiTime();
    db.run(
      'INSERT INTO columns (name, description, cover_image, author_id, created_at) VALUES (?, ?, ?, ?, ?)',
      [name, description, cover_image, author_id, now]
    );
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    saveDB();
    
    res.json({
      success: true,
      data: { id, name, description, cover_image, author_id, created_at: now }
    });
  } catch (err) {
    console.error('创建专栏失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 留言 API =====================

// 获取留言列表
app.get('/api/messages', (req, res) => {
  try {
    const rootResult = db.exec(
      'SELECT * FROM messages WHERE parent_id IS NULL ORDER BY created_at DESC'
    );
    const rootMessages = queryToArray(rootResult);
    
    const resultWithChildren = rootMessages.map(msg => {
      const childrenResult = db.exec(
        'SELECT m1.*, m2.nickname AS reply_name FROM messages m1 LEFT JOIN messages m2 ON m1.parent_id = m2.id WHERE m1.parent_id = ? ORDER BY m1.created_at ASC',
        [msg.id]
      );
      const children = queryToArray(childrenResult);
      return {
        ...msg,
        children: children
      };
    });
    
    res.json({
      success: true,
      data: resultWithChildren
    });
  } catch (err) {
    console.error('获取留言列表失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 获取留言详情（包含回复）
app.get('/api/messages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const msgResult = db.exec('SELECT * FROM messages WHERE id = ?', [id]);
    const message = queryToObject(msgResult);
    
    if (!message) {
      return res.status(404).json({ success: false, error: '留言不存在' });
    }
    
    // 获取回复
    const repliesResult = db.exec(
      'SELECT * FROM messages WHERE parent_id = ? ORDER BY created_at ASC',
      [id]
    );
    const replies = queryToArray(repliesResult);
    
    res.json({
      success: true,
      data: {
        ...message,
        replies
      }
    });
  } catch (err) {
    console.error('获取留言详情失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 创建留言
app.post('/api/messages', contentModeration, (req, res) => {
  try {
    const { 
      nickname, 
      content, 
      parent_id, 
      root_id, 
      avatar,
      emailOrQq,
      isSecret,
      isNotice,
      isMarkdown,
      parentNickname
    } = req.body;
    
    if (!nickname || !content) {
      return res.status(400).json({
        success: false,
        error: '昵称和内容不能为空'
      });
    }
    
    const now = getShanghaiTime();
    const finalRootId = root_id || parent_id || null;
    
    db.run(
      'INSERT INTO messages (nickname, content, parent_id, root_id, avatar, email_or_qq, is_secret, is_notice, is_markdown, is_approved, parent_nickname, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nickname, 
        content, 
        parent_id || null, 
        finalRootId, 
        avatar || null,
        emailOrQq || null,
        isSecret || 0,
        isNotice !== undefined ? isNotice : 1,
        isMarkdown !== undefined ? isMarkdown : 1,
        1,
        parentNickname || null,
        now
      ]
    );
    
    if (parent_id) {
      db.run('UPDATE messages SET reply_count = reply_count + 1 WHERE id = ?', [parent_id]);
    }
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    saveDB();
    
    res.json({
      success: true,
      data: {
        id,
        nickname,
        content,
        parent_id: parent_id || null,
        root_id: finalRootId,
        avatar,
        emailOrQq,
        isSecret: isSecret || 0,
        isNotice: isNotice !== undefined ? isNotice : 1,
        isMarkdown: isMarkdown !== undefined ? isMarkdown : 1,
        isApproved: 1,
        parentNickname,
        reply_count: 0,
        likes_count: 0,
        created_at: now
      }
    });
  } catch (err) {
    console.error('创建留言失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 点赞留言
app.post('/api/messages/:id/like', (req, res) => {
  try {
    const { id } = req.params;
    db.run('UPDATE messages SET likes_count = likes_count + 1 WHERE id = ?', [id]);
    saveDB();
    
    const result = db.exec('SELECT likes_count FROM messages WHERE id = ?', [id]);
    const likes_count = result[0].values[0][0];
    
    res.json({ success: true, data: { likes_count } });
  } catch (err) {
    console.error('点赞留言失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 删除留言
app.delete('/api/messages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const message = queryToObject(db.exec('SELECT * FROM messages WHERE id = ?', [id]));
    
    if (!message) {
      return res.status(404).json({ success: false, error: '留言不存在' });
    }
    
    // 如果是回复，更新父留言的回复数
    if (message.parent_id) {
      db.run('UPDATE messages SET reply_count = reply_count - 1 WHERE id = ?', [message.parent_id]);
    }
    
    // 删除回复
    db.run('DELETE FROM messages WHERE parent_id = ?', [id]);
    // 删除留言
    db.run('DELETE FROM messages WHERE id = ?', [id]);
    
    saveDB();
    res.json({ success: true, message: '留言删除成功' });
  } catch (err) {
    console.error('删除留言失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== AI 智能问答 API =====================

app.post('/api/ai/ask', (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, error: '请输入问题' });
    }
    
    const aiResponses = {
      default: {
        answer: `您提出了一个非常有深度的问题。基于当前技术领域的最佳实践，${question} 需要从以下几个维度进行分析：\n\n1. **理论基础**：深入理解相关概念的核心原理是解决问题的关键。\n\n2. **实践应用**：结合实际场景，选择合适的技术方案和工具。\n\n3. **性能优化**：考虑系统的可扩展性、高并发处理能力和容错机制。\n\n4. **安全考量**：确保数据安全和系统稳定性是重中之重。\n\n如果您需要更具体的解答，请提供更多上下文信息，我将为您进行深入分析。`,
        sources: ['专业知识库', '行业最佳实践', '技术文档']
      },
      rabbitmq: {
        answer: `关于 RabbitMQ 的优化方案，${question} 的核心要点包括：\n\n**批量发送优化**：\n- 使用批量发布（Batch Publish）减少网络开销\n- 设置合理的 prefetchCount 平衡消费速度\n- 开启 publisher confirms 保证消息可靠性\n\n**异步发送模式**：\n- 采用异步发送避免阻塞主线程\n- 使用 Channel 复用减少连接开销\n- 实现消息持久化确保数据不丢失\n\n**性能调优建议**：\n- 合理设置队列大小和消息 TTL\n- 使用镜像队列提高可用性\n- 定期监控队列状态和消息堆积情况`,
        sources: ['RabbitMQ 官方文档', '企业级消息队列实践', '分布式系统架构']
      }
    };
    
    let responseKey = 'default';
    if (question.toLowerCase().includes('rabbitmq') || question.includes('消息队列')) {
      responseKey = 'rabbitmq';
    }
    
    const aiResponse = aiResponses[responseKey];
    
    res.json({
      success: true,
      data: {
        question,
        answer: aiResponse.answer,
        sources: aiResponse.sources,
        responseTime: Math.floor(Math.random() * 1000) + 500
      },
      message: 'AI回答生成成功'
    });
  } catch (err) {
    console.error('AI回答生成失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/ai/questions', (req, res) => {
  try {
    const category = req.query.category || 'default';
    
    const questions = {
      default: [
        '如何优化数据库查询性能？',
        '如何实现高可用架构设计？',
        '前端性能优化有哪些最佳实践？'
      ],
      rabbitmq: [
        '如何通过批量发送和异步发送优化性能？',
        'RabbitMQ 如何保证消息不丢失？',
        '如何处理消息消费的重复问题？'
      ]
    };
    
    res.json({
      success: true,
      data: questions[category] || questions.default
    });
  } catch (err) {
    console.error('获取推荐问题失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 作者 API =====================

app.get('/api/authors/me', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM authors WHERE verified = 1 LIMIT 1');
    const author = queryToObject(result);
    
    if (!author) {
      return res.status(404).json({ success: false, error: '作者不存在' });
    }
    
    // 计算码龄
    const registrationDate = new Date(author.registration_date);
    const now = new Date();
    const yearsDiff = now.getFullYear() - registrationDate.getFullYear();
    const monthsDiff = now.getMonth() - registrationDate.getMonth();
    let codeAge = yearsDiff;
    if (monthsDiff < 0 || (monthsDiff === 0 && now.getDate() < registrationDate.getDate())) {
      codeAge--;
    }
    
    res.json({
      success: true,
      data: {
        ...author,
        code_age: codeAge
      }
    });
  } catch (err) {
    console.error('获取作者信息失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 更新博主信息
app.put('/api/authors/me', authenticateAdmin, (req, res) => {
  try {
    const { nickname, bio, avatar } = req.body;
    
    const now = getShanghaiTime();
    db.run(`UPDATE authors SET 
      nickname = COALESCE(?, nickname),
      bio = COALESCE(?, bio),
      avatar = COALESCE(?, avatar),
      updated_at = ?
    WHERE verified = 1`, [nickname, bio, avatar, now]);
    
    saveDB();
    
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    console.error('更新作者信息失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/authors/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.exec('SELECT * FROM authors WHERE id = ?', [id]);
    const author = queryToObject(result);
    
    if (!author) {
      return res.status(404).json({ success: false, error: '作者不存在' });
    }
    
    const registrationDate = new Date(author.registration_date);
    const now = new Date();
    const yearsDiff = now.getFullYear() - registrationDate.getFullYear();
    let codeAge = yearsDiff;
    if (now.getMonth() < registrationDate.getMonth() || 
        (now.getMonth() === registrationDate.getMonth() && now.getDate() < registrationDate.getDate())) {
      codeAge--;
    }
    
    res.json({
      success: true,
      data: {
        ...author,
        code_age: codeAge
      }
    });
  } catch (err) {
    console.error('获取作者信息失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 访客记录 API 路由 =====================

app.post('/api/visitors/visit', getRealIp, (req, res) => {
  VisitorController.recordVisit(req, res);
});

app.get('/api/visitors', (req, res) => {
  VisitorController.getVisitorList(req, res);
});

app.get('/api/visitors/stats', (req, res) => {
  VisitorController.getVisitorStats(req, res);
});

app.get('/api/visitors/current', getRealIp, (req, res) => {
  VisitorController.getCurrentVisitor(req, res);
});

// ===================== 评论 API =====================

// 获取文章的所有评论
app.get('/api/posts/:postId/comments', (req, res) => {
  try {
    const { postId } = req.params;
    const result = db.exec(
      'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC',
      [postId]
    );
    const comments = queryToArray(result);
    
    res.json({
      success: true,
      data: comments
    });
  } catch (err) {
    console.error('获取评论列表失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 创建评论
app.post('/api/posts/:postId/comments', contentModeration, (req, res) => {
  try {
    const { postId } = req.params;
    const { nickname, content, parent_id, avatar, user_id } = req.body;
    
    if (!nickname || !content) {
      return res.status(400).json({
        success: false,
        error: '昵称和评论内容不能为空'
      });
    }
    
    const now = getShanghaiTime();
    db.run(
      'INSERT INTO comments (post_id, user_id, nickname, content, parent_id, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [postId, user_id || null, nickname, content, parent_id || null, avatar || null, now]
    );
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    saveDB();
    
    res.json({
      success: true,
      data: {
        id,
        post_id: parseInt(postId),
        user_id,
        nickname,
        content,
        parent_id: parent_id || null,
        avatar,
        likes_count: 0,
        created_at: now
      }
    });
  } catch (err) {
    console.error('创建评论失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 点赞评论
app.post('/api/comments/:id/like', (req, res) => {
  try {
    const { id } = req.params;
    db.run('UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?', [id]);
    saveDB();
    
    const result = db.exec('SELECT likes_count FROM comments WHERE id = ?', [id]);
    const likes_count = result[0].values[0][0];
    
    res.json({ success: true, data: { likes_count } });
  } catch (err) {
    console.error('点赞评论失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 删除评论
app.delete('/api/comments/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.run('DELETE FROM comments WHERE id = ?', [id]);
    saveDB();
    res.json({ success: true, message: '评论删除成功' });
  } catch (err) {
    console.error('删除评论失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 获取文章的评论数
app.get('/api/posts/:postId/comments/count', (req, res) => {
  try {
    const { postId } = req.params;
    const result = db.exec(
      'SELECT COUNT(*) as count FROM comments WHERE post_id = ?',
      [postId]
    );
    const count = result[0].values[0][0];
    
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('获取评论数失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 文章点赞 API（基于IP防重复） =====================

// 点赞文章（基于IP）
app.post('/api/posts/:id/like', getRealIp, (req, res) => {
  try {
    const { id } = req.params;
    const ip = req.realIp;
    
    // 检查是否已经点赞
    const likeCheck = db.exec(
      'SELECT id FROM likes WHERE post_id = ? AND visitor_ip = ?',
      [id, ip]
    );
    
    if (likeCheck.length > 0 && likeCheck[0].values.length > 0) {
      return res.status(400).json({
        success: false,
        error: '您已经点赞过这篇文章了'
      });
    }
    
    // 添加点赞记录
    const now = getShanghaiTime();
    db.run(
      'INSERT INTO likes (post_id, visitor_ip, created_at) VALUES (?, ?, ?)',
      [id, ip, now]
    );
    
    // 更新文章点赞数
    db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [id]);
    
    saveDB();
    
    // 获取最新的点赞数
    const result = db.exec('SELECT likes FROM posts WHERE id = ?', [id]);
    const likes = result[0].values[0][0];
    
    res.json({
      success: true,
      data: { likes },
      message: '点赞成功'
    });
  } catch (err) {
    console.error('点赞文章失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 取消点赞
app.delete('/api/posts/:id/like', getRealIp, (req, res) => {
  try {
    const { id } = req.params;
    const ip = req.realIp;
    
    // 检查是否存在点赞记录
    const likeCheck = db.exec(
      'SELECT id FROM likes WHERE post_id = ? AND visitor_ip = ?',
      [id, ip]
    );
    
    if (likeCheck.length === 0 || likeCheck[0].values.length === 0) {
      return res.status(400).json({
        success: false,
        error: '您还没有点赞过这篇文章'
      });
    }
    
    // 删除点赞记录
    db.run('DELETE FROM likes WHERE post_id = ? AND visitor_ip = ?', [id, ip]);
    
    // 减少文章点赞数
    db.run('UPDATE posts SET likes = likes - 1 WHERE id = ?', [id]);
    
    saveDB();
    
    const result = db.exec('SELECT likes FROM posts WHERE id = ?', [id]);
    const likes = result[0].values[0][0];
    
    res.json({
      success: true,
      data: { likes },
      message: '取消点赞成功'
    });
  } catch (err) {
    console.error('取消点赞失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 检查当前用户是否点赞
app.get('/api/posts/:id/like/status', getRealIp, (req, res) => {
  try {
    const { id } = req.params;
    const ip = req.realIp;
    
    const likeCheck = db.exec(
      'SELECT id FROM likes WHERE post_id = ? AND visitor_ip = ?',
      [id, ip]
    );
    
    const liked = likeCheck.length > 0 && likeCheck[0].values.length > 0;
    
    res.json({
      success: true,
      data: { liked }
    });
  } catch (err) {
    console.error('检查点赞状态失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 猜你喜欢推荐接口 =====================

app.get('/api/articles/recommend', (req, res) => {
  try {
    const { id } = req.query; // 当前文章ID
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: '请提供当前文章ID'
      });
    }
    
    // 获取当前文章
    const currentPostResult = db.exec('SELECT * FROM posts WHERE id = ?', [id]);
    const currentPost = queryToObject(currentPostResult);
    
    if (!currentPost) {
      return res.status(404).json({
        success: false,
        error: '文章不存在'
      });
    }
    
    // 解析当前文章的标签
    let currentTags = [];
    try {
      currentTags = JSON.parse(currentPost.tags || '[]');
    } catch (e) {
      currentTags = [];
    }
    
    // 获取所有其他文章
    const allPostsResult = db.exec('SELECT * FROM posts WHERE id != ?', [id]);
    let allPosts = queryToArray(allPostsResult);
    
    let recommendations = [];
    
    // 策略1：优先推荐有相同标签的文章
    if (currentTags.length > 0) {
      recommendations = allPosts.filter(post => {
        try {
          const postTags = JSON.parse(post.tags || '[]');
          return currentTags.some(tag => postTags.includes(tag));
        } catch (e) {
          return false;
        }
      });
      
      // 如果找到了同标签文章，按浏览量排序
      if (recommendations.length > 0) {
        recommendations.sort((a, b) => b.views - a.views);
        recommendations = recommendations.slice(0, 4);
      }
    }
    
    // 策略2：如果没有同标签文章，按热度排序
    if (recommendations.length === 0) {
      // 计算每篇文章的热度：浏览量*1 + 点赞数*5 + 评论数*10
      recommendations = allPosts.map(post => {
        // 获取评论数
        const commentCountResult = db.exec(
          'SELECT COUNT(*) as count FROM comments WHERE post_id = ?',
          [post.id]
        );
        const commentCount = commentCountResult[0].values[0][0];
        
        // 计算热度
        const hotScore = (post.views || 0) * 1 + (post.likes || 0) * 5 + commentCount * 10;
        
        return {
          ...post,
          comment_count: commentCount,
          hot_score: hotScore
        };
      });
      
      // 按热度从高到低排序
      recommendations.sort((a, b) => b.hot_score - a.hot_score);
      recommendations = recommendations.slice(0, 4);
    }
    
    // 格式化返回数据
    const formattedRecommendations = recommendations.map(post => ({
      id: post.id,
      title: post.title,
      category: post.category,
      tags: post.tags ? JSON.parse(post.tags) : [],
      views: post.views,
      likes: post.likes,
      comment_count: post.comment_count || 0,
      hot_score: post.hot_score || 0,
      created_at: post.created_at
    }));
    
    res.json({
      success: true,
      data: formattedRecommendations
    });
  } catch (err) {
    console.error('获取推荐失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 友链 API =====================

app.get('/api/links', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM links WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC');
    res.json({
      success: true,
      data: queryToArray(result)
    });
  } catch (err) {
    console.error('获取友链列表失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/links/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.exec('SELECT * FROM links WHERE id = ?', [id]);
    const link = queryToObject(result);
    
    if (!link) {
      return res.status(404).json({ success: false, error: '友链不存在' });
    }
    
    res.json({ success: true, data: link });
  } catch (err) {
    console.error('获取友链详情失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.post('/api/links', authenticateAdmin, (req, res) => {
  try {
    const { name, url, description, avatar_url, sort_order } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: '名称和URL不能为空'
      });
    }
    
    const now = getShanghaiTime();
    db.run(
      'INSERT INTO links (name, url, description, avatar_url, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      [name, url, description || '', avatar_url || '', sort_order || 0, now, now]
    );
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    saveDB();
    
    res.json({
      success: true,
      data: { id, name, url, description, avatar_url, sort_order, is_active: 1, created_at: now, updated_at: now },
      message: '友链添加成功'
    });
  } catch (err) {
    console.error('添加友链失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.put('/api/links/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, description, avatar_url, sort_order, is_active } = req.body;
    
    const now = getShanghaiTime();
    db.run(
      'UPDATE links SET name = ?, url = ?, description = ?, avatar_url = ?, sort_order = ?, is_active = ?, updated_at = ? WHERE id = ?',
      [name, url, description || '', avatar_url || '', sort_order || 0, is_active !== undefined ? is_active : 1, now, id]
    );
    
    saveDB();
    res.json({ success: true, message: '友链更新成功' });
  } catch (err) {
    console.error('更新友链失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.delete('/api/links/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.run('DELETE FROM links WHERE id = ?', [id]);
    saveDB();
    res.json({ success: true, message: '友链删除成功' });
  } catch (err) {
    console.error('删除友链失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 标签 API =====================

app.get('/api/tags', (req, res) => {
  try {
    const result = db.exec(`
      SELECT t.id, t.name, t.slug, t.color, 
             COALESCE(pt.count, 0) as articleCount
      FROM tags t
      LEFT JOIN (
        SELECT tag_id, COUNT(*) as count FROM post_tags GROUP BY tag_id
      ) pt ON t.id = pt.tag_id
      ORDER BY pt.count DESC, t.name ASC
    `);
    const tags = queryToArray(result);
    
    tags.forEach(tag => {
      if (!tag.color) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
                        '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF8C00',
                        '#9370DB', '#00FA9A', '#FFD700', '#FF4500', '#20B2AA'];
        let hash = 0;
        for (let i = 0; i < tag.name.length; i++) {
          hash = tag.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        tag.color = colors[Math.abs(hash) % colors.length];
      }
    });
    
    res.json({
      success: true,
      data: tags
    });
  } catch (err) {
    console.error('获取标签列表失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 分类 API =====================

app.get('/api/categories', (req, res) => {
  try {
    const result = db.exec(`
      SELECT c.id, c.name, c.slug, c.description,
             COALESCE(p.count, 0) as articleCount
      FROM categories c
      LEFT JOIN (
        SELECT category, COUNT(*) as count FROM posts GROUP BY category
      ) p ON c.name = p.category
      ORDER BY p.count DESC, c.name ASC
    `);
    res.json({
      success: true,
      data: queryToArray(result)
    });
  } catch (err) {
    console.error('获取分类列表失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.post('/api/categories', authenticateAdmin, (req, res) => {
  try {
    const { name, slug, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '分类名称不能为空'
      });
    }
    
    const catSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const now = getShanghaiTime();
    db.run(
      'INSERT INTO categories (name, slug, description, article_count, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
      [name, catSlug, description || '', now, now]
    );
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    saveDB();
    
    res.json({
      success: true,
      data: { id, name, slug: catSlug, description: description || '', article_count: 0, created_at: now, updated_at: now },
      message: '分类添加成功'
    });
  } catch (err) {
    console.error('添加分类失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/categories/:slug/posts', (req, res) => {
  try {
    const { slug } = req.params;
    const categoryResult = db.exec('SELECT name FROM categories WHERE slug = ?', [slug]);
    if (categoryResult.length === 0 || categoryResult[0].values.length === 0) {
      return res.status(404).json({ success: false, error: '分类不存在' });
    }
    const categoryName = categoryResult[0].values[0][0];
    
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    const result = db.exec(`
      SELECT * FROM posts WHERE category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `, [categoryName, pageSize, offset]);
    
    const countResult = db.exec('SELECT COUNT(*) as total FROM posts WHERE category = ?', [categoryName]);
    const total = countResult[0].values[0][0];
    
    res.json({
      success: true,
      data: {
        records: queryToArray(result),
        total,
        page,
        pageSize
      }
    });
  } catch (err) {
    console.error('获取分类文章失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/tags/:id/posts', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.exec(`
      SELECT p.* FROM posts p
      JOIN post_tags pt ON p.id = pt.post_id
      WHERE pt.tag_id = ?
      ORDER BY p.created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      data: queryToArray(result)
    });
  } catch (err) {
    console.error('获取标签文章失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.post('/api/tags', authenticateAdmin, (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '标签名称不能为空'
      });
    }
    
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const now = getShanghaiTime();
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
      [name, slug, color || '#6b7280', now, now]
    );
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    saveDB();
    
    res.json({
      success: true,
      data: { id, name, slug, color: color || '#6b7280', count: 0, created_at: now, updated_at: now },
      message: '标签添加成功'
    });
  } catch (err) {
    console.error('添加标签失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.put('/api/tags/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    
    const now = getShanghaiTime();
    db.run(
      'UPDATE tags SET name = ?, color = ?, updated_at = ? WHERE id = ?',
      [name, color || '#6b7280', now, id]
    );
    
    saveDB();
    res.json({ success: true, message: '标签更新成功' });
  } catch (err) {
    console.error('更新标签失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.delete('/api/tags/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.run('DELETE FROM post_tags WHERE tag_id = ?', [id]);
    db.run('DELETE FROM tags WHERE id = ?', [id]);
    saveDB();
    res.json({ success: true, message: '标签删除成功' });
  } catch (err) {
    console.error('删除标签失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 浏览记录 API =====================

app.post('/api/views/record', getRealIp, (req, res) => {
  try {
    const { pagePath, referer } = req.body;
    const ip = req.realIp;
    const userAgent = req.headers['user-agent'];
    const now = getShanghaiTime();
    
    let visitorId = null;
    const visitorResult = db.exec('SELECT id FROM visitors WHERE ip = ? ORDER BY last_visit_at DESC LIMIT 1', [ip]);
    if (visitorResult.length > 0 && visitorResult[0].values.length > 0) {
      visitorId = visitorResult[0].values[0][0];
    }
    
    db.run(
      'INSERT INTO views (visitor_id, page_path, referer, ip_address, user_agent, view_time) VALUES (?, ?, ?, ?, ?, ?)',
      [visitorId, pagePath || req.path, referer || '', ip, userAgent || '', now]
    );
    
    saveDB();
    
    res.json({
      success: true,
      message: '浏览记录已保存'
    });
  } catch (err) {
    console.error('记录浏览失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 统计 API =====================

app.get('/api/report', (req, res) => {
  try {
    const today = getShanghaiTime().substring(0, 10);
    
    const viewTotalCount = db.exec('SELECT COUNT(*) as count FROM views');
    const viewTodayCount = db.exec("SELECT COUNT(*) as count FROM views WHERE view_time LIKE ?", [`${today}%`]);
    
    const visitorTotalCount = db.exec('SELECT COUNT(*) as count FROM visitors');
    
    const categoryTotalCount = db.exec('SELECT COUNT(DISTINCT category) as count FROM posts');
    
    const tagTotalCount = db.exec('SELECT COUNT(*) as count FROM tags');
    
    const articleTotalCount = db.exec('SELECT COUNT(*) as count FROM posts');
    
    const onlineCount = db.exec("SELECT COUNT(*) as count FROM visitors WHERE online_status = 1");
    
    res.json({
      success: true,
      data: {
        viewTotalCount: viewTotalCount[0].values[0][0],
        viewTodayCount: viewTodayCount[0].values[0][0],
        visitorTotalCount: visitorTotalCount[0].values[0][0],
        categoryTotalCount: categoryTotalCount[0].values[0][0],
        tagTotalCount: tagTotalCount[0].values[0][0],
        articleTotalCount: articleTotalCount[0].values[0][0],
        onlineCount: onlineCount[0].values[0][0]
      }
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ===================== 默认数据初始化 =====================

function initDefaultData(db) {
  try {
    // 检查是否已初始化
    const postsCheck = db.exec('SELECT COUNT(*) as count FROM posts');
    if (postsCheck[0].values[0][0] > 0) {
      console.log('数据已存在，跳过初始化');
      return;
    }
    
    // 初始化作者（博主）
    db.run(
      'INSERT INTO authors (nickname, avatar, bio, registration_date, verified) VALUES (?, ?, ?, ?, ?)',
      ['博主', '', '热爱技术，分享知识', '2020-01-15 10:00:00', 1]
    );
    
    // 初始化专栏
    db.run(
      'INSERT INTO columns (name, description, author_id) VALUES (?, ?, ?)',
      ['RabbitMQ从入门到精通', '深入学习 RabbitMQ 消息队列技术，从基础概念到高级应用', 1]
    );
    
    db.run(
      'INSERT INTO columns (name, description, author_id) VALUES (?, ?, ?)',
      ['Vue 3 实战指南', '掌握 Vue 3 Composition API，构建现代化前端应用', 1]
    );
    
    // 初始化示例文章
    db.run(
      'INSERT INTO posts (title, content, category, tags, column_id, column_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['第一章：RabbitMQ 基础概念', 'RabbitMQ 是一个开源的消息代理软件，实现了高级消息队列协议（AMQP）。本章将介绍 RabbitMQ 的核心概念，包括生产者、消费者、队列、交换机和绑定等。\n\n## 核心概念\n\n### 1. 消息（Message）\n消息是 RabbitMQ 中数据的基本单位，由生产者发送，消费者接收。\n\n### 2. 队列（Queue）\n队列是消息的存储容器，消息会被持久化到队列中，直到被消费者消费。\n\n### 3. 交换机（Exchange）\n交换机负责接收生产者发送的消息，并根据路由规则将消息路由到对应的队列。', '后端技术', '["消息队列", "RabbitMQ", "AMQP"]', 1, 1, '2024-01-10 10:00:00']
    );
    
    db.run(
      'INSERT INTO posts (title, content, category, tags, column_id, column_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['第二章：RabbitMQ 安装与配置', '本章详细介绍如何在不同操作系统上安装和配置 RabbitMQ。\n\n## 安装步骤\n\n### Linux 安装\n```bash\nsudo apt-get update\nsudo apt-get install rabbitmq-server\n```\n\n### 启动服务\n```bash\nsudo systemctl start rabbitmq-server\nsudo systemctl enable rabbitmq-server\n```\n\n## 配置管理\n- 配置文件位置：/etc/rabbitmq/rabbitmq.conf\n- 默认端口：5672（AMQP）、15672（管理界面）', '后端技术', '["消息队列", "RabbitMQ", "安装配置"]', 1, 2, '2024-01-12 14:00:00']
    );
    
    db.run(
      'INSERT INTO posts (title, content, category, tags, column_id, column_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['第三章：RabbitMQ 高级特性', '本章探讨 RabbitMQ 的高级特性，包括消息持久化、消息确认、死信队列等。\n\n## 消息持久化\n确保消息在服务器重启后不丢失。\n\n## 消息确认机制\n生产者确认和消费者确认确保消息可靠传递。\n\n## 死信队列\n处理无法正常消费的消息，实现延迟队列功能。', '后端技术', '["消息队列", "RabbitMQ", "高级特性"]', 1, 3, '2024-01-15 09:00:00']
    );
    
    db.run(
      'INSERT INTO posts (title, content, category, tags, column_id, column_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Vue 3 Composition API 入门', 'Vue 3 引入了全新的 Composition API，提供更好的代码组织和复用能力。\n\n## ref 和 reactive\n\n```javascript\nimport { ref, reactive } from \'vue\'\n\nconst count = ref(0)\nconst state = reactive({ name: \'Alice\' })\n```\n\n## computed 和 watch\n计算属性和侦听器的使用方式。', '前端技术', '["Vue3", "Composition API", "前端框架"]', 2, 1, '2024-01-18 11:00:00']
    );
    
    db.run(
      'INSERT INTO posts (title, content, category, tags, created_at) VALUES (?, ?, ?, ?, ?)',
      ['Node.js 性能优化技巧', '本文分享 Node.js 性能优化的实用技巧。\n\n## 使用集群模式\n充分利用多核 CPU 资源。\n\n## 异步编程最佳实践\n避免阻塞事件循环。\n\n## 内存管理\n及时释放无用引用，避免内存泄漏。', '后端技术', '["Node.js", "性能优化", "后端开发"]', '2024-01-20 15:00:00']
    );
    
    // 初始化管理员账户（密码：123456）
    const hashedPassword = bcrypt.hashSync('123456', 10);
    db.run(
      'INSERT INTO admin_users (username, password, role, created_at) VALUES (?, ?, ?, ?)',
      ['admin', hashedPassword, 'admin', '2024-01-01 10:00:00']
    );
    
    // 初始化友链
    db.run(
      'INSERT INTO links (name, url, description, avatar_url, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      ['Vue.js 官方文档', 'https://vuejs.org/', 'Vue.js 渐进式 JavaScript 框架', '', 1, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO links (name, url, description, avatar_url, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      ['React 官方文档', 'https://react.dev/', 'React 是用于构建用户界面的 JavaScript 库', '', 2, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO links (name, url, description, avatar_url, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      ['Node.js 官方文档', 'https://nodejs.org/', 'Node.js 是基于 Chrome V8 引擎的 JavaScript 运行时', '', 3, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO links (name, url, description, avatar_url, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      ['GitHub', 'https://github.com/', '全球最大的开源代码托管平台', '', 4, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    
    // 初始化分类
    db.run(
      'INSERT INTO categories (name, slug, description, article_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['后端技术', 'backend', '后端开发相关技术文章', 4, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO categories (name, slug, description, article_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['前端技术', 'frontend', '前端开发相关技术文章', 1, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    
    // 初始化标签
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['Vue', 'vue', '#42b883', 2, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['Node.js', 'nodejs', '#339933', 2, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['消息队列', 'message-queue', '#8b5cf6', 3, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['RabbitMQ', 'rabbitmq', '#ff6b6b', 3, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['前端技术', 'frontend-tech', '#3b82f6', 1, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['后端技术', 'backend-tech', '#10b981', 4, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['AMQP', 'amqp', '#06b6d4', 1, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['安装配置', 'installation', '#f59e0b', 1, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['高级特性', 'advanced', '#ec4899', 1, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['Composition API', 'composition-api', '#8b5cf6', 1, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['前端框架', 'frontend-framework', '#3b82f6', 1, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['性能优化', 'performance', '#10b981', 1, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    db.run(
      'INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['后端开发', 'backend-development', '#0ea5e9', 1, '2024-01-01 10:00:00', '2024-01-01 10:00:00']
    );
    
    console.log('✅ 默认数据初始化完成');
  } catch (err) {
    console.warn('⚠️ 默认数据初始化失败（可能已初始化）:', err.message);
  }
}

function migratePostTags(db) {
  try {
    const postTagsCheck = db.exec('SELECT COUNT(*) as count FROM post_tags');
    if (postTagsCheck[0].values[0][0] > 0) {
      console.log('post_tags表已有数据，跳过迁移');
      return;
    }

    const posts = queryToArray(db.exec('SELECT id, tags FROM posts'));
    let migratedCount = 0;

    posts.forEach(post => {
      try {
        const tags = JSON.parse(post.tags || '[]');
        tags.forEach(tagName => {
          let tagId = null;
          const tagResult = db.exec('SELECT id FROM tags WHERE name = ?', [tagName]);
          
          if (tagResult.length > 0 && tagResult[0].values.length > 0) {
            tagId = tagResult[0].values[0][0];
          } else {
            const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            db.run('INSERT INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
              [tagName, slug, '#6b7280', getShanghaiTime(), getShanghaiTime()]);
            const result = db.exec('SELECT last_insert_rowid() as id');
            tagId = result[0].values[0][0];
          }

          if (tagId) {
            try {
              db.run('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [post.id, tagId]);
              db.run('UPDATE tags SET count = count + 1 WHERE id = ?', [tagId]);
              migratedCount++;
            } catch (e) {
              console.warn(`跳过重复的标签关联: post_id=${post.id}, tag_id=${tagId}`);
            }
          }
        });
      } catch (e) {
        console.warn(`解析文章标签失败: post_id=${post.id}, error=${e.message}`);
      }
    });

    saveDB();
    console.log(`✅ 标签数据迁移完成，共迁移 ${migratedCount} 条关联记录`);
  } catch (err) {
    console.warn('⚠️ 标签数据迁移失败:', err.message);
  }
}

// ===================== 全局错误处理 =====================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===================== 启动服务器 =====================

initDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     🚀 服务器启动成功                       ║');
    console.log('║────────────────────────────────────────────║');
    console.log(`║     📍 地址: http://localhost:${PORT}          ║`);
    console.log(`║     💚 健康检查: http://localhost:${PORT}/api/health ║`);
    console.log('║────────────────────────────────────────────║');
    console.log('║     📊 功能已启用:                         ║');
    console.log('║       ✅ JWT认证系统                       ║');
    console.log('║       ✅ 管理员登录功能                     ║');
    console.log('║       ✅ 敏感词过滤系统                    ║');
    console.log('║       ✅ 树状评论结构                      ║');
    console.log('║       ✅ 图片上传服务                      ║');
    console.log('║       ✅ 专栏连载体系                      ║');
    console.log('║       ✅ AI 智能问答                       ║');
    console.log('║       ✅ API 统一响应格式                   ║');
    console.log('║       ✅ 访客记录系统                      ║');
    console.log('║       ✅ 评论点赞功能                      ║');
    console.log('║       ✅ 智能推荐系统                      ║');
    console.log('║       ✅ 友链管理系统                      ║');
    console.log('║       ✅ 标签管理系统                      ║');
    console.log('║       ✅ 浏览统计系统                      ║');
    console.log('║       ✅ WebSocket在线访客实时统计          ║');
    console.log('╚════════════════════════════════════════════╝');
  });

  // ===================== WebSocket 在线访客统计 =====================
  const wss = new WebSocket.Server({ server });
  let onlineConnections = new Map();

  // ===================== 实时在线访客 API =====================
  app.get('/api/online/count', (req, res) => {
    const onlineCount = onlineConnections.size;
    res.json({
      success: true,
      data: {
        onlineCount: onlineCount
      }
    });
  });

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    const connectionId = `${clientIp}-${Date.now()}`;
    
    onlineConnections.set(connectionId, {
      ws: ws,
      ip: clientIp,
      connectedAt: Date.now()
    });

    const sendOnlineCount = () => {
      const onlineCount = onlineConnections.size;
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(String(onlineCount));
        }
      });
    };

    ws.on('message', (message) => {
      if (message === 'ping') {
        ws.send('pong');
      }
    });

    ws.on('close', () => {
      onlineConnections.delete(connectionId);
      sendOnlineCount();
    });

    sendOnlineCount();
  });

  setInterval(() => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(String(onlineConnections.size));
      }
    });
  }, 10000);

}).catch(err => {
  console.error('❌ 服务器启动失败:', err);
  process.exit(1);
});
