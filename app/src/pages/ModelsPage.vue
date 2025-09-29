<template>
  <div class="models-page">
    <div class="page-header">
      <h2>模型设置</h2>
      <a-button type="primary" @click="showAddModal = true">
        <template #icon>
          <PlusOutlined />
        </template>
        添加模型
      </a-button>
    </div>
    
    <!-- 模型列表 -->
    <div class="models-list">
      <a-card
        v-for="model in models"
        :key="model.id"
        class="model-card"
        :class="{ 'model-active': model.id === currentModel?.id }"
      >
        <div class="model-header">
          <div class="model-info">
            <h4 class="model-name">{{ model.name }}</h4>
            <span class="model-provider">{{ model.provider }}</span>
          </div>
          <div class="model-status">
            <a-tag :color="model.connected ? 'green' : 'red'">
              {{ model.connected ? '已连接' : '未连接' }}
            </a-tag>
          </div>
        </div>
        
        <div class="model-details">
          <div class="detail-item">
            <span class="detail-label">模型:</span>
            <span class="detail-value">{{ model.model }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">温度:</span>
            <span class="detail-value">{{ model.temperature }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">最大Token:</span>
            <span class="detail-value">{{ model.maxTokens }}</span>
          </div>
        </div>
        
        <div class="model-stats">
          <div class="stat-item">
            <span class="stat-label">本月调用:</span>
            <span class="stat-value">{{ model.monthlyCalls }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">费用:</span>
            <span class="stat-value">${{ model.cost.toFixed(2) }}</span>
          </div>
        </div>
        
        <div class="model-actions">
          <a-space>
            <a-button
              type="primary"
              size="small"
              @click="handleSelectModel(model)"
              :disabled="!model.connected"
            >
              选择
            </a-button>
            <a-button size="small" @click="handleEditModel(model)">
              编辑
            </a-button>
            <a-button size="small" @click="handleTestModel(model)">
              测试
            </a-button>
            <a-button size="small" danger @click="handleDeleteModel(model.id)">
              删除
            </a-button>
          </a-space>
        </div>
      </a-card>
    </div>
    
    <!-- 添加/编辑模型模态框 -->
    <a-modal
      v-model:open="showAddModal"
      :title="editingModel ? '编辑模型' : '添加模型'"
      width="600px"
      @ok="handleSaveModel"
      @cancel="handleCancelEdit"
    >
      <ModelEditor
        v-model:model="editingModel"
        @save="handleSaveModel"
        @cancel="handleCancelEdit"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import {
  PlusOutlined
} from '@ant-design/icons-vue'
import ModelEditor from '@/components/models/ModelEditor.vue'

// 模拟数据
const models = ref([
  {
    id: '1',
    name: 'GPT-4',
    provider: 'OpenAI',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4096,
    connected: true,
    monthlyCalls: 1234,
    cost: 12.34
  },
  {
    id: '2',
    name: 'Claude-3',
    provider: 'Anthropic',
    model: 'claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 4096,
    connected: false,
    monthlyCalls: 0,
    cost: 0
  },
  {
    id: '3',
    name: 'Gemini Pro',
    provider: 'Google',
    model: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 4096,
    connected: false,
    monthlyCalls: 0,
    cost: 0
  }
])

const currentModel = ref(models.value[0])
const showAddModal = ref(false)
const editingModel = ref(null)

// 处理选择模型
const handleSelectModel = (model: any) => {
  currentModel.value = model
}

// 处理编辑模型
const handleEditModel = (model: any) => {
  editingModel.value = { ...model }
  showAddModal.value = true
}

// 处理测试模型
const handleTestModel = (model: any) => {
  // 测试模型连接
  console.log('测试模型:', model.name)
}

// 处理删除模型
const handleDeleteModel = (modelId: string) => {
  const index = models.value.findIndex(m => m.id === modelId)
  if (index > -1) {
    models.value.splice(index, 1)
  }
}

// 处理保存模型
const handleSaveModel = () => {
  if (editingModel.value) {
    if (editingModel.value.id) {
      // 更新现有模型
      const index = models.value.findIndex(m => m.id === editingModel.value.id)
      if (index > -1) {
        models.value[index] = editingModel.value
      }
    } else {
      // 添加新模型
      editingModel.value.id = Date.now().toString()
      models.value.push(editingModel.value)
    }
  }
  handleCancelEdit()
}

// 处理取消编辑
const handleCancelEdit = () => {
  editingModel.value = null
  showAddModal.value = false
}
</script>

<style scoped>
.models-page {
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

.models-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.model-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.model-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.model-active {
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.model-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.model-info {
  flex: 1;
}

.model-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.model-provider {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.model-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-size: 12px;
  color: #333;
  font-weight: 600;
}

.model-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.model-actions {
  display: flex;
  justify-content: flex-end;
}

/* 滚动条样式 */
.models-list::-webkit-scrollbar {
  width: 6px;
}

.models-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.models-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.models-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
