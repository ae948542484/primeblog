<script setup>
import { ref, onMounted } from 'vue'

const links = ref([])
const loading = ref(true)

const fetchLinks = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/links')
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        links.value = result.data
      }
    }
  } catch (error) {
    console.error('获取友链失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLinks()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-light">
    <div class="py-12 px-6">
      <div class="max-w-4xl mx-auto">
        <h1 class="section-title">友链</h1>
        
        <div class="card p-8">
          <div class="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            <span class="text-sm text-gray-500">共 {{ links.length }} 位朋友</span>
          </div>

          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="i in 6" :key="i" class="p-4 rounded-xl bg-white border border-gray-100 animate-pulse">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-gray-200"></div>
                <div class="flex-1">
                  <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div class="mt-3 h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </div>

          <div v-else-if="links.length === 0" class="text-center py-12">
            <div class="text-gray-400">暂无友链</div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              v-for="link in links" 
              :key="link.id"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="block p-4 rounded-xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 group"
            >
              <div class="flex items-center gap-4">
                <img 
                  v-if="link.avatar_url" 
                  :src="link.avatar_url" 
                  :alt="link.name"
                  class="w-12 h-12 rounded-full object-cover border-2 border-gray-100 group-hover:border-primary-200 transition-colors"
                />
                <div 
                  v-else
                  class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300"
                >
                  {{ link.name.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-primary-500 group-hover:text-accent transition-colors truncate">
                    {{ link.name }}
                  </h3>
                  <p class="text-xs text-gray-400 truncate">{{ link.url }}</p>
                </div>
              </div>
              <p v-if="link.description" class="text-gray-600 text-sm mt-3">
                {{ link.description }}
              </p>
            </a>
          </div>

          <div class="mt-8 pt-6 border-t border-gray-100 text-center">
            <p class="text-gray-400 text-sm">
              欢迎交换友链 · 如有合作意向，请留言联系
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
