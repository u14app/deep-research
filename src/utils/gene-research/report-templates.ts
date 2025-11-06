// Gene research report templates and structure definitions
// Comprehensive templates for molecular biology research reports

import { GeneVisualization } from './visualization-generators';

export interface GeneReportTemplate {
  title: string;
  sections: GeneReportSection[];
  metadata: GeneReportMetadata;
}

export interface GeneReportSection {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  required: boolean;
  content: string;
  subsections?: GeneReportSubsection[];
  visualizations?: GeneVisualization[];
}

export interface GeneReportSubsection {
  id: string;
  title: string;
  content: string;
  data?: any;
}

// GeneVisualization interface is exported from visualization-generators.ts

export interface GeneReportMetadata {
  geneSymbol: string;
  organism: string;
  reportType: 'comprehensive' | 'focused' | 'comparative';
  targetAudience: 'researchers' | 'clinicians' | 'students' | 'general';
  complexity: 'basic' | 'intermediate' | 'advanced';
  wordCount?: number;
  estimatedReadingTime?: number;
}

// Main gene report template generator
export class GeneReportTemplateGenerator {
  private geneSymbol: string;
  private organism: string;
  private reportType: 'comprehensive' | 'focused' | 'comparative';
  private targetAudience: 'researchers' | 'clinicians' | 'students' | 'general';

  constructor(
    geneSymbol: string,
    organism: string,
    reportType: 'comprehensive' | 'focused' | 'comparative' = 'comprehensive',
    targetAudience: 'researchers' | 'clinicians' | 'students' | 'general' = 'researchers'
  ) {
    this.geneSymbol = geneSymbol;
    this.organism = organism;
    this.reportType = reportType;
    this.targetAudience = targetAudience;
  }

  generateReportTemplate(): GeneReportTemplate {
    const sections = this.generateSections();
    
    return {
      title: `Comprehensive Gene Function Research Report: ${this.geneSymbol} in ${this.organism}`,
      sections,
      metadata: {
        geneSymbol: this.geneSymbol,
        organism: this.organism,
        reportType: this.reportType,
        targetAudience: this.targetAudience,
        complexity: this.determineComplexity(),
        wordCount: this.estimateWordCount(sections),
        estimatedReadingTime: this.estimateReadingTime(sections)
      }
    };
  }

  private generateSections(): GeneReportSection[] {
    const baseSections = [
      this.generateExecutiveSummary(),
      this.generateGeneOverview(),
      this.generateMolecularFunction(),
      this.generateProteinStructure(),
      this.generateRegulatoryMechanisms(),
      this.generateExpressionPatterns(),
      this.generateProteinInteractions(),
      this.generateEvolutionaryConservation(),
      this.generateDiseaseAssociations(),
      this.generateTherapeuticImplications(),
      this.generateResearchGaps()
    ];

    // Add comparative analysis for comparative reports
    if (this.reportType === 'comparative') {
      baseSections.splice(8, 0, this.generateComparativeAnalysis());
    }

    // Adjust complexity based on target audience
    return this.adjustForAudience(baseSections);
  }

  private generateExecutiveSummary(): GeneReportSection {
    return {
      id: 'executive-summary',
      title: 'Executive Summary',
      priority: 'high',
      required: true,
      content: `## Executive Summary

This comprehensive report provides an in-depth analysis of the ${this.geneSymbol} gene in ${this.organism}, covering its molecular function, protein structure, regulatory mechanisms, expression patterns, and clinical significance. The ${this.geneSymbol} gene encodes a critical protein involved in [specific function], making it an important target for both basic research and therapeutic development.

### Key Findings:
- **Molecular Function**: [Brief description of primary function]
- **Protein Structure**: [Key structural features]
- **Regulatory Control**: [Main regulatory mechanisms]
- **Expression Pattern**: [Tissue and developmental expression]
- **Disease Relevance**: [Clinical significance and disease associations]
- **Therapeutic Potential**: [Drug target potential and therapeutic implications]

### Research Significance:
The ${this.geneSymbol} gene represents a crucial component of [biological process/pathway], with implications for understanding [specific biological phenomena] and developing novel therapeutic strategies for [relevant diseases/conditions].`,
      visualizations: [
        {
          type: 'mermaid',
          title: 'Gene Function Overview',
          content: 'graph TD\n    A[Gene Symbol] --> B[Molecular Function]\n    A --> C[Protein Structure]\n    A --> D[Regulatory Control]\n    A --> E[Expression Pattern]\n    A --> F[Disease Association]',
          description: 'Overview of key aspects of gene function'
        }
      ]
    };
  }

  private generateGeneOverview(): GeneReportSection {
    return {
      id: 'gene-overview',
      title: 'Gene Overview',
      priority: 'high',
      required: true,
      content: `## Gene Overview

### Basic Gene Information
- **Gene Symbol**: ${this.geneSymbol}
- **Organism**: ${this.organism}
- **Gene ID**: [NCBI Gene ID]
- **Alternative Names**: [List of aliases and alternative symbols]
- **Chromosomal Location**: [Chromosome and coordinates]
- **Gene Type**: [Protein-coding, lncRNA, etc.]
- **Genomic Coordinates**: [Start, end, strand]

### Gene Structure
- **Exon Count**: [Number of exons]
- **Intron Count**: [Number of introns]
- **Transcript Variants**: [Number of splice variants]
- **Promoter Region**: [Key promoter elements]
- **Untranslated Regions**: [5' and 3' UTR characteristics]

### Genomic Context
- **Neighboring Genes**: [Adjacent genes and their functions]
- **Gene Density**: [Local gene density]
- **Conserved Regions**: [Evolutionarily conserved elements]
- **Regulatory Elements**: [Enhancers, silencers, insulators]`,
      subsections: [
        {
          id: 'gene-nomenclature',
          title: 'Gene Nomenclature and Aliases',
          content: 'Detailed information about gene naming conventions and alternative symbols used in different databases and literature.'
        },
        {
          id: 'genomic-organization',
          title: 'Genomic Organization',
          content: 'Comprehensive analysis of gene structure, including exon-intron organization, alternative splicing, and regulatory elements.'
        }
      ]
    };
  }

  private generateMolecularFunction(): GeneReportSection {
    return {
      id: 'molecular-function',
      title: 'Molecular Function',
      priority: 'high',
      required: true,
      content: `## Molecular Function

### Primary Catalytic Activity
The ${this.geneSymbol} gene encodes a protein with [specific catalytic activity], playing a crucial role in [biological process]. The enzyme catalyzes the following reaction:

\`\`\`
[Chemical equation of the reaction]
\`\`\`

### Enzyme Classification
- **EC Number**: [Enzyme Commission number]
- **Enzyme Class**: [Class and subclass]
- **Reaction Type**: [Type of chemical reaction]

### Substrate Specificity
- **Primary Substrates**: [Main substrates]
- **Cofactors**: [Required cofactors and coenzymes]
- **Inhibitors**: [Known inhibitors and their mechanisms]
- **Activators**: [Allosteric activators and modulators]

### Binding Sites and Active Sites
- **Active Site Residues**: [Key catalytic residues]
- **Substrate Binding Pocket**: [Substrate recognition site]
- **Allosteric Sites**: [Regulatory binding sites]
- **Metal Binding Sites**: [Metal ion coordination sites]`,
      subsections: [
        {
          id: 'catalytic-mechanism',
          title: 'Catalytic Mechanism',
          content: 'Detailed description of the enzymatic mechanism, including intermediate states, transition states, and rate-limiting steps.'
        },
        {
          id: 'kinetic-parameters',
          title: 'Kinetic Parameters',
          content: 'Quantitative analysis of enzyme kinetics, including Km, Vmax, kcat, and other kinetic constants.'
        }
      ],
      visualizations: [
        {
          type: 'mermaid',
          title: 'Catalytic Mechanism',
          content: 'graph LR\n    A[Substrate] --> B[Enzyme-Substrate Complex]\n    B --> C[Transition State]\n    C --> D[Product]\n    D --> E[Enzyme]',
          description: 'Schematic representation of the catalytic mechanism'
        }
      ]
    };
  }

  private generateProteinStructure(): GeneReportSection {
    return {
      id: 'protein-structure',
      title: 'Protein Structure',
      priority: 'high',
      required: true,
      content: `## Protein Structure

### Primary Structure
- **Amino Acid Sequence**: [Complete sequence]
- **Molecular Weight**: [Calculated molecular weight]
- **Isoelectric Point**: [pI value]
- **Amino Acid Composition**: [Composition analysis]

### Secondary Structure
- **Alpha Helices**: [Number and locations]
- **Beta Sheets**: [Number and locations]
- **Loops and Turns**: [Flexible regions]
- **Disulfide Bonds**: [Cysteine residues and bonds]

### Tertiary Structure
- **3D Structure**: [Overall fold and architecture]
- **Domain Organization**: [Functional domains]
- **Active Site Architecture**: [Catalytic site structure]
- **Binding Sites**: [Substrate and cofactor binding sites]

### Quaternary Structure
- **Oligomeric State**: [Monomer, dimer, multimer]
- **Subunit Composition**: [Number and types of subunits]
- **Interface Interactions**: [Subunit-subunit contacts]
- **Assembly Mechanism**: [How the complex forms]`,
      subsections: [
        {
          id: 'domain-architecture',
          title: 'Domain Architecture',
          content: 'Detailed analysis of protein domains, their functions, and evolutionary relationships.'
        },
        {
          id: 'structural-dynamics',
          title: 'Structural Dynamics',
          content: 'Analysis of protein flexibility, conformational changes, and dynamic behavior.'
        }
      ],
      visualizations: [
        {
          type: 'mermaid',
          title: 'Protein Domain Organization',
          content: 'graph LR\n    A[N-terminal Domain] --> B[Catalytic Domain]\n    B --> C[Regulatory Domain]\n    C --> D[C-terminal Domain]',
          description: 'Schematic representation of protein domain organization'
        }
      ]
    };
  }

  private generateRegulatoryMechanisms(): GeneReportSection {
    return {
      id: 'regulatory-mechanisms',
      title: 'Regulatory Mechanisms',
      priority: 'high',
      required: true,
      content: `## Regulatory Mechanisms

### Transcriptional Regulation
- **Promoter Elements**: [Core promoter and regulatory elements]
- **Transcription Factors**: [Key transcriptional regulators]
- **Enhancer Elements**: [Distant regulatory elements]
- **Silencer Elements**: [Repressive regulatory elements]

### Post-Transcriptional Regulation
- **mRNA Stability**: [Factors affecting mRNA half-life]
- **Alternative Splicing**: [Splice variants and regulation]
- **miRNA Targeting**: [MicroRNA regulation]
- **RNA-Binding Proteins**: [Proteins regulating mRNA processing]

### Post-Translational Modifications
- **Phosphorylation**: [Phosphorylation sites and kinases]
- **Acetylation**: [Acetylation sites and acetyltransferases]
- **Ubiquitination**: [Ubiquitin modification and degradation]
- **Other Modifications**: [Methylation, SUMOylation, etc.]

### Allosteric Regulation
- **Allosteric Effectors**: [Molecules affecting enzyme activity]
- **Conformational Changes**: [Structural changes upon binding]
- **Cooperativity**: [Positive or negative cooperativity]
- **Feedback Inhibition**: [Product inhibition mechanisms]`,
      subsections: [
        {
          id: 'transcriptional-control',
          title: 'Transcriptional Control',
          content: 'Detailed analysis of transcriptional regulation, including chromatin structure, histone modifications, and transcription factor networks.'
        },
        {
          id: 'post-translational-control',
          title: 'Post-Translational Control',
          content: 'Comprehensive analysis of post-translational modifications and their functional consequences.'
        }
      ]
    };
  }

  private generateExpressionPatterns(): GeneReportSection {
    return {
      id: 'expression-patterns',
      title: 'Expression Patterns',
      priority: 'high',
      required: true,
      content: `## Expression Patterns

### Tissue-Specific Expression
- **High Expression**: [Tissues with highest expression]
- **Medium Expression**: [Tissues with moderate expression]
- **Low Expression**: [Tissues with low expression]
- **Absent Expression**: [Tissues where gene is not expressed]

### Developmental Expression
- **Embryonic Development**: [Expression during embryogenesis]
- **Postnatal Development**: [Expression during postnatal growth]
- **Adult Expression**: [Expression in mature tissues]
- **Aging-Related Changes**: [Expression changes with age]

### Environmental Response
- **Stress Response**: [Expression under stress conditions]
- **Hormonal Regulation**: [Response to hormones]
- **Nutritional Regulation**: [Response to nutrients]
- **Circadian Regulation**: [Daily expression patterns]

### Subcellular Localization
- **Primary Location**: [Main subcellular compartment]
- **Secondary Locations**: [Additional compartments]
- **Dynamic Localization**: [Movement between compartments]
- **Localization Signals**: [Targeting sequences]`,
      subsections: [
        {
          id: 'expression-regulation',
          title: 'Expression Regulation',
          content: 'Analysis of factors controlling gene expression, including transcriptional and post-transcriptional mechanisms.'
        },
        {
          id: 'expression-quantification',
          title: 'Expression Quantification',
          content: 'Quantitative analysis of expression levels across different conditions and tissues.'
        }
      ],
      visualizations: [
        {
          type: 'mermaid',
          title: 'Expression Heatmap',
          content: 'graph TD\n    A[High Expression] --> B[Tissue 1]\n    A --> C[Tissue 2]\n    D[Medium Expression] --> E[Tissue 3]\n    F[Low Expression] --> G[Tissue 4]',
          description: 'Schematic representation of tissue-specific expression patterns'
        }
      ]
    };
  }

  private generateProteinInteractions(): GeneReportSection {
    return {
      id: 'protein-interactions',
      title: 'Protein Interactions',
      priority: 'high',
      required: true,
      content: `## Protein Interactions

### Protein-Protein Interactions
- **Direct Interactions**: [Proteins that directly bind]
- **Indirect Interactions**: [Proteins in the same complex]
- **Functional Interactions**: [Proteins with related functions]
- **Regulatory Interactions**: [Proteins that regulate each other]

### Protein Complexes
- **Core Complexes**: [Stable protein complexes]
- **Dynamic Complexes**: [Transient interactions]
- **Assembly Factors**: [Proteins required for complex assembly]
- **Regulatory Subunits**: [Subunits that control activity]

### DNA/RNA Interactions
- **DNA Binding**: [Sequence-specific DNA binding]
- **RNA Binding**: [RNA recognition and binding]
- **Chromatin Interactions**: [Interactions with chromatin]
- **Transcriptional Regulation**: [Role in gene regulation]

### Small Molecule Interactions
- **Substrates**: [Enzymatic substrates]
- **Cofactors**: [Required cofactors]
- **Inhibitors**: [Competitive and non-competitive inhibitors]
- **Activators**: [Allosteric activators]`,
      subsections: [
        {
          id: 'interaction-networks',
          title: 'Interaction Networks',
          content: 'Analysis of protein interaction networks and their biological significance.'
        },
        {
          id: 'binding-mechanisms',
          title: 'Binding Mechanisms',
          content: 'Detailed analysis of molecular mechanisms underlying protein interactions.'
        }
      ],
      visualizations: [
        {
          type: 'mermaid',
          title: 'Protein Interaction Network',
          content: 'graph TD\n    A[Gene Symbol] --> B[Protein 1]\n    A --> C[Protein 2]\n    A --> D[Protein 3]\n    B --> E[Protein 4]\n    C --> F[Protein 5]',
          description: 'Network diagram showing protein-protein interactions'
        }
      ]
    };
  }

  private generateEvolutionaryConservation(): GeneReportSection {
    return {
      id: 'evolutionary-conservation',
      title: 'Evolutionary Conservation',
      priority: 'medium',
      required: true,
      content: `## Evolutionary Conservation

### Orthologs and Paralogs
- **Orthologs**: [Genes in other species with same function]
- **Paralogs**: [Related genes in same species]
- **Gene Family**: [Gene family classification]
- **Evolutionary Relationships**: [Phylogenetic relationships]

### Conservation Analysis
- **Sequence Conservation**: [Level of sequence similarity]
- **Functional Conservation**: [Conservation of function]
- **Structural Conservation**: [Conservation of structure]
- **Regulatory Conservation**: [Conservation of regulation]

### Evolutionary History
- **Gene Duplication**: [Duplication events]
- **Gene Loss**: [Loss events in some lineages]
- **Functional Divergence**: [Changes in function over time]
- **Adaptive Evolution**: [Evidence of positive selection]`,
      subsections: [
        {
          id: 'phylogenetic-analysis',
          title: 'Phylogenetic Analysis',
          content: 'Detailed phylogenetic analysis of gene evolution across different species.'
        },
        {
          id: 'functional-evolution',
          title: 'Functional Evolution',
          content: 'Analysis of how gene function has evolved over time and across species.'
        }
      ],
      visualizations: [
        {
          type: 'mermaid',
          title: 'Phylogenetic Tree',
          content: 'graph TD\n    A[Ancestral Gene] --> B[Species 1]\n    A --> C[Species 2]\n    A --> D[Species 3]\n    B --> E[Gene A]\n    C --> F[Gene B]',
          description: 'Phylogenetic tree showing evolutionary relationships'
        }
      ]
    };
  }

  private generateDiseaseAssociations(): GeneReportSection {
    return {
      id: 'disease-associations',
      title: 'Disease Associations',
      priority: 'high',
      required: true,
      content: `## Disease Associations

### Genetic Disorders
- **Monogenic Diseases**: [Single-gene disorders]
- **Complex Diseases**: [Multifactorial diseases]
- **Rare Diseases**: [Rare genetic conditions]
- **Common Variants**: [Common disease-associated variants]

### Mutations and Variants
- **Pathogenic Mutations**: [Disease-causing mutations]
- **Benign Variants**: [Non-disease-causing variants]
- **Variant of Uncertain Significance**: [VUS variants]
- **Population Variants**: [Common population variants]

### Clinical Phenotypes
- **Primary Phenotypes**: [Main clinical features]
- **Secondary Phenotypes**: [Associated clinical features]
- **Age of Onset**: [When symptoms appear]
- **Disease Severity**: [Severity of clinical presentation]

### Therapeutic Implications
- **Drug Targets**: [Potential therapeutic targets]
- **Biomarkers**: [Diagnostic or prognostic markers]
- **Therapeutic Strategies**: [Treatment approaches]
- **Clinical Trials**: [Ongoing or completed trials]`,
      subsections: [
        {
          id: 'mutation-analysis',
          title: 'Mutation Analysis',
          content: 'Detailed analysis of disease-causing mutations and their molecular mechanisms.'
        },
        {
          id: 'clinical-relevance',
          title: 'Clinical Relevance',
          content: 'Analysis of clinical significance and therapeutic potential.'
        }
      ]
    };
  }

  private generateTherapeuticImplications(): GeneReportSection {
    return {
      id: 'therapeutic-implications',
      title: 'Therapeutic Implications',
      priority: 'high',
      required: true,
      content: `## Therapeutic Implications

### Drug Target Potential
- **Targetability**: [Assessment of druggability]
- **Therapeutic Window**: [Safety considerations]
- **Mechanism of Action**: [How drugs would work]
- **Resistance Mechanisms**: [Potential resistance]

### Drug Development
- **Small Molecule Drugs**: [Small molecule approaches]
- **Biologics**: [Protein-based therapeutics]
- **Gene Therapy**: [Gene-based approaches]
- **Cell Therapy**: [Cell-based approaches]

### Biomarker Applications
- **Diagnostic Biomarkers**: [For disease diagnosis]
- **Prognostic Biomarkers**: [For disease progression]
- **Predictive Biomarkers**: [For treatment response]
- **Monitoring Biomarkers**: [For treatment monitoring]

### Clinical Applications
- **Precision Medicine**: [Personalized treatment]
- **Pharmacogenomics**: [Drug response prediction]
- **Risk Assessment**: [Disease risk prediction]
- **Screening Programs**: [Population screening]`,
      subsections: [
        {
          id: 'drug-discovery',
          title: 'Drug Discovery',
          content: 'Analysis of drug discovery opportunities and challenges.'
        },
        {
          id: 'clinical-translation',
          title: 'Clinical Translation',
          content: 'Pathway from basic research to clinical applications.'
        }
      ]
    };
  }

  private generateResearchGaps(): GeneReportSection {
    return {
      id: 'research-gaps',
      title: 'Research Gaps and Future Directions',
      priority: 'medium',
      required: true,
      content: `## Research Gaps and Future Directions

### Current Knowledge Gaps
- **Mechanistic Understanding**: [Areas needing deeper investigation]
- **Functional Characterization**: [Uncharacterized aspects]
- **Regulatory Networks**: [Incomplete regulatory understanding]
- **Disease Mechanisms**: [Unclear disease pathways]

### Methodological Challenges
- **Technical Limitations**: [Current technical barriers]
- **Model Systems**: [Limitations of current models]
- **Data Integration**: [Challenges in data integration]
- **Validation Methods**: [Need for better validation]

### Future Research Priorities
- **High-Priority Studies**: [Most important research needs]
- **Emerging Technologies**: [New approaches to explore]
- **Collaborative Opportunities**: [Areas for collaboration]
- **Translational Research**: [Clinical translation needs]

### Research Recommendations
- **Experimental Approaches**: [Recommended experiments]
- **Data Collection**: [Additional data needed]
- **Method Development**: [New methods required]
- **Clinical Studies**: [Clinical research needs]`,
      subsections: [
        {
          id: 'priority-research',
          title: 'Priority Research Areas',
          content: 'Detailed recommendations for future research priorities.'
        },
        {
          id: 'methodological-advances',
          title: 'Methodological Advances',
          content: 'Recommendations for methodological improvements and new approaches.'
        }
      ]
    };
  }

  private generateComparativeAnalysis(): GeneReportSection {
    return {
      id: 'comparative-analysis',
      title: 'Comparative Analysis',
      priority: 'high',
      required: true,
      content: `## Comparative Analysis

### Cross-Species Comparison
- **Functional Conservation**: [Conservation across species]
- **Structural Differences**: [Structural variations]
- **Expression Patterns**: [Expression differences]
- **Regulatory Mechanisms**: [Regulatory differences]

### Gene Family Analysis
- **Family Members**: [Related genes in family]
- **Functional Redundancy**: [Overlapping functions]
- **Specialization**: [Unique functions]
- **Evolutionary Relationships**: [Family evolution]

### Disease Model Comparison
- **Model Organisms**: [Different model systems]
- **Phenotypic Differences**: [Different phenotypes]
- **Pathway Conservation**: [Conserved pathways]
- **Therapeutic Implications**: [Cross-species relevance]`,
      subsections: [
        {
          id: 'functional-comparison',
          title: 'Functional Comparison',
          content: 'Detailed comparison of gene function across different species and contexts.'
        },
        {
          id: 'evolutionary-comparison',
          title: 'Evolutionary Comparison',
          content: 'Analysis of evolutionary relationships and divergence patterns.'
        }
      ]
    };
  }

  private determineComplexity(): 'basic' | 'intermediate' | 'advanced' {
    switch (this.targetAudience) {
      case 'students':
        return 'basic';
      case 'clinicians':
        return 'intermediate';
      case 'researchers':
        return 'advanced';
      case 'general':
        return 'basic';
      default:
        return 'intermediate';
    }
  }

  private estimateWordCount(sections: GeneReportSection[]): number {
    // Estimate word count based on section complexity and target audience
    const baseWords = sections.length * 500; // Base 500 words per section
    const audienceMultiplier = this.targetAudience === 'researchers' ? 1.5 : 1.0;
    const typeMultiplier = this.reportType === 'comprehensive' ? 1.3 : 1.0;
    
    return Math.round(baseWords * audienceMultiplier * typeMultiplier);
  }

  private estimateReadingTime(sections: GeneReportSection[]): number {
    const wordCount = this.estimateWordCount(sections);
    const wordsPerMinute = 200; // Average reading speed
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private adjustForAudience(sections: GeneReportSection[]): GeneReportSection[] {
    switch (this.targetAudience) {
      case 'students':
        return sections.map(section => ({
          ...section,
          content: this.simplifyContent(section.content),
          priority: section.priority === 'high' ? 'high' : 'medium'
        }));
      case 'clinicians':
        return sections.map(section => ({
          ...section,
          content: this.addClinicalContext(section.content),
          priority: section.id.includes('disease') || section.id.includes('therapeutic') ? 'high' : section.priority
        }));
      case 'general':
        return sections.filter(section => section.priority === 'high').map(section => ({
          ...section,
          content: this.simplifyContent(section.content)
        }));
      default:
        return sections;
    }
  }

  private simplifyContent(content: string): string {
    // Simplify technical content for general audience
    return content
      .replace(/\[.*?\]/g, '[simplified description]')
      .replace(/technical terms/g, 'simplified terms');
  }

  private addClinicalContext(content: string): string {
    // Add clinical context for medical professionals
    return content + '\n\n### Clinical Relevance\n[Clinical context and implications]';
  }
}

// Utility functions for report generation
export function generateGeneReportTemplate(
  geneSymbol: string,
  organism: string,
  reportType: 'comprehensive' | 'focused' | 'comparative' = 'comprehensive',
  targetAudience: 'researchers' | 'clinicians' | 'students' | 'general' = 'researchers'
): GeneReportTemplate {
  const generator = new GeneReportTemplateGenerator(geneSymbol, organism, reportType, targetAudience);
  return generator.generateReportTemplate();
}

// Predefined report templates for common scenarios
export const GENE_REPORT_TEMPLATES = {
  COMPREHENSIVE: 'comprehensive',
  FOCUSED: 'focused',
  COMPARATIVE: 'comparative',
  CLINICAL: 'clinical',
  EDUCATIONAL: 'educational'
};

// Report section priorities based on research focus
export const SECTION_PRIORITIES = {
  FUNCTIONAL_ANALYSIS: ['molecular-function', 'protein-structure', 'regulatory-mechanisms'],
  DISEASE_RESEARCH: ['disease-associations', 'therapeutic-implications', 'molecular-function'],
  EXPRESSION_ANALYSIS: ['expression-patterns', 'regulatory-mechanisms', 'protein-interactions'],
  STRUCTURAL_ANALYSIS: ['protein-structure', 'molecular-function', 'protein-interactions'],
  EVOLUTIONARY_ANALYSIS: ['evolutionary-conservation', 'molecular-function', 'expression-patterns']
};
