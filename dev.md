# Deep Research 开发日志

本文档记录了 Deep Research 项目的完整开发过程和重要技术决策。

---

## 2025-01-06 双模式架构合并与基因研究功能集成

### 需求背景

用户希望将两个独立的研究平台合并为一个项目：
- **Repository A (deep-research)**: 通用研究平台
- **Repository B (DeepGeneResearch)**: 专业基因研究平台 (来自 https://github.com/Scilence2022/DeepGeneResearch)

目标：创建统一的 Project C，支持两种模式切换：
- **普通模式**：通用研究功能
- **专业模式**：基因研究专业功能

### 技术分析

#### Repository 差异分析

**DeepGeneResearch 的核心特性**：
1. **10+ 生物数据库集成**: PubMed, UniProt, NCBI Gene, GEO, PDB, KEGG, STRING, OMIM, Ensembl, Reactome
2. **328 行类型定义**: 分子生物学专业类型系统
3. **8 个专业模块** (~150KB 代码):
   - API 集成 (api-integrations.ts, 19KB)
   - 数据提取 (data-extractor.ts, 27KB)
   - 查询生成 (query-generator.ts, 19KB)
   - 搜索提供商 (search-providers.ts, 22KB)
   - 文献验证 (literature-validator.ts, 23KB)
   - 质量控制 (enhanced-quality-control.ts, 12KB)
   - 报告模板 (report-templates.ts, 28KB)
   - 可视化生成 (visualization-generators.ts, 18KB)

### 实现方案

#### 架构设计

采用 **Zustand 状态管理 + 条件渲染** 的双模式架构：

```typescript
// 模式状态管理
export type ResearchMode = 'general' | 'professional';

interface ModeState {
  mode: ResearchMode;
  setMode: (mode: ResearchMode) => void;
  isGeneralMode: () => boolean;
  isProfessionalMode: () => boolean;
}

export const useModeStore = create<ModeState>()(
  persist(
    (set, get) => ({
      mode: 'general',
      setMode: (mode) => set({ mode }),
      // ...
    }),
    { name: 'research-mode-storage' }
  )
);
```

#### 文件结构

**新增核心文件**：
- `src/store/mode.ts` - 模式状态管理
- `src/utils/mode-adapter.ts` - 模式适配器
- `src/components/ModeSelector.tsx` - 模式选择器 UI
- `src/components/Professional/GeneInput.tsx` - 基因研究输入表单
- `src/types/gene-research.ts` - 328行专业类型定义
- `src/utils/gene-research/` - 8 个基因研究模块

**修改的文件**：
- `src/components/Research/Topic.tsx` - 添加模式切换 UI
- `src/locales/zh-CN.json`, `en-US.json` - i18n 支持

#### UI 实现

在主界面添加模式选择器：

```tsx
<Select value={mode} onValueChange={(value) => setMode(value)}>
  <SelectTrigger className="w-[200px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="general">🔍 普通模式</SelectItem>
    <SelectItem value="professional">🧬 专业模式（基因研究）</SelectItem>
  </SelectContent>
</Select>
```

条件渲染不同的输入组件：

```tsx
{mode === "professional" ? (
  <GeneInput onSubmit={handleGeneResearchSubmit} isLoading={isThinking} />
) : (
  <Form>{/* 通用研究表单 */}</Form>
)}
```

### 遇到的问题与解决

#### 问题 1: ESLint 错误

**错误类型**：
- 未使用的导入 (EnhancedLiteratureReference)
- 应使用 const 而非 let (diversityScore, stats)
- 未使用的参数 (organism)

**解决方案**：
- 移除未使用的导入
- 将不变量改为 const
- 添加 eslint-disable 注释

#### 问题 2: 用户误解 Git 操作

**用户担心**: "你不用给 https://github.com/Scilence2022/DeepGeneResearch push 啊"

**澄清**:
- 只对 DeepGeneResearch 进行了只读克隆到 `/tmp`
- 所有修改仅推送到用户自己的仓库 `awaragml00029-debug/deep-research`
- 未对源仓库进行任何修改

#### 问题 3: 缺失可见的模式切换 UI

**用户反馈**: "我部署了 怎么没有找到如何切换到专业模式的按钮呢"

**原因**: 初版实现只有后端逻辑，缺少前端可见控件

**解决**: 在 `Topic.tsx` 头部添加醒目的模式选择器下拉菜单

### 技术决策

#### 为什么选择 Zustand？

1. **轻量级**: 比 Redux 小得多
2. **持久化支持**: `persist` middleware 自动保存到 localStorage
3. **TypeScript 友好**: 完整的类型推导
4. **简单直观**: 无需 actions、reducers

#### 为什么不使用路由区分？

1. **用户体验**: 切换更快，无需页面跳转
2. **状态管理**: 共享状态更简单
3. **代码复用**: 85% 的代码可复用

### 提交记录

- `dd78416` - feat: Implement dual-mode architecture with gene research support
- `a993ea9` - fix: Resolve ESLint errors in gene-research modules
- `363137f` - docs: Add comprehensive test report
- `d8e305c` - feat: Add visible mode switcher UI in main page
- `6c352e3` - docs: Add comprehensive user guide for dual-mode UI

---

## 2025-01-06 Mod AI Studio Provider 支持

### 需求背景

用户使用 NewAPI.ai 服务作为 Gemini API 的代理，遇到以下问题：
1. Google AI Studio provider 不适用
2. API 不返回模型列表（用户最初认为）
3. 需要手动输入模型名称

用户要求：
1. 限制 AI Provider 选项为：Google AI Studio、OpenAI、Mod AI Studio
2. 新增 Mod AI Studio provider
3. 支持手动输入模型名称

### API 格式分析

**NewAPI.ai API 格式**：
```bash
curl "https://your-server.com/v1beta/models/gemini-2.0-flash:generateContent?key=$KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents": [{"parts":[{"text": "..."}]}]}'
```

**关键发现**：
- 完全兼容 Google Gemini API 格式
- 使用 `/v1beta` 路径
- 认证方式：查询参数 `?key=xxx`
- 实际**可以返回模型列表** (后续测试发现)

### 实现方案

#### 架构设计

复用 Google AI Studio 的实现，但支持自定义 API 基础 URL：

```typescript
case "modai":
  const { modaiApiKey, modaiApiProxy } = useSettingStore.getState();
  options.baseURL = completePath(modaiApiProxy || MODAI_BASE_URL, "/v1beta");
  options.apiKey = multiApiKeyPolling(modaiApiKey);
  break;
```

#### 文件修改

**新增**：
- `src/app/api/ai/modai/[...slug]/route.ts` - API 代理路由
- `src/constants/urls.ts` - 添加 `MODAI_BASE_URL` 常量

**修改**：
- `src/store/setting.ts` - 添加 modai 配置字段
- `src/hooks/useAiProvider.ts` - 添加 modai 支持
- `src/hooks/useModelList.ts` - 添加模型列表获取（后续发现 API 支持）
- `src/components/Setting.tsx` - 限制 provider 选项，添加 Mod AI Studio UI
- `src/utils/deep-research/provider.ts` - 添加 modai provider 工厂

#### API 代理实现

关键差异：NewAPI.ai 使用查询参数认证，而非请求头

```typescript
// 从请求头获取 API key
const apiKey = req.headers.get("x-goog-api-key") || "";

// 转换为查询参数
if (apiKey) {
  searchParams.set("key", apiKey);
}

const url = `${API_PROXY_BASE_URL}/${path.join("/")}?${searchParams.toString()}`;
```

### 遇到的问题与解决

#### 问题 1: "Unsupported Provider: modai" 错误

**原因**: 在 `useAiProvider.ts` 和 `useModelList.ts` 中添加了 modai，但遗漏了 `provider.ts` 中的工厂函数

**解决**: 在 `createAIProvider` 中添加 modai case，复用 `createGoogleGenerativeAI`

```typescript
else if (provider === "modai") {
  const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
  const modai = createGoogleGenerativeAI({ baseURL, apiKey });
  return modai(model, settings);
}
```

#### 问题 2: Placeholder 误导用户

**初始 placeholder**: `https://your-newapi-server.com/v1beta`

**问题**: 用户会填写包含 `/v1beta` 的 URL，导致路径重复：
- 用户输入：`https://server.com/v1beta`
- 代码添加：`/v1beta`
- 最终 URL：`https://server.com/v1beta/v1beta/...` ❌

**解决**:
- Placeholder 改为：`http://your-newapi-server.com` (不含 /v1beta)
- 代码统一添加 `/v1beta`
- 对齐 Google AI Studio 的实现模式

#### 问题 3: 模型列表支持

**初始假设**: API 不返回模型列表，需要手动输入

**实际情况**: 用户测试后发现 API **可以返回模型列表**：
```bash
curl "http://your-newapi-server.com/v1beta/models?key=$KEY"
# 返回 70+ 个模型，包括 gemini-2.5-pro, ds-R1-Max, gpt-OSS 等
```

**解决**: 实现模型列表获取，使用更宽松的过滤条件：

```typescript
const newModelList = (models as GeminiModel[])
  .filter(
    (item) =>
      item.name.startsWith("models/gemini") ||  // Google 官方格式
      item.name.startsWith("gemini") ||         // NewAPI 格式
      item.name.startsWith("ds-") ||            // DeepSeek 模型
      item.name.startsWith("gpt-")              // GPT 模型
  )
  .map((item) => item.name.replace("models/", ""));
```

### 技术决策

#### 为什么对齐 Google AI Studio 实现？

1. **API 完全兼容**: NewAPI.ai 就是 Gemini 的代理
2. **用户体验一致**: 配置方式相同
3. **维护简单**: 复用现有逻辑
4. **灵活性**: 用户可配置自己的服务器地址

#### 为什么使用查询参数认证？

NewAPI.ai 特殊要求：
- Gemini 官方：`x-goog-api-key` header
- NewAPI.ai：`?key=xxx` query parameter

在代理层转换认证方式，前端无需关心差异。

### 提交记录

- `c7e795f` - feat: Add Mod AI Studio provider with manual model input
- `62acfcb` - fix: Add modai provider support to createAIProvider

---

## 2025-01-06 Docker 部署优化与默认模型更新

### 需求背景

用户希望：
1. 支持本地 Docker 构建和运行
2. 更新默认模型为 Gemini 2.5 版本

### 改进内容

#### Docker 配置优化

**Dockerfile 改进**：
- 添加 `wget` 支持健康检查
- 多阶段构建优化镜像大小

**docker-compose.yml 增强**：
```yaml
services:
  deep-research:
    restart: unless-stopped  # 自动重启
    healthcheck:             # 健康检查
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - deep-research-data:/app/.next/cache  # 数据持久化
```

**.dockerignore 完善**：
- 排除开发文件和文档
- 优化构建速度

#### 便捷脚本

**docker-build.sh**:
- 检查 `.env` 文件
- 带进度提示的构建
- 错误处理

**docker-run.sh**:
- 自动检查镜像
- 验证配置
- 显示访问地址和常用命令

**docker-stop.sh**:
- 确认提示
- 可选择删除容器

#### 文档

**DOCKER.md** (完整部署指南):
- 快速开始
- 常用命令
- 配置说明
- 生产环境建议
- 故障排查
- 性能优化
- 安全建议

**.env.example**:
- 清晰的配置分组
- 详细的注释
- 示例值

### 默认模型更新

**修改前**：
- thinkingModel: `gemini-2.5-pro`
- networkingModel: `gemini-2.5-flash`
- modaiThinkingModel: `gemini-2.0-flash-thinking-exp`
- modaiNetworkingModel: `gemini-2.0-flash-exp`

**修改后** (统一为 Gemini 2.5):
- modaiThinkingModel: `gemini-2.5-pro`
- modaiNetworkingModel: `gemini-2.5-flash`

### 提交记录

- `beb6c5c` - feat: Improve Docker support and update default models

---

## 2025-01-06 UI 美化与配置修正

### 需求背景

用户要求：
1. 统一背景色为 `#fafbff`
2. 完善开发文档
3. 修正 Mod AI Studio 的配置示例

### 实现细节

#### 背景色修改

将主背景色从纯白 (`#ffffff`) 改为淡蓝色 (`#fafbff`)：

```css
:root {
  --background: 228 100% 99%;  /* #fafbff */
}
```

HSL 转换：
- `#fafbff` = RGB(250, 251, 255)
- HSL = (228°, 100%, 99%)

**设计考虑**：
- 只修改主背景色，不影响卡片、弹窗等组件
- 保持视觉层次感
- 柔和的淡蓝色减轻视觉疲劳

#### Modai 配置修正

**问题发现**：
- Placeholder: `https://your-server.com/v1beta` ❌
- 文档示例也包含 `/v1beta`
- 导致用户填写后路径重复

**修正方案**：
- Placeholder: `http://your-newapi-server.com` ✅
- `.env.example`: 移除 `/v1beta`
- `DOCKER.md`: 更新示例地址

**URL 构建逻辑**：
```
用户配置: http://your-newapi-server.com
代码添加: /v1beta
最终URL: http://your-newapi-server.com/v1beta/models/...
```

#### 模型列表支持完善

**意外发现**: NewAPI 确实返回模型列表！

用户测试输出：
```json
{"models":[
  {"name":"gemini-2.5-pro",...},
  {"name":"gemini-2.5-flash-thinking",...},
  {"name":"ds-R1-Max",...},
  ...
]}
```

**实现改进**：
- 从返回空数组改为实际获取模型列表
- 支持多种模型前缀过滤：gemini, ds-, gpt-, models/
- 兼容 Google 官方和 NewAPI 两种格式

### 提交记录

- 本次提交包含所有 UI 和配置改进

---

## 技术栈总结

### 核心技术

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **状态管理**: Zustand (with persist middleware)
- **UI 组件**: Radix UI + Tailwind CSS
- **i18n**: react-i18next
- **AI SDK**: Vercel AI SDK (@ai-sdk/google, @ai-sdk/openai)
- **构建**: pnpm + standalone output

### 架构模式

1. **双模式架构**: 状态管理 + 条件渲染
2. **API 代理**: Edge functions for provider abstraction
3. **模块化**: 功能模块清晰分离
4. **类型安全**: 严格的 TypeScript 类型系统

### 开发规范

- 使用 ESLint 保证代码质量
- 遵循 React Hooks 最佳实践
- 组件化和可复用性优先
- 详细的代码注释和文档

---

## 未来计划

### 短期目标

- [ ] 添加更多生物数据库支持
- [ ] 优化基因研究结果展示
- [ ] 支持更多 AI Provider
- [ ] 性能优化和缓存策略

### 长期目标

- [ ] 多用户支持
- [ ] 研究历史和协作
- [ ] 自定义研究模板
- [ ] 高级数据可视化

---

*最后更新: 2025-01-06*
