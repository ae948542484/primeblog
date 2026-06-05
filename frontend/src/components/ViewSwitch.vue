<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const isAcademic = computed(() => props.modelValue === 'academic')

const toggleView = () => {
  const newValue = isAcademic.value ? 'life' : 'academic'
  emit('update:modelValue', newValue)
}
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- 学术模式图标 -->
    <div 
      class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer"
      :class="isAcademic ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
      @click="toggleView"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
      </svg>
      <span>Academic</span>
    </div>
    
    <!-- 切换开关 -->
    <button
      @click="toggleView"
      class="relative w-14 h-7 rounded-full transition-all duration-500 ease-out"
      :class="isAcademic ? 'bg-gradient-to-r from-slate-600 to-slate-700 shadow-inner' : 'bg-gradient-to-r from-pink-400 to-rose-500 shadow-inner'"
    >
      <span 
        class="absolute top-1 w-5 h-5 rounded-full transition-all duration-500 ease-out flex items-center justify-center"
        :class="isAcademic ? 'left-1 bg-slate-800 shadow-lg' : 'left-8 bg-white shadow-lg'"
      >
        <svg 
          v-if="isAcademic" 
          class="w-3 h-3 text-slate-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <svg 
          v-else 
          class="w-3 h-3 text-pink-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
        </svg>
      </span>
    </button>
    
    <!-- 生活模式图标 -->
    <div 
      class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer"
      :class="!isAcademic ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
      @click="toggleView"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
      </svg>
      <span>Life</span>
    </div>
  </div>
</template>
