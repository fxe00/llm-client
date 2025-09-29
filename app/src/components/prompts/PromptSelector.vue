<template>
  <div class="prompt-selector">
    <!-- 搜索和筛选 -->
    <div class="selector-header">
      <a-input
        v-model:value="searchKeyword"
        placeholder="搜索提示词..."
        :prefix="h(SearchOutlined)"
        class="search-input"
        @input="handleSearch"
      />
      
      <a-select
        v-model:value="selectedCategory"
        placeholder="选择分类"
        style="width: 120px"
        @change="handleCategoryChange"
      >
        <a-select-option value="all">全部分类</a-select-option>
        <a-select-option
          v-for="category in promptsStore.categories"
          :key="category"
          :value="category"
        >
          {{ category }}
        </a-select-option>
      </a-select>
    </div>
    
    <!-- 提示词列表 -->
    <div class="prompt-list">
      <div
        v-for="prompt in promptsStore.filteredPrompts"
        :key="prompt.id"
        class="prompt-item"
        @click="handleSelectPrompt(prompt)"
      >
        <div class="prompt-header">
          <h4 class="prompt-name">{{ prompt.name }}</h4>
          <a-tag :color="getCategoryColor(prompt.category)">
            {{ prompt.category }}
          </a-tag>
        </div>
        
        <p class="prompt-description">{{ prompt.description }}</p>
        
        <div class="prompt-tags">
          <a-tag
            v-for="tag in prompt.tags"
            :key="tag"
            size="small"
            color="blue"
          >
            {{ tag }}
          </a-tag>
        </div>
        
        <div class="prompt-actions">
          <a-button type="text" size="small" @click.stop="handlePreviewPrompt(prompt)">
            <template #icon>
              <EyeOutlined />
            </template>
            预览
          </a-button>
          <a-button type="text" size="small" @click.stop="handleUsePrompt(prompt)">
            <template #icon>
              <CheckOutlined />
            </template>
            使用
          </a-button>
        </div>
      </div>
    </div>
    
    <!-- 预览模态框 -->
    <a-modal
      v-model:open="showPreview"
      :title="previewPrompt?.name"
      width="600px"
      :footer="null"
    >
      <div v-if="previewPrompt" class="prompt-preview">
        <p class="preview-description">{{ previewPrompt.description }}</p>
        
        <div class="preview-content">
          <h4>提示词内容：</h4>
          <pre class="preview-text">{{ previewPrompt.content }}</pre>
        </div>
        
        <div v-if="previewPrompt.variables.length > 0" class="preview-variables">
          <h4>变量设置：</h4>
          <div class="variables-list">
            <div
              v-for="variable in previewPrompt.variables"
              :key="variable.name"
              class="variable-item"
            >
              <span class="variable-name">{{ variable.label }}</span>
              <a-tag :color="variable.required ? 'red' : 'default'">
                {{ variable.required ? '必填' : '可选' }}
              </a-tag>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { usePromptsStore } from '@/stores/prompts'
import {
  SearchOutlined,
  EyeOutlined,
  CheckOutlined
} from '@ant-design/icons-vue'

const promptsStore = usePromptsStore()

const searchKeyword = ref('')
const selectedCategory = ref('all')
const showPreview = ref(false)
const previewPrompt = ref(null)

// 初始化示例数据
promptsStore.initSampleData()

// 处理搜索
const handleSearch = () => {
  promptsStore.setSearchKeyword(searchKeyword.value)
}

// 处理分类变化
const handleCategoryChange = () => {
  promptsStore.setSelectedCategory(selectedCategory.value)
}

// 处理选择提示词
const handleSelectPrompt = (prompt: any) => {
  emit('select', prompt)
}

// 处理使用提示词
const handleUsePrompt = (prompt: any) => {
  emit('select', prompt)
}

// 处理预览提示词
const handlePreviewPrompt = (prompt: any) => {
  previewPrompt.value = prompt
  showPreview.value = true
}

// 获取分类颜色
const getCategoryColor = (category: string) => {
  const colors = {
    '编程': 'blue',
    '产品': 'green',
    '写作': 'purple',
    '分析': 'orange',
    '其他': 'default'
  }
  return colors[category as keyof typeof colors] || 'default'
}

// 定义事件
const emit = defineEmits<{
  select: [prompt: any]
}>()
</script>

<style scoped>
.prompt-selector {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.selector-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
}

.prompt-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.prompt-item {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.prompt-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
  transform: translateY(-2px);
}

.prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.prompt-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.prompt-description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.prompt-tags {
  margin-bottom: 12px;
}

.prompt-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.prompt-item:hover .prompt-actions {
  opacity: 1;
}

.prompt-preview {
  max-height: 400px;
  overflow-y: auto;
}

.preview-description {
  color: #666;
  margin-bottom: 16px;
  font-size: 14px;
}

.preview-content h4,
.preview-variables h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.preview-text {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid #e8e8e8;
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.variable-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.variable-name {
  font-weight: 500;
  color: #333;
}

/* 滚动条样式 */
.prompt-list::-webkit-scrollbar {
  width: 6px;
}

.prompt-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.prompt-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.prompt-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
