// Gene-specific API integrations
// Comprehensive API integration for molecular biology databases

export interface APIIntegrationResult {
  success: boolean;
  data: any;
  error?: string;
  metadata: {
    source: string;
    timestamp: number;
    confidence: number;
    completeness: number;
  };
}

export class GeneAPIIntegrations {
  private geneSymbol: string;
  private organism: string;
  private apiKeys: Map<string, string>;

  constructor(geneSymbol: string, organism: string, apiKeys: Map<string, string> = new Map()) {
    this.geneSymbol = geneSymbol;
    this.organism = organism;
    this.apiKeys = apiKeys;
  }

  // NCBI Gene API integration
  async fetchNCBIGeneData(): Promise<APIIntegrationResult> {
    try {
      const geneId = await this.searchGeneId();
      if (!geneId) {
        return {
          success: false,
          data: null,
          error: 'Gene ID not found',
          metadata: {
            source: 'ncbi_gene',
            timestamp: Date.now(),
            confidence: 0,
            completeness: 0
          }
        };
      }

      const geneData = await this.fetchGeneDetails(geneId);
      const proteinData = await this.fetchProteinData(geneId);
      const expressionData = await this.fetchExpressionData(geneId);

      return {
        success: true,
        data: {
          gene: geneData,
          protein: proteinData,
          expression: expressionData
        },
        metadata: {
          source: 'ncbi_gene',
          timestamp: Date.now(),
          confidence: 0.9,
          completeness: 0.8
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'ncbi_gene',
          timestamp: Date.now(),
          confidence: 0,
          completeness: 0
        }
      };
    }
  }

  private async searchGeneId(): Promise<string | null> {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&term=${this.geneSymbol}[Gene Name] AND ${this.organism}[Organism]&retmode=json`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    const geneIds = data.esearchresult?.idlist;
    return geneIds && geneIds.length > 0 ? geneIds[0] : null;
  }

  private async fetchGeneDetails(geneId: string): Promise<any> {
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=gene&id=${geneId}&retmode=xml`;
    
    const response = await fetch(fetchUrl);
    const xmlData = await response.text();
    
    // Parse XML and extract gene information
    return this.parseNCBIGeneXML(xmlData);
  }

  private async fetchProteinData(geneId: string): Promise<any> {
    const proteinUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=gene&id=${geneId}&db=protein&retmode=json`;
    
    const response = await fetch(proteinUrl);
    const data = await response.json();
    
    const proteinIds = data.linksets?.[0]?.linksetdbs?.[0]?.links;
    if (!proteinIds || proteinIds.length === 0) return null;

    const proteinId = proteinIds[0];
    const proteinFetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=${proteinId}&retmode=xml`;
    
    const proteinResponse = await fetch(proteinFetchUrl);
    const proteinXmlData = await proteinResponse.text();
    
    return this.parseNCBIProteinXML(proteinXmlData);
  }

  private async fetchExpressionData(geneId: string): Promise<any> {
    const expressionUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=gene&id=${geneId}&db=gds&retmode=json`;
    
    const response = await fetch(expressionUrl);
    const data = await response.json();
    
    return data;
  }

  // UniProt API integration
  async fetchUniProtData(): Promise<APIIntegrationResult> {
    try {
      const uniprotId = await this.searchUniProtId();
      if (!uniprotId) {
        return {
          success: false,
          data: null,
          error: 'UniProt ID not found',
          metadata: {
            source: 'uniprot',
            timestamp: Date.now(),
            confidence: 0,
            completeness: 0
          }
        };
      }

      const proteinData = await this.fetchUniProtProtein(uniprotId);
      const functionalData = await this.fetchUniProtFunctional(uniprotId);
      const interactionData = await this.fetchUniProtInteractions(uniprotId);

      return {
        success: true,
        data: {
          protein: proteinData,
          functional: functionalData,
          interactions: interactionData
        },
        metadata: {
          source: 'uniprot',
          timestamp: Date.now(),
          confidence: 0.95,
          completeness: 0.9
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'uniprot',
          timestamp: Date.now(),
          confidence: 0,
          completeness: 0
        }
      };
    }
  }

  private async searchUniProtId(): Promise<string | null> {
    const searchUrl = `https://rest.uniprot.org/uniprotkb/search?query=gene:${this.geneSymbol} AND organism:${this.organism}&format=json&size=1`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    const results = data.results;
    return results && results.length > 0 ? results[0].uniProtkbId : null;
  }

  private async fetchUniProtProtein(uniprotId: string): Promise<any> {
    const proteinUrl = `https://rest.uniprot.org/uniprotkb/${uniprotId}`;
    
    const response = await fetch(proteinUrl);
    const data = await response.json();
    
    return data;
  }

  private async fetchUniProtFunctional(uniprotId: string): Promise<any> {
    const functionalUrl = `https://rest.uniprot.org/uniprotkb/${uniprotId}?fields=function,ec,keywords,pathway`;
    
    const response = await fetch(functionalUrl);
    const data = await response.json();
    
    return data;
  }

  private async fetchUniProtInteractions(uniprotId: string): Promise<any> {
    const interactionUrl = `https://rest.uniprot.org/uniprotkb/${uniprotId}?fields=interactions`;
    
    const response = await fetch(interactionUrl);
    const data = await response.json();
    
    return data;
  }

  // PDB API integration
  async fetchPDBData(): Promise<APIIntegrationResult> {
    try {
      const searchUrl = `https://data.rcsb.org/search?q=${this.geneSymbol}&rows=10&format=json`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      const structures = data.result?.docs || [];
      if (structures.length === 0) {
        return {
          success: false,
          data: null,
          error: 'No structures found',
          metadata: {
            source: 'pdb',
            timestamp: Date.now(),
            confidence: 0,
            completeness: 0
          }
        };
      }

      const structureData = await Promise.all(
        structures.map(async (struct: any) => {
          const structureUrl = `https://data.rcsb.org/rest/v1/core/entry/${struct.pdbx_descriptor}`;
          const structResponse = await fetch(structureUrl);
          return structResponse.json();
        })
      );

      return {
        success: true,
        data: {
          structures: structureData,
          count: structures.length
        },
        metadata: {
          source: 'pdb',
          timestamp: Date.now(),
          confidence: 0.8,
          completeness: 0.7
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'pdb',
          timestamp: Date.now(),
          confidence: 0,
          completeness: 0
        }
      };
    }
  }

  // GEO API integration
  async fetchGEOData(): Promise<APIIntegrationResult> {
    try {
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gds&term=${this.geneSymbol}[Gene Symbol] AND ${this.organism}[Organism]&retmode=json&retmax=20`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      const gdsIds = data.esearchresult?.idlist;
      if (!gdsIds || gdsIds.length === 0) {
        return {
          success: false,
          data: null,
          error: 'No expression data found',
          metadata: {
            source: 'geo',
            timestamp: Date.now(),
            confidence: 0,
            completeness: 0
          }
        };
      }

      const expressionData = await Promise.all(
        gdsIds.slice(0, 5).map(async (gdsId: string) => {
          const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=gds&id=${gdsId}&retmode=xml`;
          const gdsResponse = await fetch(fetchUrl);
          const gdsXmlData = await gdsResponse.text();
          return this.parseGEOXML(gdsXmlData);
        })
      );

      return {
        success: true,
        data: {
          expression: expressionData,
          count: gdsIds.length
        },
        metadata: {
          source: 'geo',
          timestamp: Date.now(),
          confidence: 0.7,
          completeness: 0.6
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'geo',
          timestamp: Date.now(),
          confidence: 0,
          completeness: 0
        }
      };
    }
  }

  // KEGG API integration
  async fetchKEGGData(): Promise<APIIntegrationResult> {
    try {
      const searchUrl = `https://rest.kegg.jp/search/genes/${this.geneSymbol}`;
      
      const response = await fetch(searchUrl);
      const data = await response.text();
      
      if (!data || data.trim() === '') {
        return {
          success: false,
          data: null,
          error: 'No KEGG data found',
          metadata: {
            source: 'kegg',
            timestamp: Date.now(),
            confidence: 0,
            completeness: 0
          }
        };
      }

      const pathwayData = await this.fetchKEGGPathways(data);
      const orthologData = await this.fetchKEGGOrthologs(data);

      return {
        success: true,
        data: {
          pathways: pathwayData,
          orthologs: orthologData
        },
        metadata: {
          source: 'kegg',
          timestamp: Date.now(),
          confidence: 0.8,
          completeness: 0.7
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'kegg',
          timestamp: Date.now(),
          confidence: 0,
          completeness: 0
        }
      };
    }
  }

  private async fetchKEGGPathways(geneData: string): Promise<any> {
    // Parse gene data to extract pathway information
    const lines = geneData.split('\n');
    const pathways: any[] = [];

    for (const line of lines) {
      if (line.includes('path:')) {
        const pathwayId = line.split('path:')[1].trim();
        const pathwayUrl = `https://rest.kegg.jp/get/${pathwayId}`;
        
        try {
          const response = await fetch(pathwayUrl);
          const pathwayData = await response.text();
          pathways.push({
            id: pathwayId,
            data: pathwayData
          });
        } catch (error) {
          console.error(`Error fetching pathway ${pathwayId}:`, error);
        }
      }
    }

    return pathways;
  }

  private async fetchKEGGOrthologs(geneData: string): Promise<any> {
    // Parse gene data to extract ortholog information
    const lines = geneData.split('\n');
    const orthologs: any[] = [];

    for (const line of lines) {
      if (line.includes('ko:')) {
        const koId = line.split('ko:')[1].trim();
        const koUrl = `https://rest.kegg.jp/get/${koId}`;
        
        try {
          const response = await fetch(koUrl);
          const koData = await response.text();
          orthologs.push({
            id: koId,
            data: koData
          });
        } catch (error) {
          console.error(`Error fetching ortholog ${koId}:`, error);
        }
      }
    }

    return orthologs;
  }

  // STRING API integration
  async fetchSTRINGData(): Promise<APIIntegrationResult> {
    try {
      const stringId = await this.getSTRINGId();
      if (!stringId) {
        return {
          success: false,
          data: null,
          error: 'STRING ID not found',
          metadata: {
            source: 'string',
            timestamp: Date.now(),
            confidence: 0,
            completeness: 0
          }
        };
      }

      const interactionUrl = `https://string-db.org/api/tsv/network?identifiers=${stringId}&species=${this.getSTRINGSpecies()}`;
      
      const response = await fetch(interactionUrl);
      const data = await response.text();
      
      const interactions = this.parseSTRINGData(data);

      return {
        success: true,
        data: {
          interactions,
          stringId
        },
        metadata: {
          source: 'string',
          timestamp: Date.now(),
          confidence: 0.8,
          completeness: 0.8
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'string',
          timestamp: Date.now(),
          confidence: 0,
          completeness: 0
        }
      };
    }
  }

  private async getSTRINGId(): Promise<string | null> {
    const mappingUrl = `https://string-db.org/api/tsv/get_string_ids?identifiers=${this.geneSymbol}&species=${this.getSTRINGSpecies()}`;
    
    const response = await fetch(mappingUrl);
    const data = await response.text();
    
    const lines = data.split('\n');
    if (lines.length > 1) {
      const fields = lines[1].split('\t');
      return fields[0]; // stringId
    }
    
    return null;
  }

  private getSTRINGSpecies(): string {
    const speciesMap: { [key: string]: string } = {
      'Homo sapiens': '9606',
      'Mus musculus': '10090',
      'Rattus norvegicus': '10116',
      'Drosophila melanogaster': '7227',
      'Caenorhabditis elegans': '6239',
      'Saccharomyces cerevisiae': '559292',
      'Escherichia coli': '562'
    };
    
    return speciesMap[this.organism] || '9606';
  }

  private parseSTRINGData(data: string): any[] {
    const lines = data.split('\n');
    const interactions: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const fields = lines[i].split('\t');
      if (fields.length >= 15) {
        interactions.push({
          stringIdA: fields[0],
          stringIdB: fields[1],
          preferredNameA: fields[2],
          preferredNameB: fields[3],
          ncbiTaxonId: fields[4],
          score: parseFloat(fields[5]),
          nscore: parseFloat(fields[6]),
          fscore: parseFloat(fields[7]),
          pscore: parseFloat(fields[8]),
          ascore: parseFloat(fields[9]),
          escore: parseFloat(fields[10]),
          dscore: parseFloat(fields[11]),
          tscore: parseFloat(fields[12]),
          combinedScore: parseFloat(fields[13])
        });
      }
    }
    
    return interactions;
  }

  // XML parsing utilities
  private parseNCBIGeneXML(xmlData: string): any {
    // Simplified XML parsing - in production, use a proper XML parser
    const geneInfo: any = {};
    
    // Extract basic gene information
    const nameMatch = xmlData.match(/<Gene-ref_locus>([^<]+)<\/Gene-ref_locus>/);
    if (nameMatch) geneInfo.name = nameMatch[1];
    
    const descMatch = xmlData.match(/<Gene-ref_desc>([^<]+)<\/Gene-ref_desc>/);
    if (descMatch) geneInfo.description = descMatch[1];
    
    const chromMatch = xmlData.match(/<Gene-ref_locus-tag>([^<]+)<\/Gene-ref_locus-tag>/);
    if (chromMatch) geneInfo.chromosome = chromMatch[1];
    
    return geneInfo;
  }

  private parseNCBIProteinXML(xmlData: string): any {
    // Simplified XML parsing for protein data
    const proteinInfo: any = {};
    
    const nameMatch = xmlData.match(/<GBSeq_definition>([^<]+)<\/GBSeq_definition>/);
    if (nameMatch) proteinInfo.definition = nameMatch[1];
    
    const lengthMatch = xmlData.match(/<GBSeq_length>(\d+)<\/GBSeq_length>/);
    if (lengthMatch) proteinInfo.length = parseInt(lengthMatch[1]);
    
    return proteinInfo;
  }

  private parseGEOXML(xmlData: string): any {
    // Simplified XML parsing for GEO data
    const geoInfo: any = {};
    
    const titleMatch = xmlData.match(/<Title>([^<]+)<\/Title>/);
    if (titleMatch) geoInfo.title = titleMatch[1];
    
    const summaryMatch = xmlData.match(/<Summary>([^<]+)<\/Summary>/);
    if (summaryMatch) geoInfo.summary = summaryMatch[1];
    
    return geoInfo;
  }

  // Comprehensive data integration
  async fetchAllData(): Promise<{
    ncbi: APIIntegrationResult;
    uniprot: APIIntegrationResult;
    pdb: APIIntegrationResult;
    geo: APIIntegrationResult;
    kegg: APIIntegrationResult;
    string: APIIntegrationResult;
  }> {
    const [ncbi, uniprot, pdb, geo, kegg, string] = await Promise.all([
      this.fetchNCBIGeneData(),
      this.fetchUniProtData(),
      this.fetchPDBData(),
      this.fetchGEOData(),
      this.fetchKEGGData(),
      this.fetchSTRINGData()
    ]);

    return { ncbi, uniprot, pdb, geo, kegg, string };
  }
}

// API integration factory
export function createGeneAPIIntegrations(
  geneSymbol: string,
  organism: string,
  apiKeys?: Map<string, string>
): GeneAPIIntegrations {
  return new GeneAPIIntegrations(geneSymbol, organism, apiKeys);
}

// API rate limiting and error handling
export class APIRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number = 100, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  canMakeRequest(api: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(api) || [];
    
    // Remove old requests outside the time window
    const validRequests = requests.filter(time => now - time < this.timeWindow);
    this.requests.set(api, validRequests);
    
    return validRequests.length < this.maxRequests;
  }

  recordRequest(api: string): void {
    const now = Date.now();
    const requests = this.requests.get(api) || [];
    requests.push(now);
    this.requests.set(api, requests);
  }

  async waitForRateLimit(api: string): Promise<void> {
    while (!this.canMakeRequest(api)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.recordRequest(api);
  }
}
