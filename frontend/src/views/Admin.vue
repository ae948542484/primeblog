<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoading = ref(false)
const loginForm = reactive({
  username: '',
  password: ''
})
const error = ref('')

const login = async () => {
  if (!loginForm.username || !loginForm.password) {
    error.value = '请输入用户名和密码'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: loginForm.username,
        password: loginForm.password
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      localStorage.setItem('auth_token', data.data.token)
      localStorage.setItem('user_data', JSON.stringify(data.data.user))
      router.push('/admin')
    } else {
      error.value = data.error || '登录失败，请检查用户名和密码'
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const isLoggedIn = !!localStorage.getItem('auth_token')

onMounted(() => {
  if (isLoggedIn) {
    router.push('/admin')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-2xl">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">博主后台</h1>
        <p class="text-slate-400">管理你的博客内容</p>
      </div>
      
      <!-- Login Form -->
      <div class="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
        <div class="space-y-6">
          <div>
            <label class="block text-slate-300 text-sm font-medium mb-2">用户名</label>
            <input 
              v-model="loginForm.username" 
              type="text" 
              placeholder="请输入用户名"
              class="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
              @keyup.enter="login"
            />
          </div>
          
          <div>
            <label class="block text-slate-300 text-sm font-medium mb-2">密码</label>
            <input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="请输入密码"
              class="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
              @keyup.enter="login"
            />
          </div>
          
          <div v-if="error" class="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p class="text-red-400 text-sm text-center">{{ error }}</p>
          </div>
          
          <button 
            @click="login" 
            :disabled="isLoading"
            class="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            <svg v-if="isLoading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
          
          <div class="text-center pt-4 border-t border-white/10">
            <p class="text-slate-500 text-sm">
              测试账号：<span class="text-slate-300">admin</span> / <span class="text-slate-300">123456</span>
            </p>
          </div>
        </div>
      </div>
      
      <!-- Back to home -->
      <div class="text-center mt-6">
        <router-link to="/" class="text-slate-500 hover:text-slate-300 text-sm transition-colors">
          ← 返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>
