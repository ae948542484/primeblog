<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted, watch } from 'vue'

const route = useRoute()
const router = useRouter()

const navItems = [
  { label: 'ME', href: '/#me' },
  { label: 'Information', href: '/#info' },
  { label: 'Interests', href: '/#interests' },
  { label: 'Blog', href: '/blog' },
  { label: 'Archive', href: '/archive' },
  { label: 'Messages', href: '/messages' }
]

const mobileMenuOpen = ref(false)
const isLogoutLoading = ref(false)

const isLoggedIn = computed(() => {
  const adminToken = localStorage.getItem('admin_token')
  return !!adminToken
})

const currentUser = computed(() => {
  const userData = localStorage.getItem('admin_user')
  return userData ? JSON.parse(userData) : null
})

onMounted(async () => {
  const adminToken = localStorage.getItem('admin_token')
  if (adminToken) {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })
      
      if (!response.ok) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
      }
    } catch (error) {
      console.error('令牌验证失败:', error)
    }
  }
})

const isActive = (href) => {
  if (href === '/messages') {
    return route.path === '/messages'
  }
  if (href === '/archive') {
    return route.path === '/archive' || route.path === '/create'
  }
  if (href === '/blog') {
    return route.path === '/blog'
  }
  return route.path === '/' && href.startsWith('/#')
}

const showLoginButton = computed(() => {
  const publicPages = ['/', '/about', '/blog', '/archive', '/messages', '/mylife', '/obsidian', '/links']
  return publicPages.includes(route.path)
})

const logout = async () => {
  if (isLogoutLoading.value) return
  
  isLogoutLoading.value = true
  
  const adminToken = localStorage.getItem('admin_token')
  
  try {
    if (adminToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })
    }
  } catch (error) {
    console.error('登出错误:', error)
  } finally {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    isLogoutLoading.value = false
    window.location.href = '/'
  }
}

const goLogin = () => {
  router.push('/login')
}

const scrollToSection = (href) => {
  mobileMenuOpen.value = false
  
  if (href.startsWith('/#')) {
    const welcomeSection = document.querySelector('.fixed.inset-0.z-50')
    if (welcomeSection) {
      welcomeSection.style.display = 'none'
    }
    
    const sectionId = href.replace('/#', '')
    
    if (route.path === '/') {
      setTimeout(() => {
        const element = document.getElementById(sectionId) || document.querySelector(`[id="${sectionId}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 50)
    } else {
      router.push('/').then(() => {
        setTimeout(() => {
          const element = document.getElementById(sectionId) || document.querySelector(`[id="${sectionId}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 150)
      })
    }
  } else {
    router.push(href)
  }
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}
</script>

<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <svg class="w-6 h-6 text-gradient-to-r from-blue-500 to-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
          </svg>
          <span class="font-bold text-gray-800">My Channel</span>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-8">
          <a 
            v-for="item in navItems" 
            :key="item.href"
            :href="item.href"
            @click.prevent="scrollToSection(item.href)"
            :class="[
              'relative text-sm font-medium transition-all duration-300',
              isActive(item.href) 
                ? 'text-slate-800 font-semibold' 
                : 'text-slate-600 hover:text-slate-800'
            ]"
          >
            {{ item.label }}
            <span 
              v-if="isActive(item.href)"
              class="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            ></span>
          </a>
        </div>

        <!-- Auth Buttons -->
        <div class="hidden md:flex items-center gap-3">
          <button 
            v-if="isLoggedIn" 
            @click="router.push('/admin')" 
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors duration-300 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            进入后台
          </button>
          <button 
            v-if="isLoggedIn" 
            @click="logout" 
            :disabled="isLogoutLoading"
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-500 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="isLogoutLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLogoutLoading ? '退出中...' : '退出登录' }}
          </button>
          <button 
            v-else-if="showLoginButton" 
            @click="goLogin" 
            class="px-5 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-sm font-medium rounded-full shadow-sm hover:shadow-md hover:from-slate-800 hover:to-slate-900 transition-all duration-300"
          >
            登录
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <button 
          @click="toggleMobileMenu"
          class="md:hidden p-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <svg 
            v-if="!mobileMenuOpen"
            class="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg 
            v-else
            class="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div 
      v-if="mobileMenuOpen"
      class="md:hidden bg-white border-t border-slate-100 shadow-lg"
    >
      <div class="px-4 py-4 space-y-1">
        <a 
          v-for="item in navItems" 
          :key="item.href"
          :href="item.href"
          @click.prevent="scrollToSection(item.href)"
          :class="[
            'block px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
            isActive(item.href) 
              ? 'bg-slate-50 text-slate-800 font-semibold' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
          ]"
        >
          {{ item.label }}
        </a>
        <div class="pt-3 border-t border-slate-100 mt-3">
          <button 
            v-if="isLoggedIn" 
            @click="router.push('/admin')" 
            class="w-full px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            进入后台
          </button>
          <button 
            v-if="isLoggedIn" 
            @click="logout" 
            :disabled="isLogoutLoading"
            class="w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="isLogoutLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLogoutLoading ? '退出中...' : '退出登录' }}
          </button>
          <button 
            v-else-if="showLoginButton" 
            @click="goLogin" 
            class="w-full px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            登录
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.text-gradient-to-r {
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>