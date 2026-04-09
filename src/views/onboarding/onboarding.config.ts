export interface OnboardingModelOption {
  id: string
  label: string
  modelUrl: string
  fallbackImage: string
  previewImage: string
}

export const onboardingModelOptions: OnboardingModelOption[] = [
  { id: 'Bella', label: 'Bella', modelUrl: '/models/profile-avatars/girl-01.glb', fallbackImage: '/avatars/girl-01.jpg', previewImage: '/avatars/girl-01.jpg' },
  { id: 'Stella', label: 'Stella', modelUrl: '/models/profile-avatars/girl-02.glb', fallbackImage: '/avatars/girl-02.jpg', previewImage: '/avatars/girl-02.jpg' },
  { id: 'Zoe', label: 'Zoe', modelUrl: '/models/profile-avatars/girl-03.glb', fallbackImage: '/avatars/girl-03.jpg', previewImage: '/avatars/girl-03.jpg' },
  { id: 'Luna', label: 'Luna', modelUrl: '/models/profile-avatars/girl-04.glb', fallbackImage: '/avatars/girl-04.jpg', previewImage: '/avatars/girl-04.jpg' },
  { id: 'Mia', label: 'Mia', modelUrl: '/models/profile-avatars/girl-05.glb', fallbackImage: '/avatars/girl-05.jpg', previewImage: '/avatars/girl-05.jpg' },
  { id: 'Finn', label: 'Finn', modelUrl: '/models/profile-avatars/boy-01.glb', fallbackImage: '/avatars/boy-01.jpg', previewImage: '/avatars/boy-01.jpg' },
  { id: 'Owen', label: 'Owen', modelUrl: '/models/profile-avatars/boy-02.glb', fallbackImage: '/avatars/boy-02.jpg', previewImage: '/avatars/boy-02.jpg' },
  { id: 'Sam', label: 'Sam', modelUrl: '/models/profile-avatars/boy-03.glb', fallbackImage: '/avatars/boy-03.jpg', previewImage: '/avatars/boy-03.jpg' },
  { id: 'Noah', label: 'Noah', modelUrl: '/models/profile-avatars/boy-04.glb', fallbackImage: '/avatars/boy-04.jpg', previewImage: '/avatars/boy-04.jpg' },
  { id: 'Leo', label: 'Leo', modelUrl: '/models/profile-avatars/boy-05.glb', fallbackImage: '/avatars/boy-05.jpg', previewImage: '/avatars/boy-05.jpg' },
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
  '我们先从轻松的开始吧。你更喜欢热闹的场子，还是能慢慢熟起来的空间？',
  '如果需要开启一段新关系，你通常更愿意先观察，还是先主动打招呼？',
  '你希望别人接近你的方式，更像轻轻递来一个话题，还是直接把气氛点燃？',
  '最后一个问题。你希望这个分身更像现在的你，还是更像你想成为的自己？',
  '[DONE] 收到啦。你的出场形象和社交节奏已经对齐，接下来就带你进入城市。 ',
] as const

export const onboardingSystemPrompt = `你是 Urpia Guide，一个温暖、好奇且善于倾听的引导者。你的任务是通过 4-5 个轻松的问题了解用户的社交偏好，帮助他们在 Urpia 这个社交探索应用中找到合适的分身形象。

对话风格：
- 语气亲切自然，像朋友一样聊天
- 回复必须简短，每次不超过50个字
- 问题要简短，一次只问一个
- 根据用户的回答灵活追问，不要死板地按固定问题
- 当用户回答完所有问题后，用 [DONE] 标记结束

当前对话流程（供参考，可灵活调整）：
1. 了解用户喜欢热闹还是安静的社交场合
2. 了解用户是观察者还是主动者
3. 了解用户喜欢的被接近方式
4. 了解用户希望分身更像现在的自己还是理想中的自己
5. 总结并引导用户进入城市探索

记住：保持对话的自然流畅，让用户感觉在和朋友聊天。每次回复控制在50字以内！`

// MOSS TTS 音色配置
export interface VoiceOption {
  id: string
  name: string
  voice: string
  description: string
}

export const voiceOptions: VoiceOption[] = [
  { id: 'alex', name: 'Alex', voice: 'fnlp/MOSS-TTSD-v0.5:alex', description: '温暖男声' },
  { id: 'anna', name: 'Anna', voice: 'fnlp/MOSS-TTSD-v0.5:anna', description: '亲切女声' },
  { id: 'bella', name: 'Bella', voice: 'fnlp/MOSS-TTSD-v0.5:bella', description: '活泼女声' },
  { id: 'benjamin', name: 'Benjamin', voice: 'fnlp/MOSS-TTSD-v0.5:benjamin', description: '沉稳男声' },
  { id: 'charles', name: 'Charles', voice: 'fnlp/MOSS-TTSD-v0.5:charles', description: '磁性男声' },
  { id: 'claire', name: 'Claire', voice: 'fnlp/MOSS-TTSD-v0.5:claire', description: '知性女声' },
  { id: 'david', name: 'David', voice: 'fnlp/MOSS-TTSD-v0.5:david', description: '阳光男声' },
  { id: 'diana', name: 'Diana', voice: 'fnlp/MOSS-TTSD-v0.5:diana', description: '甜美女声' },
] as const

export const defaultVoice = voiceOptions[1] // 默认使用 Anna
