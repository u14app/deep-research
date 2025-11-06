// Quality control system for gene research
// Comprehensive quality assessment and validation for molecular biology data

import { 
  GeneBasicInfo,
  FunctionalData,
  ProteinInfo,
  ExpressionData,
  InteractionData,
  DiseaseData,
  EvolutionaryData,
  LiteratureReference
} from '@/types/gene-research';

export interface QualityControlResult {
  overallScore: number;
  categoryScores: {
    dataCompleteness: number;
    literatureCoverage: number;
    experimentalEvidence: number;
    crossSpeciesValidation: number;
    databaseConsistency: number;
    scientificRigor: number;
  };
  issues: QualityIssue[];
  recommendations: string[];
  confidence: number;
}

export interface QualityIssue {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  impact: string;
}

export class GeneResearchQualityControl {
  private geneSymbol: string;
  private organism: string;
  private qualityThresholds: QualityThresholds;

  constructor(geneSymbol: string, organism: string) {
    this.geneSymbol = geneSymbol;
    this.organism = organism;
    this.qualityThresholds = new QualityThresholds();
  }

  assessQuality(
    geneInfo: GeneBasicInfo,
    functionalData: FunctionalData,
    proteinInfo: ProteinInfo,
    expressionData: ExpressionData,
    interactionData: InteractionData,
    diseaseData: DiseaseData[],
    evolutionaryData: EvolutionaryData,
    literatureReferences: LiteratureReference[]
  ): QualityControlResult {
    const issues: QualityIssue[] = [];
    const recommendations: string[] = [];

    // Assess data completeness
    const dataCompleteness = this.assessDataCompleteness(
      geneInfo, functionalData, proteinInfo, expressionData, 
      interactionData, diseaseData, evolutionaryData
    );

    // Assess literature coverage
    const literatureCoverage = this.assessLiteratureCoverage(literatureReferences, issues);

    // Assess experimental evidence
    const experimentalEvidence = this.assessExperimentalEvidence(literatureReferences, issues);

    // Assess cross-species validation
    const crossSpeciesValidation = this.assessCrossSpeciesValidation(evolutionaryData, issues);

    // Assess database consistency
    const databaseConsistency = this.assessDatabaseConsistency(
      geneInfo, proteinInfo, functionalData, issues
    );

    // Assess scientific rigor
    const scientificRigor = this.assessScientificRigor(literatureReferences, issues);

    // Calculate overall score
    const overallScore = (
      dataCompleteness + literatureCoverage + experimentalEvidence + 
      crossSpeciesValidation + databaseConsistency + scientificRigor
    ) / 6;

    // Calculate confidence
    const confidence = this.calculateConfidence(overallScore, issues);

    return {
      overallScore,
      categoryScores: {
        dataCompleteness,
        literatureCoverage,
        experimentalEvidence,
        crossSpeciesValidation,
        databaseConsistency,
        scientificRigor
      },
      issues,
      recommendations,
      confidence
    };
  }

  private assessDataCompleteness(
    geneInfo: GeneBasicInfo,
    functionalData: FunctionalData,
    proteinInfo: ProteinInfo,
    expressionData: ExpressionData,
    interactionData: InteractionData,
    diseaseData: DiseaseData[],
    evolutionaryData: EvolutionaryData
  ): number {
    let score = 0;
    let maxScore = 0;

    // Gene basic information (20 points)
    maxScore += 20;
    if (geneInfo.geneID) score += 5;
    if (geneInfo.description) score += 5;
    if (geneInfo.chromosomalLocation) score += 5;
    if (geneInfo.alternativeNames?.length) score += 5;

    // Functional data (25 points)
    maxScore += 25;
    if (functionalData.molecularFunction?.length) score += 8;
    if (functionalData.catalyticActivity) score += 8;
    if (functionalData.enzymeClassification) score += 9;

    // Protein information (20 points)
    maxScore += 20;
    if (proteinInfo.uniprotId) score += 10;
    if (proteinInfo.proteinSize) score += 5;
    if (proteinInfo.molecularWeight) score += 5;

    // Expression data (15 points)
    maxScore += 15;
    if (expressionData.tissueSpecificity?.length) score += 15;

    // Interaction data (10 points)
    maxScore += 10;
    if (interactionData.proteinInteractions?.length) score += 10;

    // Disease data (5 points)
    maxScore += 5;
    if (diseaseData.length) score += 5;

    // Evolutionary data (5 points)
    maxScore += 5;
    if (evolutionaryData.orthologs?.length) score += 5;

    return maxScore > 0 ? score / maxScore : 0;
  }

  private assessLiteratureCoverage(
    literatureReferences: LiteratureReference[],
    issues: QualityIssue[]
  ): number {
    const totalRefs = literatureReferences.length;
    let score = 0;

    if (totalRefs === 0) {
      issues.push({
        category: 'literature',
        severity: 'critical',
        description: 'No literature references found',
        recommendation: 'Search for additional literature sources',
        impact: 'Severely limits research credibility'
      });
      return 0;
    }

    // Base score for having references
    score += 0.3;

    // Score based on number of references
    if (totalRefs >= 20) score += 0.3;
    else if (totalRefs >= 10) score += 0.2;
    else if (totalRefs >= 5) score += 0.1;

    // Score based on reference quality
    const highQualityRefs = literatureReferences.filter(ref => ref.relevance === 'high').length;
    const qualityRatio = highQualityRefs / totalRefs;
    score += qualityRatio * 0.4;

    // Check for recent references
    const recentRefs = literatureReferences.filter(ref => 
      new Date().getFullYear() - ref.year <= 5
    ).length;
    const recentRatio = recentRefs / totalRefs;
    score += recentRatio * 0.2;

    if (recentRatio < 0.3) {
      issues.push({
        category: 'literature',
        severity: 'medium',
        description: 'Limited recent literature coverage',
        recommendation: 'Include more recent publications',
        impact: 'May miss recent developments'
      });
    }

    if (qualityRatio < 0.5) {
      issues.push({
        category: 'literature',
        severity: 'medium',
        description: 'Low proportion of high-quality references',
        recommendation: 'Focus on high-impact journals and reviews',
        impact: 'Reduces research credibility'
      });
    }

    return Math.min(score, 1.0);
  }

  private assessExperimentalEvidence(
    literatureReferences: LiteratureReference[],
    issues: QualityIssue[]
  ): number {
    const experimentalRefs = literatureReferences.filter(ref => 
      ref.studyType === 'experimental'
    ).length;
    const totalRefs = literatureReferences.length;

    if (totalRefs === 0) return 0;

    const experimentalRatio = experimentalRefs / totalRefs;
    const score = experimentalRatio;

    if (experimentalRatio < 0.3) {
      issues.push({
        category: 'evidence',
        severity: 'high',
        description: 'Limited experimental evidence',
        recommendation: 'Include more experimental studies',
        impact: 'Weakens research conclusions'
      });
    }

    if (experimentalRatio < 0.1) {
      issues.push({
        category: 'evidence',
        severity: 'critical',
        description: 'Very limited experimental evidence',
        recommendation: 'Prioritize experimental validation',
        impact: 'Severely limits research validity'
      });
    }

    return score;
  }

  private assessCrossSpeciesValidation(
    evolutionaryData: EvolutionaryData,
    issues: QualityIssue[]
  ): number {
    let score = 0;

    if (evolutionaryData.orthologs?.length) {
      score += 0.5;
      
      if (evolutionaryData.orthologs.length >= 5) {
        score += 0.3;
      }

      // Check for functional conservation
      const conservedOrthologs = evolutionaryData.orthologs.filter(orth => 
        orth.identity > 70
      ).length;
      
      if (conservedOrthologs > 0) {
        score += 0.2;
      }
    } else {
      issues.push({
        category: 'validation',
        severity: 'medium',
        description: 'No ortholog information available',
        recommendation: 'Include cross-species analysis',
        impact: 'Limits evolutionary validation'
      });
    }

    if (evolutionaryData.paralogs?.length) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private assessDatabaseConsistency(
    geneInfo: GeneBasicInfo,
    proteinInfo: ProteinInfo,
    functionalData: FunctionalData,
    issues: QualityIssue[]
  ): number {
    let score = 0.5; // Base score
    let inconsistencies = 0;

    // Check gene ID consistency
    if (geneInfo.geneID && proteinInfo.uniprotId) {
      score += 0.2;
    } else {
      inconsistencies++;
    }

    // Check molecular function consistency
    if (functionalData.molecularFunction?.length && functionalData.catalyticActivity) {
      score += 0.2;
    } else {
      inconsistencies++;
    }

    // Check protein information consistency
    if (proteinInfo.proteinSize && proteinInfo.molecularWeight) {
      score += 0.1;
    } else {
      inconsistencies++;
    }

    if (inconsistencies > 2) {
      issues.push({
        category: 'consistency',
        severity: 'medium',
        description: 'Database inconsistencies detected',
        recommendation: 'Verify data across multiple sources',
        impact: 'May affect research accuracy'
      });
    }

    return Math.min(score, 1.0);
  }

  private assessScientificRigor(
    literatureReferences: LiteratureReference[],
    issues: QualityIssue[]
  ): number {
    let score = 0.5; // Base score

    // Check for review articles
    const reviewRefs = literatureReferences.filter(ref => 
      ref.studyType === 'review'
    ).length;
    
    if (reviewRefs > 0) {
      score += 0.2;
    }

    // Check for meta-analyses
    const metaRefs = literatureReferences.filter(ref => 
      ref.studyType === 'meta_analysis'
    ).length;
    
    if (metaRefs > 0) {
      score += 0.2;
    }

    // Check for high-impact journals
    const highImpactRefs = literatureReferences.filter(ref => 
      this.isHighImpactJournal(ref.journal)
    ).length;
    
    if (highImpactRefs > 0) {
      score += 0.1;
    }

    // Check for multiple methodologies
    const methodologies = new Set(
      literatureReferences.flatMap(ref => ref.methodology)
    );
    
    if (methodologies.size >= 3) {
      score += 0.1;
    } else if (methodologies.size < 2) {
      issues.push({
        category: 'rigor',
        severity: 'medium',
        description: 'Limited methodological diversity',
        recommendation: 'Include studies with different methodologies',
        impact: 'May limit comprehensive understanding'
      });
    }

    return Math.min(score, 1.0);
  }

  private isHighImpactJournal(journal: string): boolean {
    const highImpactJournals = [
      'Nature', 'Science', 'Cell', 'Nature Genetics', 'Nature Medicine',
      'Nature Biotechnology', 'Nature Methods', 'Nature Reviews',
      'Cell Metabolism', 'Cell Reports', 'Molecular Cell',
      'Genes & Development', 'Developmental Cell', 'Current Biology',
      'PLOS Biology', 'eLife', 'Genome Research', 'Nucleic Acids Research'
    ];

    return highImpactJournals.some(highImpact => 
      journal.toLowerCase().includes(highImpact.toLowerCase())
    );
  }

  private calculateConfidence(overallScore: number, issues: QualityIssue[]): number {
    let confidence = overallScore;

    // Reduce confidence based on critical issues
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
    confidence -= criticalIssues * 0.2;

    // Reduce confidence based on high severity issues
    const highIssues = issues.filter(issue => issue.severity === 'high').length;
    confidence -= highIssues * 0.1;

    // Reduce confidence based on medium severity issues
    const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;
    confidence -= mediumIssues * 0.05;

    return Math.max(confidence, 0);
  }
}

// Quality thresholds configuration
export class QualityThresholds {
  readonly dataCompleteness: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  } = {
    excellent: 0.9,
    good: 0.7,
    fair: 0.5,
    poor: 0.3
  };

  readonly literatureCoverage: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  } = {
    excellent: 0.8,
    good: 0.6,
    fair: 0.4,
    poor: 0.2
  };

  readonly experimentalEvidence: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  } = {
    excellent: 0.8,
    good: 0.6,
    fair: 0.4,
    poor: 0.2
  };

  getQualityLevel(score: number, category: keyof QualityThresholds): string {
    const thresholds = this[category];
    
    if (typeof thresholds === 'function') {
      return thresholds(score, category);
    }
    
    if (score >= thresholds.excellent) return 'excellent';
    if (score >= thresholds.good) return 'good';
    if (score >= thresholds.fair) return 'fair';
    return 'poor';
  }
}

// Quality control utilities
export function validateGeneSymbol(geneSymbol: string): boolean {
  // Basic validation for gene symbols
  const geneSymbolPattern = /^[A-Za-z][A-Za-z0-9]*$/;
  return geneSymbolPattern.test(geneSymbol) && geneSymbol.length <= 10;
}

export function validateOrganism(organism: string): boolean {
  // Common organism names
  const validOrganisms = [
    'Homo sapiens', 'Mus musculus', 'Rattus norvegicus', 'Drosophila melanogaster',
    'Caenorhabditis elegans', 'Saccharomyces cerevisiae', 'Escherichia coli',
    'Arabidopsis thaliana', 'Danio rerio', 'Xenopus laevis'
  ];
  
  return validOrganisms.some(validOrg => 
    organism.toLowerCase().includes(validOrg.toLowerCase())
  );
}

export function validateFunctionalData(functionalData: FunctionalData): boolean {
  return !!(
    functionalData.molecularFunction?.length ||
    functionalData.catalyticActivity ||
    functionalData.enzymeClassification
  );
}

export function validateExpressionData(expressionData: ExpressionData): boolean {
  return !!(
    expressionData.tissueSpecificity?.length ||
    expressionData.developmentalStage?.length ||
    expressionData.environmentalResponse?.length
  );
}

// Quality improvement recommendations
export function generateQualityImprovements(result: QualityControlResult): string[] {
  const improvements: string[] = [];

  if (result.categoryScores.dataCompleteness < 0.7) {
    improvements.push('Increase data completeness by gathering more comprehensive gene information');
  }

  if (result.categoryScores.literatureCoverage < 0.6) {
    improvements.push('Expand literature coverage with additional high-quality references');
  }

  if (result.categoryScores.experimentalEvidence < 0.5) {
    improvements.push('Include more experimental studies to strengthen evidence base');
  }

  if (result.categoryScores.crossSpeciesValidation < 0.4) {
    improvements.push('Add cross-species analysis and evolutionary validation');
  }

  if (result.categoryScores.databaseConsistency < 0.6) {
    improvements.push('Verify data consistency across multiple databases');
  }

  if (result.categoryScores.scientificRigor < 0.6) {
    improvements.push('Include more rigorous scientific studies and reviews');
  }

  return improvements;
}

// Quality control factory
export function createGeneQualityControl(
  geneSymbol: string,
  organism: string
): GeneResearchQualityControl {
  return new GeneResearchQualityControl(geneSymbol, organism);
}
