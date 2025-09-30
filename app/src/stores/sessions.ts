import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  model?: string
  tokens?: number
}

export interface ChatSession {
  id: string
  title: string
  description?: string
  model: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  tags: string[]
  isStarred: boolean
  isArchived: boolean
  totalTokens: number
  messageCount: number
}

export interface SessionFilter {
  search: string
  tags: string[]
  dateRange: {
    start: number | null
    end: number | null
  }
  starred: boolean | null
  archived: boolean | null
  model: string | null
}

export const useSessionsStore = defineStore('sessions', () => {
  // 响应式状态
  const sessions = ref<ChatSession[]>([])
  const currentSessionId = ref<string>('')
  const isLoading = ref(false)
  const filter = ref<SessionFilter>({
    search: '',
    tags: [],
    dateRange: { start: null, end: null },
    starred: null,
    archived: null,
    model: null
  })

  // 计算属性
  const currentSession = computed(() => 
    sessions.value.find(session => session.id === currentSessionId.value)
  )

  const filteredSessions = computed(() => {
    let filtered = sessions.value

    // 搜索过滤
    if (filter.value.search) {
      const searchLower = filter.value.search.toLowerCase()
      filtered = filtered.filter(session => 
        session.title.toLowerCase().includes(searchLower) ||
        session.description?.toLowerCase().includes(searchLower) ||
        session.messages.some(msg => 
          msg.content.toLowerCase().includes(searchLower)
        )
      )
    }

    // 标签过滤
    if (filter.value.tags.length > 0) {
      filtered = filtered.filter(session =>
        filter.value.tags.some(tag => session.tags.includes(tag))
      )
    }

    // 日期范围过滤
    if (filter.value.dateRange.start) {
      filtered = filtered.filter(session => 
        session.createdAt >= filter.value.dateRange.start!
      )
    }
    if (filter.value.dateRange.end) {
      filtered = filtered.filter(session => 
        session.createdAt <= filter.value.dateRange.end!
      )
    }

    // 星标过滤
    if (filter.value.starred !== null) {
      filtered = filtered.filter(session => 
        session.isStarred === filter.value.starred
      )
    }

    // 归档过滤
    if (filter.value.archived !== null) {
      filtered = filtered.filter(session => 
        session.isArchived === filter.value.archived
      )
    }

    // 模型过滤
    if (filter.value.model) {
      filtered = filtered.filter(session => 
        session.model === filter.value.model
      )
    }

    // 按更新时间排序
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt)
  })

  const activeSessions = computed(() => 
    sessions.value.filter(session => !session.isArchived)
  )

  const archivedSessions = computed(() => 
    sessions.value.filter(session => session.isArchived)
  )

  const starredSessions = computed(() => 
    sessions.value.filter(session => session.isStarred)
  )

  const allTags = computed(() => {
    const tagSet = new Set<string>()
    sessions.value.forEach(session => {
      session.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  })

  const allModels = computed(() => {
    const modelSet = new Set<string>()
    sessions.value.forEach(session => {
      modelSet.add(session.model)
    })
    return Array.from(modelSet).sort()
  })

  const totalTokens = computed(() => 
    sessions.value.reduce((total, session) => total + session.totalTokens, 0)
  )

  const totalMessages = computed(() => 
    sessions.value.reduce((total, session) => total + session.messageCount, 0)
  )

  // 方法
  const loadSessions = async () => {
    try {
      isLoading.value = true
      
      // 优先从文件系统加载
      if (window.electronAPI && window.electronAPI.loadSessions) {
        try {
          const fileSessions = await window.electronAPI.loadSessions()
          if (fileSessions && fileSessions.length > 0) {
            sessions.value = fileSessions
            console.log('✅ 会话数据已从文件系统加载:', fileSessions.length, '个会话')
            // 同步到localStorage作为备份
            localStorage.setItem('llm-client-sessions', JSON.stringify(fileSessions))
            return
          }
        } catch (fileError) {
          console.warn('⚠️ 从文件系统加载失败，尝试从localStorage加载:', fileError)
        }
      }
      
      // 从localStorage加载
      const saved = localStorage.getItem('llm-client-sessions')
      if (saved) {
        const parsedSessions = JSON.parse(saved)
        sessions.value = parsedSessions
        console.log('✅ 会话数据已从本地存储加载:', parsedSessions.length, '个会话')
      } else {
        sessions.value = []
        console.log('📝 使用空的会话列表')
      }
    } catch (error) {
      console.error('❌ 加载会话数据失败:', error)
      sessions.value = []
    } finally {
      isLoading.value = false
    }
  }

  const saveSessions = async () => {
    try {
      // 保存到localStorage
      localStorage.setItem('llm-client-sessions', JSON.stringify(sessions.value))
      console.log('💾 会话数据已保存到本地存储:', sessions.value.length, '个会话')
      
      // 同时保存到文件系统（如果可用）
      if (window.electronAPI && window.electronAPI.saveSessions) {
        try {
          await window.electronAPI.saveSessions(sessions.value)
          console.log('💾 会话数据已同步到文件系统')
        } catch (fileError) {
          console.warn('⚠️ 保存到文件系统失败，但localStorage已保存:', fileError)
        }
      }
    } catch (error) {
      console.error('❌ 保存会话数据失败:', error)
    }
  }

  const createSession = (title: string, model: string, description?: string) => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title,
      description,
      model,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      isStarred: false,
      isArchived: false,
      totalTokens: 0,
      messageCount: 0
    }
    
    sessions.value.unshift(newSession)
    currentSessionId.value = newSession.id
    saveSessions()
    return newSession
  }

  const updateSession = (id: string, updates: Partial<ChatSession>) => {
    const index = sessions.value.findIndex(session => session.id === id)
    if (index !== -1) {
      sessions.value[index] = { 
        ...sessions.value[index], 
        ...updates, 
        updatedAt: Date.now() 
      }
      saveSessions()
    }
  }

  const deleteSession = (id: string) => {
    const index = sessions.value.findIndex(session => session.id === id)
    if (index !== -1) {
      sessions.value.splice(index, 1)
      if (currentSessionId.value === id) {
        currentSessionId.value = ''
      }
      saveSessions()
    }
  }

  const addMessage = (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      const newMessage: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      }
      
      session.messages.push(newMessage)
      session.updatedAt = Date.now()
      session.messageCount = session.messages.length
      
      // 更新总令牌数
      if (message.tokens) {
        session.totalTokens += message.tokens
      }
      
      // 自动更新标题（如果是第一条用户消息）
      if (session.messages.length === 1 && message.role === 'user') {
        session.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
      }
      
      saveSessions()
      return newMessage
    }
  }

  const deleteMessage = (sessionId: string, messageId: string) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      const messageIndex = session.messages.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        const message = session.messages[messageIndex]
        session.messages.splice(messageIndex, 1)
        session.messageCount = session.messages.length
        
        // 更新总令牌数
        if (message.tokens) {
          session.totalTokens -= message.tokens
        }
        
        session.updatedAt = Date.now()
        saveSessions()
      }
    }
  }

  const setCurrentSession = (id: string) => {
    currentSessionId.value = id
  }

  const toggleStar = (id: string) => {
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      session.isStarred = !session.isStarred
      session.updatedAt = Date.now()
      saveSessions()
    }
  }

  const toggleArchive = (id: string) => {
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      session.isArchived = !session.isArchived
      session.updatedAt = Date.now()
      saveSessions()
    }
  }

  const addTag = (id: string, tag: string) => {
    const session = sessions.value.find(s => s.id === id)
    if (session && !session.tags.includes(tag)) {
      session.tags.push(tag)
      session.updatedAt = Date.now()
      saveSessions()
    }
  }

  const removeTag = (id: string, tag: string) => {
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      const index = session.tags.indexOf(tag)
      if (index !== -1) {
        session.tags.splice(index, 1)
        session.updatedAt = Date.now()
        saveSessions()
      }
    }
  }

  const clearFilter = () => {
    filter.value = {
      search: '',
      tags: [],
      dateRange: { start: null, end: null },
      starred: null,
      archived: null,
      model: null
    }
  }

  const exportSessions = async (sessionIds?: string[]) => {
    const sessionsToExport = sessionIds 
      ? sessions.value.filter(s => sessionIds.includes(s.id))
      : sessions.value

    if (window.electronAPI && window.electronAPI.exportSessions) {
      try {
        await window.electronAPI.exportSessions(sessionsToExport)
        console.log('📤 会话数据已导出')
        alert('会话数据已导出')
      } catch (error) {
        console.error('❌ 导出会话数据失败:', error)
        alert('导出失败: ' + error)
      }
    } else {
      // 浏览器环境，使用下载
      const dataStr = JSON.stringify(sessionsToExport, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `llm-client-sessions-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const importSessions = async () => {
    if (window.electronAPI && window.electronAPI.importSessions) {
      try {
        const importedSessions = await window.electronAPI.importSessions()
        if (importedSessions && importedSessions.length > 0) {
          sessions.value = [...sessions.value, ...importedSessions]
          await saveSessions()
          console.log('📥 会话数据已导入:', importedSessions.length, '个会话')
          alert('会话数据已导入: ' + importedSessions.length + '个会话')
        }
      } catch (error) {
        console.error('❌ 导入会话数据失败:', error)
        alert('导入失败: ' + error)
      }
    } else {
      // 浏览器环境，使用文件选择
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement
        if (target && target.files && target.files.length > 0) {
          const file = target.files[0]
          try {
            const text = await file.text()
            const importedSessions = JSON.parse(text)
            sessions.value = [...sessions.value, ...importedSessions]
            await saveSessions()
            console.log('📥 会话数据已导入:', importedSessions.length, '个会话')
            alert('会话数据已导入: ' + importedSessions.length + '个会话')
          } catch (error) {
            console.error('❌ 导入会话数据失败:', error)
            alert('导入失败: ' + error)
          }
        }
      }
      input.click()
    }
  }

  const clearAllSessions = () => {
    if (confirm('确定要清空所有会话吗？此操作不可恢复！')) {
      sessions.value = []
      currentSessionId.value = ''
      saveSessions()
    }
  }

  const getSessionStats = () => {
    return {
      totalSessions: sessions.value.length,
      activeSessions: activeSessions.value.length,
      archivedSessions: archivedSessions.value.length,
      starredSessions: starredSessions.value.length,
      totalTokens,
      totalMessages,
      averageMessagesPerSession: sessions.value.length > 0 
        ? Math.round(totalMessages.value / sessions.value.length) 
        : 0
    }
  }

  // 初始化
  loadSessions()

  return {
    // 状态
    sessions,
    currentSessionId,
    isLoading,
    filter,
    
    // 计算属性
    currentSession,
    filteredSessions,
    activeSessions,
    archivedSessions,
    starredSessions,
    allTags,
    allModels,
    totalTokens,
    totalMessages,
    
    // 方法
    loadSessions,
    saveSessions,
    createSession,
    updateSession,
    deleteSession,
    addMessage,
    deleteMessage,
    setCurrentSession,
    toggleStar,
    toggleArchive,
    addTag,
    removeTag,
    clearFilter,
    exportSessions,
    importSessions,
    clearAllSessions,
    getSessionStats
  }
})
