<script setup>
import { ref } from 'vue'
import Navbar from '../components/Navbar.vue'

const fileTree = ref([
  {
    name: '大四毕设',
    expanded: true,
    files: [
      { name: '开题报告.md', active: false },
      { name: '文献综述.md', active: false },
      { name: '技术方案.md', active: false },
      { name: '中期检查.md', active: false }
    ]
  },
  {
    name: '前端学习',
    expanded: false,
    files: [
      { name: 'Vue3 基础.md', active: false },
      { name: 'TypeScript 入门.md', active: false },
      { name: 'Tailwind CSS.md', active: false },
      { name: 'Vite 构建工具.md', active: false }
    ]
  },
  {
    name: '生活碎片',
    expanded: false,
    files: [
      { name: '读书笔记.md', active: false },
      { name: '日常记录.md', active: false },
      { name: '旅行日记.md', active: false },
      { name: '美食探店.md', active: false }
    ]
  }
])

const activeFile = ref({ title: '欢迎来到 Obsidian Garden', content: '' })

const toggleFolder = (folder) => {
  folder.expanded = !folder.expanded
}

const selectFile = (folder, file) => {
  // 重置所有文件的激活状态
  fileTree.value.forEach(f => {
    f.files.forEach(fi => fi.active = false)
  })
  file.active = true
  
  // 设置当前文件内容
  activeFile.value = {
    title: file.name.replace('.md', ''),
    content: getFileContent(file.name)
  }
}

const getFileContent = (fileName) => {
  const contents = {
    '开题报告.md': `# 基于 Vue3 的博客系统设计与实现

## 一、研究背景

随着互联网技术的快速发展，个人博客已成为展示个人技术能力和分享知识的重要平台。本项目旨在设计并实现一个基于 Vue3 框架的现代化个人博客系统。

## 二、技术栈

- **前端框架**: Vue 3 + Vite
- **UI 样式**: Tailwind CSS 3
- **路由管理**: Vue Router
- **状态管理**: Pinia (可选)

## 三、功能模块

1. **文章管理** - 文章的增删改查
2. **分类系统** - 文章分类与标签
3. **评论系统** - 用户留言与互动
4. **归档功能** - 按时间线展示文章

## 四、预期成果

完成一个界面美观、功能完善的个人博客系统，支持响应式设计，适配多种设备。`,
    
    'Vue3 基础.md': `# Vue 3 基础学习笔记

## 1. 组合式 API

Vue 3 引入了组合式 API，使用 \`setup()\` 函数来组织组件逻辑。

\`\`\`javascript
import { ref, reactive, computed } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const state = reactive({ name: 'ZJH' })
    
    const doubled = computed(() => count.value * 2)
    
    const increment = () => {
      count.value++
    }
    
    return {
      count,
      state,
      doubled,
      increment
    }
  }
}
\`\`\`

## 2. 响应式原理

Vue 3 使用 Proxy 替代 Vue 2 的 Object.defineProperty，实现更高效的响应式系统。

## 3. 生命周期钩子

| 选项式 API | 组合式 API |
|-----------|-----------|
| beforeCreate | setup() |
| created | setup() |
| beforeMount | onBeforeMount |
| mounted | onMounted |
| beforeUpdate | onBeforeUpdate |
| updated | onUpdated |`,
    
    '读书笔记.md': `# 《代码大全》读书笔记

## 核心要点

### 1. 代码质量的重要性

> "编写代码不仅仅是为了让计算机理解，更是为了让人类理解。"

### 2. 优秀代码的特征

- **可读性** - 清晰的命名和结构
- **可维护性** - 易于修改和扩展
- **可测试性** - 便于编写单元测试
- **效率** - 合理的性能表现

### 3. 编程原则

- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- SOLID 原则

## 心得体会

这本书让我意识到，写出高质量的代码需要不断学习和实践。良好的编程习惯比技术本身更重要。`,
    
    '技术方案.md': `# 技术方案文档

## 架构设计

### 前端架构

采用 **组件化** 和 **模块化** 的设计思想：

\`\`\`
src/
├── components/     # 公共组件
├── views/          # 页面视图
├── router/         # 路由配置
├── api/            # API 接口
└── utils/          # 工具函数
\`\`\`

### 后端架构

使用 Node.js + Express + SQLite：

\`\`\`javascript
// 示例：文章列表接口
app.get('/api/posts', async (req, res) => {
  const posts = await db.all('SELECT * FROM posts')
  res.json(posts)
})
\`\`\`

## 数据库设计

**posts 表结构**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| title | TEXT | 文章标题 |
| content | TEXT | 文章内容 |
| category | TEXT | 分类 |
| created_at | TEXT | 创建时间 |`
  }
  
  return contents[fileName] || `# ${fileName.replace('.md', '')}

暂无内容...`
}

// 默认显示第一篇文章
selectFile(fileTree.value[0], fileTree.value[0].files[0])
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <Navbar />
    <div class="flex">
    <!-- 左侧文件树 -->
    <aside class="w-64 bg-white/80 backdrop-blur-md border-r border-gray-200 flex flex-col">
      <!-- 标题栏 -->
      <div class="p-4 border-b border-gray-200">
        <h1 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <svg class="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Obsidian Garden
        </h1>
      </div>
      
      <!-- 文件树目录 -->
      <div class="flex-1 overflow-y-auto p-2">
        <div v-for="folder in fileTree" :key="folder.name" class="mb-1">
          <!-- 文件夹 -->
          <button 
            @click="toggleFolder(folder)"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg 
              class="w-4 h-4 transition-transform" 
              :class="folder.expanded ? 'rotate-90' : ''"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
            </svg>
            <span>{{ folder.name }}</span>
          </button>
          
          <!-- 文件列表 -->
          <div v-if="folder.expanded" class="ml-6 mt-1">
            <button 
              v-for="file in folder.files" 
              :key="file.name"
              @click="selectFile(folder, file)"
              class="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors"
              :class="file.active ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'"
            >
              <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
              <span class="truncate">{{ file.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
    
    <!-- 右侧主内容区 -->
    <main class="flex-1 overflow-y-auto p-8">
      <div class="max-w-4xl mx-auto">
        <!-- 内容卡片 -->
        <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ activeFile.title }}</h2>
          
          <!-- Markdown 内容 -->
          <div class="prose prose-gray max-w-none">
            <div v-html="renderMarkdown(activeFile.content)"></div>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>
</template>

<script>
// 简单的 Markdown 渲染函数
function renderMarkdown(text) {
  let html = text
  
  // 标题
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-800 mt-10 mb-6">$1</h1>')
  
  // 粗体和斜体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
  
  // 引用
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-purple-400 pl-4 italic text-gray-600 my-4">$1</blockquote>')
  
  // 无序列表
  html = html.replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-700">$1</li>')
  html = html.replace(/(<li>.*<\/li>)+/g, '<ul class="list-disc mb-4">$&</ul>')
  
  // 代码块
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto mb-4"><code class="text-sm">${escapeHtml(code.trim())}</code></pre>`
  })
  
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-0.5 rounded text-sm text-purple-600">$1</code>')
  
  // 表格
  html = html.replace(/\|(.+)\|\n\|[-|]+\|\n((?:\|.+\|\n?)+)/g, (_, header, body) => {
    const headerCells = header.split('|').filter(c => c.trim()).map(c => `<th class="border border-gray-300 px-4 py-2 bg-gray-50 text-left font-semibold">${c.trim()}</th>`).join('')
    const bodyRows = body.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td class="border border-gray-300 px-4 py-2">${c.trim()}</td>`).join('')
      return `<tr>${cells}</tr>`
    }).join('')
    return `<table class="border-collapse w-full mb-4"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`
  })
  
  // 空行
  html = html.replace(/\n\n/g, '</p><p class="text-gray-700 mb-4">')
  
  return `<p class="text-gray-700 mb-4">${html}</p>`
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
</script>

<style scoped>
/* 代码块语法高亮背景 */
pre {
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
}

code {
  font-family: 'Fira Code', 'Consolas', monospace;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
