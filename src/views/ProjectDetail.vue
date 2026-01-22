<template>
  <div class="project-detail">
    <div class="container">
      <div v-if="loading" class="loading">
        <p>{{ t('projects.detail.loading') }}</p>
      </div>

      <div v-else-if="error" class="error">
        <p>{{ t('projects.detail.error') }} {{ error }}</p>
        <router-link to="/projects" class="btn">{{ t('projects.detail.back') }}</router-link>
      </div>

      <div v-else-if="project" class="project-detail-content">
        <button @click="goBack" class="back-button">← {{ t('projects.detail.back') }}</button>
        
        <h1 class="project-title">{{ project.name }}</h1>
        
        <div class="project-header">
          <p class="project-intro">{{ project.introduction }}</p>
        </div>

        <div class="project-section">
          <h2>{{ t('projects.detail.description') }}</h2>
          <p class="project-description">{{ project.description }}</p>
        </div>

        <div class="project-section">
          <h2>Technologies Used</h2>
          <div class="tech-list">
            <span 
              v-for="tech in project.technologies" 
              :key="tech" 
              class="tech-badge"
            >
              {{ translateTechnology(tech) }}
            </span>
          </div>
        </div>

        <div class="project-screenshots" v-if="project.screenshots && project.screenshots.length > 1">
          <h2>{{ t('projects.detail.screenshots') }}</h2>
          <div class="screenshots-grid">
            <img 
              v-for="(screenshot, index) in project.screenshots.slice(1).filter(s => !isVideoFile(s))" 
              :key="`img-${index}`"
              :src="screenshot" 
              :alt="`Screenshot ${index + 1}`"
              class="screenshot-image"
            />
            <video 
              v-for="(screenshot, index) in project.screenshots.slice(1).filter(s => isVideoFile(s))" 
              :key="`video-${index}`"
              :src="screenshot" 
              controls
              class="screenshot-image"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        <div class="project-links-section" v-if="project.githubUrl || project.demoUrl">
          <h2>{{ t('projects.detail.links') }}</h2>
          <div class="project-links">
            <a 
              v-if="project.githubUrl"
              :href="project.githubUrl" 
              target="_blank" 
              rel="noopener noreferrer"
              class="btn"
              @click="handleGitHubClick(project.githubUrl, project.name)"
            >
              {{ t('projects.detail.viewGithub') }}
            </a>
            <a 
              v-if="project.demoUrl"
              :href="project.demoUrl" 
              target="_blank" 
              rel="noopener noreferrer"
              class="btn btn-secondary"
              @click="handleDemoClick(project.demoUrl, project.name)"
            >
              {{ t('projects.detail.liveDemo') }}
            </a>
          </div>
        </div>
      </div>

      <div v-else class="not-found">
        <p>{{ t('projects.detail.notFound') }}</p>
        <router-link to="/projects" class="btn">{{ t('projects.detail.back') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
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

const project = ref(null)
const loading = ref(true)
const error = ref(null)

const isVideoFile = (url) => {
  const videoExtensions = ['.mov', '.mp4', '.webm', '.ogg', '.avi', '.mkv']
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext))
}


const fetchProject = async () => {
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
    const projects = await response.json()
    const projectId = parseInt(route.params.id)
    const foundProject = projects.find(p => p.id === projectId)
    
    if (foundProject) {
      project.value = foundProject
      // 追踪项目详情页查看
      trackConversion('project_detail_viewed', {
        projectId: projectId,
        projectName: foundProject.name,
        page: `/projects/${projectId}`
      })
    } else {
      error.value = 'Project not found'
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching project:', err)
  } finally {
    loading.value = false
  }
}

// 监听语言变化，重新加载项目
watch(currentLanguage, () => {
  fetchProject()
})

// 处理GitHub链接点击
const handleGitHubClick = (url, projectName) => {
  trackLinkClick(url, `GitHub - ${projectName}`)
  trackConversion('project_detail_github_clicked', {
    projectName: projectName,
    linkUrl: url,
    projectId: route.params.id,
    page: `/projects/${route.params.id}`
  })
}

// 处理Demo链接点击
const handleDemoClick = (url, projectName) => {
  trackLinkClick(url, `Demo - ${projectName}`)
  trackConversion('project_detail_demo_clicked', {
    projectName: projectName,
    linkUrl: url,
    projectId: route.params.id,
    page: `/projects/${route.params.id}`
  })
}

const goBack = () => {
  router.push('/projects')
}

onMounted(() => {
  fetchProject()
})
</script>

<style scoped>
.project-detail {
  padding: 2rem 0;
  min-height: calc(100vh - 200px);
}

.loading,
.error,
.not-found {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: var(--text-light);
}

.error,
.not-found {
  color: #ef4444;
}

.back-button {
  background: transparent;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 2rem;
  font-size: 1rem;
  transition: all 0.3s;
}

.back-button:hover {
  background: var(--primary-color);
  color: var(--bg-color);
  box-shadow: var(--shadow-glow);
}

.project-detail-content {
  max-width: 900px;
  margin: 0 auto;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 3rem;
  box-shadow: var(--shadow);
}

.project-title {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.project-header {
  margin-bottom: 2rem;
}

.project-intro {
  font-size: 1.2rem;
  color: var(--text-light);
  line-height: 1.8;
}

.project-section {
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
}

.project-section:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow-hover);
}

.project-section h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.project-description {
  line-height: 1.8;
  color: var(--text-light);
  font-size: 1.1rem;
}

.tech-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.tech-badge {
  padding: 0.5rem 1rem;
  background: rgba(6, 182, 212, 0.2);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tech-badge:hover {
  background: var(--primary-color);
  color: var(--bg-color);
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
}

.project-screenshots {
  margin-bottom: 3rem;
}

.project-screenshots h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.screenshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.screenshot-image {
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  box-shadow: var(--shadow);
  object-fit: contain;
}

video.screenshot-image {
  display: block;
}

.project-links-section {
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
}

.project-links-section:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow-hover);
}

.project-links-section h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.project-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .project-title {
    font-size: 2rem;
  }

  .project-section {
    padding: 1.5rem;
  }

  .screenshots-grid {
    grid-template-columns: 1fr;
  }

  .project-links {
    flex-direction: column;
  }

  .project-links .btn {
    width: 100%;
  }
}
</style>

