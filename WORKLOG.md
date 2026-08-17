# 工作日志

## v2.1.1 — 离线支持(PWA)

- 新增 `public/sw.js`:应用壳 network-first(发布即更新),静态资源与生成文档
  stale-while-revalidate(缓存秒开 + 后台刷新),install 预缓存入口页;
  发布时递增 `CACHE_NAME` 即可清旧缓存。
- 新增 `public/manifest.webmanifest` 与 `public/icons/`(192/512/180 PNG +
  SVG 源文件,紫色 Echo 图标),支持"添加到主屏幕"与 maskable 图标。
- `index.html` 挂载 manifest/apple-touch-icon/description;`main.jsx` 仅在生产
  构建注册 SW,开发模式不受缓存干扰。
- 文档加载失败(如离线且未缓存)时显示提示条;清单为空且离线时给出联网提示。
- 实测:断网后整页刷新正常、已缓存 Day 可读、未缓存 Day 显示提示,
  manifest/图标/SW 均 200,在线阶段零 console 报错。
- 部署层说明:GitHub Pages CDN 已自动 gzip(实测 7 MB JS 传输 1.37 MB),
  `.nojekyll` 已在产物中,`Cache-Control: max-age=600` 为 Pages 固定值,
  由 SW 缓存抵消。

## v2.1.0 — 性能与体积优化

### 包体积(7.08 MB → 首屏约 3.3 MB)

- 词库数据文件改为紧凑 JSON(去缩进、剔除所有空字段):`vocabulary-extra.js`
  6.27 MB → 2.65 MB,大纲词 12 分卷合计 4.5 MB → 2.8 MB。
- 非大纲扩展词典(约 1.2 万词)从主包拆出,改为按需加载:浏览器空闲时预取,
  点击生词时才真正下载(`src/utils/vocabLookup.js`),首屏包体减半。
- 生成脚本(`update_vocabulary.py`、`build_extra_vocabulary.py`)同步改为输出
  紧凑格式,重新生成也不会退化。

### 运行时

- 单词查词从每次线性扫描 1.7 万词条改为 Map 索引 O(1);生词异步查询扩展词典,
  弹层先显示「词典加载中/文中释义」,命中后自动补全。
- 移除 LearningContext 的 5 个全量扫描 useMemo 与每分钟 tick 重渲染
  (复习队列/错题本等计算在纯文档模式下全部白做)。

### 清理

- 彻底移除已无入口的旧页面(TodayLearning/ReviewPage/WordLibrary/ListeningQuiz)、
  TabBar、WordCard、storage/spacedRepetition 工具与 react/vite/hero 资源。
- 修复 favicon 404(`index.html` 原指向不存在的 `vite.svg`,改为 `favicon.svg`)。
- `output/` 加入 .gitignore(生成产物),`public/generated/` 保持提交;
  删除根目录遗留的 `kaoyan-english.html`。
- `main.py` 词库下载增加本地缓存(`output/.cache/`,`--no-cache` 强制刷新)。

## v2.0.0 — 全量考研大纲词库 + AI 记忆文档生成器

### 数据

- 接入 [exam-data/NETEMVocabulary](https://github.com/exam-data/NETEMVocabulary)，
  词库从 100 个手工词条升级为 5530 个考研大纲词。
- 新增 `scripts/update_vocabulary.py`，通过代码下载 `netem_full_list.json` 并重新生成
  `src/data/vocabulary-*.js`（12 个分卷，每卷 500 词）。
- 词条新增词频、分类、子分类、其他拼写字段；原音标/例句字段保留但允许为空。
- 本地进度键升级为 `v2`，旧 100 词进度不会污染新词库。

### 应用

- 新增「词库」Tab：搜索单词/释义、按分类筛选、按词频展示、分批加载。
- 今日学习与复习卡片适配无音标/例句的词条，改展示词频和分类信息。
- 听力测验结果展示兼容空音标词条。
- 听力测验改为每次进入测验页时生成题目，避免先学习后测验出现空题池。
- 新增「AI 文档」Tab：浏览后台生成的 Day_XXX.md（派生词链/连锁故事/翻译），
  支持按天数跳转、上一篇/下一篇，并用 localStorage 记录每篇访问次数（停留满 3 秒才计数）。

### 生成器

- 按桌面 markdown.md 实现 `main.py`：DeepSeek `deepseek-chat`、每批 20 词、
  前 5500 词、词根派生树 + 连锁记忆短文（中英对照）、`output/Day_XXX.md`。
- 支持 `.env` 读取 `DEEPSEEK_API_KEY`、3 次重试、批次间 2 秒限流、
  tqdm 进度条、跳过已生成 Day 的断点续传。

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
