<template>
  <div class="prompts-page">
    <div class="page-header">
      <h2>提示词管理</h2>
      <a-button type="primary" @click="showCreateModal = true">
        <template #icon>
          <PlusOutlined />
        </template>
        新建提示词
      </a-button>
    </div>
    
    <!-- 搜索和筛选 -->
    <div class="filters">
      <a-input
        v-model:value="searchKeyword"
        placeholder="搜索提示词..."
        :prefix="h(SearchOutlined)"
        style="width: 300px"
        @input="handleSearch"
      />
      
      <a-select
        v-model:value="selectedCategory"
        placeholder="选择分类"
        style="width: 150px"
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
    <div class="prompts-grid">
      <a-card
        v-for="prompt in promptsStore.filteredPrompts"
        :key="prompt.id"
        class="prompt-card"
        hoverable
      >
        <template #title>
          <div class="card-title">
            <span>{{ prompt.name }}</span>
            <a-tag :color="getCategoryColor(prompt.category)">
              {{ prompt.category }}
            </a-tag>
          </div>
        </template>
        
        <template #extra>
          <a-dropdown>
            <a-button type="text" :icon="h(MoreOutlined)" />
            <template #overlay>
              <a-menu>
                <a-menu-item @click="handleEditPrompt(prompt)">
                  <EditOutlined />
                  编辑
                </a-menu-item>
                <a-menu-item @click="handleUsePrompt(prompt)">
                  <CheckOutlined />
                  使用
                </a-menu-item>
                <a-menu-item @click="handleDeletePrompt(prompt.id)" danger>
                  <DeleteOutlined />
                  删除
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
        
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
        
        <div class="card-footer">
          <span class="create-time">
            {{ formatDate(prompt.createdAt) }}
          </span>
          <a-button type="text" size="small" @click="handleUsePrompt(prompt)">
            使用
          </a-button>
        </div>
      </a-card>
    </div>
    
    <!-- 创建/编辑模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      :title="editingPrompt ? '编辑提示词' : '新建提示词'"
      width="800px"
      @ok="handleSavePrompt"
      @cancel="handleCancelEdit"
    >
      <PromptEditor
        v-model:prompt="editingPrompt"
        @save="handleSavePrompt"
        @cancel="handleCancelEdit"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { usePromptsStore } from '@/stores/prompts'
import { useAppStore } from '@/stores/app'
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  CheckOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import PromptEditor from '@/components/prompts/PromptEditor.vue'

const promptsStore = usePromptsStore()
const appStore = useAppStore()

const searchKeyword = ref('')
const selectedCategory = ref('all')
const showCreateModal = ref(false)
const editingPrompt = ref(null)

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

// 处理编辑提示词
const handleEditPrompt = (prompt: any) => {
  editingPrompt.value = { ...prompt }
  showCreateModal.value = true
}

// 处理使用提示词
const handleUsePrompt = (prompt: any) => {
  // 切换到聊天页面并使用提示词
  appStore.setCurrentPage('chat')
  // 这里可以设置当前消息为提示词内容
}

// 处理删除提示词
const handleDeletePrompt = (id: string) => {
  promptsStore.deletePrompt(id)
}

// 处理保存提示词
const handleSavePrompt = () => {
  if (editingPrompt.value) {
    if (editingPrompt.value.id) {
      promptsStore.updatePrompt(editingPrompt.value.id, editingPrompt.value)
    } else {
      promptsStore.createPrompt(editingPrompt.value)
    }
  }
  handleCancelEdit()
}

// 处理取消编辑
const handleCancelEdit = () => {
  editingPrompt.value = null
  showCreateModal.value = false
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

// 格式化日期
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.prompts-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.prompt-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.prompt-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.prompt-description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.prompt-tags {
  margin-bottom: 16px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.create-time {
  font-size: 12px;
  color: #999;
}

/* 滚动条样式 */
.prompts-grid::-webkit-scrollbar {
  width: 6px;
}

.prompts-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.prompts-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.prompts-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
