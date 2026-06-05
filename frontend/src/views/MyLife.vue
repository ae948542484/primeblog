<script setup>
import { ref } from 'vue'
import Navbar from '../components/Navbar.vue'

const formData = ref({
  name: '',
  sex: 'girl',
  interests: [],
  relationship: 'stranger',
  message: ''
})

const interestsOptions = ['guangchi', 'gouwu', 'yundong', 'zhuixing', 'youxi']
const relationshipOptions = ['stranger', 'friend', 'goodfriend', 'guimi', 'dimi']

const submitForm = (type) => {
  alert('Success!')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white">
    <Navbar />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div id="info" class="lg:col-span-1">
          <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-blue-100">
            <h3 class="text-xl font-bold text-blue-900 mb-2">Basic Information</h3>
            <div class="w-16 h-1 bg-blue-500 rounded-full mb-6"></div>
            <div class="space-y-4">
              <div class="flex justify-between items-center py-3 border-b border-blue-100">
                <span class="text-blue-500 font-medium">Name</span>
                <span class="text-gray-700 font-medium">ZJH</span>
              </div>
              <div class="flex justify-between items-center py-3 border-b border-blue-100">
                <span class="text-blue-500 font-medium">Age</span>
                <span class="text-gray-700">20</span>
              </div>
              <div class="flex justify-between items-center py-3 border-b border-blue-100">
                <span class="text-blue-500 font-medium">School</span>
                <span class="text-gray-700">SDUT</span>
              </div>
              <div class="flex justify-between items-center py-3 border-b border-blue-100">
                <span class="text-blue-500 font-medium">Major</span>
                <span class="text-gray-700">Information and Computing Science</span>
              </div>
              <div class="flex justify-between items-center py-3">
                <span class="text-blue-500 font-medium">Personality</span>
                <span class="text-gray-700">Gemini ENFJ</span>
              </div>
            </div>
          </div>
        </div>

        <div id="me" class="lg:col-span-1">
          <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-blue-100">
            <h3 class="text-xl font-bold text-blue-900 mb-2">About Me</h3>
            <div class="w-16 h-1 bg-blue-400 rounded-full mb-6"></div>
            <div class="flex justify-center mb-6">
              <div class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-white shadow-xl flex items-center justify-center">
                <span class="text-5xl">Smile</span>
              </div>
            </div>
            <div class="text-center mb-6">
              <h4 class="text-3xl font-bold text-blue-900 mb-2">ZJH</h4>
              <span class="text-blue-500 font-medium">SDUT - Information and Computing Science</span>
            </div>
            <div class="space-y-3 text-gray-600 text-sm">
              <p>20 years old, exploring the wonderful world!</p>
              <p>Gemini ENFJ, enjoying every moment</p>
              <p>Love life, like to record beautiful moments</p>
            </div>
          </div>
        </div>

        <div id="friends" class="lg:col-span-1">
          <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-blue-100">
            <h3 class="text-xl font-bold text-blue-900 mb-2">Make Friends</h3>
            <div class="w-16 h-1 bg-blue-400 rounded-full mb-6"></div>
            <div class="space-y-4">
              <div>
                <label class="block text-blue-500 font-medium text-sm mb-1">Your Name</label>
                <input v-model="formData.name" type="text" placeholder="Enter your name" class="w-full px-3 py-2 rounded-lg border-2 border-blue-200 focus:border-blue-400 focus:outline-none text-sm" />
              </div>
              <div>
                <label class="block text-blue-500 font-medium text-sm mb-1">Sex</label>
                <div class="flex gap-4">
                  <label class="flex items-center gap-1 text-sm cursor-pointer">
                    <input type="radio" v-model="formData.sex" value="girl" class="w-3 h-3 accent-blue-500" checked /> Girl
                  </label>
                  <label class="flex items-center gap-1 text-sm cursor-pointer">
                    <input type="radio" v-model="formData.sex" value="boy" class="w-3 h-3 accent-blue-500" /> Boy
                  </label>
                </div>
              </div>
              <div>
                <label class="block text-blue-500 font-medium text-sm mb-1">Interests</label>
                <div class="flex flex-wrap gap-2">
                  <label v-for="interest in interestsOptions" :key="interest" class="text-xs cursor-pointer">
                    <input type="checkbox" v-model="formData.interests" :value="interest" class="w-3 h-3 accent-blue-500" /> {{ interest }}
                  </label>
                </div>
              </div>
              <div class="flex gap-2">
                <button @click="submitForm('friend')" class="flex-1 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold hover:scale-105 transition-transform">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="interests" class="mt-8">
        <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-blue-100">
          <h3 class="text-xl font-bold text-blue-900 mb-2">Interests</h3>
          <div class="w-16 h-1 bg-blue-400 rounded-full mb-6"></div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-gradient-to-br from-blue-100 to-sky-200 rounded-xl p-4">
              <h4 class="font-bold text-blue-900 mb-3">Music</h4>
              <div class="bg-white rounded-lg p-3 mb-2">
                <p class="text-sm font-medium text-gray-700">ALLDAY PROJECT - Famous</p>
              </div>
            </div>
            <div class="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl p-4">
              <h4 class="font-bold text-blue-900 mb-3">Video</h4>
              <div class="bg-black rounded-lg overflow-hidden">
                <video class="w-full h-32 object-cover" controls poster="https://picsum.photos/300/120?random=1">
                  <source src="#" type="video/mp4">
                </video>
              </div>
            </div>
            <div class="bg-gradient-to-br from-sky-100 to-cyan-100 rounded-xl p-4">
              <h4 class="font-bold text-blue-900 mb-3">Dance</h4>
              <div class="bg-black rounded-lg overflow-hidden">
                <video class="w-full h-32 object-cover" controls poster="https://picsum.photos/300/120?random=2">
                  <source src="#" type="video/mp4">
                </video>
              </div>
            </div>
          </div>
          <div class="mt-6 bg-gradient-to-br from-teal-100 to-green-100 rounded-xl p-4">
            <h4 class="font-bold text-blue-900 mb-4">Travel</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <img src="https://picsum.photos/200/150?random=3" alt="Travel 1" class="rounded-lg shadow-md w-full h-24 object-cover" />
              <img src="https://picsum.photos/200/150?random=4" alt="Travel 2" class="rounded-lg shadow-md w-full h-24 object-cover" />
              <img src="https://picsum.photos/200/150?random=5" alt="Travel 3" class="rounded-lg shadow-md w-full h-24 object-cover" />
              <img src="https://picsum.photos/200/150?random=6" alt="Travel 4" class="rounded-lg shadow-md w-full h-24 object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="bg-blue-900 py-8 mt-8">
      <div class="max-w-6xl mx-auto px-4 text-center">
        <p class="text-white text-lg mb-2">Welcome to my channel!</p>
        <p class="text-blue-200 text-sm">ZJH @ SDUT</p>
        <button @click="() => window.scrollTo({ top: 0, behavior: 'smooth' })" class="mt-4 px-6 py-2 bg-blue-700 text-white rounded-full text-sm hover:bg-blue-600 transition-colors relative z-10 cursor-pointer">
          Back to Top
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
</style>
