<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_BASE = '/api'

const posts = ref([])
const loading = ref(false)
const showEditModal = ref(false)
const editingPost = ref(null)

const form = ref({
  title: '',
  content: '',
  summary: '',
  category: '',
  tags: [],
  status: 'published'
})

const tagColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

const getTagColor = (name) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return tagColors[Math.abs(hash) % tagColors.length]
}

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
  'Content-Type': 'application/json'
})

const loadPosts = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/posts?page=1&pageSize=100`)
    const result = await res.json()
    if (result.success) {
      posts.value = result.data.records || []
    }
  } catch (e) {
    console.error('加载失败', e)
  } finally {
    loading.value = false
  }
}

const openEdit = (post) => {
  editingPost.value = post
  form.value = {
    title: post.title || '',
    content: post.content || '',
    summary: post.summary || '',
    category: post.category || '',
    tags: post.tagNames || [],
    status: post.status || 'published'
  }
  showEditModal.value = true
}

const closeEdit = () => {
  showEditModal.value = false
  editingPost.value = null
}

const savePost = async () => {
  if (!form.value.title.trim()) {
    alert('请输入标题')
    return
  }
  
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: form.value.title,
        content: form.value.content,
        summary: form.value.summary,
        category: form.value.category,
        tags: form.value.tags,
        status: form.value.status
      })
    })
    const result = await res.json()
    if (result.success) {
      alert('发布成功')
      closeEdit()
      loadPosts()
    } else {
      alert('发布失败：' + result.error)
    }
  } catch (e) {
    alert('发布失败')
  }
}

const updatePost = async () => {
  if (!editingPost.value) return
  
  try {
    const res = await fetch(`${API_BASE}/posts/${editingPost.value.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: form.value.title,
        content: form.value.content,
        summary: form.value.summary,
        category: form.value.category,
        tags: form.value.tags,
        status: form.value.status
      })
    })
    const result = await res.json()
    if (result.success) {
      alert('更新成功')
      closeEdit()
      loadPosts()
    } else {
      alert('更新失败：' + result.error)
    }
  } catch (e) {
    alert('更新失败')
  }
}

const deletePost = async (post) => {
  if (!confirm(`确定删除文章「${post.title}」吗？`)) return
  
  try {
    const res = await fetch(`${API_BASE}/posts/${post.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    const result = await res.json()
    if (result.success) {
      alert('删除成功')
      loadPosts()
    } else {
      alert('删除失败：' + result.error)
    }
  } catch (e) {
    alert('删除失败')
  }
}

const goWrite = () => {
  router.push('/create')
}

onMounted(loadPosts)
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">文章管理</h2>
      <div class="flex gap-3">
        <button @click="loadPosts" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          刷新
        </button>
        <button @click="goWrite" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          写新文章
        </button>
      </div>
    </div>

    <!-- 文章列表 -->
    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标签</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">浏览</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">点赞</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收藏</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="post in posts" :key="post.id" class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900">{{ post.title }}</div>
              <div class="text-sm text-gray-500 truncate max-w-xs">{{ post.summary || post.content?.slice(0, 50) }}...</div>
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                <span 
                  v-for="tag in (post.tagNames || [])" 
                  :key="tag"
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :style="{ backgroundColor: getTagColor(tag) + '20', color: getTagColor(tag) }"
                >
                  {{ tag }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 text-gray-600">{{ post.views || 0 }}</td>
            <td class="px-6 py-4 text-gray-600">{{ post.likes || 0 }}</td>
            <td class="px-6 py-4 text-gray-600">{{ post.favorites || 0 }}</td>
            <td class="px-6 py-4 text-gray-500 text-sm">{{ post.created_at?.slice(0, 10) }}</td>
            <td class="px-6 py-4 text-right">
              <button @click="openEdit(post)" class="text-blue-600 hover:text-blue-800 mr-3">编辑</button>
              <button @click="deletePost(post)" class="text-red-600 hover:text-red-800">删除</button>
            </td>
          </tr>
          <tr v-if="posts.length === 0">
            <td colspan="7" class="px-6 py-12 text-center text-gray-500">
              暂无文章，<button @click="goWrite" class="text-blue-500 hover:underline">去写一篇</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="closeEdit">
      <div class="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div class="p-6 border-b">
          <h3 class="text-xl font-bold">{{ editingPost ? '编辑文章' : '发布文章' }}</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">标题</label>
            <input v-model="form.title" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="输入文章标题" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">摘要</label>
            <input v-model="form.summary" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="输入文章摘要" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <input v-model="form.category" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="输入分类名称" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">标签（用逗号分隔）</label>
            <input :value="form.tags.join(', ')" @input="form.tags = $event.target.value.split(',').map(t => t.trim()).filter(t => t)" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Vue3, TypeScript, 前端" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">内容</label>
            <textarea v-model="form.content" rows="10" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="输入文章内容（支持 Markdown）"></textarea>
          </div>
        </div>
        <div class="p-6 border-t flex justify-end gap-3">
          <button @click="closeEdit" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
          <button v-if="editingPost" @click="updatePost" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">保存修改</button>
          <button v-else @click="savePost" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">发布文章</button>
        </div>
      </div>
    </div>
  </div>
</template>
