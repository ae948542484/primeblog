<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, reactive, computed } from 'vue'

const route = useRoute()
const router = useRouter()

const navItems = [
  { label: 'ME', href: '/#me' },
  { label: 'Information', href: '/#info' },
  { label: 'Interests', href: '/#interests' },
  { label: 'Friends', href: '/#friends' },
  { label: 'Archive', href: '/archive' },
  { label: 'Messages', href: '/messages' }
]

const loginModal = ref(false)
const mobileMenuOpen = ref(false)
const loginForm = reactive({
  username: '',
  password: ''
})

// 检查是否已登录
const isLoggedIn = computed(() => {
  return localStorage.getItem('isLoggedIn') === 'true'
})

const isActive = (href) => {
  if (href === '/messages') {
    return route.path === '/messages'
  }
  if (href === '/archive') {
    return route.path === '/archive' || route.path === '/create'
  }
  return route.path === '/' && href.startsWith('/#')
}

const login = () => {
  if (loginForm.username === 'admin' && loginForm.password === '123456') {
    localStorage.setItem('isLoggedIn', 'true')
    loginModal.value = false
    loginForm.username = ''
    loginForm.password = ''
    alert('登录成功！欢迎回来！😊')
  } else {
    alert('用户名或密码错误！\n用户名: admin\n密码: 123456')
  }
}

const logout = () => {
  localStorage.removeItem('isLoggedIn')
  alert('已退出登录')
  window.location.reload()
}

const closeLoginModal = () => {
  loginModal.value = false
  loginForm.username = ''
  loginForm.password = ''
}

const scrollToSection = (href) => {
  mobileMenuOpen.value = false
  
  if (href.startsWith('/#')) {
    // 触发全局事件，通知 Home.vue 隐藏欢迎页面
    window.dispatchEvent(new CustomEvent('navbarClick', { detail: { href } }))
    
    // 尝试隐藏欢迎页面（如果存在）
    const welcomeSection = document.querySelector('.welcome-section') || document.querySelector('.fixed.inset-0.z-50')
    if (welcomeSection) {
      welcomeSection.style.display = 'none'
    }
    
    const sectionId = href.replace('/#', '')
    
    const scrollToElement = () => {
      setTimeout(() => {
        const element = document.getElementById(sectionId) 
        if (element) {
          // 滚动到目标元素，考虑导航栏高度
          const elementPosition = element.offsetTop - 70
          window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
    
    if (route.path === '/') {
      scrollToElement()
    } else {
      router.push('/').then(() => {
        setTimeout(scrollToElement, 150)
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
            @click="logout" 
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-500 transition-colors duration-300"
          >
            退出登录
          </button>
          <button 
            v-else 
            @click="loginModal = true" 
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
            @click="logout" 
            class="w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            退出登录
          </button>
          <button 
            v-else 
            @click="loginModal = true" 
            class="w-full px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            登录
          </button>
        </div>
      </div>
    </div>

    <!-- 登录模态框 -->
    <div v-if="loginModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click="closeLoginModal">
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative" @click.stop>
        <button @click="closeLoginModal" class="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
          <svg class="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-800">管理员登录</h3>
          <p class="text-gray-500 text-sm mt-2">请输入管理员账号密码</p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2">用户名</label>
            <input v-model="loginForm.username" type="text" placeholder="请输入用户名" class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors" />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2">密码</label>
            <input v-model="loginForm.password" type="password" placeholder="请输入密码" class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors" />
          </div>
          <button @click="login" class="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg">
            登录
          </button>
          <p class="text-center text-gray-400 text-xs mt-4">
            测试账号：admin / 123456
          </p>
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
