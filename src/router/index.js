import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Skills from '../views/Skills.vue'
import Links from '../views/Links.vue'
import Projects from '../views/Projects.vue'
import ProjectDetail from '../views/ProjectDetail.vue'
import Blog from '../views/Blog.vue'
import BlogDetail from '../views/BlogDetail.vue'
import { trackPageView } from '../composables/useTracking'

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
    path: '/skills',
    name: 'Skills',
    component: Skills
  },
  {
    path: '/links',
    name: 'Links',
    component: Links
  },
  {
    path: '/projects',
    name: 'Projects',
    component: Projects
  },
  {
    path: '/projects/:id',
    name: 'ProjectDetail',
    component: ProjectDetail,
    props: true
  },
  {
    path: '/blog',
    name: 'Blog',
    component: Blog
  },
  {
    path: '/blog/:id',
    name: 'BlogDetail',
    component: BlogDetail,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（比如浏览器后退），则恢复到该位置
    if (savedPosition) {
      return savedPosition
    }
    // 进入详情页时滚动到顶部
    if (to.name === 'ProjectDetail' || to.name === 'BlogDetail') {
      return { top: 0 }
    }
    // 从详情页返回到列表页时，不执行默认滚动（由组件自己处理）
    if ((from.name === 'ProjectDetail' && to.name === 'Projects') ||
        (from.name === 'BlogDetail' && to.name === 'Blog')) {
      return false
    }
    // 其他情况滚动到顶部
    return { top: 0 }
  }
})

// 设置默认标题
router.beforeEach((to, from, next) => {
  document.title = 'Yung\'s Portfolio'
  next()
})

// 路由守卫：记录页面访问埋点
// 防止重复调用：只在路由真正变化时记录
let lastTrackedPath = null
let lastTrackedFrom = null
router.afterEach((to, from) => {
  // 避免重复记录：如果目标路径和上次记录的路径相同，且来源路径也相同，则跳过
  // 这样可以避免Vue Router在某些情况下触发多次导航
  if (lastTrackedPath === to.path && from.path === (lastTrackedFrom || '')) {
    return
  }
  lastTrackedPath = to.path
  lastTrackedFrom = from.path
  // 使用埋点工具记录页面访问
  trackPageView(to.path, to.name || '', from.path || '')
})

export default router

