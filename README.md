# Echo English 📖

每天 15 分钟，零基础学英语。

## 功能

- **今日学习** — 每日 5 个新词，附带音标、例句
- **智能复习** — 基于间隔重复（SM-2 算法）的 Flashcard 复习
- **听力测验** — 听发音选释义，错题自动加入错题本
- **全部本地化** — 数据存储在 localStorage，无需后端服务

## 技术栈

- **React 19** + **Vite 8**
- **TailwindCSS 3**
- **Web Speech API**（发音朗读）
- **localStorage**（学习进度持久化）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 默认 http://localhost:5173

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── context/LearningContext.jsx   # 全局状态管理
├── components/
│   ├── TabBar.jsx                # 底部/侧边导航
│   └── WordCard.jsx              # 单词卡片组件
├── pages/
│   ├── TodayLearning.jsx         # 今日学习页
│   ├── ReviewPage.jsx            # 复习页
│   └── ListeningQuiz.jsx         # 听力测验页
├── data/vocabulary.js            # 词汇数据
├── utils/
│   ├── storage.js                # localStorage 存取
│   └── spacedRepetition.js       # 间隔重复算法
├── App.jsx
└── main.jsx
```
