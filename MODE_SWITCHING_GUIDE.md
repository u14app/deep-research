# 🔄 双模式功能使用指南

## 概述

本项目现已支持两种研究模式：
- 🔍 **普通模式**: 适用于任意主题的深度研究
- 🧬 **专业模式**: 专注于基因功能研究

## 快速开始

### 1. 模式切换

在应用中可以通过以下方式切换模式：

```typescript
import { useModeStore } from '@/store/mode';

function YourComponent() {
  const { mode, setMode } = useModeStore();

  // 切换到专业模式
  setMode('professional');

  // 切换到普通模式
  setMode('general');

  // 检查当前模式
  if (mode === 'professional') {
    // 显示基因研究界面
  }
}
```

### 2. 使用模式选择器组件

```typescript
import { ModeSelector } from '@/components/ModeSelector';

function Settings() {
  return (
    <div>
      <h3>研究模式</h3>
      <ModeSelector />
    </div>
  );
}
```

### 3. 使用专业模式输入组件

```typescript
import { GeneInput } from '@/components/Professional/GeneInput';

function ProfessionalResearch() {
  const handleSubmit = (data) => {
    console.log('Gene research data:', data);
    // 处理基因研究请求
  };

  return (
    <GeneInput
      onSubmit={handleSubmit}
      isLoading={false}
    />
  );
}
```

## 核心功能

### 普通模式功能

- 任意主题研究
- 通用搜索引擎（Tavily, Searxng, Exa等）
- 标准研究报告生成
- 知识库管理

### 专业模式功能

- 基因符号输入
- 物种选择
- 研究焦点选择（7种焦点）
- 10+生物数据库集成：
  - PubMed（文献）
  - UniProt（蛋白质）
  - NCBI Gene（基因）
  - GEO（表达数据）
  - PDB（结构）
  - KEGG（通路）
  - STRING（相互作用）
  - OMIM（疾病）
  - Ensembl
  - Reactome

## 技术架构

### 新增文件

```
src/
├── types/
│   └── gene-research.ts          # 专业类型定义
├── constants/
│   └── gene-research-prompts.ts  # 专业提示词
├── store/
│   └── mode.ts                   # 模式状态管理
├── utils/
│   ├── mode-adapter.ts           # 模式适配器
│   └── gene-research/            # 专业工具库（8个模块）
└── components/
    ├── ModeSelector.tsx          # 模式选择器
    └── Professional/
        └── GeneInput.tsx         # 基因输入组件
```

### API 使用

```typescript
// 模式适配器
import {
  getPromptForMode,
  getSearchProvidersForMode,
  generateSearchQueriesForMode,
  validateResearchConfig
} from '@/utils/mode-adapter';

// 根据模式生成提示词
const prompt = getPromptForMode(mode, config);

// 根据模式获取搜索提供商
const providers = getSearchProvidersForMode(mode);

// 根据模式生成搜索查询
const queries = generateSearchQueriesForMode(mode, config);

// 验证配置
const { valid, error } = validateResearchConfig(mode, config);
```

## 示例

### 普通模式研究示例

```typescript
const config = {
  query: 'AI技术发展趋势',
  mode: 'general',
  language: 'zh-CN',
  maxResult: 10
};

// 启动研究
startResearch(config);
```

### 专业模式研究示例

```typescript
const config = {
  geneSymbol: 'TP53',
  organism: 'Homo sapiens',
  researchFocus: ['general', 'disease', 'therapeutic'],
  diseaseContext: 'cancer',
  mode: 'professional',
  language: 'en-US',
  maxResult: 10
};

// 启动基因研究
startResearch(config);
```

## 国际化支持

模式相关的翻译键：

```json
{
  "mode": {
    "general": "普通模式 / General Mode",
    "professional": "专业模式（基因研究） / Professional Mode (Gene Research)"
  },
  "geneResearch": {
    "geneSymbol": "基因符号 / Gene Symbol",
    "organism": "物种 / Organism",
    "researchFocus": "研究焦点 / Research Focus",
    ...
  }
}
```

## 开发指南

### 添加新的研究模式

1. 在 `src/store/mode.ts` 中添加新模式类型
2. 在 `src/utils/mode-adapter.ts` 中添加模式逻辑
3. 创建对应的输入组件
4. 更新国际化文件

### 扩展专业模式功能

1. 在 `src/utils/gene-research/` 中添加新工具
2. 在 `src/types/gene-research.ts` 中添加类型定义
3. 更新 `GeneInput` 组件

## 测试

### 手动测试清单

- [ ] 普通模式研究功能正常
- [ ] 专业模式基因研究功能正常
- [ ] 模式切换流畅
- [ ] 模式持久化保存
- [ ] 国际化正确显示

## 贡献

欢迎贡献！请查看 [MERGE_PLAN.md](./MERGE_PLAN.md) 了解详细的实施方案。

## 常见问题

**Q: 如何切换模式？**
A: 使用 `useModeStore` 的 `setMode` 方法。

**Q: 专业模式需要额外配置吗？**
A: 不需要，所有专业模块已集成。

**Q: 两种模式可以同时使用吗？**
A: 不可以，同一时间只能使用一种模式。

**Q: 模式切换会丢失数据吗？**
A: 不会，两种模式的历史记录分别保存。

## 参考资料

- [完整实施方案](./MERGE_PLAN.md)
- [基因研究类型定义](./src/types/gene-research.ts)
- [生物数据库API文档](./src/utils/gene-research/README.md)

---

**版本**: v1.0
**更新日期**: 2025-11-06
**维护者**: Claude Code Assistant
