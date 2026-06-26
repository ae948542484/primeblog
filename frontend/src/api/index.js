export const API_BASE = '/api'

export const API_CONFIG = {
  baseURL: API_BASE,
  
  posts: {
    list: `${API_BASE}/posts`,
    detail: (id) => `${API_BASE}/posts/${id}`,
    create: `${API_BASE}/posts`,
    update: (id) => `${API_BASE}/posts/${id}`,
    delete: (id) => `${API_BASE}/posts/${id}`,
    like: (id) => `${API_BASE}/posts/${id}/like`,
    favorite: (id) => `${API_BASE}/posts/${id}/favorite`,
    archive: `${API_BASE}/posts/archive`
  },
  
  auth: {
    login: `${API_BASE}/auth/login`,
    logout: `${API_BASE}/auth/logout`,
    verify: `${API_BASE}/auth/verify`
  },
  
  admin: {
    initData: `${API_BASE}/init-data`,
    updateUsername: `${API_BASE}/admin/update-username`,
    updatePassword: `${API_BASE}/admin/update-password`
  },
  
  authors: {
    me: `${API_BASE}/authors/me`,
    update: `${API_BASE}/authors/me`
  },
  
  views: {
    record: `${API_BASE}/views/record`
  },
  
  messages: {
    list: `${API_BASE}/messages`,
    create: `${API_BASE}/messages`,
    delete: (id) => `${API_BASE}/messages/${id}`
  },
  
  tags: {
    list: `${API_BASE}/tags`,
    create: `${API_BASE}/tags`,
    update: (id) => `${API_BASE}/tags/${id}`,
    delete: (id) => `${API_BASE}/tags/${id}`
  },
  
  categories: {
    list: `${API_BASE}/categories`,
    create: `${API_BASE}/categories`,
    update: (id) => `${API_BASE}/categories/${id}`,
    delete: (id) => `${API_BASE}/categories/${id}`
  },
  
  links: {
    list: `${API_BASE}/links`,
    create: `${API_BASE}/links`,
    update: (id) => `${API_BASE}/links/${id}`,
    delete: (id) => `${API_BASE}/links/${id}`
  },
  
  report: {
    stats: `${API_BASE}/report`
  },
  
  health: {
    check: `${API_BASE}/health`
  }
}

export const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json'
})

export const fetchApi = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  }
  
  const mergedOptions = { ...defaultOptions, ...options }
  
  const response = await fetch(url, mergedOptions)
  return response.json()
}