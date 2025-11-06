# Literature Validation and Deduplication System

## Overview

This module provides an advanced literature reference validation and deduplication system for gene research data. It ensures the authenticity of scientific citations, prevents duplicate references, and maintains high quality in research outputs.

## Key Components

### 1. Literature Validator

The `LiteratureValidator` class (<mcfile name="literature-validator.ts" path="./literature-validator.ts"></mcfile>) is the core component that handles reference validation and deduplication:

- **PubMed API Integration**: Validates references by querying the PubMed API using PMIDs
- **Pattern-Based Validation**: Falls back to pattern matching for references without PMIDs
- **Multi-Key Deduplication**: Uses PMID, DOI, and content hashing to detect duplicates
- **Quality Scoring**: Assigns confidence scores to validated references
- **Source Tracking**: Maintains extraction provenance for each reference

### 2. Enhanced Reference Structure

```typescript
interface EnhancedLiteratureReference extends LiteratureReference {
  qualityMetadata: {
    verified: boolean;
    verificationMethod: 'pubmed_api' | 'pattern_validation' | 'manual_review' | 'unknown';
    confidenceScore: number; // 0-100 scale
    warningFlags: string[];
    isDuplicate?: boolean;
    duplicateOf?: string;
  };
  sourceTracking: {
    extractedFrom: string;
    extractionMethod: string;
    extractionConfidence: number;
    processingTimestamp: number;
  };
}
```

### 3. Improved Reference Extraction

The `GeneDataExtractor` class has been enhanced to:

- Extract references using multiple patterns (PMIDs, DOIs, reference sections)
- Track extraction methods and confidence
- Apply validation and deduplication during content processing
- Filter out low-confidence references
- Include quality statistics in extraction metadata

## Validation Flow

1. **Extraction**: References are extracted from content using multiple patterns
2. **Enrichment**: Extraction method and source information is added
3. **Validation**: References are validated via PubMed API or pattern matching
4. **Deduplication**: Duplicates are detected and marked
5. **Filtering**: Low-confidence references are filtered out
6. **Reporting**: Quality statistics are generated and stored

## Anti-Fabrication Measures

- Strict prompt engineering to prevent AI from inventing references
- Multiple validation methods to verify reference authenticity
- Confidence scoring to identify potentially fabricated references
- Deduplication to prevent reference multiplication
- Source tracking for provenance verification

## Quality Metrics

Each extraction includes comprehensive quality statistics:

- `validatedReferences`: Number of successfully validated references
- `duplicateReferences`: Number of duplicate references removed
- `highConfidenceReferences`: Number of references with confidence score ≥ 80
- `warnings`: Number of validation warnings generated

## Implementation Details

### Data Flow

1. Content is processed by `GeneDataExtractor.extractFromContent()`
2. Raw references are extracted and enhanced with source information
3. `LiteratureValidator.processReferences()` validates and deduplicates references
4. Validated references are filtered and mapped to standard format
5. Quality statistics are added to extraction metadata

### Error Handling

The system is designed with robust error handling to:

- Gracefully handle API failures
- Provide fallback validation methods
- Log detailed errors for debugging
- Maintain data integrity even when validation fails

## Usage Example

```typescript
// Initialize the extractor with gene symbol and organism
const extractor = new GeneDataExtractor('BRCA1', 'Homo sapiens');

// Extract and validate data from content
const results = await extractor.extractFromContent(researchContent, 'scientific_paper.pdf');

// Access validated references and quality metrics
console.log(`Extracted ${results.literatureReferences.length} unique references`);
console.log('Reference quality:', results.extractionMetadata?.referenceQuality);
```

## Future Enhancements

- Integration with additional reference databases (Scopus, Web of Science)
- Machine learning models for improved reference quality assessment
- User interface for manual reference review
- Automated correction of common reference formatting issues

## Requirements

- Access to PubMed API (requires internet connection)
- Node.js with TypeScript support
- Dependencies as specified in package.json