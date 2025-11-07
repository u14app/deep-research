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

**CRITICAL INFORMATION EXTRACTION REQUIREMENTS:**

You need to think like a professional molecular biologist conducting systematic literature review.
Generate a list of detailed, information-dense learnings from the contexts.

**Content Requirements:**
- Each learning MUST be as detailed and information-dense as possible
- Include SPECIFIC entities: gene symbols, protein names, pathway names, organism names
- Include QUANTITATIVE data: Kd values, IC50, fold changes, p-values, sample sizes
- Include EXPERIMENTAL details: methods used, cell lines, model organisms, techniques
- Include TEMPORAL information: publication dates, discovery timeline, developmental stages
- Include SPATIAL information: tissue specificity, cellular localization, subcellular compartments
- Include COMPARATIVE data: cross-species comparisons, wild-type vs mutant, control vs treatment

**Information Categories (extract ALL relevant data):**
1. **Molecular Function**:
   - Catalytic activity with specific substrates and products
   - Binding sites with sequence information and structural details
   - Substrate specificity with Km, Kcat values
   - Enzyme classification (EC numbers) and mechanism

2. **Protein Structure**:
   - 3D coordinates (PDB IDs) and resolution
   - Domain architecture with start/end positions
   - Active site residues with specific amino acid numbers
   - Post-translational modifications with specific sites

3. **Regulatory Elements**:
   - Promoter sequences and positions
   - Transcription factor binding sites (TFBS) with consensus sequences
   - Regulatory RNAs (miRNA names, target sites)
   - Epigenetic marks (specific histone modifications, methylation sites)

4. **Expression Data**:
   - Tissue specificity with expression levels (TPM, RPKM, FPKM values)
   - Developmental stage with fold changes
   - Disease states with differential expression (log2 fold change, adjusted p-values)
   - Environmental responses with time course data

5. **Protein Interactions**:
   - Direct binding partners with interaction strength (Kd, Ka values)
   - Complex composition with stoichiometry
   - Interaction domains and binding interfaces
   - Network topology and hub proteins

6. **Disease Associations**:
   - Specific mutations (e.g., p.Arg273His, c.817C>T)
   - Disease names (OMIM IDs, disease prevalence)
   - Phenotypic effects with penetrance and severity
   - Clinical trials and therapeutic outcomes

7. **Evolutionary Data**:
   - Ortholog names and species
   - Sequence identity and similarity percentages
   - Phylogenetic relationships
   - Conserved domains and motifs

8. **Citation Information** (MANDATORY for every learning):
   - First author name and year (e.g., Smith et al., 2023)
   - Journal name and impact factor
   - DOI or PMID (essential for reference tracking)
   - Article title (for specificity)
   - Database IDs (e.g., NCBI Gene ID, UniProt ID)

**Quality Standards:**
- Each learning should be a complete, standalone statement
- Avoid vague terms like "various", "some", "many" - use specific numbers
- Avoid general statements - be as specific as possible
- Include ALL relevant details from the context (err on the side of more detail)
- Cross-reference multiple sources when data is consistent
- Flag conflicting data from different sources
- Prioritize recent publications over older ones when there are updates
- Include negative results and limitations when mentioned

**Format Example:**
"The BRCA1 protein (breast cancer 1, UniProt: P38398) contains an N-terminal RING domain (residues 1-109) that functions as an E3 ubiquitin ligase with documented E3 ligase activity (Kd = 2.5 ± 0.3 μM for BARD1 binding; Hashizume et al., 2001, Nature, PMID: 11242110). BRCA1 is predominantly expressed in proliferating cells with peak expression during S phase (2.5-fold increase vs G1 phase, p<0.001; Vaughn et al., 1996, Cell Growth Differ, PMID: 8822472), and shows highest expression in breast and ovarian tissues (TPM >50 in GTEx database)."

Make sure each learning is unique and not similar to each other.
The learnings should be comprehensive, scientifically rigorous, and include ALL relevant molecular biology details.
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

Write a comprehensive, scientifically rigorous gene function research report based on the plan using ALL the learnings from research.

**CRITICAL REPORT REQUIREMENTS:**

**1. Length and Depth:**
- Aim for 8,000-12,000 words for comprehensive coverage
- Each major section should be 800-1,500 words with substantial detail
- Include ALL learnings from the research (do not summarize or skip details)
- Prioritize information density over brevity
- Use technical terminology appropriate for expert molecular biologists

**2. Required Report Structure:**

### **Executive Summary** (500-800 words)
- Synthesize the most critical findings across all sections
- Highlight novel insights and significant discoveries
- Include key quantitative findings (expression levels, binding affinities, etc.)
- Mention clinical significance and therapeutic potential

### **Gene Overview** (800-1,200 words)
- Official gene symbol, full name, and all aliases
- Genomic location with precise coordinates (chromosome, start, end positions)
- Gene structure (exons, introns, transcript variants, alternative splicing)
- Evolutionary origin and gene family relationships
- Basic protein information (length, molecular weight, isoelectric point)
- Database identifiers (NCBI Gene ID, Ensembl ID, UniProt ID, OMIM ID)

### **Molecular Function** (1,200-1,800 words)
- Detailed catalytic mechanism with enzyme kinetics (Km, Kcat, Vmax)
- Substrate specificity and product formation
- Cofactor requirements and metal ion binding
- Protein domains with precise residue boundaries
- Functional motifs and their specific roles
- Structure-function relationships
- Biochemical assays and experimental validation
- Comparison with related enzymes or proteins

### **Protein Structure** (1,000-1,500 words)
- 3D structure information (PDB IDs, resolution, method)
- Secondary structure elements (α-helices, β-sheets) with positions
- Tertiary and quaternary structure organization
- Active site architecture with key residues
- Substrate binding pockets and binding modes
- Allosteric sites and regulatory mechanisms
- Structural dynamics and conformational changes
- Structure-based drug design implications

### **Regulatory Mechanisms** (1,200-1,600 words)
- Transcriptional regulation:
  * Promoter architecture and regulatory elements
  * Transcription factors that regulate expression
  * Enhancers, silencers, and their genomic locations
  * Epigenetic regulation (DNA methylation, histone modifications)
- Post-transcriptional regulation:
  * mRNA stability and decay mechanisms
  * Alternative splicing patterns and regulation
  * miRNA targeting and regulatory effects
  * RNA-binding proteins
- Post-translational modifications:
  * Phosphorylation sites and kinases
  * Ubiquitination and proteasomal degradation
  * Acetylation, methylation, glycosylation
  * Functional consequences of modifications

### **Expression Patterns** (1,000-1,400 words)
- Tissue-specific expression with quantitative levels
- Cell-type specific expression
- Subcellular localization and trafficking
- Developmental expression patterns
- Expression in different physiological states
- Environmental and stimulus-induced changes
- Disease-associated expression alterations
- Expression data from major databases (GTEx, HPA, GEO)

### **Protein Interactions** (1,000-1,400 words)
- Direct protein-protein interactions with binding affinities
- Protein complex composition and assembly
- Interaction domains and interfaces
- Functional significance of each interaction
- Network topology and pathway connections
- Co-expression and co-localization data
- Experimental validation methods (Y2H, Co-IP, etc.)
- Interaction databases (STRING, BioGRID, IntAct)

### **Evolutionary Conservation** (800-1,200 words)
- Phylogenetic distribution across species
- Ortholog identification with sequence identity
- Paralog relationships and gene duplication events
- Conserved domains and functional motifs
- Species-specific variations and adaptations
- Evolutionary constraints and selection pressure
- Functional conservation vs divergence
- Model organism studies and comparative analysis

### **Disease Associations** (1,200-1,800 words)
- Specific disease-causing mutations with molecular consequences
- Polymorphisms and genetic variants (SNPs, CNVs)
- Disease phenotypes and clinical manifestations
- Genotype-phenotype correlations
- Penetrance and disease severity
- Molecular pathogenesis mechanisms
- Animal models and disease modeling
- Patient data and clinical studies
- OMIM entries and ClinVar annotations

### **Therapeutic Implications** (1,000-1,500 words)
- Druggability assessment and target validation
- Existing drugs and inhibitors with IC50/EC50 values
- Drug development pipelines and clinical trials
- Structure-based drug design opportunities
- Resistance mechanisms and combination strategies
- Biomarker potential for diagnosis/prognosis
- Gene therapy and precision medicine approaches
- Future therapeutic directions

### **Research Gaps and Future Directions** (600-1,000 words)
- Current limitations in understanding
- Unresolved mechanistic questions
- Technical challenges and methodological needs
- Emerging research areas and technologies
- Translational opportunities
- Proposed experimental approaches

**3. Content Quality Standards:**
- Use ALL learnings from the research - do not omit any significant findings
- Include specific quantitative values (don't say "high expression" - say "TPM = 45.3")
- Include specific molecular details (don't say "several domains" - list each domain)
- Include experimental evidence and methodology
- Cross-reference findings across different studies
- Highlight consensus findings vs conflicting data
- Use precise molecular biology terminology
- Include database identifiers and accession numbers

**4. DO NOT Include These Sections:**
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
Make the report as comprehensive and information-rich as possible.

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
