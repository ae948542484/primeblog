<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import titleImage from '../assets/title.jpeg'

const API_BASE = '/api'

const route = useRoute()
const router = useRouter()

const articles = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const loading = ref(false)
const searchKeyword = ref('')
const currentTag = ref('')
const currentCategory = ref('')

const blogInfo = ref({
  nickname: 'angela edward',
  avatar: titleImage,
  tag: '',
  location: '',
  github: '',
  email: ''
})

const tags = ref([])
const categories = ref([])

const report = ref({
  articleTotalCount: 0,
  categoryTotalCount: 0,
  tagTotalCount: 0,
  viewTodayCount: 0,
  viewTotalCount: 0,
  visitorTotalCount: 0,
  onlineCount: 0
})

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

let ws = null

const loadArticles = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize)
    if (searchKeyword.value) {
      params.append('search', searchKeyword.value)
    }
    if (currentTag.value) {
      params.append('tag', currentTag.value)
    }
    if (currentCategory.value) {
      params.append('category', currentCategory.value)
    }
    
    const res = await fetch(`${API_BASE}/posts?${params}`)
    const result = await res.json()
    if (result.success) {
      articles.value = result.data.records ?? []
      total.value = result.data.total ?? 0
    }
  } catch {
    articles.value = []
  } finally {
    loading.value = false
  }
}

const loadBlogInfo = async () => {
  try {
    const res = await fetch(`${API_BASE}/authors/me`)
    const result = await res.json()
    if (result.success && result.data) {
      blogInfo.value.tag = result.data.tag || blogInfo.value.tag
      blogInfo.value.location = result.data.location || blogInfo.value.location
      blogInfo.value.github = result.data.github || blogInfo.value.github
      blogInfo.value.email = result.data.email || blogInfo.value.email
    }
  } catch {
    /* ignore */
  }
}

const loadTags = async () => {
  try {
    const res = await fetch(`${API_BASE}/tags`)
    const result = await res.json()
    if (result.success) {
      tags.value = result.data.map(tag => ({
        ...tag,
        color: tag.color || getTagColor(tag.name)
      }))
    }
  } catch {
    /* ignore */
  }
}

const loadCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/categories`)
    const result = await res.json()
    if (result.success) {
      categories.value = result.data
    }
  } catch {
    /* ignore */
  }
}

const loadStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/report`)
    const result = await res.json()
    if (result.success) {
      report.value = { ...report.value, ...result.data }
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
        pagePath: '/blog',
        referer: document.referrer
      })
    })
  } catch {
    /* ignore */
  }
}

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}`
  
  try {
    ws = new WebSocket(wsUrl)
    ws.onopen = () => {
      console.log('WebSocket 连接成功')
    }
    ws.onmessage = (event) => {
      try {
        const count = parseInt(event.data)
        if (!isNaN(count)) {
          report.value.onlineCount = count
        }
      } catch {
        /* ignore */
      }
    }
    ws.onclose = () => {
      console.log('WebSocket 连接关闭')
    }
    ws.onerror = () => {
      console.log('WebSocket 连接错误')
    }
  } catch {
    console.log('WebSocket 连接失败')
  }
}

const handlePageChange = (p) => {
  page.value = p
  loadArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const fmtDate = (d) => (d ? d.slice(0, 16).replace('T', ' ') : '')

const goArticle = (slug) => {
  router.push(`/article/${slug}`)
}

const goTag = (tagName) => {
  router.push({ path: '/blog', query: { tag: tagName } })
}

const goCategory = (categoryName) => {
  router.push({ path: '/blog', query: { category: categoryName } })
}

watch(
  () => route.query,
  (query) => {
    searchKeyword.value = query.search || ''
    currentTag.value = query.tag || ''
    currentCategory.value = query.category || ''
    page.value = 1
    loadArticles()
  },
  { deep: true }
)

onMounted(() => {
  searchKeyword.value = route.query.search || ''
  currentTag.value = route.query.tag || ''
  currentCategory.value = route.query.category || ''
  loadArticles()
  loadBlogInfo()
  loadTags()
  loadCategories()
  loadStats()
  recordView()
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})
</script>

<template>
  <div class="home-page">
    <div class="home-content">
      <div class="article-col">
        <div v-if="searchKeyword || currentTag || currentCategory" class="search-result-tip">
  <span v-if="searchKeyword">搜索: <strong>{{ searchKeyword }}</strong></span>
  <span v-if="currentTag">标签: <strong>{{ currentTag }}</strong></span>
  <span v-if="currentCategory">分类: <strong>{{ currentCategory }}</strong></span>
  <span class="search-count">{{ total }} 篇结果</span>
  <a class="clear-search" @click="router.push('/blog')">&times; 清除</a>
</div>

        <div v-if="loading" class="loading-placeholder">
          <div v-for="i in 4" :key="i" class="skeleton-card">
            <div class="skeleton-cover" />
            <div class="skeleton-body">
              <div class="skeleton-line w60" />
              <div class="skeleton-line w90" />
              <div class="skeleton-line w40" />
            </div>
          </div>
        </div>

        <template v-else-if="articles.length">
          <div
            v-for="article in articles"
            :key="article.id"
            class="article-card"
            @click="goArticle(article.slug || article.id)"
          >
            <div v-if="article.cover_image" class="card-cover">
              <img :src="article.cover_image" :alt="article.title" loading="lazy" />
            </div>
            <div class="card-body">
              <div class="card-top">
                <span v-if="article.category" class="card-category">
                  <svg class="inline w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>{{ article.category }}
                </span>
                <span class="card-date">
                  <svg class="inline w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  {{ fmtDate(article.created_at) }}
                </span>
              </div>
              <h3 class="card-title">{{ article.title }}</h3>
              <p v-if="article.content" class="card-summary">
                {{ article.content.substring(0, 150) }}...
              </p>
              <div class="card-tags" v-if="article.tagNames && article.tagNames.length">
                <span
                  v-for="tag in article.tagNames"
                  :key="tag"
                  class="tag-item"
                  :style="{ backgroundColor: getTagColor(tag) + '20', color: getTagColor(tag) }"
                  @click.stop="goTag(tag)"
                >
                  #{{ tag }}
                </span>
              </div>
              <div class="card-meta">
                <span>
                  <svg class="inline w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>{{ article.views || 0 }}
                </span>
                <span>
                  <svg class="inline w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>{{ article.comments_count || 0 }}
                </span>
                <span>
                  <svg class="inline w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>{{ article.likes || 0 }}
                </span>
                <span v-if="article.word_count">
                  <svg class="inline w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>{{ article.word_count }} 字
                </span>
                <span v-if="article.reading_time">
                  <svg class="inline w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{{ article.reading_time }} 分钟
                </span>
              </div>
            </div>
          </div>
          <div v-if="total > pageSize" class="pagination-wrap">
            <div class="pagination">
              <button
                v-if="page > 1"
                class="page-btn"
                @click="handlePageChange(page - 1)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <span
                v-for="p in Math.min(5, Math.ceil(total / pageSize))"
                :key="p"
                :class="[
                  'page-num',
                  page === p ? 'active' : ''
                ]"
                @click="handlePageChange(p)"
              >
                {{ p }}
              </span>
              <button
                v-if="page < Math.ceil(total / pageSize)"
                class="page-btn"
                @click="handlePageChange(page + 1)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>
        </template>

        <div v-else class="empty-tip">暂无文章</div>
      </div>

      <aside class="sidebar">
        <div class="side-card info-card">
          <div class="info-avatar-wrap">
            <img
              :src="blogInfo.avatar"
              class="info-avatar"
              loading="lazy"
            />
          </div>
          <h3 class="info-name">{{ blogInfo.nickname }}</h3>
          <p v-if="blogInfo.tag" class="info-tag">{{ blogInfo.tag }}</p>
          <p v-if="blogInfo.location" class="info-location">
            <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            {{ blogInfo.location }}
          </p>

          <div class="info-stats">
            <div class="info-stat" @click="router.push('/archive')">
              <span class="stat-num">{{ report.articleTotalCount ?? 0 }}</span>
              <span class="stat-label">文章</span>
            </div>
            <div class="info-stat">
              <span class="stat-num">{{ report.categoryTotalCount ?? 0 }}</span>
              <span class="stat-label">分类</span>
            </div>
            <div class="info-stat">
              <span class="stat-num">{{ report.tagTotalCount ?? 0 }}</span>
              <span class="stat-label">标签</span>
            </div>
          </div>

          <div class="info-social">
            <a
              v-if="blogInfo.github"
              :href="blogInfo.github"
              target="_blank"
              rel="noopener"
              class="social-link"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 .3a12 12 0 00-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.33 3.3 1.23a11.5 11.5 0 016.02 0c2.28-1.56 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18a4.65 4.65 0 011.23 3.22c0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22l-.01 3.29c0 .31.22.69.83.57A12 12 0 0012 .3"/>
              </svg>
            </a>
            <a
              v-if="blogInfo.email"
              :href="`mailto:${blogInfo.email}`"
              class="social-link"
              title="Email"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/>
              </svg>
            </a>
          </div>
        </div>

        <div class="side-card stats-card">
          <h4 class="card-title">
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            站点统计
          </h4>
          <div class="stats-grid">
            <div class="sg-item">
              <span class="sg-label">在线访客</span>
              <span class="sg-val online-val">{{ report.onlineCount ?? 0 }}</span>
            </div>
            <div class="sg-item">
              <span class="sg-label">今日浏览</span>
              <span class="sg-val">{{ report.viewTodayCount ?? 0 }}</span>
            </div>
            <div class="sg-item">
              <span class="sg-label">总浏览量</span>
              <span class="sg-val">{{ report.viewTotalCount ?? 0 }}</span>
            </div>
            <div class="sg-item">
              <span class="sg-label">总访客量</span>
              <span class="sg-val">{{ report.visitorTotalCount ?? 0 }}</span>
            </div>
          </div>
        </div>

        <div class="side-card categories-card">
          <h4 class="card-title">
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            文章分类
          </h4>
          <div class="categories-list">
            <span
              v-for="cat in categories"
              :key="cat.id"
              class="category-item"
              @click="goCategory(cat.name)"
            >
              <span class="cat-name">{{ cat.name }}</span>
              <span class="cat-count">{{ cat.articleCount }}</span>
            </span>
          </div>
        </div>

        <div class="side-card tags-card">
          <h4 class="card-title">
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
            标签云
          </h4>
          <div class="tags-list">
            <span
              v-for="tag in tags"
              :key="tag.id"
              class="tag-cloud-item"
              :style="{ backgroundColor: tag.color + '20', color: tag.color }"
              @click="goTag(tag.name)"
            >
              {{ tag.name }}
              <span class="tag-count">{{ tag.articleCount || tag.count }}</span>
            </span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
}
.home-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.article-col {
  flex: 1;
  min-width: 0;
}

.search-result-tip {
  padding: 12px 16px;
  font-size: 14px;
  color: #606266;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.search-count {
  color: #909399;
  font-size: 13px;
}
.clear-search {
  color: #303133;
  cursor: pointer;
  font-weight: 600;
  margin-left: auto;
}

@keyframes sk-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
.skeleton-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
}
.skeleton-cover {
  width: 200px;
  height: 130px;
  border-radius: 6px;
  flex-shrink: 0;
  background: linear-gradient(90deg, #ebeef5 25%, #f5f7fa 50%, #ebeef5 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.5s ease-in-out infinite;
}
.skeleton-body {
  flex: 1;
}
.skeleton-line {
  height: 14px;
  border-radius: 4px;
  margin-bottom: 10px;
  background: linear-gradient(90deg, #ebeef5 25%, #f5f7fa 50%, #ebeef5 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.5s ease-in-out infinite;
}
.w60 {
  width: 60%;
}
.w90 {
  width: 90%;
}
.w40 {
  width: 40%;
}

.article-card {
  display: flex;
  gap: 0;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s, transform 0.2s;
  margin-bottom: 16px;
  cursor: pointer;
}
.article-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}
.card-cover {
  flex-shrink: 0;
  width: 230px;
  min-height: 170px;
  overflow: hidden;
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}
.article-card:hover .card-cover img {
  transform: scale(1.05);
}

.card-body {
  flex: 1;
  min-width: 0;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}
.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #909399;
}
.card-top svg {
  font-size: 12px;
}
.card-category {
  color: #606266;
  font-weight: 500;
}
.card-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 6px;
  line-height: 1.4;
  color: #303133;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-summary {
  font-size: 13.5px;
  color: #606266;
  margin: 0 0 8px;
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.tag-item {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.tag-item:hover {
  transform: scale(1.05);
}
.card-meta {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: #909399;
  margin-top: auto;
}
.card-meta svg {
  font-size: 12px;
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
}
.page-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
  color: #606266;
  cursor: pointer;
  transition: all 0.15s;
}
.page-btn:hover {
  border-color: #303133;
  color: #303133;
}
.page-num {
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.15s;
}
.page-num:hover {
  background: #f5f7fa;
}
.page-num.active {
  background: #303133;
  color: #fff;
}
.empty-tip {
  padding: 60px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 74px;
}
.side-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #ebeef5;
  padding: 20px;
  margin-bottom: 16px;
}

.info-card {
  text-align: center;
}
.info-avatar-wrap {
  margin-bottom: 12px;
}
.info-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.info-avatar-letter {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e4e7ed;
  color: #606266;
  font-size: 36px;
  font-weight: 700;
  margin: 0 auto;
  border: 3px solid #ebeef5;
}
.info-name {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #303133;
}
.info-tag {
  font-size: 12px;
  color: #909399;
  margin: 0 0 6px;
}
.info-location {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 12px;
  color: #b0b0b0;
  margin: 0 0 14px;
}
.info-location svg {
  font-size: 13px;
}

.info-stats {
  display: flex;
  justify-content: center;
  gap: 0;
  padding: 12px 0;
  margin: 0 -20px;
}
.info-stat {
  flex: 1;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s;
  padding: 4px 0;
  border-radius: 4px;
}
.info-stat:hover {
  background: #f5f7fa;
}
.info-stat + .info-stat {
  border-left: 1px solid #ebeef5;
}
.stat-num {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}
.stat-label {
  font-size: 11px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-social {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 14px;
}
.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  color: #606266;
  cursor: pointer;
  background: none;
  transition: color 0.15s, background 0.15s;
}
.social-link:hover {
  color: #303133;
  background: #f5f7fa;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 12px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}
.card-title svg {
  font-size: 15px;
}
.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sg-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
}
.sg-label {
  flex: 1;
}
.sg-val {
  font-weight: 600;
  color: #303133;
}
.online-val {
  color: #4ECDC4;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  transition: all 0.15s;
}
.category-item:hover {
  background: #f5f7fa;
  color: #303133;
}
.cat-name {
  flex: 1;
  text-align: left;
}
.cat-count {
  font-size: 11px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 10px;
}
.category-item:hover .cat-count {
  background: #e4e7ed;
  color: #606266;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag-cloud-item {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.tag-cloud-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.tag-count {
  margin-left: 4px;
  opacity: 0.7;
  font-size: 11px;
}

@media (max-width: 960px) {
  .home-content {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    position: static;
  }
}
@media (max-width: 600px) {
  .search-result-tip {
    font-size: 13px;
    padding: 10px 12px;
  }
  .skeleton-card {
    flex-direction: column;
  }
  .skeleton-cover {
    width: 100%;
    height: 160px;
  }
  .article-card {
    flex-direction: column;
  }
  .card-cover {
    width: 100%;
    min-height: 180px;
  }
}
</style>