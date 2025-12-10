<template>
  <div class="about">
    <div class="container">
      <h1 class="section-title">{{ t('about.title') }}</h1>
      
      <section class="about-section">
        <div class="about-content">
          <div class="about-text">
            <h2>{{ t('about.myStory') }}</h2>
            <p>
              {{ t('about.story1') }}
            </p>
            <p>
              {{ t('about.story2') }}
            </p>
          </div>
          <div class="about-image">
            <img src="/MyPhoto.png" alt="My Photo" class="profile-photo" />
          </div>
        </div>
      </section>

      <div class="interests-courses-container">
        <section class="interests-section">
          <h2 class="section-title-with-icon">
            <svg class="title-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18ZM12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" fill="currentColor"/>
            </svg>
            {{ t('about.academicInterests') }}
          </h2>
          <ul class="interests-list">
            <li>
              <svg class="check-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
              </svg>
              <span>{{ currentLanguage.value === 'zh' ? t('about.hciZh') : t('about.hci') }}</span>
            </li>
            <li>
              <svg class="check-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
              </svg>
              <span>{{ currentLanguage.value === 'zh' ? t('about.dataScienceZh') : t('about.dataScience') }}</span>
            </li>
            <li>
              <svg class="check-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
              </svg>
              <span>{{ currentLanguage.value === 'zh' ? t('about.aiZh') : t('about.ai') }}</span>
            </li>
            <li>
              <svg class="check-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
              </svg>
              <span>{{ currentLanguage.value === 'zh' ? t('about.machineLearningZh') : t('about.machineLearning') }}</span>
            </li>
            <li>
              <svg class="check-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
              </svg>
              <span>{{ currentLanguage.value === 'zh' ? t('about.interactionDesignZh') : t('about.interactionDesign') }}</span>
            </li>
          </ul>
        </section>

        <section class="goals-section">
          <h2 class="section-title-with-icon">
            <svg class="title-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
            </svg>
            {{ t('about.goals') }}
          </h2>
          <div class="goals-content">
            <p>
              {{ t('about.goal1') }}
            </p>
          </div>
        </section>
      </div>

      <div class="passions-goals-container">
        <section class="courses-section">
          <h2 class="section-title-with-icon">
            <svg class="title-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
            {{ t('about.personalInterests') }}
          </h2>
          <div class="interests-icons-grid">
            <div 
              v-for="interest in personalInterests" 
              :key="interest.id"
              class="interest-icon-item"
            >
              <img 
                :src="interest.icon" 
                :alt="interest.name" 
                class="interest-icon"
                :class="{ 'interest-icon-no-bg': interest.removeBg }"
              />
            </div>
          </div>
        </section>

        <section class="passions-section">
          <h2 class="section-title-with-icon">
            <svg class="title-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
            </svg>
            {{ t('about.hobbies') }}
          </h2>
          <div class="hobbies-grid-inline">
            <div 
              v-for="hobby in hobbies" 
              :key="hobby.id" 
              class="hobby-card-inline"
              @click="openHobbyModal(hobby)"
            >
              <div class="hobby-icon-inline">{{ hobby.icon }}</div>
              <span>{{ hobby.nameKey ? t(hobby.nameKey) : hobby.name }}</span>
              <p class="hobby-hint-inline">{{ t('about.hobbyHint') }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>

  <!-- Hobby Modal -->
  <div v-if="selectedHobby" class="hobby-modal-overlay" @click="closeHobbyModal">
    <div class="hobby-modal-content" @click.stop>
      <button class="hobby-modal-close" @click="closeHobbyModal">&times;</button>
      <h2 class="hobby-modal-title">{{ selectedHobby.nameKey ? t(selectedHobby.nameKey) : selectedHobby.name }}</h2>
      
      <div class="hobby-media-container">
        <!-- Photos Section -->
        <div v-if="selectedHobby.photos && selectedHobby.photos.length > 0" class="hobby-photos">
          <h3>{{ t('about.photos') }}</h3>
          <div class="photos-grid">
            <div 
              v-for="(photo, index) in selectedHobby.photos" 
              :key="index"
              class="photo-item"
              @click="openPhotoViewer(photo, selectedHobby.photos)"
            >
              <img :src="photo" :alt="`${selectedHobby.nameKey ? t(selectedHobby.nameKey) : selectedHobby.name} photo ${index + 1}`" />
            </div>
          </div>
        </div>

        <!-- Videos Section -->
        <div v-if="selectedHobby.videos && selectedHobby.videos.length > 0" class="hobby-videos">
          <h3>{{ t('about.videos') }}</h3>
          <div class="videos-grid">
            <div 
              v-for="(video, index) in selectedHobby.videos" 
              :key="index"
              class="video-item"
            >
              <video 
                :src="video" 
                controls 
                preload="metadata"
              >
                您的浏览器不支持视频播放。
              </video>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="(!selectedHobby.photos || selectedHobby.photos.length === 0) && (!selectedHobby.videos || selectedHobby.videos.length === 0)" class="hobby-empty">
          <p>{{ t('about.noMedia') }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Photo Viewer Modal -->
  <div v-if="photoViewerOpen" class="photo-viewer-overlay" @click="closePhotoViewer">
    <button class="photo-viewer-close" @click="closePhotoViewer">&times;</button>
    <button v-if="currentPhotoIndex > 0" class="photo-viewer-nav photo-viewer-prev" @click.stop="prevPhoto">‹</button>
    <div class="photo-viewer-content" @click.stop>
      <img :src="currentPhoto" :alt="`Photo ${currentPhotoIndex + 1}`" />
    </div>
    <button v-if="currentPhotoIndex < allPhotos.length - 1" class="photo-viewer-nav photo-viewer-next" @click.stop="nextPhoto">›</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { injectLanguage } from '../composables/useLanguage'

const { t, currentLanguage } = injectLanguage()

// 爱好数据
const hobbies = ref([
  {
    id: 1,
    nameKey: 'about.football',
    icon: '⚽',
    photos: [
      '/足球/足球1.JPG',
      '/足球/足球2.JPG',
      '/足球/足球3.JPG',
      '/足球/足球4.JPG',
      '/足球/足球5.JPG',
      '/足球/足球6.JPG'
    ],
    videos: [
      '/足球/足球7.MOV',
      '/足球/足球8.mp4'
    ]
  },
  {
    id: 2,
    nameKey: 'about.basketball',
    icon: '🏀',
    photos: [
      '/篮球/4b93e9f3ab7f235202b6e3f60e13a87e.JPG',
      '/篮球/72bbb273fac12653f66bba9502a2258e.JPG',
      '/篮球/72d707b6cc654f86cdb8a79c9389fabd.JPG',
      '/篮球/DSC_7423.JPG',
      '/篮球/FA38BC6A-F13A-40CD-8BDC-614F0450D5DA-2716-0000014041FCD249.PNG',
      '/篮球/IMG_9279.JPG'
    ],
    videos: [
      '/篮球/petal_hdr_20240620_222439.MP4'
    ]
  },
  {
    id: 3,
    nameKey: 'about.frisbee',
    icon: '🥏',
    photos: [
      '/飞盘/飞盘1.JPG',
      '/飞盘/飞盘2.JPG',
      '/飞盘/飞盘3.JPG',
      '/飞盘/飞盘4.JPG',
      '/飞盘/飞盘5.JPG',
      '/飞盘/飞盘6.JPG',
      '/飞盘/飞盘7.JPG',
      '/飞盘/飞盘8.JPG',
      '/飞盘/飞盘9.JPG'
    ],
    videos: []
  },
  {
    id: 4,
    nameKey: 'about.esports',
    icon: '🎮',
    photos: [
      '/E sport/2k-games-2.svg',
      '/E sport/Football_Manager.svg',
      '/E sport/gta-grand-theft-auto.svg',
      '/E sport/valorant-1.svg',
      '/E sport/zelda-logo.svg',
      '/E sport/王者荣耀.jpg'
    ],
    videos: []
  },
  {
    id: 5,
    nameKey: 'about.rugby',
    icon: '🏈',
    photos: [],
    videos: [
      '/橄榄球/DJI_0060-4K.mov'
    ]
  }
])

// 个人兴趣图标数据
const personalInterests = ref([
  { id: 1, name: 'Manchester United', icon: '/Interest/manchester-united.webp' },
  { id: 2, name: 'Los Angeles Clippers', icon: '/Interest/los-angeles-clippers-3.svg' },
  { id: 3, name: 'Zhejiang FC', icon: '/Interest/Crest_of_Zhejiang_FC.svg.png' },
  { id: 4, name: 'Juventus', icon: '/Interest/juventus-4.svg' },
  { id: 5, name: 'Memphis Grizzlies', icon: '/Interest/memphis-grizzlies-1.svg' },
  { id: 6, name: 'Other', icon: '/Interest/5882b2b7d0a20cf431ad7d0ed4435c36acaf2fdd3385.webp' }
])

const selectedHobby = ref(null)
const photoViewerOpen = ref(false)
const currentPhoto = ref('')
const currentPhotoIndex = ref(0)
const allPhotos = ref([])

const openHobbyModal = (hobby) => {
  selectedHobby.value = hobby
}

const closeHobbyModal = () => {
  selectedHobby.value = null
}

const openPhotoViewer = (photo, photos) => {
  allPhotos.value = photos
  currentPhotoIndex.value = photos.indexOf(photo)
  currentPhoto.value = photo
  photoViewerOpen.value = true
}

const closePhotoViewer = () => {
  photoViewerOpen.value = false
  currentPhoto.value = ''
  allPhotos.value = []
}

const prevPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
    currentPhoto.value = allPhotos.value[currentPhotoIndex.value]
  }
}

const nextPhoto = () => {
  if (currentPhotoIndex.value < allPhotos.value.length - 1) {
    currentPhotoIndex.value++
    currentPhoto.value = allPhotos.value[currentPhotoIndex.value]
  }
}
</script>

<style scoped>
.about {
  padding: 2rem 0;
  min-height: calc(100vh - 200px);
}

.about-section {
  margin-bottom: 3rem;
}

.about-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.about-text h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 2rem;
}

.about-text p {
  margin-bottom: 1rem;
  line-height: 1.8;
  color: var(--text-light);
}

.about-image {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.about-image::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.profile-photo {
  width: 100%;
  max-width: 360px;
  height: auto;
  border-radius: 10px;
  border: 2px solid var(--border-color);
  box-shadow: var(--shadow);
  object-fit: cover;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.profile-photo:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-hover), 0 0 30px rgba(6, 182, 212, 0.3);
  border-color: var(--primary-color);
}

.hobbies-section {
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
}

.hobbies-section:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow-hover);
}

.hobbies-section h2 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-size: 2rem;
}

.interests-courses-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.interests-section,
.courses-section {
  padding: 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.interests-section {
  padding-bottom: 1.5rem;
}

.courses-section {
  padding-bottom: 1.5rem;
}

.interests-section:hover,
.courses-section:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow-hover);
}

.interests-section h2,
.courses-section h2,
.goals-section h2,
.passions-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.section-title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--primary-color) !important;
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.title-icon {
  width: 28px;
  height: 28px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.interests-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.interests-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  border: 1px solid transparent;
  color: var(--text-light);
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.interests-list li:hover {
  background: rgba(6, 182, 212, 0.2);
  border: 1px solid var(--primary-color);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
  transform: translateX(5px);
}

.interests-list li:last-child {
  margin-bottom: 0;
}

.check-icon {
  width: 20px;
  height: 20px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.interests-list li span {
  flex: 1;
}

.passions-goals-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.passions-section,
.goals-section {
  padding: 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
}

.passions-section:hover,
.goals-section:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow-hover);
}


.hobbies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.hobby-card {
  padding: 2rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 2px solid var(--border-color);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hobby-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-hover);
  background: var(--bg-card-hover);
}

.hobby-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hobby-card h3 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
}

.hobby-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* Hobby Modal Styles */
.hobby-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
  overflow-y: auto;
  padding: 2rem;
}

.hobby-modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-hover);
  position: relative;
  animation: slideUp 0.3s ease;
}

.hobby-modal-close {
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  z-index: 10;
}

.hobby-modal-close:hover {
  color: var(--primary-color);
  background: rgba(6, 182, 212, 0.1);
  transform: rotate(90deg);
}

.hobby-modal-title {
  color: var(--primary-color);
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.hobby-media-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.hobby-photos h3,
.hobby-videos h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.photo-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
}

.photo-item:hover {
  transform: scale(1.05);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-hover);
}

.photo-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.video-item {
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--border-color);
  background: var(--bg-secondary);
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-item video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #000;
}

.hobby-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

/* Photo Viewer Styles */
.photo-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.3s ease;
}

.photo-viewer-close {
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 2rem;
  cursor: pointer;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.photo-viewer-close:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--primary-color);
  transform: rotate(90deg);
}

.photo-viewer-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-viewer-content img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

.photo-viewer-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 3rem;
  cursor: pointer;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.photo-viewer-nav:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--primary-color);
}

.photo-viewer-prev {
  left: 2rem;
}

.photo-viewer-next {
  right: 2rem;
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


.hobbies-grid-inline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.hobby-card-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  gap: 0.5rem;
}

.hobby-card-inline:hover {
  transform: translateY(-5px);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-hover);
  background: var(--bg-card-hover);
}

.hobby-icon-inline {
  font-size: 2.5rem;
}

.hobby-card-inline span {
  color: var(--text-light);
  font-size: 0.9rem;
  font-weight: 500;
}

.hobby-hint-inline {
  color: var(--text-muted);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}


.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  flex: 1;
}

.interests-icons-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  padding: 1rem 0;
}

.interest-icon-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  aspect-ratio: 1;
}

.interest-icon-item:hover {
  transform: translateY(-5px);
  border-color: var(--primary-color);
  box-shadow: 0 8px 20px rgba(6, 182, 212, 0.3);
  background: var(--bg-card);
}

.interest-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-width: 120px;
  max-height: 120px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  transition: all 0.3s ease;
}

.interest-icon-item:hover .interest-icon {
  transform: scale(1.1);
  filter: drop-shadow(0 4px 8px rgba(6, 182, 212, 0.4));
}

.interest-icon-no-bg {
  mix-blend-mode: multiply;
}

.interest-icon-item:hover .interest-icon-no-bg {
  mix-blend-mode: multiply;
}

.course-card {
  padding: 1.5rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-card span {
  color: var(--text-light);
  font-size: 1rem;
  line-height: 1.5;
  transition: color 0.3s ease;
}

.course-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary-color);
  background: var(--bg-card);
  box-shadow: var(--shadow-hover);
}

.course-card:hover span {
  color: var(--primary-color);
}


.goals-content p {
  margin-bottom: 1.5rem;
  line-height: 1.8;
  color: var(--text-light);
  font-size: 1.15rem;
  padding: 0.5rem 0;
}

@media (max-width: 768px) {
  .about-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .profile-photo {
    max-width: 100%;
    width: 100%;
  }

  .interests-grid {
    grid-template-columns: 1fr;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }

  .interests-icons-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .interest-icon-item {
    padding: 1rem;
  }

  .interest-icon {
    max-width: 80px;
    max-height: 80px;
  }

  .hobbies-section {
    padding: 1.5rem;
  }

  .interests-courses-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .interests-section,
  .courses-section {
    padding: 1.5rem;
  }

  .passions-goals-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .passions-section,
  .goals-section {
    padding: 1.5rem;
  }

  .hobbies-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .hobbies-grid-inline {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .hobby-modal-content {
    padding: 1.5rem;
    max-height: 95vh;
  }

  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .videos-grid {
    grid-template-columns: 1fr;
  }

  .photo-viewer-nav {
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }

  .photo-viewer-prev {
    left: 1rem;
  }

  .photo-viewer-next {
    right: 1rem;
  }
}
</style>

