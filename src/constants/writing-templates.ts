// Writing Requirements Templates for Research Reports
// Provides preset templates for different types of scientific writing

export interface WritingTemplate {
  id: string;
  name: string;
  nameZh: string;
  content: string;
}

export const WRITING_TEMPLATES: Record<string, WritingTemplate> = {
  medical_review: {
    id: 'medical_review',
    name: 'Medical Journal Review',
    nameZh: '医学期刊综述',
    content: `请按照医学期刊综述（Review Article）的标准撰写报告：

## 写作要求

### 结构（IMRAD格式）
1. **摘要**（结构化，250-300字）
   - 背景、目的、方法、结果、结论
2. **引言**
   - 研究背景和意义
   - 当前知识现状
   - 研究目的和范围
3. **主体部分**（按基因研究特点组织）
   - 基因结构与功能
   - 分子机制与信号通路
   - 表达调控与组织分布
   - 临床相关性与疾病关联
   - 治疗靶点潜力
4. **讨论与展望**
   - 研究局限性
   - 未来研究方向
   - 临床应用前景
5. **结论**（简明扼要）

### 写作风格
- **正式、客观、第三人称**
- 字数：8000-12000字
- 段落长度：150-250字
- 逻辑清晰，层次分明

### 证据标准
- **优先引用**：系统综述、Meta分析、RCT研究
- **必需数据**：定量数据（p值、fold change、IC50、Kd等）
- **注明方法**：实验方法和样本量
- **跨物种验证**：包含多物种比较数据

### 引用格式
- 按首次出现顺序编号 [1-50]
- 每段不超过3个引用
- 紧随相关陈述之后
- 格式：文字内容[1,2]

### 图表建议
- 包含通路图（Pathway）
- 表达热图（Expression Heatmap）
- 疾病关联网络（Disease Network）
- 至少3个可视化图表

### 质量标准
符合 Nature Reviews Genetics、Cell、NEJM 等顶级期刊要求`
  },

  gene_report: {
    id: 'gene_report',
    name: 'Gene Function Report',
    nameZh: '基因功能报告',
    content: `请按照专业基因功能报告的标准撰写：

## 写作要求

### 目标读者
分子生物学研究者、临床医生、药物研发人员

### 报告结构（11章节）
1. **执行摘要**（500字）
   - 核心发现和关键数据
2. **基因概述**
   - 基本信息（Gene ID, 染色体定位）
   - 同源基因和命名
3. **分子功能**
   - 酶活性和催化机制
   - 结合特性和底物
   - 参与的信号通路
4. **蛋白质结构**
   - 结构域组成
   - 修饰位点（磷酸化、糖基化等）
   - 三维结构信息
5. **表达模式**
   - 组织特异性表达
   - 发育阶段表达
   - 转录调控机制
6. **相互作用网络**
   - 蛋白-蛋白相互作用
   - 蛋白-DNA 相互作用
   - 小分子配体
7. **疾病关联**
   - 突变与表型
   - 疾病机制
   - 治疗意义
8. **进化保守性**
   - 物种间比较
   - 功能保守域
9. **研究工具**
   - 推荐抗体
   - 表达质粒
   - 模型生物
10. **质量评估**
    - 数据完整性评分
    - 文献可靠性分析
11. **研究展望**
    - 未解决的问题
    - 未来研究方向

### 数据密度要求
- 每段至少包含 2-3 个定量数据点
- 标注数据来源（PMID）
- 包含实验条件和参数

### 可视化要求
- 必须包含至少 3 个 Mermaid 图表
- 建议图表类型：
  * 蛋白质结构域组织图
  * 信号通路图
  * 相互作用网络图

### 写作风格
- 专业、详实、结构化
- 字数：6000-8000字
- 使用准确的分子生物学术语

### 参考文献
- 优先引用原始研究
- 标注 PMID 或 DOI
- 近5年文献占比 > 60%`
  },

  clinical_guideline: {
    id: 'clinical_guideline',
    name: 'Clinical Guideline',
    nameZh: '临床指南',
    content: `请按照临床指南的标准撰写：

## 写作要求

### 目标读者
临床医生、遗传咨询师、医学学生

### 报告结构
1. **关键信息摘要**
   - 基因概况（一句话）
   - 临床意义等级
   - 关键建议（3-5条）
2. **临床意义**
   - 相关疾病和表型
   - 遗传模式
   - 发病率和患病率
3. **基因检测指征**
   - 适应症
   - 禁忌症
   - 最佳检测时机
4. **变异解读标准**
   - 致病性分类（ACMG标准）
   - 变异类型与临床意义
   - VUS（意义未明变异）处理
5. **临床管理建议**
   - 诊断流程
   - 治疗方案
   - 随访计划
6. **遗传咨询要点**
   - 遗传风险评估
   - 家系调查建议
   - 生育指导
7. **典型病例**
   - 2-3个真实案例
   - 诊疗过程分析

### 证据等级标注
每个建议标注证据等级：
- **A级**：高质量 RCT 或 Meta 分析
- **B级**：队列研究或病例对照研究
- **C级**：专家共识或病例报告

### 写作风格
- 清晰、实用、面向临床
- 字数：4000-6000字
- 使用临床术语，避免过度技术化

### 风险评估
- 基于突变类型的风险分层
- 渗透率信息
- 预后判断

### 更新机制
- 标注指南版本和日期
- 参考最新临床证据`
  },

  research_proposal: {
    id: 'research_proposal',
    name: 'Research Proposal',
    nameZh: '研究提案',
    content: `请按照研究提案的标准撰写：

## 写作要求

### 申请目标
适用于：NIH R01、NSF、国家自然科学基金

### 提案结构
1. **研究背景与意义**（Significance）
   - 科学问题的重要性
   - 当前研究现状
   - 知识空白（Knowledge Gap）
   - 研究的必要性
2. **研究假说**（Hypothesis）
   - 中心假说（1-2句话）
   - 支持性初步数据
   - 可验证性说明
3. **研究目标**（Specific Aims）
   - Aim 1: [具体目标]
   - Aim 2: [具体目标]
   - Aim 3: [具体目标]
   - 每个 Aim 包含：
     * 工作假说
     * 实验设计
     * 预期结果
     * 潜在问题和替代方案
4. **研究方法**（Approach）
   - 实验设计详述
   - 技术路线
   - 样本量计算
   - 统计分析方法
5. **创新性**（Innovation）
   - 新概念、新方法、新技术
   - 与现有研究的差异
   - 突破性潜力
6. **可行性**（Feasibility）
   - 初步数据支持
   - 团队能力
   - 研究资源
   - 时间表（Timeline）

### 写作风格
- 逻辑清晰、假说驱动
- 字数：6000-8000字
- 重点突出创新性和可行性

### 初步数据
- 必须包含支持性的初步结果
- 图表展示关键数据
- 证明技术路线可行

### 风险与应对
- 识别潜在技术难点
- 提供替代实验方案
- 说明项目灵活性

### 时间表
- 年度里程碑
- 可交付成果
- 发表计划`
  },

  custom: {
    id: 'custom',
    name: 'Custom Requirements',
    nameZh: '自定义要求',
    content: ''
  }
};

export const TEMPLATE_OPTIONS = [
  { value: 'medical_review', label: '医学期刊综述 (Medical Journal Review)', labelEn: 'Medical Journal Review' },
  { value: 'gene_report', label: '基因功能报告 (Gene Function Report)', labelEn: 'Gene Function Report' },
  { value: 'clinical_guideline', label: '临床指南 (Clinical Guideline)', labelEn: 'Clinical Guideline' },
  { value: 'research_proposal', label: '研究提案 (Research Proposal)', labelEn: 'Research Proposal' },
  { value: 'custom', label: '自定义 (Custom)', labelEn: 'Custom' }
];
