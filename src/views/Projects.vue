<template>
  <div class="projects">
    <div class="container">
      <h1 class="section-title">{{ t('projects.title') }}</h1>
      
      <div v-if="loading" class="loading">
        <p>{{ t('projects.loading') }}</p>
      </div>

      <div v-else-if="error" class="error">
        <p>{{ t('projects.error') }} {{ error }}</p>
        <button @click="fetchProjects" class="btn">{{ t('projects.tryAgain') }}</button>
      </div>

      <div v-else class="projects-grid">
        <div 
          v-for="project in projects" 
          :key="project.id" 
          class="project-card"
          @click="goToProject(project.id)"
        >
          <div class="project-image">
            <img 
              v-if="project.screenshots && project.screenshots.length > 0" 
              :src="project.screenshots[0]" 
              :alt="project.name"
              class="project-cover-image"
            />
            <div v-else class="image-placeholder">
              <span>📁</span>
            </div>
          </div>
          <div class="project-content">
            <h2>{{ project.name }}</h2>
            <div class="project-tech">
              <span 
                v-for="tech in project.technologies" 
                :key="tech" 
                class="tech-tag"
              >
                {{ translateTechnology(tech) }}
              </span>
            </div>
            <div class="project-links">
              <a 
                v-if="project.githubUrl"
                :href="project.githubUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                @click.stop="handleGitHubClick(project.githubUrl, project.name, $event)"
                class="project-link github-button"
              >
                {{ t('projects.github') }}
              </a>
              <a 
                v-if="project.demoUrl"
                :href="project.demoUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                @click.stop="handleDemoClick(project.demoUrl, project.name, $event)"
                :class="project.githubUrl ? 'project-link' : 'project-link github-button'"
              >
                {{ t('projects.demo') }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { injectLanguage } from '../composables/useLanguage'
import { useTracking } from '../composables/useTracking'
import { usePageTracking } from '../composables/usePageTracking'

const router = useRouter()
const route = useRoute()
const { currentLanguage, t, translateTechnology } = injectLanguage()
const { trackLinkClick, trackConversion } = useTracking()

// 启用页面追踪（自动追踪停留时长和滚动深度）
usePageTracking()

const projects = ref([])
const loading = ref(true)
const error = ref(null)

const fetchProjects = async () => {
  try {
    loading.value = true
    error.value = null
    // 根据当前语言加载对应的 JSON 文件
    const lang = currentLanguage.value
    const filename = lang === 'zh' ? 'projects-zh.json' : 'projects-en.json'
    const response = await fetch(`/data/${filename}`)
    if (!response.ok) {
      throw new Error('Failed to fetch projects')
    }
    const data = await response.json()
    projects.value = data
    return Promise.resolve()
  } catch (err) {
    error.value = err.message
    console.error('Error fetching projects:', err)
    return Promise.reject(err)
  } finally {
    loading.value = false
  }
}

// 监听语言变化，重新加载项目
watch(currentLanguage, () => {
  fetchProjects()
})

const goToProject = (id) => {
  // 追踪项目卡片点击
  const project = projects.value.find(p => p.id === id)
  if (project) {
    trackConversion('project_card_clicked', {
      projectId: id,
      projectName: project.name,
      page: '/projects'
    })
  }
  
  // 保存当前滚动位置
  const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
  sessionStorage.setItem('projectsScrollPosition', scrollPosition.toString())
  router.push(`/projects/${id}`)
}

// 处理GitHub链接点击
const handleGitHubClick = (url, projectName, event) => {
  event.stopPropagation()
  trackLinkClick(url, `GitHub - ${projectName}`)
  trackConversion('project_github_clicked', {
    projectName: projectName,
    linkUrl: url,
    page: '/projects'
  })
}

// 处理Demo链接点击
const handleDemoClick = (url, projectName, event) => {
  event.stopPropagation()
  trackLinkClick(url, `Demo - ${projectName}`)
  trackConversion('project_demo_clicked', {
    projectName: projectName,
    linkUrl: url,
    page: '/projects'
  })
}

const restoreScrollPosition = () => {
  const savedPosition = sessionStorage.getItem('projectsScrollPosition')
  if (savedPosition) {
    nextTick(() => {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition))
        sessionStorage.removeItem('projectsScrollPosition')
      }, 100)
    })
  }
}

onMounted(() => {
  fetchProjects().then(() => {
    restoreScrollPosition()
  })
})

// 监听路由变化，当从详情页返回时恢复滚动位置
watch(() => route.name, (newName) => {
  if (newName === 'Projects') {
    nextTick(() => {
      restoreScrollPosition()
    })
  }
})
</script>

<style scoped>
.projects {
  padding: 2rem 0;
  min-height: calc(100vh - 200px);
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: var(--text-light);
}

.error {
  color: #ef4444;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.project-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  cursor: pointer;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-color);
  background: var(--bg-card-hover);
}

.project-image {
  width: 100%;
  height: 200px;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.project-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  font-size: 4rem;
  color: white;
  opacity: 0.8;
}

.project-content {
  padding: 1.5rem;
}

.project-content h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.project-intro {
  color: var(--text-light);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tech-tag {
  padding: 0.25rem 0.75rem;
  background: rgba(6, 182, 212, 0.1);
  color: var(--primary-color);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tech-tag:hover {
  background: rgba(6, 182, 212, 0.2);
  border-color: var(--primary-color);
}

.project-links {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.project-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s;
}

.project-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.github-button {
  background: var(--primary-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s;
}

.github-button:hover {
  opacity: 1;
  text-decoration: none;
  background: rgba(6, 182, 212, 0.9);
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }

  .project-content {
    padding: 1rem;
  }
}
</style>

