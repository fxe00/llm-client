<template>
  <div class="chat-page">
    <!-- 聊天区域 -->
    <div class="chat-container">
      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="chatStore.currentMessages.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <h3>开始新的对话</h3>
          <p>选择一个提示词模板或直接开始聊天</p>
          <a-button type="primary" size="large" @click="showPromptSelector = true">
            <template #icon>
              <BulbOutlined />
            </template>
            选择提示词
          </a-button>
        </div>
        
        <div v-else class="messages-list">
          <transition-group name="message" tag="div">
            <div
              v-for="message in chatStore.currentMessages"
              :key="message.id"
              class="message-item"
              :class="`message-${message.role}`"
            >
              <div class="message-avatar">
                <span v-if="message.role === 'user'">👤</span>
                <span v-else>🤖</span>
              </div>
              
              <div class="message-content">
                <div class="message-header">
                  <span class="message-role">
                    {{ message.role === 'user' ? '你' : '助手' }}
                  </span>
                  <span class="message-time">
                    {{ formatTime(message.timestamp) }}
                  </span>
                </div>
                
                <div class="message-text">
                  <div v-if="message.isStreaming" class="streaming-indicator">
                    <div class="loading-dots">
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                  <div v-else v-html="formatMessage(message.content)"></div>
                </div>
                
                <div class="message-actions" v-if="!message.isStreaming">
                  <a-button type="text" size="small" @click="copyMessage(message.content)">
                    <template #icon>
                      <CopyOutlined />
                    </template>
                  </a-button>
                  <a-button type="text" size="small" @click="regenerateMessage(message.id)">
                    <template #icon>
                      <ReloadOutlined />
                    </template>
                  </a-button>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-container">
        <div class="input-wrapper">
          <a-textarea
            v-model:value="chatStore.currentMessage"
            placeholder="输入你的消息..."
            :auto-size="{ minRows: 1, maxRows: 6 }"
            @keydown="handleKeyDown"
            :disabled="chatStore.isSending"
            class="message-input"
          />
          
          <div class="input-actions">
            <a-space>
              <a-tooltip title="插入提示词">
                <a-button
                  type="text"
                  :icon="h(BulbOutlined)"
                  @click="showPromptSelector = true"
                  :disabled="chatStore.isSending"
                />
              </a-tooltip>
              
              <a-tooltip title="发送 (Ctrl+Enter)">
                <a-button
                  type="primary"
                  :icon="h(SendOutlined)"
                  @click="handleSendMessage"
                  :loading="chatStore.isSending"
                  :disabled="!chatStore.currentMessage.trim()"
                  class="send-btn"
                />
              </a-tooltip>
            </a-space>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 提示词选择器 -->
    <a-modal
      v-model:open="showPromptSelector"
      title="选择提示词模板"
      width="800px"
      :footer="null"
    >
      <PromptSelector @select="handlePromptSelect" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, h } from 'vue'
import { useChatStore } from '@/stores/chat'
import { usePromptsStore } from '@/stores/prompts'
import {
  BulbOutlined,
  SendOutlined,
  CopyOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import PromptSelector from '@/components/prompts/PromptSelector.vue'

const chatStore = useChatStore()
const promptsStore = usePromptsStore()

const messagesContainer = ref<HTMLElement>()
const showPromptSelector = ref(false)

// 处理发送消息
const handleSendMessage = async () => {
  if (!chatStore.currentMessage.trim()) return
  
  await chatStore.sendMessage(chatStore.currentMessage)
  await nextTick()
  scrollToBottom()
}

// 处理键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    handleSendMessage()
  }
}

// 处理提示词选择
const handlePromptSelect = (prompt: any) => {
  chatStore.currentMessage = prompt.content
  showPromptSelector.value = false
}

// 复制消息
const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // 这里可以添加成功提示
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 重新生成消息
const regenerateMessage = (messageId: string) => {
  // 实现重新生成逻辑
  console.log('重新生成消息:', messageId)
}

// 格式化消息内容
const formatMessage = (content: string) => {
  // 简单的Markdown渲染
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}
</script>

<style scoped>
.chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  scroll-behavior: smooth;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.empty-state p {
  font-size: 14px;
  margin-bottom: 24px;
  color: #666;
}

.messages-list {
  padding: 0 16px;
}

.message-item {
  display: flex;
  margin-bottom: 24px;
  animation: slideInUp 0.3s ease;
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: rgba(24, 144, 255, 0.1);
  margin: 0 12px;
  flex-shrink: 0;
}

.message-user .message-avatar {
  background: rgba(24, 144, 255, 0.15);
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message-user .message-content {
  text-align: right;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.message-user .message-header {
  justify-content: flex-end;
}

.message-role {
  font-weight: 600;
  color: #333;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-text {
  background: #f5f5f5;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-user .message-text {
  background: #1890ff;
  color: white;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.message-user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.message-item:hover .message-actions {
  opacity: 1;
}

.message-user .message-actions {
  justify-content: flex-end;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-container {
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.message-input {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
}

.message-input:focus {
  box-shadow: none;
}

.input-actions {
  display: flex;
  align-items: center;
}

.send-btn {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.send-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

/* 动画效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
