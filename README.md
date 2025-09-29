# LLM Client

> 跨平台大语言模型客户端 - 现代化、可定制的AI交互体验

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.0-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Electron](https://img.shields.io/badge/Electron-Latest-47848F?logo=electron)](https://electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)

一个基于 Vue 3 + Electron + TypeScript 构建的现代化跨平台桌面应用程序，专为与大语言模型（LLM）交互而设计。

## ✨ 核心特性

### 🎨 多主题支持
- **6种精心设计的主题**：默认、黄色、红色、蓝色、粉色、绿色
- **深色/浅色模式**：一键切换，护眼舒适
- **CSS变量系统**：动态主题切换，视觉体验流畅

### 🔤 自定义字体
- **字体上传**：支持 WOFF、WOFF2、TTF、OTF 格式
- **动态加载**：实时应用自定义字体
- **字体管理**：添加、删除、预览字体效果

### 💬 智能对话
- **多模型支持**：GPT-3.5、GPT-4、Claude 等主流模型
- **参数调节**：温度、最大令牌数等精细控制
- **实时对话**：流畅的对话体验

### 📝 提示词管理
- **预设模板**：常用提示词快速调用
- **分类管理**：按用途组织提示词
- **搜索功能**：快速找到需要的模板

### 📚 会话管理
- **历史记录**：保存所有对话历史
- **导出/导入**：备份和分享会话
- **会话分类**：按项目或主题组织

### ⚙️ 模型配置
- **API设置**：灵活的端点配置
- **参数调节**：温度、令牌数等
- **系统提示**：自定义模型行为

### 🌍 多语言支持
- **界面语言**：简体中文、英文
- **本地化**：完整的中文本地化体验

## 🛠️ 技术栈

- **前端框架**: Vue 3 + Composition API
- **状态管理**: Pinia
- **构建工具**: Vite
- **桌面应用**: Electron
- **开发语言**: TypeScript
- **样式方案**: CSS Variables + 响应式设计
- **版本控制**: Git

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/fxe00/llm-client.git
cd llm-client

# 进入应用目录
cd app

# 安装依赖
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 构建应用
npm run build

# 打包分发版本
npm run dist
```

### 构建脚本

```bash
# 仅构建Vue应用
npm run build:vite

# 仅构建Electron
npm run build:electron

# 完整构建
npm run build

# 创建安装包
npm run dist
```

## 📁 项目结构

```
llm-client/
├── app/                    # 主应用目录
│   ├── src/
│   │   ├── components/     # Vue组件
│   │   ├── stores/        # Pinia状态管理
│   │   ├── assets/        # 静态资源
│   │   └── main.ts        # 应用入口
│   ├── electron/          # Electron主进程
│   ├── package.json       # 项目配置
│   └── vite.config.ts     # Vite配置
├── docs/                  # 文档目录
├── designs/               # 设计文件
├── prototypes/            # 原型文件
├── .gitignore            # Git忽略文件
└── README.md             # 项目说明
```

## 🎯 目标用户

- **AI研究人员和开发者**：需要频繁与LLM交互的专业人士
- **内容创作者和写作者**：利用AI辅助创作的用户
- **对AI工具有个性化需求的用户**：追求定制化体验的用户
- **跨平台用户**：需要在不同操作系统上使用AI工具的用户

## 🌟 项目亮点

- **现代化UI设计**：采用动画风格和粗体字体，提供优秀的视觉体验
- **高度可定制**：从主题色彩到字体选择，满足个性化需求
- **跨平台兼容**：支持 Windows、macOS、Linux
- **开源友好**：MIT许可证，欢迎社区贡献
- **性能优化**：基于Vite的快速构建，Electron的轻量级桌面体验

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Pinia](https://pinia.vuejs.org/) - Vue状态管理库

## 📞 联系我们

- **项目地址**: https://github.com/fxe00/llm-client
- **问题反馈**: [Issues](https://github.com/fxe00/llm-client/issues)
- **功能建议**: [Discussions](https://github.com/fxe00/llm-client/discussions)

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！