<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import titleImage from '../assets/title.jpeg'

const API_BASE = '/api'

const route = useRoute()
const article = ref(null)
const loading = ref(true)
const likes = ref(0)
const favorites = ref(0)
const views = ref(0)

const blogInfo = ref({
  nickname: 'angela edward',
  avatar: titleImage
})

const fmtDate = (d) => (d ? d.slice(0, 16).replace('T', ' ') : '')

const loadArticle = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const res = await fetch(`${API_BASE}/posts/${id}`)
    const result = await res.json()
    if (result.success && result.data) {
      article.value = result.data
      likes.value = result.data.likes || 0
      favorites.value = result.data.favorites || 0
      views.value = result.data.views || 0
      
      recordView()
    }
  } catch (e) {
    console.error('加载文章失败', e)
  } finally {
    loading.value = false
  }
}

const loadBlogInfo = async () => {
  try {
    const res = await fetch(`${API_BASE}/authors/me`)
    const result = await res.json()
    if (result.success && result.data) {
      blogInfo.value = { ...blogInfo.value, ...result.data }
    }
  } catch {
    /* ignore */
  }
}

const recordView = async () => {
  try {
    await fetch(`${API_BASE}/views/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pagePath: `/article/${route.params.id}`,
        referer: document.referrer
      })
    })
    
    const res = await fetch(`${API_BASE}/posts/${route.params.id}`)
    const result = await res.json()
    if (result.success && result.data) {
      views.value = result.data.views || 0
    }
  } catch {
    /* ignore */
  }
}

const handleLike = async () => {
  try {
    const res = await fetch(`${API_BASE}/posts/${route.params.id}/like`, {
      method: 'POST'
    })
    const result = await res.json()
    if (result.success) {
      likes.value = result.data.likes
    }
  } catch {
    /* ignore */
  }
}

const handleFavorite = async () => {
  try {
    const res = await fetch(`${API_BASE}/posts/${route.params.id}/favorite`, {
      method: 'POST'
    })
    const result = await res.json()
    if (result.success) {
      favorites.value = result.data.favorites
    }
  } catch {
    /* ignore */
  }
}

const tagColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF8C00',
  '#9370DB', '#00FA9A', '#FFD700', '#FF4500', '#20B2AA'
]

const getTagColor = (name) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return tagColors[Math.abs(hash) % tagColors.length]
}

onMounted(() => {
  loadArticle()
  loadBlogInfo()
})
</script>

<template>
  <div class="article-detail">
    <div v-if="loading" class="loading-wrap">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="article" class="article-content">
      <header class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <div class="author-info">
            <img :src="blogInfo.avatar || titleImage" class="author-avatar" />
            <span class="author-name">{{ blogInfo.nickname }}</span>
          </div>
          <span class="meta-divider">|</span>
          <span class="meta-item">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            {{ fmtDate(article.created_at) }}
          </span>
          <span v-if="article.updated_at && article.updated_at !== article.created_at" class="meta-item">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            更新于 {{ fmtDate(article.updated_at) }}
          </span>
        </div>
        <div class="article-tags" v-if="article.tagNames && article.tagNames.length">
          <span
            v-for="tag in article.tagNames"
            :key="tag"
            class="tag-badge"
            :style="{ backgroundColor: getTagColor(tag) + '20', color: getTagColor(tag) }"
          >
            #{{ tag }}
          </span>
        </div>
      </header>

      <div v-if="article.cover_image" class="article-cover">
        <img :src="article.cover_image" :alt="article.title" />
      </div>

      <article class="article-body" v-html="article.content"></article>

      <footer class="article-footer">
        <div class="article-stats">
          <span class="stat-item">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            {{ views }}
          </span>
          <button class="stat-item like-btn" @click="handleLike">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
            {{ likes }}
          </button>
          <button class="stat-item favorite-btn" @click="handleFavorite">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
            {{ favorites }}
          </button>
        </div>
      </footer>
    </div>

    <div v-else class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h3>文章不存在</h3>
      <p>抱歉，您访问的文章可能已被删除或不存在</p>
    </div>
  </div>
</template>

<style scoped>
.article-detail {
  min-height: calc(100vh - 80px);
  padding-top: 80px;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-wrap p {
  margin-top: 16px;
  color: #909399;
}

.article-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.article-header {
  text-align: center;
  margin-bottom: 40px;
}

.article-title {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1.4;
  margin-bottom: 24px;
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 14px;
  color: #909399;
  flex-wrap: wrap;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-weight: 500;
  color: #606266;
}

.meta-divider {
  color: #e4e7ed;
}

.meta-item {
  display: flex;
  align-items: center;
}

.article-tags {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.tag-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.article-cover {
  margin-bottom: 40px;
  border-radius: 12px;
  overflow: hidden;
}

.article-cover img {
  width: 100%;
  height: auto;
  display: block;
}

.article-body {
  color: #303133;
  font-size: 16px;
  line-height: 1.8;
}

.article-body h1, .article-body h2, .article-body h3, .article-body h4, .article-body h5, .article-body h6 {
  font-weight: 600;
  margin-top: 32px;
  margin-bottom: 16px;
  color: #303133;
}

.article-body h1 { font-size: 24px; }
.article-body h2 { font-size: 22px; }
.article-body h3 { font-size: 20px; }
.article-body h4 { font-size: 18px; }

.article-body p {
  margin-bottom: 16px;
}

.article-body a {
  color: #3b82f6;
  text-decoration: underline;
}

.article-body img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
}

.article-body code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.article-body pre {
  background: #1a1a1a;
  color: #fff;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

.article-body pre code {
  background: none;
  padding: 0;
  color: inherit;
}

.article-body blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 16px;
  margin: 16px 0;
  color: #606266;
  font-style: italic;
}

.article-body ul, .article-body ol {
  padding-left: 24px;
  margin-bottom: 16px;
}

.article-body li {
  margin-bottom: 8px;
}

.article-footer {
  margin-top: 60px;
  padding-top: 30px;
  border-top: 1px solid #ebeef5;
}

.article-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #909399;
  cursor: pointer;
  transition: all 0.2s;
}

.stat-item:hover {
  color: #3b82f6;
}

.like-btn:hover svg {
  fill: #ef4444;
  color: #ef4444;
}

.favorite-btn:hover svg {
  fill: #f59e0b;
  color: #f59e0b;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: #d9d9d9;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.empty-state p {
  color: #909399;
  font-size: 14px;
}

@media (max-width: 600px) {
  .article-title {
    font-size: 24px;
  }
  
  .article-content {
    padding: 20px 16px;
  }
  
  .article-stats {
    gap: 24px;
  }
}
</style>