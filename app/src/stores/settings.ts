import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AppSettings {
  theme: 'light' | 'dark'
  colorTheme: 'default' | 'yellow' | 'red' | 'blue' | 'pink' | 'green'
  language: 'zh-CN' | 'en-US'
  fontSize: 'small' | 'medium' | 'large'
  fontFamily: string
  customFonts: Array<{
    name: string
    url: string
    type: 'woff' | 'woff2' | 'ttf' | 'otf'
  }>
  autoSave: boolean
  notifications: boolean
  defaultModel: string
  apiEndpoint: string
  apiKey: string
  maxTokens: number
  temperature: number
}

export const useSettingsStore = defineStore('settings', () => {
  // 默认设置
  const defaultSettings: AppSettings = {
    theme: 'light',
    colorTheme: 'default',
    language: 'zh-CN',
    fontSize: 'medium',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
    customFonts: [],
    autoSave: true,
    notifications: true,
    defaultModel: 'gpt-3.5-turbo',
    apiEndpoint: 'https://api.openai.com/v1',
    apiKey: '',
    maxTokens: 4096,
    temperature: 0.8
  }

  // 响应式状态
  const settings = ref<AppSettings>({ ...defaultSettings })

  // 计算属性
  const isDark = computed(() => settings.value.theme === 'dark')
  const currentLanguage = computed(() => settings.value.language)

  // 方法
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    saveToLocalStorage()
  }

  const resetSettings = () => {
    settings.value = { ...defaultSettings }
    saveToLocalStorage()
  }

  const clearLocalStorage = () => {
    try {
      localStorage.removeItem('llm-client-settings')
      settings.value = { ...defaultSettings }
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('llm-client-settings')
      if (saved) {
        const parsedSettings = JSON.parse(saved)
        settings.value = { ...defaultSettings, ...parsedSettings }
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error)
    }
  }

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('llm-client-settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
    }
  }

  const toggleTheme = () => {
    settings.value.theme = settings.value.theme === 'light' ? 'dark' : 'light'
    saveToLocalStorage()
  }

  const setLanguage = (language: 'zh-CN' | 'en-US') => {
    settings.value.language = language
    saveToLocalStorage()
  }

  const setFontSize = (fontSize: 'small' | 'medium' | 'large') => {
    settings.value.fontSize = fontSize
    saveToLocalStorage()
  }

  const setColorTheme = (colorTheme: 'default' | 'yellow' | 'red' | 'blue' | 'pink' | 'green') => {
    settings.value.colorTheme = colorTheme
    saveToLocalStorage()
  }

  const setFontFamily = (fontFamily: string) => {
    settings.value.fontFamily = fontFamily
    saveToLocalStorage()
  }

  const addCustomFont = (font: { name: string; url: string; type: 'woff' | 'woff2' | 'ttf' | 'otf' }) => {
    settings.value.customFonts.push(font)
    saveToLocalStorage()
  }

  const removeCustomFont = (index: number) => {
    settings.value.customFonts.splice(index, 1)
    saveToLocalStorage()
  }

  // 初始化时从localStorage加载设置
  loadFromLocalStorage()

  return {
    settings,
    isDark,
    currentLanguage,
    updateSettings,
    resetSettings,
    clearLocalStorage,
    toggleTheme,
    setLanguage,
    setFontSize,
    setColorTheme,
    setFontFamily,
    addCustomFont,
    removeCustomFont,
    loadFromLocalStorage,
    saveToLocalStorage
  }
})
