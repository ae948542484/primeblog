<script setup>
import Navbar from './components/Navbar.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <Navbar />
    <main>
      <RouterView />
    </main>
    <footer class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm mx-4 lg:mx-auto max-w-7xl mt-8 mb-8 p-6">
      <div class="text-center">
        <p class="text-sm text-gray-500">
          © 2024 ZJH · Built with Vue 3 + Tailwind CSS
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
</style>
