<script setup>
import { ref, reactive, onMounted } from 'vue'

const postForm = reactive({
  title: '',
  category: '',
  content: ''
})

const categories = ['生活', '技术', '旅行', '美食', '读书', '其他']
const API_BASE = 'http://localhost:3001/api'

// 检查是否已登录
const isLoggedIn = () => {
  return localStorage.getItem('isLoggedIn') === 'true'
}

// 页面加载时检查登录状态
onMounted(() => {
  if (!isLoggedIn()) {
    alert('请先登录才能发布文章！')
    window.location.href = '/'
  }
})

const submitPost = async () => {
  // 提交前再次检查登录状态
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
    // 发送到后端 API
    const response = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: postForm.title,
        category: postForm.category,
        content: postForm.content
      })
    })

    if (response.ok) {
      // 清空表单
      postForm.title = ''
      postForm.category = ''
      postForm.content = ''
      alert('文章发布成功！🎉')
    } else {
      const error = await response.json()
      alert('发布失败：' + error.error)
    }
  } catch (error) {
    console.error('发布失败:', error)
    // 如果后端不可用，使用 localStorage 作为备份
    const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]')
    const newPost = {
      id: Date.now(),
      title: postForm.title,
      category: postForm.category,
      content: postForm.content,
      created_at: new Date().toISOString()
    }
    posts.push(newPost)
    localStorage.setItem('blogPosts', JSON.stringify(posts))
    
    postForm.title = ''
    postForm.category = ''
    postForm.content = ''
    alert('文章发布成功！（已保存到本地）🎉')
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
