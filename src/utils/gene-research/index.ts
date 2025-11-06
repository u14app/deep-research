// Main gene research integration system
// Comprehensive gene research workflow orchestration

import { GeneQueryGenerator, createGeneQueryGenerator } from './query-generator';
import { createGeneSearchProvider } from './search-providers';
import { GeneDataExtractor } from './data-extractor';
import { GeneVisualizationGenerator, createGeneVisualizationGenerator } from './visualization-generators';
import { GeneResearchQualityControl, createGeneQualityControl } from './quality-control';
import { GeneAPIIntegrations, createGeneAPIIntegrations } from './api-integrations';
import { generateGeneReportTemplate } from './report-templates';
import { 
  GeneResearchWorkflow, 
  GeneSearchTask, 
  GeneDataExtractionResult,
  GeneResearchQualityMetrics 
} from '@/types/gene-research';

export interface GeneResearchConfig {
  geneSymbol: string;
  organism: string;
  researchFocus?: string[];
  specificAspects?: string[];
  diseaseContext?: string;
  experimentalApproach?: string;
  userPrompt?: string;
  targetAudience?: 'researchers' | 'clinicians' | 'students' | 'general';
  reportType?: 'comprehensive' | 'focused' | 'comparative';
  enableAPIIntegration?: boolean;
  enableQualityControl?: boolean;
  enableVisualization?: boolean;
  maxSearchResults?: number;
  searchProviders?: string[];
}

export interface GeneResearchResult {
  workflow: GeneResearchWorkflow;
  qualityMetrics: GeneResearchQualityMetrics;
  visualizations: any[];
  report: any;
  metadata: {
    researchTime: number;
    dataSources: string[];
    confidence: number;
    completeness: number;
  };
}

export class GeneResearchEngine {
  private config: GeneResearchConfig;
  private queryGenerator: GeneQueryGenerator;
  private dataExtractor: GeneDataExtractor;
  private visualizationGenerator: GeneVisualizationGenerator;
  private qualityControl: GeneResearchQualityControl;
  private apiIntegrations: GeneAPIIntegrations;

  constructor(config: GeneResearchConfig) {
    this.config = config;
    this.queryGenerator = createGeneQueryGenerator({
      geneSymbol: config.geneSymbol,
      organism: config.organism,
      researchFocus: config.researchFocus,
      specificAspects: config.specificAspects,
      diseaseContext: config.diseaseContext,
      experimentalApproach: config.experimentalApproach
    });
    this.dataExtractor = new GeneDataExtractor(config.geneSymbol, config.organism);
    this.visualizationGenerator = createGeneVisualizationGenerator(config.geneSymbol, config.organism);
    this.qualityControl = createGeneQualityControl(config.geneSymbol, config.organism);
    this.apiIntegrations = createGeneAPIIntegrations(config.geneSymbol, config.organism);
  }

  async conductResearch(): Promise<GeneResearchResult> {
    const startTime = Date.now();
    
    try {
      // Phase 1: Generate research queries
      console.log('Phase 1: Generating research queries...');
      const queries = this.generateResearchQueries();
      
      // Phase 2: Execute searches
      console.log('Phase 2: Executing searches...');
      const searchResults = await this.executeSearches(queries);
      
      // Phase 3: Extract and process data
      console.log('Phase 3: Extracting and processing data...');
      const extractedData = await this.extractAndProcessData(searchResults);
      
      // Phase 4: API integration (if enabled)
      let apiData = null;
      if (this.config.enableAPIIntegration) {
        console.log('Phase 4: Integrating API data...');
        apiData = await this.integrateAPIData();
      }
      
      // Phase 5: Generate visualizations
      let visualizations: any[] = [];
      if (this.config.enableVisualization) {
        console.log('Phase 5: Generating visualizations...');
        visualizations = this.generateVisualizations(extractedData);
      }
      
      // Phase 6: Quality control
      let qualityMetrics: GeneResearchQualityMetrics;
      if (this.config.enableQualityControl) {
        console.log('Phase 6: Performing quality control...');
        qualityMetrics = this.performQualityControl(extractedData);
      } else {
        qualityMetrics = this.getDefaultQualityMetrics();
      }
      
      // Phase 7: Generate report
      console.log('Phase 7: Generating research report...');
      const report = this.generateReport(extractedData, visualizations, qualityMetrics);
      
      // Phase 8: Compile workflow
      const workflow = this.compileWorkflow(extractedData);
      
      const researchTime = Date.now() - startTime;
      
      return {
        workflow,
        qualityMetrics,
        visualizations,
        report,
        metadata: {
          researchTime,
          dataSources: this.getDataSources(searchResults, apiData),
          confidence: qualityMetrics.overallQuality,
          completeness: qualityMetrics.dataCompleteness
        }
      };
    } catch (error) {
      console.error('Gene research error:', error);
      throw new Error(`Gene research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateResearchQueries(): GeneSearchTask[] {
    if (this.config.specificAspects && this.config.specificAspects.length > 0) {
      return this.queryGenerator.generateFocusedQueries(this.config.specificAspects);
    }
    return this.queryGenerator.generateComprehensiveQueries();
  }

  private async executeSearches(queries: GeneSearchTask[]): Promise<Map<string, any>> {
    const searchResults = new Map<string, any>();
    const searchProviders = this.config.searchProviders || ['pubmed', 'uniprot', 'ncbi_gene', 'geo', 'pdb', 'kegg', 'string', 'omim', 'ensembl', 'reactome'];

    for (const query of queries) {
      try {
        const provider = query.database || 'pubmed';
        if (searchProviders.includes(provider)) {
          const result = await createGeneSearchProvider({
            provider,
            query: query.query,
            geneSymbol: this.config.geneSymbol,
            organism: this.config.organism,
            maxResult: this.config.maxSearchResults || 10
          });
          
          searchResults.set(query.query, result);
        }
      } catch (error) {
        console.error(`Search error for query "${query.query}":`, error);
      }
    }

    return searchResults;
  }

  private async extractAndProcessData(searchResults: Map<string, any>): Promise<GeneDataExtractionResult> {
    const extractedData: Partial<GeneDataExtractionResult> = {
      geneBasicInfo: {
        geneSymbol: this.config.geneSymbol,
        organism: this.config.organism,
        geneID: '',
        alternativeNames: [],
        chromosomalLocation: '',
        genomicCoordinates: {
          chromosome: '',
          start: 0,
          end: 0,
          strand: '+' as const
        },
        geneType: 'protein_coding',
        description: ''
      },
      functionalData: {
        molecularFunction: [],
        biologicalProcess: [],
        cellularComponent: [],
        catalyticActivity: '',
        substrateSpecificity: '',
        bindingSites: [],
        enzymeClassification: ''
      },
      proteinInfo: {
        uniprotId: '',
        proteinName: '',
        proteinSize: 0,
        molecularWeight: 0,
        isoelectricPoint: 0,
        subcellularLocation: [],
        proteinDomains: [],
        bindingSites: [],
        catalyticActivity: '',
        cofactors: [],
        postTranslationalModifications: []
      },
      expressionData: {
        tissueSpecificity: [],
        developmentalStage: [],
        environmentalResponse: [],
        expressionLevel: { high: [], medium: [], low: [] },
        regulation: []
      },
      interactionData: {
        proteinInteractions: [],
        dnaInteractions: [],
        rnaInteractions: [],
        smallMoleculeInteractions: [],
        complexes: []
      },
      diseaseData: [],
      evolutionaryData: {
        orthologs: [],
        paralogs: [],
        geneFamily: '',
        conservation: {
          overallConservation: 'medium',
          conservedDomains: [],
          variableRegions: [],
          functionalConservation: 'medium'
        },
        duplicationEvents: []
      },
      literatureReferences: [],
      qualityScore: 0,
      extractionMetadata: {
        extractionTime: 0,
        sources: [],
        confidence: 0,
        completeness: 0
      }
    };

    // Process each search result
    for (const [, result] of searchResults) {
      if (result.sources && result.sources.length > 0) {
        for (const source of result.sources) {
          const content = `${source.title}\n${source.content}`;
          const partialData = await this.dataExtractor.extractFromContent(content, source.database || 'unknown');
          
          // Merge extracted data
          this.mergeExtractedData(extractedData, partialData);
        }
      }
    }

    return extractedData as GeneDataExtractionResult;
  }

  private mergeExtractedData(target: Partial<GeneDataExtractionResult>, source: Partial<GeneDataExtractionResult>): void {
    // Merge gene basic info
    if (source.geneBasicInfo) {
      Object.assign(target.geneBasicInfo!, source.geneBasicInfo);
    }

    // Merge functional data
    if (source.functionalData) {
      Object.assign(target.functionalData!, source.functionalData);
    }

    // Merge protein info
    if (source.proteinInfo) {
      Object.assign(target.proteinInfo!, source.proteinInfo);
    }

    // Merge expression data
    if (source.expressionData) {
      Object.assign(target.expressionData!, source.expressionData);
    }

    // Merge interaction data
    if (source.interactionData) {
      Object.assign(target.interactionData!, source.interactionData);
    }

    // Merge disease data
    if (source.diseaseData) {
      target.diseaseData!.push(...source.diseaseData);
    }

    // Merge evolutionary data
    if (source.evolutionaryData) {
      Object.assign(target.evolutionaryData!, source.evolutionaryData);
    }

    // Merge literature references
    if (source.literatureReferences) {
      target.literatureReferences!.push(...source.literatureReferences);
    }
  }

  private async integrateAPIData(): Promise<any> {
    try {
      return await this.apiIntegrations.fetchAllData();
    } catch (error) {
      console.error('API integration error:', error);
      return null;
    }
  }

  private generateVisualizations(extractedData: GeneDataExtractionResult): any[] {
    try {
      return this.visualizationGenerator.generateAllVisualizations(
        extractedData.geneBasicInfo,
        extractedData.functionalData,
        extractedData.proteinInfo,
        extractedData.expressionData,
        extractedData.interactionData,
        extractedData.diseaseData,
        extractedData.evolutionaryData
      );
    } catch (error) {
      console.error('Visualization generation error:', error);
      return [];
    }
  }

  private performQualityControl(extractedData: GeneDataExtractionResult): GeneResearchQualityMetrics {
    try {
      const qualityResult = this.qualityControl.assessQuality(
        extractedData.geneBasicInfo,
        extractedData.functionalData,
        extractedData.proteinInfo,
        extractedData.expressionData,
        extractedData.interactionData,
        extractedData.diseaseData,
        extractedData.evolutionaryData,
        extractedData.literatureReferences
      );

      return {
        dataCompleteness: qualityResult.categoryScores.dataCompleteness,
        literatureCoverage: qualityResult.categoryScores.literatureCoverage,
        experimentalEvidence: qualityResult.categoryScores.experimentalEvidence,
        crossSpeciesValidation: qualityResult.categoryScores.crossSpeciesValidation,
        databaseConsistency: qualityResult.categoryScores.databaseConsistency,
        overallQuality: qualityResult.overallScore
      };
    } catch (error) {
      console.error('Quality control error:', error);
      return this.getDefaultQualityMetrics();
    }
  }

  private getDefaultQualityMetrics(): GeneResearchQualityMetrics {
    return {
      dataCompleteness: 0.5,
      literatureCoverage: 0.5,
      experimentalEvidence: 0.5,
      crossSpeciesValidation: 0.5,
      databaseConsistency: 0.5,
      overallQuality: 0.5
    };
  }

  private generateReport(extractedData: GeneDataExtractionResult, visualizations: any[], qualityMetrics: GeneResearchQualityMetrics): any {
    try {
      const reportTemplate = generateGeneReportTemplate(
        this.config.geneSymbol,
        this.config.organism,
        this.config.reportType || 'comprehensive',
        this.config.targetAudience || 'researchers'
      );

      // Add extracted data to report
      reportTemplate.sections.forEach(section => {
        section.content = this.populateReportSection(section, extractedData, qualityMetrics);
      });

      // Add visualizations to report
      reportTemplate.sections.forEach(section => {
        if (section.visualizations) {
          section.visualizations.push(...visualizations.filter(viz => 
            viz.metadata?.geneSymbol === this.config.geneSymbol
          ));
        }
      });

      return reportTemplate;
    } catch (error) {
      console.error('Report generation error:', error);
      return { error: 'Report generation failed' };
    }
  }

  private populateReportSection(section: any, extractedData: GeneDataExtractionResult, qualityMetrics: GeneResearchQualityMetrics): string {
    let content = section.content;

    // Replace placeholders with actual data
    content = content.replace(/\[specific function\]/g, extractedData.functionalData.catalyticActivity || 'Unknown');
    content = content.replace(/\[specific function\]/g, extractedData.functionalData.molecularFunction?.[0] || 'Unknown');
    content = content.replace(/\[specific function\]/g, extractedData.functionalData.biologicalProcess?.[0] || 'Unknown');

    // Add quality metrics
    content += `\n\n### Data Quality Metrics\n`;
    content += `- **Overall Quality**: ${(qualityMetrics.overallQuality * 100).toFixed(1)}%\n`;
    content += `- **Data Completeness**: ${(qualityMetrics.dataCompleteness * 100).toFixed(1)}%\n`;
    content += `- **Literature Coverage**: ${(qualityMetrics.literatureCoverage * 100).toFixed(1)}%\n`;
    content += `- **Experimental Evidence**: ${(qualityMetrics.experimentalEvidence * 100).toFixed(1)}%\n`;

    return content;
  }

  private compileWorkflow(extractedData: GeneDataExtractionResult): GeneResearchWorkflow {
    return {
      geneIdentification: extractedData.geneBasicInfo,
      functionalAnalysis: extractedData.functionalData,
      proteinInfo: extractedData.proteinInfo,
      expressionAnalysis: extractedData.expressionData,
      regulatoryAnalysis: extractedData.expressionData.regulation || [],
      interactionAnalysis: extractedData.interactionData,
      diseaseAnalysis: extractedData.diseaseData,
      evolutionaryAnalysis: extractedData.evolutionaryData,
      literatureReview: extractedData.literatureReferences
    };
  }

  private getDataSources(searchResults: Map<string, any>, apiData: any): string[] {
    const sources = new Set<string>();

    // Add search result sources
    for (const result of searchResults.values()) {
      if (result.sources) {
        result.sources.forEach((source: any) => {
          if (source.database) {
            sources.add(source.database);
          }
        });
      }
    }

    // Add API sources
    if (apiData) {
      Object.keys(apiData).forEach(api => {
        if (apiData[api].success) {
          sources.add(api);
        }
      });
    }

    return Array.from(sources);
  }
}

// Factory function for creating gene research engine
export function createGeneResearchEngine(config: GeneResearchConfig): GeneResearchEngine {
  return new GeneResearchEngine(config);
}

// Utility functions for gene research
export function validateGeneResearchConfig(config: GeneResearchConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.geneSymbol || config.geneSymbol.trim() === '') {
    errors.push('Gene symbol is required');
  }

  if (!config.organism || config.organism.trim() === '') {
    errors.push('Organism is required');
  }

  if (config.geneSymbol && !/^[A-Za-z][A-Za-z0-9]*$/.test(config.geneSymbol)) {
    errors.push('Invalid gene symbol format');
  }

  if (config.maxSearchResults && (config.maxSearchResults < 1 || config.maxSearchResults > 100)) {
    errors.push('Max search results must be between 1 and 100');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Predefined research configurations
export const GENE_RESEARCH_PRESETS = {
  COMPREHENSIVE: {
    reportType: 'comprehensive' as const,
    targetAudience: 'researchers' as const,
    enableAPIIntegration: true,
    enableQualityControl: true,
    enableVisualization: true,
    maxSearchResults: 20,
    searchProviders: ['pubmed', 'uniprot', 'ncbi_gene', 'geo', 'pdb', 'kegg', 'string', 'omim', 'ensembl', 'reactome']
  },
  
  CLINICAL: {
    reportType: 'focused' as const,
    targetAudience: 'clinicians' as const,
    specificAspects: ['disease', 'therapeutic', 'clinical'],
    enableAPIIntegration: true,
    enableQualityControl: true,
    enableVisualization: true,
    maxSearchResults: 15,
    searchProviders: ['pubmed', 'uniprot', 'ncbi_gene']
  },
  
  EDUCATIONAL: {
    reportType: 'comprehensive' as const,
    targetAudience: 'students' as const,
    enableAPIIntegration: false,
    enableQualityControl: true,
    enableVisualization: true,
    maxSearchResults: 10,
    searchProviders: ['pubmed', 'uniprot', 'ncbi_gene']
  },
  
  QUICK: {
    reportType: 'focused' as const,
    targetAudience: 'researchers' as const,
    enableAPIIntegration: false,
    enableQualityControl: false,
    enableVisualization: false,
    maxSearchResults: 5,
    searchProviders: ['pubmed', 'uniprot']
  }
};

// Main gene research function for MCP Server
export async function conductGeneResearch(
  config: GeneResearchConfig
): Promise<GeneResearchResult> {
  const engine = new GeneResearchEngine(config);
  return await engine.conductResearch();
}

// Export all gene research utilities
export * from './query-generator';
export * from './search-providers';
export * from './data-extractor';
export * from './visualization-generators';
export * from './quality-control';
export * from './api-integrations';
export * from './report-templates';
