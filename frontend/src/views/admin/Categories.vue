<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = '/api'

const categories = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingCategory = ref(null)

const form = ref({
  name: '',
  slug: '',
  description: ''
})

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json'
})

const loadCategories = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/categories`)
    const result = await res.json()
    if (result.success) {
      categories.value = result.data || []
    }
  } catch (e) {
    console.error('加载失败', e)
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  editingCategory.value = null
  form.value = { name: '', slug: '', description: '' }
  showModal.value = true
}

const openEdit = (cat) => {
  editingCategory.value = cat
  form.value = { 
    name: cat.name, 
    slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'), 
    description: cat.description || '' 
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingCategory.value = null
}

const generateSlug = () => {
  form.value.slug = form.value.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

const saveCategory = async () => {
  if (!form.value.name.trim()) {
    alert('请输入分类名称')
    return
  }
  
  if (!form.value.slug) {
    generateSlug()
  }
  
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(form.value)
    })
    const result = await res.json()
    if (result.success) {
      alert('添加成功')
      closeModal()
      loadCategories()
    } else {
      alert('添加失败：' + result.error)
    }
  } catch (e) {
    alert('添加失败')
  }
}

const updateCategory = async () => {
  if (!editingCategory.value) return
  
  try {
    // 查找对应的 API 端点（如果需要 slug 参数）
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...form.value, id: editingCategory.value.id })
    })
    const result = await res.json()
    if (result.success) {
      alert('更新成功')
      closeModal()
      loadCategories()
    } else {
      alert('更新失败：' + result.error)
    }
  } catch (e) {
    alert('更新失败')
  }
}

const deleteCategory = async (cat) => {
  if (!confirm(`确定删除分类「${cat.name}」吗？`)) return
  
  try {
    // 尝试使用 slug 删除
    const res = await fetch(`${API_BASE}/categories/${cat.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    const result = await res.json()
    if (result.success) {
      alert('删除成功')
      loadCategories()
    } else {
      alert('删除失败：' + result.error)
    }
  } catch (e) {
    alert('删除失败')
  }
}

onMounted(loadCategories)
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">分类管理</h2>
      <div class="flex gap-3">
        <button @click="loadCategories" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          刷新
        </button>
        <button @click="openAdd" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          添加分类
        </button>
      </div>
    </div>

    <!-- 分类列表 -->
    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文章数</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="cat in categories" :key="cat.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-900">{{ cat.name }}</td>
            <td class="px-6 py-4 text-gray-500 font-mono text-sm">{{ cat.slug }}</td>
            <td class="px-6 py-4 text-gray-500">{{ cat.description || '-' }}</td>
            <td class="px-6 py-4 text-gray-500">{{ cat.count || 0 }}</td>
            <td class="px-6 py-4 text-right">
              <button @click="openEdit(cat)" class="text-blue-600 hover:text-blue-800 mr-3">编辑</button>
              <button @click="deleteCategory(cat)" class="text-red-600 hover:text-red-800">删除</button>
            </td>
          </tr>
          <tr v-if="categories.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-gray-500">
              暂无分类，<button @click="openAdd" class="text-blue-500 hover:underline">去添加</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="closeModal">
      <div class="bg-white rounded-xl w-full max-w-md p-6">
        <h3 class="text-xl font-bold mb-6">{{ editingCategory ? '编辑分类' : '添加分类' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类名称</label>
            <input v-model="form.name" @input="generateSlug" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="输入分类名称" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Slug（URL 别名）</label>
            <input v-model="form.slug" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="auto-generated-from-name" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea v-model="form.description" rows="3" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="输入分类描述（可选）"></textarea>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end gap-3">
          <button @click="closeModal" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
          <button v-if="editingCategory" @click="updateCategory" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">保存</button>
          <button v-else @click="saveCategory" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>
