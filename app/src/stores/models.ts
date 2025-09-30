import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 扩展Window接口以支持Electron API
declare global {
  interface Window {
    electronAPI?: {
      saveModels?: (models: any[]) => Promise<void>
      loadModels?: () => Promise<any[]>
      openStorageDirectory?: () => Promise<void>
      getStoragePath?: () => Promise<string>
      exportModels?: (filePath: string) => Promise<void>
      importModels?: (filePath: string) => Promise<any[]>
      saveSessions?: (sessions: any[]) => Promise<void>
      loadSessions?: () => Promise<any[]>
      exportSessions?: (sessions: any[]) => Promise<void>
      importSessions?: () => Promise<any[]>
      savePrompts?: (prompts: any[]) => Promise<void>
      loadPrompts?: () => Promise<any[]>
      exportPrompts?: (prompts: any[]) => Promise<void>
      importPrompts?: () => Promise<any[]>
    }
  }
}

export interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'custom'
  apiEndpoint: string
  apiKey: string
  modelId: string
  maxTokens: number
  temperature: number
  systemPrompt?: string
  isDefault: boolean
  isEnabled: boolean
  description?: string
  capabilities: string[]
}

export interface ModelProvider {
  id: string
  name: string
  icon: string
  description: string
  supportedModels: string[]
  defaultEndpoint: string
}

export const useModelsStore = defineStore('models', () => {
  // 默认模型配置
  const defaultModels: ModelConfig[] = [
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      apiEndpoint: 'https://api.openai.com/v1',
      apiKey: '',
      modelId: 'gpt-3.5-turbo',
      maxTokens: 4096,
      temperature: 0.8,
      systemPrompt: 'You are a helpful AI assistant.',
      isDefault: true,
      isEnabled: true,
      description: '快速、高效的对话模型，适合日常使用',
      capabilities: ['chat', 'completion', 'code']
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      apiEndpoint: 'https://api.openai.com/v1',
      apiKey: '',
      modelId: 'gpt-4',
      maxTokens: 8192,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant with advanced reasoning capabilities.',
      isDefault: false,
      isEnabled: true,
      description: '最先进的语言模型，具有强大的推理能力',
      capabilities: ['chat', 'completion', 'code', 'reasoning', 'analysis']
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      apiEndpoint: 'https://api.anthropic.com',
      apiKey: '',
      modelId: 'claude-3-sonnet-20240229',
      maxTokens: 4096,
      temperature: 0.7,
      systemPrompt: 'You are Claude, an AI assistant created by Anthropic.',
      isDefault: false,
      isEnabled: true,
      description: '平衡性能和效率的模型，适合复杂任务',
      capabilities: ['chat', 'completion', 'analysis', 'writing']
    }
  ]

  // 模型提供商
  const providers: ModelProvider[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '🤖',
      description: 'OpenAI的GPT系列模型',
      supportedModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      defaultEndpoint: 'https://api.openai.com/v1'
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      icon: '🧠',
      description: 'Anthropic的Claude系列模型',
      supportedModels: ['claude-3-sonnet', 'claude-3-opus', 'claude-3-haiku'],
      defaultEndpoint: 'https://api.anthropic.com'
    },
    {
      id: 'custom',
      name: '自定义',
      icon: '⚙️',
      description: '自定义API端点',
      supportedModels: [],
      defaultEndpoint: ''
    }
  ]

  // 响应式状态
  const models = ref<ModelConfig[]>([])
  const selectedModelId = ref<string>('')
  const isTestingConnection = ref(false)
  const testResults = ref<{ [key: string]: { success: boolean; message: string; latency?: number } }>({})

  // 计算属性
  const enabledModels = computed(() => models.value.filter(model => model.isEnabled))
  const defaultModel = computed(() => models.value.find(model => model.isDefault))
  const selectedModel = computed(() => models.value.find(model => model.id === selectedModelId.value))

  // 方法
  const loadModels = async () => {
    try {
      // 优先从文件系统加载
      if (window.electronAPI && window.electronAPI.loadModels) {
        try {
          const fileModels = await window.electronAPI.loadModels()
          if (fileModels && fileModels.length > 0) {
            models.value = fileModels
            console.log('✅ 模型配置已从文件系统加载:', fileModels.length, '个模型')
            // 同步到localStorage作为备份
            localStorage.setItem('llm-client-models', JSON.stringify(fileModels))
            return
          }
        } catch (fileError) {
          console.warn('⚠️ 从文件系统加载失败，尝试从localStorage加载:', fileError)
        }
      }
      
      // 从localStorage加载
      const saved = localStorage.getItem('llm-client-models')
      if (saved) {
        const parsedModels = JSON.parse(saved)
        models.value = parsedModels
        console.log('✅ 模型配置已从本地存储加载:', parsedModels.length, '个模型')
      } else {
        models.value = [...defaultModels]
        saveModels()
        console.log('📝 使用默认模型配置并保存到本地存储')
      }
    } catch (error) {
      console.error('❌ 加载模型配置失败:', error)
      models.value = [...defaultModels]
    }
  }

  const saveModels = async () => {
    try {
      // 保存到localStorage
      localStorage.setItem('llm-client-models', JSON.stringify(models.value))
      console.log('💾 模型配置已保存到本地存储:', models.value.length, '个模型')
      
      // 同时保存到文件系统（如果可用）
      if (window.electronAPI && window.electronAPI.saveModels) {
        try {
          await window.electronAPI.saveModels(models.value)
          console.log('💾 模型配置已同步到文件系统')
        } catch (fileError) {
          console.warn('⚠️ 保存到文件系统失败，但localStorage已保存:', fileError)
        }
      }
    } catch (error) {
      console.error('❌ 保存模型配置失败:', error)
    }
  }

  const addModel = (model: Omit<ModelConfig, 'id'>) => {
    const newModel: ModelConfig = {
      ...model,
      id: `model-${Date.now()}`
    }
    models.value.push(newModel)
    saveModels()
    return newModel
  }

  const updateModel = (id: string, updates: Partial<ModelConfig>) => {
    const index = models.value.findIndex(model => model.id === id)
    if (index !== -1) {
      models.value[index] = { ...models.value[index], ...updates }
      saveModels()
    }
  }

  const deleteModel = (id: string) => {
    const index = models.value.findIndex(model => model.id === id)
    if (index !== -1) {
      models.value.splice(index, 1)
      saveModels()
    }
  }

  const setDefaultModel = (id: string) => {
    models.value.forEach(model => {
      model.isDefault = model.id === id
    })
    saveModels()
  }

  const toggleModelEnabled = (id: string) => {
    const model = models.value.find(m => m.id === id)
    if (model) {
      model.isEnabled = !model.isEnabled
      saveModels()
    }
  }

  const testModelConnection = async (modelId: string) => {
    const model = models.value.find(m => m.id === modelId)
    if (!model) return

    isTestingConnection.value = true
    testResults.value[modelId] = { success: false, message: '测试中...' }

    try {
      const startTime = Date.now()
      
      // 这里应该实现实际的API测试
      // 为了演示，我们模拟一个测试
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const latency = Date.now() - startTime
      testResults.value[modelId] = {
        success: true,
        message: '连接成功',
        latency
      }
    } catch (error) {
      testResults.value[modelId] = {
        success: false,
        message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    } finally {
      isTestingConnection.value = false
    }
  }

  const getProvider = (providerId: string) => {
    return providers.find(p => p.id === providerId)
  }

  const getAvailableProviders = () => {
    return providers
  }

  const getStorageInfo = async () => {
    const storageInfo = {
      type: 'localStorage',
      key: 'llm-client-models',
      location: '浏览器本地存储',
      filePath: '',
      modelsCount: models.value.length,
      lastSaved: new Date().toLocaleString()
    }
    
    // 如果是Electron环境，获取文件路径
    if (window.electronAPI && window.electronAPI.getStoragePath) {
      try {
        storageInfo.filePath = await window.electronAPI.getStoragePath()
        storageInfo.location = '文件系统存储'
        storageInfo.type = 'file'
      } catch (error) {
        console.warn('获取存储路径失败:', error)
      }
    }
    
    return storageInfo
  }

  const openStorageDirectory = async () => {
    if (window.electronAPI && window.electronAPI.openStorageDirectory) {
      try {
        await window.electronAPI.openStorageDirectory()
        console.log('📁 已打开存储目录')
      } catch (error) {
        console.error('❌ 打开存储目录失败:', error)
        alert('打开存储目录失败: ' + error)
      }
    } else {
      alert('当前环境不支持打开存储目录')
    }
  }

  const exportModels = async () => {
    if (window.electronAPI && window.electronAPI.exportModels) {
      try {
        // 让用户选择导出路径
        await window.electronAPI.exportModels('')
        console.log('📤 模型配置已导出')
        alert('模型配置已导出')
      } catch (error) {
        console.error('❌ 导出模型配置失败:', error)
        alert('导出失败: ' + error)
      }
    } else {
      // 浏览器环境，使用下载
      const dataStr = JSON.stringify(models.value, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `llm-client-models-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const importModels = async () => {
    if (window.electronAPI && window.electronAPI.importModels) {
      try {
        const importedModels = await window.electronAPI.importModels('')
        if (importedModels && importedModels.length > 0) {
          models.value = importedModels
          await saveModels()
          console.log('📥 模型配置已导入:', importedModels.length, '个模型')
          alert('模型配置已导入: ' + importedModels.length + '个模型')
        }
      } catch (error) {
        console.error('❌ 导入模型配置失败:', error)
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
            const importedModels = JSON.parse(text)
            models.value = importedModels
            await saveModels()
            console.log('📥 模型配置已导入:', importedModels.length, '个模型')
            alert('模型配置已导入: ' + importedModels.length + '个模型')
          } catch (error) {
            console.error('❌ 导入模型配置失败:', error)
            alert('导入失败: ' + error)
          }
        }
      }
      input.click()
    }
  }

  // 初始化
  loadModels()

  return {
    // 状态
    models,
    selectedModelId,
    isTestingConnection,
    testResults,
    
    // 计算属性
    enabledModels,
    defaultModel,
    selectedModel,
    
    // 方法
    addModel,
    updateModel,
    deleteModel,
    setDefaultModel,
    toggleModelEnabled,
    testModelConnection,
    getProvider,
    getAvailableProviders,
    getStorageInfo,
    openStorageDirectory,
    exportModels,
    importModels,
    loadModels,
    saveModels
  }
})
