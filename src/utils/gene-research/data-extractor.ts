// Gene-specific data extraction and processing system
// Advanced data extraction for molecular biology research

import { 
  GeneBasicInfo, 
  FunctionalData, 
  ProteinInfo, 
  ExpressionData, 
  InteractionData, 
  DiseaseData, 
  EvolutionaryData, 
  LiteratureReference,
  BindingSite,
  PTM
} from '@/types/gene-research';
import { LiteratureValidator, EnhancedLiteratureReference } from './literature-validator';

export interface ReferenceQualityStatistics {
  validatedReferences: number;
  duplicateReferences: number;
  highConfidenceReferences: number;
  warnings: number;
  potentiallyFabricated: number;
}

export interface GeneDataExtractionResult {
  geneBasicInfo: GeneBasicInfo;
  functionalData: FunctionalData;
  proteinInfo: ProteinInfo;
  expressionData: ExpressionData;
  interactionData: InteractionData;
  diseaseData: DiseaseData[];
  evolutionaryData: EvolutionaryData;
  literatureReferences: LiteratureReference[];
  qualityScore: number;
  extractionMetadata: {
    extractionTime: number;
    sources: string[];
    confidence: number;
    completeness: number;
    referenceQuality?: ReferenceQualityStatistics;
    literatureQualityReport?: any; // Enhanced literature quality report
  };
}

export class GeneDataExtractor {
  private geneSymbol: string;
  private organism: string;
  private extractionRules: GeneExtractionRules;
  private literatureValidator: LiteratureValidator;

  constructor(geneSymbol: string, organism: string) {
    this.geneSymbol = geneSymbol;
    this.organism = organism;
    this.extractionRules = new GeneExtractionRules();
    this.literatureValidator = new LiteratureValidator();
  }

  async extractFromContent(content: string, source: string): Promise<Partial<GeneDataExtractionResult>> {
    const extractionStart = Date.now();
    
    try {
      // Extract raw references
      const rawReferences = this.extractLiteratureReferences(content);
      
      // Add literature validation and deduplication with extraction method information
      const rawReferencesWithSource = rawReferences.map(ref => ({
        ...ref,
        source,
        extractionMethod: ref.methodology?.[0] || 'content_extraction' // Preserve original extraction method if available
      }));
      
      // Validate and deduplicate references
      const { uniqueReferences, duplicateCount, stats, qualityReport } = await this.literatureValidator.processReferences(
        rawReferencesWithSource,
        this.organism
      );
      
      // Log reference processing statistics
      console.log(`Reference processing results for ${source}:`, {
        totalExtracted: rawReferences.length,
        uniqueValidated: uniqueReferences.length,
        duplicatesRemoved: duplicateCount,
        highConfidence: stats.highConfidence,
        potentiallyFabricated: stats.potentiallyFabricated
      });
      
      // Create results object with basic extracted data
      const results: Partial<GeneDataExtractionResult> = {
        geneBasicInfo: this.extractGeneBasicInfo(content),
        functionalData: this.extractFunctionalData(content),
        proteinInfo: this.extractProteinInfo(content),
        expressionData: this.extractExpressionData(content),
        interactionData: this.extractInteractionData(content),
        diseaseData: this.extractDiseaseData(content),
        evolutionaryData: this.extractEvolutionaryData(content),
        // Convert enhanced references back to standard format for compatibility
        literatureReferences: uniqueReferences
          .filter(ref => ref.qualityMetadata?.verified || ref.qualityMetadata?.confidenceScore > 50)
          .map(ref => ({
          pmid: ref.pmid,
          title: ref.title,
          authors: ref.authors,
          journal: ref.journal,
          year: ref.year,
          abstract: ref.abstract,
          relevance: ref.relevance,
          studyType: ref.studyType,
          organism: ref.organism,
          methodology: ref.methodology,
          // Note: quality metadata is not included in the standard type
          // but will be used internally by the validator
        })),
        qualityScore: 0,
        extractionMetadata: {
          extractionTime: Date.now() - extractionStart,
          sources: [source],
          confidence: 0,
          completeness: 0,
            referenceQuality: {
              validatedReferences: stats.validated,
              duplicateReferences: duplicateCount,
              highConfidenceReferences: stats.highConfidence,
              warnings: stats.warnings,
              potentiallyFabricated: stats.potentiallyFabricated
            }
        }
      };

      // Calculate quality metrics
      results.qualityScore = this.calculateQualityScore(results);
      results.extractionMetadata!.confidence = this.calculateConfidence(results);
      results.extractionMetadata!.completeness = this.calculateCompleteness(results);
      
      // Add literature quality report to metadata
      results.extractionMetadata!.literatureQualityReport = qualityReport;

      return results;
    } catch (error) {
      console.error('Gene data extraction error:', error);
      return {
        qualityScore: 0,
        extractionMetadata: {
          extractionTime: Date.now() - extractionStart,
          sources: [source],
          confidence: 0,
          completeness: 0,
          referenceQuality: {
            validatedReferences: 0,
            duplicateReferences: 0,
            highConfidenceReferences: 0,
            warnings: 1,
            potentiallyFabricated: 0
          }
        }
      };
    }
  }

  private extractGeneBasicInfo(content: string): GeneBasicInfo {
    const geneInfo: Partial<GeneBasicInfo> = {
      geneSymbol: this.geneSymbol,
      organism: this.organism,
      alternativeNames: [],
      chromosomalLocation: '',
      geneType: 'protein_coding',
      description: ''
    };

    // Extract gene ID
    const geneIdMatch = content.match(/(?:gene id|geneid|entrez id)[:\s]*(\d+)/i);
    if (geneIdMatch) {
      geneInfo.geneID = geneIdMatch[1];
    }

    // Extract alternative names
    const altNamesMatch = content.match(/(?:alternative names?|aliases?|synonyms?)[:\s]*([^.]+)/i);
    if (altNamesMatch) {
      geneInfo.alternativeNames = altNamesMatch[1]
        .split(/[,;]/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
    }

    // Extract chromosomal location
    const chromMatch = content.match(/(?:chromosome|chr)[:\s]*(\d+[XY]?)[:\s]*(?:band|region)?[:\s]*([\d\.]+[pq]?[\d\.]*)/i);
    if (chromMatch) {
      geneInfo.chromosomalLocation = `Chr${chromMatch[1]}:${chromMatch[2]}`;
    }

    // Extract gene type
    const typeMatch = content.match(/(?:gene type|type)[:\s]*(protein[-\s]?coding|lncRNA|miRNA|pseudogene|other)/i);
    if (typeMatch) {
      geneInfo.geneType = typeMatch[1].replace(/[-\s]/g, '_') as any;
    }

    // Extract description
    const descMatch = content.match(/(?:description|function)[:\s]*([^.]+\.)/i);
    if (descMatch) {
      geneInfo.description = descMatch[1].trim();
    }

    return geneInfo as GeneBasicInfo;
  }

  private extractFunctionalData(content: string): FunctionalData {
    const functionalData: Partial<FunctionalData> = {
      molecularFunction: [],
      biologicalProcess: [],
      cellularComponent: [],
      catalyticActivity: '',
      substrateSpecificity: '',
      bindingSites: [],
      enzymeClassification: ''
    };

    // Extract molecular functions
    const molFuncMatch = content.match(/(?:molecular function|function)[:\s]*([^.]+)/i);
    if (molFuncMatch) {
      functionalData.molecularFunction = molFuncMatch[1]
        .split(/[,;]/)
        .map(func => func.trim())
        .filter(func => func.length > 0);
    }

    // Extract biological processes
    const bioProcMatch = content.match(/(?:biological process|process)[:\s]*([^.]+)/i);
    if (bioProcMatch) {
      functionalData.biologicalProcess = bioProcMatch[1]
        .split(/[,;]/)
        .map(proc => proc.trim())
        .filter(proc => proc.length > 0);
    }

    // Extract cellular components
    const cellCompMatch = content.match(/(?:cellular component|localization)[:\s]*([^.]+)/i);
    if (cellCompMatch) {
      functionalData.cellularComponent = cellCompMatch[1]
        .split(/[,;]/)
        .map(comp => comp.trim())
        .filter(comp => comp.length > 0);
    }

    // Extract catalytic activity
    const catActMatch = content.match(/(?:catalytic activity|enzyme activity)[:\s]*([^.]+)/i);
    if (catActMatch) {
      functionalData.catalyticActivity = catActMatch[1].trim();
    }

    // Extract substrate specificity
    const subSpecMatch = content.match(/(?:substrate specificity|substrate)[:\s]*([^.]+)/i);
    if (subSpecMatch) {
      functionalData.substrateSpecificity = subSpecMatch[1].trim();
    }

    // Extract EC number
    const ecMatch = content.match(/EC[:\s]*(\d+\.\d+\.\d+\.\d+)/i);
    if (ecMatch) {
      functionalData.enzymeClassification = ecMatch[1];
    }

    // Extract binding sites
    functionalData.bindingSites = this.extractBindingSites(content);

    return functionalData as FunctionalData;
  }

  private extractBindingSites(content: string): BindingSite[] {
    const bindingSites: BindingSite[] = [];
    
    // Extract active sites
    const activeSiteMatch = content.match(/(?:active site|catalytic site)[:\s]*([^.]+)/i);
    if (activeSiteMatch) {
      bindingSites.push({
        name: 'Active Site',
        position: 0, // Would need more sophisticated parsing
        type: 'active_site',
        ligands: [],
        description: activeSiteMatch[1].trim()
      });
    }

    // Extract allosteric sites
    const allostericMatch = content.match(/(?:allosteric site|regulatory site)[:\s]*([^.]+)/i);
    if (allostericMatch) {
      bindingSites.push({
        name: 'Allosteric Site',
        position: 0,
        type: 'allosteric',
        ligands: [],
        description: allostericMatch[1].trim()
      });
    }

    return bindingSites;
  }

  private extractProteinInfo(content: string): ProteinInfo {
    const proteinInfo: Partial<ProteinInfo> = {
      uniprotId: '',
      proteinName: '',
      proteinSize: 0,
      molecularWeight: 0,
      isoelectricPoint: 0,
      subcellularLocation: [],
      proteinDomains: [],
      catalyticActivity: '',
      cofactors: [],
      postTranslationalModifications: []
    };

    // Extract UniProt ID
    const uniprotMatch = content.match(/(?:uniprot|uniprotkb)[:\s]*([A-Z0-9]+)/i);
    if (uniprotMatch) {
      proteinInfo.uniprotId = uniprotMatch[1];
    }

    // Extract protein name
    const proteinNameMatch = content.match(/(?:protein name|protein)[:\s]*([^.]+)/i);
    if (proteinNameMatch) {
      proteinInfo.proteinName = proteinNameMatch[1].trim();
    }

    // Extract protein size
    const sizeMatch = content.match(/(?:size|length|residues)[:\s]*(\d+)\s*(?:amino acids?|residues?)/i);
    if (sizeMatch) {
      proteinInfo.proteinSize = parseInt(sizeMatch[1]);
    }

    // Extract molecular weight
    const mwMatch = content.match(/(?:molecular weight|mw)[:\s]*(\d+(?:\.\d+)?)\s*(?:kda|kda)/i);
    if (mwMatch) {
      proteinInfo.molecularWeight = parseFloat(mwMatch[1]);
    }

    // Extract isoelectric point
    const piMatch = content.match(/(?:isoelectric point|pi)[:\s]*(\d+(?:\.\d+)?)/i);
    if (piMatch) {
      proteinInfo.isoelectricPoint = parseFloat(piMatch[1]);
    }

    // Extract subcellular location
    const subcellMatch = content.match(/(?:subcellular location|localization)[:\s]*([^.]+)/i);
    if (subcellMatch) {
      proteinInfo.subcellularLocation = subcellMatch[1]
        .split(/[,;]/)
        .map(loc => loc.trim())
        .filter(loc => loc.length > 0);
    }

    // Extract protein domains
    proteinInfo.proteinDomains = this.extractProteinDomains(content);

    // Extract cofactors
    const cofactorMatch = content.match(/(?:cofactors?|coenzymes?)[:\s]*([^.]+)/i);
    if (cofactorMatch) {
      proteinInfo.cofactors = cofactorMatch[1]
        .split(/[,;]/)
        .map(cofactor => cofactor.trim())
        .filter(cofactor => cofactor.length > 0);
    }

    // Extract PTMs
    proteinInfo.postTranslationalModifications = this.extractPTMs(content);

    return proteinInfo as ProteinInfo;
  }

  private extractProteinDomains(content: string): any[] {
    const domains: any[] = [];
    
    // Extract domain information
    const domainMatches = content.match(/(?:domain|motif)[:\s]*([^.]+)/gi);
    if (domainMatches) {
      domainMatches.forEach(match => {
        const domainInfo = match.replace(/(?:domain|motif)[:\s]*/i, '').trim();
        if (domainInfo) {
          domains.push({
            name: domainInfo,
            start: 0, // Would need more sophisticated parsing
            end: 0,
            type: 'functional',
            description: domainInfo
          });
        }
      });
    }

    return domains;
  }

  private extractPTMs(content: string): PTM[] {
    const ptms: PTM[] = [];
    
    // Extract phosphorylation
    const phosphoMatch = content.match(/(?:phosphorylation|phosphorylated)[:\s]*([^.]+)/i);
    if (phosphoMatch) {
      ptms.push({
        type: 'phosphorylation',
        position: 0, // Would need more sophisticated parsing
        residue: '',
        function: phosphoMatch[1].trim()
      });
    }

    // Extract acetylation
    const acetylationMatch = content.match(/(?:acetylation|acetylated)[:\s]*([^.]+)/i);
    if (acetylationMatch) {
      ptms.push({
        type: 'acetylation',
        position: 0,
        residue: '',
        function: acetylationMatch[1].trim()
      });
    }

    return ptms;
  }

  private extractExpressionData(content: string): ExpressionData {
    const expressionData: Partial<ExpressionData> = {
      tissueSpecificity: [],
      developmentalStage: [],
      environmentalResponse: [],
      expressionLevel: {
        high: [],
        medium: [],
        low: []
      },
      regulation: []
    };

    // Extract tissue-specific expression
    const tissueMatch = content.match(/(?:tissue expression|expression)[:\s]*([^.]+)/i);
    if (tissueMatch) {
      const tissues = tissueMatch[1].split(/[,;]/).map(t => t.trim());
      expressionData.tissueSpecificity = tissues.map(tissue => ({
        tissue,
        expressionLevel: 'medium' as const,
        confidence: 'medium' as const,
        source: 'extracted'
      }));
    }

    // Extract developmental expression
    const devMatch = content.match(/(?:developmental expression|development)[:\s]*([^.]+)/i);
    if (devMatch) {
      expressionData.developmentalStage = [{
        stage: devMatch[1].trim(),
        expressionLevel: 'medium' as const,
        organism: this.organism,
        source: 'extracted'
      }];
    }

    return expressionData as ExpressionData;
  }

  private extractInteractionData(content: string): InteractionData {
    const interactionData: Partial<InteractionData> = {
      proteinInteractions: [],
      dnaInteractions: [],
      rnaInteractions: [],
      smallMoleculeInteractions: [],
      complexes: []
    };

    // Extract protein interactions
    const proteinIntMatch = content.match(/(?:protein interaction|interacts with)[:\s]*([^.]+)/i);
    if (proteinIntMatch) {
      const partners = proteinIntMatch[1].split(/[,;]/).map(p => p.trim());
      interactionData.proteinInteractions = partners.map(partner => ({
        partner,
        partnerSymbol: partner,
        interactionType: 'physical' as const,
        strength: 'medium' as const,
        evidence: ['extracted'],
        confidence: 'medium' as const,
        source: 'extracted'
      }));
    }

    return interactionData as InteractionData;
  }

  private extractDiseaseData(content: string): DiseaseData[] {
    const diseases: DiseaseData[] = [];
    
    // Extract disease associations
    const diseaseMatch = content.match(/(?:disease|disorder|syndrome)[:\s]*([^.]+)/i);
    if (diseaseMatch) {
      const diseaseNames = diseaseMatch[1].split(/[,;]/).map(d => d.trim());
      diseases.push(...diseaseNames.map(disease => ({
        disease,
        associationType: 'causal' as const,
        mutations: [],
        phenotypes: [],
        inheritance: 'autosomal_dominant' as const,
        severity: 'moderate' as const,
        therapeuticTarget: false
      })));
    }

    return diseases;
  }

  private extractEvolutionaryData(content: string): EvolutionaryData {
    const evolutionaryData: Partial<EvolutionaryData> = {
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
    };

    // Extract orthologs
    const orthologMatch = content.match(/(?:ortholog|orthologue)[:\s]*([^.]+)/i);
    if (orthologMatch) {
      const orthologNames = orthologMatch[1].split(/[,;]/).map(o => o.trim());
      evolutionaryData.orthologs = orthologNames.map(ortholog => ({
        organism: 'unknown',
        geneSymbol: ortholog,
        identity: 0,
        function: '',
        evidence: ['extracted']
      }));
    }

    return evolutionaryData as EvolutionaryData;
  }

  private extractLiteratureReferences(content: string): LiteratureReference[] {
    const references: LiteratureReference[] = [];
    const extractedPMIDs = new Set<string>(); // Use Set to prevent duplicates during extraction
    
    // Extract PMIDs with various formats
    const pmidPatterns = [
      /pmid[:\s]*(\d+)/gi,
      /PubMed[:\s]*(\d+)/gi,
      /\b(\d{7,8})\b(?=[^A-Za-z0-9]|$)/g // Standalone PMID-like numbers (7-8 digits)
    ];
    
    // Extract all possible PMIDs using multiple patterns
    for (const pattern of pmidPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Extract the numeric part
          const pmidMatch = match.match(/(\d+)/);
          if (pmidMatch && pmidMatch[1]) {
            const pmid = pmidMatch[1].trim();
            if (pmid && pmid.length >= 7 && pmid.length <= 8) { // Standard PMID format
              extractedPMIDs.add(pmid);
            }
          }
        });
      }
    }
    
    // Extract DOIs as alternative identifiers
    const doiMatches = content.match(/doi[:\s]*([^\s.,;]+)/gi);
    const extractedDOIs = new Set<string>();
    if (doiMatches) {
      doiMatches.forEach(match => {
        const doi = match.replace(/doi[:\s]*/i, '').trim();
        if (doi && doi.includes('10.')) { // Basic DOI validation
          extractedDOIs.add(doi);
        }
      });
    }
    
    // Create references from extracted PMIDs
    extractedPMIDs.forEach(pmid => {
      references.push({
        pmid,
        title: 'Pending validation', // Will be updated by validator
        authors: [],
        journal: 'Pending validation',
        year: new Date().getFullYear(),
        abstract: '',
        relevance: 'medium' as const,
        studyType: 'experimental' as const,
        organism: this.organism,
        methodology: ['pmid_extracted']
      });
    });
    
    // Note: DOIs will be handled during validation phase
    // They can be used as fallback when PMID validation fails
    
    // Extract potential reference sections in text
    const referenceSectionPattern = /(?:references?|bibliography|works cited):[\s\S]{10,5000}/i;
    const refSectionMatch = content.match(referenceSectionPattern);
    if (refSectionMatch && refSectionMatch[0]) {
      // This is a simplified approach - in a real implementation, we would use
      // more sophisticated parsing of reference sections
      const refSection = refSectionMatch[0];
      
      // Extract potential citations with year patterns
      const citationPattern = /([A-Z][a-z\-]+(?:\s+[A-Z][a-z\-]+)*)\s+\((\d{4})\)/g;
      let match;
      
      while ((match = citationPattern.exec(refSection)) !== null) {
        // Check if we already have this reference via PMID
        const authors = match[1].split(/\s+/).filter(name => name.length > 0);
        const year = parseInt(match[2], 10);
        
        // Create a reference with extracted author and year information
        // This will be validated later
        references.push({
          pmid: '',
          title: 'Reference section citation',
          authors,
          journal: 'Unknown',
          year,
          abstract: '',
          relevance: 'medium' as const,
          studyType: 'experimental' as const,
          organism: this.organism,
          methodology: ['text_extracted']
        });
      }
    }

    return references;
  }

  private calculateQualityScore(results: Partial<GeneDataExtractionResult>): number {
    let score = 0;
    let maxScore = 0;

    // Gene basic info (20 points)
    maxScore += 20;
    if (results.geneBasicInfo?.geneID) score += 5;
    if (results.geneBasicInfo?.description) score += 5;
    if (results.geneBasicInfo?.chromosomalLocation) score += 5;
    if (results.geneBasicInfo?.alternativeNames?.length) score += 5;

    // Functional data (25 points)
    maxScore += 25;
    if (results.functionalData?.molecularFunction?.length) score += 8;
    if (results.functionalData?.catalyticActivity) score += 8;
    if (results.functionalData?.enzymeClassification) score += 9;

    // Protein info (20 points)
    maxScore += 20;
    if (results.proteinInfo?.uniprotId) score += 10;
    if (results.proteinInfo?.proteinSize) score += 5;
    if (results.proteinInfo?.molecularWeight) score += 5;

    // Expression data (15 points)
    maxScore += 15;
    if (results.expressionData?.tissueSpecificity?.length) score += 15;

    // Disease data (10 points)
    maxScore += 10;
    if (results.diseaseData?.length) score += 10;

    // Literature (10 points)
    maxScore += 10;
    if (results.literatureReferences?.length) score += 10;

    return maxScore > 0 ? score / maxScore : 0;
  }

  private calculateConfidence(results: Partial<GeneDataExtractionResult>): number {
    // Confidence based on data quality and source reliability
    let confidence = 0.5; // Base confidence

    if (results.geneBasicInfo?.geneID) confidence += 0.1;
    if (results.proteinInfo?.uniprotId) confidence += 0.1;
    if (results.literatureReferences?.length) confidence += 0.1;
    if (results.functionalData?.enzymeClassification) confidence += 0.1;
    if (results.diseaseData?.length) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private calculateCompleteness(results: Partial<GeneDataExtractionResult>): number {
    const fields = [
      results.geneBasicInfo?.geneID,
      results.geneBasicInfo?.description,
      results.functionalData?.molecularFunction?.length,
      results.proteinInfo?.uniprotId,
      results.expressionData?.tissueSpecificity?.length,
      results.diseaseData?.length,
      results.literatureReferences?.length
    ];

    const filledFields = fields.filter(field => field && (typeof field === 'number' ? field > 0 : field.length > 0)).length;
    return filledFields / fields.length;
  }
}

// Gene extraction rules and patterns
export class GeneExtractionRules {
  private patterns: Map<string, RegExp[]>;

  constructor() {
    this.patterns = new Map();
    this.initializePatterns();
  }

  private initializePatterns() {
    // Gene ID patterns
    this.patterns.set('geneId', [
      /gene[-\s]?id[:\s]*(\d+)/i,
      /entrez[-\s]?id[:\s]*(\d+)/i,
      /ncbi[-\s]?id[:\s]*(\d+)/i
    ]);

    // Protein ID patterns
    this.patterns.set('proteinId', [
      /uniprot[-\s]?id[:\s]*([A-Z0-9]+)/i,
      /uniprotkb[:\s]*([A-Z0-9]+)/i,
      /accession[:\s]*([A-Z0-9]+)/i
    ]);

    // Molecular weight patterns
    this.patterns.set('molecularWeight', [
      /molecular[-\s]?weight[:\s]*(\d+(?:\.\d+)?)\s*kda/i,
      /mw[:\s]*(\d+(?:\.\d+)?)\s*kda/i,
      /mass[:\s]*(\d+(?:\.\d+)?)\s*kda/i
    ]);

    // EC number patterns
    this.patterns.set('ecNumber', [
      /ec[:\s]*(\d+\.\d+\.\d+\.\d+)/i,
      /enzyme[-\s]?commission[:\s]*(\d+\.\d+\.\d+\.\d+)/i
    ]);

    // Expression patterns
    this.patterns.set('expression', [
      /expression[:\s]*([^.]+)/i,
      /expressed[:\s]*in[:\s]*([^.]+)/i,
      /tissue[-\s]?specific[:\s]*([^.]+)/i
    ]);
  }

  getPatterns(category: string): RegExp[] {
    return this.patterns.get(category) || [];
  }

  extractValue(text: string, category: string): string | null {
    const patterns = this.getPatterns(category);
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }
}

// Utility functions for data extraction
export function extractQuantitativeData(text: string): { [key: string]: number } {
  const quantitativeData: { [key: string]: number } = {};

  // Kd values
  const kdMatches = text.match(/kd[:\s]*(\d+(?:\.\d+)?)\s*μm/gi);
  if (kdMatches) {
    quantitativeData.kd = parseFloat(kdMatches[0].replace(/kd[:\s]*/i, '').replace(/\s*μm/i, ''));
  }

  // IC50 values
  const ic50Matches = text.match(/ic50[:\s]*(\d+(?:\.\d+)?)\s*μm/gi);
  if (ic50Matches) {
    quantitativeData.ic50 = parseFloat(ic50Matches[0].replace(/ic50[:\s]*/i, '').replace(/\s*μm/i, ''));
  }

  // Expression levels
  const expressionMatches = text.match(/expression[:\s]*(\d+(?:\.\d+)?)\s*(?:fold|times)/gi);
  if (expressionMatches) {
    quantitativeData.expressionLevel = parseFloat(expressionMatches[0].replace(/expression[:\s]*/i, '').replace(/\s*(?:fold|times)/i, ''));
  }

  return quantitativeData;
}

export function extractMolecularMechanisms(text: string): string[] {
  const mechanisms: string[] = [];

  // Catalytic mechanisms
  const catalyticMatch = text.match(/(?:catalytic mechanism|mechanism)[:\s]*([^.]+)/i);
  if (catalyticMatch) {
    mechanisms.push(catalyticMatch[1].trim());
  }

  // Binding mechanisms
  const bindingMatch = text.match(/(?:binding mechanism|binding)[:\s]*([^.]+)/i);
  if (bindingMatch) {
    mechanisms.push(bindingMatch[1].trim());
  }

  // Regulatory mechanisms
  const regulatoryMatch = text.match(/(?:regulatory mechanism|regulation)[:\s]*([^.]+)/i);
  if (regulatoryMatch) {
    mechanisms.push(regulatoryMatch[1].trim());
  }

  return mechanisms;
}

export function extractRegulatoryElements(text: string): string[] {
  const elements: string[] = [];

  // Promoters
  const promoterMatch = text.match(/(?:promoter|promoter region)[:\s]*([^.]+)/i);
  if (promoterMatch) {
    elements.push(promoterMatch[1].trim());
  }

  // Enhancers
  const enhancerMatch = text.match(/(?:enhancer|enhancer region)[:\s]*([^.]+)/i);
  if (enhancerMatch) {
    elements.push(enhancerMatch[1].trim());
  }

  // Transcription factors
  const tfMatch = text.match(/(?:transcription factor|tf)[:\s]*([^.]+)/i);
  if (tfMatch) {
    elements.push(tfMatch[1].trim());
  }

  return elements;
}
