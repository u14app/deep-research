// Literature Reference Validation and Deduplication System
// Advanced handling of scientific citations to ensure authenticity and prevent duplication

import { LiteratureReference } from '@/types/gene-research';
import { EnhancedQualityControl, LiteratureQualityReport } from './enhanced-quality-control';

/**
 * Interface for PubMed API response
 */
interface PubMedResponse {
  result: {
    [pmid: string]: {
      uid: string;
      pubdate: string;
      title: string;
      authors?: Array<{ name: string }>;
      fulljournalname?: string;
      volume?: string;
      issue?: string;
      pages?: string;
      doi?: string;
      abstract?: string;
    };
  };
}

/**
 * Interface for reference quality metadata
 */
export interface ReferenceQualityMetadata {
  verified: boolean;
  verificationMethod: 'pubmed_api' | 'pattern_validation' | 'manual_review' | 'unknown';
  confidenceScore: number;
  warningFlags: string[];
  isDuplicate?: boolean;
  duplicateOf?: string;
  potentialFabrication?: boolean; // Flag for potential fabrication
}

/**
 * Enhanced Literature Reference with quality metadata
 */
export interface EnhancedLiteratureReference extends LiteratureReference {
  qualityMetadata: ReferenceQualityMetadata;
  doi?: string;
  url?: string;
  sourceTracking?: {
    extractedFrom?: string; // The source where this reference was extracted from
    extractionMethod?: string; // How the reference was extracted (PMID pattern, DOI, reference section, etc.)
    extractionConfidence?: number; // Confidence in the extraction process (0-100)
    processingTimestamp?: number; // When the reference was processed
  };
  volume?: string;
  issue?: string;
  pages?: string;
}

/**
 * Processed references result with quality report
 */
export interface ProcessedReferencesResult {
  uniqueReferences: EnhancedLiteratureReference[];
  duplicateCount: number;
  stats: {
    validated: number;
    highConfidence: number;
    warnings: number;
    potentiallyFabricated: number;
  };
  qualityReport: LiteratureQualityReport; // Enhanced quality report
}

/**
 * Literature Reference Validator class
 */
export class LiteratureValidator {
  private apiEndpoint = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
  private cache = new Map<string, EnhancedLiteratureReference>();
  private qualityControl: EnhancedQualityControl;
  private readonly FABRICATION_CONFIDENCE_THRESHOLD = 0.3; // 0-1 scale
  
  constructor() {
    this.qualityControl = new EnhancedQualityControl();
  }

  /**
   * Validate a single literature reference
   * @param reference The reference to validate
   * @param organism The target organism
   * @returns Enhanced reference with validation metadata
   */
  async validateReference(
    reference: LiteratureReference,
    organism: string
  ): Promise<EnhancedLiteratureReference> {
    // Check cache first
    const cacheKey = this.generateCacheKey(reference);
    if (this.cache.has(cacheKey)) {
      return { ...this.cache.get(cacheKey)! };
    }

    let enhancedReference: EnhancedLiteratureReference = {
      ...reference,
      qualityMetadata: {
        verified: false,
        verificationMethod: 'unknown',
        confidenceScore: 0,
        warningFlags: [],
      },
    };

    // Prioritize validation by PMID
    if (reference.pmid && /^\d+$/.test(reference.pmid)) {
      try {
        enhancedReference = await this.validateByPMID(reference, organism);
      } catch (error) {
        console.error(`Error validating PMID ${reference.pmid}:`, error);
        enhancedReference.qualityMetadata.warningFlags.push(
          `Failed to validate PMID via API: ${(error as Error).message}`
        );
        // Fall back to pattern validation
        enhancedReference = this.validateByPattern(enhancedReference, organism);
      }
    } else {
      // Validate by pattern matching if no PMID
      enhancedReference = this.validateByPattern(enhancedReference, organism);
    }

    // Apply final checks
    this.applyFinalChecks(enhancedReference);
    
    // Add potential fabrication flag
    enhancedReference.qualityMetadata.potentialFabrication = 
      enhancedReference.qualityMetadata.confidenceScore < this.FABRICATION_CONFIDENCE_THRESHOLD ||
      this.detectFabricationPatterns(enhancedReference);
    
    if (enhancedReference.qualityMetadata.potentialFabrication) {
      enhancedReference.qualityMetadata.warningFlags.push('FLAGGED: Potential fabrication detected');
    }

    // Store in cache
    this.cache.set(cacheKey, { ...enhancedReference });

    return enhancedReference;
  }

  /**
   * Validate a reference using PubMed API
   * @param reference The reference to validate
   * @param organism The target organism
   * @returns Enhanced reference with validation metadata
   */
  private async validateByPMID(
    reference: LiteratureReference,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    organism: string
  ): Promise<EnhancedLiteratureReference> {
    const enhancedReference: EnhancedLiteratureReference = {
      ...reference,
      qualityMetadata: {
        verified: true,
        verificationMethod: 'pubmed_api',
        confidenceScore: 1.0,
        warningFlags: [],
      },
    };

    try {
      const params = new URLSearchParams({
        db: 'pubmed',
        id: reference.pmid,
        retmode: 'json',
      });

      const response = await fetch(`${this.apiEndpoint}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: PubMedResponse = await response.json();
      const articleInfo = data.result[reference.pmid];

      if (articleInfo) {
        // Update reference with real data
        if (articleInfo.title) {
          enhancedReference.title = articleInfo.title;
        }
        if (articleInfo.authors) {
          enhancedReference.authors = articleInfo.authors.map(author => author.name);
        }
        if (articleInfo.fulljournalname) {
          enhancedReference.journal = articleInfo.fulljournalname;
        }
        if (articleInfo.pubdate) {
          const yearMatch = articleInfo.pubdate.match(/^(\d{4})/);
          if (yearMatch) {
            enhancedReference.year = parseInt(yearMatch[1], 10);
          }
        }
        if (articleInfo.abstract) {
          enhancedReference.abstract = articleInfo.abstract;
        }
        if (articleInfo.doi) {
          enhancedReference.doi = articleInfo.doi;
        }

        // Set URL if possible
        enhancedReference.url = `https://pubmed.ncbi.nlm.nih.gov/${reference.pmid}/`;

        // Adjust confidence score based on data completeness
        enhancedReference.qualityMetadata.confidenceScore = this.calculateConfidenceScore(enhancedReference);
      } else {
        enhancedReference.qualityMetadata.verified = false;
        enhancedReference.qualityMetadata.confidenceScore = 0.3;
        enhancedReference.qualityMetadata.warningFlags.push('PMID not found in PubMed database');
      }
    } catch (error) {
      enhancedReference.qualityMetadata.verified = false;
      enhancedReference.qualityMetadata.confidenceScore = 0.2;
      enhancedReference.qualityMetadata.warningFlags.push(`PubMed API validation failed: ${(error as Error).message}`);
    }

    return enhancedReference;
  }

  /**
   * Validate a reference using pattern matching and heuristics
   * @param reference The reference to validate
   * @param organism The target organism
   * @returns Enhanced reference with validation metadata
   */
  private validateByPattern(
    reference: EnhancedLiteratureReference,
    organism: string
  ): EnhancedLiteratureReference {
    const warningFlags: string[] = [];
    let confidenceScore = 0.5;

    // Check for placeholder/default values
    if (reference.title === 'Extracted from content' || reference.title === '') {
      warningFlags.push('Suspicious title (placeholder text)');
      confidenceScore -= 0.3;
    }

    if (reference.journal === 'Unknown' || reference.journal === '') {
      warningFlags.push('Missing or suspicious journal information');
      confidenceScore -= 0.2;
    }

    // Check if year is current year (potentially suspicious)
    const currentYear = new Date().getFullYear();
    if (reference.year === currentYear) {
      warningFlags.push('Publication year is current year (potentially auto-generated)');
    }

    // Check for reasonable year range
    if (reference.year < 1900 || reference.year > currentYear) {
      warningFlags.push('Publication year outside reasonable range');
      confidenceScore -= 0.3;
    }

    // Check for presence of authors
    if (!reference.authors || reference.authors.length === 0) {
      warningFlags.push('Missing author information');
      confidenceScore -= 0.2;
    }

    // Check if organism matches
    if (organism && reference.organism && reference.organism !== organism) {
      warningFlags.push(`Organism mismatch (expected: ${organism}, found: ${reference.organism})`);
      confidenceScore -= 0.1;
    }

    // Calculate final confidence score
    confidenceScore = Math.max(0.1, Math.min(0.9, confidenceScore));

    return {
      ...reference,
      qualityMetadata: {
        ...reference.qualityMetadata,
        verified: confidenceScore > 0.7,
        verificationMethod: 'pattern_validation',
        confidenceScore,
        warningFlags,
      },
    };
  }

  /**
   * Apply final quality checks to the reference
   * @param reference The reference to check
   */
  private applyFinalChecks(reference: EnhancedLiteratureReference): void {
    // Check for suspicious content patterns
    const suspiciousPatterns = [
      /extracted from content/i,
      /unknown journal/i,
      /placeholder/i,
      /auto-generated/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(reference.title) || pattern.test(reference.abstract || '')) {
        reference.qualityMetadata.warningFlags.push('Suspicious content pattern detected');
        reference.qualityMetadata.confidenceScore = Math.max(0.1, reference.qualityMetadata.confidenceScore - 0.2);
      }
    }

    // Set final verification status based on confidence
    reference.qualityMetadata.verified = reference.qualityMetadata.confidenceScore > 0.7;
  }
  
  /**
   * Enhanced detection of potential fabrication patterns
   */
  private detectFabricationPatterns(reference: EnhancedLiteratureReference): boolean {
    // Check for suspicious patterns with increased sensitivity
    const suspiciousPatterns = [
      // Check for realistic author names with stricter validation
      () => {
        if (!reference.authors || reference.authors.length === 0) return false;
        return reference.authors.some(author => {
          // Check for suspicious author name patterns
          const namePattern = /^[A-Za-z\s,.-]+$/;
          const hasUnusualChars = !namePattern.test(author);
          const isUnrealisticLength = author.length < 3 || author.length > 50;
          
          // Check for pattern: First Initial. LastName format but with suspicious patterns
          const hasSuspiciousInitialPattern = author.match(/^[A-Z]\.\s+[A-Za-z]+$/);
          
          return hasUnusualChars || isUnrealisticLength || hasSuspiciousInitialPattern;
        });
      },
      
      // Enhanced journal name validation
      () => {
        if (!reference.journal) return false;
        const journal = reference.journal.toLowerCase();
        
        // Common patterns in fabricated journal names
        const highRiskPatterns = [
          'international journal of',
          'world journal of',
          'global journal of',
          'journal of advanced',
          'american journal of',
          'european journal of',
          'asian journal of'
        ];
        
        // Check for high-risk patterns without being from a legitimate publisher
        const hasHighRiskPattern = highRiskPatterns.some(pattern => journal.includes(pattern));
        const isLegitimate = this.isKnownLegitimateJournal(reference.journal);
        
        return hasHighRiskPattern && !isLegitimate;
      },
      
      // Title validation with anti-fabrication focus
      () => {
        if (!reference.title) return false;
        const title = reference.title.toLowerCase();
        
        // Unrealistic title length
        if (title.length < 10 || title.length > 300) return true;
        
        // Check for excessive buzzwords (common in predatory journals)
        const buzzwords = ['novel', 'innovative', 'advanced', 'cutting-edge', 'state-of-the-art'];
        const buzzwordCount = buzzwords.filter(word => title.includes(word)).length;
        
        return buzzwordCount >= 3;
      },
      
      // Incomplete reference check
      () => {
        const requiredFields = [reference.title, reference.journal, reference.year, reference.authors];
        const filledFields = requiredFields.filter(field => 
          field && (Array.isArray(field) ? field.length > 0 : typeof field === 'string' && field.length > 0)
        );
        return filledFields.length < 3; // Too few fields filled
      }
    ];
    
    // Return true if any pattern is detected
    return suspiciousPatterns.some(pattern => pattern());
  }
  
  /**
   * Check if journal is known to be legitimate
   */
  private isKnownLegitimateJournal(journalName: string): boolean {
    // Expanded list of legitimate publishers and journals
    const journalNameLower = journalName.toLowerCase();
    
    // Check for major publishers
    const majorPublishers = [
      'nature', 'science', 'cell', 'lancet', 'jama', 'bmj',
      'nejm', 'new england journal', 'plos one', 'pnas',
      'acs', 'elsevier', 'springer', 'wiley', 'ieee', 'acm',
      'cell press', 'oxford university press', 'cambridge university press',
      'taylor & francis', 'sage', 'mdpi', 'frontiers'
    ];
    
    // Check for specific prestigious journals
    const prestigiousJournals = [
      'proceedings of the national academy of sciences',
      'journal of the american medical association',
      'british medical journal',
      'journal of biological chemistry',
      'chemical reviews',
      'journal of clinical investigation',
      'circulation',
      'journal of neuroscience',
      'cancer cell',
      'nature medicine',
      'science translational medicine'
    ];
    
    // Check if journal name contains a major publisher
    const containsMajorPublisher = majorPublishers.some(publisher => 
      journalNameLower.includes(publisher)
    );
    
    // Check if journal is in the prestigious list
    const isPrestigious = prestigiousJournals.some(journal => 
      journalNameLower.includes(journal)
    );
    
    return containsMajorPublisher || isPrestigious;
  }

  /**
   * Calculate confidence score based on data completeness
   * @param reference The reference to score
   * @returns Confidence score (0-1)
   */
  private calculateConfidenceScore(reference: EnhancedLiteratureReference): number {
    let score = 0.5;
    
    // Title presence
    if (reference.title && reference.title !== 'Extracted from content') score += 0.1;
    
    // Authors presence
    if (reference.authors && reference.authors.length > 0) score += 0.1;
    
    // Journal information
    if (reference.journal && reference.journal !== 'Unknown') score += 0.1;
    
    // Abstract presence
    if (reference.abstract && reference.abstract.length > 50) score += 0.1;
    
    // DOI presence
    if (reference.doi) score += 0.1;
    
    return Math.min(1.0, score);
  }

  /**
   * Generate a cache key for a reference
   * @param reference The reference to generate a key for
   * @returns Cache key string
   */
  private generateCacheKey(reference: LiteratureReference): string {
    if (reference.pmid) return `pmid_${reference.pmid}`;
    if ('doi' in reference && reference.doi) return `doi_${reference.doi}`;
    return `hash_${this.hashReference(reference)}`;
  }

  /**
   * Create a hash from reference data for caching
   * @param reference The reference to hash
   * @returns Hash string
   */
  private hashReference(reference: LiteratureReference): string {
    const data = `${reference.title || ''}|${reference.journal || ''}|${reference.year}|${(reference.authors || []).join(',')}`;
    return data.split('').reduce((acc, char) => {
      acc = ((acc << 5) - acc) + char.charCodeAt(0);
      return acc & acc;
    }, 0).toString(36);
  }

  /**
   * Deduplicate references based on multiple criteria
   * @param references List of references to deduplicate
   * @returns List of unique references with duplicates marked
   */
  deduplicateReferences(references: EnhancedLiteratureReference[]): { uniqueReferences: EnhancedLiteratureReference[], duplicateCount: number, stats: { validated: number, highConfidence: number, warnings: number } } {
    const uniqueMap = new Map<string, EnhancedLiteratureReference>();
    let duplicateCount = 0;
    const stats = {
      validated: 0,
      highConfidence: 0,
      warnings: 0
    };
    
    for (const ref of references) {
      let key: string;
      
      // Use PMID as primary deduplication key
      if (ref.pmid) {
        key = `pmid_${ref.pmid}`;
      }
      // Use DOI as secondary key
      else if (ref.doi) {
        key = `doi_${ref.doi}`;
      }
      // Use title + authors + journal + year as fallback
      else {
        key = `content_${this.hashReference(ref)}`;
      }
      
      // Update stats for all references
      if (ref.qualityMetadata.verified) {
        stats.validated++;
      }
      if (ref.qualityMetadata.confidenceScore >= 80) {
        stats.highConfidence++;
      }
      stats.warnings += ref.qualityMetadata.warningFlags.length;
      
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, ref);
      } else {
        // Keep the reference with higher confidence score
        const existingRef = uniqueMap.get(key)!;
        if (ref.qualityMetadata.confidenceScore > existingRef.qualityMetadata.confidenceScore) {
          // Mark the existing one as duplicate
          existingRef.qualityMetadata.isDuplicate = true;
          existingRef.qualityMetadata.duplicateOf = key;
          
          // Replace with higher confidence reference
          uniqueMap.set(key, ref);
          duplicateCount++;
        } else {
          // Mark this one as duplicate
          ref.qualityMetadata.isDuplicate = true;
          ref.qualityMetadata.duplicateOf = key;
          duplicateCount++;
        }
      }
    }
    
    // Return unique references and deduplication statistics
    return {
      uniqueReferences: Array.from(uniqueMap.values()),
      duplicateCount,
      stats
    };
  }

  /**
   * Process a batch of references for validation and deduplication
   * @param references List of literature references to process
   * @param organism Target organism
   * @returns Processed references with validation, deduplication metadata, and quality report
   */
  async processReferences(
    references: Array<LiteratureReference & { source?: string; extractionMethod?: string }>,
    organism: string
  ): Promise<ProcessedReferencesResult> {
    // Validate each reference with source tracking
    const validatedReferences = await Promise.all(
      references.map(async (ref) => {
        try {
          const validatedRef = await this.validateReference(ref, organism);
          
          // Add source tracking information
          validatedRef.sourceTracking = {
            extractedFrom: ref.source || 'unknown',
            extractionMethod: ref.extractionMethod || 'unknown',
            extractionConfidence: ref.extractionMethod === 'pmid_pattern' ? 90 : 70,
            processingTimestamp: Date.now()
          };
          
          return validatedRef;
        } catch (error) {
          console.error('Error processing reference:', error);
          // Create a minimal validated reference for failed validation
          const failedRef: EnhancedLiteratureReference = {
            ...ref,
            qualityMetadata: {
              verified: false,
              verificationMethod: 'unknown',
              confidenceScore: 0,
              warningFlags: [`Failed to process reference: ${(error as Error).message}`]
            },
            sourceTracking: {
              extractedFrom: ref.source || 'unknown',
              extractionMethod: ref.extractionMethod || 'unknown',
              extractionConfidence: 0,
              processingTimestamp: Date.now()
            }
          };
          return failedRef;
        }
      })
    );

    // Deduplicate and get statistics
    const { uniqueReferences, duplicateCount, stats } = this.deduplicateReferences(validatedReferences);
    
    // Add potentially fabricated count to stats
    const finalStats = {
      ...stats,
      potentiallyFabricated: validatedReferences.filter(r => r.qualityMetadata.potentialFabrication).length
    };
    
    // Generate quality report
    const qualityReport = this.qualityControl.assessLiteratureQuality(
      uniqueReferences,
      {
        validatedReferences: finalStats.validated,
        duplicateReferences: duplicateCount,
        highConfidenceReferences: finalStats.highConfidence,
        warnings: finalStats.warnings,
        potentiallyFabricated: finalStats.potentiallyFabricated
      }
    );

    return { 
      uniqueReferences, 
      duplicateCount, 
      stats: finalStats,
      qualityReport 
    };
  }
}

/**
 * Create a formatted citation string from a reference
 * @param reference The reference to format
 * @returns Formatted citation string with clickable links
 */
export function formatCitation(reference: EnhancedLiteratureReference): string {
  // Format authors: "Conway T, et al." for multiple authors or just "Conway T" for single author
  let authors = 'Anonymous';
  if (reference.authors && reference.authors.length > 0) {
    if (reference.authors.length === 1) {
      authors = reference.authors[0];
    } else {
      // Show first author followed by ", et al."
      authors = `${reference.authors[0]}, et al.`;
    }
  }
  
  // Build the citation in the requested format
  let citation = `${authors} ${reference.year}. ${reference.title}. ${reference.journal}`;
  
  // Add volume, issue, and pages if available
  if (reference.volume) {
    citation += ` ${reference.volume}`;
    if (reference.issue) {
      citation += `(${reference.issue})`;
    }
    if (reference.pages) {
      citation += `:${reference.pages}`;
    }
  }
  
  // Add DOI as a clickable link if available
  if (reference.doi) {
    citation += ` DOI:[${reference.doi}](https://doi.org/${reference.doi})`;
  } 
  // Add PMID as a clickable link if DOI is not available
  else if (reference.pmid) {
    citation += ` PMID:[${reference.pmid}](https://pubmed.ncbi.nlm.nih.gov/${reference.pmid}/)`;
  }
  
  return citation;
}

/**
 * Filter out low-confidence references
 * @param references The references to filter
 * @param confidenceThreshold Minimum confidence score
 * @returns Filtered references
 */
export function filterByConfidence(
  references: EnhancedLiteratureReference[],
  confidenceThreshold: number = 0.6
): EnhancedLiteratureReference[] {
  return references.filter(ref => ref.qualityMetadata.confidenceScore >= confidenceThreshold);
}