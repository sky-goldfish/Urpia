import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

type MainTabKey = 'explore' | 'status' | 'social'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/onboarding/camera' },
  { path: '/onboarding/camera', name: 'onboarding-camera', component: () => import('../views/onboarding/CameraGuide.vue') },
  { path: '/onboarding/chat', name: 'onboarding-chat', component: () => import('../views/onboarding/AiGuideChat.vue') },
  { path: '/onboarding/generating', name: 'onboarding-generating', component: () => import('../views/onboarding/Generating.vue') },
  { path: '/onboarding/confirm', name: 'onboarding-confirm', component: () => import('../views/onboarding/ConfirmPersona.vue') },
  // 地图入口页面（模块化，可轻松移除或调整位置）
  { path: '/map-entry', name: 'map-entry', component: () => import('../views/explore/MapEntry.vue'), meta: { tab: 'explore' satisfies MainTabKey } },
  { path: '/map', name: 'explore-map', component: () => import('../views/explore/ExploreMap.vue'), meta: { tab: 'explore' satisfies MainTabKey } },
  { path: '/poi/:id', name: 'poi-info', component: () => import('../views/explore/PoiInfo.vue'), meta: { tab: 'explore' satisfies MainTabKey } },
  // POI室内场景页面 - 支持浏览器前进后退
  {
    path: '/poi/:id/indoor',
    name: 'poi-indoor',
    component: () => import('../views/poi/indoor/POIIndoorView.vue'),
    meta: {
      tab: 'explore' satisfies MainTabKey,
      transition: 'slide-up', // 页面过渡效果
      keepAlive: false // 不缓存，每次进入重新加载
    },
    // 路由参数验证
    beforeEnter: (to, from, next) => {
      const poiId = to.params.id as string
      if (!poiId || poiId.trim() === '') {
        next({ name: 'homemap' })
      } else {
        next()
      }
    }
  },
  { path: '/discovery', name: 'discovery-point', component: () => import('../views/explore/DiscoveryPoint.vue'), meta: { tab: 'explore' satisfies MainTabKey } },
  { path: '/reveal', name: 'item-reveal', component: () => import('../views/explore/ItemReveal.vue'), meta: { tab: 'explore' satisfies MainTabKey } },
  { path: '/homemap', name: 'homemap', component: () => import('../views/explore/Map3DView.vue'), meta: { tab: 'explore' satisfies MainTabKey } },
  { path: '/capsule-demo', name: 'capsule-demo', component: () => import('../assets/styles/CapsuleDemo.vue') },
  { path: '/spirit-bubble', name: 'spirit-bubble', component: () => import('../views/effects/SpiritBubbleDemo.vue') },
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
