# Echo English 📖

每天 15 分钟，零基础学英语。

## 功能

- **今日学习** — 每日 5 个新词，附带词频、分类信息
- **智能复习** — 基于间隔重复（SM-2 算法）的 Flashcard 复习
- **听力测验** — 听发音选释义，错题自动加入错题本
- **词库浏览** — 5530 个考研大纲词，支持搜索和分类筛选
- **全部本地化** — 数据存储在 localStorage，无需后端服务

## 词库数据

- 数据来源：[exam-data/NETEMVocabulary](https://github.com/exam-data/NETEMVocabulary)，
  共 **5530** 个考研大纲词，按试卷词频排序，含词频、分类、子分类和释义。
- 词库通过脚本自动下载并注入，禁止手动下载：

```bash
python scripts/update_vocabulary.py
```

- 脚本会重新生成 `src/data/vocabulary-*.js`，应用启动时自动聚合全部词条。

## AI 记忆文档生成器

项目根目录的 `main.py` 按桌面 markdown.md 规格实现：自动拉取词库，每批 20 个单词
调用 DeepSeek API，生成包含**词根派生树**和**连锁记忆短文（中英对照）**的
`output/Day_001.md` 学习文档。

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # 填入 DEEPSEEK_API_KEY
python main.py
```

生成器支持断点续传（跳过已生成的 Day）、最多 3 次自动重试和批次间限流。

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
│   ├── WordLibrary.jsx           # 词库浏览页
│   └── ListeningQuiz.jsx         # 听力测验页
├── data/vocabulary.js            # 词汇数据
├── utils/
│   ├── storage.js                # localStorage 存取
│   └── spacedRepetition.js       # 间隔重复算法
├── App.jsx
└── main.jsx
```

根目录的 `main.py`、`scripts/update_vocabulary.py` 为 Python 工具脚本。
