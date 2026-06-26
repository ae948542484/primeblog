<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const adminToken = localStorage.getItem('admin_token')
const adminUser = adminToken ? JSON.parse(localStorage.getItem('admin_user') || '{}') : null

const adminMenu = [
  { path: '/admin', label: '仪表盘', icon: 'dashboard' },
  { path: '/admin/posts', label: '文章管理', icon: 'article' },
  { path: '/admin/messages', label: '留言管理', icon: 'message' },
  { path: '/admin/tags', label: '标签管理', icon: 'tag' },
  { path: '/admin/categories', label: '分类管理', icon: 'category' },
  { path: '/admin/profile', label: '博主信息', icon: 'profile' },
  { path: '/admin/security', label: '账户安全', icon: 'security' },
]

const sidebarOpen = ref(true)

const handleLogout = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  router.push('/')
}

onMounted(() => {
  if (!adminToken) {
    router.push('/login')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 顶部导航 -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <button @click="sidebarOpen = !sidebarOpen" class="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <h1 class="ml-4 text-xl font-bold text-gray-800">博客管理后台</h1>
          </div>
          <div class="flex items-center gap-4">
            <router-link to="/" class="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              返回前台
            </router-link>
            <button @click="handleLogout" class="text-red-500 hover:text-red-700 text-sm">退出登录</button>
          </div>
        </div>
      </div>
    </nav>

    <div class="flex">
      <!-- 侧边栏 -->
      <aside class="bg-white shadow-lg w-64 min-h-screen" :class="sidebarOpen ? '' : 'hidden'">
        <nav class="mt-6">
          <router-link 
            v-for="item in adminMenu" 
            :key="item.path"
            :to="item.path"
            class="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            :class="route.path === item.path ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''"
          >
            <!-- Dashboard Icon -->
            <svg v-if="item.icon === 'dashboard'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
            <!-- Article Icon -->
            <svg v-if="item.icon === 'article'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <!-- Message Icon -->
            <svg v-if="item.icon === 'message'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <!-- Tag Icon -->
            <svg v-if="item.icon === 'tag'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            <!-- Category Icon -->
            <svg v-if="item.icon === 'category'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <!-- Profile Icon -->
            <svg v-if="item.icon === 'profile'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <!-- Security Icon -->
            <svg v-if="item.icon === 'security'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            {{ item.label }}
          </router-link>
        </nav>
      </aside>

      <!-- 主内容区 -->
      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
