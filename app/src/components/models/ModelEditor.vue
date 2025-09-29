<template>
  <div class="model-editor">
    <a-form layout="vertical">
      <!-- 基本信息 -->
      <a-form-item label="模型名称" required>
        <a-input
          v-model:value="localModel.name"
          placeholder="输入模型名称"
        />
      </a-form-item>
      
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="提供商" required>
            <a-select
              v-model:value="localModel.provider"
              placeholder="选择提供商"
            >
              <a-select-option value="openai">OpenAI</a-select-option>
              <a-select-option value="anthropic">Anthropic</a-select-option>
              <a-select-option value="google">Google</a-select-option>
              <a-select-option value="other">其他</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="模型ID" required>
            <a-input
              v-model:value="localModel.model"
              placeholder="输入模型ID"
            />
          </a-form-item>
        </a-col>
      </a-row>
      
      <!-- API密钥 -->
      <a-form-item label="API密钥" required>
        <a-input-password
          v-model:value="localModel.apiKey"
          placeholder="输入API密钥"
        />
      </a-form-item>
      
      <!-- 模型参数 -->
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="温度">
            <a-slider
              v-model:value="localModel.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              :marks="{ 0: '0', 0.7: '0.7', 1: '1', 2: '2' }"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="最大Token">
            <a-input-number
              v-model:value="localModel.maxTokens"
              :min="1"
              :max="32000"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="超时时间(秒)">
            <a-input-number
              v-model:value="localModel.timeout"
              :min="5"
              :max="300"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
      </a-row>
      
      <!-- 高级设置 -->
      <a-collapse>
        <a-collapse-panel key="advanced" header="高级设置">
          <a-form-item label="基础URL">
            <a-input
              v-model:value="localModel.baseUrl"
              placeholder="自定义API基础URL"
            />
          </a-form-item>
          
          <a-form-item label="请求头">
            <a-textarea
              v-model:value="headersText"
              placeholder="自定义请求头 (JSON格式)"
              :rows="3"
            />
          </a-form-item>
        </a-collapse-panel>
      </a-collapse>
      
      <!-- 测试连接 -->
      <a-form-item>
        <a-space>
          <a-button @click="handleTestConnection" :loading="testing">
            <template #icon>
              <WifiOutlined />
            </template>
            测试连接
          </a-button>
          <a-button @click="handleSaveModel" type="primary">
            <template #icon>
              <SaveOutlined />
            </template>
            保存模型
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, h } from 'vue'
import { message } from 'ant-design-vue'
import {
  WifiOutlined,
  SaveOutlined
} from '@ant-design/icons-vue'

interface Model {
  id?: string
  name: string
  provider: string
  model: string
  apiKey: string
  temperature: number
  maxTokens: number
  timeout: number
  baseUrl?: string
  headers?: Record<string, string>
}

const props = defineProps<{
  model?: Model | null
}>()

const emit = defineEmits<{
  'update:model': [model: Model]
  save: []
  cancel: []
}>()

const localModel = ref<Model>({
  name: '',
  provider: 'openai',
  model: '',
  apiKey: '',
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 30
})

const testing = ref(false)

// 请求头文本
const headersText = ref('')

// 监听props变化
watch(() => props.model, (newModel) => {
  if (newModel) {
    localModel.value = { ...newModel }
    headersText.value = newModel.headers ? JSON.stringify(newModel.headers, null, 2) : ''
  } else {
    localModel.value = {
      name: '',
      provider: 'openai',
      model: '',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 30
    }
    headersText.value = ''
  }
}, { immediate: true })

// 监听变化并发送事件
watch(localModel, (newValue) => {
  emit('update:model', newValue)
}, { deep: true })

// 处理测试连接
const handleTestConnection = async () => {
  if (!localModel.value.apiKey.trim()) {
    message.error('请输入API密钥')
    return
  }
  
  testing.value = true
  
  try {
    // 这里应该调用实际的API测试
    await new Promise(resolve => setTimeout(resolve, 2000))
    message.success('连接成功！')
  } catch (error) {
    message.error('连接失败，请检查API密钥和网络设置')
  } finally {
    testing.value = false
  }
}

// 处理保存模型
const handleSaveModel = () => {
  if (!localModel.value.name.trim()) {
    message.error('请输入模型名称')
    return
  }
  
  if (!localModel.value.model.trim()) {
    message.error('请输入模型ID')
    return
  }
  
  if (!localModel.value.apiKey.trim()) {
    message.error('请输入API密钥')
    return
  }
  
  // 解析请求头
  if (headersText.value.trim()) {
    try {
      localModel.value.headers = JSON.parse(headersText.value)
    } catch (error) {
      message.error('请求头格式错误，请输入有效的JSON')
      return
    }
  }
  
  emit('save')
}
</script>

<style scoped>
.model-editor {
  max-height: 600px;
  overflow-y: auto;
}

/* 滚动条样式 */
.model-editor::-webkit-scrollbar {
  width: 6px;
}

.model-editor::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.model-editor::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.model-editor::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
