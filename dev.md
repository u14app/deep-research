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

## 2025-11-07 DeepGeneResearch功能完善与缺失功能修复

### 问题发现

在用户测试时发现，尽管已经合并了 DeepGeneResearch 仓库的代码，但很多关键功能并未真正集成到主应用中：

#### 1. UI 字段缺失

原始的 DeepGeneResearch 界面包含 7 个配置字段，但初始整合只实现了 4 个：

**已实现**（初始版本）：
- ✅ Gene Symbol（基因符号） - 必填
- ✅ Organism（物种） - 文本输入，初版
- ✅ Research Focus（研究焦点） - 7个多选项
- ✅ Disease Context（疾病背景） - 可选

**缺失字段**（发现后补充）：
- ❌ Specific Aspects（特定研究方面） - 8个多选项
- ❌ Experimental Approach（实验方法） - 可选文本
- ❌ Research Question（研究问题） - 可选大文本框

#### 2. 后端处理缺失

检查 `src/components/Research/Topic.tsx` 中的 `handleGeneResearchSubmit` 函数，发现只是简单拼接字符串：

```typescript
// 原始实现 - 只使用了部分字段
const geneQuery = `Gene: ${data.geneSymbol}, Organism: ${data.organism}, Focus: ${data.researchFocus.join(', ')}${data.diseaseContext ? `, Disease: ${data.diseaseContext}` : ''}`;
setQuestion(geneQuery);
await askQuestions();
```

问题：
- 没有使用 `specificAspects`、`experimentalApproach`、`researchQuestion` 字段
- 没有调用任何 gene-research 专业模块
- 没有使用基因研究专用提示词

#### 3. 专业功能未集成

发现以下高价值模块存在但未使用：

**存在的专业模块**（`src/utils/gene-research/`）：
```
- api-integrations.ts (19KB) - 10+ 生物数据库 API 集成
- data-extractor.ts (27KB) - 基因数据提取和处理
- query-generator.ts (19KB) - 智能查询生成
- search-providers.ts (22KB) - 专业搜索提供商
- literature-validator.ts (23KB) - 文献验证和质量控制
- enhanced-quality-control.ts (12KB) - 增强质量控制
- report-templates.ts (28KB) - 专业报告模板
- visualization-generators.ts (18KB) - 数据可视化生成
- index.ts - GeneResearchEngine 完整引擎
```

**专业提示词**（`src/constants/gene-research-prompts.ts`）：
```typescript
- geneResearchSystemInstruction - 专业基因研究系统指令
- geneResearchQuestionPrompt - 基因研究问题生成提示词
- geneReportPlanPrompt - 基因研究计划提示词
- geneSerpQueriesPrompt - 基因研究 SERP 查询提示词
```

这些模块都没有被主应用调用！

### 修复措施

#### 阶段 1：UI 字段补全

**1. 添加 Organism 下拉选择器** (Commit: `179fbeb`)

```typescript
// 替换纯文本输入为下拉选择
const organismOptions = [
  { value: 'Homo sapiens', label: 'Homo sapiens (Human)' },
  { value: 'Mus musculus', label: 'Mus musculus (Mouse)' },
  { value: 'Rattus norvegicus', label: 'Rattus norvegicus (Rat)' },
  { value: 'Danio rerio', label: 'Danio rerio (Zebrafish)' },
  { value: 'Drosophila melanogaster', label: 'Drosophila melanogaster (Fruit fly)' },
  { value: 'Caenorhabditis elegans', label: 'Caenorhabditis elegans (C. elegans)' },
  { value: 'Saccharomyces cerevisiae', label: 'Saccharomyces cerevisiae (Yeast)' },
  { value: 'Escherichia coli', label: 'Escherichia coli (E. coli)' },
  { value: 'Arabidopsis thaliana', label: 'Arabidopsis thaliana (Thale cress)' },
];
```

**2. 添加 i18n 翻译** (Commit: `dafa569`)

为 Organism 下拉选择器添加 4 种语言的翻译：
- en-US, zh-CN, es-ES, vi-VN
- 补全了 es-ES 和 vi-VN 中缺失的 mode 和 geneResearch 部分

**3. 添加三个缺失字段** (Commit: `b5445de`)

```typescript
// 更新 schema 以支持所有字段
const geneResearchSchema = z.object({
  geneSymbol: z.string().min(1, 'Gene symbol is required'),
  organism: z.string().min(1, 'Organism is required'),
  researchFocus: z.array(z.string()).min(1, 'Select at least one focus'),
  specificAspects: z.array(z.string()).optional(),  // 新增
  diseaseContext: z.string().optional(),
  experimentalApproach: z.string().optional(),      // 新增
  researchQuestion: z.string().optional(),          // 新增
});

// Specific Aspects 选项
const specificAspectsOptions = [
  { id: 'mutations', label: 'Mutations' },
  { id: 'protein_interactions', label: 'Protein Interactions' },
  { id: 'biological_pathways', label: 'Biological Pathways' },
  { id: 'evolution', label: 'Evolution' },
  { id: 'gene_regulation', label: 'Gene Regulation' },
  { id: 'expression_patterns', label: 'Expression Patterns' },
  { id: 'protein_structure', label: 'Protein Structure' },
  { id: 'molecular_function', label: 'Molecular Function' },
];
```

添加完整的多语言支持（en-US, zh-CN, es-ES, vi-VN）：
```json
{
  "geneResearch": {
    "specificAspects": "特定研究方面",
    "specificAspectsDesc": "选择您想要关注的特定方面",
    "experimentalApproach": "实验方法",
    "experimentalApproachDesc": "指定实验方法（如适用）",
    "researchQuestion": "研究问题",
    "researchQuestionPlaceholder": "基因 {geneSymbol} 在 {organism} 中的功能、结构和生物学作用是什么？",
    "researchQuestionDesc": "定义您的具体研究问题。使用 {geneSymbol} 和 {organism} 作为占位符。",
    "aspects": {
      "mutations": "突变",
      "protein_interactions": "蛋白质相互作用",
      // ... 8 个方面
    }
  }
}
```

#### 阶段 2：后端集成修复

**1. 更新 handleGeneResearchSubmit** (Commit: 待提交)

```typescript
async function handleGeneResearchSubmit(data: any) {
  if (handleCheck()) {
    const { id, setQuestion } = useTaskStore.getState();
    try {
      setIsThinking(true);
      accurateTimerStart();
      if (id !== "") {
        createNewResearch();
      }

      // 构建完整的基因研究查询，包含所有字段
      let geneQuery = `Gene: ${data.geneSymbol}, Organism: ${data.organism}, Focus: ${data.researchFocus.join(', ')}`;

      // 添加可选字段
      if (data.specificAspects && data.specificAspects.length > 0) {
        geneQuery += `, Specific Aspects: ${data.specificAspects.join(', ')}`;
      }
      if (data.diseaseContext) {
        geneQuery += `, Disease: ${data.diseaseContext}`;
      }
      if (data.experimentalApproach) {
        geneQuery += `, Experimental Approach: ${data.experimentalApproach}`;
      }
      if (data.researchQuestion) {
        // 替换占位符 {geneSymbol} 和 {organism}
        const customQuestion = data.researchQuestion
          .replace(/\{geneSymbol\}/g, data.geneSymbol)
          .replace(/\{organism\}/g, data.organism);
        geneQuery += `\n\nResearch Question: ${customQuestion}`;
      }

      setQuestion(geneQuery);
      await askQuestions();
    } finally {
      setIsThinking(false);
      accurateTimerStop();
    }
  }
}
```

**2. 更新 mode-adapter.ts** (Commit: 待提交)

```typescript
export interface ResearchConfig {
  query?: string;
  mode?: ResearchMode;

  // 专业模式特有字段 - 添加 researchQuestion
  geneSymbol?: string;
  organism?: string;
  researchFocus?: ResearchFocus[];
  specificAspects?: string[];
  diseaseContext?: string;
  experimentalApproach?: string;
  researchQuestion?: string;  // 新增

  // 通用配置
  language?: string;
  maxResult?: number;
  enableCitationImage?: boolean;
  enableReferences?: boolean;
}

// 更新专业模式提示词生成函数
function generateProfessionalPrompt(config: ResearchConfig): string {
  const {
    geneSymbol,
    organism,
    researchFocus,
    specificAspects,    // 使用
    diseaseContext,
    experimentalApproach,  // 使用
    researchQuestion    // 使用
  } = config;

  let prompt = `Conduct a comprehensive gene research for:
Gene: ${geneSymbol}
Organism: ${organism}
Research Focus: ${researchFocus?.join(', ')}`;

  // 添加特定研究方面
  if (specificAspects && specificAspects.length > 0) {
    prompt += `\nSpecific Aspects: ${specificAspects.join(', ')}`;
  }

  // 添加疾病背景
  if (diseaseContext) {
    prompt += `\nDisease Context: ${diseaseContext}`;
  }

  // 添加实验方法
  if (experimentalApproach) {
    prompt += `\nExperimental Approach: ${experimentalApproach}`;
  }

  // 添加自定义研究问题（支持占位符替换）
  if (researchQuestion) {
    const customQuestion = researchQuestion
      .replace(/\{geneSymbol\}/g, geneSymbol || '')
      .replace(/\{organism\}/g, organism || '');
    prompt += `\n\nResearch Question: ${customQuestion}`;
  }

  prompt += `\n\nPlease analyze across the following databases:
- PubMed (literature)
- UniProt (protein data)
- NCBI Gene (gene information)
- GEO (expression data)
- PDB (protein structures)
- KEGG (pathways)
- STRING (interactions)
- OMIM (disease associations)`;

  return prompt;
}
```

### 技术要点

#### 占位符替换

Research Question 字段支持两个占位符：
- `{geneSymbol}` - 自动替换为输入的基因符号
- `{organism}` - 自动替换为选择的物种

示例：
```
输入: "What is the function, structure, and biological role of the gene {geneSymbol} in {organism}?"
基因: TP53
物种: Homo sapiens
输出: "What is the function, structure, and biological role of the gene TP53 in Homo sapiens?"
```

#### 状态管理

```typescript
// GeneInput 组件
const [selectedFocus, setSelectedFocus] = useState<string[]>(['general']);
const [selectedAspects, setSelectedAspects] = useState<string[]>([]);

const toggleAspect = (aspectId: string) => {
  const newAspects = selectedAspects.includes(aspectId)
    ? selectedAspects.filter(id => id !== aspectId)
    : [...selectedAspects, aspectId];

  setSelectedAspects(newAspects);
  form.setValue('specificAspects', newAspects);
};
```

### 仍待集成的功能

虽然修复了 UI 和基本数据流，但以下高价值功能仍未集成：

#### 1. GeneResearchEngine

完整的基因研究引擎 (`src/utils/gene-research/index.ts`) 包含：
- 7 阶段研究工作流
- API 集成（PubMed, UniProt, NCBI Gene, 等）
- 数据提取和处理
- 质量控制
- 可视化生成
- 报告生成

**当前状态**: 代码存在但未被调用

**集成建议**:
- 在 useDeepResearch hook 中添加模式检测
- 当 mode === 'professional' 时，使用 GeneResearchEngine
- 替代当前的通用研究流程

#### 2. 基因研究专用提示词

`src/constants/gene-research-prompts.ts` 包含针对分子生物学优化的提示词：
- 专业系统指令（强调分子机制、定量数据、实验证据）
- 基因研究问题生成
- 研究计划生成
- SERP 查询生成（针对生物数据库）

**当前状态**: 代码存在但未被使用

**集成建议**:
- 修改 `src/hooks/useDeepResearch.ts` 中的提示词选择逻辑
- 根据 mode 选择不同的提示词集合

#### 3. 专业搜索提供商

`src/utils/gene-research/search-providers.ts` 实现了 10+ 专业数据库的搜索：
- PubMed, UniProt, NCBI Gene, GEO, PDB
- KEGG, STRING, OMIM, Ensembl, Reactome

**当前状态**: 代码存在但未被使用

**集成建议**:
- 在专业模式下，使用这些专业搜索提供商
- 替代通用的 tavily/searxng/exa 搜索

### 提交记录

```bash
179fbeb feat: Add organism dropdown selector with preset options
dafa569 i18n: Add translations for organism dropdown selector
b5445de feat: Add complete gene research configuration fields
[待提交] fix: Update gene research submit handler to use all fields
[待提交] feat: Update mode-adapter to support research question field
```

### 测试验证

✅ 所有字段正确显示在 UI
✅ 表单验证正常工作
✅ 多语言支持完整（en-US, zh-CN, es-ES, vi-VN）
✅ 数据正确传递到后端处理函数
✅ 占位符替换功能正常
✅ 构建成功，无错误和警告

### 经验教训

1. **代码存在 ≠ 功能集成**: 需要系统检查所有模块是否真正被使用
2. **UI + 后端 + 数据流**: 三者必须完整连接才能形成功能
3. **分阶段验证**: 每个阶段都要测试构建和运行时行为
4. **文档同步**: 代码更新后及时更新开发文档

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
