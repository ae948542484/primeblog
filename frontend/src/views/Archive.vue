<script setup>
import { ref, onMounted, computed } from 'vue'

const posts = ref([])
const loading = ref(true)
const groupedPosts = ref({})
const selectedPost = ref(null)

const API_BASE = 'http://localhost:3001/api'

// 检查是否已登录（从 localStorage 获取状态）
const isLoggedIn = computed(() => {
  return localStorage.getItem('isLoggedIn') === 'true'
})

// 超时函数
const timeoutPromise = (ms, promise) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('请求超时'))
    }, ms)
    promise.then(
      (res) => {
        clearTimeout(timeoutId)
        resolve(res)
      },
      (err) => {
        clearTimeout(timeoutId)
        reject(err)
      }
    )
  })
}

const fetchPosts = async () => {
  loading.value = true
  try {
    // 从后端 API 获取文章，设置 3 秒超时
    const response = await timeoutPromise(3000, fetch(`${API_BASE}/posts`))
    if (response.ok) {
      const data = await response.json()
      posts.value = data
      // 同步到本地存储
      localStorage.setItem('blogPosts', JSON.stringify(data))
    }
    groupByMonth()
  } catch (error) {
    console.error('获取文章失败:', error)
    // 如果后端不可用或超时，使用 localStorage 作为备份
    const storedPosts = localStorage.getItem('blogPosts')
    if (storedPosts) {
      posts.value = JSON.parse(storedPosts)
      groupByMonth()
    }
  } finally {
    loading.value = false
  }
}

const groupByMonth = () => {
  const groups = {}
  posts.value.forEach(post => {
    const date = new Date(post.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    groups[monthKey].push(post)
  })
  groupedPosts.value = groups
}

const formatMonth = (monthKey) => {
  const [year, month] = monthKey.split('-')
  return `${year}年${month}月`
}

const viewPost = (post) => {
  selectedPost.value = post
}

const closePost = () => {
  selectedPost.value = null
}

onMounted(() => {
  fetchPosts()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-light">
    <div class="py-12 px-6">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h1 class="section-title">文章归档</h1>
          <a 
            v-if="isLoggedIn"
            href="/create" 
            class="px-6 py-2 bg-primary-500 text-white rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            写文章 ✏️
          </a>
        </div>
        
        <div v-if="loading" class="text-center py-12">
          <div class="text-gray-400">加载中...</div>
        </div>

        <div v-else-if="posts.length === 0" class="text-center py-12">
          <div class="text-gray-400">暂无文章</div>
          <a href="/create" class="inline-block mt-4 text-primary-500 hover:text-accent">
            写第一篇文章 →
          </a>
        </div>

        <div v-else class="space-y-8">
          <div 
            v-for="(monthPosts, monthKey) in groupedPosts" 
            :key="monthKey"
            class="card p-6"
          >
            <h2 class="text-xl font-bold text-primary-500 mb-4 flex items-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              {{ formatMonth(monthKey) }}
              <span class="text-sm text-gray-400 font-normal">({{ monthPosts.length }} 篇)</span>
            </h2>
            
            <ul class="space-y-3">
              <li 
                v-for="post in monthPosts" 
                :key="post.id"
                @click="viewPost(post)"
                class="flex items-center gap-4 py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <span class="text-sm text-gray-400 w-12">
                  {{ new Date(post.created_at).getDate() }}日
                </span>
                <span class="text-xs px-2 py-1 bg-primary-100 text-primary-500 rounded">
                  {{ post.category }}
                </span>
                <span class="text-gray-700 hover:text-primary-500 flex-1 truncate">
                  {{ post.title }}
                </span>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-12 card p-6">
          <h2 class="text-xl font-bold text-primary-500 mb-4">统计信息</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div class="text-2xl font-bold text-accent">{{ posts.length }}</div>
              <div class="text-gray-500 text-sm">总文章数</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-accent">{{ Object.keys(groupedPosts).length }}</div>
              <div class="text-gray-500 text-sm">归档月份</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-accent">
                {{ new Set(posts.map(p => p.category)).size }}
              </div>
              <div class="text-gray-500 text-sm">分类数量</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-accent">{{ new Date().getFullYear() }}</div>
              <div class="text-gray-500 text-sm">建站年份</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文章详情弹窗 -->
    <div v-if="selectedPost" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click="closePost">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8" @click.stop>
        <div class="flex items-start justify-between mb-4">
          <span class="text-xs px-3 py-1 bg-primary-100 text-primary-500 rounded-full">
            {{ selectedPost.category }}
          </span>
          <button @click="closePost" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">{{ selectedPost.title }}</h2>
        <p class="text-gray-600 whitespace-pre-wrap leading-relaxed">{{ selectedPost.content }}</p>
        <p class="text-gray-400 text-sm mt-6">
          {{ new Date(selectedPost.created_at).toLocaleString('zh-CN') }}
        </p>
      </div>
    </div>
  </div>
</template>
