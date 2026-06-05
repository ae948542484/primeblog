<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import ViewSwitch from '../components/ViewSwitch.vue'
import PhotoFlip from '../components/PhotoFlip.vue'

const aliceCoverImage = new URL('../assets/alice_cover.jpg', import.meta.url).href
const currentPage = ref(0)
const currentView = ref('academic') // academic 或 life

// 检查是否已登录
const isLoggedIn = computed(() => {
  return localStorage.getItem('isLoggedIn') === 'true'
})

const formData = ref({
  name: '',
  sex: 'girl',
  interests: [],
  relationship: 'stranger',
  message: ''
})

const interestsOptions = ['Food', 'Shopping', 'Sports', 'Stars', 'Games']
const relationshipOptions = ['Stranger', 'Acquaintance', 'Friend', 'Bestie', 'Frenemy']

// 获取默认朋友列表
const getDefaultFriends = () => {
  const stored = localStorage.getItem('friendsList')
  if (stored) {
    return JSON.parse(stored)
  }
  // 默认示例数据
  return [
    { id: 1, name: 'Alice', sex: 'girl', interests: ['Food', 'Shopping'], relationship: 'bestie', message: 'Hi! Nice to meet you!', bgColor: 'bg-gradient-to-br from-pink-400 to-rose-500' },
    { id: 2, name: 'Bob', sex: 'boy', interests: ['Sports', 'Games'], relationship: 'friend', message: 'Let\'s play games together!', bgColor: 'bg-gradient-to-br from-blue-400 to-cyan-500' },
    { id: 3, name: 'Charlie', sex: 'other', interests: ['Stars', 'Food'], relationship: 'acquaintance', message: 'Nice channel!', bgColor: 'bg-gradient-to-br from-green-400 to-emerald-500' },
    { id: 4, name: 'Diana', sex: 'girl', interests: ['Shopping', 'Stars'], relationship: 'bestie', message: 'Love your style!', bgColor: 'bg-gradient-to-br from-purple-400 to-fuchsia-500' },
    { id: 5, name: 'Eve', sex: 'girl', interests: ['Food', 'Sports'], relationship: 'friend', message: 'Great content!', bgColor: 'bg-gradient-to-br from-orange-400 to-red-500' },
  ]
}

// 朋友列表数据（从 localStorage 读取）
const friendsList = ref(getDefaultFriends())

// 当前选中的朋友（用于查看详情）
const selectedFriend = ref(null)

// 随机颜色数组
const friendColors = [
  'bg-gradient-to-br from-pink-400 to-rose-500',
  'bg-gradient-to-br from-blue-400 to-cyan-500',
  'bg-gradient-to-br from-green-400 to-emerald-500',
  'bg-gradient-to-br from-purple-400 to-fuchsia-500',
  'bg-gradient-to-br from-orange-400 to-red-500',
  'bg-gradient-to-br from-yellow-400 to-amber-500',
  'bg-gradient-to-br from-indigo-400 to-violet-500',
  'bg-gradient-to-br from-teal-400 to-cyan-500',
]

// 刷新朋友列表
const refreshFriends = () => {
  const stored = localStorage.getItem('friendsList')
  if (stored) {
    friendsList.value = JSON.parse(stored)
    alert('朋友列表已刷新！🔄')
  }
}

// 图片放大预览
const showImageModal = ref(false)
const selectedImage = ref('')
const selectedImageTitle = ref('')

const openImageModal = (src, title) => {
  // 将相对路径转换为正确的URL
  if (src.startsWith('../')) {
    selectedImage.value = new URL(src, import.meta.url).href
  } else {
    selectedImage.value = src
  }
  selectedImageTitle.value = title
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
}

// 书籍数据
const books = ref([
  { id: 1, title: '书籍 1', image: new URL('../assets/book1.jpg', import.meta.url).href, progress: 65, status: 'reading' },
  { id: 2, title: '书籍 2', image: new URL('../assets/book2.jpg', import.meta.url).href, progress: 100, status: 'completed' }
])

// 照片数据（包含留言）
const getDefaultPhotos = () => {
  const stored = localStorage.getItem('photosData')
  if (stored) {
    return JSON.parse(stored)
  }
  return [
    { id: 1, title: '照片 1', image: '../assets/photo1.jpg', message: '这是我最喜欢的一张照片！' },
    { id: 2, title: '照片 2', image: '../assets/photo2.jpg', message: '美好的回忆' },
    { id: 3, title: '照片 3', image: '../assets/photo3.jpg', message: '' },
    { id: 4, title: '照片 4', image: '../assets/photo4.jpg', message: '阳光明媚的一天' },
    { id: 5, title: '照片 5', image: '../assets/photo5.jpg', message: '' },
    { id: 6, title: '照片 6', image: '../assets/photo6.jpg', message: '和朋友们在一起' },
    { id: 7, title: '照片 7', image: '../assets/photo7.jpg', message: '' },
    { id: 8, title: '照片 8', image: '../assets/photo8.jpg', message: '旅行的美好时光' },
  ]
}

const photos = ref(getDefaultPhotos())

// 更新照片留言
const updatePhotoMessage = (photoId, message) => {
  if (!isLoggedIn.value) {
    alert('请先登录才能修改留言！')
    return
  }
  const photo = photos.value.find(p => p.id === photoId)
  if (photo) {
    photo.message = message
    localStorage.setItem('photosData', JSON.stringify(photos.value))
    alert('留言已保存！')
  }
}

// 访客记录功能
const getDefaultVisitors = () => {
  const stored = localStorage.getItem('visitorsData')
  if (stored) {
    return JSON.parse(stored)
  }
  return [
    { id: 1, name: 'Alice', visitTime: '2024-01-15 10:30', isNew: false },
    { id: 2, name: 'Bob', visitTime: '2024-01-14 15:20', isNew: false },
    { id: 3, name: 'Charlie', visitTime: '2024-01-14 09:15', isNew: false },
  ]
}

const visitors = ref(getDefaultVisitors())
const showVisitorsModal = ref(false)

// 生成访客ID（基于时间戳）
const generateVisitorId = () => {
  return Date.now()
}

// 记录新访客
const recordVisitor = () => {
  const visitorName = '访客' + Math.floor(Math.random() * 1000)
  const now = new Date()
  const visitTime = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const newVisitor = {
    id: generateVisitorId(),
    name: visitorName,
    visitTime: visitTime,
    isNew: true
  }
  
  visitors.value.unshift(newVisitor)
  
  if (visitors.value.length > 20) {
    visitors.value = visitors.value.slice(0, 20)
  }
  
  localStorage.setItem('visitorsData', JSON.stringify(visitors.value))
}

// 标记访客为已读
const markVisitorsAsRead = () => {
  visitors.value.forEach(v => v.isNew = false)
  localStorage.setItem('visitorsData', JSON.stringify(visitors.value))
}

// 打开访客记录模态框
const openVisitorsModal = () => {
  if (!isLoggedIn.value) {
    alert('请先登录查看访客记录！')
    return
  }
  markVisitorsAsRead()
  showVisitorsModal.value = true
}

const closeVisitorsModal = () => {
  showVisitorsModal.value = false
}

// 获取未读访客数量
const unreadVisitorCount = computed(() => {
  return visitors.value.filter(v => v.isNew).length
})

// 页面加载时记录访客
onMounted(() => {
  if (!localStorage.getItem('hasVisited')) {
    recordVisitor()
    localStorage.setItem('hasVisited', 'true')
  }
})

const updateBookProgress = (bookId, progress) => {
  if (!isLoggedIn.value) {
    alert('请先登录才能修改阅读进度！')
    return
  }
  const book = books.value.find(b => b.id === bookId)
  if (book) {
    book.progress = progress
    book.status = progress >= 100 ? 'completed' : 'reading'
  }
}

const submitForm = (type) => {
  if (!formData.value.name.trim()) {
    alert('请输入您的名字！')
    return
  }
  
  // 添加到朋友列表
  const newFriend = {
    id: Date.now(),
    name: formData.value.name,
    sex: formData.value.sex,
    interests: formData.value.interests,
    relationship: formData.value.relationship,
    message: formData.value.message,
    bgColor: friendColors[Math.floor(Math.random() * friendColors.length)]
  }
  friendsList.value.push(newFriend)
  
  // 保存到 localStorage
  localStorage.setItem('friendsList', JSON.stringify(friendsList.value))
  
  // 清空表单
  formData.value = {
    name: '',
    sex: 'girl',
    interests: [],
    relationship: 'stranger',
    message: ''
  }
  
  alert(`Success! You've become my ${type}! 🎉\n\n您已成功添加到我的朋友列表！`)
}

// 查看朋友详情
const viewFriend = (friend) => {
  selectedFriend.value = friend
}

// 关闭朋友详情
const closeFriendModal = () => {
  selectedFriend.value = null
}

// 欢迎页状态
const showWelcome = ref(true)

// 监听导航栏点击事件
const handleNavbarClick = (href) => {
  if (href.startsWith('/#')) {
    showWelcome.value = false
  }
}

// 在组件挂载时添加全局监听
onMounted(() => {
  window.addEventListener('navbarClick', (e) => {
    handleNavbarClick(e.detail.href)
  })
  
  // 页面加载时记录访客
  if (!localStorage.getItem('hasVisited')) {
    recordVisitor()
    localStorage.setItem('hasVisited', 'true')
  }
})

const scrollToSky = () => {
  showWelcome.value = false
  setTimeout(() => {
    const skySection = document.getElementById('sky-section')
    if (skySection) {
      skySection.scrollIntoView({ behavior: 'smooth' })
    }
  }, 300)
}

const prevPage = () => {
  currentPage.value = currentPage.value > 0 ? currentPage.value - 1 : 5
}

const nextPage = () => {
  currentPage.value = currentPage.value < 5 ? currentPage.value + 1 : 0
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-pink-50">
    <!-- 欢迎页 - 默认显示，点击按钮后隐藏 -->
    <section v-if="showWelcome" class="fixed inset-0 bg-gradient-to-br from-pink-50 via-white to-purple-50 z-50 flex items-center justify-center">
      <div class="relative w-full max-w-2xl mx-auto px-4 py-8">
        <!-- 装饰元素 -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute top-4 left-4 w-6 h-6 bg-pink-200 rounded-full opacity-50 animate-pulse"></div>
          <div class="absolute top-8 right-8 w-5 h-5 bg-purple-200 rounded-full opacity-50 animate-pulse" style="animation-delay: 0.5s"></div>
          <div class="absolute bottom-8 left-1/4 w-8 h-8 bg-blue-200 rounded-full opacity-50 animate-pulse" style="animation-delay: 1s"></div>
          <div class="absolute bottom-4 right-1/4 w-10 h-10 bg-pink-300 rounded-full opacity-30 animate-pulse" style="animation-delay: 1.5s"></div>
        </div>
        
        <!-- 主内容区域 -->
        <div class="relative z-10 w-full">
          <div class="bg-white/90 backdrop-blur-md rounded-2xl border-4 border-gray-200 shadow-2xl overflow-hidden">
            <!-- 顶部标题栏 -->
            <div class="bg-gradient-to-r from-gray-400 to-gray-500 px-4 py-2 flex items-center justify-between">
              <div class="flex gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                <div class="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
              </div>
              <span class="text-gray-200 text-xs font-medium">24fps</span>
            </div>
            
            <!-- 内容区域 -->
            <div class="bg-white p-6 md:p-8">
              <div class="text-center">
                <!-- 标题 -->
                <div class="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-xs font-bold mb-4 animate-pulse shadow-lg">
                  WHO IS THIS BEAUTIFUL GIRL?
                </div>
                
                <!-- 图片 -->
                <div class="mb-4">
                  <img 
                    :src="aliceCoverImage" 
                    alt="Alice" 
                    class="w-full max-w-sm mx-auto rounded-xl shadow-lg transform hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                
                <!-- 头像和按钮 -->
                <div>
                  <div class="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 mx-auto flex items-center justify-center shadow-lg mb-4">
                    <span class="text-3xl">🐰</span>
                  </div>
                  <button 
                    @click="scrollToSky" 
                    class="px-10 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white rounded-full font-bold text-base shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-bounce"
                  >
                    → Click to enter
                  </button>
                  <p class="text-gray-400 text-xs mt-3">点击进入我的频道</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="sky-section" class="relative">
      <div class="relative w-full h-[400px] overflow-hidden transition-all duration-1000"
        :class="currentView === 'academic' ? 'bg-gradient-to-b from-slate-700 via-slate-600 to-slate-500' : 'bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200'">
        <div class="absolute top-10 left-10 w-32 h-16 bg-white rounded-full opacity-80 blur-sm"></div>
        <div class="absolute top-20 left-1/4 w-48 h-20 bg-white rounded-full opacity-70 blur-sm"></div>
        <div class="absolute top-8 right-1/4 w-40 h-18 bg-white rounded-full opacity-75 blur-sm"></div>
        <div class="absolute top-30 right-10 w-36 h-14 bg-white rounded-full opacity-80 blur-sm"></div>
        
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <h2 class="text-5xl md:text-6xl font-bold text-white drop-shadow-lg mb-4">
            Just out here running the world.
          </h2>
          <p class="text-2xl md:text-3xl text-white/90 font-light drop-shadow">
            Angela Edward
          </p>
        </div>
      </div>
    </section>

    <!-- 视图切换开关 -->
    <section class="py-6 px-8 bg-white/80 backdrop-blur-sm border-b transition-colors duration-500"
      :class="currentView === 'academic' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-pink-200'">
      <div class="max-w-6xl mx-auto flex justify-center">
        <ViewSwitch v-model="currentView" />
      </div>
    </section>

    <!-- 学术视图内容 -->
    <div v-if="currentView === 'academic'" class="transition-all duration-700 opacity-100">
      <section id="me" class="py-10 px-8 bg-gradient-to-b from-slate-900 to-slate-800">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-4xl font-bold text-white mb-2">About Me</h2>
          <div class="w-24 h-1 bg-blue-400 rounded-full mb-12"></div>
          
          <div class="flex flex-col lg:flex-row gap-12 items-center">
            <div class="lg:w-1/3">
              <img src="../assets/me.jpg" alt="About Me" class="w-full rounded-[40px] shadow-2xl border-4 border-slate-700"/>
            </div>
            
            <div class="lg:w-2/3">
              <h3 class="text-5xl font-bold text-white mb-4">Angela Edward</h3>
              <div class="text-blue-400 font-medium mb-6">Computer Science Student</div>
              
              <div class="space-y-4 text-gray-300 leading-relaxed">
                <p class="text-lg">Senior Year, pursuing excellence in CS</p>
                <p class="text-lg">Research interests: AI, Machine Learning, Web Development</p>
                <p class="text-lg">Open Source Enthusiast | Tech Blogger</p>
                <p class="text-lg">Passionate about building impactful projects</p>
                <p class="text-lg">Always learning, always growing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 研究领域 -->
      <section id="research" class="py-10 px-8 bg-gradient-to-b from-slate-800 to-slate-900">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-4xl font-bold text-white mb-2 text-center">Research & Projects</h2>
          <div class="w-24 h-1 bg-blue-400 rounded-full mb-12 mx-auto"></div>
          
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Project 1 - AI Research -->
            <a href="https://github.com" target="_blank" class="group bg-slate-700/50 backdrop-blur rounded-xl p-6 border border-slate-600 hover:border-blue-500 transition-all cursor-pointer">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <svg class="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">AI Research</h3>
              <p class="text-gray-400 text-sm mb-4">Machine Learning algorithms, Neural Networks, Deep Learning applications</p>
              <div class="flex flex-wrap gap-2">
                <span class="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Python</span>
                <span class="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">TensorFlow</span>
                <span class="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">PyTorch</span>
              </div>
              <div class="mt-4 pt-4 border-t border-slate-600">
                <p class="text-xs text-gray-500">View on GitHub</p>
              </div>
            </a>
            
            <!-- Project 2 - Web Engineering -->
            <a href="https://github.com" target="_blank" class="group bg-slate-700/50 backdrop-blur rounded-xl p-6 border border-slate-600 hover:border-green-500 transition-all cursor-pointer">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <svg class="w-5 h-5 text-gray-500 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Web Engineering</h3>
              <p class="text-gray-400 text-sm mb-4">Full-stack development, responsive design, scalable architectures</p>
              <div class="flex flex-wrap gap-2">
                <span class="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Vue.js</span>
                <span class="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Node.js</span>
                <span class="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">TypeScript</span>
              </div>
              <div class="mt-4 pt-4 border-t border-slate-600">
                <p class="text-xs text-gray-500">View on GitHub</p>
              </div>
            </a>
            
            <!-- Project 3 - Obsidian Vault -->
            <a href="https://obsidian.md" target="_blank" class="group bg-slate-700/50 backdrop-blur rounded-xl p-6 border border-slate-600 hover:border-purple-500 transition-all cursor-pointer">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <svg class="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Obsidian Vault</h3>
              <p class="text-gray-400 text-sm mb-4">Personal knowledge management, note-taking system, Zettelkasten method</p>
              <div class="flex flex-wrap gap-2">
                <span class="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">Obsidian</span>
                <span class="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">Markdown</span>
                <span class="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">Git</span>
              </div>
              <div class="mt-4 pt-4 border-t border-slate-600">
                <p class="text-xs text-gray-500">Visit obsidian.md</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- 学术链接 -->
      <section id="academic-links" class="py-10 px-8 bg-gradient-to-b from-slate-900 to-slate-800">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-4xl font-bold text-white mb-2 text-center">Academic Resources</h2>
          <div class="w-24 h-1 bg-blue-400 rounded-full mb-12 mx-auto"></div>
          
          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="https://arxiv.org" target="_blank" class="group bg-slate-700/50 rounded-xl p-5 border border-slate-600 hover:border-amber-500 transition-all">
              <div class="text-3xl mb-3">📚</div>
              <h3 class="text-white font-semibold mb-2">arXiv</h3>
              <p class="text-gray-400 text-xs">Preprint papers in CS, Physics, Math</p>
            </a>
            <a href="https://scholar.google.com" target="_blank" class="group bg-slate-700/50 rounded-xl p-5 border border-slate-600 hover:border-blue-500 transition-all">
              <div class="text-3xl mb-3">🔍</div>
              <h3 class="text-white font-semibold mb-2">Google Scholar</h3>
              <p class="text-gray-400 text-xs">Academic papers search</p>
            </a>
            <a href="https://github.com" target="_blank" class="group bg-slate-700/50 rounded-xl p-5 border border-slate-600 hover:border-purple-500 transition-all">
              <div class="text-3xl mb-3">🐙</div>
              <h3 class="text-white font-semibold mb-2">GitHub</h3>
              <p class="text-gray-400 text-xs">Code repositories & projects</p>
            </a>
            <a href="https://leetcode.com" target="_blank" class="group bg-slate-700/50 rounded-xl p-5 border border-slate-600 hover:border-green-500 transition-all">
              <div class="text-3xl mb-3">💻</div>
              <h3 class="text-white font-semibold mb-2">LeetCode</h3>
              <p class="text-gray-400 text-xs">Coding challenges & algorithms</p>
            </a>
          </div>
        </div>
      </section>

      <!-- 技术栈 -->
      <section id="tech-stack" class="py-10 px-8 bg-slate-900">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-4xl font-bold text-white mb-2 text-center">Tech Stack</h2>
          <div class="w-24 h-1 bg-blue-400 rounded-full mb-12 mx-auto"></div>
          
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <a href="https://react.dev" target="_blank" class="group bg-slate-800 rounded-xl p-4 text-center border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
              <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">⚛️</div>
              <p class="text-white font-medium text-sm">React</p>
            </a>
            <a href="https://vuejs.org" target="_blank" class="group bg-slate-800 rounded-xl p-4 text-center border border-slate-700 hover:border-green-500 transition-colors cursor-pointer">
              <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">💚</div>
              <p class="text-white font-medium text-sm">Vue.js</p>
            </a>
            <a href="https://www.typescriptlang.org" target="_blank" class="group bg-slate-800 rounded-xl p-4 text-center border border-slate-700 hover:border-yellow-500 transition-colors cursor-pointer">
              <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">🟨</div>
              <p class="text-white font-medium text-sm">TypeScript</p>
            </a>
            <a href="https://nodejs.org" target="_blank" class="group bg-slate-800 rounded-xl p-4 text-center border border-slate-700 hover:border-purple-500 transition-colors cursor-pointer">
              <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">🟣</div>
              <p class="text-white font-medium text-sm">Node.js</p>
            </a>
            <a href="https://www.python.org" target="_blank" class="group bg-slate-800 rounded-xl p-4 text-center border border-slate-700 hover:border-orange-500 transition-colors cursor-pointer">
              <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">🐘</div>
              <p class="text-white font-medium text-sm">Python</p>
            </a>
            <a href="https://www.docker.com" target="_blank" class="group bg-slate-800 rounded-xl p-4 text-center border border-slate-700 hover:border-red-500 transition-colors cursor-pointer">
              <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">🐳</div>
              <p class="text-white font-medium text-sm">Docker</p>
            </a>
          </div>
        </div>
      </section>
    </div>

    <!-- 生活视图内容 -->
    <div v-else class="transition-all duration-700 opacity-100">
      <section id="me" class="py-10 px-8">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl font-bold text-gray-800 mb-2">About Me</h2>
        <div class="w-24 h-1 bg-pink-300 rounded-full mb-12"></div>
        
        <div class="flex flex-col lg:flex-row gap-12 items-center">
          <div class="lg:w-1/3">
            <img src="../assets/me.jpg" alt="About Me" class="w-full rounded-[40px] shadow-lg"/>
          </div>
          
          <div class="lg:w-2/3">
            <h3 class="text-5xl font-bold text-gray-800 mb-4">Angela Edward</h3>
            <div class="text-pink-400 font-medium mb-6">Just out here running the world</div>
            
            <div class="space-y-4 text-gray-600 leading-relaxed">
              <p class="text-lg">Senior of 20, exploring the world!</p>
              <p class="text-lg">ENFP, laughing one minute, dead inside the next</p>
              <p class="text-lg">Enjoy every moment in daily life</p>
              <p class="text-lg">Obsessed with taking photos</p>
              <p class="text-lg">Always down to try new things</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="info" class="bg-gradient-to-br from-green-50 via-sky-50 to-emerald-50 py-10 px-8">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent mb-2">Basic Information</h2>
        <div class="w-24 h-1 bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full mb-12"></div>
        
        <div class="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-emerald-100">
          <table class="w-full">
            <tbody class="divide-y divide-emerald-100">
              <tr class="hover:bg-emerald-50/50 transition-colors">
                <td class="py-4 px-6 text-emerald-600 font-medium w-1/3">Name</td>
                <td class="py-4 px-6 text-gray-700 font-medium">ZJH /Angela Edward</td>
              </tr>
              <tr class="hover:bg-emerald-50/50 transition-colors">
                <td class="py-4 px-6 text-emerald-600 font-medium">Age</td>
                <td class="py-4 px-6 text-gray-700">20</td>
              </tr>
              <tr class="hover:bg-emerald-50/50 transition-colors">
                <td class="py-4 px-6 text-emerald-600 font-medium">HBD</td>
                <td class="py-4 px-6 text-gray-700 flex items-center gap-2">
                  June <span class="text-yellow-500">⭐ Nice!</span>
                </td>
              </tr>
              <tr class="hover:bg-emerald-50/50 transition-colors">
                <td class="py-4 px-6 text-emerald-600 font-medium">Skills</td>
                <td class="py-4 px-6 text-gray-700">
                  <span class="inline-flex gap-2">
                    <span class="px-2 py-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-full text-sm shadow-sm">Vue</span>
                    <span class="px-2 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full text-sm shadow-sm">Node.js</span>
                    <span class="px-2 py-1 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-full text-sm shadow-sm">Tailwind</span>
                  </span>
                </td>
              </tr>
              <tr class="hover:bg-emerald-50/50 transition-colors">
                <td class="py-4 px-6 text-emerald-600 font-medium">Personality</td>
                <td class="py-4 px-6 text-gray-700">Leo ENFP ✨</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section id="interests" class="bg-gradient-to-br from-white to-pink-50 py-10 px-8">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent mb-2 text-center">My Interest</h2>
        <div class="w-24 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mb-12 mx-auto"></div>
        
        <div class="relative">
          <div class="absolute top-0 right-0 flex flex-col gap-1 mr-8">
            <div class="w-4 h-8 bg-pink-300 rounded-l-sm"></div>
            <div class="w-4 h-12 bg-pink-200 rounded-l-sm"></div>
            <div class="w-4 h-6 bg-gray-300 rounded-l-sm"></div>
            <div class="w-4 h-10 bg-gray-400 rounded-l-sm"></div>
          </div>
          
          <div class="bg-gradient-to-br from-pink-50 to-rose-50 rounded-[20px] shadow-2xl overflow-hidden border-4 border-pink-100">
            <div class="flex min-h-[500px]">
              <div class="w-64 bg-gradient-to-b from-pink-100 to-white border-r-2 border-pink-200 p-6 flex flex-col">
                <div class="text-center mb-8">
                  <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center mb-4 shadow-lg">
                    <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <h3 class="text-xl font-bold text-gray-800">ZJH</h3>
                  <p class="text-pink-500 text-sm mt-1">Explorer | Creator</p>
                </div>
                
                <div class="space-y-3 flex-grow">
                  <button 
                    @click="currentPage = 0"
                    :class="[
                      'w-full text-left px-4 py-3 rounded-xl transition-all',
                      currentPage === 0 ? 'bg-pink-200 text-pink-700 font-medium' : 'text-gray-600 hover:bg-pink-100'
                    ]"
                  >
                    🎤 Music
                  </button>
                  <button 
                    @click="currentPage = 1"
                    :class="[
                      'w-full text-left px-4 py-3 rounded-xl transition-all',
                      currentPage === 1 ? 'bg-pink-200 text-pink-700 font-medium' : 'text-gray-600 hover:bg-pink-100'
                    ]"
                  >
                    🧸 Dimoo
                  </button>
                  <button 
                    @click="currentPage = 2"
                    :class="[
                      'w-full text-left px-4 py-3 rounded-xl transition-all',
                      currentPage === 2 ? 'bg-pink-200 text-pink-700 font-medium' : 'text-gray-600 hover:bg-pink-100'
                    ]"
                  >
                    📚 Books
                  </button>
                  <button 
                    @click="currentPage = 3"
                    :class="[
                      'w-full text-left px-4 py-3 rounded-xl transition-all',
                      currentPage === 3 ? 'bg-pink-200 text-pink-700 font-medium' : 'text-gray-600 hover:bg-pink-100'
                    ]"
                  >
                    🌍 Travel
                  </button>
                  <button 
                    @click="currentPage = 4"
                    :class="[
                      'w-full text-left px-4 py-3 rounded-xl transition-all',
                      currentPage === 4 ? 'bg-pink-200 text-pink-700 font-medium' : 'text-gray-600 hover:bg-pink-100'
                    ]"
                  >
                    🍰 Delicacy
                  </button>
                  <button 
                    @click="currentPage = 5"
                    :class="[
                      'w-full text-left px-4 py-3 rounded-xl transition-all',
                      currentPage === 5 ? 'bg-pink-200 text-pink-700 font-medium' : 'text-gray-600 hover:bg-pink-100'
                    ]"
                  >
                    📷 Photos
                  </button>
                </div>
                
                <div class="mt-auto pt-6 border-t border-pink-200">
                  <div class="flex justify-center gap-3">
                    <a href="#" class="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 hover:bg-pink-300 transition-colors">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    <a href="#" class="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 hover:bg-pink-300 transition-colors">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>
                    <a href="#" class="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 hover:bg-pink-300 transition-colors">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              
              <div class="flex-grow p-8 relative">
                <div class="absolute top-4 right-4 flex gap-1">
                  <div class="w-3 h-3 rounded-full bg-red-400"></div>
                  <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div class="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                
                <div v-if="currentPage === 0" class="h-full space-y-6">
                  <h4 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-sm font-bold">00</span>
                    <span>Music & Concert</span>
                  </h4>
                  
                  <!-- 演唱会模块 -->
                  <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-50">
                    <div class="flex flex-col lg:flex-row gap-6">
                      <!-- 演唱会图片 -->
                      <div class="lg:w-1/2">
                        <div class="relative group">
                          <img 
                            src="../assets/concert.jpg" 
                            alt="张杰演唱会" 
                            class="w-full h-40 lg:h-48 rounded-xl object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                            @click="openImageModal('../assets/concert.jpg', '张杰演唱会')"
                          />
                          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl flex items-end p-4">
                            <span class="text-white font-medium flex items-center gap-2">
                              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>
                              </svg>
                              Live Performance
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 微型数据看板 -->
                      <div class="lg:w-1/2">
                        <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                          <h5 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            Tour Dashboard
                          </h5>
                          
                          <!-- 巡演城市 -->
                          <div class="mb-4">
                            <p class="text-xs text-gray-500 mb-2">巡演城市足迹</p>
                            <div class="flex flex-wrap gap-2">
                              <span class="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-medium rounded-full">
                                📍 北京
                              </span>
                              <span class="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-medium rounded-full">
                                📍 上海
                              </span>
                              <span class="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full">
                                📍 成都
                              </span>
                            </div>
                          </div>
                          
                          <!-- 现场氛围热度 -->
                          <div class="mb-4">
                            <div class="flex items-center justify-between mb-2">
                              <span class="text-xs text-gray-500">现场氛围热度</span>
                              <span class="text-xs font-semibold text-orange-500">98%</span>
                            </div>
                            <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div class="absolute inset-y-0 left-0 w-[98%] bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 rounded-full">
                                <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                          
                          <!-- 抢票难度指数 -->
                          <div>
                            <div class="flex items-center justify-between mb-2">
                              <span class="text-xs text-gray-500">抢票难度指数</span>
                              <span class="text-xs font-semibold text-red-500">极高</span>
                            </div>
                            <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div class="absolute inset-y-0 left-0 w-[95%] bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 rounded-full">
                                <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                          
                          <!-- 迷你环形图 -->
                          <div class="mt-4 flex items-center gap-4">
                            <div class="relative w-12 h-12">
                              <svg class="w-12 h-12 transform -rotate-90">
                                <circle cx="24" cy="24" r="20" stroke="#f3f4f6" stroke-width="4" fill="none"/>
                                <circle cx="24" cy="24" r="20" stroke="url(#gradient)" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="126" stroke-dashoffset="6"/>
                                <defs>
                                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stop-color="#ec4899"/>
                                    <stop offset="100%" stop-color="#f43f5e"/>
                                  </linearGradient>
                                </defs>
                              </svg>
                              <div class="absolute inset-0 flex items-center justify-center">
                                <span class="text-xs font-bold text-gray-700">97%</span>
                              </div>
                            </div>
                            <div>
                              <p class="text-xs text-gray-500">粉丝期待值</p>
                              <p class="text-sm font-semibold text-gray-800">爆棚</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 音乐列表 -->
                  <div>
                    <h5 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                      </svg>
                      Favorite Tracks
                    </h5>
                    <div class="grid grid-cols-2 gap-4">
                      <a href="https://y.qq.com/n/ryqq_v2/songDetail/003n39jA2WcWEh" target="_blank" class="group bg-white rounded-xl p-4 shadow-sm border border-slate-50 hover:shadow-md hover:border-pink-100 transition-all cursor-pointer">
                        <div class="relative w-full h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-3 overflow-hidden">
                          <!-- 音频波形动画 -->
                          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div class="flex items-end gap-1 h-10">
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 60%; animation-delay: 0ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 80%; animation-delay: 100ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 40%; animation-delay: 200ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 90%; animation-delay: 300ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 50%; animation-delay: 400ms;"></div>
                            </div>
                          </div>
                          <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-3xl group-hover:opacity-0 transition-opacity duration-300">🎵</span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-gray-800 font-medium text-sm">千万次想象</span>
                          <span class="text-pink-500 text-xs font-medium">4:04</span>
                        </div>
                        <p class="text-gray-400 text-xs mt-1">张杰</p>
                      </a>
                      
                      <a href="https://y.qq.com/n/ryqq_v2/songDetail/0038Pmfx1Ilxwc" target="_blank" class="group bg-white rounded-xl p-4 shadow-sm border border-slate-50 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer">
                        <div class="relative w-full h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg mb-3 overflow-hidden">
                          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div class="flex items-end gap-1 h-10">
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 70%; animation-delay: 0ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 50%; animation-delay: 150ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 85%; animation-delay: 300ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 45%; animation-delay: 450ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 75%; animation-delay: 600ms;"></div>
                            </div>
                          </div>
                          <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-3xl group-hover:opacity-0 transition-opacity duration-300">🎶</span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-gray-800 font-medium text-sm">铭记</span>
                          <span class="text-blue-500 text-xs font-medium">4:12</span>
                        </div>
                        <p class="text-gray-400 text-xs mt-1">张杰</p>
                      </a>
                      
                      <a href="https://y.qq.com/n/ryqq_v2/songDetail/00041h1u3kgquE" target="_blank" class="group bg-white rounded-xl p-4 shadow-sm border border-slate-50 hover:shadow-md hover:border-orange-100 transition-all cursor-pointer">
                        <div class="relative w-full h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg mb-3 overflow-hidden">
                          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div class="flex items-end gap-1 h-10">
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 55%; animation-delay: 50ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 95%; animation-delay: 200ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 65%; animation-delay: 350ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 80%; animation-delay: 500ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 40%; animation-delay: 650ms;"></div>
                            </div>
                          </div>
                          <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-3xl group-hover:opacity-0 transition-opacity duration-300">🎸</span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-gray-800 font-medium text-sm">天下</span>
                          <span class="text-orange-500 text-xs font-medium">3:41</span>
                        </div>
                        <p class="text-gray-400 text-xs mt-1">张杰</p>
                      </a>
                      
                      <a href="https://y.qq.com/n/ryqq_v2/songDetail/0041LxR43iG7KE" target="_blank" class="group bg-white rounded-xl p-4 shadow-sm border border-slate-50 hover:shadow-md hover:border-green-100 transition-all cursor-pointer">
                        <div class="relative w-full h-24 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg mb-3 overflow-hidden">
                          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div class="flex items-end gap-1 h-10">
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 85%; animation-delay: 100ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 55%; animation-delay: 250ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 70%; animation-delay: 400ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 90%; animation-delay: 550ms;"></div>
                              <div class="w-1 bg-white/80 rounded-full animate-pulse" style="height: 60%; animation-delay: 700ms;"></div>
                            </div>
                          </div>
                          <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-3xl group-hover:opacity-0 transition-opacity duration-300">🎹</span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-gray-800 font-medium text-sm">逆战</span>
                          <span class="text-green-500 text-xs font-medium">3:50</span>
                        </div>
                        <p class="text-gray-400 text-xs mt-1">张杰</p>
                      </a>
                    </div>
                  </div>
                </div>
                
                <div v-else-if="currentPage === 1" class="h-full">
                  <h4 class="text-2xl font-bold text-gray-800 mb-6">[01] Dimoo Collection</h4>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="bg-white rounded-xl p-4 shadow-sm border border-pink-100 text-center hover:shadow-md transition-shadow cursor-pointer" @click="openImageModal('../assets/dimoo1.jpg', 'Dimoo 1')">
                      <img src="../assets/dimoo1.jpg" alt="Dimoo 1" class="w-24 h-24 mx-auto rounded-xl mb-3 object-cover" />
                      <p class="text-gray-700 font-medium">Dimoo 1</p>
                    </div>
                    <div class="bg-white rounded-xl p-4 shadow-sm border border-pink-100 text-center hover:shadow-md transition-shadow cursor-pointer" @click="openImageModal('../assets/dimoo2.jpg', 'Dimoo 2')">
                      <img src="../assets/dimoo2.jpg" alt="Dimoo 2" class="w-24 h-24 mx-auto rounded-xl mb-3 object-cover" />
                      <p class="text-gray-700 font-medium">Dimoo 2</p>
                    </div>
                    <div class="bg-white rounded-xl p-4 shadow-sm border border-pink-100 text-center hover:shadow-md transition-shadow cursor-pointer" @click="openImageModal('../assets/dimoo3.jpg', 'Dimoo 3')">
                      <img src="../assets/dimoo3.jpg" alt="Dimoo 3" class="w-24 h-24 mx-auto rounded-xl mb-3 object-cover" />
                      <p class="text-gray-700 font-medium">Dimoo 3</p>
                    </div>
                  </div>
                </div>
                
                <div v-else-if="currentPage === 2" class="h-full">
                  <h4 class="text-2xl font-bold text-gray-800 mb-6">[02] Reading List</h4>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                      <img src="../assets/book1.jpg" alt="Book 1" class="w-full h-40 rounded-lg mb-3 object-cover cursor-pointer" @click="openImageModal('../assets/book1.jpg', '书籍 1')" />
                      <p class="text-gray-700 font-medium">{{ books[0].title }}</p>
                      <div class="mt-2">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          :value="books[0].progress" 
                          @change="updateBookProgress(1, Number($event.target.value))"
                          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div class="flex justify-between text-sm text-gray-500 mt-1">
                          <span>{{ books[0].progress }}%</span>
                          <span>{{ books[0].status === 'completed' ? '已读完' : '阅读中...' }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                      <img src="../assets/book2.jpg" alt="Book 2" class="w-full h-40 rounded-lg mb-3 object-cover cursor-pointer" @click="openImageModal('../assets/book2.jpg', '书籍 2')" />
                      <p class="text-gray-700 font-medium">{{ books[1].title }}</p>
                      <div class="mt-2">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          :value="books[1].progress" 
                          @change="updateBookProgress(2, Number($event.target.value))"
                          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <div class="flex justify-between text-sm text-gray-500 mt-1">
                          <span>{{ books[1].progress }}%</span>
                          <span>{{ books[1].status === 'completed' ? '已读完' : '阅读中...' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-else-if="currentPage === 3" class="h-full">
                  <h4 class="text-2xl font-bold text-gray-800 mb-6">[03] Travel Memories</h4>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <img src="https://picsum.photos/200/150?random=3" alt="Travel 1" class="rounded-xl shadow-md hover:scale-105 transition-transform cursor-pointer" @click="openImageModal('https://picsum.photos/200/150?random=3', '旅行 1')" />
                    <img src="https://picsum.photos/200/150?random=4" alt="Travel 2" class="rounded-xl shadow-md hover:scale-105 transition-transform cursor-pointer" @click="openImageModal('https://picsum.photos/200/150?random=4', '旅行 2')" />
                    <img src="https://picsum.photos/200/150?random=5" alt="Travel 3" class="rounded-xl shadow-md hover:scale-105 transition-transform cursor-pointer" @click="openImageModal('https://picsum.photos/200/150?random=5', '旅行 3')" />
                    <img src="https://picsum.photos/200/150?random=6" alt="Travel 4" class="rounded-xl shadow-md hover:scale-105 transition-transform cursor-pointer" @click="openImageModal('https://picsum.photos/200/150?random=6', '旅行 4')" />
                  </div>
                </div>
                
                <div v-else-if="currentPage === 4" class="h-full">
                  <h4 class="text-2xl font-bold text-gray-800 mb-6">[04] Delicacy Collection</h4>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-white rounded-xl p-3 shadow-sm border border-pink-100 hover:shadow-md transition-shadow cursor-pointer" @click="openImageModal('../assets/delicacy1.jpg', '美食 1')">
                      <img src="../assets/delicacy1.jpg" alt="Delicacy 1" class="w-full h-32 object-cover rounded-lg mb-2" />
                      <p class="text-gray-700 text-sm font-medium text-center">美食 1</p>
                    </div>
                    <div class="bg-white rounded-xl p-3 shadow-sm border border-pink-100 hover:shadow-md transition-shadow cursor-pointer" @click="openImageModal('../assets/delicacy2.jpg', '美食 2')">
                      <img src="../assets/delicacy2.jpg" alt="Delicacy 2" class="w-full h-32 object-cover rounded-lg mb-2" />
                      <p class="text-gray-700 text-sm font-medium text-center">美食 2</p>
                    </div>
                    <div class="bg-white rounded-xl p-3 shadow-sm border border-pink-100 hover:shadow-md transition-shadow cursor-pointer" @click="openImageModal('../assets/delicacy3.jpg', '美食 3')">
                      <img src="../assets/delicacy3.jpg" alt="Delicacy 3" class="w-full h-32 object-cover rounded-lg mb-2" />
                      <p class="text-gray-700 text-sm font-medium text-center">美食 3</p>
                    </div>
                    <div class="bg-white rounded-xl p-3 shadow-sm border border-pink-100 hover:shadow-md transition-shadow cursor-pointer" @click="openImageModal('../assets/delicacy4.jpg', '美食 4')">
                      <img src="../assets/delicacy4.jpg" alt="Delicacy 4" class="w-full h-32 object-cover rounded-lg mb-2" />
                      <p class="text-gray-700 text-sm font-medium text-center">美食 4</p>
                    </div>
                    <div class="bg-white rounded-xl p-3 shadow-sm border border-pink-100 hover:shadow-md transition-shadow cursor-pointer" @click="openImageModal('../assets/delicacy5.jpg', '美食 5')">
                      <img src="../assets/delicacy5.jpg" alt="Delicacy 5" class="w-full h-32 object-cover rounded-lg mb-2" />
                      <p class="text-gray-700 text-sm font-medium text-center">美食 5</p>
                    </div>
                    <div class="bg-white rounded-xl p-3 shadow-sm border border-pink-100 hover:shadow-md transition-shadow cursor-pointer" @click="openImageModal('../assets/delicacy6.jpg', '美食 6')">
                      <img src="../assets/delicacy6.jpg" alt="Delicacy 6" class="w-full h-32 object-cover rounded-lg mb-2" />
                      <p class="text-gray-700 text-sm font-medium text-center">美食 6</p>
                    </div>
                    <div class="bg-white rounded-xl p-3 shadow-sm border border-pink-100 hover:shadow-md transition-shadow cursor-pointer" @click="openImageModal('../assets/delicacy7.jpg', '美食 7')">
                      <img src="../assets/delicacy7.jpg" alt="Delicacy 7" class="w-full h-32 object-cover rounded-lg mb-2" />
                      <p class="text-gray-700 text-sm font-medium text-center">美食 7</p>
                    </div>
                  </div>
                </div>
                
                <div v-else class="h-full">
                  <h4 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-sm font-bold">05</span>
                    <span>Photo Gallery</span>
                    <span class="text-sm text-gray-400 font-normal">点击照片翻转查看留言</span>
                  </h4>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <PhotoFlip
                      v-for="photo in photos"
                      :key="photo.id"
                      :photo-id="photo.id"
                      :image-src="photo.image"
                      :image-title="photo.title"
                      :message="photo.message"
                      :is-logged-in="isLoggedIn"
                      @update-message="updatePhotoMessage"
                      @open-modal="openImageModal"
                    />
                  </div>
                </div>
                
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                  <button @click="prevPage" class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition-colors">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                  </button>
                  <span class="text-gray-400 text-sm">{{ String(currentPage + 1).padStart(2, '0') }} / 06</span>
                  <button @click="nextPage" class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition-colors">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="friends" class="bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 py-10 px-8">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-4xl font-bold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent mb-2">Make Friends</h2>
        <div class="w-24 h-1 bg-gradient-to-r from-rose-400 to-orange-400 rounded-full mb-12"></div>
        
        <!-- 朋友列表 -->
        <div class="mb-8">
          <h3 class="text-xl font-bold text-gray-700 mb-4">My Friends 👥</h3>
          <div class="flex flex-wrap gap-4">
            <div 
              v-for="friend in friendsList" 
              :key="friend.id"
              @click="viewFriend(friend)"
              class="relative group cursor-pointer"
            >
              <div 
                class="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-110"
                :class="friend.bgColor"
              >
                {{ friend.name.charAt(0).toUpperCase() }}
              </div>
              <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {{ friend.name }}
                <div class="absolute -top-1 left-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
              </div>
            </div>
            <div v-if="friendsList.length === 0" class="text-gray-400 text-sm">
              还没有朋友，快来添加吧！
            </div>
          </div>
          <p class="text-gray-400 text-sm mt-3">点击头像查看朋友详情</p>
        </div>
        
        <!-- 添加朋友表单（仅访客可见） -->
        <div v-if="!isLoggedIn" class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-rose-100">
          <p class="text-gray-600 mb-6">访客可以通过以下表单申请成为我的朋友 🌟</p>
          
          <div class="mb-6">
            <label class="block bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent font-medium mb-2">Your Name</label>
            <input v-model="formData.name" type="text" placeholder="Enter your name" class="w-full px-4 py-3 rounded-xl border-2 border-rose-200 focus:border-rose-400 focus:outline-none transition-colors bg-white/50" />
          </div>
          
          <div class="mb-6">
            <label class="block bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent font-medium mb-2">Sex</label>
            <div class="flex gap-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="formData.sex" value="girl" class="w-4 h-4 accent-rose-500" checked />
                <span class="text-gray-700">Girl 🌸</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="formData.sex" value="boy" class="w-4 h-4 accent-rose-500" />
                <span class="text-gray-700">Boy</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="formData.sex" value="other" class="w-4 h-4 accent-rose-500" />
                <span class="text-gray-700">Other </span>
              </label>
            </div>
          </div>
          
          <div class="mb-6">
            <label class="block bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent font-medium mb-2">Your interests</label>
            <div class="flex flex-wrap gap-4">
              <label v-for="interest in interestsOptions" :key="interest" class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="formData.interests" :value="interest" class="w-4 h-4 accent-rose-500" />
                <span class="text-gray-700">{{ interest }}</span>
              </label>
            </div>
          </div>
          
          <div class="mb-6">
            <label class="block bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent font-medium mb-2">Relationship Level</label>
            <select v-model="formData.relationship" class="w-full px-4 py-3 rounded-xl border-2 border-rose-200 focus:border-rose-400 focus:outline-none transition-colors appearance-none bg-white/50">
              <option v-for="option in relationshipOptions" :key="option" :value="option.toLowerCase()">
                {{ option }}
              </option>
            </select>
          </div>
          
          <div class="mb-8">
            <label class="block bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent font-medium mb-2">Something else</label>
            <textarea v-model="formData.message" placeholder="Say something..." rows="4" class="w-full px-4 py-3 rounded-xl border-2 border-rose-200 focus:border-rose-400 focus:outline-none transition-colors resize-none bg-white/50"></textarea>
          </div>
          
          <div class="flex gap-4">
            <button @click="submitForm('Bestie')" class="px-6 py-3 bg-gradient-to-r from-rose-400 via-pink-500 to-rose-500 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
              Heart Bestie 💕
            </button>
            <button @click="submitForm('Frenemy')" class="px-6 py-3 bg-gradient-to-r from-purple-400 via-fuchsia-500 to-purple-500 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
              Broken Frenemy 
            </button>
            <button @click="submitForm('Ghostie')" class="px-6 py-3 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-500 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
              Ghost Ghostie 
            </button>
          </div>
        </div>
        
        <!-- 管理员提示（仅登录用户可见） -->
        <div v-else class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 border border-blue-200">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">👑</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Welcome Back, Admin!</h3>
            <p class="text-gray-600">作为博主，您可以查看朋友列表和管理博客内容。</p>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <button 
              class="flex flex-col items-center gap-2 p-4 bg-white/60 hover:bg-white rounded-xl transition-colors shadow-sm"
              @click="openVisitorsModal"
            >
              <div class="relative">
                <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span 
                  v-if="unreadVisitorCount > 0"
                  class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                >
                  {{ unreadVisitorCount }}
                </span>
              </div>
              <span class="text-sm font-medium text-gray-700">访客记录</span>
            </button>
            <button 
              class="flex flex-col items-center gap-2 p-4 bg-white/60 hover:bg-white rounded-xl transition-colors shadow-sm"
              @click="refreshFriends"
            >
              <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span class="text-sm font-medium text-gray-700">刷新朋友</span>
            </button>
            <button 
              class="flex flex-col items-center gap-2 p-4 bg-white/60 hover:bg-white rounded-xl transition-colors shadow-sm"
              @click="() => { window.location.href = '#interests' }"
            >
              <svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span class="text-sm font-medium text-gray-700">查看相册</span>
            </button>
          </div>
        </div>
      </div>
    </section>
    </div> <!-- 关闭生活视图 -->

    <footer class="bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 py-8 px-8">
      <div class="max-w-4xl mx-auto text-center">
        <p class="text-white text-lg mb-4">If you want to be my friend, contact me! 💌</p>
        <p class="text-emerald-200 text-sm mb-4">ZJH @ SDUT</p>
        <p class="text-emerald-200 text-sm mb-8">Happy to meet you! ✨</p>
        
        <button @click="refreshFriends" class="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-medium hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg">
          Refresh 🔄
        </button>
      </div>
    </footer>

    <!-- 图片放大预览模态框 -->
    <div v-if="showImageModal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50" @click="closeImageModal">
      <button @click="closeImageModal" class="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
        <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <img :src="selectedImage" :alt="selectedImageTitle" class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
    </div>

    <!-- 朋友详情模态框 -->
    <div v-if="selectedFriend" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click="closeFriendModal">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8" @click.stop>
        <div class="text-center mb-6">
          <div 
            class="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg mx-auto mb-4"
            :class="selectedFriend.bgColor"
          >
            {{ selectedFriend.name.charAt(0).toUpperCase() }}
          </div>
          <h3 class="text-2xl font-bold text-gray-800">{{ selectedFriend.name }}</h3>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <span class="text-gray-500">性别</span>
            <span class="text-gray-800">
              {{ selectedFriend.sex === 'girl' ? 'Girl 🌸' : selectedFriend.sex === 'boy' ? 'Boy' : 'Other' }}
            </span>
          </div>
          
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <span class="text-gray-500">关系</span>
            <span class="text-gray-800 capitalize">
              {{ selectedFriend.relationship === 'stranger' ? 'Stranger' : 
                 selectedFriend.relationship === 'acquaintance' ? 'Acquaintance' :
                 selectedFriend.relationship === 'friend' ? 'Friend' :
                 selectedFriend.relationship === 'bestie' ? 'Bestie 💕' : 'Frenemy' }}
            </span>
          </div>
          
          <div class="py-3 border-b border-gray-100">
            <span class="text-gray-500 block mb-2">兴趣爱好</span>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="interest in selectedFriend.interests" 
                :key="interest"
                class="px-3 py-1 bg-pink-100 text-pink-500 rounded-full text-sm"
              >
                {{ interest }}
              </span>
              <span v-if="selectedFriend.interests.length === 0" class="text-gray-400 text-sm">暂无</span>
            </div>
          </div>
          
          <div class="py-3">
            <span class="text-gray-500 block mb-2">留言</span>
            <p class="text-gray-700 bg-gray-50 p-4 rounded-xl">
              {{ selectedFriend.message || '暂无留言' }}
            </p>
          </div>
        </div>
        
        <button 
          @click="closeFriendModal" 
          class="w-full mt-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-full font-bold hover:opacity-90 transition-opacity"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 访客记录模态框 -->
    <div v-if="showVisitorsModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click="closeVisitorsModal">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6" @click.stop>
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-800">访客记录</h3>
              <p class="text-sm text-gray-500">共 {{ visitors.length }} 位访客</p>
            </div>
          </div>
          <button @click="closeVisitorsModal" class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <svg class="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="max-h-80 overflow-y-auto space-y-3">
          <div 
            v-for="visitor in visitors" 
            :key="visitor.id"
            class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
          >
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
              {{ visitor.name.charAt(0) }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-800">{{ visitor.name }}</span>
                <span 
                  v-if="visitor.isNew"
                  class="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                ></span>
              </div>
              <p class="text-xs text-gray-400">{{ visitor.visitTime }}</p>
            </div>
            <div class="text-green-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div v-if="visitors.length === 0" class="text-center py-8 text-gray-400">
            <div class="text-4xl mb-2">👥</div>
            <p>暂无访客记录</p>
          </div>
        </div>
        
        <div class="mt-4 pt-4 border-t border-gray-100">
          <p class="text-xs text-gray-400 text-center">访客记录会自动保存，最多显示20条</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
