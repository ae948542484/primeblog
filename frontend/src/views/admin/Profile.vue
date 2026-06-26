<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = '/api'

const loading = ref(false)
const saving = ref(false)

const form = ref({
  nickname: '',
  bio: '',
  avatar: ''
})

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json'
})

const loadProfile = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/authors/me`)
    const result = await res.json()
    if (result.success && result.data) {
      form.value = {
        nickname: result.data.nickname || '',
        bio: result.data.bio || '',
        avatar: result.data.avatar || ''
      }
    }
  } catch (e) {
    console.error('加载失败', e)
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  try {
    const res = await fetch(`${API_BASE}/authors/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(form.value)
    })
    const result = await res.json()
    if (result.success) {
      alert('保存成功！')
    } else {
      alert('保存失败：' + result.error)
    }
  } catch (e) {
    alert('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">博主信息</h2>
      <button @click="loadProfile" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
        重置
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else class="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">昵称</label>
          <input v-model="form.nickname" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="输入博主昵称" />
          <p class="text-xs text-gray-500 mt-1">显示在博客首页的作者名称</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">头像 URL</label>
          <input v-model="form.avatar" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="例如：https://example.com/avatar.jpg" />
          <p class="text-xs text-gray-500 mt-1">博主头像图片地址</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
          <textarea v-model="form.bio" rows="4" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="简单介绍一下你自己..."></textarea>
        </div>

        <div class="pt-4">
          <button @click="saveProfile" :disabled="saving" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
            {{ saving ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
