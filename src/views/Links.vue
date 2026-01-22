<template>
  <div class="links">
    <div class="container">
      <h1 class="section-title">{{ t('links.title') }}</h1>
      
      <section class="links-section">
        <div class="links-grid">
          <div 
            v-for="link in translatedLinks" 
            :key="link.id" 
            class="link-card"
          >
            <div class="link-icon">{{ link.icon }}</div>
            <h3>{{ link.title }}</h3>
            <p>{{ link.description }}</p>
            <a 
              :href="link.url" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="link-button"
              @click="handleLinkClick(link.url, link.title)"
            >
              {{ t('links.visitSite') }}
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { injectLanguage } from '../composables/useLanguage'
import { useTracking } from '../composables/useTracking'
import { usePageTracking } from '../composables/usePageTracking'

const { t, currentLanguage } = injectLanguage()
const { trackLinkClick, trackConversion } = useTracking()

// 启用页面追踪（自动追踪停留时长和滚动深度）
usePageTracking()

const allLinks = ref([
  {
    id: 1,
    titleKey: 'link1Title',
    descKey: 'link1Desc',
    url: 'https://github.com',
    icon: '💻'
  },
  {
    id: 2,
    titleKey: 'link2Title',
    descKey: 'link2Desc',
    url: 'https://eric.mojalab.cn/',
    icon: '📝'
  },
  {
    id: 3,
    titleKey: 'link3Title',
    descKey: 'link3Desc',
    url: 'https://developer.mozilla.org',
    icon: '📚'
  },
  {
    id: 4,
    titleKey: 'link4Title',
    descKey: 'link4Desc',
    url: 'https://www.manutd.com',
    icon: '⚽'
  },
  {
    id: 5,
    titleKey: 'link5Title',
    descKey: 'link5Desc',
    url: 'https://www.nba.com/clippers',
    icon: '🏀'
  },
  {
    id: 6,
    titleKey: 'link6Title',
    descKey: 'link6Desc',
    url: 'https://vuejs.org',
    icon: '🟢'
  },
  {
    id: 7,
    titleKey: 'link7Title',
    descKey: 'link7Desc',
    url: 'https://www.freecodecamp.org',
    icon: '🎓'
  },
  {
    id: 8,
    titleKey: 'link8Title',
    descKey: 'link8Desc',
    url: 'https://www.instagram.com',
    icon: '📷'
  },
  {
    id: 9,
    titleKey: 'link9Title',
    descKey: 'link9Desc',
    url: 'https://www.youtube.com',
    icon: '📺'
  }
])

const translatedLinks = computed(() => {
  return allLinks.value.map(link => ({
    ...link,
    title: t(`links.${link.titleKey}`),
    description: t(`links.${link.descKey}`)
  }))
})

// 处理链接点击
const handleLinkClick = (url, title) => {
  trackLinkClick(url, title)
  trackConversion('external_link_clicked', {
    linkUrl: url,
    linkTitle: title,
    page: '/links'
  })
}
</script>

<style scoped>
.links {
  padding: 2rem 0;
  min-height: calc(100vh - 200px);
}

.links-section {
  margin-bottom: 4rem;
}

.links-section h2 {
  color: var(--primary-color);
  margin-bottom: 2rem;
  font-size: 2rem;
  text-align: center;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.link-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.link-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-color);
  background: var(--bg-card-hover);
}

.link-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.link-card h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.link-card p {
  color: var(--text-light);
  line-height: 1.6;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.link-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.2s;
  font-weight: 500;
}

.link-button:hover {
  background: var(--primary-hover);
}

@media (max-width: 768px) {
  .links-grid {
    grid-template-columns: 1fr;
  }

  .link-card {
    padding: 1.5rem;
  }
}
</style>

