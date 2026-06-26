/**
 * 数据初始化脚本 - 注入测试数据
 * 运行命令: node init-data.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'database.sqlite');

async function initData() {
  console.log('🔄 开始数据初始化...\n');
  
  // 初始化 SQL.js
  const SQL = await initSqlJs();
  
  // 读取现有数据库
  let db;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('📂 已加载现有数据库: blog.db\n');
  } else {
    console.log('❌ 数据库文件不存在，请先运行 server.js 创建数据库');
    process.exit(1);
  }
  
  // 1. 插入分类
  console.log('📁 插入分类数据...');
  const categories = [
    { name: '后端技术', slug: 'backend', description: '后端开发相关技术文章' },
    { name: '前端技术', slug: 'frontend', description: '前端开发相关技术文章' },
    { name: 'DevOps', slug: 'devops', description: '运维与部署相关' },
    { name: '数据库', slug: 'database', description: '数据库相关技术' }
  ];
  
  categories.forEach(cat => {
    try {
      db.run(`INSERT OR IGNORE INTO categories (name, slug, description, article_count, created_at, updated_at) VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))`, [cat.name, cat.slug, cat.description]);
      console.log(`  ✅ 分类: ${cat.name}`);
    } catch (e) {
      console.log(`  ⚠️ 分类已存在: ${cat.name}`);
    }
  });
  
  // 2. 插入标签（带颜色）
  console.log('\n🏷️ 插入标签数据（彩色）...');
  const tagColors = [
    { name: 'Vue3', color: '#42b883' },
    { name: 'Node.js', color: '#339933' },
    { name: 'TypeScript', color: '#3178c6' },
    { name: 'Docker', color: '#2496ed' },
    { name: 'Redis', color: '#dc382d' },
    { name: 'PostgreSQL', color: '#336791' },
    { name: 'Kubernetes', color: '#326ce5' },
    { name: 'Git', color: '#f05032' },
    { name: 'Python', color: '#3776ab' },
    { name: 'Java', color: '#007396' },
    { name: 'Spring Boot', color: '#6db33f' },
    { name: '微服务', color: '#ff6b6b' },
    { name: '性能优化', color: '#f59e0b' },
    { name: '架构设计', color: '#8b5cf6' }
  ];
  
  tagColors.forEach(tag => {
    try {
      const slug = tag.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      db.run(`INSERT OR IGNORE INTO tags (name, slug, color, count, created_at, updated_at) VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))`, [tag.name, slug, tag.color]);
      console.log(`  ✅ 标签: ${tag.name} (${tag.color})`);
    } catch (e) {
      console.log(`  ⚠️ 标签已存在: ${tag.name}`);
    }
  });
  
  // 3. 插入测试文章（使用正确的表结构列名）
  console.log('\n📝 插入测试文章...');
  const articles = [
    {
      title: 'Vue 3 Composition API 实战指南',
      content: 'Vue 3 引入了全新的 Composition API，提供更好的代码组织和复用能力。本文将详细介绍如何使用 ref、reactive、computed 和 watch。\n\n## ref 和 reactive\n\nref 用于创建响应式的基本类型数据，而 reactive 用于创建响应式的对象。\n\n```javascript\nimport { ref, reactive } from vue\n\nconst count = ref(0)\nconst state = reactive({ name: Vue 3 })\n```\n\n## computed 和 watch\n\n计算属性和侦听器的使用方式与 Options API 略有不同。',
      category: '前端技术',
      tags: ['Vue3', 'TypeScript'],
      likes: 42,
      views: 328,
      favorites: 18
    },
    {
      title: 'Node.js + Express 快速搭建 RESTful API',
      content: '本文介绍如何使用 Node.js 和 Express 快速搭建一个 RESTful API 服务。\n\n## 项目初始化\n\n首先创建项目目录并初始化 npm。\n\n```bash\nmkdir my-api && cd my-api\nnpm init -y\nnpm install express\n```\n\n## Express 基础用法\n\n```javascript\nconst express = require(express)\nconst app = express()\n\napp.get(/api/users, (req, res) => {\n  res.json([{ id: 1, name: Alice }])\n})\n\napp.listen(3000)\n```',
      category: '后端技术',
      tags: ['Node.js', '微服务'],
      likes: 35,
      views: 256,
      favorites: 12
    },
    {
      title: 'Docker 容器化部署完全指南',
      content: 'Docker 是一个开源的容器化平台，本文介绍 Docker 的基本概念和使用方法。\n\n## 核心概念\n\n### 镜像（Image）\n镜像是一个只读模板，用于创建容器。\n\n### 容器（Container）\n容器是镜像的运行实例。\n\n## 常用命令\n\n```bash\ndocker build -t myapp .\ndocker run -p 3000:3000 myapp\ndocker ps\ndocker logs <container_id>\n```',
      category: 'DevOps',
      tags: ['Docker', '微服务', '架构设计'],
      likes: 58,
      views: 412,
      favorites: 24
    },
    {
      title: 'Redis 缓存设计与最佳实践',
      content: 'Redis 是最流行的内存数据库之一，本文介绍如何设计高效的缓存策略。\n\n## 为什么使用 Redis\n\n- 读写性能极高\n- 支持多种数据结构\n- 丰富的特性（持久化、集群、事务）\n\n## 缓存策略\n\n### Cache-Aside 模式\n\n```javascript\nasync function getUser(id) {\n  const cache = await redis.get(`user:${id}`)\n  if (cache) return JSON.parse(cache)\n  \n  const user = await db.findUser(id)\n  await redis.setex(`user:${id}`, 3600, JSON.stringify(user))\n  return user\n}\n```',
      category: '数据库',
      tags: ['Redis', '性能优化'],
      likes: 47,
      views: 389,
      favorites: 21
    },
    {
      title: 'TypeScript 类型体操入门',
      content: 'TypeScript 的类型系统非常强大，本文介绍一些高级类型用法。\n\n## 泛型约束\n\n```typescript\ninterface Lengthwise {\n  length: number;\n}\n\nfunction loggingIdentity<T extends Lengthwise>(arg: T): T {\n  console.log(arg.length);\n  return arg;\n}\n```\n\n## 条件类型\n\n```typescript\ntype NonNullable<T> = T extends null | undefined ? never : T;\n```',
      category: '前端技术',
      tags: ['TypeScript', 'Vue3'],
      likes: 33,
      views: 275,
      favorites: 15
    }
  ];
  
  const now = new Date();
  articles.forEach((article, index) => {
    try {
      const publishDate = new Date(now - index * 3 * 24 * 60 * 60 * 1000);
      const dateStr = publishDate.toISOString().replace('T', ' ').substring(0, 19);
      
      // 使用正确的表结构列名
      db.run(`INSERT INTO posts (title, content, category, tags, likes, views, favorites, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [article.title, article.content, article.category, JSON.stringify(article.tags), 
         article.likes, article.views, article.favorites, dateStr]);
      
      console.log(`  ✅ 文章: ${article.title}`);
      
      const result = db.exec('SELECT last_insert_rowid() as id');
      const postId = result[0].values[0][0];
      
      // 关联标签
      article.tags.forEach(tagName => {
        try {
          const tagResult = db.exec('SELECT id FROM tags WHERE name = ?', [tagName]);
          if (tagResult.length > 0 && tagResult[0].values.length > 0) {
            const tagId = tagResult[0].values[0][0];
            db.run('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId]);
            db.run('UPDATE tags SET count = (SELECT COUNT(*) FROM post_tags WHERE tag_id = ?) WHERE id = ?', [tagId, tagId]);
          }
        } catch (e) {
          // 忽略重复关联
        }
      });
    } catch (e) {
      console.log(`  ⚠️ 文章已存在或插入失败: ${article.title}`);
      console.log(`     错误: ${e.message}`);
    }
  });
  
  // 4. 插入访客数据
  console.log('\n👤 插入访客数据...');
  const ips = ['127.0.0.1', '192.168.1.100', '10.0.0.50', '172.16.0.20', '8.8.8.8'];
  let visitorCount = 0;
  for (let i = 0; i < 50; i++) {
    try {
      const daysAgo = Math.floor(Math.random() * 30);
      const visitDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const dateStr = visitDate.toISOString().replace('T', ' ').substring(0, 19);
      
      db.run(`INSERT INTO visitors (ip, last_visit_at, fingerprint, online_status) VALUES (?, ?, ?, ?)`,
        [ips[Math.floor(Math.random() * ips.length)], dateStr, crypto.randomBytes(16).toString('hex'), 0]);
      visitorCount++;
    } catch (e) {
      // 忽略
    }
  }
  console.log(`  ✅ 插入 ${visitorCount} 条访客记录`);
  
  // 5. 插入浏览记录
  console.log('\n👁️ 插入浏览记录...');
  const paths = ['/blog', '/article/1', '/article/2', '/archive', '/about', '/messages'];
  let viewCount = 0;
  for (let i = 0; i < 200; i++) {
    try {
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const viewDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);
      const dateStr = viewDate.toISOString().replace('T', ' ').substring(0, 19);
      
      db.run(`INSERT INTO views (page_path, view_time) VALUES (?, ?)`, [paths[Math.floor(Math.random() * paths.length)], dateStr]);
      viewCount++;
    } catch (e) {
      // 忽略
    }
  }
  console.log(`  ✅ 插入 ${viewCount} 条浏览记录`);
  
  // 6. 保存数据库
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  
  console.log('\n========================================');
  console.log('✅ 数据初始化完成！');
  console.log('========================================');
  console.log('\n📊 统计数据:');
  console.log(`   - 文章数: ${articles.length}`);
  console.log(`   - 分类数: ${categories.length}`);
  console.log(`   - 标签数: ${tagColors.length}`);
  console.log(`   - 访客数: ${visitorCount}`);
  console.log(`   - 浏览数: ${viewCount}`);
  console.log('\n🚀 请刷新前端页面查看效果！');
  console.log('========================================\n');
  
  db.close();
}

initData().catch(err => {
  console.error('❌ 数据初始化失败:', err);
  process.exit(1);
});
