# 🔄 仓库合并实施方案

## 项目背景

将两个功能侧重不同的仓库（deep-research 和 DeepGeneResearch）合并成一个支持模式切换的统一项目。

- **仓库 A (deep-research)**: 通用深度研究平台
- **仓库 B (DeepGeneResearch)**: 专业基因功能研究平台
- **目标**: 创建支持双模式切换的统一平台

---

## 📊 核心差异分析

### 功能对比表

| 特性类别 | 普通模式 (General Mode) | 专业模式 (Professional Mode) |
|---------|------------------------|------------------------------|
| **适用场景** | 通用主题研究、市场分析、技术调研 | 基因功能研究、蛋白质分析、分子生物学 |
| **研究对象** | 任意主题 | 基因、蛋白质、生物通路 |
| **数据来源** | 通用搜索引擎（Tavily, Searxng, Exa, Firecrawl） | 10+ 专业生物数据库 + 通用搜索 |
| **工作流程** | 4阶段通用流程 | 9阶段专业研究流程 |
| **输入方式** | 自由文本主题 | 基因符号 + 物种 + 研究焦点 |
| **输出格式** | 通用研究报告 | 专业基因功能报告 + 可视化图表 |

### 专业数据库集成（专业模式独有）

| 数据库 | 用途 | 数据量 | 质量评分 |
|--------|------|--------|---------|
| **PubMed** | 生物医学文献 | 35+ million citations | 0.10 |
| **UniProt** | 蛋白质序列与注释 | 200+ million proteins | 0.15 (最高) |
| **NCBI Gene** | 基因综合信息 | 全基因组数据 | 0.10 |
| **Ensembl** | 基因组注释 | 多物种基因组 | 0.10 |
| **GEO** | 基因表达数据 | 4+ million experiments | 0.07 |
| **PDB** | 蛋白质结构 | 200,000+ structures | 0.10 |
| **KEGG** | 代谢通路 | 500+ pathways | 0.08 |
| **Reactome** | 生物通路 | 2,500+ pathways | 0.09 |
| **STRING** | 蛋白质相互作用 | 24+ million interactions | 0.08 |
| **OMIM** | 基因-疾病关联 | 25,000+ associations | 0.12 |

### 技术架构差异

#### 专业模式新增模块（来自 DeepGeneResearch）

```
src/
├── types/
│   └── gene-research.ts                    # 328行专业类型定义
│       ├── GeneBasicInfo                   # 基因基本信息
│       ├── ProteinInfo                     # 蛋白质信息
│       ├── FunctionalData                  # 功能数据
│       ├── ExpressionData                  # 表达数据
│       ├── InteractionData                 # 相互作用数据
│       ├── DiseaseData                     # 疾病关联数据
│       ├── EvolutionaryData                # 进化数据
│       └── GeneResearchWorkflow            # 完整工作流
│
├── constants/
│   └── gene-research-prompts.ts            # 专业提示词模板
│       ├── 基因识别提示词
│       ├── 功能分析提示词
│       ├── 表达分析提示词
│       └── 疾病关联提示词
│
└── utils/gene-research/
    ├── api-integrations.ts                 # 19KB - 生物数据库API集成
    │   ├── UniProtAPI
    │   ├── NCBIGeneAPI
    │   ├── PubMedAPI
    │   ├── KEGGAPI
    │   └── 其他8个数据库API
    │
    ├── data-extractor.ts                   # 27KB - 数据提取与解析
    │   ├── extractGeneBasicInfo()
    │   ├── extractProteinInfo()
    │   ├── extractExpressionData()
    │   └── extractDiseaseAssociations()
    │
    ├── query-generator.ts                  # 19KB - 智能查询生成
    │   ├── generateGeneQueries()
    │   ├── generateProteinQueries()
    │   └── optimizeQueryStrategy()
    │
    ├── search-providers.ts                 # 22KB - 搜索提供商集成
    │   ├── searchPubMed()
    │   ├── searchUniProt()
    │   ├── searchNCBIGene()
    │   └── 其他数据库搜索
    │
    ├── literature-validator.ts             # 23KB - 文献验证
    │   ├── validateLiterature()
    │   ├── scoreRelevance()
    │   └── filterLowQuality()
    │
    ├── enhanced-quality-control.ts         # 12KB - 增强质量控制
    │   ├── crossValidateData()
    │   ├── calculateQualityScore()
    │   └── assessDataCompleteness()
    │
    ├── report-templates.ts                 # 28KB - 报告模板
    │   ├── geneReportTemplate
    │   ├── proteinReportTemplate
    │   └── diseaseReportTemplate
    │
    └── visualization-generators.ts         # 18KB - 可视化生成
        ├── generateProteinStructureDiagram()
        ├── generatePathwayMap()
        ├── generateInteractionNetwork()
        └── generateExpressionHeatmap()
```

---

## 🎯 实施方案：双模式架构

### 架构设计原则

1. **模式隔离**: 两种模式的核心逻辑互不干扰
2. **代码复用**: 共享基础设施（UI组件、状态管理、API调用）
3. **无缝切换**: 用户可随时在设置中切换模式
4. **渐进增强**: 保持现有功能，逐步添加专业功能

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户界面层                              │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │   普通模式 UI         │  │   专业模式 UI             │    │
│  │  - 自由文本输入       │  │  - 基因符号输入           │    │
│  │  - 通用研究设置       │  │  - 物种选择              │    │
│  │  - 基础可视化         │  │  - 研究焦点选择器         │    │
│  │                       │  │  - 生物数据库选择器       │    │
│  └──────────────────────┘  └──────────────────────────┘    │
│                    ▲                    ▲                    │
│                    └────────┬───────────┘                    │
│                            │                                 │
│                  ┌─────────▼──────────┐                     │
│                  │   模式切换控制器    │                     │
│                  │  - 检测当前模式     │                     │
│                  │  - 动态加载组件     │                     │
│                  │  - 路由分发         │                     │
│                  └─────────┬──────────┘                     │
└──────────────────────────┬─┬────────────────────────────────┘
                           │ │
┌──────────────────────────▼─▼────────────────────────────────┐
│                     业务逻辑层                                │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  通用研究引擎         │  │  专业研究引擎             │    │
│  │  - 通用工作流         │  │  - 9阶段专业流程          │    │
│  │  - 基础搜索           │  │  - 数据库集成             │    │
│  │  - 报告生成           │  │  - 质量控制               │    │
│  │                       │  │  - 文献验证               │    │
│  └──────────────────────┘  └──────────────────────────┘    │
│                    │                    │                    │
│                    └────────┬───────────┘                    │
└─────────────────────────────┬──────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                      共享服务层                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ AI Provider │ │ State Store │ │ API Router  │          │
│  │  - Gemini   │ │  - Global   │ │  - Proxy    │          │
│  │  - OpenAI   │ │  - History  │ │  - Cache    │          │
│  │  - Claude   │ │  - Settings │ │  - Retry    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└────────────────────────────────────────────────────────────┘
```

---

## 🚀 实施步骤详解

### 阶段 1: 准备工作（预计 30 分钟）

#### 步骤 1.1: 复制专业模块文件

**从 DeepGeneResearch 复制到 deep-research:**

```bash
# 1. 类型定义
cp /tmp/DeepGeneResearch/src/types/gene-research.ts \
   src/types/gene-research.ts

# 2. 常量和提示词
cp /tmp/DeepGeneResearch/src/constants/gene-research-prompts.ts \
   src/constants/gene-research-prompts.ts

# 3. 工具函数目录
cp -r /tmp/DeepGeneResearch/src/utils/gene-research \
      src/utils/gene-research
```

**文件清单:**
- ✅ `src/types/gene-research.ts` (专业类型定义)
- ✅ `src/constants/gene-research-prompts.ts` (专业提示词)
- ✅ `src/utils/gene-research/` (8个专业工具模块)

#### 步骤 1.2: 安装必要依赖（如有需要）

检查 DeepGeneResearch 的 package.json，确认是否有额外依赖。

---

### 阶段 2: 核心功能实现（预计 1 小时）

#### 步骤 2.1: 创建模式配置 Store

**文件**: `src/store/mode.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

      isGeneralMode: () => get().mode === 'general',

      isProfessionalMode: () => get().mode === 'professional',
    }),
    {
      name: 'research-mode-storage',
    }
  )
);
```

**功能说明:**
- ✅ 持久化存储用户选择的模式
- ✅ 提供模式切换方法
- ✅ 提供模式判断辅助方法

#### 步骤 2.2: 扩展类型定义

**文件**: `src/types.d.ts` (扩展现有类型)

```typescript
// 导入专业研究类型
import type {
  GeneResearchWorkflow,
  GeneSearchTask,
  GeneResearchQualityMetrics
} from './types/gene-research';

// 扩展现有的研究类型
export interface ResearchConfig {
  // 现有字段保持不变...

  // 新增：模式相关字段
  mode?: 'general' | 'professional';

  // 专业模式特有字段
  geneSymbol?: string;
  organism?: string;
  researchFocus?: ResearchFocus[];
  specificAspects?: string[];
  diseaseContext?: string;
  experimentalApproach?: string;
}

export type ResearchFocus =
  | 'general'
  | 'disease'
  | 'structure'
  | 'expression'
  | 'interactions'
  | 'evolution'
  | 'therapeutic';

// 扩展研究工作流
export interface ExtendedResearchWorkflow {
  // 通用模式数据
  generalData?: {
    topic: string;
    plan: string;
    tasks: Task[];
    report: string;
  };

  // 专业模式数据
  professionalData?: {
    workflow: GeneResearchWorkflow;
    qualityMetrics: GeneResearchQualityMetrics;
  };
}
```

#### 步骤 2.3: 创建模式适配器

**文件**: `src/utils/mode-adapter.ts`

```typescript
import type { ResearchMode } from '@/store/mode';
import type { ResearchConfig } from '@/types';

/**
 * 根据模式生成不同的提示词
 */
export function getPromptForMode(
  mode: ResearchMode,
  config: ResearchConfig
): string {
  if (mode === 'professional') {
    return generateProfessionalPrompt(config);
  }
  return generateGeneralPrompt(config);
}

/**
 * 生成专业模式提示词
 */
function generateProfessionalPrompt(config: ResearchConfig): string {
  const { geneSymbol, organism, researchFocus } = config;

  return `Conduct a comprehensive gene research for:
Gene: ${geneSymbol}
Organism: ${organism}
Research Focus: ${researchFocus?.join(', ')}

Please analyze across the following databases:
- PubMed (literature)
- UniProt (protein data)
- NCBI Gene (gene information)
- GEO (expression data)
- PDB (protein structures)
- KEGG (pathways)
- STRING (interactions)
- OMIM (disease associations)`;
}

/**
 * 生成通用模式提示词
 */
function generateGeneralPrompt(config: ResearchConfig): string {
  // 使用现有的通用提示词逻辑
  return `Research topic: ${config.query}`;
}

/**
 * 根据模式选择搜索提供商
 */
export function getSearchProvidersForMode(mode: ResearchMode): string[] {
  if (mode === 'professional') {
    return [
      'pubmed',
      'uniprot',
      'ncbi-gene',
      'geo',
      'pdb',
      'kegg',
      'string',
      'omim',
      'ensembl',
      'reactome'
    ];
  }
  return ['tavily', 'searxng', 'exa', 'firecrawl'];
}

/**
 * 根据模式生成搜索查询
 */
export function generateSearchQueriesForMode(
  mode: ResearchMode,
  config: ResearchConfig
): string[] {
  if (mode === 'professional') {
    // 使用专业模式的查询生成器
    const { generateGeneQueries } = require('./gene-research/query-generator');
    return generateGeneQueries(config);
  }

  // 通用模式的查询生成
  return [config.query || ''];
}
```

---

### 阶段 3: UI 适配（预计 45 分钟）

#### 步骤 3.1: 创建模式选择器组件

**文件**: `src/components/ModeSelector.tsx`

```typescript
'use client';

import { useModeStore } from '@/store/mode';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export function ModeSelector() {
  const { t } = useTranslation();
  const { mode, setMode } = useModeStore();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">
        {t('setting.researchMode')}:
      </label>
      <Select value={mode} onValueChange={setMode}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="general">
            🔍 {t('mode.general')}
          </SelectItem>
          <SelectItem value="professional">
            🧬 {t('mode.professional')}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

#### 步骤 3.2: 创建专业模式输入组件

**文件**: `src/components/Professional/GeneInput.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const geneResearchSchema = z.object({
  geneSymbol: z.string().min(1, 'Gene symbol is required'),
  organism: z.string().min(1, 'Organism is required'),
  researchFocus: z.array(z.string()).min(1, 'Select at least one focus'),
  diseaseContext: z.string().optional(),
});

type GeneResearchForm = z.infer<typeof geneResearchSchema>;

const researchFocusOptions = [
  { id: 'general', label: 'General Function' },
  { id: 'disease', label: 'Disease Association' },
  { id: 'structure', label: 'Protein Structure' },
  { id: 'expression', label: 'Expression Analysis' },
  { id: 'interactions', label: 'Protein Interactions' },
  { id: 'evolution', label: 'Evolutionary Analysis' },
  { id: 'therapeutic', label: 'Therapeutic Potential' },
];

interface GeneInputProps {
  onSubmit: (data: GeneResearchForm) => void;
  isLoading?: boolean;
}

export function GeneInput({ onSubmit, isLoading }: GeneInputProps) {
  const form = useForm<GeneResearchForm>({
    resolver: zodResolver(geneResearchSchema),
    defaultValues: {
      geneSymbol: '',
      organism: 'Homo sapiens',
      researchFocus: ['general'],
      diseaseContext: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Gene Symbol */}
        <FormField
          control={form.control}
          name="geneSymbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gene Symbol</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., TP53, BRCA1, lysC"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the standard gene symbol or name
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Organism */}
        <FormField
          control={form.control}
          name="organism"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organism</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Homo sapiens, E. coli"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Research Focus */}
        <FormField
          control={form.control}
          name="researchFocus"
          render={() => (
            <FormItem>
              <FormLabel>Research Focus</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                {researchFocusOptions.map((option) => (
                  <FormField
                    key={option.id}
                    control={form.control}
                    name="researchFocus"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(option.id)}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...(field.value || []), option.id]
                                : field.value?.filter((v) => v !== option.id);
                              field.onChange(newValue);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 font-normal">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </FormItem>
          )}
        />

        {/* Disease Context (Optional) */}
        <FormField
          control={form.control}
          name="diseaseContext"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disease Context (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., breast cancer, Alzheimer's disease"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Researching...' : '🧬 Start Gene Research'}
        </Button>
      </form>
    </Form>
  );
}
```

#### 步骤 3.3: 修改主页面支持模式切换

**文件**: `src/app/page.tsx` (修改)

```typescript
'use client';

import { useModeStore } from '@/store/mode';
import { GeneInput } from '@/components/Professional/GeneInput';
import { SearchArea } from '@/components/Internal/SearchArea';

export default function HomePage() {
  const { mode } = useModeStore();

  return (
    <div className="container mx-auto p-4">
      {/* 根据模式显示不同的输入界面 */}
      {mode === 'professional' ? (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            🧬 Professional Gene Research
          </h1>
          <GeneInput
            onSubmit={handleGeneResearch}
            isLoading={isResearching}
          />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            🔍 Deep Research
          </h1>
          <SearchArea
            onSubmit={handleGeneralResearch}
            isLoading={isResearching}
          />
        </div>
      )}

      {/* 研究结果展示区域 */}
      <ResearchResults />
    </div>
  );
}

function handleGeneResearch(data: any) {
  // 调用专业模式研究逻辑
  console.log('Gene research:', data);
}

function handleGeneralResearch(query: string) {
  // 调用通用模式研究逻辑
  console.log('General research:', query);
}
```

#### 步骤 3.4: 更新设置面板

**文件**: `src/components/Setting.tsx` (在现有基础上添加)

```typescript
import { ModeSelector } from '@/components/ModeSelector';

// 在设置面板中添加模式选择器
export function Setting() {
  return (
    <div className="settings-panel">
      {/* 现有设置项... */}

      {/* 新增：研究模式选择 */}
      <div className="setting-section">
        <h3 className="text-lg font-semibold mb-3">Research Mode</h3>
        <ModeSelector />
        <p className="text-sm text-muted-foreground mt-2">
          Choose between general research or specialized gene research mode
        </p>
      </div>

      {/* 其他设置项... */}
    </div>
  );
}
```

---

### 阶段 4: 工作流集成（预计 30 分钟）

#### 步骤 4.1: 创建专业模式研究 Hook

**文件**: `src/hooks/useProfessionalResearch.ts`

```typescript
import { useState } from 'react';
import type { GeneResearchWorkflow } from '@/types/gene-research';
import { generateGeneQueries } from '@/utils/gene-research/query-generator';
import { searchMultipleDatabases } from '@/utils/gene-research/search-providers';
import { extractGeneData } from '@/utils/gene-research/data-extractor';
import { validateQuality } from '@/utils/gene-research/enhanced-quality-control';

export function useProfessionalResearch() {
  const [isResearching, setIsResearching] = useState(false);
  const [workflow, setWorkflow] = useState<GeneResearchWorkflow | null>(null);
  const [progress, setProgress] = useState(0);

  async function startGeneResearch(config: {
    geneSymbol: string;
    organism: string;
    researchFocus: string[];
    diseaseContext?: string;
  }) {
    setIsResearching(true);
    setProgress(0);

    try {
      // Phase 1: Generate search queries (10%)
      setProgress(10);
      const queries = generateGeneQueries(config);

      // Phase 2: Search multiple databases (40%)
      setProgress(20);
      const searchResults = await searchMultipleDatabases(queries);
      setProgress(40);

      // Phase 3: Extract and structure data (60%)
      const extractedData = extractGeneData(searchResults);
      setProgress(60);

      // Phase 4: Quality validation (80%)
      const qualityMetrics = validateQuality(extractedData);
      setProgress(80);

      // Phase 5: Generate final workflow (100%)
      const finalWorkflow: GeneResearchWorkflow = {
        geneIdentification: extractedData.geneBasicInfo,
        functionalAnalysis: extractedData.functionalData,
        proteinInfo: extractedData.proteinInfo,
        expressionAnalysis: extractedData.expressionData,
        regulatoryAnalysis: extractedData.expressionData.regulation,
        interactionAnalysis: extractedData.interactionData,
        diseaseAnalysis: extractedData.diseaseData,
        evolutionaryAnalysis: extractedData.evolutionaryData,
        literatureReview: extractedData.literatureReferences,
      };

      setWorkflow(finalWorkflow);
      setProgress(100);

      return finalWorkflow;
    } catch (error) {
      console.error('Gene research failed:', error);
      throw error;
    } finally {
      setIsResearching(false);
    }
  }

  return {
    isResearching,
    workflow,
    progress,
    startGeneResearch,
  };
}
```

#### 步骤 4.2: 扩展现有研究 Hook

**文件**: `src/hooks/useDeepResearch.ts` (修改)

```typescript
import { useModeStore } from '@/store/mode';
import { useProfessionalResearch } from './useProfessionalResearch';

export function useDeepResearch() {
  const { mode } = useModeStore();
  const professionalResearch = useProfessionalResearch();

  // 现有的通用研究逻辑...

  /**
   * 统一的研究入口，根据模式调用不同逻辑
   */
  async function startResearch(config: any) {
    if (mode === 'professional') {
      return professionalResearch.startGeneResearch(config);
    }

    // 调用现有的通用研究逻辑
    return startGeneralResearch(config);
  }

  return {
    startResearch,
    isResearching: mode === 'professional'
      ? professionalResearch.isResearching
      : isGeneralResearching,
    progress: mode === 'professional'
      ? professionalResearch.progress
      : generalProgress,
  };
}
```

---

### 阶段 5: 国际化支持（预计 15 分钟）

#### 更新语言文件

**文件**: `src/locales/zh-CN.json`

```json
{
  "mode": {
    "general": "普通模式",
    "professional": "专业模式（基因研究）",
    "switchTo": "切换到 {{mode}}"
  },
  "geneResearch": {
    "title": "基因研究",
    "geneSymbol": "基因符号",
    "organism": "物种",
    "researchFocus": "研究焦点",
    "diseaseContext": "疾病背景",
    "startResearch": "开始基因研究",
    "focus": {
      "general": "常规功能",
      "disease": "疾病关联",
      "structure": "蛋白质结构",
      "expression": "表达分析",
      "interactions": "蛋白质相互作用",
      "evolution": "进化分析",
      "therapeutic": "治疗潜力"
    }
  },
  "database": {
    "pubmed": "PubMed（文献）",
    "uniprot": "UniProt（蛋白质）",
    "ncbiGene": "NCBI Gene（基因）",
    "geo": "GEO（表达数据）",
    "pdb": "PDB（结构）",
    "kegg": "KEGG（通路）",
    "string": "STRING（相互作用）",
    "omim": "OMIM（疾病）"
  }
}
```

**文件**: `src/locales/en-US.json`

```json
{
  "mode": {
    "general": "General Mode",
    "professional": "Professional Mode (Gene Research)",
    "switchTo": "Switch to {{mode}}"
  },
  "geneResearch": {
    "title": "Gene Research",
    "geneSymbol": "Gene Symbol",
    "organism": "Organism",
    "researchFocus": "Research Focus",
    "diseaseContext": "Disease Context",
    "startResearch": "Start Gene Research",
    "focus": {
      "general": "General Function",
      "disease": "Disease Association",
      "structure": "Protein Structure",
      "expression": "Expression Analysis",
      "interactions": "Protein Interactions",
      "evolution": "Evolutionary Analysis",
      "therapeutic": "Therapeutic Potential"
    }
  }
}
```

---

### 阶段 6: 测试与优化（预计 30 分钟）

#### 步骤 6.1: 功能测试清单

**普通模式测试:**
- [ ] 输入通用主题进行研究
- [ ] 验证搜索引擎正常工作（Tavily, Searxng等）
- [ ] 检查报告生成
- [ ] 验证历史记录保存

**专业模式测试:**
- [ ] 输入基因符号（如 TP53）
- [ ] 选择物种（如 Homo sapiens）
- [ ] 选择研究焦点
- [ ] 验证生物数据库搜索
- [ ] 检查专业报告格式
- [ ] 验证可视化图表生成

**模式切换测试:**
- [ ] 从设置切换模式
- [ ] 验证界面即时更新
- [ ] 检查模式持久化（刷新页面后保持）
- [ ] 验证不同模式的历史记录隔离

#### 步骤 6.2: 性能优化

1. **延迟加载专业模块**
   ```typescript
   // 只在专业模式下加载
   const { generateGeneQueries } = await import('@/utils/gene-research/query-generator');
   ```

2. **缓存数据库查询结果**
   ```typescript
   // 使用 React Query 或 SWR 缓存
   const { data } = useQuery(['gene', geneSymbol], fetchGeneData);
   ```

---

## 📁 文件变更总结

### 新增文件（17个）

**类型定义 (1个):**
- `src/types/gene-research.ts`

**常量 (1个):**
- `src/constants/gene-research-prompts.ts`

**工具函数 (8个):**
- `src/utils/gene-research/api-integrations.ts`
- `src/utils/gene-research/data-extractor.ts`
- `src/utils/gene-research/query-generator.ts`
- `src/utils/gene-research/search-providers.ts`
- `src/utils/gene-research/literature-validator.ts`
- `src/utils/gene-research/enhanced-quality-control.ts`
- `src/utils/gene-research/report-templates.ts`
- `src/utils/gene-research/visualization-generators.ts`

**状态管理 (1个):**
- `src/store/mode.ts`

**组件 (3个):**
- `src/components/ModeSelector.tsx`
- `src/components/Professional/GeneInput.tsx`
- `src/components/Professional/GeneResults.tsx`

**Hooks (2个):**
- `src/hooks/useProfessionalResearch.ts`
- `src/utils/mode-adapter.ts`

**文档 (1个):**
- `MERGE_PLAN.md` (本文档)

### 修改文件（6个）

- `src/types.d.ts` - 扩展类型定义
- `src/app/page.tsx` - 添加模式切换逻辑
- `src/components/Setting.tsx` - 添加模式选择器
- `src/hooks/useDeepResearch.ts` - 集成专业研究
- `src/locales/zh-CN.json` - 添加翻译
- `src/locales/en-US.json` - 添加翻译

---

## 🎨 用户体验设计

### 模式切换流程

```
用户首次访问
    ↓
展示欢迎页面
    ↓
选择研究模式
    ├─→ 普通模式: 显示通用输入界面
    └─→ 专业模式: 显示基因输入界面

切换模式
    ↓
弹出确认对话框（如有未保存工作）
    ↓
清空当前输入
    ↓
加载新模式界面
    ↓
显示模式切换成功提示
```

### 界面对比

**普通模式界面:**
```
┌─────────────────────────────────────┐
│  🔍 Deep Research                   │
├─────────────────────────────────────┤
│  Enter your research topic:         │
│  ┌───────────────────────────────┐ │
│  │ [Text Input]                  │ │
│  └───────────────────────────────┘ │
│                                     │
│  [📁 Upload Files] [⚙️ Settings]   │
│                                     │
│  [🚀 Start Research]               │
└─────────────────────────────────────┘
```

**专业模式界面:**
```
┌─────────────────────────────────────┐
│  🧬 Professional Gene Research      │
├─────────────────────────────────────┤
│  Gene Symbol:                       │
│  ┌───────────────────────────────┐ │
│  │ e.g., TP53, BRCA1             │ │
│  └───────────────────────────────┘ │
│                                     │
│  Organism:                          │
│  ┌───────────────────────────────┐ │
│  │ Homo sapiens ▼                │ │
│  └───────────────────────────────┘ │
│                                     │
│  Research Focus:                    │
│  ☑ General  ☑ Disease  ☐ Structure │
│  ☐ Expression  ☐ Interactions       │
│                                     │
│  [🧬 Start Gene Research]          │
└─────────────────────────────────────┘
```

---

## 🔧 技术实现细节

### 1. 模式检测中间件

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const mode = request.cookies.get('research-mode')?.value || 'general';

  // 根据模式添加响应头
  const response = NextResponse.next();
  response.headers.set('X-Research-Mode', mode);

  return response;
}
```

### 2. API 路由适配

```typescript
// src/app/api/research/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { mode, ...config } = await request.json();

  if (mode === 'professional') {
    // 调用专业研究API
    return handleProfessionalResearch(config);
  }

  // 调用通用研究API
  return handleGeneralResearch(config);
}
```

### 3. 数据库查询优化

```typescript
// 批量并行查询
async function searchMultipleDatabases(queries: string[]) {
  const databases = [
    'pubmed',
    'uniprot',
    'ncbi-gene',
    'geo',
    'pdb',
    'kegg',
    'string',
    'omim'
  ];

  // 并行查询，提高效率
  const results = await Promise.allSettled(
    databases.map(db => searchDatabase(db, queries))
  );

  // 过滤失败的查询
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}
```

---

## 📊 预期效果

### 功能对比

| 功能 | 合并前（仓库A） | 合并前（仓库B） | 合并后（项目C） |
|------|---------------|---------------|----------------|
| 通用研究 | ✅ | ❌ | ✅ |
| 基因研究 | ❌ | ✅ | ✅ |
| 模式切换 | ❌ | ❌ | ✅ |
| 数据库数量 | 4个 | 10个 | 14个 |
| 可视化类型 | 1种 | 4种 | 5种 |
| 用户群体 | 通用用户 | 生物研究者 | 所有用户 |

### 性能指标

**代码复用率:** 约 85%
- 共享 UI 组件、状态管理、API 基础设施
- 仅研究引擎核心逻辑独立

**首次加载时间:**
- 普通模式: 无变化（约 2s）
- 专业模式: +500ms（延迟加载专业模块）

**构建体积:**
- 增加约 150KB (gzip后约 40KB)
- 通过代码分割优化，仅按需加载

---

## ✅ 验收标准

### 功能验收

- [x] **普通模式**
  - [ ] 可以输入任意主题进行研究
  - [ ] 搜索结果来自通用搜索引擎
  - [ ] 生成通用研究报告
  - [ ] 保存研究历史

- [x] **专业模式**
  - [ ] 可以输入基因符号和物种
  - [ ] 可以选择研究焦点
  - [ ] 搜索10+生物数据库
  - [ ] 生成专业基因报告
  - [ ] 显示质量评分
  - [ ] 生成可视化图表

- [x] **模式切换**
  - [ ] 可以在设置中切换模式
  - [ ] 切换后界面立即更新
  - [ ] 模式选择持久化保存
  - [ ] 不同模式的历史记录分开存储

### 技术验收

- [ ] TypeScript 无错误
- [ ] 所有组件正确渲染
- [ ] API 路由正常工作
- [ ] 国际化完整支持
- [ ] 无性能回归
- [ ] 代码通过 ESLint 检查

### 用户体验验收

- [ ] 界面切换流畅（<100ms）
- [ ] 模式切换无闪烁
- [ ] 提示信息清晰
- [ ] 错误处理完善
- [ ] 移动端适配良好

---

## 🚀 部署计划

### 1. 开发环境测试

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 测试普通模式
# 测试专业模式
# 测试模式切换
```

### 2. 构建生产版本

```bash
# 构建
pnpm build

# 本地预览
pnpm start
```

### 3. 部署到 Vercel

```bash
# 推送到 GitHub
git add .
git commit -m "feat: Implement dual-mode architecture with gene research support"
git push -u origin claude/merge-repos-mode-switch-011CUqkcSvb2ffBrVsyMHXpB

# Vercel 自动部署
```

---

## 📝 后续优化建议

### 短期优化（1-2周）

1. **性能优化**
   - 实现专业模块的懒加载
   - 添加数据库查询缓存
   - 优化大型数据集渲染

2. **用户体验**
   - 添加模式切换引导动画
   - 提供模式选择推荐
   - 优化移动端体验

3. **功能增强**
   - 添加更多研究焦点选项
   - 支持批量基因研究
   - 导出专业报告为PDF

### 中期规划（1-3月）

1. **AI 优化**
   - 针对基因研究优化 AI 提示词
   - 添加领域特定的验证逻辑
   - 实现更智能的查询生成

2. **数据库扩展**
   - 集成更多生物数据库
   - 添加实时数据更新
   - 支持自定义数据源

3. **协作功能**
   - 支持团队共享研究
   - 添加评论和注释功能
   - 实现研究模板

### 长期愿景（3-6月）

1. **多模式扩展**
   - 添加更多专业模式（如材料科学、金融分析）
   - 支持自定义模式创建
   - 构建模式市场

2. **企业功能**
   - 团队权限管理
   - 私有数据库集成
   - 审计日志
   - SLA 保障

---

## 🎯 成功指标

### 技术指标

- ✅ 代码覆盖率 > 80%
- ✅ 构建体积增长 < 20%
- ✅ 首屏加载时间 < 3s
- ✅ API 响应时间 < 2s
- ✅ TypeScript 严格模式通过

### 业务指标

- ✅ 用户满意度 > 4.5/5
- ✅ 专业模式使用率 > 20%
- ✅ 模式切换转化率 > 30%
- ✅ 研究完成率 > 80%
- ✅ 报告分享率 > 40%

---

## 📚 参考资料

### 生物数据库文档

- [PubMed API](https://www.ncbi.nlm.nih.gov/home/develop/api/)
- [UniProt API](https://www.uniprot.org/help/api)
- [NCBI Gene](https://www.ncbi.nlm.nih.gov/gene/)
- [GEO Datasets](https://www.ncbi.nlm.nih.gov/geo/)
- [PDB API](https://www.rcsb.org/docs/programmatic-access)
- [KEGG API](https://www.kegg.jp/kegg/rest/keggapi.html)
- [STRING API](https://string-db.org/help/api/)
- [OMIM API](https://www.omim.org/help/api)

### 技术文档

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Zustand State Management](https://docs.pmnd.rs/zustand)
- [React Hook Form](https://react-hook-form.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

## 👥 团队协作

### 角色分工

- **前端开发**: UI组件、模式切换逻辑
- **后端开发**: 数据库集成、API优化
- **AI工程师**: 提示词优化、质量控制
- **测试工程师**: 功能测试、性能测试
- **产品经理**: 需求验证、用户反馈

### 沟通渠道

- 每日站会: 同步进度
- 代码审查: Pull Request
- 问题跟踪: GitHub Issues
- 文档更新: 本文档

---

## 📞 支持与反馈

如有问题或建议，请通过以下方式联系:

- **GitHub Issues**: 报告 bug 或功能请求
- **Discussions**: 技术讨论和经验分享
- **Email**: 紧急问题联系

---

**文档版本**: v1.0
**最后更新**: 2025-11-06
**维护者**: Claude Code Assistant
**状态**: ✅ 准备就绪，等待执行

---

*本文档将随着实施进展持续更新。*
