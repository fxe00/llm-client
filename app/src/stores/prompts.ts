import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PromptTemplate {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  description?: string
  variables: string[] // 模板变量，如 {{name}}, {{topic}} 等
  isPublic: boolean
  isFavorite: boolean
  usageCount: number
  createdAt: number
  updatedAt: number
  author?: string
  language: 'zh-CN' | 'en-US'
  estimatedTokens: number
}

export interface PromptCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  isDefault: boolean
}

export interface PromptFilter {
  search: string
  category: string
  tags: string[]
  language: string
  isPublic: boolean | null
  isFavorite: boolean | null
  author: string
}

export const usePromptsStore = defineStore('prompts', () => {
  // 响应式状态
  const prompts = ref<PromptTemplate[]>([])
  const categories = ref<PromptCategory[]>([])
  const isLoading = ref(false)
  const filter = ref<PromptFilter>({
    search: '',
    category: '',
    tags: [],
    language: '',
    isPublic: null,
    isFavorite: null,
    author: ''
  })

  // 默认分类
  const defaultCategories: PromptCategory[] = [
    {
      id: 'general',
      name: '通用',
      description: '通用提示词模板',
      icon: '💬',
      color: '#4a90e2',
      isDefault: true
    },
    {
      id: 'writing',
      name: '写作',
      description: '写作相关的提示词',
      icon: '✍️',
      color: '#f39c12',
      isDefault: true
    },
    {
      id: 'coding',
      name: '编程',
      description: '编程和代码相关的提示词',
      icon: '💻',
      color: '#27ae60',
      isDefault: true
    },
    {
      id: 'analysis',
      name: '分析',
      description: '数据分析和思维导图',
      icon: '📊',
      color: '#e74c3c',
      isDefault: true
    },
    {
      id: 'creative',
      name: '创意',
      description: '创意和艺术相关',
      icon: '🎨',
      color: '#9b59b6',
      isDefault: true
    },
    {
      id: 'education',
      name: '教育',
      description: '学习和教育相关',
      icon: '📚',
      color: '#3498db',
      isDefault: true
    }
  ]

  // 计算属性
  const filteredPrompts = computed(() => {
    let filtered = prompts.value

    // 搜索过滤
    if (filter.value.search) {
      const searchLower = filter.value.search.toLowerCase()
      filtered = filtered.filter(prompt => 
        prompt.title.toLowerCase().includes(searchLower) ||
        prompt.content.toLowerCase().includes(searchLower) ||
        prompt.description?.toLowerCase().includes(searchLower) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // 分类过滤
    if (filter.value.category) {
      filtered = filtered.filter(prompt => prompt.category === filter.value.category)
    }

    // 标签过滤
    if (filter.value.tags.length > 0) {
      filtered = filtered.filter(prompt =>
        filter.value.tags.some(tag => prompt.tags.includes(tag))
      )
    }

    // 语言过滤
    if (filter.value.language) {
      filtered = filtered.filter(prompt => prompt.language === filter.value.language)
    }


    // 公开性过滤
    if (filter.value.isPublic !== null) {
      filtered = filtered.filter(prompt => prompt.isPublic === filter.value.isPublic)
    }

    // 收藏过滤
    if (filter.value.isFavorite !== null) {
      filtered = filtered.filter(prompt => prompt.isFavorite === filter.value.isFavorite)
    }

    // 作者过滤
    if (filter.value.author) {
      filtered = filtered.filter(prompt => prompt.author === filter.value.author)
    }

    // 按使用次数和更新时间排序
    return filtered.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1
      }
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount
      }
      return b.updatedAt - a.updatedAt
    })
  })

  const favoritePrompts = computed(() => 
    prompts.value.filter(prompt => prompt.isFavorite)
  )

  const publicPrompts = computed(() => 
    prompts.value.filter(prompt => prompt.isPublic)
  )

  const allTags = computed(() => {
    const tagSet = new Set<string>()
    prompts.value.forEach(prompt => {
      prompt.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  })

  const allAuthors = computed(() => {
    const authorSet = new Set<string>()
    prompts.value.forEach(prompt => {
      if (prompt.author) {
        authorSet.add(prompt.author)
      }
    })
    return Array.from(authorSet).sort()
  })

  const categoryStats = computed(() => {
    const stats: { [key: string]: number } = {}
    categories.value.forEach(category => {
      stats[category.id] = prompts.value.filter(p => p.category === category.id).length
    })
    return stats
  })

  const totalUsage = computed(() => 
    prompts.value.reduce((total, prompt) => total + prompt.usageCount, 0)
  )

  // 方法
  const loadPrompts = async () => {
    try {
      isLoading.value = true
      
      // 优先从文件系统加载
      if (window.electronAPI && window.electronAPI.loadPrompts) {
        try {
          const filePrompts = await window.electronAPI.loadPrompts()
          if (filePrompts && filePrompts.length > 0) {
            prompts.value = filePrompts
            console.log('✅ 提示词数据已从文件系统加载:', filePrompts.length, '个提示词')
            // 同步到localStorage作为备份
            localStorage.setItem('llm-client-prompts', JSON.stringify(filePrompts))
            return
          }
        } catch (fileError) {
          console.warn('⚠️ 从文件系统加载失败，尝试从localStorage加载:', fileError)
        }
      }
      
      // 从localStorage加载
      const saved = localStorage.getItem('llm-client-prompts')
      if (saved) {
        const parsedPrompts = JSON.parse(saved)
        prompts.value = parsedPrompts
        console.log('✅ 提示词数据已从本地存储加载:', parsedPrompts.length, '个提示词')
      } else {
        prompts.value = []
        console.log('📝 使用空的提示词列表')
      }
    } catch (error) {
      console.error('❌ 加载提示词数据失败:', error)
      prompts.value = []
    } finally {
      isLoading.value = false
    }
  }

  const loadCategories = () => {
    try {
      const saved = localStorage.getItem('llm-client-prompt-categories')
      if (saved) {
        const parsedCategories = JSON.parse(saved)
        categories.value = parsedCategories
      } else {
        categories.value = [...defaultCategories]
        saveCategories()
      }
    } catch (error) {
      console.error('❌ 加载分类数据失败:', error)
      categories.value = [...defaultCategories]
    }
  }

  const savePrompts = async () => {
    try {
      // 保存到localStorage
      localStorage.setItem('llm-client-prompts', JSON.stringify(prompts.value))
      console.log('💾 提示词数据已保存到本地存储:', prompts.value.length, '个提示词')
      
      // 同时保存到文件系统（如果可用）
      if (window.electronAPI && window.electronAPI.savePrompts) {
        try {
          await window.electronAPI.savePrompts(prompts.value)
          console.log('💾 提示词数据已同步到文件系统')
        } catch (fileError) {
          console.warn('⚠️ 保存到文件系统失败，但localStorage已保存:', fileError)
        }
      }
    } catch (error) {
      console.error('❌ 保存提示词数据失败:', error)
    }
  }

  const saveCategories = () => {
    try {
      localStorage.setItem('llm-client-prompt-categories', JSON.stringify(categories.value))
    } catch (error) {
      console.error('❌ 保存分类数据失败:', error)
    }
  }

  const createPrompt = (prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    const newPrompt: PromptTemplate = {
      ...prompt,
      id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0
    }
    
    prompts.value.unshift(newPrompt)
    savePrompts()
    return newPrompt
  }

  const updatePrompt = (id: string, updates: Partial<PromptTemplate>) => {
    const index = prompts.value.findIndex(prompt => prompt.id === id)
    if (index !== -1) {
      prompts.value[index] = { 
        ...prompts.value[index], 
        ...updates, 
        updatedAt: Date.now() 
      }
      savePrompts()
    }
  }

  const deletePrompt = (id: string) => {
    const index = prompts.value.findIndex(prompt => prompt.id === id)
    if (index !== -1) {
      prompts.value.splice(index, 1)
      savePrompts()
    }
  }

  const duplicatePrompt = (id: string) => {
    const originalPrompt = prompts.value.find(p => p.id === id)
    if (originalPrompt) {
      const duplicatedPrompt: PromptTemplate = {
        ...originalPrompt,
        id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `${originalPrompt.title} (副本)`,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      prompts.value.unshift(duplicatedPrompt)
      savePrompts()
      return duplicatedPrompt
    }
  }

  const toggleFavorite = (id: string) => {
    const prompt = prompts.value.find(p => p.id === id)
    if (prompt) {
      prompt.isFavorite = !prompt.isFavorite
      prompt.updatedAt = Date.now()
      savePrompts()
    }
  }

  const incrementUsage = (id: string) => {
    const prompt = prompts.value.find(p => p.id === id)
    if (prompt) {
      prompt.usageCount++
      prompt.updatedAt = Date.now()
      savePrompts()
    }
  }

  const addCategory = (category: Omit<PromptCategory, 'id'>) => {
    const newCategory: PromptCategory = {
      ...category,
      id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    categories.value.push(newCategory)
    saveCategories()
    return newCategory
  }

  const updateCategory = (id: string, updates: Partial<PromptCategory>) => {
    const index = categories.value.findIndex(category => category.id === id)
    if (index !== -1) {
      categories.value[index] = { ...categories.value[index], ...updates }
      saveCategories()
    }
  }

  const deleteCategory = (id: string) => {
    // 不能删除默认分类
    const category = categories.value.find(c => c.id === id)
    if (category && category.isDefault) {
      throw new Error('不能删除默认分类')
    }
    
    const index = categories.value.findIndex(category => category.id === id)
    if (index !== -1) {
      categories.value.splice(index, 1)
      saveCategories()
    }
  }

  const getCategoryById = (id: string) => {
    return categories.value.find(category => category.id === id)
  }

  const clearFilter = () => {
    filter.value = {
      search: '',
      category: '',
      tags: [],
      language: '',
      isPublic: null,
      isFavorite: null,
      author: ''
    }
  }

  const exportPrompts = async (promptIds?: string[]) => {
    const promptsToExport = promptIds 
      ? prompts.value.filter(p => promptIds.includes(p.id))
      : prompts.value

    if (window.electronAPI && window.electronAPI.exportPrompts) {
      try {
        await window.electronAPI.exportPrompts(promptsToExport)
        console.log('📤 提示词数据已导出')
        alert('提示词数据已导出')
      } catch (error) {
        console.error('❌ 导出提示词数据失败:', error)
        alert('导出失败: ' + error)
      }
    } else {
      // 浏览器环境，使用下载
      const dataStr = JSON.stringify(promptsToExport, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `llm-client-prompts-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const importPrompts = async () => {
    if (window.electronAPI && window.electronAPI.importPrompts) {
      try {
        const importedPrompts = await window.electronAPI.importPrompts()
        if (importedPrompts && importedPrompts.length > 0) {
          prompts.value = [...prompts.value, ...importedPrompts]
          await savePrompts()
          console.log('📥 提示词数据已导入:', importedPrompts.length, '个提示词')
          alert('提示词数据已导入: ' + importedPrompts.length + '个提示词')
        }
      } catch (error) {
        console.error('❌ 导入提示词数据失败:', error)
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
            const importedPrompts = JSON.parse(text)
            prompts.value = [...prompts.value, ...importedPrompts]
            await savePrompts()
            console.log('📥 提示词数据已导入:', importedPrompts.length, '个提示词')
            alert('提示词数据已导入: ' + importedPrompts.length + '个提示词')
          } catch (error) {
            console.error('❌ 导入提示词数据失败:', error)
            alert('导入失败: ' + error)
          }
        }
      }
      input.click()
    }
  }

  const clearAllPrompts = () => {
    if (confirm('确定要清空所有提示词吗？此操作不可恢复！')) {
      prompts.value = []
      savePrompts()
    }
  }

  const getPromptStats = () => {
    return {
      totalPrompts: prompts.value.length,
      favoritePrompts: favoritePrompts.value.length,
      publicPrompts: publicPrompts.value.length,
      categoryStats: categoryStats.value
    }
  }

  // 初始化
  loadPrompts()
  loadCategories()

  return {
    // 状态
    prompts,
    categories,
    isLoading,
    filter,
    
    // 计算属性
    filteredPrompts,
    favoritePrompts,
    publicPrompts,
    allTags,
    allAuthors,
    categoryStats,
    totalUsage,
    
    // 方法
    loadPrompts,
    savePrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    duplicatePrompt,
    toggleFavorite,
    incrementUsage,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    clearFilter,
    exportPrompts,
    importPrompts,
    clearAllPrompts,
    getPromptStats
  }
})