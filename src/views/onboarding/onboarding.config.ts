export interface OnboardingModelOption {
  id: string
  label: string
  modelUrl: string
  fallbackImage: string
  previewImage: string
}

const fallbackImages = [
  '/avatars/4c4eae51-6996-40bf-b175-5a2e692a1301.jpg',
  '/avatars/404b0503-83e0-45a3-8a03-9c222e2bdc32.jpg',
  '/avatars/88a1e9e7-378f-4108-b288-c713865a7b03.jpg',
  '/avatars/012fe965-2bf7-4b71-8c21-347f0999ef33.jpg',
] as const

const previewImages = [
  '/avatars/4c4eae51-6996-40bf-b175-5a2e692a1301.jpg',
  '/avatars/404b0503-83e0-45a3-8a03-9c222e2bdc32.jpg',
  '/avatars/88a1e9e7-378f-4108-b288-c713865a7b03.jpg',
  '/avatars/012fe965-2bf7-4b71-8c21-347f0999ef33.jpg',
  '/avatars/1b737fbf-d486-41f9-9627-a2c8157e4279.jpg',
  '/avatars/1ddd88e4-cf6e-49b3-a111-21f630d1575f.jpg',
  '/avatars/1e92af49-74f3-4855-aa4b-757dfe210a7b.jpg',
  '/avatars/4729bbcf-7789-4505-8c03-6be6fdbb962a.jpg',
  '/avatars/4789d992-0668-4358-87c4-606f4e072356-1.jpg',
  '/avatars/4f483526-cf71-4730-a054-005c16996218.jpg',
] as const

export const onboardingModelOptions: OnboardingModelOption[] = [
  { id: 'Bella', label: 'Bella', modelUrl: '/models/profile-avatars/Bella.glb', fallbackImage: fallbackImages[0], previewImage: previewImages[0] },
  { id: 'Stella', label: 'Stella', modelUrl: '/models/profile-avatars/Stella.glb', fallbackImage: fallbackImages[1], previewImage: previewImages[1] },
  { id: 'Zoe', label: 'Zoe', modelUrl: '/models/profile-avatars/Zoe.glb', fallbackImage: fallbackImages[2], previewImage: previewImages[2] },
  { id: 'Luna', label: 'Luna', modelUrl: '/models/profile-avatars/Luna.glb', fallbackImage: fallbackImages[3], previewImage: previewImages[3] },
  { id: 'Mia', label: 'Mia', modelUrl: '/models/profile-avatars/Mia.glb', fallbackImage: fallbackImages[0], previewImage: previewImages[4] },
  { id: 'Finn', label: 'Finn', modelUrl: '/models/profile-avatars/Finn.glb', fallbackImage: fallbackImages[1], previewImage: previewImages[5] },
  { id: 'Owen', label: 'Owen', modelUrl: '/models/profile-avatars/Owen.glb', fallbackImage: fallbackImages[2], previewImage: previewImages[6] },
  { id: 'Sam', label: 'Sam', modelUrl: '/models/profile-avatars/Sam.glb', fallbackImage: fallbackImages[3], previewImage: previewImages[7] },
  { id: 'Noah', label: 'Noah', modelUrl: '/models/profile-avatars/Noah.glb', fallbackImage: fallbackImages[0], previewImage: previewImages[8] },
  { id: 'Leo', label: 'Leo', modelUrl: '/models/profile-avatars/Leo.glb', fallbackImage: fallbackImages[1], previewImage: previewImages[9] },
] as const

export const cameraGuideContent = {
  title: '先挑一个出场形象',
  headline: '从喜欢的分身开始',
  description: '登录前不再需要拍全身照。先从 10 个 3D 形象里选一个喜欢的出场分身，后续 Urpia 会再根据你的回答微调气质。',
  privacyHint: '下一步可上下切换形象，左右旋转查看细节',
  actionLabel: '进入形象库',
}

export const generatingHints = [
  '正在整理 10 个可选形象',
  '校准模型旋转与切换手势',
  '生成你的出场提示词',
  '准备进入引导对话',
]

export const confirmPersonaContent = {
  title: '选择你的出场形象',
  currentLabel: '当前形象',
  rotateHint: '左右滑动旋转当前形象',
  nicknameLabel: 'NICKNAME',
  nicknamePlaceholder: '给这个形象起个名字...',
  confirmLabel: '确认形象并进入对话',
  footerHint: '选中的形象会成为你的初始分身，后续仍可继续调整。',
}

export const onboardingChatContent = {
  title: 'Urpia Guide',
  subtitle: '正在了解你的社交偏好',
  onlineLabel: '在线',
  textPlaceholder: '说说你的想法...',
  waitingLabel: '等待回复...',
  pressToTalkLabel: '按住说话',
  releaseToSendLabel: '松开发送',
}

export const onboardingFollowUps = [
  '先从轻松的开始吧。你更喜欢热闹的场子，还是能慢慢熟起来的空间？',
  '如果需要开启一段新关系，你通常更愿意先观察，还是先主动打招呼？',
  '你希望别人接近你的方式，更像轻轻递来一个话题，还是直接把气氛点燃？',
  '最后一个问题。你希望这个分身更像现在的你，还是更像你想成为的自己？',
  '[DONE] 收到啦。你的出场形象和社交节奏已经对齐，接下来就带你进入城市。 ',
] as const
