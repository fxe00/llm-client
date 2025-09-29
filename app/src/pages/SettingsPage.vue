<template>
  <div class="settings-page">
    <div class="page-header">
      <h2>设置</h2>
    </div>
    
    <div class="settings-content">
      <!-- 外观设置 -->
      <a-card title="外观设置" class="settings-card">
        <div class="setting-item">
          <div class="setting-label">
            <h4>主题</h4>
            <p>选择应用的主题模式</p>
          </div>
          <a-radio-group v-model:value="settings.theme" @change="handleThemeChange">
            <a-radio value="light">浅色</a-radio>
            <a-radio value="dark">深色</a-radio>
            <a-radio value="auto">跟随系统</a-radio>
          </a-radio-group>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <h4>字体大小</h4>
            <p>调整界面字体大小</p>
          </div>
          <a-slider
            v-model:value="settings.fontSize"
            :min="12"
            :max="20"
            :marks="{ 12: '小', 16: '中', 20: '大' }"
            @change="handleFontSizeChange"
          />
        </div>
      </a-card>
      
      <!-- 快捷键设置 -->
      <a-card title="快捷键设置" class="settings-card">
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="shortcut-label">发送消息</span>
            <a-tag class="shortcut-key">Ctrl+Enter</a-tag>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-label">新建会话</span>
            <a-tag class="shortcut-key">Ctrl+N</a-tag>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-label">保存会话</span>
            <a-tag class="shortcut-key">Ctrl+S</a-tag>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-label">插入提示词</span>
            <a-tag class="shortcut-key">Ctrl+P</a-tag>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-label">切换模型</span>
            <a-tag class="shortcut-key">Ctrl+M</a-tag>
          </div>
        </div>
      </a-card>
      
      <!-- 数据管理 -->
      <a-card title="数据管理" class="settings-card">
        <div class="setting-item">
          <div class="setting-label">
            <h4>数据存储位置</h4>
            <p>应用数据的存储路径</p>
          </div>
          <a-input
            :value="dataPath"
            readonly
            style="width: 300px"
          >
            <template #suffix>
              <a-button type="text" @click="handleOpenDataPath">
                <template #icon>
                  <FolderOpenOutlined />
                </template>
              </a-button>
            </template>
          </a-input>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <h4>缓存管理</h4>
            <p>清理应用缓存数据</p>
          </div>
          <a-space>
            <a-button @click="handleClearCache">清理缓存</a-button>
            <a-button @click="handleExportData">导出数据</a-button>
            <a-button @click="handleImportData">导入数据</a-button>
          </a-space>
        </div>
      </a-card>
      
      <!-- 关于信息 -->
      <a-card title="关于" class="settings-card">
        <div class="about-content">
          <div class="app-info">
            <h3>LLM Client</h3>
            <p>版本: 1.0.0</p>
            <p>一个全平台通用的LLM客户端应用</p>
          </div>
          
          <div class="app-actions">
            <a-space>
              <a-button @click="handleCheckUpdate">检查更新</a-button>
              <a-button @click="handleOpenGithub">GitHub</a-button>
              <a-button @click="handleOpenHelp">帮助文档</a-button>
            </a-space>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import {
  FolderOpenOutlined
} from '@ant-design/icons-vue'

const appStore = useAppStore()

const settings = ref({
  theme: 'auto',
  fontSize: 16
})

const dataPath = ref('/Users/username/.llmclient/data')

// 处理主题变化
const handleThemeChange = () => {
  // 这里应该更新应用主题
  console.log('主题已更改为:', settings.value.theme)
}

// 处理字体大小变化
const handleFontSizeChange = () => {
  // 这里应该更新字体大小
  console.log('字体大小已更改为:', settings.value.fontSize)
}

// 处理打开数据路径
const handleOpenDataPath = () => {
  // 这里应该打开数据文件夹
  console.log('打开数据路径')
}

// 处理清理缓存
const handleClearCache = () => {
  // 这里应该清理缓存
  console.log('清理缓存')
}

// 处理导出数据
const handleExportData = () => {
  // 这里应该导出数据
  console.log('导出数据')
}

// 处理导入数据
const handleImportData = () => {
  // 这里应该导入数据
  console.log('导入数据')
}

// 处理检查更新
const handleCheckUpdate = () => {
  // 这里应该检查更新
  console.log('检查更新')
}

// 处理打开GitHub
const handleOpenGithub = () => {
  // 这里应该打开GitHub页面
  console.log('打开GitHub')
}

// 处理打开帮助
const handleOpenHelp = () => {
  // 这里应该打开帮助文档
  console.log('打开帮助')
}
</script>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.settings-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.setting-label p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.shortcut-label {
  font-size: 14px;
  color: #333;
}

.shortcut-key {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  background: #f0f0f0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 2px 6px;
}

.about-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.app-info p {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #666;
}

/* 滚动条样式 */
.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
