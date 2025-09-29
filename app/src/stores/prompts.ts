import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Prompt {
  id: string
  name: string
  description: string
  content: string
  category: string
  tags: string[]
  variables: PromptVariable[]
  createdAt: Date
  updatedAt: Date
}

export interface PromptVariable {
  name: string
  label: string
  type: 'text' | 'number' | 'select'
  required: boolean
  defaultValue?: string
  options?: string[]
}

export const usePromptsStore = defineStore('prompts', () => {
  // 提示词列表
  const prompts = ref<Prompt[]>([])
  
  // 当前选中的提示词
  const selectedPrompt = ref<Prompt | null>(null)
  
  // 搜索关键词
  const searchKeyword = ref('')
  
  // 选中的分类
  const selectedCategory = ref('all')
  
  // 计算属性
  const filteredPrompts = computed(() => {
    let result = prompts.value
    
    // 按分类过滤
    if (selectedCategory.value !== 'all') {
      result = result.filter(p => p.category === selectedCategory.value)
    }
    
    // 按关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword) ||
        p.content.toLowerCase().includes(keyword) ||
        p.tags.some(tag => tag.toLowerCase().includes(keyword))
      )
    }
    
    return result
  })
  
  const categories = computed(() => {
    const cats = new Set(prompts.value.map(p => p.category))
    return Array.from(cats)
  })
  
  // 方法
  const createPrompt = (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPrompt: Prompt = {
      ...prompt,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    prompts.value.unshift(newPrompt)
    return newPrompt
  }
  
  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    const index = prompts.value.findIndex(p => p.id === id)
    if (index > -1) {
      prompts.value[index] = {
        ...prompts.value[index],
        ...updates,
        updatedAt: new Date()
      }
    }
  }
  
  const deletePrompt = (id: string) => {
    const index = prompts.value.findIndex(p => p.id === id)
    if (index > -1) {
      prompts.value.splice(index, 1)
    }
  }
  
  const selectPrompt = (prompt: Prompt | null) => {
    selectedPrompt.value = prompt
  }
  
  const setSearchKeyword = (keyword: string) => {
    searchKeyword.value = keyword
  }
  
  const setSelectedCategory = (category: string) => {
    selectedCategory.value = category
  }
  
  // 初始化示例数据
  const initSampleData = () => {
    if (prompts.value.length === 0) {
      const samplePrompts: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: '代码审查助手',
          description: '用于代码审查的专业提示词模板',
          content: '你是一个专业的代码审查专家。请仔细审查以下代码，并提供：\n\n1. 代码质量评估\n2. 潜在问题识别\n3. 改进建议\n4. 最佳实践建议\n\n请按照以下格式回复：\n- 总体评价: [评价]\n- 问题列表: [问题1, 问题2, ...]\n- 改进建议: [建议1, 建议2, ...]\n\n代码:\n```{language}\n{code}\n```',
          category: '编程',
          tags: ['代码', '审查', '质量'],
          variables: [
            { name: 'language', label: '编程语言', type: 'text', required: true },
            { name: 'code', label: '代码内容', type: 'text', required: true }
          ]
        },
        {
          name: '产品需求分析',
          description: '分析产品需求并提供建议的模板',
          content: '作为一个产品经理，请分析以下产品需求：\n\n**需求描述：**\n{requirement}\n\n**目标用户：**\n{targetUsers}\n\n请从以下角度进行分析：\n1. 需求合理性\n2. 用户体验\n3. 技术可行性\n4. 商业价值\n5. 风险评估\n\n请提供详细的分析报告和改进建议。',
          category: '产品',
          tags: ['产品', '需求', '分析'],
          variables: [
            { name: 'requirement', label: '需求描述', type: 'text', required: true },
            { name: 'targetUsers', label: '目标用户', type: 'text', required: true }
          ]
        },
        {
          name: '创意写作助手',
          description: '帮助创意写作的灵感提示词',
          content: '你是一个创意写作专家。请根据以下要求创作内容：\n\n**主题：** {topic}\n**风格：** {style}\n**长度：** {length}\n**目标读者：** {audience}\n\n请创作一篇{style}风格的{topic}文章，目标读者是{audience}，长度约{length}字。\n\n要求：\n1. 开头要有吸引力\n2. 结构清晰，逻辑性强\n3. 语言生动，富有感染力\n4. 结尾要有总结或升华',
          category: '写作',
          tags: ['写作', '创意', '内容'],
          variables: [
            { name: 'topic', label: '主题', type: 'text', required: true },
            { name: 'style', label: '风格', type: 'select', required: true, options: ['正式', '轻松', '幽默', '严肃', '抒情'] },
            { name: 'length', label: '长度', type: 'select', required: true, options: ['500字', '1000字', '1500字', '2000字'] },
            { name: 'audience', label: '目标读者', type: 'text', required: true }
          ]
        }
      ]
      
      samplePrompts.forEach(prompt => createPrompt(prompt))
    }
  }
  
  return {
    prompts,
    selectedPrompt,
    searchKeyword,
    selectedCategory,
    filteredPrompts,
    categories,
    createPrompt,
    updatePrompt,
    deletePrompt,
    selectPrompt,
    setSearchKeyword,
    setSelectedCategory,
    initSampleData
  }
})
