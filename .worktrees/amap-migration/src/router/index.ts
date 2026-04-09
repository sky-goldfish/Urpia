import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

type MainTabKey = 'explore' | 'status' | 'social'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/onboarding/camera' },
  { path: '/onboarding/camera', name: 'onboarding-camera', component: () => import('../views/onboarding/CameraGuide.vue') },
  { path: '/onboarding/chat', name: 'onboarding-chat', component: () => import('../views/onboarding/AiGuideChat.vue') },
  { path: '/onboarding/generating', name: 'onboarding-generating', component: () => import('../views/onboarding/Generating.vue') },
  { path: '/onboarding/confirm', name: 'onboarding-confirm', component: () => import('../views/onboarding/ConfirmPersona.vue') },
  { path: '/map', name: 'explore-map', component: () => import('../views/explore/ExploreMap.vue'), meta: { tab: 'explore' satisfies MainTabKey } },
  { path: '/poi/:id', name: 'poi-info', component: () => import('../views/explore/PoiInfo.vue'), meta: { tab: 'explore' satisfies MainTabKey } },
  { path: '/discovery', name: 'discovery-point', component: () => import('../views/explore/DiscoveryPoint.vue'), meta: { tab: 'explore' satisfies MainTabKey } },
  { path: '/reveal', name: 'item-reveal', component: () => import('../views/explore/ItemReveal.vue'), meta: { tab: 'explore' satisfies MainTabKey } },
  { path: '/match', name: 'social-match', component: () => import('../views/social/SocialPage.vue'), meta: { tab: 'social' satisfies MainTabKey } },
  { path: '/report', name: 'social-report', component: () => import('../views/social/MatchReport.vue'), meta: { tab: 'social' satisfies MainTabKey } },
  { path: '/profile', name: 'profile-status', component: () => import('../views/profile/PersonaStatus.vue'), meta: { tab: 'status' satisfies MainTabKey } },
  { path: '/history', name: 'profile-history', component: () => import('../views/profile/MatchHistory.vue'), meta: { tab: 'status' satisfies MainTabKey } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
