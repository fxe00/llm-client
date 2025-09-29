import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 主题状态
  const isDark = ref(false)
  
  // 侧边栏状态
  const sidebarCollapsed = ref(false)
  
  // 当前页面
  const currentPage = ref('chat')
  
  // 计算属性
  const theme = computed(() => isDark.value ? 'dark' : 'light')
  
  // 方法
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }
  
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  const setCurrentPage = (page: string) => {
    currentPage.value = page
  }
  
  return {
    isDark,
    sidebarCollapsed,
    currentPage,
    theme,
    toggleTheme,
    toggleSidebar,
    setCurrentPage
  }
})
