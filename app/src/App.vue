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
          <div v-if="selectedKey === 'chat'" class="page-content chat-page">
            <div class="chat-container">
              <!-- 聊天头部 -->
              <div class="chat-header">
                <h2>💬 智能对话</h2>
                <div class="chat-controls">
                  <select v-model="selectedModel" class="model-select">
                    <option value="">选择模型</option>
                    <option v-for="model in modelsStore.enabledModels" :key="model.id" :value="model.id">
                      {{ model.name }}
                    </option>
                  </select>
                  <button @click="showPromptSelector = true" class="prompt-btn">
                    📝 选择提示词
                  </button>
                  <button @click="testConnection" class="test-btn">
                    🔧 测试连接
                  </button>
                  <button @click="diagnoseNetwork" class="diagnose-btn">
                    🔍 网络诊断
                  </button>
                </div>
              </div>

              <!-- 提示词选择对话框 -->
              <div v-if="showPromptSelector" class="prompt-selector-overlay" @click="showPromptSelector = false">
                <div class="prompt-selector" @click.stop>
                  <div class="selector-header">
                    <h3>选择提示词</h3>
                    <button @click="showPromptSelector = false" class="close-btn">×</button>
                  </div>
                  <div class="selector-content">
                    <div class="prompt-list">
                      <div 
                        v-for="prompt in promptsStore.filteredPrompts" 
                        :key="prompt.id"
                        class="prompt-item"
                        @click="selectPrompt(prompt)"
                      >
                        <div class="prompt-title">{{ prompt.title }}</div>
                        <div class="prompt-preview">{{ prompt.content.substring(0, 100) }}...</div>
                        <div class="prompt-meta">
                          <span class="prompt-category">{{ getCategoryName(prompt.category) }}</span>
                          <span v-if="prompt.variables.length > 0" class="has-variables">有变量</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 变量填充对话框 -->
              <div v-if="showVariableFiller" class="variable-filler-overlay" @click="showVariableFiller = false">
                <div class="variable-filler" @click.stop>
                  <div class="filler-header">
                    <h3>填写变量</h3>
                    <button @click="showVariableFiller = false" class="close-btn">×</button>
                  </div>
                  <div class="filler-content">
                    <div class="selected-prompt">
                      <h4>{{ selectedPromptTemplate.title }}</h4>
                      <p class="prompt-preview">{{ selectedPromptTemplate.content }}</p>
                    </div>
                    <div class="variables-form">
                      <div 
                        v-for="variable in selectedPromptTemplate.variables" 
                        :key="variable"
                        class="variable-field"
                      >
                        <label>{{ variable }}:</label>
                        <input 
                          v-model="variableValues[variable]"
                          type="text" 
                          :placeholder="`请输入${variable}`"
                          class="variable-input"
                        >
                      </div>
                    </div>
                    <div class="filler-actions">
                      <button @click="showVariableFiller = false" class="cancel-btn">取消</button>
                      <button @click="applyVariables" class="apply-btn">应用</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 聊天消息区域 -->
              <div class="chat-messages">
                <div v-if="messages.length === 0" class="empty-chat">
                  <div class="empty-icon">💬</div>
                  <h3>开始新的对话</h3>
                  <p>选择一个AI模型和提示词，开始智能对话</p>
                </div>
                <div v-else class="messages-list">
                  <div 
                    v-for="message in messages" 
                    :key="message.id"
                    :class="['message', message.role, { 
                      'loading': message.isLoading, 
                      'error': message.isError 
                    }]"
                  >
                    <div class="message-content">
                      <span v-if="message.isLoading" class="loading-indicator">
                        <span class="loading-dots">●</span>
                        <span class="loading-dots">●</span>
                        <span class="loading-dots">●</span>
                      </span>
                      <span v-else>{{ message.content }}</span>
                    </div>
                    <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                </div>
              </div>

              <!-- 输入区域 -->
              <div class="chat-input">
                <div class="input-container">
                  <textarea 
                    v-model="currentMessage"
                    placeholder="输入您的消息..."
                    class="message-input"
                    rows="3"
                    @keydown.enter.prevent="sendMessage"
                  ></textarea>
                  <button @click="sendMessage" class="send-btn" :disabled="!currentMessage.trim()">
                    发送
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 提示词管理页面 -->
          <div v-if="selectedKey === 'prompts'" class="page-content">
            <h2>📝 提示词管理</h2>
            <p>管理和组织您的提示词模板，提高AI对话效率...</p>
            
            <div class="prompts-container">
              <!-- 提示词统计 -->
              <div class="prompts-stats">
                <div class="stat-card">
                  <div class="stat-icon">📝</div>
                  <div class="stat-content">
                    <div class="stat-value">{{ promptsStore.getPromptStats().totalPrompts }}</div>
                    <div class="stat-label">总提示词</div>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">⭐</div>
                  <div class="stat-content">
                    <div class="stat-value">{{ promptsStore.getPromptStats().favoritePrompts }}</div>
                    <div class="stat-label">收藏提示词</div>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">🌐</div>
                  <div class="stat-content">
                    <div class="stat-value">{{ promptsStore.getPromptStats().publicPrompts }}</div>
                    <div class="stat-label">公开提示词</div>
                  </div>
                </div>
              </div>

              <!-- 搜索和筛选 -->
              <div class="prompts-filters">
                <div class="search-section">
                  <input 
                    v-model="promptsStore.filter.search"
                    type="text" 
                    placeholder="搜索提示词标题、内容或标签..."
                    class="search-input"
                  >
                  <button @click="promptsStore.clearFilter()" class="clear-filter-btn">
                    🗑️ 清除筛选
                  </button>
                </div>
                
                <div class="filter-section">
                  <div class="filter-group">
                    <label>分类:</label>
                    <select v-model="promptsStore.filter.category" class="filter-select">
                      <option value="">所有分类</option>
                      <option v-for="category in promptsStore.categories" :key="category.id" :value="category.id">
                        {{ category.icon }} {{ category.name }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="filter-group">
                    <label>标签:</label>
                    <select v-model="selectedPromptTag" @change="addPromptTagFilter" class="filter-select">
                      <option value="">选择标签</option>
                      <option v-for="tag in promptsStore.allTags" :key="tag" :value="tag">
                        {{ tag }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="filter-group">
                    <label>语言:</label>
                    <select v-model="promptsStore.filter.language" class="filter-select">
                      <option value="">所有语言</option>
                      <option value="zh-CN">中文</option>
                      <option value="en-US">English</option>
                    </select>
                  </div>
                  
                  
                  <div class="filter-group">
                    <label>状态:</label>
                    <select v-model="promptsStore.filter.isPublic" class="filter-select">
                      <option :value="null">全部</option>
                      <option :value="true">公开</option>
                      <option :value="false">私有</option>
                    </select>
                  </div>
                  
                  <div class="filter-group">
                    <label>收藏:</label>
                    <select v-model="promptsStore.filter.isFavorite" class="filter-select">
                      <option :value="null">全部</option>
                      <option :value="true">已收藏</option>
                      <option :value="false">未收藏</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="prompts-actions">
                <button @click="createNewPrompt" class="create-prompt-btn">
                  ➕ 新建提示词
                </button>
                <button @click="exportPrompts" class="export-btn">
                  📤 导出提示词
                </button>
                <button @click="importPrompts" class="import-btn">
                  📥 导入提示词
                </button>
                <button @click="clearAllPrompts" class="clear-btn">
                  🗑️ 清空所有
                </button>
              </div>

              <!-- 提示词列表 -->
              <div class="prompts-list">
                <div v-if="promptsStore.isLoading" class="loading-state">
                  <div class="loading-spinner"></div>
                  <p>加载提示词中...</p>
                </div>
                
                <div v-else-if="promptsStore.filteredPrompts.length === 0" class="empty-state">
                  <div class="empty-icon">📝</div>
                  <h3>暂无提示词</h3>
                  <p>创建您的第一个提示词模板</p>
                  <button @click="createNewPrompt" class="create-first-btn">
                    创建第一个提示词
                  </button>
                </div>
                
                <div v-else class="prompts-grid">
                  <div 
                    v-for="prompt in promptsStore.filteredPrompts" 
                    :key="prompt.id"
                    class="prompt-card"
                    :class="{ 
                      'favorite': prompt.isFavorite,
                      'public': prompt.isPublic
                    }"
                    @click="selectPrompt(prompt.id)"
                  >
                    <div class="prompt-header">
                      <div class="prompt-title">
                        <h4>{{ prompt.title }}</h4>
                        <div class="prompt-meta">
                          <span class="prompt-category">{{ getCategoryName(prompt.category) }}</span>
                          <span class="prompt-language">{{ prompt.language === 'zh-CN' ? '中文' : 'English' }}</span>
                        </div>
                      </div>
                      <div class="prompt-actions">
                        <button 
                          @click.stop="togglePromptFavorite(prompt.id)"
                          class="favorite-btn"
                          :class="{ active: prompt.isFavorite }"
                          :title="prompt.isFavorite ? '取消收藏' : '添加收藏'"
                        >
                          {{ prompt.isFavorite ? '⭐' : '☆' }}
                        </button>
                        <button 
                          @click.stop="duplicatePrompt(prompt.id)"
                          class="duplicate-btn"
                          title="复制提示词"
                        >
                          📋
                        </button>
                        <button 
                          @click.stop="editPrompt(prompt)"
                          class="edit-btn"
                          title="编辑提示词"
                        >
                          ✏️
                        </button>
                        <button 
                          @click.stop="deletePrompt(prompt.id)"
                          class="delete-btn"
                          title="删除提示词"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div class="prompt-content">
                      <p class="prompt-description">{{ prompt.description || '暂无描述' }}</p>
                      <div class="prompt-preview">
                        {{ prompt.content.slice(0, 100) }}{{ prompt.content.length > 100 ? '...' : '' }}
                      </div>
                    </div>
                    
                    <div class="prompt-tags" v-if="prompt.tags.length > 0">
                      <span 
                        v-for="tag in prompt.tags" 
                        :key="tag"
                        class="prompt-tag"
                      >
                        {{ tag }}
                      </span>
                    </div>
                    
                    <div class="prompt-footer">
                      <div class="prompt-info">
                        <span class="prompt-tokens">~{{ prompt.estimatedTokens }} tokens</span>
                        <span class="prompt-date">{{ formatDate(prompt.updatedAt) }}</span>
                      </div>
                      <div class="prompt-status">
                        <span v-if="prompt.isPublic" class="public-badge">公开</span>
                        <span v-if="prompt.isFavorite" class="favorite-badge">⭐</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 会话管理页面 -->
          <div v-if="selectedKey === 'sessions'" class="page-content">
            <h2>📚 会话管理</h2>
            <p>查看和管理您的对话历史，组织您的AI对话...</p>
            
            <div class="sessions-container">
              <!-- 会话统计 -->
              <div class="sessions-stats">
                <div class="stat-card">
                  <div class="stat-icon">💬</div>
                  <div class="stat-content">
                    <div class="stat-value">{{ sessionsStore.getSessionStats().totalSessions }}</div>
                    <div class="stat-label">总会话数</div>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">⭐</div>
                  <div class="stat-content">
                    <div class="stat-value">{{ sessionsStore.getSessionStats().starredSessions }}</div>
                    <div class="stat-label">星标会话</div>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">📝</div>
                  <div class="stat-content">
                    <div class="stat-value">{{ sessionsStore.getSessionStats().totalMessages }}</div>
                    <div class="stat-label">总消息数</div>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">🎯</div>
                  <div class="stat-content">
                    <div class="stat-value">{{ sessionsStore.getSessionStats().averageMessagesPerSession }}</div>
                    <div class="stat-label">平均消息/会话</div>
                  </div>
                </div>
              </div>

              <!-- 搜索和筛选 -->
              <div class="sessions-filters">
                <div class="search-section">
                  <input 
                    v-model="sessionsStore.filter.search"
                    type="text" 
                    placeholder="搜索会话标题、内容或描述..."
                    class="search-input"
                  >
                  <button @click="sessionsStore.clearFilter()" class="clear-filter-btn">
                    🗑️ 清除筛选
                  </button>
                </div>
                
                <div class="filter-section">
                  <div class="filter-group">
                    <label>标签:</label>
                    <select v-model="selectedTag" @change="addTagFilter" class="filter-select">
                      <option value="">选择标签</option>
                      <option v-for="tag in sessionsStore.allTags" :key="tag" :value="tag">
                        {{ tag }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="filter-group">
                    <label>模型:</label>
                    <select v-model="sessionsStore.filter.model" class="filter-select">
                      <option value="">所有模型</option>
                      <option v-for="model in sessionsStore.allModels" :key="model" :value="model">
                        {{ model }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="filter-group">
                    <label>状态:</label>
                    <select v-model="sessionsStore.filter.archived" class="filter-select">
                      <option :value="null">全部</option>
                      <option :value="false">活跃</option>
                      <option :value="true">已归档</option>
                    </select>
                  </div>
                  
                  <div class="filter-group">
                    <label>星标:</label>
                    <select v-model="sessionsStore.filter.starred" class="filter-select">
                      <option :value="null">全部</option>
                      <option :value="true">已星标</option>
                      <option :value="false">未星标</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="sessions-actions">
                <button @click="createNewSession" class="create-session-btn">
                  ➕ 新建会话
                </button>
                <button @click="exportSessions" class="export-btn">
                  📤 导出会话
                </button>
                <button @click="importSessions" class="import-btn">
                  📥 导入会话
                </button>
                <button @click="clearAllSessions" class="clear-btn">
                  🗑️ 清空所有
                </button>
              </div>

              <!-- 会话列表 -->
              <div class="sessions-list">
                <div v-if="sessionsStore.isLoading" class="loading-state">
                  <div class="loading-spinner"></div>
                  <p>加载会话中...</p>
                </div>
                
                <div v-else-if="sessionsStore.filteredSessions.length === 0" class="empty-state">
                  <div class="empty-icon">📭</div>
                  <h3>暂无会话</h3>
                  <p>创建您的第一个AI对话会话</p>
                  <button @click="createNewSession" class="create-first-btn">
                    创建第一个会话
                  </button>
                </div>
                
                <div v-else class="sessions-grid">
                  <div 
                    v-for="session in sessionsStore.filteredSessions" 
                    :key="session.id"
                    class="session-card"
                    :class="{ 
                      'active': sessionsStore.currentSessionId === session.id,
                      'starred': session.isStarred,
                      'archived': session.isArchived
                    }"
                    @click="selectSession(session.id)"
                  >
                    <div class="session-header">
                      <div class="session-title">
                        <h4>{{ session.title }}</h4>
                        <div class="session-meta">
                          <span class="session-model">{{ session.model }}</span>
                          <span class="session-date">{{ formatDate(session.updatedAt) }}</span>
                        </div>
                      </div>
                      <div class="session-actions">
                        <button 
                          @click.stop="toggleStar(session.id)"
                          class="star-btn"
                          :class="{ active: session.isStarred }"
                          :title="session.isStarred ? '取消星标' : '添加星标'"
                        >
                          {{ session.isStarred ? '⭐' : '☆' }}
                        </button>
                        <button 
                          @click.stop="toggleArchive(session.id)"
                          class="archive-btn"
                          :title="session.isArchived ? '取消归档' : '归档'"
                        >
                          {{ session.isArchived ? '📦' : '📁' }}
                        </button>
                        <button 
                          @click.stop="editSession(session)"
                          class="edit-btn"
                          title="编辑会话"
                        >
                          ✏️
                        </button>
                        <button 
                          @click.stop="deleteSession(session.id)"
                          class="delete-btn"
                          title="删除会话"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div class="session-content">
                      <p class="session-description">{{ session.description || '暂无描述' }}</p>
                      <div class="session-stats">
                        <span class="message-count">{{ session.messageCount }} 条消息</span>
                        <span class="token-count">{{ session.totalTokens }} tokens</span>
                      </div>
                    </div>
                    
                    <div class="session-tags" v-if="session.tags.length > 0">
                      <span 
                        v-for="tag in session.tags" 
                        :key="tag"
                        class="session-tag"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 提示词创建/编辑对话框 -->
          <div v-if="showPromptDialog" class="prompt-dialog-overlay" @click="closePromptDialog">
            <div class="prompt-dialog" @click.stop>
              <div class="dialog-header">
                <h3>{{ currentPrompt.id ? '编辑提示词' : '创建新提示词' }}</h3>
                <button @click="closePromptDialog" class="close-btn">✕</button>
              </div>
              
              <div class="dialog-content">
                <div class="form-row">
                  <div class="form-group">
                    <label>提示词标题 *</label>
                    <input 
                      v-model="currentPrompt.title"
                      type="text" 
                      placeholder="输入提示词标题..."
                      class="form-input"
                      maxlength="100"
                    >
                  </div>
                  
                  <div class="form-group">
                    <label>分类 *</label>
                    <select v-model="currentPrompt.category" class="form-select">
                      <option value="">选择分类</option>
                      <option 
                        v-for="category in promptsStore.categories" 
                        :key="category.id" 
                        :value="category.id"
                      >
                        {{ category.icon }} {{ category.name }}
                      </option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>提示词描述</label>
                  <textarea 
                    v-model="currentPrompt.description"
                    placeholder="输入提示词描述（可选）..."
                    class="form-textarea"
                    rows="2"
                    maxlength="200"
                  ></textarea>
                </div>
                
                <div class="form-group">
                  <label>提示词内容 *</label>
                  <textarea 
                    v-model="currentPrompt.content"
                    placeholder="输入提示词内容，可以使用 {{变量名}} 来定义变量..."
                    class="form-textarea prompt-content"
                    rows="8"
                    @input="updateEstimatedTokens"
                  ></textarea>
                  <div class="content-info">
                    <span class="char-count">{{ currentPrompt.content.length }} 字符</span>
                    <span class="token-count">~{{ currentPrompt.estimatedTokens }} tokens</span>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>语言</label>
                  <select v-model="currentPrompt.language" class="form-select">
                    <option value="zh-CN">中文</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>标签</label>
                  <div class="tags-input">
                    <div class="tags-list">
                      <span 
                        v-for="(tag, index) in currentPrompt.tags" 
                        :key="index"
                        class="tag-item"
                      >
                        {{ tag }}
                        <button @click="removePromptTag(index)" class="remove-tag-btn">×</button>
                      </span>
                    </div>
                    <div class="tag-input-row">
                      <input 
                        v-model="newPromptTag"
                        type="text" 
                        placeholder="输入标签..."
                        class="tag-input"
                        @keyup.enter="addPromptTag"
                        @keyup.escape="newPromptTag = ''"
                      >
                      <button @click="addPromptTag" class="add-tag-btn" :disabled="!newPromptTag.trim()">
                        ➕
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>变量管理</label>
                  <div class="variables-section">
                    <div class="variables-info">
                      <p class="info-text">
                        💡 在内容中使用 <code>&#123;&#123;变量名&#125;&#125;</code> 来定义变量，系统会自动识别并管理
                      </p>
                    </div>
                    
                    <div class="variables-preview" v-if="currentPrompt.variables.length > 0">
                      <h4>已识别的变量：</h4>
                      <div class="variables-list">
                        <div 
                          v-for="(variable, index) in currentPrompt.variables" 
                          :key="index"
                          class="variable-item"
                        >
                          <span class="variable-name">{{ variable }}</span>
                          <button 
                            @click="removeVariable(index)"
                            class="remove-variable-btn"
                            title="删除变量"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div class="variables-help" v-else>
                      <p class="help-text">
                        📝 在内容中输入 <code>&#123;&#123;变量名&#125;&#125;</code> 格式，系统会自动识别变量
                      </p>
                    </div>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>作者</label>
                    <input 
                      v-model="currentPrompt.author"
                      type="text" 
                      placeholder="输入作者名称（可选）..."
                      class="form-input"
                      maxlength="50"
                    >
                  </div>
                  
                  <div class="form-group">
                    <label>设置</label>
                    <div class="settings-row">
                      <div class="setting-item">
                        <label class="setting-label">公开分享</label>
                        <div class="setting-control">
                          <button 
                            @click="currentPrompt.isPublic = !currentPrompt.isPublic"
                            :class="['toggle-switch', { active: currentPrompt.isPublic }]"
                          >
                            <span class="toggle-icon">{{ currentPrompt.isPublic ? '🌐' : '🔒' }}</span>
                            <span class="toggle-text">{{ currentPrompt.isPublic ? '公开' : '私有' }}</span>
                          </button>
                        </div>
                      </div>
                      
                      <div class="setting-item">
                        <label class="setting-label">添加到收藏</label>
                        <div class="setting-control">
                          <button 
                            @click="currentPrompt.isFavorite = !currentPrompt.isFavorite"
                            :class="['toggle-switch', { active: currentPrompt.isFavorite }]"
                          >
                            <span class="toggle-icon">{{ currentPrompt.isFavorite ? '⭐' : '☆' }}</span>
                            <span class="toggle-text">{{ currentPrompt.isFavorite ? '已收藏' : '未收藏' }}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="dialog-actions">
                <button @click="closePromptDialog" class="cancel-btn">
                  取消
                </button>
                <button @click="savePrompt" class="save-btn" :disabled="!currentPrompt.title || !currentPrompt.content || !currentPrompt.category">
                  {{ currentPrompt.id ? '保存修改' : '创建提示词' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 会话创建/编辑对话框 -->
          <div v-if="showSessionDialog" class="session-dialog-overlay" @click="closeSessionDialog">
            <div class="session-dialog" @click.stop>
              <div class="dialog-header">
                <h3>{{ currentSession.id ? '编辑会话' : '创建新会话' }}</h3>
                <button @click="closeSessionDialog" class="close-btn">✕</button>
              </div>
              
              <div class="dialog-content">
                <div class="form-group">
                  <label>会话标题 *</label>
                  <input 
                    v-model="currentSession.title"
                    type="text" 
                    placeholder="输入会话标题..."
                    class="form-input"
                    maxlength="100"
                  >
                </div>
                
                <div class="form-group">
                  <label>会话描述</label>
                  <textarea 
                    v-model="currentSession.description"
                    placeholder="输入会话描述（可选）..."
                    class="form-textarea"
                    rows="3"
                    maxlength="500"
                  ></textarea>
                </div>
                
                <div class="form-group">
                  <label>AI模型 *</label>
                  <select v-model="currentSession.model" class="form-select">
                    <option value="">选择AI模型</option>
                    <option 
                      v-for="model in modelsStore.enabledModels" 
                      :key="model.id" 
                      :value="model.modelId"
                    >
                      {{ model.name }} ({{ model.modelId }})
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>标签</label>
                  <div class="tags-input">
                    <div class="tags-list">
                      <span 
                        v-for="(tag, index) in currentSession.tags" 
                        :key="index"
                        class="tag-item"
                      >
                        {{ tag }}
                        <button @click="removeTag(index)" class="remove-tag-btn">×</button>
                      </span>
                    </div>
                    <div class="tag-input-row">
                      <input 
                        v-model="newTag"
                        type="text" 
                        placeholder="输入标签..."
                        class="tag-input"
                        @keyup.enter="addTag"
                        @keyup.escape="newTag = ''"
                      >
                      <button @click="addTag" class="add-tag-btn" :disabled="!newTag.trim()">
                        ➕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="dialog-actions">
                <button @click="closeSessionDialog" class="cancel-btn">
                  取消
                </button>
                <button @click="saveSession" class="save-btn" :disabled="!currentSession.title || !currentSession.model">
                  {{ currentSession.id ? '保存修改' : '创建会话' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 模型配置页面 -->
          <div v-if="selectedKey === 'models'" class="page-content">
            <h2>⚙️ 模型配置</h2>
            <p>配置和管理您的AI模型，设置API端点和参数...</p>
            
            <div class="models-container">
              <!-- 模型列表 -->
              <div class="models-section">
                <div class="section-header">
                  <h3>🤖 可用模型</h3>
                  <div class="header-actions">
                    <div class="storage-info">
                      <span class="storage-label">存储位置:</span>
                      <span class="storage-value">{{ storageInfo.location }}</span>
                      <span class="storage-count">({{ storageInfo.modelsCount }}个模型)</span>
                      <button @click="openStorageDir" class="open-dir-btn" title="打开存储目录">
                        📁
                      </button>
                    </div>
                    <div class="action-buttons">
                      <button @click="exportModels" class="export-btn" title="导出模型配置">
                        📤 导出
                      </button>
                      <button @click="importModels" class="import-btn" title="导入模型配置">
                        📥 导入
                      </button>
                      <button @click="showAddModelDialog = true" class="add-model-btn">
                        ➕ 添加模型
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="models-list">
                  <div 
                    v-for="model in modelsStore.models" 
                    :key="model.id"
                    class="model-card"
                    :class="{ 
                      'default': model.isDefault, 
                      'disabled': !model.isEnabled,
                      'testing': modelsStore.isTestingConnection
                    }"
                  >
                    <div class="model-header">
                      <div class="model-info">
                        <h4>{{ model.name }}</h4>
                        <p class="model-description">{{ model.description }}</p>
                        <div class="model-tags">
                          <span class="provider-tag">{{ getProviderName(model.provider) }}</span>
                          <span v-if="model.isDefault" class="default-tag">默认</span>
                          <span v-if="!model.isEnabled" class="disabled-tag">已禁用</span>
                        </div>
                      </div>
                      <div class="model-actions">
                        <button 
                          @click="modelsStore.toggleModelEnabled(model.id)"
                          class="toggle-btn"
                          :class="{ active: model.isEnabled }"
                        >
                          {{ model.isEnabled ? '✓' : '✕' }}
                        </button>
                        <button 
                          @click="modelsStore.setDefaultModel(model.id)"
                          class="default-btn"
                          :disabled="model.isDefault"
                        >
                          {{ model.isDefault ? '默认' : '设为默认' }}
                        </button>
                        <button 
                          @click="testModel(model.id)"
                          class="test-btn"
                          :disabled="modelsStore.isTestingConnection"
                        >
                          {{ modelsStore.isTestingConnection ? '测试中...' : '测试连接' }}
                        </button>
                        <button 
                          @click="editModel(model)"
                          class="edit-btn"
                        >
                          编辑
                        </button>
                        <button 
                          @click="deleteModel(model.id)"
                          class="delete-btn"
                          :disabled="model.isDefault"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    
                    <div class="model-details">
                      <div class="detail-item">
                        <label>API端点:</label>
                        <span>{{ model.apiEndpoint }}</span>
                      </div>
                      <div class="detail-item">
                        <label>模型ID:</label>
                        <span>{{ model.modelId }}</span>
                      </div>
                      <div class="detail-item">
                        <label>最大令牌:</label>
                        <span>{{ model.maxTokens }}</span>
                      </div>
                      <div class="detail-item">
                        <label>温度:</label>
                        <span>{{ model.temperature }}</span>
                      </div>
                    </div>
                    
                    <!-- 测试结果 -->
                    <div v-if="modelsStore.testResults[model.id]" class="test-result">
                      <div 
                        class="result-message"
                        :class="{ 
                          success: modelsStore.testResults[model.id].success,
                          error: !modelsStore.testResults[model.id].success
                        }"
                      >
                        {{ modelsStore.testResults[model.id].message }}
                        <span v-if="modelsStore.testResults[model.id].latency" class="latency">
                          ({{ modelsStore.testResults[model.id].latency }}ms)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 添加/编辑模型对话框 -->
              <div v-if="showAddModelDialog || showEditModelDialog" class="model-dialog-overlay" @click="closeModelDialog">
                <div class="model-dialog" @click.stop>
                  <div class="dialog-header">
                    <h3>{{ showEditModelDialog ? '编辑模型' : '添加模型' }}</h3>
                    <button @click="closeModelDialog" class="close-btn">✕</button>
                  </div>
                  
                  <div class="dialog-content">
                    <div class="form-group">
                      <label>模型名称 *</label>
                      <input 
                        v-model="currentModel.name" 
                        type="text" 
                        placeholder="例如: GPT-4"
                        class="form-input"
                      >
                    </div>
                    
                    <div class="form-group">
                      <label>提供商 *</label>
                      <select v-model="currentModel.provider" class="form-select">
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="custom">自定义</option>
                      </select>
                    </div>
                    
                    <div class="form-group">
                      <label>API端点 *</label>
                      <input 
                        v-model="currentModel.apiEndpoint" 
                        type="url" 
                        placeholder="https://api.openai.com/v1"
                        class="form-input"
                      >
                    </div>
                    
                    <div class="form-group">
                      <label>API密钥 *</label>
                      <input 
                        v-model="currentModel.apiKey" 
                        type="password" 
                        placeholder="输入您的API密钥"
                        class="form-input"
                      >
                    </div>
                    
                    <div class="form-group">
                      <label>模型ID *</label>
                      <input 
                        v-model="currentModel.modelId" 
                        type="text" 
                        placeholder="例如: gpt-4"
                        class="form-input"
                      >
                    </div>
                    
                    <div class="form-row">
                      <div class="form-group">
                        <label>最大令牌</label>
                        <input 
                          v-model.number="currentModel.maxTokens" 
                          type="number" 
                          min="100" 
                          max="32000"
                          class="form-input"
                        >
                      </div>
                      
                      <div class="form-group">
                        <label>温度</label>
                        <input 
                          v-model.number="currentModel.temperature" 
                          type="number" 
                          min="0" 
                          max="2" 
                          step="0.1"
                          class="form-input"
                        >
                      </div>
                    </div>
                    
                    <div class="form-group">
                      <label>系统提示</label>
                      <textarea 
                        v-model="currentModel.systemPrompt" 
                        placeholder="可选的系统提示词..."
                        class="form-textarea"
                        rows="3"
                      ></textarea>
                    </div>
                    
                    <div class="form-group">
                      <label>描述</label>
                      <input 
                        v-model="currentModel.description" 
                        type="text" 
                        placeholder="模型的简要描述..."
                        class="form-input"
                      >
                    </div>
                  </div>
                  
                  <div class="dialog-actions">
                    <button @click="closeModelDialog" class="cancel-btn">取消</button>
                    <button @click="saveModel" class="save-btn">保存</button>
                  </div>
                </div>
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
import { useModelsStore } from './stores/models'
import { useSessionsStore } from './stores/sessions'
import { usePromptsStore } from './stores/prompts'

// 使用设置store
const settingsStore = useSettingsStore()
const modelsStore = useModelsStore()
const sessionsStore = useSessionsStore()
const promptsStore = usePromptsStore()

// 初始化时应用自定义字体
onMounted(async () => {
  applyCustomFonts()
  await updateStorageInfo()
})

// 更新存储信息
const updateStorageInfo = async () => {
  try {
    storageInfo.value = await modelsStore.getStorageInfo()
  } catch (error) {
    console.error('获取存储信息失败:', error)
  }
}

// 响应式数据
const collapsed = ref(false)
const selectedKey = ref('chat')

// 模型管理相关数据
const showAddModelDialog = ref(false)
const showEditModelDialog = ref(false)
const storageInfo = ref({
  location: '加载中...',
  modelsCount: 0,
  filePath: ''
})
const currentModel = ref({
  name: '',
  provider: 'openai',
  apiEndpoint: '',
  apiKey: '',
  modelId: '',
  maxTokens: 4096,
  temperature: 0.8,
  systemPrompt: '',
  description: '',
  isDefault: false,
  isEnabled: true
})

// 会话管理相关数据
const selectedTag = ref('')
const showSessionDialog = ref(false)
const newTag = ref('')
const currentSession = ref({
  id: '',
  title: '',
  description: '',
  model: '',
  tags: []
})

// 聊天功能相关数据
const selectedModel = ref('')
const showPromptSelector = ref(false)
const showVariableFiller = ref(false)
const selectedPromptTemplate = ref({})
const variableValues = ref({})
const currentMessage = ref('')
const messages = ref([])

// 提示词管理相关数据
const selectedPromptTag = ref('')
const showPromptDialog = ref(false)
const newPromptTag = ref('')
const newVariable = ref('')
const currentPrompt = ref({
  id: '',
  title: '',
  content: '',
  category: 'general',
  tags: [],
  description: '',
  variables: [],
  isPublic: false,
  isFavorite: false,
  language: 'zh-CN',
  estimatedTokens: 0,
  author: ''
})

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

// 模型管理方法
const getProviderName = (providerId) => {
  const provider = modelsStore.getProvider(providerId)
  return provider ? provider.name : providerId
}

const testModel = async (modelId) => {
  await modelsStore.testModelConnection(modelId)
}

const editModel = (model) => {
  currentModel.value = { ...model }
  showEditModelDialog.value = true
}

const deleteModel = (modelId) => {
  if (confirm('确定要删除这个模型吗？')) {
    modelsStore.deleteModel(modelId)
  }
}

const closeModelDialog = () => {
  showAddModelDialog.value = false
  showEditModelDialog.value = false
  currentModel.value = {
    name: '',
    provider: 'openai',
    apiEndpoint: '',
    apiKey: '',
    modelId: '',
    maxTokens: 4096,
    temperature: 0.8,
    systemPrompt: '',
    description: '',
    isDefault: false,
    isEnabled: true
  }
}

const saveModel = async () => {
  if (!currentModel.value.name || !currentModel.value.apiEndpoint || !currentModel.value.apiKey || !currentModel.value.modelId) {
    alert('请填写所有必填字段')
    return
  }
  
  if (showEditModelDialog.value) {
    // 编辑模式
    const model = modelsStore.models.find(m => m.name === currentModel.value.name && m.id !== currentModel.value.id)
    if (model) {
      alert('模型名称已存在')
      return
    }
    await modelsStore.updateModel(currentModel.value.id, currentModel.value)
  } else {
    // 添加模式
    const model = modelsStore.models.find(m => m.name === currentModel.value.name)
    if (model) {
      alert('模型名称已存在')
      return
    }
    await modelsStore.addModel(currentModel.value)
  }
  
  await updateStorageInfo()
  closeModelDialog()
}

// 文件操作相关方法
const openStorageDir = async () => {
  await modelsStore.openStorageDirectory()
}

const exportModels = async () => {
  await modelsStore.exportModels()
}

const importModels = async () => {
  await modelsStore.importModels()
  await updateStorageInfo()
}

// 会话管理方法
const createNewSession = () => {
  currentSession.value = {
    id: '',
    title: '',
    description: '',
    model: modelsStore.defaultModel?.modelId || 'gpt-3.5-turbo',
    tags: []
  }
  newTag.value = ''
  showSessionDialog.value = true
}

const selectSession = (sessionId) => {
  sessionsStore.setCurrentSession(sessionId)
}

const editSession = (session) => {
  currentSession.value = {
    id: session.id,
    title: session.title,
    description: session.description || '',
    model: session.model,
    tags: [...session.tags]
  }
  newTag.value = ''
  showSessionDialog.value = true
}

const closeSessionDialog = () => {
  showSessionDialog.value = false
  currentSession.value = {
    id: '',
    title: '',
    description: '',
    model: '',
    tags: []
  }
  newTag.value = ''
}

const saveSession = async () => {
  if (!currentSession.value.title || !currentSession.value.model) {
    alert('请填写会话标题和选择AI模型')
    return
  }
  
  try {
    if (currentSession.value.id) {
      // 编辑模式
      await sessionsStore.updateSession(currentSession.value.id, {
        title: currentSession.value.title,
        description: currentSession.value.description,
        model: currentSession.value.model,
        tags: currentSession.value.tags
      })
    } else {
      // 创建模式
      const newSession = await sessionsStore.createSession(
        currentSession.value.title,
        currentSession.value.model,
        currentSession.value.description
      )
      
      // 添加标签
      for (const tag of currentSession.value.tags) {
        sessionsStore.addTag(newSession.id, tag)
      }
    }
    
    closeSessionDialog()
  } catch (error) {
    console.error('保存会话失败:', error)
    alert('保存会话失败: ' + error.message)
  }
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !currentSession.value.tags.includes(tag)) {
    currentSession.value.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index) => {
  currentSession.value.tags.splice(index, 1)
}

const toggleStar = (sessionId) => {
  sessionsStore.toggleStar(sessionId)
}

const toggleArchive = (sessionId) => {
  sessionsStore.toggleArchive(sessionId)
}

const deleteSession = (sessionId) => {
  if (confirm('确定要删除这个会话吗？')) {
    sessionsStore.deleteSession(sessionId)
  }
}

const addTagFilter = () => {
  if (selectedTag.value && !sessionsStore.filter.tags.includes(selectedTag.value)) {
    sessionsStore.filter.tags.push(selectedTag.value)
    selectedTag.value = ''
  }
}

const exportSessions = async () => {
  await sessionsStore.exportSessions()
}

const importSessions = async () => {
  await sessionsStore.importSessions()
}

const clearAllSessions = () => {
  sessionsStore.clearAllSessions()
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return Math.floor(diff / 60000) + '分钟前'
  } else if (diff < 86400000) { // 1天内
    return Math.floor(diff / 3600000) + '小时前'
  } else if (diff < 604800000) { // 1周内
    return Math.floor(diff / 86400000) + '天前'
  } else {
    return date.toLocaleDateString()
  }
}

// 提示词管理方法
const createNewPrompt = () => {
  currentPrompt.value = {
    id: '',
    title: '',
    content: '',
    category: 'general',
    tags: [],
    description: '',
    variables: [],
    isPublic: false,
    isFavorite: false,
    language: 'zh-CN',
    estimatedTokens: 0,
    author: ''
  }
  newPromptTag.value = ''
  showPromptDialog.value = true
}

const selectPromptForChat = (promptId) => {
  // 这里可以跳转到聊天页面并使用该提示词
  console.log('选择提示词:', promptId)
}

const editPrompt = (prompt) => {
  currentPrompt.value = {
    id: prompt.id,
    title: prompt.title,
    content: prompt.content,
    category: prompt.category,
    tags: [...prompt.tags],
    description: prompt.description || '',
    variables: [...prompt.variables],
    isPublic: prompt.isPublic,
    isFavorite: prompt.isFavorite,
    language: prompt.language,
    estimatedTokens: prompt.estimatedTokens,
    author: prompt.author || ''
  }
  newPromptTag.value = ''
  showPromptDialog.value = true
}

const togglePromptFavorite = (promptId) => {
  promptsStore.toggleFavorite(promptId)
}

const duplicatePrompt = (promptId) => {
  promptsStore.duplicatePrompt(promptId)
}

const deletePrompt = (promptId) => {
  if (confirm('确定要删除这个提示词吗？')) {
    promptsStore.deletePrompt(promptId)
  }
}

const addPromptTagFilter = () => {
  if (selectedPromptTag.value && !promptsStore.filter.tags.includes(selectedPromptTag.value)) {
    promptsStore.filter.tags.push(selectedPromptTag.value)
    selectedPromptTag.value = ''
  }
}

const exportPrompts = async () => {
  await promptsStore.exportPrompts()
}

const importPrompts = async () => {
  await promptsStore.importPrompts()
}

const clearAllPrompts = () => {
  promptsStore.clearAllPrompts()
}

const getCategoryName = (categoryId) => {
  const category = promptsStore.getCategoryById(categoryId)
  return category ? `${category.icon} ${category.name}` : '未知分类'
}

const getDifficultyName = (difficulty) => {
  const difficultyMap = {
    'beginner': '初级',
    'intermediate': '中级',
    'advanced': '高级'
  }
  return difficultyMap[difficulty] || '未知'
}

// 提示词对话框方法
const closePromptDialog = () => {
  showPromptDialog.value = false
  currentPrompt.value = {
    id: '',
    title: '',
    content: '',
    category: 'general',
    tags: [],
    description: '',
    variables: [],
    isPublic: false,
    isFavorite: false,
    language: 'zh-CN',
    estimatedTokens: 0,
    author: ''
  }
  newPromptTag.value = ''
  newVariable.value = ''
}

const savePrompt = async () => {
  if (!currentPrompt.value.title || !currentPrompt.value.content || !currentPrompt.value.category) {
    alert('请填写提示词标题、内容和选择分类')
    return
  }
  
  try {
    if (currentPrompt.value.id) {
      // 编辑模式
      await promptsStore.updatePrompt(currentPrompt.value.id, {
        title: currentPrompt.value.title,
        content: currentPrompt.value.content,
        category: currentPrompt.value.category,
        tags: currentPrompt.value.tags,
        description: currentPrompt.value.description,
        variables: currentPrompt.value.variables,
        isPublic: currentPrompt.value.isPublic,
        isFavorite: currentPrompt.value.isFavorite,
        language: currentPrompt.value.language,
        estimatedTokens: currentPrompt.value.estimatedTokens,
        author: currentPrompt.value.author
      })
    } else {
      // 创建模式
      await promptsStore.createPrompt({
        title: currentPrompt.value.title,
        content: currentPrompt.value.content,
        category: currentPrompt.value.category,
        tags: currentPrompt.value.tags,
        description: currentPrompt.value.description,
        variables: currentPrompt.value.variables,
        isPublic: currentPrompt.value.isPublic,
        isFavorite: currentPrompt.value.isFavorite,
        language: currentPrompt.value.language,
        estimatedTokens: currentPrompt.value.estimatedTokens,
        author: currentPrompt.value.author
      })
    }
    
    closePromptDialog()
  } catch (error) {
    console.error('保存提示词失败:', error)
    alert('保存提示词失败: ' + error.message)
  }
}

const addPromptTag = () => {
  const tag = newPromptTag.value.trim()
  if (tag && !currentPrompt.value.tags.includes(tag)) {
    currentPrompt.value.tags.push(tag)
    newPromptTag.value = ''
  }
}

const removePromptTag = (index) => {
  currentPrompt.value.tags.splice(index, 1)
}

const addVariable = () => {
  const variable = newVariable.value.trim()
  if (variable && !currentPrompt.value.variables.includes(variable)) {
    currentPrompt.value.variables.push(variable)
    newVariable.value = ''
  }
}

const removeVariable = (index) => {
  currentPrompt.value.variables.splice(index, 1)
}

const updateEstimatedTokens = () => {
  // 简单的token估算：中文字符按1.5倍计算，英文按1倍计算
  const content = currentPrompt.value.content
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishChars = content.length - chineseChars
  currentPrompt.value.estimatedTokens = Math.ceil(chineseChars * 1.5 + englishChars * 0.8)
  
  // 自动识别内容中的变量
  extractVariablesFromContent()
}

const extractVariablesFromContent = () => {
  const content = currentPrompt.value.content
  const variableRegex = /\{\{([^}]+)\}\}/g
  const variables = []
  let match
  
  while ((match = variableRegex.exec(content)) !== null) {
    const variableName = match[1].trim()
    if (variableName && !variables.includes(variableName)) {
      variables.push(variableName)
    }
  }
  
  currentPrompt.value.variables = variables
}

// 聊天功能方法
const selectPrompt = (prompt) => {
  selectedPromptTemplate.value = prompt
  showPromptSelector.value = false
  
  // 如果提示词有变量，显示变量填充对话框
  if (prompt.variables && prompt.variables.length > 0) {
    variableValues.value = {}
    showVariableFiller.value = true
  } else {
    // 没有变量，直接应用提示词
    applyPrompt(prompt.content)
  }
}

const applyVariables = () => {
  let content = selectedPromptTemplate.value.content
  
  // 替换变量
  for (const [variable, value] of Object.entries(variableValues.value)) {
    const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g')
    content = content.replace(regex, value)
  }
  
  showVariableFiller.value = false
  applyPrompt(content)
}

const applyPrompt = (content) => {
  currentMessage.value = content
}

const sendMessage = async () => {
  if (!currentMessage.value.trim()) return
  
  // 检查是否选择了模型
  if (!selectedModel.value) {
    alert('请先选择一个AI模型')
    return
  }
  
  // 添加用户消息
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: currentMessage.value,
    timestamp: Date.now()
  }
  messages.value.push(userMessage)
  
  // 清空输入框
  const message = currentMessage.value
  currentMessage.value = ''
  
  // 添加加载状态
  const loadingMessage = {
    id: Date.now() + 1,
    role: 'assistant',
    content: '正在思考中...',
    timestamp: Date.now(),
    isLoading: true
  }
  messages.value.push(loadingMessage)
  
  try {
    // 调用AI模型API
    const response = await callAIModel(message)
    
    // 移除加载状态，添加AI回复
    messages.value.pop() // 移除加载消息
    const aiMessage = {
      id: Date.now() + 2,
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
      isLoading: false
    }
    messages.value.push(aiMessage)
  } catch (error) {
    // 移除加载状态，添加错误消息
    messages.value.pop() // 移除加载消息
    const errorMessage = {
      id: Date.now() + 2,
      role: 'assistant',
      content: `抱歉，发生了错误：${error.message}`,
      timestamp: Date.now(),
      isError: true
    }
    messages.value.push(errorMessage)
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// 测试连接方法
const testConnection = async () => {
  if (!selectedModel.value) {
    alert('请先选择一个AI模型')
    return
  }

  const selectedModelConfig = modelsStore.models.find(m => m.id === selectedModel.value)
  if (!selectedModelConfig) {
    alert('未找到选中的模型配置')
    return
  }

  if (!selectedModelConfig.apiKey) {
    alert('请先在模型配置中设置API密钥')
    return
  }

  try {
    console.log('🔧 开始测试连接...')
    
    // 构建测试请求
    const testRequestBody = {
      model: selectedModelConfig.modelId,
      messages: [
        { role: 'user', content: 'Hello, this is a test message.' }
      ],
      max_tokens: 10,
      temperature: 0.1
    }

    // 在开发环境中使用代理
    let apiUrl = selectedModelConfig.apiEndpoint + '/chat/completions'
    if (import.meta.env.DEV) {
      if (selectedModelConfig.apiEndpoint.includes('openai.com')) {
        apiUrl = '/api/openai/v1/chat/completions'
      } else if (selectedModelConfig.apiEndpoint.includes('anthropic.com')) {
        apiUrl = '/api/anthropic/v1/messages'
      } else if (selectedModelConfig.apiEndpoint.includes('llm-internal.threatbook-inc.cn')) {
        apiUrl = '/api/internal/api/chat/completions'
      }
    }

    console.log('🔧 测试请求URL:', apiUrl)
    console.log('🔧 测试请求体:', testRequestBody)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${selectedModelConfig.apiKey}`
      },
      body: JSON.stringify(testRequestBody)
    })

    console.log('🔧 测试响应状态:', response.status, response.statusText)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ 连接测试成功:', data)
      alert(`连接测试成功！\n模型: ${selectedModelConfig.name}\n端点: ${apiUrl}`)
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ 连接测试失败:', errorData)
      alert(`连接测试失败！\n状态: ${response.status}\n错误: ${errorData.error?.message || response.statusText}`)
    }
  } catch (error) {
    console.error('❌ 连接测试异常:', error)
    alert(`连接测试异常！\n错误: ${error.message}`)
  }
}

// 网络诊断方法
const diagnoseNetwork = async () => {
  console.log('🔍 开始网络诊断...')
  
  const diagnostics = {
    environment: import.meta.env.DEV ? 'development' : 'production',
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    protocol: window.location.protocol,
    host: window.location.host,
    timestamp: new Date().toISOString()
  }
  
  console.log('🔍 环境信息:', diagnostics)
  
  // 测试基本网络连接
  try {
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      mode: 'cors'
    })
    diagnostics.basicConnectivity = response.ok ? 'success' : 'failed'
    console.log('✅ 基本网络连接正常')
  } catch (error) {
    diagnostics.basicConnectivity = 'failed'
    console.error('❌ 基本网络连接失败:', error)
  }
  
  // 测试内部API端点
  if (selectedModel.value) {
    const selectedModelConfig = modelsStore.models.find(m => m.id === selectedModel.value)
    if (selectedModelConfig && selectedModelConfig.apiEndpoint.includes('llm-internal.threatbook-inc.cn')) {
      try {
        const testUrl = import.meta.env.DEV 
          ? '/api/internal/api/chat/completions'
          : selectedModelConfig.apiEndpoint + '/chat/completions'
        
        console.log('🔍 测试内部API端点:', testUrl)
        
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${selectedModelConfig.apiKey}`
          },
          body: JSON.stringify({
            model: selectedModelConfig.modelId,
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1,
            temperature: 0.1
          })
        })
        
        diagnostics.internalApi = {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        }
        
        if (response.ok) {
          const data = await response.json()
          diagnostics.internalApi.response = data
          console.log('✅ 内部API连接成功:', data)
        } else {
          const errorText = await response.text()
          diagnostics.internalApi.error = errorText
          console.error('❌ 内部API连接失败:', response.status, errorText)
        }
      } catch (error) {
        diagnostics.internalApi = {
          error: error.message,
          type: error.name
        }
        console.error('❌ 内部API连接异常:', error)
      }
    }
  }
  
  console.log('🔍 完整诊断结果:', diagnostics)
  alert(`网络诊断完成！\n\n环境: ${diagnostics.environment}\n在线状态: ${diagnostics.online ? '在线' : '离线'}\n基本连接: ${diagnostics.basicConnectivity}\n\n详细信息请查看控制台`)
}

// AI模型API调用函数
const callAIModel = async (message) => {
  const selectedModelConfig = modelsStore.models.find(m => m.id === selectedModel.value)
  if (!selectedModelConfig) {
    throw new Error('未找到选中的模型配置')
  }

  // 检查API密钥
  if (!selectedModelConfig.apiKey) {
    throw new Error('请先在模型配置中设置API密钥')
  }

  // 构建API请求
  const requestBody = {
    model: selectedModelConfig.modelId,
    messages: [
      ...messages.value.filter(m => !m.isLoading && !m.isError).map(m => ({
        role: m.role,
        content: m.content
      }))
    ],
    max_tokens: selectedModelConfig.maxTokens,
    temperature: selectedModelConfig.temperature
  }

  // 如果有系统提示词，添加到消息开头
  if (selectedModelConfig.systemPrompt) {
    requestBody.messages.unshift({
      role: 'system',
      content: selectedModelConfig.systemPrompt
    })
  }

  // 在开发环境中使用代理
  let apiUrl = selectedModelConfig.apiEndpoint + '/chat/completions'
  if (import.meta.env.DEV) {
    if (selectedModelConfig.apiEndpoint.includes('openai.com')) {
      apiUrl = '/api/openai/v1/chat/completions'
    } else if (selectedModelConfig.apiEndpoint.includes('anthropic.com')) {
      apiUrl = '/api/anthropic/v1/messages'
    } else if (selectedModelConfig.apiEndpoint.includes('llm-internal.threatbook-inc.cn')) {
      apiUrl = '/api/internal/api/chat/completions'
    }
  }

  console.log('🚀 发送API请求:', {
    environment: import.meta.env.DEV ? 'development' : 'production',
    originalEndpoint: selectedModelConfig.apiEndpoint + '/chat/completions',
    actualEndpoint: apiUrl,
    model: selectedModelConfig.modelId,
    hasApiKey: !!selectedModelConfig.apiKey,
    apiKeyPrefix: selectedModelConfig.apiKey ? selectedModelConfig.apiKey.substring(0, 10) + '...' : 'none',
    requestBody
  })

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${selectedModelConfig.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📡 API响应状态:', response.status, response.statusText)

    if (!response.ok) {
      let errorMessage = `API请求失败: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        console.error('❌ API错误详情:', errorData)
        errorMessage = errorData.error?.message || errorMessage
      } catch (parseError) {
        console.error('❌ 解析错误响应失败:', parseError)
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('✅ API响应数据:', data)
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('AI模型未返回有效回复')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('❌ API调用失败:', error)
    
    // 提供更详细的错误信息
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error(`网络请求失败，可能是CORS问题或网络连接问题。请检查：
1. API端点是否正确: ${selectedModelConfig.apiEndpoint}
2. 网络连接是否正常
3. 是否需要在服务器端配置CORS
4. 或者使用代理服务器`)
    }
    
    throw error
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
  box-sizing: border-box;
  background: var(--bg-gradient, linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%));
  font-size: clamp(12px, 1.2vw, 16px); /* 响应式字体大小 */
  position: fixed;
  top: 0;
  left: 0;
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
  width: clamp(200px, 20vw, 280px);
  background: var(--sidebar-gradient, linear-gradient(180deg, #f9f6e8 0%, #f5f0d8 100%));
  color: var(--text-color, #8b6914);
  transition: width 0.3s;
  border-right: 1px solid var(--border-color, #e6d7a3);
  flex-shrink: 0;
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
  padding: clamp(8px, 1.5vw, 12px) clamp(16px, 2vw, 24px);
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
  font-size: clamp(12px, 1.2vw, 14px);
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

/* 聊天页面调整宽度限制 */
.chat-page .content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
}

.page-content {
  background: var(--bg-gradient, linear-gradient(135deg, #fffef7 0%, #f9f6e8 100%));
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(139, 105, 20, 0.1);
  border: 1px solid var(--border-color, #e6d7a3);
  height: calc(100vh - 140px); /* 确保页面内容不超出视口 */
  overflow-y: auto; /* 允许垂直滚动 */
  overflow-x: hidden; /* 防止水平滚动 */
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
         appearance: none;
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

/* 模型配置页面样式 */
.models-container {
  max-width: 1200px;
  margin: 0 auto;
}

.models-section {
  background: var(--bg-gradient, linear-gradient(135deg, #fffef7 0%, #f9f6e8 100%));
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(139, 105, 20, 0.1);
  border: 1px solid var(--border-color, #e6d7a3);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border-color, #e6d7a3);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.storage-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--primary-light, #fefcf7);
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 6px;
  font-size: 12px;
}

.storage-label {
  color: #666;
  font-weight: 500;
}

.storage-value {
  color: var(--text-color, #8b6914);
  font-weight: 600;
}

.storage-count {
  color: #999;
  font-style: italic;
}

.open-dir-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.open-dir-btn:hover {
  background: var(--primary-light, #fefcf7);
  transform: scale(1.1);
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.export-btn, .import-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.export-btn {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.export-btn:hover {
  background: #45a049;
  border-color: #45a049;
}

.import-btn {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.import-btn:hover {
  background: #1976d2;
  border-color: #1976d2;
}

.section-header h3 {
  color: var(--text-color, #8b6914);
  margin: 0;
  font-size: 18px;
}

.add-model-btn {
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.add-model-btn:hover {
  background: var(--primary-dark, #ffb300);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
}

.models-list {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.model-card {
  background: white;
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
}

.model-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(139, 105, 20, 0.15);
}

.model-card.default {
  border-color: var(--primary-color, #ffc107);
  background: var(--primary-light, #fefcf7);
}

.model-card.disabled {
  opacity: 0.6;
  background: #f5f5f5;
}

.model-card.testing {
  pointer-events: none;
  opacity: 0.8;
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.model-info h4 {
  color: var(--text-color, #8b6914);
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.model-description {
  color: #666;
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.4;
}

.model-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.provider-tag, .default-tag, .disabled-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.provider-tag {
  background: #e3f2fd;
  color: #1976d2;
}

.default-tag {
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
}

.disabled-tag {
  background: #ffebee;
  color: #d32f2f;
}

.model-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.toggle-btn, .default-btn, .test-btn, .edit-btn, .delete-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.toggle-btn.active {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.default-btn:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.test-btn {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.test-btn:disabled {
  background: #ccc;
  border-color: #ccc;
  cursor: not-allowed;
}

.edit-btn {
  background: #ff9800;
  color: white;
  border-color: #ff9800;
}

.delete-btn {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.delete-btn:disabled {
  background: #ccc;
  border-color: #ccc;
  cursor: not-allowed;
}

.model-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.detail-item span {
  font-size: 14px;
  color: var(--text-color, #8b6914);
  word-break: break-all;
}

.test-result {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f5f5f5;
}

.result-message {
  font-size: 14px;
  font-weight: 500;
}

.result-message.success {
  color: #4caf50;
}

.result-message.error {
  color: #f44336;
}

.latency {
  color: #666;
  font-size: 12px;
}

/* 模型对话框样式 */
.model-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.model-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.dialog-header h3 {
  margin: 0;
  color: var(--text-color, #8b6914);
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px;
}

.dialog-content {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color, #8b6914);
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #ffc107);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #eee;
}

.cancel-btn, .save-btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: white;
  color: #666;
}

.cancel-btn:hover {
  background: #f5f5f5;
}

.save-btn {
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  border-color: var(--primary-color, #ffc107);
}

.save-btn:hover {
  background: var(--primary-dark, #ffb300);
  border-color: var(--primary-dark, #ffb300);
}

/* 深色模式适配 */
.app-container.dark-mode .models-section {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .section-header h3 {
  color: #1890ff;
}

.app-container.dark-mode .model-card {
  background: #333;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .model-card.default {
  background: #3d3d3d;
  border-color: #1890ff;
}

.app-container.dark-mode .model-info h4 {
  color: #ecf0f1;
}

.app-container.dark-mode .model-description {
  color: #bbb;
}

.app-container.dark-mode .detail-item label {
  color: #bbb;
}

.app-container.dark-mode .detail-item span {
  color: #ecf0f1;
}

.app-container.dark-mode .model-dialog {
  background: #333;
  color: #ecf0f1;
}

.app-container.dark-mode .dialog-header {
  border-bottom-color: #555;
}

.app-container.dark-mode .dialog-header h3 {
  color: #1890ff;
}

.app-container.dark-mode .form-input,
.app-container.dark-mode .form-select,
.app-container.dark-mode .form-textarea {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .form-input:focus,
.app-container.dark-mode .form-select:focus,
.app-container.dark-mode .form-textarea:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.app-container.dark-mode .dialog-actions {
  border-top-color: #555;
}

.app-container.dark-mode .cancel-btn {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .cancel-btn:hover {
  background: #4d4d4d;
}

.app-container.dark-mode .storage-info {
  background: #3d3d3d;
  border-color: #555;
}

.app-container.dark-mode .storage-label {
  color: #bbb;
}

.app-container.dark-mode .storage-value {
  color: #1890ff;
}

.app-container.dark-mode .storage-count {
  color: #999;
}

.app-container.dark-mode .open-dir-btn:hover {
  background: #3d3d3d;
}

.app-container.dark-mode .export-btn,
.app-container.dark-mode .import-btn {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .export-btn:hover {
  background: #4caf50;
  border-color: #4caf50;
}

.app-container.dark-mode .import-btn:hover {
  background: #2196f3;
  border-color: #2196f3;
}

/* 会话管理页面样式 */
.sessions-container {
  max-width: 1400px;
  margin: 0 auto;
}

.sessions-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-gradient, linear-gradient(135deg, #fffef7 0%, #f9f6e8 100%));
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(139, 105, 20, 0.15);
}

.stat-icon {
  font-size: 32px;
  opacity: 0.8;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-color, #8b6914);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.sessions-filters {
  background: var(--bg-gradient, linear-gradient(135deg, #fffef7 0%, #f9f6e8 100%));
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.search-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color, #ffc107);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.clear-filter-btn {
  padding: 12px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.clear-filter-btn:hover {
  background: #e0e0e0;
  border-color: #ccc;
}

.filter-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color, #8b6914);
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color, #ffc107);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.sessions-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.create-session-btn, .export-btn, .import-btn, .clear-btn {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.create-session-btn {
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  border-color: var(--primary-color, #ffc107);
}

.create-session-btn:hover {
  background: var(--primary-dark, #ffb300);
  border-color: var(--primary-dark, #ffb300);
}

.export-btn {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.export-btn:hover {
  background: #45a049;
  border-color: #45a049;
}

.import-btn {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.import-btn:hover {
  background: #1976d2;
  border-color: #1976d2;
}

.clear-btn {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.clear-btn:hover {
  background: #d32f2f;
  border-color: #d32f2f;
}

.sessions-list {
  min-height: 400px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color, #ffc107);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  color: var(--text-color, #8b6914);
  margin-bottom: 8px;
}

.empty-state p {
  color: #666;
  margin-bottom: 24px;
}

.create-first-btn {
  padding: 12px 24px;
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.create-first-btn:hover {
  background: var(--primary-dark, #ffb300);
  transform: translateY(-1px);
}

.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.session-card {
  background: white;
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.session-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(139, 105, 20, 0.15);
}

.session-card.active {
  border-color: var(--primary-color, #ffc107);
  background: var(--primary-light, #fefcf7);
}

.session-card.starred {
  border-left: 4px solid #ffc107;
}

.session-card.archived {
  opacity: 0.7;
  background: #f5f5f5;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.session-title h4 {
  color: var(--text-color, #8b6914);
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.session-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.session-model {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.session-date {
  color: #999;
}

.session-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.session-card:hover .session-actions {
  opacity: 1;
}

.star-btn, .archive-btn, .edit-btn, .delete-btn {
  padding: 6px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  background: transparent;
}

.star-btn.active {
  color: #ffc107;
}

.archive-btn:hover {
  background: #e0e0e0;
}

.edit-btn:hover {
  background: #fff3e0;
  color: #ff9800;
}

.delete-btn:hover {
  background: #ffebee;
  color: #f44336;
}

.session-content {
  margin-bottom: 12px;
}

.session-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.session-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.message-count, .token-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.session-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.session-tag {
  background: var(--primary-light, #fefcf7);
  color: var(--text-color, #8b6914);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--border-color, #e6d7a3);
}

/* 深色模式适配 */
.app-container.dark-mode .sessions-stats {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .stat-card {
  background: #333;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .stat-value {
  color: #ecf0f1;
}

.app-container.dark-mode .stat-label {
  color: #bbb;
}

.app-container.dark-mode .sessions-filters {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .search-input,
.app-container.dark-mode .filter-select {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .search-input:focus,
.app-container.dark-mode .filter-select:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.app-container.dark-mode .clear-filter-btn {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .clear-filter-btn:hover {
  background: #4d4d4d;
}

.app-container.dark-mode .filter-group label {
  color: #ecf0f1;
}

.app-container.dark-mode .session-card {
  background: #333;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .session-card.active {
  background: #3d3d3d;
  border-color: #1890ff;
}

.app-container.dark-mode .session-card.archived {
  background: #2d2d2d;
}

.app-container.dark-mode .session-title h4 {
  color: #ecf0f1;
}

.app-container.dark-mode .session-description {
  color: #bbb;
}

.app-container.dark-mode .session-tag {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

/* 会话对话框样式 */
.session-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.session-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.session-dialog .dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e6d7a3);
  background: var(--bg-gradient, linear-gradient(135deg, #fffef7 0%, #f9f6e8 100%));
}

.session-dialog .dialog-header h3 {
  margin: 0;
  color: var(--text-color, #8b6914);
  font-size: 18px;
  font-weight: 600;
}

.session-dialog .close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.session-dialog .close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.session-dialog .dialog-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.session-dialog .form-group {
  margin-bottom: 20px;
}

.session-dialog .form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color, #8b6914);
  font-size: 14px;
}

.session-dialog .form-input,
.session-dialog .form-textarea,
.session-dialog .form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.session-dialog .form-input:focus,
.session-dialog .form-textarea:focus,
.session-dialog .form-select:focus {
  outline: none;
  border-color: var(--primary-color, #ffc107);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.session-dialog .form-textarea {
  resize: vertical;
  min-height: 80px;
}

.tags-input {
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 8px;
  padding: 12px;
  background: white;
  transition: all 0.3s ease;
}

.tags-input:focus-within {
  border-color: var(--primary-color, #ffc107);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  background: var(--primary-light, #fefcf7);
  color: var(--text-color, #8b6914);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  border: 1px solid var(--border-color, #e6d7a3);
  gap: 4px;
}

.remove-tag-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-tag-btn:hover {
  background: #ffebee;
  color: #f44336;
}

.tag-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tag-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
}

.tag-input:focus {
  outline: none;
  border-color: var(--primary-color, #ffc107);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.add-tag-btn {
  padding: 8px 12px;
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.add-tag-btn:hover:not(:disabled) {
  background: var(--primary-dark, #ffb300);
}

.add-tag-btn:disabled {
  background: #ccc;
  color: #999;
  cursor: not-allowed;
}

.session-dialog .dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color, #e6d7a3);
  background: #fafafa;
}

.session-dialog .cancel-btn,
.session-dialog .save-btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.session-dialog .cancel-btn {
  background: white;
  color: #666;
  border-color: #ddd;
}

.session-dialog .cancel-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.session-dialog .save-btn {
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  border-color: var(--primary-color, #ffc107);
}

.session-dialog .save-btn:hover:not(:disabled) {
  background: var(--primary-dark, #ffb300);
  border-color: var(--primary-dark, #ffb300);
}

.session-dialog .save-btn:disabled {
  background: #ccc;
  color: #999;
  border-color: #ccc;
  cursor: not-allowed;
}

/* 深色模式适配 */
.app-container.dark-mode .session-dialog {
  background: #333;
  color: #ecf0f1;
}

.app-container.dark-mode .session-dialog .dialog-header {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .session-dialog .dialog-header h3 {
  color: #ecf0f1;
}

.app-container.dark-mode .session-dialog .close-btn {
  color: #bbb;
}

.app-container.dark-mode .session-dialog .close-btn:hover {
  background: #4d4d4d;
  color: #ecf0f1;
}

.app-container.dark-mode .session-dialog .form-input,
.app-container.dark-mode .session-dialog .form-textarea,
.app-container.dark-mode .session-dialog .form-select {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .session-dialog .form-input:focus,
.app-container.dark-mode .session-dialog .form-textarea:focus,
.app-container.dark-mode .session-dialog .form-select:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.app-container.dark-mode .session-dialog .form-group label {
  color: #ecf0f1;
}

.app-container.dark-mode .tags-input {
  background: #3d3d3d;
  border-color: #555;
}

.app-container.dark-mode .tags-input:focus-within {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.app-container.dark-mode .tag-item {
  background: #4d4d4d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .tag-input {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .tag-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.app-container.dark-mode .session-dialog .dialog-actions {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .session-dialog .cancel-btn {
  background: #3d3d3d;
  color: #ecf0f1;
  border-color: #555;
}

.app-container.dark-mode .session-dialog .cancel-btn:hover {
  background: #4d4d4d;
}

/* 提示词对话框样式 */
.prompt-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.prompt-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  animation: dialogSlideIn 0.3s ease-out;
}

.prompt-dialog .dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e6d7a3);
  background: var(--bg-gradient, linear-gradient(135deg, #fffef7 0%, #f9f6e8 100%));
}

.prompt-dialog .dialog-header h3 {
  margin: 0;
  color: var(--text-color, #8b6914);
  font-size: 18px;
  font-weight: 600;
}

.prompt-dialog .close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.prompt-dialog .close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.prompt-dialog .dialog-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.prompt-dialog .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.prompt-dialog .form-group {
  margin-bottom: 20px;
}

.prompt-dialog .form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color, #8b6914);
  font-size: 14px;
}

.prompt-dialog .form-input,
.prompt-dialog .form-textarea,
.prompt-dialog .form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.prompt-dialog .form-input:focus,
.prompt-dialog .form-textarea:focus,
.prompt-dialog .form-select:focus {
  outline: none;
  border-color: var(--primary-color, #ffc107);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.prompt-dialog .form-textarea {
  resize: vertical;
  min-height: 80px;
}

.prompt-dialog .prompt-content {
  min-height: 200px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
}

.content-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.char-count {
  color: #666;
}

.token-count {
  color: var(--primary-color, #ffc107);
  font-weight: 500;
}

.variables-input {
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 8px;
  padding: 12px;
  background: white;
  transition: all 0.3s ease;
}

.variables-input:focus-within {
  border-color: var(--primary-color, #ffc107);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.variables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.variable-item {
  display: inline-flex;
  align-items: center;
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  border: 1px solid #bbdefb;
  gap: 4px;
}

.remove-variable-btn {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-variable-btn:hover {
  background: #ffebee;
  color: #f44336;
}

.variable-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.variable-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
}

.variable-input:focus {
  outline: none;
  border-color: var(--primary-color, #ffc107);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.add-variable-btn {
  padding: 8px 12px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.add-variable-btn:hover:not(:disabled) {
  background: #1976d2;
}

.add-variable-btn:disabled {
  background: #ccc;
  color: #999;
  cursor: not-allowed;
}

.settings-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-color, #8b6914);
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-text {
  user-select: none;
}

.prompt-dialog .dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color, #e6d7a3);
  background: #fafafa;
}

.prompt-dialog .cancel-btn,
.prompt-dialog .save-btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.prompt-dialog .cancel-btn {
  background: white;
  color: #666;
  border-color: #ddd;
}

.prompt-dialog .cancel-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.prompt-dialog .save-btn {
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  border-color: var(--primary-color, #ffc107);
}

.prompt-dialog .save-btn:hover:not(:disabled) {
  background: var(--primary-dark, #ffb300);
  border-color: var(--primary-dark, #ffb300);
}

.prompt-dialog .save-btn:disabled {
  background: #ccc;
  color: #999;
  border-color: #ccc;
  cursor: not-allowed;
}

/* 深色模式适配 */
.app-container.dark-mode .prompt-dialog {
  background: #333;
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-dialog .dialog-header {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .prompt-dialog .dialog-header h3 {
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-dialog .close-btn {
  color: #bbb;
}

.app-container.dark-mode .prompt-dialog .close-btn:hover {
  background: #4d4d4d;
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-dialog .form-input,
.app-container.dark-mode .prompt-dialog .form-textarea,
.app-container.dark-mode .prompt-dialog .form-select {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-dialog .form-input:focus,
.app-container.dark-mode .prompt-dialog .form-textarea:focus,
.app-container.dark-mode .prompt-dialog .form-select:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.app-container.dark-mode .prompt-dialog .form-group label {
  color: #ecf0f1;
}

.app-container.dark-mode .variables-input {
  background: #3d3d3d;
  border-color: #555;
}

.app-container.dark-mode .variables-input:focus-within {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.app-container.dark-mode .variable-item {
  background: #2d4a5a;
  border-color: #4a6b7a;
  color: #81c7f4;
}

.app-container.dark-mode .variable-input {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .variable-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.app-container.dark-mode .checkbox-label {
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-dialog .dialog-actions {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .prompt-dialog .cancel-btn {
  background: #3d3d3d;
  color: #ecf0f1;
  border-color: #555;
}

.app-container.dark-mode .prompt-dialog .cancel-btn:hover {
  background: #4d4d4d;
}

/* 提示词管理页面样式 */
.prompts-container {
  max-width: 1400px;
  margin: 0 auto;
}

.prompts-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.prompts-filters {
  background: var(--bg-gradient, linear-gradient(135deg, #fffef7 0%, #f9f6e8 100%));
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.prompts-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.create-prompt-btn, .export-btn, .import-btn, .clear-btn {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.create-prompt-btn {
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  border-color: var(--primary-color, #ffc107);
}

.create-prompt-btn:hover {
  background: var(--primary-dark, #ffb300);
  border-color: var(--primary-dark, #ffb300);
}

.export-btn {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.export-btn:hover {
  background: #45a049;
  border-color: #45a049;
}

.import-btn {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.import-btn:hover {
  background: #1976d2;
  border-color: #1976d2;
}

.clear-btn {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.clear-btn:hover {
  background: #d32f2f;
  border-color: #d32f2f;
}

.prompts-list {
  min-height: 400px;
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.prompt-card {
  background: white;
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.prompt-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(139, 105, 20, 0.15);
}

.prompt-card.favorite {
  border-left: 4px solid #ffc107;
}

.prompt-card.public {
  border-top: 3px solid #4caf50;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.prompt-title h4 {
  color: var(--text-color, #8b6914);
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.prompt-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.prompt-category {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.prompt-language {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.prompt-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.prompt-card:hover .prompt-actions {
  opacity: 1;
}

.favorite-btn, .duplicate-btn, .edit-btn, .delete-btn {
  padding: 6px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  background: transparent;
}

.favorite-btn.active {
  color: #ffc107;
}

.duplicate-btn:hover {
  background: #e0e0e0;
}

.edit-btn:hover {
  background: #fff3e0;
  color: #ff9800;
}

.delete-btn:hover {
  background: #ffebee;
  color: #f44336;
}

.prompt-content {
  margin-bottom: 12px;
}

.prompt-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prompt-preview {
  color: #999;
  font-size: 13px;
  line-height: 1.4;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid var(--primary-color, #ffc107);
}

.prompt-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.prompt-tag {
  background: var(--primary-light, #fefcf7);
  color: var(--text-color, #8b6914);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--border-color, #e6d7a3);
}

.prompt-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.prompt-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.prompt-tokens {
  color: var(--primary-color, #ffc107);
  font-weight: 500;
}

.prompt-date {
  color: #999;
}

.prompt-status {
  display: flex;
  gap: 6px;
}

.public-badge {
  background: #4caf50;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.favorite-badge {
  color: #ffc107;
  font-size: 14px;
}

/* 深色模式适配 */
.app-container.dark-mode .prompts-filters {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .prompt-card {
  background: #333;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.app-container.dark-mode .prompt-title h4 {
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-description {
  color: #bbb;
}

.app-container.dark-mode .prompt-preview {
  background: #2d2d2d;
  color: #bbb;
  border-color: #555;
}

.app-container.dark-mode .prompt-tag {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-footer {
  border-color: #555;
}

.app-container.dark-mode .prompt-info {
  color: #bbb;
}

/* 提示词对话框设置样式 */
.prompt-dialog .settings-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.prompt-dialog .setting-item {
  flex: 1;
  min-width: 200px;
}

.prompt-dialog .setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color, #8b6914);
  margin-bottom: 8px;
}

.prompt-dialog .setting-control {
  display: flex;
  align-items: center;
}

.prompt-dialog .toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  min-width: 100px;
  justify-content: center;
}

.prompt-dialog .toggle-switch:hover {
  border-color: var(--primary-color, #ffc107);
  background: var(--primary-light, #fefcf7);
  transform: translateY(-1px);
}

.prompt-dialog .toggle-switch.active {
  background: var(--primary-color, #ffc107);
  border-color: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

.prompt-dialog .toggle-switch.active:hover {
  background: var(--primary-dark, #ffb300);
  border-color: var(--primary-dark, #ffb300);
  transform: translateY(-1px);
}

.prompt-dialog .toggle-icon {
  font-size: 16px;
  transition: all 0.3s ease;
}

.prompt-dialog .toggle-switch.active .toggle-icon {
  transform: scale(1.1);
}

.prompt-dialog .toggle-text {
  font-weight: 600;
  transition: all 0.3s ease;
}

/* 深色模式适配 */
.app-container.dark-mode .prompt-dialog .setting-label {
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-dialog .toggle-switch {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-dialog .toggle-switch:hover {
  background: #4d4d4d;
  border-color: var(--primary-color, #ffc107);
}

.app-container.dark-mode .prompt-dialog .toggle-switch.active {
  background: var(--primary-color, #ffc107);
  border-color: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
}

/* 变量管理样式 */
.prompt-dialog .variables-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
}

.prompt-dialog .variables-info {
  margin-bottom: 16px;
}

.prompt-dialog .info-text {
  margin: 0;
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
}

.prompt-dialog .info-text code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #495057;
}

.prompt-dialog .variables-preview h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color, #8b6914);
}

.prompt-dialog .variables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prompt-dialog .variable-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 16px;
  padding: 4px 8px;
  font-size: 13px;
  font-weight: 500;
}

.prompt-dialog .variable-name {
  color: var(--primary-color, #ffc107);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.prompt-dialog .remove-variable-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 12px;
  padding: 2px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.prompt-dialog .remove-variable-btn:hover {
  background: #dc3545;
  color: white;
}

.prompt-dialog .variables-help {
  text-align: center;
  padding: 20px;
}

.prompt-dialog .help-text {
  margin: 0;
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
}

.prompt-dialog .help-text code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #495057;
}

/* 深色模式适配 */
.app-container.dark-mode .prompt-dialog .variables-section {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .prompt-dialog .info-text,
.app-container.dark-mode .prompt-dialog .help-text {
  color: #bbb;
}

.app-container.dark-mode .prompt-dialog .info-text code,
.app-container.dark-mode .prompt-dialog .help-text code {
  background: #3d3d3d;
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-dialog .variables-preview h4 {
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-dialog .variable-item {
  background: #3d3d3d;
  border-color: #555;
}

.app-container.dark-mode .prompt-dialog .variable-name {
  color: var(--primary-color, #ffc107);
}

/* 聊天界面样式 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  margin: 0;
  position: relative;
  overflow: hidden; /* 防止整体滚动 */
  padding: 0;
}

/* 聊天页面的特殊样式，不显示滚动条 */
.chat-page .page-content {
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--bg-gradient, linear-gradient(135deg, #fffef7 0%, #f9f6e8 100%));
  border-bottom: 1px solid var(--border-color, #e6d7a3);
  flex-shrink: 0; /* 防止头部被压缩 */
}

.chat-header h2 {
  margin: 0;
  color: var(--text-color, #8b6914);
}

.chat-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.model-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 6px;
  background: white;
  color: var(--text-color, #8b6914);
  font-size: 14px;
}

.prompt-btn {
  padding: 8px 16px;
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.prompt-btn:hover {
  background: var(--primary-dark, #ffb300);
}

.test-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.test-btn:hover {
  background: #5a6268;
}

.diagnose-btn {
  padding: 8px 16px;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.diagnose-btn:hover {
  background: #138496;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: #f8f9fa;
  min-height: 0; /* 确保flex子元素可以收缩 */
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-chat h3 {
  margin: 0 0 8px 0;
  color: var(--text-color, #8b6914);
}

.empty-chat p {
  margin: 0;
  color: #666;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px; /* 为底部输入框留出空间 */
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.message.user .message-content {
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
}

.message.assistant .message-content {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.message.assistant .message-time {
  text-align: left;
}

/* 加载状态样式 */
.message.loading .message-content {
  color: #666;
  font-style: italic;
}

.loading-indicator {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.loading-dots {
  animation: loading-bounce 1.4s infinite ease-in-out both;
  font-size: 12px;
  color: var(--primary-color, #ffc107);
}

.loading-dots:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots:nth-child(2) {
  animation-delay: -0.16s;
}

.loading-dots:nth-child(3) {
  animation-delay: 0s;
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 错误状态样式 */
.message.error .message-content {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.app-container.dark-mode .message.error .message-content {
  background: #3d1a1a;
  color: #ffcdd2;
  border-color: #5d1a1a;
}

.chat-input {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid var(--border-color, #e6d7a3);
  flex-shrink: 0; /* 防止输入框被压缩 */
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  width: 100%;
  box-sizing: border-box;
}

.message-input {
  flex: 1;
  padding: 14px 18px;
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 20px;
  resize: none;
  font-size: 14px;
  font-family: inherit;
  min-height: 40px;
  max-height: 120px;
  line-height: 1.4;
  transition: all 0.3s ease;
  box-sizing: border-box;
  width: 100%;
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-color, #ffc107);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.send-btn {
  padding: 14px 22px;
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 80px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; /* 防止按钮被压缩 */
}

.send-btn:hover:not(:disabled) {
  background: var(--primary-dark, #ffb300);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 提示词选择对话框 */
.prompt-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.prompt-selector {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.selector-header h3 {
  margin: 0;
  color: var(--text-color, #8b6914);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.selector-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.prompt-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.prompt-item {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.prompt-item:hover {
  border-color: var(--primary-color, #ffc107);
  background: var(--primary-light, #fefcf7);
}

.prompt-title {
  font-weight: 600;
  color: var(--text-color, #8b6914);
  margin-bottom: 8px;
}

.prompt-preview {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 8px;
}

.prompt-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.prompt-category {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
}

.has-variables {
  background: #fff3e0;
  color: #ff9800;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 变量填充对话框 */
.variable-filler-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.variable-filler {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
}

.filler-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.filler-header h3 {
  margin: 0;
  color: var(--text-color, #8b6914);
}

.filler-content {
  padding: 20px;
}

.selected-prompt {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.selected-prompt h4 {
  margin: 0 0 8px 0;
  color: var(--text-color, #8b6914);
}

.prompt-preview {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.variables-form {
  margin-bottom: 20px;
}

.variable-field {
  margin-bottom: 16px;
}

.variable-field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-color, #8b6914);
}

.variable-field .variable-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e6d7a3);
  border-radius: 6px;
  font-size: 14px;
}

.filler-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn, .apply-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.apply-btn {
  background: var(--primary-color, #ffc107);
  color: var(--text-color, #8b6914);
}

.apply-btn:hover {
  background: var(--primary-dark, #ffb300);
}

/* 深色模式适配 */
.app-container.dark-mode .chat-header {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .chat-header h2 {
  color: #ecf0f1;
}

.app-container.dark-mode .model-select {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .chat-messages {
  background: #1a1a1a;
}

.app-container.dark-mode .empty-chat h3 {
  color: #ecf0f1;
}

.app-container.dark-mode .empty-chat p {
  color: #bbb;
}

.app-container.dark-mode .message.assistant .message-content {
  background: #333;
  color: #ecf0f1;
  border-color: #555;
}

.app-container.dark-mode .chat-input {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .message-input {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-selector,
.app-container.dark-mode .variable-filler {
  background: #333;
}

.app-container.dark-mode .selector-header h3,
.app-container.dark-mode .filler-header h3 {
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-item {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .prompt-item:hover {
  background: #4d4d4d;
}

.app-container.dark-mode .prompt-title {
  color: #ecf0f1;
}

.app-container.dark-mode .selected-prompt {
  background: #3d3d3d;
}

.app-container.dark-mode .selected-prompt h4 {
  color: #ecf0f1;
}

.app-container.dark-mode .variable-field label {
  color: #ecf0f1;
}

.app-container.dark-mode .variable-field .variable-input {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .chat-input {
  background: #2d2d2d;
  border-color: #555;
}

.app-container.dark-mode .message-input {
  background: #3d3d3d;
  border-color: #555;
  color: #ecf0f1;
}

.app-container.dark-mode .message-input:focus {
  border-color: var(--primary-color, #ffc107);
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}
       </style>
