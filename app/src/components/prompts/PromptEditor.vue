<template>
  <div class="prompt-editor">
    <a-form layout="vertical">
      <!-- 基本信息 -->
      <a-form-item label="名称" required>
        <a-input
          v-model:value="localPrompt.name"
          placeholder="输入提示词名称"
        />
      </a-form-item>
      
      <a-form-item label="描述">
        <a-textarea
          v-model:value="localPrompt.description"
          placeholder="输入提示词描述"
          :rows="2"
        />
      </a-form-item>
      
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="分类" required>
            <a-select
              v-model:value="localPrompt.category"
              placeholder="选择分类"
            >
              <a-select-option value="编程">编程</a-select-option>
              <a-select-option value="产品">产品</a-select-option>
              <a-select-option value="写作">写作</a-select-option>
              <a-select-option value="分析">分析</a-select-option>
              <a-select-option value="其他">其他</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="标签">
            <a-select
              v-model:value="localPrompt.tags"
              mode="tags"
              placeholder="输入标签"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
      </a-row>
      
      <!-- 提示词内容 -->
      <a-form-item label="提示词内容" required>
        <a-textarea
          v-model:value="localPrompt.content"
          placeholder="输入提示词内容，可以使用 {变量名} 来定义变量"
          :rows="8"
          class="prompt-content"
        />
      </a-form-item>
      
      <!-- 变量设置 -->
      <a-form-item label="变量设置">
        <div class="variables-section">
          <div
            v-for="(variable, index) in localPrompt.variables"
            :key="index"
            class="variable-item"
          >
            <a-row :gutter="8">
              <a-col :span="6">
                <a-input
                  v-model:value="variable.name"
                  placeholder="变量名"
                />
              </a-col>
              <a-col :span="6">
                <a-input
                  v-model:value="variable.label"
                  placeholder="显示标签"
                />
              </a-col>
              <a-col :span="4">
                <a-select
                  v-model:value="variable.type"
                  placeholder="类型"
                >
                  <a-select-option value="text">文本</a-select-option>
                  <a-select-option value="number">数字</a-select-option>
                  <a-select-option value="select">选择</a-select-option>
                </a-select>
              </a-col>
              <a-col :span="4">
                <a-checkbox v-model:checked="variable.required">
                  必填
                </a-checkbox>
              </a-col>
              <a-col :span="4">
                <a-button
                  type="text"
                  danger
                  @click="removeVariable(index)"
                >
                  删除
                </a-button>
              </a-col>
            </a-row>
          </div>
          
          <a-button
            type="dashed"
            block
            @click="addVariable"
            class="add-variable-btn"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            添加变量
          </a-button>
        </div>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, h } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'

interface PromptVariable {
  name: string
  label: string
  type: 'text' | 'number' | 'select'
  required: boolean
  defaultValue?: string
  options?: string[]
}

interface Prompt {
  id?: string
  name: string
  description: string
  content: string
  category: string
  tags: string[]
  variables: PromptVariable[]
}

const props = defineProps<{
  prompt?: Prompt | null
}>()

const emit = defineEmits<{
  'update:prompt': [prompt: Prompt]
  save: []
  cancel: []
}>()

const localPrompt = ref<Prompt>({
  name: '',
  description: '',
  content: '',
  category: '其他',
  tags: [],
  variables: []
})

// 监听props变化
watch(() => props.prompt, (newPrompt) => {
  if (newPrompt) {
    localPrompt.value = { ...newPrompt }
  } else {
    localPrompt.value = {
      name: '',
      description: '',
      content: '',
      category: '其他',
      tags: [],
      variables: []
    }
  }
}, { immediate: true })

// 添加变量
const addVariable = () => {
  localPrompt.value.variables.push({
    name: '',
    label: '',
    type: 'text',
    required: false
  })
}

// 删除变量
const removeVariable = (index: number) => {
  localPrompt.value.variables.splice(index, 1)
}

// 监听变化并发送事件
watch(localPrompt, (newValue) => {
  emit('update:prompt', newValue)
}, { deep: true })
</script>

<style scoped>
.prompt-editor {
  max-height: 500px;
  overflow-y: auto;
}

.prompt-content {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.variables-section {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
}

.variable-item {
  margin-bottom: 12px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.variable-item:last-child {
  margin-bottom: 0;
}

.add-variable-btn {
  margin-top: 8px;
  border-style: dashed;
  border-color: #d9d9d9;
  color: #666;
}

.add-variable-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 滚动条样式 */
.prompt-editor::-webkit-scrollbar {
  width: 6px;
}

.prompt-editor::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.prompt-editor::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.prompt-editor::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
