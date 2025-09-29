import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface Session {
  id: string
  name: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model: string
}

export const useChatStore = defineStore('chat', () => {
  // 当前会话
  const currentSession = ref<Session | null>(null)
  
  // 所有会话
  const sessions = ref<Session[]>([])
  
  // 当前消息
  const currentMessage = ref('')
  
  // 是否正在发送
  const isSending = ref(false)
  
  // 计算属性
  const currentMessages = computed(() => currentSession.value?.messages || [])
  
  // 方法
  const createSession = (name: string, model: string = 'gpt-4') => {
    const session: Session = {
      id: Date.now().toString(),
      name,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model
    }
    sessions.value.unshift(session)
    currentSession.value = session
    return session
  }
  
  const selectSession = (sessionId: string) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      currentSession.value = session
    }
  }
  
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!currentSession.value) return
    
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    
    currentSession.value.messages.push(newMessage)
    currentSession.value.updatedAt = new Date()
  }
  
  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    if (!currentSession.value) return
    
    const message = currentSession.value.messages.find(m => m.id === messageId)
    if (message) {
      Object.assign(message, updates)
    }
  }
  
  const deleteSession = (sessionId: string) => {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index > -1) {
      sessions.value.splice(index, 1)
      if (currentSession.value?.id === sessionId) {
        currentSession.value = sessions.value[0] || null
      }
    }
  }
  
  const sendMessage = async (content: string) => {
    if (!currentSession.value || !content.trim()) return
    
    // 添加用户消息
    addMessage({
      role: 'user',
      content: content.trim()
    })
    
    // 清空输入框
    currentMessage.value = ''
    
    // 设置发送状态
    isSending.value = true
    
    // 添加助手消息（占位符）
    const assistantMessageId = Date.now().toString()
    addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true
    })
    
    // 模拟AI回复（实际应该调用API）
    setTimeout(() => {
      updateMessage(assistantMessageId, {
        content: `这是对"${content}"的回复。在实际应用中，这里会调用真实的AI API。`,
        isStreaming: false
      })
      isSending.value = false
    }, 2000)
  }
  
  return {
    currentSession,
    sessions,
    currentMessage,
    isSending,
    currentMessages,
    createSession,
    selectSession,
    addMessage,
    updateMessage,
    deleteSession,
    sendMessage
  }
})
