<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const API_BASE = '/api'

const stats = ref({
  articleCount: 0,
  messageCount: 0,
  tagCount: 0,
  categoryCount: 0,
  viewCount: 0,
  visitorCount: 0,
  onlineCount: 0
})

const loading = ref(true)
const initStatus = ref('')
let ws = null
let onlineInterval = null

const loadStats = async () => {
  loading.value = true
  try {
    const [postsRes, messagesRes, tagsRes, categoriesRes, reportRes] = await Promise.all([
      fetch(`${API_BASE}/posts?pageSize=1`),
      fetch(`${API_BASE}/messages`),
      fetch(`${API_BASE}/tags`),
      fetch(`${API_BASE}/categories`),
      fetch(`${API_BASE}/report`)
    ])
    
    const [posts, messages, tags, categories, report] = await Promise.all([
      postsRes.json(),
      messagesRes.json(),
      tagsRes.json(),
      categoriesRes.json(),
      reportRes.json()
    ])
    
    stats.value = {
      articleCount: posts.data?.total || 0,
      messageCount: messages.data?.length || 0,
      tagCount: tags.data?.length || 0,
      categoryCount: categories.data?.length || 0,
      viewCount: report.data?.viewTotalCount || 0,
      visitorCount: report.data?.visitorTotalCount || 0
    }
  } catch (e) {
    console.error('加载统计失败', e)
  } finally {
    loading.value = false
  }
}

// 加载实时在线访客数
const loadOnlineCount = async () => {
  try {
    const res = await fetch(`${API_BASE}/online/count`)
    const result = await res.json()
    if (result.success) {
      stats.value.onlineCount = result.data.onlineCount
    }
  } catch (e) {
    console.error('加载在线人数失败', e)
  }
}

// 连接 WebSocket 获取实时在线人数
const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}`
  
  try {
    ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket已连接')
    }
    
    ws.onmessage = (event) => {
      const count = parseInt(event.data)
      if (!isNaN(count)) {
        stats.value.onlineCount = count
      }
    }
    
    ws.onerror = () => {
      // WebSocket连接失败，改为轮询
      startOnlinePolling()
    }
    
    ws.onclose = () => {
      startOnlinePolling()
    }
  } catch (e) {
    startOnlinePolling()
  }
}

// 轮询获取在线人数
const startOnlinePolling = () => {
  if (onlineInterval) return
  loadOnlineCount()
  onlineInterval = setInterval(loadOnlineCount, 10000) // 每10秒更新一次
}

const initData = async () => {
  if (!confirm('确定要重新初始化数据吗？这将重置数据库。')) return
  
  initStatus.value = '初始化中...'
  try {
    const res = await fetch(`${API_BASE}/init-data`, { method: 'POST' })
    const result = await res.json()
    if (result.success) {
      alert('数据初始化成功！')
      loadStats()
    } else {
      alert('初始化失败：' + result.error)
    }
  } catch (e) {
    alert('初始化失败')
  }
  initStatus.value = ''
}

const resetStats = async () => {
  if (!confirm('确定要重置统计数据吗？')) return
  alert('统计数据重置功能需要后端支持')
}

onMounted(() => {
  loadStats()
  loadOnlineCount()
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
  if (onlineInterval) {
    clearInterval(onlineInterval)
  }
})
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">仪表盘</h2>
      <div class="flex gap-3">
        <button @click="loadStats" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          刷新数据
        </button>
        <button @click="initData" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          {{ initStatus || '初始化测试数据' }}
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
        <div class="text-3xl font-bold text-blue-600">{{ stats.articleCount }}</div>
        <div class="text-gray-500 mt-1">文章总数</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
        <div class="text-3xl font-bold text-green-600">{{ stats.messageCount }}</div>
        <div class="text-gray-500 mt-1">留言总数</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
        <div class="text-3xl font-bold text-purple-600">{{ stats.tagCount }}</div>
        <div class="text-gray-500 mt-1">标签总数</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
        <div class="text-3xl font-bold text-orange-600">{{ stats.categoryCount }}</div>
        <div class="text-gray-500 mt-1">分类总数</div>
      </div>
    </div>

    <!-- 浏览统计 -->
    <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">浏览统计</h3>
        <div class="flex items-center gap-8">
          <div>
            <div class="text-4xl font-bold text-indigo-600">{{ stats.viewCount }}</div>
            <div class="text-gray-500 mt-1">总浏览量</div>
          </div>
          <div>
            <div class="text-4xl font-bold text-teal-600">{{ stats.visitorCount }}</div>
            <div class="text-gray-500 mt-1">总访客数</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">实时在线</h3>
        <div class="flex items-center gap-4">
          <div class="relative">
            <div class="text-4xl font-bold text-green-600">{{ stats.onlineCount }}</div>
            <div class="text-gray-500 mt-1">当前在线</div>
            <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">快速操作</h3>
        <div class="grid grid-cols-2 gap-3">
          <router-link to="/admin/posts" class="p-3 bg-blue-50 text-blue-600 rounded-lg text-center hover:bg-blue-100 transition-colors">
            管理文章
          </router-link>
          <router-link to="/admin/messages" class="p-3 bg-green-50 text-green-600 rounded-lg text-center hover:bg-green-100 transition-colors">
            管理留言
          </router-link>
          <router-link to="/admin/tags" class="p-3 bg-purple-50 text-purple-600 rounded-lg text-center hover:bg-purple-100 transition-colors">
            管理标签
          </router-link>
          <router-link to="/create" class="p-3 bg-orange-50 text-orange-600 rounded-lg text-center hover:bg-orange-100 transition-colors">
            写新文章
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
