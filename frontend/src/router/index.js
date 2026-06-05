import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Archive from '../views/Archive.vue'
import Messages from '../views/Messages.vue'
import MyLife from '../views/MyLife.vue'
import ObsidianGarden from '../views/ObsidianGarden.vue'
import CreatePost from '../views/CreatePost.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/archive',
    name: 'Archive',
    component: Archive
  },
  {
    path: '/messages',
    name: 'Messages',
    component: Messages
  },
  {
    path: '/mylife',
    name: 'MyLife',
    component: MyLife
  },
  {
    path: '/obsidian',
    name: 'ObsidianGarden',
    component: ObsidianGarden
  },
  {
    path: '/create',
    name: 'CreatePost',
    component: CreatePost
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router