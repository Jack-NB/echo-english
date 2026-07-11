# 工作日志

## v1.0.0 — 初始发布

### 功能实现

- **今日学习**：每日 5 个新词，展示单词、音标、释义、例句，配合 Web Speech API 发音
- **智能复习**：SM-2 间隔重复算法（4 级阶段：12h → 1d → 3d → 7d），Flashcard 翻转模式
- **听力测验**：从当日已学 + 错题本中抽题，听音选义，实时反馈
- **错题本**：复习和测验中答错的单词自动收录
- **数据持久化**：localStorage 存储学习进度，每日重置学习计数

### 技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 构建工具 | Vite 8 | 快速 HMR，零配置开始 |
| 样式方案 | TailwindCSS 3 | 快速原型，响应式开箱即用 |
| 状态管理 | React Context | 应用小，无需引入外部库 |
| 路由方案 | 无路由，Tab 切换 | 单页应用，3 个 Tab，无需路由库 |
| 发音 API | Web Speech API | 浏览器原生支持，无需额外依赖 |
| 数据存储 | localStorage | 零后端，数据在本地 |
| 间隔重复 | SM-2 简化版 | 4 级阶段递进，忘记重置至第 1 级 |

### 词汇数据

- 100 个考研核心词汇
- 每个词包含：单词、音标、中文释义、英文例句、中文翻译
- 纯前端静态数据，无需网络请求

### 项目结构

```
english/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── context/LearningContext.jsx
│   ├── components/
│   │   ├── TabBar.jsx
│   │   └── WordCard.jsx
│   ├── pages/
│   │   ├── TodayLearning.jsx
│   │   ├── ReviewPage.jsx
│   │   └── ListeningQuiz.jsx
│   ├── data/vocabulary.js
│   └── utils/
│       ├── storage.js
│       └── spacedRepetition.js
```

### 开发笔记

#### 数据流

```
vocabulary.js (静态数据)
     ↓
LearningContext (React Context)
     ↓         ↓           ↓
TodayLearning  ReviewPage  ListeningQuiz
     ↓
localStorage (persistence)
```

#### 间隔重复阶段

| 阶段 | 间隔 | 升级条件 |
|------|------|----------|
| 0 (新词) | — | 当天学完，点"记住了" → 阶段 1 |
| 1 | 12 小时 | 复习点"知道" → 阶段 2 |
| 2 | 1 天 | → 阶段 3 |
| 3 | 3 天 | → 阶段 4 |
| 4 | 7 天 | → 已掌握 (learned=true) |

任意阶段点"忘了" → 重置到阶段 1，计入错题本。
