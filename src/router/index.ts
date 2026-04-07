import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/onboarding/camera' },
    { path: '/onboarding/camera', component: () => import('../views/onboarding/CameraGuide.vue') },
    { path: '/onboarding/chat', component: () => import('../views/onboarding/AiGuideChat.vue') },
    { path: '/onboarding/generating', component: () => import('../views/onboarding/Generating.vue') },
    { path: '/onboarding/confirm', component: () => import('../views/onboarding/ConfirmPersona.vue') },
    { path: '/map', component: () => import('../views/explore/ExploreMap.vue') },
    { path: '/poi/:id', component: () => import('../views/explore/PoiInfo.vue') },
    { path: '/discovery', component: () => import('../views/explore/DiscoveryPoint.vue') },
    { path: '/reveal', component: () => import('../views/explore/ItemReveal.vue') },
    { path: '/match', component: () => import('../views/social/SocialMatchChat.vue') },
    { path: '/report', component: () => import('../views/social/MatchReport.vue') },
    { path: '/profile', component: () => import('../views/profile/PersonaStatus.vue') },
    { path: '/history', component: () => import('../views/profile/MatchHistory.vue') },
  ],
})

export default router
