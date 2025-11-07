import type { ResearchMode } from '@/store/mode';

/**
 * 研究配置接口
 */
export interface ResearchConfig {
  query?: string;
  mode?: ResearchMode;

  // 专业模式特有字段
  geneSymbol?: string;
  organism?: string;
  researchFocus?: ResearchFocus[];
  specificAspects?: string[];
  diseaseContext?: string;
  experimentalApproach?: string;
  researchQuestion?: string;

  // 通用配置
  language?: string;
  maxResult?: number;
  enableCitationImage?: boolean;
  enableReferences?: boolean;
}

export type ResearchFocus =
  | 'general'
  | 'disease'
  | 'structure'
  | 'expression'
  | 'interactions'
  | 'evolution'
  | 'therapeutic';

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
  const {
    geneSymbol,
    organism,
    researchFocus,
    specificAspects,
    diseaseContext,
    experimentalApproach,
    researchQuestion
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

  // 添加自定义研究问题
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

/**
 * 生成通用模式提示词
 */
function generateGeneralPrompt(config: ResearchConfig): string {
  return config.query || '';
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
  return ['model', 'tavily', 'searxng', 'exa', 'firecrawl', 'bocha'];
}

/**
 * 根据模式生成搜索查询
 */
export function generateSearchQueriesForMode(
  mode: ResearchMode,
  config: ResearchConfig
): string[] {
  if (mode === 'professional') {
    // 为专业模式生成基因特定的查询
    const { geneSymbol, organism, researchFocus } = config;
    const queries: string[] = [];

    // 基础查询
    queries.push(`${geneSymbol} ${organism} function`);

    // 根据研究焦点生成特定查询
    if (researchFocus?.includes('disease')) {
      queries.push(`${geneSymbol} disease association`);
    }
    if (researchFocus?.includes('structure')) {
      queries.push(`${geneSymbol} protein structure`);
    }
    if (researchFocus?.includes('expression')) {
      queries.push(`${geneSymbol} expression pattern`);
    }
    if (researchFocus?.includes('interactions')) {
      queries.push(`${geneSymbol} protein interactions`);
    }

    return queries;
  }

  // 通用模式的查询
  return [config.query || ''];
}

/**
 * 验证研究配置是否有效
 */
export function validateResearchConfig(
  mode: ResearchMode,
  config: ResearchConfig
): { valid: boolean; error?: string } {
  if (mode === 'professional') {
    if (!config.geneSymbol) {
      return { valid: false, error: 'Gene symbol is required' };
    }
    if (!config.organism) {
      return { valid: false, error: 'Organism is required' };
    }
    if (!config.researchFocus || config.researchFocus.length === 0) {
      return { valid: false, error: 'At least one research focus is required' };
    }
  } else {
    if (!config.query || config.query.trim() === '') {
      return { valid: false, error: 'Research query is required' };
    }
  }

  return { valid: true };
}
