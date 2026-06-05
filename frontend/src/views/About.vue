<script setup>
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-light">
    <div class="py-12 px-6">
      <div class="max-w-4xl mx-auto">
        <h1 class="section-title">关于我</h1>
        
        <div class="card p-8 mb-8">
          <div class="flex items-center gap-6 mb-6">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center text-white text-3xl font-bold">
              Z
            </div>
            <div>
              <h2 class="text-2xl font-bold text-primary-500">ZJH</h2>
              <p class="text-gray-600">SDUT学生 · 全栈开发者 · 终身学习者</p>
            </div>
          </div>
          
          <p class="text-gray-700 leading-relaxed mb-6">
            大家好，我是 ZJH，一名就读于山东理工大学的计算机科学与技术专业学生。
            热爱编程，专注于全栈开发领域。在这里，我记录我的技术成长、学习心得和生活感悟。
            希望能够与志同道合的朋友们交流分享，共同进步。
          </p>
        </div>

        <div class="card p-8 mb-8">
          <h2 class="text-xl font-bold text-primary-500 mb-6 border-b border-gray-100 pb-3">
            学校信息
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-primary-500">学校名称</h3>
                <p class="text-gray-600">山东理工大学 (SDUT)</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-primary-500">专业</h3>
                <p class="text-gray-600">信息与计算科学</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-primary-500">年级</h3>
                <p class="text-gray-600">大三</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-primary-500">地点</h3>
                <p class="text-gray-600">淄博市</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-8 mb-8">
          <h2 class="text-xl font-bold text-primary-500 mb-6 border-b border-gray-100 pb-3">
            博客初衷
          </h2>
          
          <p class="text-gray-700 leading-relaxed mb-4">
            创建这个博客的初衷是为了记录我的学习历程和技术成长。作为一名计算机专业的学生，
            我希望能够通过写作来加深对知识的理解，同时也希望能够帮助到正在学习路上的朋友们。
          </p>
          <p class="text-gray-700 leading-relaxed">
            在这里，你可以找到技术分享、学习笔记、生活感悟等内容。欢迎留言交流，让我们一起成长！
          </p>
        </div>

        <div class="card p-8">
          <h2 class="text-xl font-bold text-primary-500 mb-6 border-b border-gray-100 pb-3">
            技术栈
          </h2>
          
          <div class="flex flex-wrap gap-3">
            <span class="px-4 py-2 bg-primary-100 text-primary-500 rounded-md text-sm font-medium">Vue 3</span>
            <span class="px-4 py-2 bg-primary-100 text-primary-500 rounded-md text-sm font-medium">Node.js</span>
            <span class="px-4 py-2 bg-primary-100 text-primary-500 rounded-md text-sm font-medium">Express</span>
            <span class="px-4 py-2 bg-primary-100 text-primary-500 rounded-md text-sm font-medium">SQLite</span>
            <span class="px-4 py-2 bg-primary-100 text-primary-500 rounded-md text-sm font-medium">Tailwind CSS</span>
            <span class="px-4 py-2 bg-primary-100 text-primary-500 rounded-md text-sm font-medium">JavaScript</span>
            <span class="px-4 py-2 bg-primary-100 text-primary-500 rounded-md text-sm font-medium">Git</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
