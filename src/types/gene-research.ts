// Gene research specific data structures and types
// Comprehensive type definitions for molecular biology research

export interface GeneBasicInfo {
  geneSymbol: string;
  organism: string;
  geneID: string;
  alternativeNames: string[];
  chromosomalLocation: string;
  genomicCoordinates: {
    chromosome: string;
    start: number;
    end: number;
    strand: '+' | '-';
  };
  geneType: 'protein_coding' | 'lncRNA' | 'miRNA' | 'pseudogene' | 'other';
  description: string;
}

export interface ProteinInfo {
  uniprotId: string;
  proteinName: string;
  proteinSize: number; // amino acid residues
  molecularWeight: number; // kDa
  isoelectricPoint: number;
  subcellularLocation: string[];
  proteinDomains: ProteinDomain[];
  bindingSites: BindingSite[];
  catalyticActivity: string;
  cofactors: string[];
  postTranslationalModifications: PTM[];
}

export interface ProteinDomain {
  name: string;
  start: number;
  end: number;
  type: 'functional' | 'structural' | 'regulatory';
  description: string;
  pfamId?: string;
  interproId?: string;
}

export interface PTM {
  type: 'phosphorylation' | 'acetylation' | 'methylation' | 'ubiquitination' | 'other';
  position: number;
  residue: string;
  function: string;
}

export interface FunctionalData {
  molecularFunction: string[];
  biologicalProcess: string[];
  cellularComponent: string[];
  catalyticActivity: string;
  substrateSpecificity: string;
  bindingSites: BindingSite[];
  enzymeClassification: string; // EC number
}

export interface BindingSite {
  name: string;
  position: number;
  type: 'active_site' | 'allosteric' | 'binding_pocket' | 'other';
  ligands: string[];
  affinity?: number; // Kd value
  description: string;
}

export interface ExpressionData {
  tissueSpecificity: TissueExpression[];
  developmentalStage: DevelopmentalExpression[];
  environmentalResponse: EnvironmentalExpression[];
  expressionLevel: {
    high: string[];
    medium: string[];
    low: string[];
  };
  regulation: ExpressionRegulation[];
}

export interface TissueExpression {
  tissue: string;
  expressionLevel: 'high' | 'medium' | 'low' | 'absent';
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export interface DevelopmentalExpression {
  stage: string;
  expressionLevel: 'high' | 'medium' | 'low' | 'absent';
  organism: string;
  source: string;
}

export interface EnvironmentalExpression {
  condition: string;
  effect: 'upregulated' | 'downregulated' | 'unchanged';
  foldChange?: number;
  organism: string;
  source: string;
}

export interface ExpressionRegulation {
  regulator: string;
  type: 'transcriptional' | 'post_transcriptional' | 'post_translational';
  effect: 'activation' | 'repression' | 'modification';
  mechanism: string;
  evidence: string;
}

export interface InteractionData {
  proteinInteractions: ProteinInteraction[];
  dnaInteractions: DNAInteraction[];
  rnaInteractions: RNAInteraction[];
  smallMoleculeInteractions: SmallMoleculeInteraction[];
  complexes: ProteinComplex[];
}

export interface ProteinInteraction {
  partner: string;
  partnerSymbol: string;
  interactionType: 'physical' | 'functional' | 'regulatory';
  strength: 'strong' | 'medium' | 'weak';
  evidence: string[];
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export interface DNAInteraction {
  sequence: string;
  type: 'promoter' | 'enhancer' | 'silencer' | 'other';
  bindingSite: string;
  affinity?: number;
  function: string;
  evidence: string[];
}

export interface RNAInteraction {
  rnaType: 'mRNA' | 'lncRNA' | 'miRNA' | 'other';
  target: string;
  interactionType: 'binding' | 'regulation' | 'processing';
  mechanism: string;
  evidence: string[];
}

export interface SmallMoleculeInteraction {
  molecule: string;
  type: 'substrate' | 'inhibitor' | 'activator' | 'cofactor';
  affinity?: number; // Kd or Ki value
  mechanism: string;
  evidence: string[];
}

export interface ProteinComplex {
  name: string;
  subunits: string[];
  function: string;
  stoichiometry: string;
  evidence: string[];
}

export interface DiseaseData {
  disease: string;
  omimId?: string;
  associationType: 'causal' | 'risk_factor' | 'modifier' | 'other';
  mutations: Mutation[];
  phenotypes: string[];
  inheritance: 'autosomal_dominant' | 'autosomal_recessive' | 'x_linked' | 'mitochondrial' | 'other';
  prevalence?: number;
  ageOfOnset?: string;
  severity: 'mild' | 'moderate' | 'severe';
  therapeuticTarget: boolean;
}

export interface Mutation {
  type: 'missense' | 'nonsense' | 'frameshift' | 'splice_site' | 'deletion' | 'duplication' | 'other';
  position: number;
  change: string; // e.g., "R175H"
  effect: 'pathogenic' | 'likely_pathogenic' | 'uncertain_significance' | 'likely_benign' | 'benign';
  frequency?: number; // population frequency
  clinicalSignificance: string;
}

export interface LiteratureReference {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  relevance: 'high' | 'medium' | 'low';
  studyType: 'experimental' | 'computational' | 'review' | 'meta_analysis';
  organism: string;
  methodology: string[];
}

export interface EvolutionaryData {
  orthologs: Ortholog[];
  paralogs: Paralog[];
  geneFamily: string;
  conservation: ConservationData;
  duplicationEvents: DuplicationEvent[];
}

export interface Ortholog {
  organism: string;
  geneSymbol: string;
  identity: number; // percentage
  function: string;
  evidence: string[];
}

export interface Paralog {
  geneSymbol: string;
  identity: number; // percentage
  function: string;
  divergenceTime?: number; // million years ago
  evidence: string[];
}

export interface ConservationData {
  overallConservation: 'high' | 'medium' | 'low';
  conservedDomains: string[];
  variableRegions: string[];
  functionalConservation: 'high' | 'medium' | 'low';
}

export interface DuplicationEvent {
  type: 'whole_genome' | 'segmental' | 'tandem' | 'retrotransposition';
  time: number; // million years ago
  paralogs: string[];
  evidence: string[];
}

export interface GeneResearchWorkflow {
  // Phase 1: Gene Identification & Basic Information
  geneIdentification: GeneBasicInfo;
  
  // Phase 2: Functional Analysis
  functionalAnalysis: FunctionalData;
  
  // Phase 3: Protein Information
  proteinInfo: ProteinInfo;
  
  // Phase 4: Expression Analysis
  expressionAnalysis: ExpressionData;
  
  // Phase 5: Regulatory Networks
  regulatoryAnalysis: ExpressionRegulation[];
  
  // Phase 6: Interaction Networks
  interactionAnalysis: InteractionData;
  
  // Phase 7: Disease Associations
  diseaseAnalysis: DiseaseData[];
  
  // Phase 8: Evolutionary Analysis
  evolutionaryAnalysis: EvolutionaryData;
  
  // Phase 9: Literature Review
  literatureReview: LiteratureReference[];
}

export interface GeneResearchQualityMetrics {
  dataCompleteness: number; // 0-1
  literatureCoverage: number; // 0-1
  experimentalEvidence: number; // 0-1
  crossSpeciesValidation: number; // 0-1
  databaseConsistency: number; // 0-1
  overallQuality: number; // 0-1
}

export interface GeneSearchTask {
  query: string;
  researchGoal: string;
  database: string;
  priority: 'high' | 'medium' | 'low';
  category: 'basic_info' | 'function' | 'structure' | 'expression' | 'interactions' | 'disease' | 'evolution' | 'pathway';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: any;
  learning?: string;
}

export interface GeneKnowledgeBase {
  geneProfiles: {
    [geneId: string]: {
      basicInfo: GeneBasicInfo;
      functionalData: FunctionalData;
      proteinInfo: ProteinInfo;
      expressionData: ExpressionData;
      interactionData: InteractionData;
      diseaseAssociations: DiseaseData[];
      evolutionaryData: EvolutionaryData;
      literature: LiteratureReference[];
      lastUpdated: number;
      qualityMetrics: GeneResearchQualityMetrics;
    };
  };
  
  searchCapabilities: {
    byFunction: (func: string) => string[];
    byPathway: (pathway: string) => string[];
    byDisease: (disease: string) => string[];
    byExpression: (tissue: string, condition: string) => string[];
    byInteraction: (partner: string) => string[];
    byStructure: (domain: string) => string[];
  };
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
  };
}
