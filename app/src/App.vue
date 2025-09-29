<template>
  <div class="app-container" :class="{ 'dark-mode': settingsStore.isDark }" :data-theme="settingsStore.settings.colorTheme">
    <div class="sidebar">
      <div class="logo">
        <h2 style="color: #333; margin: 0; padding: 16px;">
          🧠 LLM Client
        </h2>
      </div>
      
      <div class="menu">
        <div 
          v-for="item in menuItems" 
          :key="item.key"
          :class="['menu-item', { active: selectedKey === item.key }]"
          @click="selectedKey = item.key"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span class="menu-text">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="header">
        <div class="header-content">
          <button @click="toggleSidebar" class="trigger">
            {{ collapsed ? '☰' : '✕' }}
          </button>
          
          <div class="header-title">
            <h3 style="margin: 0; color: #1890ff;">
              {{ getPageTitle() }}
            </h3>
          </div>
          
          <div class="header-actions">
            <button @click="toggleTheme" class="theme-btn">
              {{ settingsStore.isDark ? '🌙' : '☀️' }} {{ settingsStore.isDark ? '浅色' : '深色' }}模式
            </button>
          </div>
        </div>
      </div>

      <div class="content">
        <div class="content-wrapper">
          <!-- 聊天页面 -->
          <div v-if="selectedKey === 'chat'" class="page-content">
            <h2>💬 开始新的对话</h2>
            <p>选择您的AI模型，开始智能对话...</p>
            <div class="card">
              <div class="empty-state">
                <h3>聊天功能即将上线</h3>
                <p>正在开发中...</p>
              </div>
            </div>
          </div>

          <!-- 提示词管理页面 -->
          <div v-if="selectedKey === 'prompts'" class="page-content">
            <h2>📝 提示词管理</h2>
            <p>管理和组织您的提示词模板...</p>
            <div class="card">
              <div class="empty-state">
                <h3>提示词管理功能即将上线</h3>
                <p>正在开发中...</p>
              </div>
            </div>
          </div>

          <!-- 会话管理页面 -->
          <div v-if="selectedKey === 'sessions'" class="page-content">
            <h2>📚 会话管理</h2>
            <p>查看和管理您的对话历史...</p>
            <div class="card">
              <div class="empty-state">
                <h3>会话管理功能即将上线</h3>
                <p>正在开发中...</p>
              </div>
            </div>
          </div>

          <!-- 模型配置页面 -->
          <div v-if="selectedKey === 'models'" class="page-content">
            <h2>⚙️ 模型配置</h2>
            <p>配置和管理您的AI模型...</p>
            <div class="card">
              <div class="empty-state">
                <h3>模型配置功能即将上线</h3>
                <p>正在开发中...</p>
              </div>
            </div>
          </div>

          <!-- 设置页面 -->
          <div v-if="selectedKey === 'settings'" class="page-content">
            <h2>🔧 设置</h2>
            <p>个性化您的应用体验...</p>
            
            <div class="settings-container">
              <!-- 外观设置 -->
              <div class="settings-section">
                <h3>🎨 外观设置</h3>
                <div class="setting-item">
                  <label>主题模式</label>
                  <div class="setting-control">
                    <button 
                      @click="settingsStore.toggleTheme()"
                      class="theme-toggle-btn"
                      :class="{ active: settingsStore.isDark }"
                    >
                      {{ settingsStore.isDark ? '🌙 深色模式' : '☀️ 浅色模式' }}
                    </button>
                  </div>
                </div>
                
                <div class="setting-item">
                  <label>颜色主题</label>
                  <div class="setting-control">
                    <div class="theme-selector">
                      <button 
                        v-for="theme in colorThemes" 
                        :key="theme.value"
                        @click="settingsStore.setColorTheme(theme.value)"
                        class="theme-option"
                        :class="{ active: settingsStore.settings.colorTheme === theme.value }"
                        :style="{ backgroundColor: theme.color }"
                      >
                        <span class="theme-icon">{{ theme.icon }}</span>
                        <span class="theme-name">{{ theme.name }}</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="setting-item">
                  <label>字体大小</label>
                  <div class="setting-control">
                    <select 
                      v-model="settingsStore.settings.fontSize"
                      @change="settingsStore.setFontSize(settingsStore.settings.fontSize)"
                      class="setting-select"
                    >
                      <option value="small">小</option>
                      <option value="medium">中</option>
                      <option value="large">大</option>
                    </select>
                  </div>
                </div>
              </div>

                     <!-- 语言设置 -->
                     <div class="settings-section">
                       <h3>🌍 语言设置</h3>
                       <div class="setting-item">
                         <label>界面语言</label>
                         <div class="setting-control">
                           <select 
                             v-model="settingsStore.settings.language"
                             @change="settingsStore.setLanguage(settingsStore.settings.language)"
                             class="setting-select"
                           >
                             <option value="zh-CN">简体中文</option>
                             <option value="en-US">English</option>
                           </select>
                         </div>
                       </div>
                     </div>

                     <!-- 字体设置 -->
                     <div class="settings-section">
                       <h3>🔤 字体设置</h3>
                       
                       <div class="setting-item">
                         <label>字体族</label>
                         <div class="setting-control">
                           <input 
                             type="text" 
                             v-model="settingsStore.settings.fontFamily"
                             @change="settingsStore.setFontFamily(settingsStore.settings.fontFamily)"
                             class="setting-input"
                             placeholder="输入字体名称，如：'Microsoft YaHei', sans-serif"
                           >
                         </div>
                       </div>
                       
                       <div class="setting-item">
                         <label>自定义字体</label>
                         <div class="setting-control">
                           <div class="font-upload-section">
                             <input 
                               type="file" 
                               ref="fontFileInput"
                               @change="handleFontUpload"
                               accept=".woff,.woff2,.ttf,.otf"
                               style="display: none;"
                             >
                             <button @click="$refs.fontFileInput.click()" class="upload-btn">
                               📁 上传字体文件
                             </button>
                             <div class="font-list" v-if="settingsStore.settings.customFonts.length > 0">
                               <div 
                                 v-for="(font, index) in settingsStore.settings.customFonts" 
                                 :key="index"
                                 class="font-item"
                               >
                                 <span class="font-name">{{ font.name }}</span>
                                 <span class="font-type">{{ font.type.toUpperCase() }}</span>
                                 <button @click="settingsStore.removeCustomFont(index)" class="remove-font-btn">
                                   ✕
                                 </button>
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>

              <!-- 功能设置 -->
              <div class="settings-section">
                <h3>⚙️ 功能设置</h3>
                        <div class="setting-item">
                          <label>自动保存</label>
                          <div class="setting-control">
                            <button 
                              @click="settingsStore.updateSettings({ autoSave: !settingsStore.settings.autoSave })"
                              class="toggle-btn"
                              :class="{ active: settingsStore.settings.autoSave }"
                            >
                              <span class="toggle-icon">{{ settingsStore.settings.autoSave ? '✓' : '✕' }}</span>
                              <span class="toggle-text">{{ settingsStore.settings.autoSave ? '开启' : '关闭' }}</span>
                            </button>
                          </div>
                        </div>
                        
                        <div class="setting-item">
                          <label>通知提醒</label>
                          <div class="setting-control">
                            <button 
                              @click="settingsStore.updateSettings({ notifications: !settingsStore.settings.notifications })"
                              class="toggle-btn"
                              :class="{ active: settingsStore.settings.notifications }"
                            >
                              <span class="toggle-icon">{{ settingsStore.settings.notifications ? '✓' : '✕' }}</span>
                              <span class="toggle-text">{{ settingsStore.settings.notifications ? '开启' : '关闭' }}</span>
                            </button>
                          </div>
                        </div>
              </div>

              <!-- API设置 -->
              <div class="settings-section">
                <h3>🔑 API设置</h3>
                <div class="setting-item">
                  <label>默认模型</label>
                  <div class="setting-control">
                    <select 
                      v-model="settingsStore.settings.defaultModel"
                      @change="settingsStore.updateSettings({ defaultModel: settingsStore.settings.defaultModel })"
                      class="setting-select"
                    >
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                    </select>
                  </div>
                </div>
                
                <div class="setting-item">
                  <label>API端点</label>
                  <div class="setting-control">
                    <input 
                      type="text" 
                      v-model="settingsStore.settings.apiEndpoint"
                      @change="settingsStore.updateSettings({ apiEndpoint: settingsStore.settings.apiEndpoint })"
                      class="setting-input"
                      placeholder="https://api.openai.com/v1"
                    >
                  </div>
                </div>
                
                <div class="setting-item">
                  <label>API密钥</label>
                  <div class="setting-control">
                    <input 
                      type="password" 
                      v-model="settingsStore.settings.apiKey"
                      @change="settingsStore.updateSettings({ apiKey: settingsStore.settings.apiKey })"
                      class="setting-input"
                      placeholder="输入您的API密钥"
                    >
                  </div>
                </div>
              </div>

              <!-- 模型参数 -->
              <div class="settings-section">
                <h3>🎛️ 模型参数</h3>
                        <div class="setting-item range-item">
                          <label>最大令牌数: {{ settingsStore.settings.maxTokens }}</label>
                          <div class="setting-control range-control">
                            <input 
                              type="range" 
                              v-model="settingsStore.settings.maxTokens"
                              @change="settingsStore.updateSettings({ maxTokens: settingsStore.settings.maxTokens })"
                              min="100" 
                              max="4096" 
                              step="1"
                              class="setting-range"
                            >
                            <div class="range-labels">
                              <span>100</span>
                              <span>4096</span>
                            </div>
                          </div>
                        </div>
                
                <div class="setting-item range-item">
                  <label>温度: {{ settingsStore.settings.temperature }}</label>
                  <div class="setting-control range-control">
                    <input 
                      type="range" 
                      v-model="settingsStore.settings.temperature"
                      @change="settingsStore.updateSettings({ temperature: settingsStore.settings.temperature })"
                      min="0" 
                      max="2" 
                      step="0.1"
                      class="setting-range"
                    >
                    <div class="range-labels">
                      <span>0 (保守)</span>
                      <span>2 (创新)</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="settings-actions">
                <button @click="settingsStore.resetSettings()" class="reset-btn">
                  🔄 重置设置
                </button>
                <button @click="settingsStore.clearLocalStorage()" class="clear-btn">
                  🗑️ 清除缓存
                </button>
                <button @click="exportSettings()" class="export-btn">
                  📤 导出设置
                </button>
                <button @click="importSettings()" class="import-btn">
                  📥 导入设置
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from './stores/settings'

       // 使用设置store
       const settingsStore = useSettingsStore()

       // 初始化时应用自定义字体
       onMounted(() => {
         applyCustomFonts()
       })

// 响应式数据
const collapsed = ref(false)
const selectedKey = ref('chat')

// 颜色主题选项
const colorThemes = [
  { value: 'default', name: '默认', icon: '⚪', color: '#4a90e2' },
  { value: 'yellow', name: '黄色', icon: '🌻', color: '#d4a574' },
  { value: 'red', name: '红色', icon: '🌹', color: '#d4a5a5' },
  { value: 'blue', name: '蓝色', icon: '🌊', color: '#4a90e2' },
  { value: 'pink', name: '粉色', icon: '🌸', color: '#d4a5c7' },
  { value: 'green', name: '绿色', icon: '🌿', color: '#a5d4a5' }
]

// 菜单项
const menuItems = [
  { key: 'chat', label: '聊天对话', icon: '💬' },
  { key: 'prompts', label: '提示词管理', icon: '📝' },
  { key: 'sessions', label: '会话管理', icon: '📚' },
  { key: 'models', label: '模型配置', icon: '⚙️' },
  { key: 'settings', label: '设置', icon: '🔧' }
]

// 计算属性
const isDark = computed(() => settingsStore.isDark)

// 方法
const getPageTitle = () => {
  const item = menuItems.find(item => item.key === selectedKey.value)
  return item ? item.label : 'LLM Client'
}

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const toggleTheme = () => {
  settingsStore.toggleTheme()
}

// 设置页面方法
const exportSettings = () => {
  const settings = settingsStore.settings
  const dataStr = JSON.stringify(settings, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'llm-client-settings.json'
  link.click()
  URL.revokeObjectURL(url)
}

       const importSettings = () => {
         const input = document.createElement('input')
         input.type = 'file'
         input.accept = '.json'
         input.onchange = (e) => {
           const target = e.target
           if (target && target.files && target.files.length > 0) {
             const file = target.files[0]
             if (file) {
               const reader = new FileReader()
               reader.onload = (e) => {
                 try {
                   const result = e.target?.result
                   if (result) {
                     const settings = JSON.parse(String(result))
                     settingsStore.updateSettings(settings)
                     alert('设置导入成功！')
                   }
                 } catch (error) {
                   alert('设置文件格式错误！')
                 }
               }
               reader.readAsText(file)
             }
           }
         }
         input.click()
       }

       // 字体上传处理
       const handleFontUpload = (event) => {
         const target = event.target
         if (target && target.files && target.files.length > 0) {
           const file = target.files[0]
           const fileName = file.name
           const fileExtension = fileName.split('.').pop()?.toLowerCase()
           
           if (!['woff', 'woff2', 'ttf', 'otf'].includes(fileExtension || '')) {
             alert('请选择支持的字体文件格式：woff, woff2, ttf, otf')
             return
           }
           
           const reader = new FileReader()
           reader.onload = (e) => {
             try {
               const result = e.target?.result
               if (result) {
                 // 创建字体URL
                 const fontUrl = URL.createObjectURL(file)
                 
                 // 获取字体名称（去掉扩展名）
                 const fontName = fileName.replace(/\.[^/.]+$/, '')
                 
                 // 添加自定义字体
                 const fontType = ['woff', 'woff2', 'ttf', 'otf'].includes(fileExtension || '') 
                   ? fileExtension 
                   : 'ttf'
                 settingsStore.addCustomFont({
                   name: fontName,
                   url: fontUrl,
                   type: fontType
                 })
                 
                 // 应用字体
                 applyCustomFonts()
                 
                 alert(`字体 "${fontName}" 上传成功！`)
               }
             } catch (error) {
               alert('字体文件读取失败！')
             }
           }
           reader.readAsArrayBuffer(file)
         }
       }

       // 应用自定义字体
       const applyCustomFonts = () => {
         // 移除之前的字体样式
         const existingStyle = document.getElementById('custom-fonts-style')
         if (existingStyle) {
           existingStyle.remove()
         }
         
         // 创建新的字体样式
         const style = document.createElement('style')
         style.id = 'custom-fonts-style'
         
         let fontFaceCSS = ''
         settingsStore.settings.customFonts.forEach(font => {
           fontFaceCSS += `
             @font-face {
               font-family: '${font.name}';
               src: url('${font.url}') format('${font.type === 'ttf' ? 'truetype' : font.type}');
               font-display: swap;
             }
           `
         })
         
         style.textContent = fontFaceCSS
         document.head.appendChild(style)
         
         // 更新body字体
         if (settingsStore.settings.customFonts.length > 0) {
           const customFontNames = settingsStore.settings.customFonts.map(font => `'${font.name}'`).join(', ')
           document.body.style.fontFamily = `${customFontNames}, ${settingsStore.settings.fontFamily}`
         } else {
           document.body.style.fontFamily = settingsStore.settings.fontFamily
         }
       }
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  transition: all 0.3s ease;
  background: var(--bg-gradient, linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%));
}

/* 主题颜色变量 */
.app-container[data-theme="default"] {
  --primary-color: #4a90e2;
  --primary-dark: #357abd;
  --primary-light: #f0f7ff;
  --text-color: #2c3e50;
  --bg-gradient: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  --sidebar-gradient: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
  --border-color: #dee2e6;
}

.app-container[data-theme="yellow"] {
  --primary-color: #d4a574;
  --primary-dark: #c1965a;
  --primary-light: #fefcf7;
  --text-color: #8b6914;
  --bg-gradient: linear-gradient(135deg, #fefcf7 0%, #faf6f0 100%);
  --sidebar-gradient: linear-gradient(180deg, #fefcf7 0%, #f5f0e8 100%);
  --border-color: #e6d7a3;
}

.app-container[data-theme="red"] {
  --primary-color: #d4a5a5;
  --primary-dark: #c19696;
  --primary-light: #fdf7f7;
  --text-color: #8b4a4a;
  --bg-gradient: linear-gradient(135deg, #fdf7f7 0%, #f5e8e8 100%);
  --sidebar-gradient: linear-gradient(180deg, #fdf7f7 0%, #f5e8e8 100%);
  --border-color: #e6c7c7;
}

.app-container[data-theme="blue"] {
  --primary-color: #4a90e2;
  --primary-dark: #357abd;
  --primary-light: #f0f7ff;
  --text-color: #2c3e50;
  --bg-gradient: linear-gradient(135deg, #f0f7ff 0%, #e8f2ff 100%);
  --sidebar-gradient: linear-gradient(180deg, #f0f7ff 0%, #e8f2ff 100%);
  --border-color: #c7d8f0;
}

.app-container[data-theme="pink"] {
  --primary-color: #d4a5c7;
  --primary-dark: #c196b8;
  --primary-light: #fdf7fc;
  --text-color: #8b4a7a;
  --bg-gradient: linear-gradient(135deg, #fdf7fc 0%, #f5e8f2 100%);
  --sidebar-gradient: linear-gradient(180deg, #fdf7fc 0%, #f5e8f2 100%);
  --border-color: #e6c7d8;
}

.app-container[data-theme="green"] {
  --primary-color: #a5d4a5;
  --primary-dark: #96c196;
  --primary-light: #f7fdf7;
  --text-color: #4a8b4a;
  --bg-gradient: linear-gradient(135deg, #f7fdf7 0%, #e8f5e8 100%);
  --sidebar-gradient: linear-gradient(180deg, #f7fdf7 0%, #e8f5e8 100%);
  --border-color: #c7e6c7;
}

/* 深色模式样式 */
.app-container.dark-mode {
  background: #1a1a1a;
}

.app-container.dark-mode .sidebar {
  background: #001529;
}

.app-container.dark-mode .main-content {
  background: #1a1a1a;
}

.app-container.dark-mode .header {
  background: #2d2d2d;
  color: #fff;
}

.app-container.dark-mode .content {
  background: #1a1a1a;
}

.app-container.dark-mode .page-content {
  background: #2d2d2d;
  color: #fff;
}

.app-container.dark-mode .page-content h2 {
  color: #1890ff;
}

.app-container.dark-mode .page-content p {
  color: #ccc;
}

.app-container.dark-mode .settings-section {
  background: #2d2d2d;
  color: #fff;
}

.app-container.dark-mode .settings-section h3 {
  color: #1890ff;
}

.app-container.dark-mode .setting-item label {
  color: #fff;
}

.app-container.dark-mode .setting-select,
.app-container.dark-mode .setting-input {
  background: #3d3d3d;
  border-color: #555;
  color: #fff;
}

.app-container.dark-mode .setting-select:focus,
.app-container.dark-mode .setting-input:focus {
  border-color: #1890ff;
  background: #3d3d3d;
}

.app-container.dark-mode .theme-toggle-btn {
  background: #3d3d3d;
  border-color: #555;
  color: #fff;
}

.app-container.dark-mode .theme-toggle-btn:hover {
  border-color: #1890ff;
}

.app-container.dark-mode .theme-toggle-btn.active {
  background: #1890ff;
  color: white;
}

.app-container.dark-mode .card {
  background: #2d2d2d;
  border-color: #555;
  color: #fff;
}

.app-container.dark-mode .empty-state h3 {
  color: #999;
}

.app-container.dark-mode .empty-state p {
  color: #666;
}

.sidebar {
  width: 280px;
  background: var(--sidebar-gradient, linear-gradient(180deg, #f9f6e8 0%, #f5f0d8 100%));
  color: var(--text-color, #8b6914);
  transition: width 0.3s;
  border-right: 1px solid var(--border-color, #e6d7a3);
  box-shadow: 2px 0 8px rgba(139, 105, 20, 0.1);
}

.logo {
  border-bottom: 1px solid rgba(139, 105, 20, 0.2);
  margin-bottom: 16px;
}

.menu {
  padding: 16px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.menu-item:hover {
  background-color: var(--primary-light, rgba(255, 193, 7, 0.2));
}

.menu-item.active {
  background-color: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  font-weight: bold;
}

.menu-icon {
  margin-right: 12px;
  font-size: 16px;
}

.menu-text {
  font-size: 14px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-gradient, #fffef7);
}

.header {
  background: var(--bg-gradient, linear-gradient(90deg, #fffef7 0%, #f9f6e8 100%));
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(139, 105, 20, 0.1);
  display: flex;
  align-items: center;
  height: 64px;
  border-bottom: 1px solid var(--border-color, #e6d7a3);
}

.header-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.trigger {
  font-size: 18px;
  margin-right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.header-title {
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.theme-btn {
  background: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.content {
  flex: 1;
  padding: 24px;
  background: #f5f5f5;
  overflow-y: auto;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.page-content {
  background: var(--bg-gradient, linear-gradient(135deg, #fffef7 0%, #f9f6e8 100%));
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(139, 105, 20, 0.1);
  border: 1px solid var(--border-color, #e6d7a3);
}

.page-content h2 {
  color: var(--text-color, #8b6914);
  margin-bottom: 8px;
}

.page-content p {
  color: #666;
  margin-bottom: 24px;
}

.card {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
}

.empty-state h3 {
  color: #999;
  margin-bottom: 8px;
}

.empty-state p {
  color: #ccc;
  margin: 0;
}

/* 设置页面样式 */
.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.settings-section {
  background: var(--bg-gradient, linear-gradient(135deg, #fffef7 0%, #f9f6e8 100%));
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(139, 105, 20, 0.1);
  border: 1px solid var(--border-color, #e6d7a3);
}

.settings-section h3 {
  color: var(--text-color, #8b6914);
  margin-bottom: 20px;
  font-size: 18px;
  border-bottom: 2px solid var(--border-color, #e6d7a3);
  padding-bottom: 8px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  min-height: 50px;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item label {
  font-weight: 500;
  color: #333;
  min-width: 120px;
  flex-shrink: 0;
}

.setting-control {
  flex: 1;
  max-width: 300px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.setting-select,
.setting-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.setting-select:focus,
.setting-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.theme-toggle-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.theme-toggle-btn:hover {
  border-color: #1890ff;
}

.theme-toggle-btn.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

/* 现代切换按钮样式 */
.toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 2px solid #d9d9d9;
  border-radius: 20px;
  background: white;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  min-width: 80px;
  justify-content: center;
}

.toggle-btn:hover {
  border-color: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 193, 7, 0.2);
}

.toggle-btn.active {
  background: var(--primary-color, #ffc107);
  border-color: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.toggle-btn.active:hover {
  background: var(--primary-dark, #ffb300);
  border-color: var(--primary-dark, #ffb300);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 193, 7, 0.4);
}

.toggle-icon {
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.toggle-text {
  font-size: 12px;
  transition: all 0.3s ease;
}

.app-container.dark-theme .toggle-btn {
  background: #333;
  border-color: #555;
  color: #ccc;
}

.app-container.dark-theme .toggle-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.app-container.dark-theme .toggle-btn.active {
  background: var(--primary-color, #ffc107);
  border-color: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
}

/* 滑块样式 */
.setting-range {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.setting-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
}

.setting-range {
  -webkit-appearance: none;
  appearance: none;
}

.setting-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
  border: none;
}

/* 滑块专用布局 */
.range-item {
  flex-direction: column;
  align-items: flex-start;
  min-height: 80px;
}

.range-control {
  width: 100%;
  max-width: 100%;
  flex-direction: column;
  align-items: stretch;
}

.setting-range {
  margin-bottom: 8px;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
  padding: 0 10px;
}

/* 操作按钮 */
.settings-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.reset-btn,
.clear-btn,
.export-btn,
.import-btn {
  padding: 10px 20px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.reset-btn:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.clear-btn:hover {
  border-color: #fa8c16;
  color: #fa8c16;
}

.export-btn:hover {
  border-color: #52c41a;
  color: #52c41a;
}

.import-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 深色模式滑块样式 */
.app-container.dark-theme .setting-range {
  background: #555;
}

.app-container.dark-theme .range-labels {
  color: #bbb;
}

/* 主题选择器样式 */
.theme-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.theme-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.theme-option.active {
  border-color: #333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.theme-icon {
  font-size: 20px;
}

.theme-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.app-container.dark-theme .theme-option {
  background: #333;
}

.app-container.dark-theme .theme-option.active {
  border-color: #fff;
}

       .app-container.dark-theme .theme-name {
         color: #fff;
       }

       /* 字体设置样式 */
       .font-upload-section {
         display: flex;
         flex-direction: column;
         gap: 12px;
         width: 100%;
       }

       .upload-btn {
         padding: 8px 16px;
         border: 2px dashed var(--border-color, #d9d9d9);
         border-radius: 8px;
         background: var(--primary-light, #f8f9fa);
         color: var(--text-color, #333);
         cursor: pointer;
         transition: all 0.3s ease;
         font-size: 14px;
         text-align: center;
       }

       .upload-btn:hover {
         border-color: var(--primary-color, #1890ff);
         background: var(--primary-light, #f0f7ff);
         transform: translateY(-1px);
       }

       .font-list {
         display: flex;
         flex-direction: column;
         gap: 8px;
         max-height: 200px;
         overflow-y: auto;
       }

       .font-item {
         display: flex;
         align-items: center;
         justify-content: space-between;
         padding: 8px 12px;
         background: var(--primary-light, #f8f9fa);
         border: 1px solid var(--border-color, #d9d9d9);
         border-radius: 6px;
         transition: all 0.3s ease;
       }

       .font-item:hover {
         background: var(--primary-light, #f0f7ff);
         border-color: var(--primary-color, #1890ff);
       }

       .font-name {
         font-weight: 500;
         color: var(--text-color, #333);
         flex: 1;
       }

       .font-type {
         background: var(--primary-color, #1890ff);
         color: white;
         padding: 2px 6px;
         border-radius: 4px;
         font-size: 10px;
         font-weight: bold;
         margin: 0 8px;
       }

       .remove-font-btn {
         background: #ff4d4f;
         color: white;
         border: none;
         border-radius: 50%;
         width: 20px;
         height: 20px;
         cursor: pointer;
         font-size: 12px;
         display: flex;
         align-items: center;
         justify-content: center;
         transition: all 0.3s ease;
       }

       .remove-font-btn:hover {
         background: #ff7875;
         transform: scale(1.1);
       }

       .app-container.dark-mode .upload-btn {
         background: #333;
         border-color: #555;
         color: #ecf0f1;
       }

       .app-container.dark-mode .upload-btn:hover {
         border-color: #1890ff;
         background: #3d3d3d;
       }

       .app-container.dark-mode .font-item {
         background: #333;
         border-color: #555;
       }

       .app-container.dark-mode .font-item:hover {
         background: #3d3d3d;
         border-color: #1890ff;
       }

       .app-container.dark-mode .font-name {
         color: #ecf0f1;
       }
       </style>
