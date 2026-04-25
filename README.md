# TextLingo

TextLingo 是一个个人版语言学习工作台。粘贴文本或图片后，它会生成标题、译文、知识点、练习题，并导出为适合 Obsidian 的 Markdown 笔记。

当前版本不使用数据库、不包含登录/支付/多用户系统。Settings、Recent、Learning rhythm 和最近分析结果都保存在当前浏览器的 `localStorage`。

> 个人测试版提醒：不要公开分享部署链接。当前版本没有账号系统、额度控制或费率限制；知道 access code 的人可以消耗你在 Vercel 环境变量中配置的模型 API key。建议仅自己使用或小范围可信测试，并定期更换 access code。

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开：

```text
http://localhost:3000
```

生产构建检查：

```bash
npm run lint
npm run build
```

项目目前没有单独的 `typecheck` script，`next build` 会执行 TypeScript 与 Next.js 构建检查。

## Vercel Deployment

1. 将项目推送到 GitHub。
2. 在 Vercel 中选择 `Import Project`。
3. Framework Preset 选择 `Next.js`，通常 Vercel 会自动识别。
4. 在 Vercel Project Settings -> Environment Variables 中按 `.env.example` 配置变量。
5. 点击 Deploy。
6. 修改环境变量后，需要重新部署才能生效。

部署到公网时至少应配置 `TEXTLINGO_ACCESS_CODE` 或 `TEXTLINGO_ACCESS_CODES`，否则生产环境会拒绝访问码验证。

当前版本是个人测试版，不包含登录、额度控制、限流或后台管理。请不要公开分享部署链接；如果需要给他人临时试用，建议使用单独的 access code，并在测试结束后更换。

`app/api/analyze/route.ts` 和 `app/api/ocr/route.ts` 预留了 `maxDuration = 30`，用于降低文本分析和 OCR 请求在 serverless 环境中超时的风险。

## Required Environment Variables

### Access Code Protection

TextLingo includes a lightweight access code gate for personal Vercel deployments. It is not a full account system, but it prevents anonymous visitors from using your server-side model keys.

Local `.env.local`:

```bash
TEXTLINGO_ACCESS_CODE=your-secret-code
```

Multiple codes are also supported:

```bash
TEXTLINGO_ACCESS_CODES=code1,code2,code3
```

If both variables are set, TextLingo merges them into one allowed list. Do not write real access codes into frontend code, README, or `.env.example`.

Behavior:

- The browser shows an access code screen before the main workspace.
- After a successful check, the browser stores a lightweight local access session in `localStorage`.
- The frontend session is only for convenience.
- API routes still verify `x-textlingo-access-code` before calling LLM/OCR providers.
- In local development, if no access code is configured, access is allowed.
- In production, if no access code is configured, access verification fails with `Access code is not configured.`

### Text Analysis

文本分析使用 OpenAI-compatible 请求。至少配置一组可用文本模型。

OpenAI:

```bash
OPENAI_API_KEY=your-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

DeepSeek:

```bash
DEEPSEEK_API_KEY=your-deepseek-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-v4-flash
```

也可以继续用 OpenAI 命名变量配置 DeepSeek-compatible endpoint：

```bash
OPENAI_API_KEY=your-deepseek-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

Qwen 文本模型可选配置：

```bash
QWEN_API_KEY=your-dashscope-key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_TEXT_MODEL=your-qwen-text-model
```

注意：`QWEN_API_KEY` 只有在设置了 `QWEN_TEXT_MODEL` 时才会被文本分析 fallback 使用，避免 OCR key 被误判为文本分析已配置。

### Per-Feature Overrides

这些变量都是可选的。若配置，会优先于全局 fallback：

```bash
TITLE_API_KEY=
TITLE_BASE_URL=
TITLE_MODEL=

TRANSLATE_API_KEY=
TRANSLATE_BASE_URL=
TRANSLATE_MODEL=

KNOWLEDGE_API_KEY=
KNOWLEDGE_BASE_URL=
KNOWLEDGE_MODEL=

QUIZ_API_KEY=
QUIZ_BASE_URL=
QUIZ_MODEL=
```

读取顺序为：

```text
FEATURE_* -> DEEPSEEK_* -> QWEN_* text fallback -> OPENAI_* -> built-in defaults
```

### OCR

OCR 默认使用阿里云 Model Studio / DashScope 的 Qwen OCR / Qwen-VL，OpenAI-compatible Chat Completions endpoint：

```bash
OCR_PROVIDER=qwen-vl
OCR_API_KEY=your-dashscope-key
OCR_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OCR_MODEL=qwen-vl-ocr-latest
```

也支持 Qwen fallback：

```bash
QWEN_API_KEY=your-dashscope-key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen-vl-ocr-latest
```

国际站或新加坡区域可将 base URL 改为：

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

OCR 请求 endpoint：

```text
${OCR_BASE_URL}/chat/completions
```

图片限制：`png` / `jpg` / `jpeg` / `webp`，最大 `10MB`。图片不会被持久保存，服务端只会转成 data URL 发给配置的 OCR provider。

### Optional TTS

```bash
TTS_API_KEY=
```

TTS 当前仍是接口骨架/占位逻辑，不是完整真实语音服务。

## Obsidian Export

TextLingo 使用 Obsidian URI 直接尝试创建笔记：

```text
obsidian://new?vault={{vault}}&file={{encodedFilePath}}&content={{encodedMarkdown}}
```

注意：

- 需要本机安装 Obsidian。
- 需要在 Settings 中启用 Obsidian export，并填写正确 vault 名称。
- 浏览器需要允许打开外部应用。
- Vercel 线上页面也可以通过 `obsidian://` 唤起当前设备的 Obsidian。
- `vault`、`file`、`content` 会分别用 `encodeURIComponent` 编码，不使用 `URLSearchParams` 生成 `content`，避免空格变成 `+`。
- URI 太长时可能失败，页面会提示使用 Copy Markdown 作为稳定备选。

## Copy Markdown

Copy Markdown 会复制完整 Markdown，包括 YAML frontmatter。优先使用 `navigator.clipboard.writeText`，不可用时回退到隐藏 textarea + `document.execCommand('copy')`。复制成功/失败都会在页面上显示反馈。

## Privacy / Data

- 当前版本不使用数据库。
- Access code 是轻量访问保护，不是账号系统、权限系统或额度系统。
- Settings、Recent、Learning rhythm、最近输入和最近分析结果保存在浏览器 `localStorage`。
- 用户文本会发送到你配置的 LLM provider。
- 图片 OCR 会把图片转成 data URL 后发送到你配置的 OCR provider。
- API keys 只应配置在 `.env.local` 或 Vercel Environment Variables 中。
- 不要使用 `NEXT_PUBLIC_` 存储私密 key。
- `.env.local` 不应提交到 Git。

## Project Structure

```text
TextLingo/
├── app/
│   ├── api/
│   │   ├── access/verify/route.ts
│   │   ├── analyze/route.ts
│   │   ├── knowledge/route.ts
│   │   ├── ocr/route.ts
│   │   ├── quiz/route.ts
│   │   ├── title/route.ts
│   │   ├── translate/route.ts
│   │   └── tts/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── clipboard.ts
│   ├── client/
│   ├── export/markdown.ts
│   ├── integrations/obsidian.ts
│   ├── providers/
│   ├── server/
│   └── storage/
├── src/
│   ├── components/
│   │   ├── access/
│   │   ├── home/
│   │   ├── progress/
│   │   ├── settings/
│   │   └── study/
│   ├── App.tsx
│   ├── styles.css
│   └── types.ts
├── .env.example
└── README.md
```

## Deployment Smoke Test

部署后建议依次测试：

1. 打开首页，确认 logo、输入框、Recent、Learning rhythm 正常显示。
2. 在 Settings 中确认语言、夜间模式、OCR、Obsidian 设置可保存，刷新后仍存在。
3. 粘贴英文文本，点击 Analyze，确认进入 Study View。
4. 从 Study View 返回首页，再点击 Recent，确认不会重新调用模型。
5. 在 Export / Markdown 页测试 Copy Markdown。
6. 如果本机安装了 Obsidian，测试 Send to Obsidian。
7. 开启 OCR 后上传或粘贴图片，确认先 OCR，再进入 Analyze。
8. 不带 `x-textlingo-access-code` 直接请求 `/api/analyze` 或 `/api/ocr`，确认返回 `401 Unauthorized`。

## Known TODO

- TTS 仍是占位骨架。
- Obsidian URI 对超长 Markdown 不稳定，后续可考虑 Obsidian Local REST API 或专用插件。
- OCR 依赖 provider 对图片输入的实际支持与区域 endpoint。
- 当前为浏览器本地存储，换浏览器或清理站点数据后 Recent/Settings/Heatmap 会丢失。
