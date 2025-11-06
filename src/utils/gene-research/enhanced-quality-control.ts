// Enhanced Quality Control System
// Integrates with literature validation to ensure research quality

import { LiteratureReference } from '@/types/gene-research';
import { EnhancedLiteratureReference } from './literature-validator';
import { ReferenceQualityStatistics } from './data-extractor';

/**
 * Quality assessment result interface
 */
export interface LiteratureQualityReport {
  overallScore: number; // 0-100
  authenticityIndex: number; // 0-100 - measures reference authenticity
  diversityIndex: number; // 0-100 - measures journal and author diversity
  recencyIndex: number; // 0-100 - measures publication recency
  citationPattern: 'healthy' | 'concentrated' | 'sparse';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  warnings: string[];
  statistics: {
    totalReferences: number;
    validatedReferences: number;
    highConfidenceReferences: number;
    referencesByYear: Record<string, number>;
    referencesByJournal: Record<string, number>;
    potentiallyFabricated: number;
  };
}

/**
 * Enhanced quality control class for literature references
 */
export class EnhancedQualityControl {
  private currentYear = new Date().getFullYear();
  private MAX_RECOMMENDED_REFERENCES_PER_JOURNAL = 0.3; // 30% maximum from a single journal
  private MIN_RECOMMENDED_YEAR_SPREAD = 5; // Minimum 5-year spread for recency index
  private MAX_ACCEPTABLE_UNVERIFIED_RATIO = 0.2; // 20% maximum unverified references

  /**
   * Assess literature quality based on enhanced references
   * @param references Array of enhanced literature references
   * @param referenceQuality Optional reference quality statistics
   * @returns Comprehensive quality report
   */
  assessLiteratureQuality(
    references: Array<LiteratureReference | EnhancedLiteratureReference>,
    referenceQuality?: ReferenceQualityStatistics
  ): LiteratureQualityReport {
    const enhancedReferences = references as EnhancedLiteratureReference[];
    
    // Calculate statistics
    const statistics = this.calculateStatistics(enhancedReferences, referenceQuality);
    
    // Calculate quality indices
    const authenticityIndex = this.calculateAuthenticityIndex(enhancedReferences, statistics);
    const diversityIndex = this.calculateDiversityIndex(enhancedReferences);
    const recencyIndex = this.calculateRecencyIndex(enhancedReferences);
    
    // Determine citation pattern
    const citationPattern = this.analyzeCitationPattern(enhancedReferences);
    
    // Identify strengths and weaknesses
    const { strengths, weaknesses, warnings } = this.identifyStrengthsAndWeaknesses(
      enhancedReferences, 
      statistics,
      { authenticityIndex, diversityIndex, recencyIndex, citationPattern }
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(weaknesses, warnings);
    
    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore({
      authenticityIndex, 
      diversityIndex, 
      recencyIndex 
    });
    
    return {
      overallScore,
      authenticityIndex,
      diversityIndex,
      recencyIndex,
      citationPattern,
      strengths,
      weaknesses,
      recommendations,
      warnings,
      statistics
    };
  }

  /**
   * Calculate statistics for the literature references
   */
  private calculateStatistics(
    references: EnhancedLiteratureReference[],
    referenceQuality?: ReferenceQualityStatistics
  ) {
    const statistics = {
      totalReferences: references.length,
      validatedReferences: referenceQuality?.validatedReferences || 0,
      highConfidenceReferences: referenceQuality?.highConfidenceReferences || 0,
      referencesByYear: {} as Record<string, number>,
      referencesByJournal: {} as Record<string, number>,
      potentiallyFabricated: 0
    };

    // Count references by year and journal
    references.forEach(ref => {
      // Count by year
      if (ref.year) {
        const year = ref.year.toString();
        statistics.referencesByYear[year] = (statistics.referencesByYear[year] || 0) + 1;
      }

      // Count by journal
      if (ref.journal) {
        statistics.referencesByJournal[ref.journal] = 
          (statistics.referencesByJournal[ref.journal] || 0) + 1;
      }

      // Identify potentially fabricated references
      if (!ref.qualityMetadata?.verified && ref.qualityMetadata?.confidenceScore < 30) {
        statistics.potentiallyFabricated++;
      }
    });

    return statistics;
  }

  /**
   * Calculate authenticity index based on verification status
   */
  private calculateAuthenticityIndex(
    references: EnhancedLiteratureReference[],
    statistics: LiteratureQualityReport['statistics']
  ): number {
    if (references.length === 0) return 0;

    // Base score from verification
    const verificationScore = statistics.validatedReferences / references.length * 100;
    
    // Deduction for potentially fabricated references
    const fabricationPenalty = 
      (statistics.potentiallyFabricated / references.length) * 50;
    
    // Calculate final authenticity index
    return Math.max(0, verificationScore - fabricationPenalty);
  }

  /**
   * Calculate diversity index based on journal representation
   */
  private calculateDiversityIndex(references: EnhancedLiteratureReference[]): number {
    if (references.length === 0) return 0;

    const journalCounts = Object.values(this.calculateStatistics(references).referencesByJournal);
    if (journalCounts.length === 0) return 0;

    // Calculate maximum percentage from a single journal
    const maxJournalCount = Math.max(...journalCounts);
    const maxJournalPercentage = maxJournalCount / references.length;
    
    // Inverse relationship - lower percentage means higher diversity
    let diversityScore = 100 - (maxJournalPercentage / this.MAX_RECOMMENDED_REFERENCES_PER_JOURNAL) * 100;
    
    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, diversityScore));
  }

  /**
   * Calculate recency index based on publication dates
   */
  private calculateRecencyIndex(references: EnhancedLiteratureReference[]): number {
    const yearCounts = this.calculateStatistics(references).referencesByYear;
    const years = Object.keys(yearCounts).map(yearStr => parseInt(yearStr, 10));
    
    if (years.length === 0) return 0;

    // Calculate year spread
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const yearSpread = maxYear - minYear;
    
    // Calculate average recency (weighted by count)
    let weightedSum = 0;
    let totalCount = 0;
    
    Object.entries(yearCounts).forEach(([yearStr, count]) => {
      const year = parseInt(yearStr, 10);
      const recency = Math.min(10, this.currentYear - year); // Cap at 10 years
      const recencyWeight = 10 - recency; // More recent = higher weight
      
      weightedSum += recencyWeight * count;
      totalCount += count;
    });
    
    const averageRecencyScore = totalCount > 0 ? (weightedSum / totalCount) * 10 : 0;
    
    // Add bonus for good year spread
    const spreadBonus = Math.min(20, (yearSpread / this.MIN_RECOMMENDED_YEAR_SPREAD) * 20);
    
    return Math.min(100, averageRecencyScore + spreadBonus);
  }

  /**
   * Analyze citation pattern
   */
  private analyzeCitationPattern(references: EnhancedLiteratureReference[]): 'healthy' | 'concentrated' | 'sparse' {
    const journalCounts = this.calculateStatistics(references).referencesByJournal;
    const journalCount = Object.keys(journalCounts).length;
    
    if (references.length < 5) return 'sparse';
    
    if (journalCount < 3) return 'concentrated';
    
    return 'healthy';
  }

  /**
   * Identify strengths and weaknesses in the literature
   */
  private identifyStrengthsAndWeaknesses(
    references: EnhancedLiteratureReference[],
    statistics: LiteratureQualityReport['statistics'],
    indices: { authenticityIndex: number; diversityIndex: number; recencyIndex: number; citationPattern: string }
  ) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const warnings: string[] = [];
    
    // Check strengths
    if (indices.authenticityIndex > 80) {
      strengths.push('High literature authenticity with most references properly validated');
    }
    
    if (indices.diversityIndex > 70) {
      strengths.push('Good journal diversity reducing bias risk');
    }
    
    if (indices.recencyIndex > 70) {
      strengths.push('Recent literature citations ensuring up-to-date information');
    }
    
    if (statistics.potentiallyFabricated === 0) {
      strengths.push('No potentially fabricated references detected');
    }
    
    // Check weaknesses
    if (indices.authenticityIndex < 50) {
      weaknesses.push(`Low authenticity index (${indices.authenticityIndex.toFixed(1)}). Too many unverified references.`);
    }
    
    if (indices.diversityIndex < 40) {
      weaknesses.push(`Poor journal diversity (${indices.diversityIndex.toFixed(1)}). Consider expanding source journals.`);
    }
    
    if (indices.recencyIndex < 40) {
      weaknesses.push(`Literature may be outdated (recency index: ${indices.recencyIndex.toFixed(1)}). Add more recent publications.`);
    }
    
    if (references.length < 3) {
      weaknesses.push('Insufficient number of literature references');
    }
    
    // Check warnings
    if (statistics.potentiallyFabricated > 0) {
      warnings.push(`${statistics.potentiallyFabricated} potentially fabricated references detected. These should be verified manually.`);
    }
    
    const unverifiedRatio = references.length > 0 
      ? (references.length - statistics.validatedReferences) / references.length 
      : 0;
      
    if (unverifiedRatio > this.MAX_ACCEPTABLE_UNVERIFIED_RATIO) {
      warnings.push(`Too many unverified references (${(unverifiedRatio * 100).toFixed(1)}%). This increases risk of including fabricated literature.`);
    }
    
    if (indices.citationPattern === 'concentrated') {
      warnings.push('Concentrated citation pattern may indicate bias or insufficient research');
    }
    
    return { strengths, weaknesses, warnings };
  }

  /**
   * Generate recommendations based on identified weaknesses
   */
  private generateRecommendations(weaknesses: string[], warnings: string[]): string[] {
    const recommendations: string[] = [];
    
    // Add general recommendations
    recommendations.push('Always verify references against primary sources before finalizing research');
    
    // Add specific recommendations based on weaknesses
    if (weaknesses.some(w => w.includes('authenticity'))) {
      recommendations.push('Use PubMed API or other reference databases to validate all literature citations');
      recommendations.push('Prioritize references with DOI or PMID for better traceability');
    }
    
    if (weaknesses.some(w => w.includes('diversity'))) {
      recommendations.push('Expand search across multiple journals and publishers');
      recommendations.push('Include both high-impact and specialized journals in your references');
    }
    
    if (weaknesses.some(w => w.includes('outdated'))) {
      recommendations.push('Focus on literature published within the last 5 years for current information');
      recommendations.push('Include classic papers only when necessary for historical context');
    }
    
    if (warnings.some(w => w.includes('fabricated'))) {
      recommendations.push('Implement manual review of all references with confidence scores below 50');
      recommendations.push('Use reference management software to detect potential fabrication');
    }
    
    return recommendations;
  }

  /**
   * Calculate overall quality score (weighted average of indices)
   */
  private calculateOverallScore(indices: { authenticityIndex: number; diversityIndex: number; recencyIndex: number }): number {
    // Authenticity is weighted more heavily as it's the most critical factor
    const weights = {
      authenticityIndex: 0.5,  // 50% weight
      diversityIndex: 0.25,    // 25% weight
      recencyIndex: 0.25       // 25% weight
    };
    
    return (
      indices.authenticityIndex * weights.authenticityIndex +
      indices.diversityIndex * weights.diversityIndex +
      indices.recencyIndex * weights.recencyIndex
    );
  }
}