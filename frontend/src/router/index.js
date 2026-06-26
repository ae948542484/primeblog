import { createRouter, createWebHistory } from 'vue-router'

// 路由懒加载配置 - 按需加载页面组件，大幅削减首屏加载体积
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/blog',
    name: 'Blog',
    component: () => import('../views/Blog.vue')
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('../views/Archive.vue')
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../views/Messages.vue')
  },
  {
    path: '/mylife',
    name: 'MyLife',
    component: () => import('../views/MyLife.vue')
  },
  {
    path: '/obsidian',
    name: 'ObsidianGarden',
    component: () => import('../views/ObsidianGarden.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/admin/Login.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
      {
        path: 'posts',
        name: 'AdminPosts',
        component: () => import('../views/admin/Posts.vue')
      },
      {
        path: 'messages',
        name: 'AdminMessages',
        component: () => import('../views/admin/Messages.vue')
      },
      {
        path: 'tags',
        name: 'AdminTags',
        component: () => import('../views/admin/Tags.vue')
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('../views/admin/Categories.vue')
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('../views/admin/Profile.vue')
      },
      {
        path: 'security',
        name: 'AdminSecurity',
        component: () => import('../views/admin/Security.vue')
      }
    ]
  },
  {
    path: '/create',
    name: 'CreatePost',
    component: () => import('../views/CreatePost.vue')
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('../views/ArticleDetail.vue')
  },
  {
    path: '/links',
    name: 'Links',
    component: () => import('../views/Links.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 仅拦截需要管理员权限的路由
router.beforeEach((to, from, next) => {
  // 仅对需要管理员权限的路由进行检查
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    const adminToken = localStorage.getItem('admin_token')
    
    if (!adminToken) {
      // 未登录，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 验证 token 是否有效
    fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }).then(response => {
      if (!response.ok) {
        // token 无效，清除并重定向
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
      } else {
        next()
      }
    }).catch(() => {
      // 网络错误，放行（避免阻塞用户体验）
      next()
    })
    return
  }
  
  // 普通路由直接放行，不打扰前台访客
  next()
})

export default router
