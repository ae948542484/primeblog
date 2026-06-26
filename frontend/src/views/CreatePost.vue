<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'

const postForm = reactive({
  title: '',
  category: '',
  content: ''
})

const categories = ['生活', '技术', '旅行', '美食', '读书', '其他']
const API_BASE = '/api'

const isLoggedIn = () => {
  const token = localStorage.getItem('auth_token')
  return !!token
}

onMounted(() => {
  if (!isLoggedIn()) {
    alert('请先登录才能发布文章！')
    window.location.href = '/'
  }
})

const submitPost = async () => {
  if (!isLoggedIn()) {
    alert('请先登录才能发布文章！')
    window.location.href = '/'
    return
  }
  
  if (!postForm.title.trim()) {
    alert('请输入文章标题！')
    return
  }
  if (!postForm.category) {
    alert('请选择文章分类！')
    return
  }
  if (!postForm.content.trim()) {
    alert('请输入文章内容！')
    return
  }

  try {
    const token = localStorage.getItem('auth_token')
    const response = await axios.post(`${API_BASE}/posts`, {
      title: postForm.title,
      category: postForm.category,
      content: postForm.content
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.data.success) {
      postForm.title = ''
      postForm.category = ''
      postForm.content = ''
      alert('文章发布成功！🎉')
    } else {
      alert('发布失败：' + response.data.error)
    }
  } catch (error) {
    console.error('发布失败:', error)
    alert('发布失败，请稍后重试')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-light">
    <div class="py-12 px-6">
      <div class="max-w-2xl mx-auto">
        <h1 class="section-title">发布文章</h1>
        
        <div class="card p-8">
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">文章标题</label>
            <input 
              v-model="postForm.title"
              type="text"
              placeholder="请输入文章标题"
              class="input-field"
              maxlength="100"
            />
          </div>
          
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">文章分类</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cat in categories"
                :key="cat"
                @click="postForm.category = cat"
                :class="[
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  postForm.category === cat 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                {{ cat }}
              </button>
            </div>
          </div>
          
          <div class="mb-8">
            <label class="block text-sm font-medium text-gray-700 mb-2">文章内容</label>
            <textarea 
              v-model="postForm.content"
              class="input-field min-h-[300px] resize-none"
              placeholder="请输入文章内容..."
              maxlength="5000"
            ></textarea>
            <p class="text-xs text-gray-400 mt-2 text-right">{{ postForm.content.length }}/5000</p>
          </div>
          
          <button 
            @click="submitPost"
            class="btn-primary w-full"
          >
            发布文章
          </button>
        </div>
      </div>
    </div>
  </div>
</template>