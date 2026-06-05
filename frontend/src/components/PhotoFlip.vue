<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  imageSrc: {
    type: String,
    required: true
  },
  imageTitle: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  photoId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update-message', 'open-modal'])

const isFlipped = ref(false)
const isEditing = ref(false)
const editMessage = ref(props.message)

const toggleFlip = () => {
  isFlipped.value = !isFlipped.value
}

const openImageModal = () => {
  emit('open-modal', props.imageSrc, props.imageTitle)
}

const startEdit = () => {
  editMessage.value = props.message
  isEditing.value = true
}

const saveMessage = () => {
  emit('update-message', props.photoId, editMessage.value)
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}

const flippedClass = computed(() => ({
  'rotate-y-180': isFlipped.value
}))
</script>

<template>
  <div 
    class="perspective-1000 cursor-pointer"
    @click="toggleFlip"
  >
    <div 
      class="relative w-full h-32 md:h-40 preserve-3d transition-transform duration-700 ease-out"
      :class="flippedClass"
    >
      <!-- 正面 - 照片 -->
      <div 
        class="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-lg"
      >
        <img 
          :src="imageSrc" 
          :alt="imageTitle" 
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end p-2">
          <span class="text-white text-xs font-medium">{{ imageTitle }}</span>
        </div>
        <div class="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 4v4m0 8v4M8 4l8 4M8 16l8-4"/>
          </svg>
        </div>
      </div>
      
      <!-- 背面 - 留言 -->
      <div 
        class="absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 shadow-lg p-4 flex flex-col"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-gray-600">我的留言</span>
          <button 
            v-if="isLoggedIn"
            @click.stop="startEdit"
            class="w-6 h-6 rounded-full bg-white/60 hover:bg-white flex items-center justify-center transition-colors"
          >
            <svg class="w-3 h-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
        
        <!-- 编辑模式 -->
        <div v-if="isEditing" class="flex-1 flex flex-col">
          <textarea 
            v-model="editMessage"
            placeholder="输入你的留言..."
            rows="3"
            class="flex-1 w-full px-3 py-2 rounded-lg bg-white/80 border border-pink-200 focus:border-pink-400 focus:outline-none text-sm resize-none"
            @click.stop
          ></textarea>
          <div class="flex gap-2 mt-2">
            <button 
              @click.stop="saveMessage"
              class="flex-1 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              保存
            </button>
            <button 
              @click.stop="cancelEdit"
              class="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
        
        <!-- 查看模式 -->
        <div v-else class="flex-1 flex flex-col justify-center">
          <p 
            v-if="message" 
            class="text-gray-700 text-sm leading-relaxed text-center"
          >
            "{{ message }}"
          </p>
          <p v-else class="text-gray-400 text-xs text-center">
            {{ isLoggedIn ? '点击编辑按钮添加留言' : '登录后可添加留言' }}
          </p>
        </div>
        
        <div class="mt-2 text-center">
          <button 
            @click.stop="openImageModal"
            class="px-3 py-1 bg-white/60 hover:bg-white text-gray-600 text-xs font-medium rounded-lg transition-colors"
          >
            查看大图
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
</style>