<script setup lang="ts">
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import { useSocialInboxStore } from './socialInboxStore'

const router = useRouter()
const { sessions } = useSocialInboxStore()

const openChat = (id: string) => {
  void router.push(`/match/${id}`)
}
</script>

<template>
  <main class="chat-list-stage">
    <div class="chat-list-shell">
      <section class="chat-list-screen">
        <header class="list-header">
          <div class="list-header-copy">
            <p class="list-kicker">Social</p>
            <h1 class="list-title">消息</h1>
          </div>
        </header>

        <section class="chat-list-body tabbar-padding">
          <button
            v-for="session in sessions"
            :key="session.id"
            type="button"
            class="chat-row"
            @click="openChat(session.id)"
          >
            <div class="chat-avatar" :style="{ background: session.avatarColor }">
              {{ session.avatarText }}
            </div>

            <div class="chat-main">
              <div class="chat-row-top">
                <h2 class="chat-name">{{ session.name }}</h2>
                <span class="chat-time">{{ session.lastActive }}</span>
              </div>
              <div class="chat-row-bottom">
                <p class="chat-preview">{{ session.subtitle }}</p>
                <span v-if="session.unreadCount > 0" class="chat-unread">{{ session.unreadCount }}</span>
              </div>
            </div>
          </button>
        </section>
      </section>

      <TabBar />
    </div>
  </main>
</template>

<style scoped>
.chat-list-stage {
  position: fixed;
  inset: 0;
  width: 100vw;
  width: 100dvw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top, rgba(244, 244, 246, 0.75), rgba(228, 230, 235, 0.95)),
    linear-gradient(180deg, #d9dbe0, #cfd2d8);
  padding: 24px 16px;
  overflow: hidden;
}

.chat-list-shell {
  width: 100%;
  max-width: min(100%, 480px);
  background: transparent;
}

.chat-list-screen {
  min-height: calc(100vh - 48px);
  min-height: calc(100dvh - 48px);
  background: #ededed;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: calc(env(safe-area-inset-top) + 18px) 18px 14px;
  background: rgba(247, 247, 247, 0.94);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.list-header-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list-kicker {
  margin: 0;
  color: #8b8d94;
  font-size: 12px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.list-title {
  margin: 0;
  color: #111111;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.8px;
}

.chat-list-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 0;
}

.chat-row {
  width: 100%;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  text-align: left;
}

.chat-row:active {
  background: rgba(0, 0, 0, 0.04);
}

.chat-avatar {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
}

.chat-main {
  flex: 1;
  min-width: 0;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

.chat-row-top,
.chat-row-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-row-bottom {
  margin-top: 6px;
}

.chat-name {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: #111111;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.24px;
}

.chat-time {
  color: #9a9da5;
  font-size: 12px;
  flex-shrink: 0;
}

.chat-preview {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: #8b8d94;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-unread {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #ff4d4f;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

@media (max-width: 430px) {
  .chat-list-stage {
    padding: 0;
    background: #2e3138;
  }

  .chat-list-shell {
    width: 100%;
  }

  .chat-list-screen {
    min-height: 100dvh;
  }
}
</style>
