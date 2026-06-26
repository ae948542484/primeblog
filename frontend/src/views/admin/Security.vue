<script setup>
import { ref } from 'vue'

const API_BASE = '/api'

const usernameForm = ref({
  newUsername: '',
  currentPassword: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const usernameLoading = ref(false)
const passwordLoading = ref(false)

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json'
})

const updateUsername = async () => {
  if (!usernameForm.value.newUsername) {
    alert('请输入新用户名')
    return
  }
  if (!usernameForm.value.currentPassword) {
    alert('请输入当前密码')
    return
  }

  usernameLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/admin/update-username`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        newUsername: usernameForm.value.newUsername,
        currentPassword: usernameForm.value.currentPassword
      })
    })
    const result = await res.json()
    if (result.success) {
      alert('用户名修改成功！请重新登录')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      window.location.href = '/admin-login'
    } else {
      alert('修改失败：' + result.error)
    }
  } catch (e) {
    alert('修改失败，请稍后重试')
  } finally {
    usernameLoading.value = false
    usernameForm.value = { newUsername: '', currentPassword: '' }
  }
}

const updatePassword = async () => {
  if (!passwordForm.value.currentPassword) {
    alert('请输入当前密码')
    return
  }
  if (!passwordForm.value.newPassword) {
    alert('请输入新密码')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('新密码与确认密码不一致')
    return
  }

  passwordLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/admin/update-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      })
    })
    const result = await res.json()
    if (result.success) {
      alert('密码修改成功！请重新登录')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      window.location.href = '/admin-login'
    } else {
      alert('修改失败：' + result.error)
    }
  } catch (e) {
    alert('修改失败，请稍后重试')
  } finally {
    passwordLoading.value = false
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">账户安全</h2>
      <p class="text-gray-500 mt-1">保护您的账户安全，定期修改密码</p>
    </div>

    <div class="space-y-6">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-6">修改用户名</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">新用户名</label>
            <input 
              v-model="usernameForm.newUsername" 
              type="text" 
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              placeholder="请输入新用户名" 
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">当前密码</label>
            <input 
              v-model="usernameForm.currentPassword" 
              type="password" 
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              placeholder="请输入当前密码" 
            />
          </div>
          <div class="flex justify-end pt-4">
            <button 
              @click="updateUsername" 
              :disabled="usernameLoading"
              class="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {{ usernameLoading ? '修改中...' : '修改用户名' }}
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-6">修改密码</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">当前密码</label>
            <input 
              v-model="passwordForm.currentPassword" 
              type="password" 
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              placeholder="请输入当前密码" 
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">新密码</label>
            <input 
              v-model="passwordForm.newPassword" 
              type="password" 
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              placeholder="请输入新密码" 
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">确认新密码</label>
            <input 
              v-model="passwordForm.confirmPassword" 
              type="password" 
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              placeholder="请再次输入新密码" 
            />
          </div>
          <div class="flex justify-end pt-4">
            <button 
              @click="updatePassword" 
              :disabled="passwordLoading"
              class="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {{ passwordLoading ? '修改中...' : '修改密码' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>