# Urpia

Urpia is a mobile-first social exploration prototype built with Vue 3, Vite, and Three.js. The project combines avatar onboarding, WeChat-style guided chat, map exploration, social matching, and a 3D persona status page into one experience.

## Highlights

- 3D avatar onboarding with a visual character picker
- iPhone-style onboarding chat guided by Urpia Guide
- Explore flow with map, POI, discovery, and reveal pages
- Social flow with matching and report pages
- Profile/status page with a rotatable 3D avatar and quick-access cards
- Express + Prisma backend scaffold in `server/`

## Tech Stack

- Frontend: Vue 3, TypeScript, Vite, Vue Router, Pinia
- 3D: Three.js with GLTFLoader and DRACOLoader
- Backend: Express, Prisma, TypeScript

## Project Structure

```text
D:\CodeWorkSpace\xiaohongshu
|- public/
|  |- draco/                     # Draco decoder files
|  |- guide/                     # Guide avatar assets
|  |- models/
|     |- profile-avatars/        # 3D avatar models used in onboarding/profile
|     |- store-scenes/           # 3D store scene models
|     |- store-signboards/       # 3D signboard models
|- server/                       # Express + Prisma backend
|- src/
|  |- components/                # Shared UI and 3D components
|  |- router/                    # App routes
|  |- stores/                    # Pinia stores
|  |- views/
|     |- onboarding/             # Avatar selection and guide chat
|     |- explore/                # Map and exploration flow
|     |- social/                 # Matching and report flow
|     |- profile/                # Persona status and history
```

## Frontend Setup

Install dependencies:

```bash
npm install
```

Create local env file from the example:

```bash
copy .env.example .env.local
```

Required frontend env vars:

- `VITE_AMAP_KEY`
- `VITE_AMAP_SECURITY_JS_CODE`

Run the frontend dev server:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Backend Setup

Install server dependencies:

```bash
cd server
npm install
```

Run the backend in development:

```bash
npm run dev
```

Build the backend:

```bash
npm run build
```

Run Prisma commands when needed:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

## Main Routes

- `/onboarding/camera`: avatar picker entry
- `/onboarding/confirm`: selected avatar confirmation
- `/onboarding/chat`: Urpia Guide conversation
- `/map`: explore map
- `/match`: social matching
- `/profile`: persona status page

## Notes

- Large 3D assets live under `public/models` so they can be loaded directly by the app.
- Avatar selection is persisted and reused across onboarding and profile pages.
- The backend is scaffolded separately under `server/`, so frontend and backend can be developed independently.
