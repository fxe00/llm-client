<template>
  <a-layout class="main-layout">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="appStore.sidebarCollapsed"
      :width="280"
      :collapsed-width="0"
      class="sidebar"
      :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }"
    >
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🧠</span>
          <span v-if="!appStore.sidebarCollapsed" class="logo-text">LLM Client</span>
        </div>
        <a-button
          type="text"
          :icon="appStore.sidebarCollapsed ? h(MenuUnfoldOutlined) : h(MenuFoldOutlined)"
          @click="appStore.toggleSidebar"
          class="sidebar-toggle"
        />
      </div>
      
      <div class="sidebar-content">
        <!-- 导航菜单 -->
        <a-menu
          v-model:selected-keys="selectedKeys"
          mode="inline"
          class="nav-menu"
          @click="handleMenuClick"
        >
          <a-menu-item key="chat">
            <template #icon>
              <MessageOutlined />
            </template>
            聊天对话
          </a-menu-item>
          <a-menu-item key="prompts">
            <template #icon>
              <BulbOutlined />
            </template>
            提示词库
          </a-menu-item>
          <a-menu-item key="sessions">
            <template #icon>
              <HistoryOutlined />
            </template>
            会话历史
          </a-menu-item>
          <a-menu-item key="models">
            <template #icon>
              <SettingOutlined />
            </template>
            模型设置
          </a-menu-item>
        </a-menu>
        
        <!-- 快速操作 -->
        <div class="quick-actions" v-if="!appStore.sidebarCollapsed">
          <a-button
            type="primary"
            block
            @click="handleNewChat"
            class="new-chat-btn"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            新建对话
          </a-button>
        </div>
      </div>
    </a-layout-sider>
    
    <!-- 主内容区域 -->
    <a-layout class="main-content">
      <!-- 顶部工具栏 -->
      <a-layout-header class="header">
        <div class="header-left">
          <a-breadcrumb>
            <a-breadcrumb-item>
              <span class="breadcrumb-item">{{ getPageTitle() }}</span>
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        
        <div class="header-right">
          <a-space>
            <a-tooltip title="切换主题">
              <a-button
                type="text"
                :icon="appStore.isDark ? h(SunOutlined) : h(MoonOutlined)"
                @click="appStore.toggleTheme"
                class="theme-toggle"
              />
            </a-tooltip>
            
            <a-tooltip title="设置">
              <a-button
                type="text"
                :icon="h(SettingOutlined)"
                @click="appStore.setCurrentPage('settings')"
                class="settings-btn"
              />
            </a-tooltip>
          </a-space>
        </div>
      </a-layout-header>
      
      <!-- 内容区域 -->
      <a-layout-content class="content">
        <transition name="fade" mode="out-in">
          <component :is="currentComponent" />
        </transition>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useAppStore } from '@/stores/app'
import { useChatStore } from '@/stores/chat'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  BulbOutlined,
  HistoryOutlined,
  SettingOutlined,
  PlusOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons-vue'

// 导入页面组件
import ChatPage from '@/pages/ChatPage.vue'
import PromptsPage from '@/pages/PromptsPage.vue'
import SessionsPage from '@/pages/SessionsPage.vue'
import ModelsPage from '@/pages/ModelsPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

const appStore = useAppStore()
const chatStore = useChatStore()

const selectedKeys = ref([appStore.currentPage])

// 页面组件映射
const pageComponents = {
  chat: ChatPage,
  prompts: PromptsPage,
  sessions: SessionsPage,
  models: ModelsPage,
  settings: SettingsPage
}

const currentComponent = computed(() => {
  return pageComponents[appStore.currentPage as keyof typeof pageComponents] || ChatPage
})

// 处理菜单点击
const handleMenuClick = ({ key }: { key: string }) => {
  appStore.setCurrentPage(key)
  selectedKeys.value = [key]
}

// 处理新建对话
const handleNewChat = () => {
  const sessionName = `新对话 ${new Date().toLocaleString()}`
  chatStore.createSession(sessionName)
  appStore.setCurrentPage('chat')
  selectedKeys.value = ['chat']
}

// 获取页面标题
const getPageTitle = () => {
  const titles = {
    chat: '聊天对话',
    prompts: '提示词库',
    sessions: '会话历史',
    models: '模型设置',
    settings: '设置'
  }
  return titles[appStore.currentPage as keyof typeof titles] || '聊天对话'
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.sidebar-collapsed {
  background: rgba(255, 255, 255, 0.8);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 18px;
  color: #1890ff;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  transition: opacity 0.3s ease;
}

.sidebar-toggle {
  color: #666;
  transition: all 0.3s ease;
}

.sidebar-toggle:hover {
  color: #1890ff;
  transform: scale(1.1);
}

.sidebar-content {
  padding: 16px 0;
  height: calc(100vh - 80px);
  overflow-y: auto;
}

.nav-menu {
  border: none;
  background: transparent;
}

.nav-menu .ant-menu-item {
  margin: 4px 12px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.nav-menu .ant-menu-item:hover {
  background: rgba(24, 144, 255, 0.1);
  transform: translateX(4px);
}

.nav-menu .ant-menu-item-selected {
  background: rgba(24, 144, 255, 0.15);
  font-weight: 700;
}

.quick-actions {
  padding: 16px 12px;
  margin-top: 16px;
}

.new-chat-btn {
  height: 40px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border: none;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
}

.new-chat-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

.main-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px 0 0 0;
  margin: 8px 8px 8px 0;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.header-left .breadcrumb-item {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.header-right .ant-btn {
  color: #666;
  transition: all 0.3s ease;
}

.header-right .ant-btn:hover {
  color: #1890ff;
  transform: scale(1.1);
}

.content {
  padding: 24px;
  height: calc(100vh - 64px);
  overflow-y: auto;
  background: transparent;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 1000;
    height: 100vh;
  }
  
  .main-content {
    margin: 0;
    border-radius: 0;
  }
}
</style>
