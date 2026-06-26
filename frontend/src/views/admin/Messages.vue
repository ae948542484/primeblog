<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = '/api'

const messages = ref([])
const loading = ref(false)

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
})

const loadMessages = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/messages`)
    const result = await res.json()
    if (result.success) {
      messages.value = result.data || []
    }
  } catch (e) {
    console.error('加载失败', e)
  } finally {
    loading.value = false
  }
}

const deleteMessage = async (msg) => {
  if (!confirm(`确定删除「${msg.nickname}」的留言吗？`)) return
  
  try {
    const res = await fetch(`${API_BASE}/messages/${msg.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    const result = await res.json()
    if (result.success) {
      alert('删除成功')
      loadMessages()
    } else {
      alert('删除失败：' + result.error)
    }
  } catch (e) {
    alert('删除失败')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(loadMessages)
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">留言管理</h2>
      <button @click="loadMessages" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
        刷新
      </button>
    </div>

    <!-- 留言列表 -->
    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else class="space-y-4">
      <div v-for="msg in messages" :key="msg.id" class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <span class="font-medium text-gray-900">{{ msg.nickname }}</span>
            <span v-if="msg.email" class="ml-2 text-sm text-gray-400">({{ msg.email }})</span>
            <span v-if="msg.is_secret === 1" class="ml-2 px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">悄悄话</span>
            <span v-if="msg.parent_id" class="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">回复</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-400">{{ formatDate(msg.created_at) }}</span>
            <button @click="deleteMessage(msg)" class="text-red-500 hover:text-red-700 text-sm">删除</button>
          </div>
        </div>
        
        <div class="text-gray-700 whitespace-pre-wrap">{{ msg.content }}</div>
        
        <div v-if="msg.reply_content" class="mt-4 pl-4 border-l-2 border-blue-200 bg-blue-50 rounded-r-lg p-4">
          <div class="text-sm text-blue-600 font-medium mb-2">博主回复：</div>
          <div class="text-gray-700">{{ msg.reply_content }}</div>
        </div>
        
        <div v-if="msg.parent_content" class="mt-4 pl-4 border-l-2 border-gray-200 bg-gray-50 rounded-r-lg p-4">
          <div class="text-sm text-gray-500 mb-1">回复 {{ msg.parent_nickname }}：</div>
          <div class="text-gray-600">{{ msg.parent_content }}</div>
        </div>
      </div>
      
      <div v-if="messages.length === 0" class="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
        暂无留言
      </div>
    </div>
  </div>
</template>
