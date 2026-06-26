<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = '/api'

const tags = ref([])
const loading = ref(false)
const showAddModal = ref(false)
const editingTag = ref(null)

const form = ref({
  name: '',
  color: '#4ECDC4'
})

const colorOptions = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF8C00'
]

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json'
})

const loadTags = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/tags`)
    const result = await res.json()
    if (result.success) {
      tags.value = result.data || []
    }
  } catch (e) {
    console.error('加载失败', e)
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  editingTag.value = null
  form.value = { name: '', color: '#4ECDC4' }
  showAddModal.value = true
}

const openEdit = (tag) => {
  editingTag.value = tag
  form.value = { name: tag.name, color: tag.color }
  showAddModal.value = true
}

const closeModal = () => {
  showAddModal.value = false
  editingTag.value = null
}

const saveTag = async () => {
  if (!form.value.name.trim()) {
    alert('请输入标签名称')
    return
  }
  
  try {
    const res = await fetch(`${API_BASE}/tags`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(form.value)
    })
    const result = await res.json()
    if (result.success) {
      alert('添加成功')
      closeModal()
      loadTags()
    } else {
      alert('添加失败：' + result.error)
    }
  } catch (e) {
    alert('添加失败')
  }
}

const updateTag = async () => {
  if (!editingTag.value) return
  
  try {
    const res = await fetch(`${API_BASE}/tags/${editingTag.value.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(form.value)
    })
    const result = await res.json()
    if (result.success) {
      alert('更新成功')
      closeModal()
      loadTags()
    } else {
      alert('更新失败：' + result.error)
    }
  } catch (e) {
    alert('更新失败')
  }
}

const deleteTag = async (tag) => {
  if (!confirm(`确定删除标签「${tag.name}」吗？`)) return
  
  try {
    const res = await fetch(`${API_BASE}/tags/${tag.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    const result = await res.json()
    if (result.success) {
      alert('删除成功')
      loadTags()
    } else {
      alert('删除失败：' + result.error)
    }
  } catch (e) {
    alert('删除失败')
  }
}

onMounted(loadTags)
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">标签管理</h2>
      <div class="flex gap-3">
        <button @click="loadTags" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          刷新
        </button>
        <button @click="openAdd" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          添加标签
        </button>
      </div>
    </div>

    <!-- 标签列表 -->
    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div v-for="tag in tags" :key="tag.id" class="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center">
        <div 
          class="w-12 h-12 rounded-full flex items-center justify-center mb-3"
          :style="{ backgroundColor: tag.color + '20' }"
        >
          <span 
            class="text-lg font-bold"
            :style="{ color: tag.color }"
          >
            #
          </span>
        </div>
        <div class="font-medium text-gray-900 mb-1">{{ tag.name }}</div>
        <div class="text-sm text-gray-500 mb-3">{{ tag.count || 0 }} 篇文章</div>
        <div class="flex gap-2">
          <button @click="openEdit(tag)" class="text-blue-500 hover:text-blue-700 text-sm">编辑</button>
          <button @click="deleteTag(tag)" class="text-red-500 hover:text-red-700 text-sm">删除</button>
        </div>
      </div>
      <div v-if="tags.length === 0" class="col-span-full text-center py-12 text-gray-500">
        暂无标签
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="closeModal">
      <div class="bg-white rounded-xl w-full max-w-md p-6">
        <h3 class="text-xl font-bold mb-6">{{ editingTag ? '编辑标签' : '添加标签' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">标签名称</label>
            <input v-model="form.name" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="输入标签名称" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">标签颜色</label>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="color in colorOptions" 
                :key="color"
                @click="form.color = color"
                class="w-8 h-8 rounded-full transition-transform hover:scale-110"
                :class="form.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''"
                :style="{ backgroundColor: color }"
              ></button>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <input v-model="form.color" type="color" class="w-10 h-10 rounded cursor-pointer" />
              <input v-model="form.color" type="text" class="flex-1 px-3 py-1 border rounded text-sm" placeholder="#FFFFFF" />
            </div>
          </div>
          
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">预览</label>
            <div 
              class="inline-block px-4 py-2 rounded-lg"
              :style="{ backgroundColor: form.color + '20', color: form.color }"
            >
              #{{ form.name || '标签名' }}
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end gap-3">
          <button @click="closeModal" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
          <button v-if="editingTag" @click="updateTag" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">保存</button>
          <button v-else @click="saveTag" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>
