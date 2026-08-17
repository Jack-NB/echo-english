# Echo English 📖

每天 15 分钟，零基础学英语。

## 功能

- **AI 记忆文档阅读器** — 浏览按天生成的考研词汇学习文档:
  - 词根派生树 + 连锁记忆短文(中英对照双栏排版)
  - 文中任意英文单词可点击查词:大纲词即时释义,非大纲词由扩展词典补充
  - Web Speech API 朗读 + 移动端有道/谷歌发音兜底
  - 按天跳转、上一篇/下一篇、最近访问记录
- **离线支持(PWA)** — Service Worker 缓存应用与文档,离线可读、秒开,
  支持"添加到主屏幕"
- **全部本地化** — 数据存储在 localStorage,无需后端与数据库

## 离线与 PWA

- `public/sw.js`:导航请求 network-first(上线即更新),静态资源与文档
  stale-while-revalidate(缓存秒开 + 后台刷新)。GitHub Pages 的
  `Cache-Control: max-age=600` 由此不再影响二次访问。
- **发布时请递增 `sw.js` 里的 `CACHE_NAME`**,旧缓存才会在 activate 时被清掉。
- `public/manifest.webmanifest` + `public/icons/`(192/512/180 PNG 与 SVG 源文件)。
  图标由 `public/icons/icon.svg` 渲染生成,改图标只需改 SVG 后重新导出 PNG。
- Service Worker 仅在 `npm run build` 产物中注册,开发模式不受缓存干扰。

## 部署(GitHub Pages)

- Pages 的 CDN 会自动 gzip 文本资源,无需额外配置。
- 部署产物需包含 `.nojekyll`(本项目部署方式已带),`public/generated/` 下的
  Markdown 会原样提供,阅读器直接解析。
- 本地构建后用你现有的方式推送到 Pages 分支即可;仓库内无 GitHub Actions,
  如需 push 自动部署可再加 workflow。

## 词库数据

- 大纲词来源:[exam-data/NETEMVocabulary](https://github.com/exam-data/NETEMVocabulary),
  共 **5530** 个考研大纲词,按试卷词频排序,含词频、分类、子分类和释义。
- 词库通过脚本自动下载并注入,禁止手动编辑:

```bash
python scripts/update_vocabulary.py    # 重新生成 src/data/vocabulary-*.js
python scripts/build_extra_vocabulary.py  # 从文档收集非大纲词,生成扩展词典
```

- 大纲词随主包加载;**扩展词典(约 1.2 万词)按需懒加载**,点击单词时/浏览器空闲时才下载,
  首屏包体显著减小。
- 数据文件均为紧凑 JSON(空字段已剔除),不要手动格式化。

## AI 记忆文档生成器

项目根目录的 `main.py` 按桌面 markdown.md 规格实现:自动拉取词库,每批 20 个单词
调用 DeepSeek API,生成包含**词根派生树**和**连锁记忆短文(中英对照)**的
`output/Day_001.md` 学习文档。

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # 填入 DEEPSEEK_API_KEY
python main.py
```

- 支持断点续传(跳过已生成的 Day)、最多 3 次自动重试、批次间限流。
- 词库下载会缓存到 `output/.cache/`(已 gitignore);`--no-cache` 强制重新下载。
- `output/` 不提交到 git;运行 `python scripts/sync_generated.py` 将文档同步到
  `public/generated/`(该目录已提交,构建时随应用一起发布)。

## 技术栈

- **React 19** + **Vite 8**
- **TailwindCSS 3**
- **react-markdown**(文档渲染)
- **Web Speech API**(发音朗读,移动端远程 TTS 兜底)
- **localStorage**(阅读记录持久化)

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
├── pages/
│   └── GeneratedDocs.jsx        # AI 文档阅读器
├── data/
│   ├── vocabulary-1..12.js      # 大纲词分卷（随主包加载）
│   ├── vocabulary-extra.js      # 非大纲扩展词典（懒加载）
│   └── vocabulary.js            # 大纲词聚合
├── utils/
│   ├── vocabLookup.js           # Map 索引 + 扩展词典按需加载
│   └── speech.js                # 发音朗读
├── App.jsx
├── main.jsx                     # 含生产环境 Service Worker 注册
└── index.css

public/
├── sw.js                        # Service Worker（离线缓存）
├── manifest.webmanifest         # PWA 清单
├── icons/                       # PWA 图标（icon.svg 为源文件）
└── generated/                   # 生成的学习文档 + manifest.json
```

根目录的 `main.py` 与 `scripts/` 下为 Python 工具脚本(生成文档、同步、校验)。
