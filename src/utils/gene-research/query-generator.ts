// Gene-specific query generation system
// Intelligent query generation for molecular biology research

import { GeneSearchTask } from '@/types/gene-research';

export interface GeneQueryContext {
  geneSymbol: string;
  organism: string;
  researchFocus?: string[];
  specificAspects?: string[];
  diseaseContext?: string;
  experimentalApproach?: string;
}

export class GeneQueryGenerator {
  private geneSymbol: string;
  private organism: string;
  private researchFocus: string[];
  private specificAspects: string[];
  private diseaseContext?: string;
  private experimentalApproach?: string;

  constructor(context: GeneQueryContext) {
    this.geneSymbol = context.geneSymbol;
    this.organism = context.organism;
    this.researchFocus = context.researchFocus || ['general'];
    this.specificAspects = context.specificAspects || [];
    this.diseaseContext = context.diseaseContext;
    this.experimentalApproach = context.experimentalApproach;
  }

  generateComprehensiveQueries(): GeneSearchTask[] {
    const queries: GeneSearchTask[] = [];

    // Always include basic gene information queries
    queries.push(...this.generateBasicInfoQueries());

    // Generate queries based on selected research focuses
    if (this.researchFocus.includes('general') || this.researchFocus.includes('function')) {
      queries.push(...this.generateFunctionQueries());
    }

    if (this.researchFocus.includes('general') || this.researchFocus.includes('structure')) {
      queries.push(...this.generateStructureQueries());
    }

    if (this.researchFocus.includes('general') || this.researchFocus.includes('expression')) {
      queries.push(...this.generateExpressionQueries());
    }

    if (this.researchFocus.includes('general') || this.researchFocus.includes('interaction')) {
      queries.push(...this.generateInteractionQueries());
    }

    if (this.researchFocus.includes('general') || this.researchFocus.includes('disease')) {
      queries.push(...this.generateDiseaseQueries());
    }

    if (this.researchFocus.includes('general') || this.researchFocus.includes('evolution')) {
      queries.push(...this.generateEvolutionaryQueries());
    }

    if (this.researchFocus.includes('general') || this.researchFocus.includes('therapeutic')) {
      queries.push(...this.generatePathwayQueries());
    }

    // Always include regulatory mechanism queries as they're fundamental
    queries.push(...this.generateRegulatoryQueries());

    return queries;
  }

  /**
   * Quick mode: Generate only core essential queries (8 queries)
   * Reduces query count by ~73% while retaining critical information
   * Recommended for faster research with acceptable information coverage
   */
  generateQuickQueries(): GeneSearchTask[] {
    const basicInfo = this.generateBasicInfoQueries();
    const functionQueries = this.generateFunctionQueries();
    const diseaseQueries = this.generateDiseaseQueries();
    const expressionQueries = this.generateExpressionQueries();
    const interactionQueries = this.generateInteractionQueries();

    return [
      // Basic Information (2 queries) - Essential for gene identification
      basicInfo[0],  // Basic information
      basicInfo[1],  // Nomenclature and symbols

      // Molecular Function (2 queries) - Core biological function
      functionQueries[0],  // Molecular function and catalytic activity
      functionQueries[1],  // Biological processes

      // Disease Association (2 queries) - Clinical relevance
      diseaseQueries[0],  // Disease associations
      diseaseQueries.length > 1 ? diseaseQueries[1] : diseaseQueries[0],  // Genetic disorders

      // Expression Pattern (1 query) - Where and when gene is active
      expressionQueries[0],  // Tissue-specific expression

      // Protein Interactions (1 query) - Molecular context
      interactionQueries[0]  // Protein-protein interactions
    ];
  }

  private generateBasicInfoQueries(): GeneSearchTask[] {
    return [
      {
        query: `${this.geneSymbol} gene basic information ${this.organism}`,
        researchGoal: `Obtain comprehensive basic information about the ${this.geneSymbol} gene in ${this.organism}, including gene structure, genomic location, alternative names, and general description.`,
        database: 'ncbi_gene',
        priority: 'high',
        category: 'basic_info',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} gene nomenclature symbols ${this.organism}`,
        researchGoal: `Identify all alternative names, symbols, and aliases for the ${this.geneSymbol} gene to ensure comprehensive literature coverage.`,
        database: 'pubmed',
        priority: 'high',
        category: 'basic_info',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} genomic coordinates chromosome location ${this.organism}`,
        researchGoal: `Determine the precise genomic location, chromosomal coordinates, and genomic context of the ${this.geneSymbol} gene.`,
        database: 'ncbi_gene',
        priority: 'medium',
        category: 'basic_info',
        status: 'pending'
      }
    ];
  }

  private generateFunctionQueries(): GeneSearchTask[] {
    return [
      {
        query: `${this.geneSymbol} molecular function catalytic activity ${this.organism}`,
        researchGoal: `Investigate the molecular function and catalytic activity of the ${this.geneSymbol} gene product, including enzyme classification and substrate specificity.`,
        database: 'uniprot',
        priority: 'high',
        category: 'function',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} protein domains functional motifs ${this.organism}`,
        researchGoal: `Identify and analyze protein domains, functional motifs, and structural elements that contribute to the function of ${this.geneSymbol}.`,
        database: 'uniprot',
        priority: 'high',
        category: 'function',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} biological process cellular function ${this.organism}`,
        researchGoal: `Understand the biological processes and cellular functions in which ${this.geneSymbol} participates, including pathway involvement and cellular roles.`,
        database: 'pubmed',
        priority: 'high',
        category: 'function',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} substrate binding specificity ${this.organism}`,
        researchGoal: `Analyze substrate binding specificity, affinity constants, and molecular interactions of the ${this.geneSymbol} gene product.`,
        database: 'pubmed',
        priority: 'medium',
        category: 'function',
        status: 'pending'
      }
    ];
  }

  private generateStructureQueries(): GeneSearchTask[] {
    return [
      {
        query: `${this.geneSymbol} protein structure 3D crystal ${this.organism}`,
        researchGoal: `Obtain 3D protein structure information for ${this.geneSymbol}, including crystal structures, NMR structures, and homology models.`,
        database: 'pdb',
        priority: 'high',
        category: 'structure',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} active site binding pocket structure ${this.organism}`,
        researchGoal: `Analyze the active site, binding pockets, and critical structural elements of the ${this.geneSymbol} protein.`,
        database: 'pdb',
        priority: 'high',
        category: 'structure',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} protein folding stability domains ${this.organism}`,
        researchGoal: `Investigate protein folding, stability, and domain organization of the ${this.geneSymbol} gene product.`,
        database: 'pubmed',
        priority: 'medium',
        category: 'structure',
        status: 'pending'
      }
    ];
  }

  private generateExpressionQueries(): GeneSearchTask[] {
    return [
      {
        query: `${this.geneSymbol} expression pattern tissue specific ${this.organism}`,
        researchGoal: `Analyze tissue-specific expression patterns of ${this.geneSymbol} across different organs and cell types.`,
        database: 'geo',
        priority: 'high',
        category: 'expression',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} developmental expression stage specific ${this.organism}`,
        researchGoal: `Investigate developmental stage-specific expression of ${this.geneSymbol} during embryogenesis and postnatal development.`,
        database: 'geo',
        priority: 'high',
        category: 'expression',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} expression regulation environmental response ${this.organism}`,
        researchGoal: `Study how ${this.geneSymbol} expression responds to environmental stimuli, stress conditions, and physiological changes.`,
        database: 'pubmed',
        priority: 'medium',
        category: 'expression',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} subcellular localization expression ${this.organism}`,
        researchGoal: `Determine the subcellular localization and compartmentalization of the ${this.geneSymbol} gene product.`,
        database: 'uniprot',
        priority: 'medium',
        category: 'expression',
        status: 'pending'
      }
    ];
  }

  private generateRegulatoryQueries(): GeneSearchTask[] {
    return [
      {
        query: `${this.geneSymbol} transcription regulation promoter enhancer ${this.organism}`,
        researchGoal: `Investigate transcriptional regulation of ${this.geneSymbol}, including promoter elements, enhancers, and transcription factors.`,
        database: 'pubmed',
        priority: 'high',
        category: 'interactions',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} post-transcriptional regulation miRNA ${this.organism}`,
        researchGoal: `Analyze post-transcriptional regulation of ${this.geneSymbol}, including miRNA targeting, RNA stability, and processing.`,
        database: 'pubmed',
        priority: 'medium',
        category: 'interactions',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} post-translational modification phosphorylation ${this.organism}`,
        researchGoal: `Study post-translational modifications of the ${this.geneSymbol} protein, including phosphorylation, acetylation, and ubiquitination.`,
        database: 'uniprot',
        priority: 'medium',
        category: 'interactions',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} epigenetic regulation methylation ${this.organism}`,
        researchGoal: `Investigate epigenetic regulation of ${this.geneSymbol}, including DNA methylation, histone modifications, and chromatin structure.`,
        database: 'pubmed',
        priority: 'medium',
        category: 'interactions',
        status: 'pending'
      }
    ];
  }

  private generateInteractionQueries(): GeneSearchTask[] {
    return [
      {
        query: `${this.geneSymbol} protein-protein interactions network ${this.organism}`,
        researchGoal: `Identify protein-protein interactions involving ${this.geneSymbol} and analyze its role in protein interaction networks.`,
        database: 'pubmed',
        priority: 'high',
        category: 'interactions',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} protein complex subunit ${this.organism}`,
        researchGoal: `Investigate protein complexes containing ${this.geneSymbol} and determine its role as a complex subunit.`,
        database: 'pubmed',
        priority: 'high',
        category: 'interactions',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} DNA binding transcription factor ${this.organism}`,
        researchGoal: `Analyze DNA binding activity of ${this.geneSymbol} and its role as a transcription factor or DNA-binding protein.`,
        database: 'pubmed',
        priority: 'medium',
        category: 'interactions',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} small molecule binding ligand ${this.organism}`,
        researchGoal: `Investigate small molecule binding by ${this.geneSymbol}, including substrates, cofactors, and regulatory ligands.`,
        database: 'pubmed',
        priority: 'medium',
        category: 'interactions',
        status: 'pending'
      }
    ];
  }

  private generateDiseaseQueries(): GeneSearchTask[] {
    if (!this.diseaseContext) {
      return [
        {
          query: `${this.geneSymbol} disease association mutation ${this.organism}`,
          researchGoal: `Investigate disease associations of ${this.geneSymbol}, including mutations, polymorphisms, and clinical phenotypes.`,
          database: 'pubmed',
          priority: 'high',
          category: 'disease',
          status: 'pending'
        },
        {
          query: `${this.geneSymbol} genetic disorder syndrome ${this.organism}`,
          researchGoal: `Analyze genetic disorders and syndromes associated with ${this.geneSymbol} mutations or dysregulation.`,
          database: 'pubmed',
          priority: 'high',
          category: 'disease',
          status: 'pending'
        }
      ];
    }

    return [
      {
        query: `${this.geneSymbol} ${this.diseaseContext} disease mechanism ${this.organism}`,
        researchGoal: `Investigate the role of ${this.geneSymbol} in ${this.diseaseContext} pathogenesis and disease mechanisms.`,
        database: 'pubmed',
        priority: 'high',
        category: 'disease',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} ${this.diseaseContext} therapeutic target ${this.organism}`,
        researchGoal: `Evaluate ${this.geneSymbol} as a therapeutic target for ${this.diseaseContext} treatment and drug development.`,
        database: 'pubmed',
        priority: 'high',
        category: 'disease',
        status: 'pending'
      }
    ];
  }

  private generateEvolutionaryQueries(): GeneSearchTask[] {
    return [
      {
        query: `${this.geneSymbol} orthologs paralogs evolution ${this.organism}`,
        researchGoal: `Analyze evolutionary relationships of ${this.geneSymbol}, including orthologs, paralogs, and gene family evolution.`,
        database: 'pubmed',
        priority: 'medium',
        category: 'evolution',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} gene duplication conservation ${this.organism}`,
        researchGoal: `Investigate gene duplication events and evolutionary conservation of ${this.geneSymbol} across species.`,
        database: 'pubmed',
        priority: 'medium',
        category: 'evolution',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} functional conservation divergence ${this.organism}`,
        researchGoal: `Study functional conservation and divergence of ${this.geneSymbol} across different organisms and evolutionary time.`,
        database: 'pubmed',
        priority: 'low',
        category: 'evolution',
        status: 'pending'
      }
    ];
  }

  private generatePathwayQueries(): GeneSearchTask[] {
    return [
      {
        query: `${this.geneSymbol} metabolic pathway KEGG ${this.organism}`,
        researchGoal: `Identify metabolic pathways involving ${this.geneSymbol} and analyze its role in cellular metabolism.`,
        database: 'kegg',
        priority: 'high',
        category: 'pathway',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} signaling pathway network ${this.organism}`,
        researchGoal: `Investigate signaling pathways and regulatory networks involving ${this.geneSymbol}.`,
        database: 'pubmed',
        priority: 'high',
        category: 'pathway',
        status: 'pending'
      },
      {
        query: `${this.geneSymbol} disease pathway mechanism ${this.organism}`,
        researchGoal: `Analyze disease-related pathways and mechanisms involving ${this.geneSymbol} dysfunction.`,
        database: 'pubmed',
        priority: 'medium',
        category: 'pathway',
        status: 'pending'
      }
    ];
  }

  // Generate focused queries based on specific research aspects
  generateFocusedQueries(aspects: string[]): GeneSearchTask[] {
    const queries: GeneSearchTask[] = [];
    
    aspects.forEach(aspect => {
      switch (aspect.toLowerCase()) {
        case 'structure':
          queries.push(...this.generateStructureQueries());
          break;
        case 'function':
          queries.push(...this.generateFunctionQueries());
          break;
        case 'expression':
          queries.push(...this.generateExpressionQueries());
          break;
        case 'regulation':
          queries.push(...this.generateRegulatoryQueries());
          break;
        case 'interactions':
          queries.push(...this.generateInteractionQueries());
          break;
        case 'disease':
          queries.push(...this.generateDiseaseQueries());
          break;
        case 'evolution':
          queries.push(...this.generateEvolutionaryQueries());
          break;
        case 'pathway':
          queries.push(...this.generatePathwayQueries());
          break;
      }
    });

    return queries;
  }

  // Generate follow-up queries based on initial findings
  generateFollowUpQueries(initialFindings: string[]): GeneSearchTask[] {
    const queries: GeneSearchTask[] = [];
    
    // Analyze initial findings to generate targeted follow-up queries
    initialFindings.forEach(finding => {
      if (finding.toLowerCase().includes('mutation')) {
        queries.push({
          query: `${this.geneSymbol} mutation functional effect mechanism ${this.organism}`,
          researchGoal: `Investigate the functional effects and molecular mechanisms of mutations in ${this.geneSymbol}.`,
          database: 'pubmed',
          priority: 'high',
          category: 'disease',
          status: 'pending'
        });
      }
      
      if (finding.toLowerCase().includes('interaction')) {
        queries.push({
          query: `${this.geneSymbol} interaction partner functional significance ${this.organism}`,
          researchGoal: `Analyze the functional significance of protein interactions involving ${this.geneSymbol}.`,
          database: 'pubmed',
          priority: 'high',
          category: 'interactions',
          status: 'pending'
        });
      }
      
      if (finding.toLowerCase().includes('pathway')) {
        queries.push({
          query: `${this.geneSymbol} pathway regulation control mechanism ${this.organism}`,
          researchGoal: `Investigate how ${this.geneSymbol} regulates and controls pathway activity.`,
          database: 'pubmed',
          priority: 'medium',
          category: 'pathway',
          status: 'pending'
        });
      }
    });

    return queries;
  }

  // Generate comparative analysis queries
  generateComparativeQueries(otherGenes: string[]): GeneSearchTask[] {
    const queries: GeneSearchTask[] = [];
    
    otherGenes.forEach(gene => {
      queries.push({
        query: `${this.geneSymbol} ${gene} comparative analysis function ${this.organism}`,
        researchGoal: `Compare the function and properties of ${this.geneSymbol} with ${gene} to identify similarities and differences.`,
        database: 'pubmed',
        priority: 'medium',
        category: 'function',
        status: 'pending'
      });
    });

    return queries;
  }
}

// Utility function to create gene query generator
export function createGeneQueryGenerator(context: GeneQueryContext): GeneQueryGenerator {
  return new GeneQueryGenerator(context);
}

// Predefined query templates for common gene research scenarios
export const GENE_QUERY_TEMPLATES = {
  FUNCTIONAL_ANALYSIS: [
    'molecular function',
    'catalytic activity',
    'protein domains',
    'substrate specificity'
  ],
  
  EXPRESSION_ANALYSIS: [
    'tissue expression',
    'developmental expression',
    'environmental response',
    'subcellular localization'
  ],
  
  DISEASE_RESEARCH: [
    'disease association',
    'mutation effects',
    'therapeutic target',
    'clinical relevance'
  ],
  
  STRUCTURAL_ANALYSIS: [
    'protein structure',
    'active site',
    'binding sites',
    'protein folding'
  ],
  
  REGULATORY_ANALYSIS: [
    'transcription regulation',
    'post-translational modification',
    'epigenetic regulation',
    'signaling pathways'
  ]
};
