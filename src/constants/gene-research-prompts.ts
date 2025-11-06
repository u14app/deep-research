// Gene-specific research prompts and system instructions
// Optimized for molecular biology and genetics research

export const geneResearchSystemInstruction = `You are an expert molecular biologist and geneticist specializing in gene function research. Today is {now}. Follow these instructions when responding:

- Focus specifically on gene function, protein structure, regulatory mechanisms, and evolutionary relationships
- Prioritize primary literature from PubMed, NCBI, UniProt, and specialized genomics databases
- Always consider molecular mechanisms, biochemical pathways, and cellular context
- Include quantitative data (Kd values, expression levels, mutation effects) when available
- Analyze gene function across different organisms and evolutionary contexts
- Consider both normal and pathological gene function
- Emphasize experimental evidence over computational predictions
- Include structural biology insights when relevant
- Consider gene-environment interactions and phenotypic consequences
- Use precise molecular biology terminology and gene nomenclature
- Cross-reference multiple databases and experimental systems for validation
- Consider both in vitro and in vivo experimental evidence
- Include information about gene regulation at transcriptional, post-transcriptional, and post-translational levels
- Always provide proper scientific citations for all claims and data
- Include comprehensive reference lists with DOI/PMID when available
- Ensure all statements are supported by credible scientific sources

**CRITICAL: Do NOT include sections that are not relevant to gene function research such as:**
- Data Availability & Reproducibility Bundle
- Code & Protocols
- Strain & Plasmid Requests
- Materials and Methods (unless specifically about gene function experiments)
- Supplementary Information
- Author Contributions
- Funding Information
- Competing Interests
- Ethics Statements

Focus exclusively on the biological function, molecular mechanisms, and scientific significance of genes and proteins.`;

export const geneResearchQuestionPrompt = `Given the following gene research query from the user, ask at least 5 follow-up questions to clarify the research direction:

<QUERY>
{query}
</QUERY>

Questions should focus on:
- Specific gene symbol and organism of interest
- Particular aspects of gene function (molecular, cellular, organismal)
- Experimental approaches or methodologies of interest
- Disease context or phenotypic outcomes
- Comparative analysis across species or tissues
- Time course or developmental stage considerations

Questions need to be brief and concise. Focus on molecular biology and genetics aspects.`;

export const geneReportPlanPrompt = `Given the following gene research query from the user:
<QUERY>
{query}
</QUERY>

Generate a comprehensive research plan for gene function analysis. Your plan should include these essential sections:

1. **Gene Overview** - Basic gene information, nomenclature, and genomic context
2. **Molecular Function** - Catalytic activity, protein domains, and biochemical properties
3. **Protein Structure** - 3D structure, functional domains, and active sites
4. **Regulatory Mechanisms** - Transcriptional, post-transcriptional, and post-translational regulation
5. **Expression Patterns** - Tissue-specific expression, developmental regulation, and environmental responses
6. **Protein Interactions** - Protein-protein interactions, complexes, and networks
7. **Evolutionary Conservation** - Orthologs, paralogs, and evolutionary relationships
8. **Disease Associations** - Mutations, polymorphisms, and disease phenotypes
9. **Therapeutic Implications** - Drug targets, therapeutic strategies, and clinical relevance
10. **Research Gaps** - Current limitations and future research directions

**IMPORTANT: Do NOT include the following sections in your research plan:**
- Data Availability & Reproducibility Bundle
- Code & Protocols
- Strain & Plasmid Requests
- Materials and Methods
- Supplementary Information
- Author Contributions
- Funding Information
- Competing Interests
- Ethics Statements

Each section should have a clear research goal and specific questions to investigate, focusing exclusively on gene function and molecular mechanisms.`;

export const geneSerpQueriesPrompt = `This is the gene research plan after user confirmation:
<PLAN>
{plan}
</PLAN>

Based on the gene research plan, generate a comprehensive list of SERP queries to investigate gene function. Focus on:

1. **Primary Literature Searches** - PubMed, NCBI Gene, and specialized databases
2. **Protein Structure Analysis** - PDB, UniProt, and structural biology databases
3. **Expression Data** - GEO, GTEx, and tissue-specific expression databases
4. **Pathway Analysis** - KEGG, Reactome, and metabolic pathway databases
5. **Disease Associations** - OMIM, ClinVar, and clinical genetics databases
6. **Evolutionary Analysis** - OrthoDB, Ensembl, and comparative genomics
7. **Regulatory Networks** - ENCODE, ChIP-seq, and regulatory element databases
8. **Protein Interactions** - STRING, BioGRID, and interaction databases

Make sure each query is specific to gene function research and targets relevant scientific databases.

${serpQuerySchemaPrompt}`;

export const geneSearchResultPrompt = `Given the following contexts from a gene research search for the query:
<QUERY>
{query}
</QUERY>

You need to organize the searched information according to the following requirements:
<RESEARCH_GOAL>
{researchGoal}
</RESEARCH_GOAL>

The following context from the gene research search:
<CONTEXT>
{context}
</CONTEXT>

Extract and organize gene-specific information:
- **Molecular Function**: Catalytic activity, binding sites, substrate specificity
- **Protein Structure**: Domains, motifs, 3D structure information
- **Regulatory Elements**: Promoters, enhancers, transcription factors
- **Expression Data**: Tissue specificity, developmental stage, expression levels
- **Protein Interactions**: Binding partners, complexes, networks
- **Disease Associations**: Mutations, phenotypes, clinical relevance
- **Evolutionary Data**: Conservation, orthologs, paralogs
- **Quantitative Data**: Kd values, IC50, expression levels, binding affinities
- **Citation Information**: Author names, publication year, journal, DOI/PMID, title

Make sure each learning is specific to gene function and includes relevant molecular biology details.
Include proper citation information for all extracted data to ensure accurate referencing in the final report.`;

export const geneFinalReportPrompt = `This is the gene research plan after user confirmation:
<PLAN>
{plan}
</PLAN>

Here are all the learnings from previous gene research:
<LEARNINGS>
{learnings}
</LEARNINGS>

Here are all the sources from previous research, if any:
<SOURCES>
{sources}
</SOURCES>

Here are all the images from previous research, if any:
<IMAGES>
{images}
</IMAGES>

Please write according to the user's writing requirements, if any:
<REQUIREMENT>
{requirement}
</REQUIREMENT>

Write a comprehensive gene function research report based on the plan using the learnings from research.
The report should be detailed and scientifically rigorous, including:

- **Executive Summary** with key findings
- **Gene Overview** with basic information and nomenclature
- **Molecular Function** with detailed biochemical analysis
- **Protein Structure** with structural biology insights
- **Regulatory Mechanisms** with comprehensive regulation analysis
- **Expression Patterns** with tissue and developmental specificity
- **Protein Interactions** with network analysis
- **Evolutionary Conservation** with comparative genomics
- **Disease Associations** with clinical relevance
- **Therapeutic Implications** with drug development insights
- **Research Gaps** with future directions

**IMPORTANT: Do NOT include the following sections that are not relevant to gene function research:**
- Data Availability & Reproducibility Bundle
- Code & Protocols
- Strain & Plasmid Requests
- Materials and Methods (unless specifically about gene function experiments)
- Supplementary Information
- Author Contributions
- Funding Information
- Competing Interests
- Ethics Statements

Focus exclusively on gene function, molecular mechanisms, and biological significance.
Include quantitative data, experimental evidence, and cross-species comparisons where relevant.

**CITATION REQUIREMENTS:**
- Cite research references at the end of paragraphs when appropriate using [number] format
- Include a comprehensive reference list at the end of the report
- Use proper scientific citation format (Author, Year, Title, Journal, DOI/PMID)
- Reference sources from the provided research data
- Ensure all claims are properly supported with citations
- Include DOI or PMID when available for easy access to original sources

**Respond only the final report content, and no additional text before or after.**`;

export const geneKnowledgeGraphPrompt = `Based on the following gene research article, please extract the key molecular entities and relationships, then generate a Mermaid graph code that visualizes these entities and their relationships.

Focus on:
- **Gene entities**: Gene symbols, protein names, functional domains
- **Molecular interactions**: Protein-protein, protein-DNA, protein-RNA interactions
- **Regulatory relationships**: Transcription factors, regulatory elements, signaling pathways
- **Biological processes**: Metabolic pathways, cellular processes, disease mechanisms
- **Structural elements**: Protein domains, binding sites, active sites
- **Evolutionary relationships**: Orthologs, paralogs, gene families

## Output format requirements

1. Use Mermaid's graph TD (Top-Down) or graph LR (Left-Right) type.
2. Create unique node IDs for each molecular entity (use gene symbols, protein names, or descriptive abbreviations).
3. Display full names or key descriptions in node shapes (e.g., GeneA[BRCA1], ProteinB[p53], DomainC[BRCT domain]).
4. Relationships should be labeled with specific interaction types (e.g., "binds", "regulates", "phosphorylates", "transcribes").
5. Respond with ONLY the Mermaid code (including block), and no additional text before or after.
6. Focus on the most important molecular entities and their key relationships.
7. All text content **MUST** be wrapped in \`"\` syntax. (e.g., "Any Text Content")
8. Ensure all content complies with Mermaid syntax, especially that all text needs to be wrapped in \`"\`.`;

// Import the generic serpQuerySchemaPrompt
import { serpQuerySchemaPrompt } from './prompts';

// Default gene function research prompt for user customization
export const defaultGeneResearchPrompt = `Please conduct a comprehensive analysis of the gene function for {geneSymbol} in {organism}. 

**Research Objectives:**
- Analyze the molecular function and biological role of {geneSymbol}
- Investigate protein structure, domains, and functional motifs
- Examine gene expression patterns and regulatory mechanisms
- Explore protein-protein interactions and biological pathways
- Assess evolutionary conservation and ortholog relationships
- Investigate disease associations and clinical relevance
- Evaluate therapeutic potential and drug targets

**Key Areas of Focus:**
- Molecular mechanisms and biochemical properties
- Cellular localization and tissue-specific expression
- Regulatory networks and signaling pathways
- Mutations, polymorphisms, and phenotypic effects
- Comparative genomics across species
- Structural biology and 3D protein modeling
- Functional validation studies and experimental evidence

**Research Requirements:**
- Use primary literature from PubMed, NCBI, UniProt, and specialized databases
- Include quantitative data (Kd values, expression levels, binding affinities)
- Provide proper scientific citations for all claims
- Focus on experimental evidence over computational predictions
- Consider both normal and pathological gene function
- Analyze gene function across different developmental stages and conditions

**Output Format:**
- Comprehensive gene function research report
- Detailed molecular analysis with scientific rigor
- Proper citation format with reference list
- Focus on biological significance and scientific insights

Please ensure the analysis is thorough, scientifically accurate, and provides valuable insights into the function and significance of {geneSymbol} in {organism}.`;
