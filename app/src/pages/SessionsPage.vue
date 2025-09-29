<template>
  <div class="sessions-page">
    <div class="page-header">
      <h2>会话历史</h2>
      <a-space>
        <a-button @click="handleRefresh">
          <template #icon>
            <ReloadOutlined />
          </template>
          刷新
        </a-button>
        <a-button type="primary" @click="handleNewSession">
          <template #icon>
            <PlusOutlined />
          </template>
          新建会话
        </a-button>
      </a-space>
    </div>
    
    <!-- 搜索和筛选 -->
    <div class="filters">
      <a-input
        v-model:value="searchKeyword"
        placeholder="搜索会话..."
        :prefix="h(SearchOutlined)"
        style="width: 300px"
        @input="handleSearch"
      />
      
      <a-select
        v-model:value="sortBy"
        placeholder="排序方式"
        style="width: 150px"
        @change="handleSortChange"
      >
        <a-select-option value="updated">最近更新</a-select-option>
        <a-select-option value="created">创建时间</a-select-option>
        <a-select-option value="name">名称</a-select-option>
      </a-select>
    </div>
    
    <!-- 会话列表 -->
    <div class="sessions-list">
      <a-card
        v-for="session in filteredSessions"
        :key="session.id"
        class="session-card"
        :class="{ 'session-active': session.id === chatStore.currentSession?.id }"
        hoverable
        @click="handleSelectSession(session)"
      >
        <div class="session-header">
          <div class="session-info">
            <h4 class="session-name">{{ session.name }}</h4>
            <span class="session-model">{{ session.model }}</span>
          </div>
          <div class="session-actions">
            <a-dropdown>
              <a-button type="text" :icon="h(MoreOutlined)" @click.stop />
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleRenameSession(session)">
                    <EditOutlined />
                    重命名
                  </a-menu-item>
                  <a-menu-item @click="handleExportSession(session)">
                    <DownloadOutlined />
                    导出
                  </a-menu-item>
                  <a-menu-item @click="handleDeleteSession(session.id)" danger>
                    <DeleteOutlined />
                    删除
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
        
        <div class="session-stats">
          <span class="message-count">
            {{ session.messages.length }} 条消息
          </span>
          <span class="session-time">
            {{ formatTime(session.updatedAt) }}
          </span>
        </div>
        
        <div v-if="session.messages.length > 0" class="session-preview">
          <p class="preview-text">
            {{ getLastMessage(session).content.substring(0, 100) }}
            {{ getLastMessage(session).content.length > 100 ? '...' : '' }}
          </p>
        </div>
      </a-card>
    </div>
    
    <!-- 重命名模态框 -->
    <a-modal
      v-model:open="showRenameModal"
      title="重命名会话"
      @ok="handleConfirmRename"
      @cancel="showRenameModal = false"
    >
      <a-input
        v-model:value="newSessionName"
        placeholder="输入新的会话名称"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useAppStore } from '@/stores/app'
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DownloadOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

const chatStore = useChatStore()
const appStore = useAppStore()

const searchKeyword = ref('')
const sortBy = ref('updated')
const showRenameModal = ref(false)
const newSessionName = ref('')
const renamingSession = ref(null)

// 计算过滤后的会话
const filteredSessions = computed(() => {
  let sessions = [...chatStore.sessions]
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    sessions = sessions.filter(session =>
      session.name.toLowerCase().includes(keyword) ||
      session.messages.some(msg => msg.content.toLowerCase().includes(keyword))
    )
  }
  
  // 排序
  sessions.sort((a, b) => {
    switch (sortBy.value) {
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })
  
  return sessions
})

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

// 处理排序变化
const handleSortChange = () => {
  // 排序逻辑已在计算属性中处理
}

// 处理选择会话
const handleSelectSession = (session: any) => {
  chatStore.selectSession(session.id)
  appStore.setCurrentPage('chat')
}

// 处理新建会话
const handleNewSession = () => {
  const sessionName = `新对话 ${new Date().toLocaleString()}`
  chatStore.createSession(sessionName)
  appStore.setCurrentPage('chat')
}

// 处理重命名会话
const handleRenameSession = (session: any) => {
  renamingSession.value = session
  newSessionName.value = session.name
  showRenameModal.value = true
}

// 处理确认重命名
const handleConfirmRename = () => {
  if (renamingSession.value && newSessionName.value.trim()) {
    // 这里应该更新会话名称，但chatStore中没有这个方法
    // 可以添加一个updateSession方法
    showRenameModal.value = false
  }
}

// 处理导出会话
const handleExportSession = (session: any) => {
  const content = session.messages.map(msg => 
    `${msg.role === 'user' ? '用户' : '助手'}: ${msg.content}`
  ).join('\n\n')
  
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${session.name}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// 处理删除会话
const handleDeleteSession = (sessionId: string) => {
  chatStore.deleteSession(sessionId)
}

// 处理刷新
const handleRefresh = () => {
  // 刷新逻辑
}

// 获取最后一条消息
const getLastMessage = (session: any) => {
  return session.messages[session.messages.length - 1] || { content: '' }
}

// 格式化时间
const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
</script>

<style scoped>
.sessions-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.session-card {
  margin-bottom: 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.session-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.session-active {
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.session-info {
  flex: 1;
}

.session-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.session-model {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.session-actions {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.session-card:hover .session-actions {
  opacity: 1;
}

.session-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 12px;
  color: #666;
}

.session-preview {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.preview-text {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 滚动条样式 */
.sessions-list::-webkit-scrollbar {
  width: 6px;
}

.sessions-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.sessions-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.sessions-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
