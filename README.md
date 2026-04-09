# Urpia

Urpia 是一个面向移动端的社交探索原型项目，基于 Vue 3、Vite 与 Three.js 构建。当前项目将 3D 形象选择、引导式对话、地图探索、社交匹配和个人状态页整合在同一套体验流程中。

## 项目亮点

- 支持 3D 形象选择与展示
- 提供 iPhone 风格的引导式聊天页面
- 包含地图探索、POI、发现点与物品揭晓流程
- 包含社交匹配与报告页面
- 包含可旋转 3D 形象的个人状态页
- 附带独立的 Express + Prisma 后端脚手架

## 技术栈

- 前端：Vue 3、TypeScript、Vite、Vue Router、Pinia
- 3D：Three.js、GLTFLoader、DRACOLoader
- 后端：Express、Prisma、TypeScript

## 目录结构

```text
D:\CodeWorkSpace\xiaohongshu
|- public/
|  |- draco/                     # Draco 解码文件
|  |- guide/                     # 引导头像资源
|  |- models/
|     |- profile-avatars/        # onboarding / profile 使用的 3D 形象模型
|     |- store-scenes/           # 店铺场景模型
|     |- store-signboards/       # 店铺招牌模型
|- server/                       # Express + Prisma 后端
|- src/
|  |- components/                # 通用组件与 3D 组件
|  |- router/                    # 路由配置
|  |- stores/                    # Pinia 状态管理
|  |- views/
|     |- onboarding/             # 形象选择与引导聊天流程
|     |- explore/                # 地图与探索流程
|     |- social/                 # 社交流程
|     |- profile/                # 状态页与历史页
```

## 前端运行

安装依赖：

```bash
npm install
```

复制环境变量模板：

```bash
copy .env.example .env.local
```

前端需要配置的环境变量：

- `VITE_AMAP_KEY`
- `VITE_AMAP_SECURITY_JS_CODE`

启动前端开发环境：

```bash
npm run dev
```

构建前端：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## 后端运行

安装后端依赖：

```bash
cd server
npm install
```

启动后端开发环境：

```bash
npm run dev
```

构建后端：

```bash
npm run build
```

如需执行 Prisma 相关命令：

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

## 主要页面路由

- `/onboarding/camera`：形象选择入口
- `/onboarding/confirm`：已选形象确认页
- `/onboarding/chat`：Urpia Guide 引导聊天页
- `/map`：探索地图页
- `/match`：社交匹配页
- `/profile`：个人状态页

## 说明

- 大体积 3D 资源统一放在 `public/models` 下，便于前端直接加载。
- 用户选择的形象会在 onboarding 与 profile 页面之间复用。
- 后端位于 `server/` 目录，可与前端并行开发和部署。
