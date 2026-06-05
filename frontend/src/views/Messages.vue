<script setup>
import { ref, onMounted, computed } from 'vue'

const messages = ref([])
const nickname = ref('')
const content = ref('')
const loading = ref(true)
const submitting = ref(false)

// 检查是否已登录（管理员）
const isLoggedIn = computed(() => {
  return localStorage.getItem('isLoggedIn') === 'true'
})

const fetchMessages = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/messages')
    if (response.ok) {
      messages.value = await response.json()
      // 同步到本地存储
      localStorage.setItem('messages', JSON.stringify(messages.value))
    }
  } catch (error) {
    console.error('获取留言失败:', error)
    // 如果后端不可用，使用 localStorage 作为备份
    const storedMessages = localStorage.getItem('messages')
    if (storedMessages) {
      messages.value = JSON.parse(storedMessages)
    }
  } finally {
    loading.value = false
  }
}

const submitMessage = async () => {
  if (!nickname.value.trim() || !content.value.trim()) {
    alert('请填写昵称和留言内容')
    return
  }
  
  submitting.value = true
  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickname: nickname.value,
        content: content.value
      })
    })
    
    if (response.ok) {
      nickname.value = ''
      content.value = ''
      await fetchMessages()
      alert('留言发表成功！🎉')
    }
  } catch (error) {
    console.error('发表留言失败:', error)
    // 如果后端不可用，使用 localStorage 作为备份
    const localMessages = JSON.parse(localStorage.getItem('messages') || '[]')
    const newMessage = {
      id: Date.now(),
      nickname: nickname.value,
      content: content.value,
      created_at: new Date().toISOString()
    }
    localMessages.push(newMessage)
    localStorage.setItem('messages', JSON.stringify(localMessages))
    
    // 更新本地显示
    messages.value.push(newMessage)
    nickname.value = ''
    content.value = ''
    alert('留言发表成功！（已保存到本地）🎉')
  } finally {
    submitting.value = false
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  fetchMessages()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-light">
    <div class="py-12 px-6">
      <div class="max-w-4xl mx-auto">
        <h1 class="section-title">留言板</h1>
        
        <!-- 留言表单（仅访客可见） -->
        <div v-if="!isLoggedIn" class="card p-8 mb-8">
          <h2 class="text-xl font-bold text-primary-500 mb-6">发表留言</h2>
          
          <form @submit.prevent="submitMessage" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">昵称</label>
              <input 
                v-model="nickname"
                type="text"
                class="input-field"
                placeholder="请输入您的昵称"
                maxlength="20"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">留言内容</label>
              <textarea 
                v-model="content"
                class="input-field min-h-[120px] resize-none"
                placeholder="请输入留言内容..."
                maxlength="500"
              ></textarea>
            </div>
            
            <button 
              type="submit"
              :disabled="submitting"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ submitting ? '提交中...' : '发表留言' }}
            </button>
          </form>
        </div>
        
        <!-- 管理员提示（仅登录用户可见） -->
        <div v-else class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 border border-blue-200 text-center mb-8">
          <div class="text-6xl mb-4">👑</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Welcome Back, Admin!</h3>
          <p class="text-gray-600">留言功能仅对访客开放，您可以查看所有留言。</p>
        </div>

        <div class="card p-8">
          <h2 class="text-xl font-bold text-primary-500 mb-6">
            留言列表
            <span class="text-sm text-gray-400 font-normal">({{ messages.length }} 条)</span>
          </h2>
          
          <div v-if="loading" class="text-center py-12">
            <div class="text-gray-400">加载中...</div>
          </div>

          <div v-else-if="messages.length === 0" class="text-center py-12">
            <div class="text-gray-400">暂无留言，快来发表第一条吧！</div>
          </div>

          <div v-else class="space-y-6">
            <div 
              v-for="message in messages" 
              :key="message.id"
              class="border-b border-gray-100 last:border-0 pb-6 last:pb-0"
            >
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center text-white font-bold text-sm">
                  {{ message.nickname.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="font-semibold text-primary-500">{{ message.nickname }}</div>
                  <div class="text-xs text-gray-400">{{ formatDate(message.created_at) }}</div>
                </div>
              </div>
              <p class="text-gray-700 pl-13">{{ message.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pl-13 {
  padding-left: 3.25rem;
}
</style>
