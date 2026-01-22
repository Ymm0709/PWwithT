<template>
  <div class="home">
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <div class="avatar-container">
            <div class="avatar">
              <img src="/主页照片.png" alt="Profile Photo" class="avatar-image" />
            </div>
          </div>
          <h1 class="hero-title">{{ t('home.title') }}</h1>
          <p class="hero-subtitle">{{ t('home.subtitle') }}</p>
          <div class="contact-links">
            <button @click="handleEmailClick" class="contact-link" title="Email">
              <svg class="contact-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="contact-link-text">Email</span>
            </button>
            <a href="https://github.com/Ymm0709" target="_blank" rel="noopener noreferrer" class="contact-link" title="GitHub" @click="handleGitHubClick">
              <svg class="contact-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="contact-link-text">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Email Modal -->
    <div v-if="showEmailModal" class="modal-overlay" @click="closeEmailModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeEmailModal">&times;</button>
        <div class="modal-body">
          <svg class="modal-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h3 class="modal-title">Email</h3>
          <p class="modal-email" @click="copyEmail">yung230630047@126.com</p>
          <p class="modal-hint">点击邮箱地址复制</p>
        </div>
      </div>
    </div>

    <section class="quick-links">
      <div class="container">
        <h2 class="section-title">{{ t('home.quickNav') }}</h2>
        <div class="links-grid">
          <router-link to="/about" class="link-card" @click="handleNavCardClick('/about', t('home.aboutMe'))">
            <h3>{{ t('home.aboutMe') }}</h3>
            <p>{{ t('home.aboutMeDesc') }}</p>
          </router-link>
          <router-link to="/skills" class="link-card" @click="handleNavCardClick('/skills', t('home.skills'))">
            <h3>{{ t('home.skills') }}</h3>
            <p>{{ t('home.skillsDesc') }}</p>
          </router-link>
          <router-link to="/projects" class="link-card" @click="handleNavCardClick('/projects', t('home.projects'))">
            <h3>{{ t('home.projects') }}</h3>
            <p>{{ t('home.projectsDesc') }}</p>
          </router-link>
          <router-link to="/blog" class="link-card" @click="handleNavCardClick('/blog', t('home.blog'))">
            <h3>{{ t('home.blog') }}</h3>
            <p>{{ t('home.blogDesc') }}</p>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { injectLanguage } from '../composables/useLanguage'
import { useTracking } from '../composables/useTracking'
import { usePageTracking } from '../composables/usePageTracking'

const { t } = injectLanguage()
const { trackButtonClick, trackLinkClick, trackConversion } = useTracking()

// 启用页面追踪（自动追踪停留时长和滚动深度）
usePageTracking()

const showEmailModal = ref(false)

// Email按钮点击
const handleEmailClick = () => {
  showEmailModal.value = true
  trackButtonClick('email_button', { page: '/' })
  trackConversion('email_modal_opened', { page: '/' })
}

// GitHub链接点击
const handleGitHubClick = () => {
  trackLinkClick('https://github.com/Ymm0709', 'GitHub Profile')
  trackConversion('github_link_clicked', { 
    linkUrl: 'https://github.com/Ymm0709',
    page: '/'
  })
}

// 复制邮箱
const copyEmail = async () => {
  const email = 'yung230630047@126.com'
  trackButtonClick('copy_email', { email, page: '/' })
  trackConversion('email_copied', { email, page: '/' })
  
  try {
    await navigator.clipboard.writeText(email)
    alert('邮箱地址已复制到剪贴板！')
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 关闭模态框
const closeEmailModal = () => {
  showEmailModal.value = false
  trackButtonClick('close_email_modal', { page: '/' })
}

// 导航卡片点击（内部链接）
const handleNavCardClick = (path, name) => {
  trackLinkClick(path, name)
  trackConversion('nav_card_clicked', { 
    targetPage: path,
    cardName: name,
    page: '/'
  })
}
</script>

<style scoped>
.home {
  min-height: calc(100vh - 200px);
}

.hero {
  padding: 4rem 0;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-color);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.avatar-container {
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

.avatar {
  width: 220px;
  height: 220px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  border: 5px solid var(--primary-color);
  box-shadow: 0 0 40px rgba(6, 182, 212, 0.6), var(--shadow);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.avatar:hover {
  border-color: var(--secondary-color);
  box-shadow: 0 0 40px rgba(6, 182, 212, 0.7), var(--shadow-hover);
  transform: scale(1.05);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-title {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: bold;
  color: var(--text-color);
  position: relative;
  z-index: 1;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-light);
  position: relative;
  z-index: 1;
}

.contact-links {
  display: flex;
  gap: 2.5rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
  margin-top: 2.5rem;
}

.contact-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-light);
  transition: all 0.3s ease;
  text-decoration: none;
  background: rgba(6, 182, 212, 0.1);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  cursor: pointer;
  min-width: 120px;
}

.contact-link:hover {
  color: var(--primary-color);
  transform: translateY(-5px);
  background: rgba(6, 182, 212, 0.2);
  border-color: var(--primary-color);
  box-shadow: 0 5px 20px rgba(6, 182, 212, 0.4);
}

.contact-icon {
  width: 40px;
  height: 40px;
  stroke: currentColor;
  transition: all 0.3s ease;
}

.contact-link-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: currentColor;
}

.contact-link:hover .contact-icon {
  filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.5));
}

/* Email Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-hover);
  position: relative;
  animation: slideUp 0.3s ease;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--text-light);
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  transition: all 0.3s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close:hover {
  color: var(--primary-color);
  background: rgba(6, 182, 212, 0.1);
  transform: rotate(90deg);
}

.modal-body {
  text-align: center;
  padding: 1rem 0;
}

.modal-icon {
  width: 48px;
  height: 48px;
  color: var(--primary-color);
  margin: 0 auto 1rem;
  stroke: currentColor;
}

.modal-title {
  font-size: 1.5rem;
  color: var(--text-color);
  margin-bottom: 1rem;
  font-weight: 600;
}

.modal-email {
  font-size: 1.2rem;
  color: var(--primary-color);
  margin: 1rem 0;
  padding: 0.75rem 1.5rem;
  background: rgba(6, 182, 212, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  word-break: break-all;
}

.modal-email:hover {
  background: rgba(6, 182, 212, 0.2);
  transform: scale(1.05);
}

.modal-hint {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.quick-links {
  padding: 4rem 0;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.link-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  text-decoration: none;
  color: var(--text-color);
  transition: all 0.3s ease;
}

.link-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-color);
  background: var(--bg-card-hover);
}

.link-card:hover h3 {
  color: var(--primary-color);
}

.link-card h3 {
  color: var(--text-color);
  margin-bottom: 1rem;
  font-size: 1.5rem;
  transition: color 0.3s ease;
}

.link-card p {
  color: var(--text-light);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .contact-links {
    gap: 1.5rem;
  }

  .contact-link {
    padding: 0.75rem 1rem;
    min-width: 100px;
  }

  .contact-icon {
    width: 32px;
    height: 32px;
  }

  .contact-link-text {
    font-size: 0.8rem;
  }

  .avatar {
    width: 180px;
    height: 180px;
  }

  .links-grid {
    grid-template-columns: 1fr;
  }

  .quick-links {
    padding: 2rem 0;
  }
}
</style>

