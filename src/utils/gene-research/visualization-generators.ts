// Gene-specific visualization generators
// Advanced visualization capabilities for molecular biology research

import { 
  GeneBasicInfo, 
  FunctionalData, 
  ProteinInfo, 
  ExpressionData, 
  InteractionData, 
  DiseaseData, 
  EvolutionaryData
} from '@/types/gene-research';

export interface GeneVisualization {
  type: 'mermaid' | 'image' | 'table' | 'chart';
  title: string;
  content: string;
  description: string;
  metadata?: {
    geneSymbol: string;
    organism: string;
    dataSource: string;
    confidence: number;
  };
}

export class GeneVisualizationGenerator {
  private geneSymbol: string;
  private organism: string;

  constructor(geneSymbol: string, organism: string) {
    this.geneSymbol = geneSymbol;
    this.organism = organism;
  }

  // Generate protein structure diagram
  generateProteinStructure(proteinInfo: ProteinInfo): GeneVisualization {
    const domains = proteinInfo.proteinDomains || [];
    const bindingSites = proteinInfo.bindingSites || [];
    
    let mermaidContent = `graph LR\n`;
    
    // Add protein backbone
    mermaidContent += `    A[Protein: ${this.geneSymbol}] --> B[${proteinInfo.proteinSize} aa]\n`;
    
    // Add domains
    domains.forEach((domain, index) => {
      const domainId = `D${index + 1}`;
      mermaidContent += `    A --> ${domainId}[${domain.name}]\n`;
      mermaidContent += `    ${domainId} --> |"${domain.type}"| E[Domain Function]\n`;
    });
    
    // Add binding sites
    bindingSites.forEach((site: any, index: number) => {
      const siteId = `S${index + 1}`;
      mermaidContent += `    A --> ${siteId}[${site.name}]\n`;
      mermaidContent += `    ${siteId} --> |"${site.type}"| F[Binding Site]\n`;
    });

    return {
      type: 'mermaid',
      title: `Protein Structure: ${this.geneSymbol}`,
      content: mermaidContent,
      description: `Protein structure diagram showing domains and binding sites for ${this.geneSymbol}`,
      metadata: {
        geneSymbol: this.geneSymbol,
        organism: this.organism,
        dataSource: 'protein_info',
        confidence: 0.8
      }
    };
  }

  // Generate pathway map
  generatePathwayMap(functionalData: FunctionalData, interactionData: InteractionData): GeneVisualization {
    let mermaidContent = `graph TD\n`;
    
    // Add central gene
    mermaidContent += `    A[${this.geneSymbol}] --> B[Molecular Function]\n`;
    mermaidContent += `    A --> C[Catalytic Activity]\n`;
    mermaidContent += `    A --> D[Regulatory Role]\n`;
    
    // Add molecular functions
    functionalData.molecularFunction?.forEach((func, index) => {
      const funcId = `F${index + 1}`;
      mermaidContent += `    B --> ${funcId}["${func}"]\n`;
    });
    
    // Add protein interactions
    interactionData.proteinInteractions?.forEach((interaction, index) => {
      const intId = `I${index + 1}`;
      mermaidContent += `    A --> ${intId}[${interaction.partnerSymbol}]\n`;
      mermaidContent += `    ${intId} --> |"${interaction.interactionType}"| E[Interaction Network]\n`;
    });
    
    // Add biological processes
    functionalData.biologicalProcess?.forEach((process, index) => {
      const procId = `P${index + 1}`;
      mermaidContent += `    A --> ${procId}["${process}"]\n`;
    });

    return {
      type: 'mermaid',
      title: `Pathway Map: ${this.geneSymbol}`,
      content: mermaidContent,
      description: `Biological pathway map showing the role of ${this.geneSymbol} in cellular processes`,
      metadata: {
        geneSymbol: this.geneSymbol,
        organism: this.organism,
        dataSource: 'functional_data',
        confidence: 0.7
      }
    };
  }

  // Generate expression heatmap
  generateExpressionHeatmap(expressionData: ExpressionData): GeneVisualization {
    const tissues = expressionData.tissueSpecificity || [];
    
    let mermaidContent = `graph TD\n`;
    mermaidContent += `    A[Expression Pattern: ${this.geneSymbol}] --> B[High Expression]\n`;
    mermaidContent += `    A --> C[Medium Expression]\n`;
    mermaidContent += `    A --> D[Low Expression]\n`;
    
    // Categorize tissues by expression level
    const highExpr = tissues.filter(t => t.expressionLevel === 'high');
    const mediumExpr = tissues.filter(t => t.expressionLevel === 'medium');
    const lowExpr = tissues.filter(t => t.expressionLevel === 'low');
    
    highExpr.forEach((tissue, index) => {
      mermaidContent += `    B --> H${index + 1}["${tissue.tissue}"]\n`;
    });
    
    mediumExpr.forEach((tissue, index) => {
      mermaidContent += `    C --> M${index + 1}["${tissue.tissue}"]\n`;
    });
    
    lowExpr.forEach((tissue, index) => {
      mermaidContent += `    D --> L${index + 1}["${tissue.tissue}"]\n`;
    });

    return {
      type: 'mermaid',
      title: `Expression Heatmap: ${this.geneSymbol}`,
      content: mermaidContent,
      description: `Tissue-specific expression pattern for ${this.geneSymbol}`,
      metadata: {
        geneSymbol: this.geneSymbol,
        organism: this.organism,
        dataSource: 'expression_data',
        confidence: 0.6
      }
    };
  }

  // Generate interaction network
  generateInteractionNetwork(interactionData: InteractionData): GeneVisualization {
    let mermaidContent = `graph TD\n`;
    
    // Add central gene
    mermaidContent += `    A[${this.geneSymbol}] --> B[Protein Interactions]\n`;
    mermaidContent += `    A --> C[DNA Interactions]\n`;
    mermaidContent += `    A --> D[RNA Interactions]\n`;
    mermaidContent += `    A --> E[Small Molecule Interactions]\n`;
    
    // Add protein interactions
    interactionData.proteinInteractions?.forEach((interaction, index) => {
      const intId = `P${index + 1}`;
      mermaidContent += `    B --> ${intId}[${interaction.partnerSymbol}]\n`;
      mermaidContent += `    ${intId} --> |"${interaction.strength}"| F[Interaction Strength]\n`;
    });
    
    // Add DNA interactions
    interactionData.dnaInteractions?.forEach((interaction, index) => {
      const dnaId = `DNA${index + 1}`;
      mermaidContent += `    C --> ${dnaId}["${interaction.sequence}"]\n`;
      mermaidContent += `    ${dnaId} --> |"${interaction.type}"| G[DNA Binding]\n`;
    });
    
    // Add small molecule interactions
    interactionData.smallMoleculeInteractions?.forEach((interaction, index) => {
      const molId = `M${index + 1}`;
      mermaidContent += `    E --> ${molId}[${interaction.molecule}]\n`;
      mermaidContent += `    ${molId} --> |"${interaction.type}"| H[Small Molecule Binding]\n`;
    });

    return {
      type: 'mermaid',
      title: `Interaction Network: ${this.geneSymbol}`,
      content: mermaidContent,
      description: `Protein interaction network for ${this.geneSymbol}`,
      metadata: {
        geneSymbol: this.geneSymbol,
        organism: this.organism,
        dataSource: 'interaction_data',
        confidence: 0.7
      }
    };
  }

  // Generate evolutionary tree
  generateEvolutionaryTree(evolutionaryData: EvolutionaryData): GeneVisualization {
    let mermaidContent = `graph TD\n`;
    
    // Add ancestral gene
    mermaidContent += `    A[Ancestral Gene] --> B[${this.geneSymbol}]\n`;
    mermaidContent += `    A --> C[Orthologs]\n`;
    mermaidContent += `    A --> D[Paralogs]\n`;
    
    // Add orthologs
    evolutionaryData.orthologs?.forEach((ortholog, index) => {
      const orthId = `O${index + 1}`;
      mermaidContent += `    C --> ${orthId}[${ortholog.geneSymbol}]\n`;
      mermaidContent += `    ${orthId} --> |"${ortholog.identity}% identity"| E[Conservation]\n`;
    });
    
    // Add paralogs
    evolutionaryData.paralogs?.forEach((paralog, index) => {
      const paraId = `P${index + 1}`;
      mermaidContent += `    D --> ${paraId}[${paralog.geneSymbol}]\n`;
      mermaidContent += `    ${paraId} --> |"${paralog.identity}% identity"| F[Divergence]\n`;
    });

    return {
      type: 'mermaid',
      title: `Evolutionary Tree: ${this.geneSymbol}`,
      content: mermaidContent,
      description: `Evolutionary relationships for ${this.geneSymbol}`,
      metadata: {
        geneSymbol: this.geneSymbol,
        organism: this.organism,
        dataSource: 'evolutionary_data',
        confidence: 0.6
      }
    };
  }

  // Generate disease association diagram
  generateDiseaseAssociation(diseaseData: DiseaseData[]): GeneVisualization {
    let mermaidContent = `graph TD\n`;
    
    // Add central gene
    mermaidContent += `    A[${this.geneSymbol}] --> B[Disease Associations]\n`;
    mermaidContent += `    A --> C[Mutations]\n`;
    mermaidContent += `    A --> D[Therapeutic Targets]\n`;
    
    // Add diseases
    diseaseData.forEach((disease, index) => {
      const diseaseId = `D${index + 1}`;
      mermaidContent += `    B --> ${diseaseId}[${disease.disease}]\n`;
      mermaidContent += `    ${diseaseId} --> |"${disease.associationType}"| E[Association Type]\n`;
      
      // Add mutations for each disease
      disease.mutations?.forEach((mutation, mutIndex) => {
        const mutId = `M${index + 1}_${mutIndex + 1}`;
        mermaidContent += `    C --> ${mutId}[${mutation.change}]\n`;
        mermaidContent += `    ${mutId} --> |"${mutation.effect}"| F[Mutation Effect]\n`;
      });
    });

    return {
      type: 'mermaid',
      title: `Disease Associations: ${this.geneSymbol}`,
      content: mermaidContent,
      description: `Disease associations and mutations for ${this.geneSymbol}`,
      metadata: {
        geneSymbol: this.geneSymbol,
        organism: this.organism,
        dataSource: 'disease_data',
        confidence: 0.8
      }
    };
  }

  // Generate regulatory circuit
  generateRegulatoryCircuit(expressionData: ExpressionData, interactionData: InteractionData): GeneVisualization {
    let mermaidContent = `graph TD\n`;
    
    // Add central gene
    mermaidContent += `    A[${this.geneSymbol}] --> B[Transcription Factors]\n`;
    mermaidContent += `    A --> C[Regulatory Elements]\n`;
    mermaidContent += `    A --> D[Post-translational Modifications]\n`;
    
    // Add transcription factors
    const tfs = interactionData.proteinInteractions?.filter(i => 
      i.interactionType === 'regulatory'
    ) || [];
    
    tfs.forEach((tf, index) => {
      const tfId = `TF${index + 1}`;
      mermaidContent += `    B --> ${tfId}[${tf.partnerSymbol}]\n`;
      mermaidContent += `    ${tfId} --> |"regulates"| E[Gene Expression]\n`;
    });
    
    // Add regulatory elements
    mermaidContent += `    C --> F[Promoter]\n`;
    mermaidContent += `    C --> G[Enhancer]\n`;
    mermaidContent += `    C --> H[Silencer]\n`;
    
    // Add PTMs
    mermaidContent += `    D --> I[Phosphorylation]\n`;
    mermaidContent += `    D --> J[Acetylation]\n`;
    mermaidContent += `    D --> K[Ubiquitination]\n`;

    return {
      type: 'mermaid',
      title: `Regulatory Circuit: ${this.geneSymbol}`,
      content: mermaidContent,
      description: `Regulatory mechanisms controlling ${this.geneSymbol} expression`,
      metadata: {
        geneSymbol: this.geneSymbol,
        organism: this.organism,
        dataSource: 'regulatory_data',
        confidence: 0.7
      }
    };
  }

  // Generate protein domain organization
  generateDomainOrganization(proteinInfo: ProteinInfo): GeneVisualization {
    const domains = proteinInfo.proteinDomains || [];
    
    let mermaidContent = `graph LR\n`;
    
    // Add protein backbone
    mermaidContent += `    A[N-terminal] --> B[Protein Backbone]\n`;
    mermaidContent += `    B --> C[C-terminal]\n`;
    
    // Add domains in order
    domains.forEach((domain, index) => {
      const domainId = `D${index + 1}`;
      mermaidContent += `    B --> ${domainId}[${domain.name}]\n`;
      mermaidContent += `    ${domainId} --> |"${domain.type}"| E[Domain Function]\n`;
    });

    return {
      type: 'mermaid',
      title: `Domain Organization: ${this.geneSymbol}`,
      content: mermaidContent,
      description: `Protein domain organization for ${this.geneSymbol}`,
      metadata: {
        geneSymbol: this.geneSymbol,
        organism: this.organism,
        dataSource: 'protein_structure',
        confidence: 0.8
      }
    };
  }

  // Generate metabolic pathway
  generateMetabolicPathway(functionalData: FunctionalData): GeneVisualization {
    let mermaidContent = `graph TD\n`;
    
    // Add central enzyme
    mermaidContent += `    A[${this.geneSymbol}] --> B[Substrate]\n`;
    mermaidContent += `    A --> C[Product]\n`;
    mermaidContent += `    A --> D[Cofactor]\n`;
    
    // Add catalytic reaction
    mermaidContent += `    B --> |"catalyzed by"| A\n`;
    mermaidContent += `    A --> |"produces"| C\n`;
    mermaidContent += `    D --> |"required"| A\n`;
    
    // Add biological processes
    functionalData.biologicalProcess?.forEach((process, index) => {
      const procId = `P${index + 1}`;
      mermaidContent += `    A --> ${procId}["${process}"]\n`;
    });

    return {
      type: 'mermaid',
      title: `Metabolic Pathway: ${this.geneSymbol}`,
      content: mermaidContent,
      description: `Metabolic pathway involving ${this.geneSymbol}`,
      metadata: {
        geneSymbol: this.geneSymbol,
        organism: this.organism,
        dataSource: 'functional_data',
        confidence: 0.7
      }
    };
  }

  // Generate comprehensive gene overview
  generateGeneOverview(
    geneInfo: GeneBasicInfo,
    functionalData: FunctionalData,
    proteinInfo: ProteinInfo
  ): GeneVisualization {
    let mermaidContent = `graph TD\n`;
    
    // Add central gene
    mermaidContent += `    A[${this.geneSymbol}] --> B[Gene Information]\n`;
    mermaidContent += `    A --> C[Protein Information]\n`;
    mermaidContent += `    A --> D[Functional Data]\n`;
    
    // Add gene information
    mermaidContent += `    B --> E[Gene ID: ${geneInfo.geneID || 'Unknown'}]\n`;
    mermaidContent += `    B --> F[Location: ${geneInfo.chromosomalLocation || 'Unknown'}]\n`;
    mermaidContent += `    B --> G[Type: ${geneInfo.geneType}]\n`;
    
    // Add protein information
    mermaidContent += `    C --> H[UniProt: ${proteinInfo.uniprotId || 'Unknown'}]\n`;
    mermaidContent += `    C --> I[Size: ${proteinInfo.proteinSize || 'Unknown'} aa]\n`;
    mermaidContent += `    C --> J[MW: ${proteinInfo.molecularWeight || 'Unknown'} kDa]\n`;
    
    // Add functional data
    mermaidContent += `    D --> K[EC: ${functionalData.enzymeClassification || 'Unknown'}]\n`;
    mermaidContent += `    D --> L[Function: ${functionalData.molecularFunction?.[0] || 'Unknown'}]\n`;

    return {
      type: 'mermaid',
      title: `Gene Overview: ${this.geneSymbol}`,
      content: mermaidContent,
      description: `Comprehensive overview of ${this.geneSymbol}`,
      metadata: {
        geneSymbol: this.geneSymbol,
        organism: this.organism,
        dataSource: 'comprehensive',
        confidence: 0.9
      }
    };
  }

  // Generate all visualizations for a gene
  generateAllVisualizations(
    geneInfo: GeneBasicInfo,
    functionalData: FunctionalData,
    proteinInfo: ProteinInfo,
    expressionData: ExpressionData,
    interactionData: InteractionData,
    diseaseData: DiseaseData[],
    evolutionaryData: EvolutionaryData
  ): GeneVisualization[] {
    const visualizations: GeneVisualization[] = [];

    // Add all visualizations
    visualizations.push(this.generateGeneOverview(geneInfo, functionalData, proteinInfo));
    visualizations.push(this.generateProteinStructure(proteinInfo));
    visualizations.push(this.generatePathwayMap(functionalData, interactionData));
    visualizations.push(this.generateExpressionHeatmap(expressionData));
    visualizations.push(this.generateInteractionNetwork(interactionData));
    visualizations.push(this.generateEvolutionaryTree(evolutionaryData));
    visualizations.push(this.generateDiseaseAssociation(diseaseData));
    visualizations.push(this.generateRegulatoryCircuit(expressionData, interactionData));
    visualizations.push(this.generateDomainOrganization(proteinInfo));
    visualizations.push(this.generateMetabolicPathway(functionalData));

    return visualizations;
  }
}

// Utility functions for visualization generation
export function createGeneVisualizationGenerator(
  geneSymbol: string,
  organism: string
): GeneVisualizationGenerator {
  return new GeneVisualizationGenerator(geneSymbol, organism);
}

// Predefined visualization templates
export const GENE_VISUALIZATION_TEMPLATES = {
  PROTEIN_STRUCTURE: 'protein_structure',
  PATHWAY_MAP: 'pathway_map',
  EXPRESSION_HEATMAP: 'expression_heatmap',
  INTERACTION_NETWORK: 'interaction_network',
  EVOLUTIONARY_TREE: 'evolutionary_tree',
  DISEASE_ASSOCIATION: 'disease_association',
  REGULATORY_CIRCUIT: 'regulatory_circuit',
  DOMAIN_ORGANIZATION: 'domain_organization',
  METABOLIC_PATHWAY: 'metabolic_pathway',
  GENE_OVERVIEW: 'gene_overview'
};

// Visualization quality metrics
export interface VisualizationQuality {
  completeness: number;
  accuracy: number;
  clarity: number;
  scientificRigor: number;
  overallScore: number;
}

export function calculateVisualizationQuality(
  visualization: GeneVisualization,
  dataCompleteness: number
): VisualizationQuality {
  const completeness = dataCompleteness;
  const accuracy = visualization.metadata?.confidence || 0.5;
  const clarity = 0.8; // Based on visualization type and content
  const scientificRigor = 0.7; // Based on data source and methodology
  
  const overallScore = (completeness + accuracy + clarity + scientificRigor) / 4;
  
  return {
    completeness,
    accuracy,
    clarity,
    scientificRigor,
    overallScore
  };
}
