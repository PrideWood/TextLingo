# TextLingo

TextLingo 是一个面向长期使用的语言学习工作台。用户只需粘贴原文，点击一次“开始分析”，系统会根据设置自动生成标题、译文、知识点和练习题，并整理成适合复制到 Obsidian 的 Markdown 风格结果。

## 当前产品结构

- 主页面：快速分析页，只保留原文输入、开始分析、结果阅读与复制
- 设置页：管理默认语言、自动分析项、学习记录和 Markdown 导出偏好
- 学习记录：本地热力图、总处理数、最近 7 天和连续使用天数
- 结果区：Markdown 阅读风格展示，一键复制全部或单独复制各区块

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- localStorage 持久化

## 安装与运行

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

构建生产版本：

```bash
npm run build
```

生产模式启动：

```bash
npm run start
```

## 本地环境变量

复制示例文件：

```bash
cp .env.example .env.local
```

### OpenAI 最小配置

```bash
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4.1-mini
```

### DeepSeek 最小配置

```bash
OPENAI_API_KEY=your-deepseek-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

### 翻译功能实际支持的变量

- `TRANSLATE_API_KEY` -> 回退到 `OPENAI_API_KEY`
- `TRANSLATE_MODEL` -> 回退到 `OPENAI_MODEL`
- `TRANSLATE_BASE_URL` -> 回退到 `OPENAI_BASE_URL` -> 默认 `https://api.openai.com/v1`

### 其他功能

- 标题：复用翻译同一套模型配置
- 知识点：优先读 `KNOWLEDGE_*`，否则回退到翻译/OpenAI 配置
- 练习题：优先读 `QUIZ_*`，否则回退到 OpenAI 配置
- TTS：仍为占位逻辑

## 项目结构

```text
TextLingo/
├── app/
│   ├── api/
│   │   ├── knowledge/route.ts
│   │   ├── quiz/route.ts
│   │   ├── title/route.ts
│   │   ├── translate/route.ts
│   │   └── tts/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── settings/page.tsx
├── lib/
│   ├── export/
│   │   └── markdown.ts
│   ├── providers/
│   │   ├── knowledge.ts
│   │   ├── llm.ts
│   │   ├── quiz.ts
│   │   ├── title.ts
│   │   ├── translate.ts
│   │   └── tts.ts
│   └── storage/
│       ├── preferences.ts
│       ├── progress.ts
│       └── workspace.ts
├── src/
│   ├── components/
│   │   ├── progress/ProgressPanel.tsx
│   │   ├── results/ResultDocument.tsx
│   │   ├── settings/SettingsForm.tsx
│   │   └── Header.tsx
│   ├── App.tsx
│   ├── styles.css
│   └── types.ts
├── .env.example
└── README.md
```

## 已实现功能

- 快速分析页
- 自动生成标题
- 自动生成译文
- 自动提取知识点
- 自动生成练习题
- Markdown 风格结果视图
- 一键复制全部 Markdown
- 单独复制译文 / 知识点 / 练习题
- localStorage 持久化输入内容与分析结果
- localStorage 持久化设置
- 本地学习记录、热力图和连续使用统计

## Markdown 导出结构

导出结果适合 Obsidian 使用，结构如下：

```md
# 标题

## 原文
...

## 译文
...

## 知识点
### 重点词汇
- **知识点名称**：解释
  - 对应原文：...
  - 学习提示：...

## 练习题
### 单选题
1. ...

### 多选题
1. ...
```

## 真实模型接入状态

已接真实模型：

- 标题
- 译文
- 知识点
- 练习题

仍为前端/占位结构：

- TTS

## 学习记录实现

学习记录目前完全保存在 localStorage，按日期累计：

- 总处理文本数
- 今日处理数
- 最近 7 天处理数
- 连续使用天数
- 过去 12 周热力图

## 后续可继续迭代

- 知识点点击后高亮原文片段
- 练习题提交与得分
- TTS 真实接入
- 多文档历史列表
