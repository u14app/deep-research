import { useSettingStore } from "@/store/setting";
import { generateSignature } from "@/utils/signature";

// Import gene research search providers
import {
  createGeneSearchProvider,
  type GeneSearchProviderOptions,
  type GeneSearchResult,
} from "@/utils/gene-research/search-providers";

export interface ProfessionalSearchOptions {
  query: string;
  geneSymbol?: string;
  organism?: string;
  databases?: string[];
  maxResult?: number;
}

/**
 * Hook for professional gene research database searches
 * Integrates specialized biological database search providers
 */
function useProfessionalSearch() {
  /**
   * Search across specified biological databases
   */
  async function searchBiologicalDatabases(
    options: ProfessionalSearchOptions
  ): Promise<Map<string, GeneSearchResult>> {
    const { mode, accessPassword } = useSettingStore.getState();
    const results = new Map<string, GeneSearchResult>();

    // Default databases for gene research
    const databases = options.databases || [
      "pubmed",
      "uniprot",
      "ncbi_gene",
      "geo",
      "pdb",
      "kegg",
      "string",
      "omim",
      "ensembl",
      "reactome",
    ];

    const searchOptions: GeneSearchProviderOptions = {
      provider: "",
      query: options.query,
      geneSymbol: options.geneSymbol,
      organism: options.organism,
      maxResult: options.maxResult || 10,
    };

    // Add authentication if in proxy mode
    if (mode === "proxy") {
      searchOptions.apiKey = generateSignature(accessPassword, Date.now());
    }

    // Search each database in parallel
    const searchPromises = databases.map(async (database) => {
      try {
        const result = await createGeneSearchProvider({
          ...searchOptions,
          provider: database,
        });
        return { database, result };
      } catch (error) {
        console.error(`Error searching ${database}:`, error);
        return {
          database,
          result: {
            sources: [],
            images: [],
            metadata: {
              totalResults: 0,
              database,
              searchTime: 0,
            },
          } as GeneSearchResult,
        };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    // Collect results
    for (const { database, result } of searchResults) {
      if (result.sources.length > 0) {
        results.set(database, result);
      }
    }

    return results;
  }

  /**
   * Search a specific biological database
   */
  async function searchDatabase(
    database: string,
    options: Omit<ProfessionalSearchOptions, "databases">
  ): Promise<GeneSearchResult> {
    const { mode, accessPassword } = useSettingStore.getState();

    const searchOptions: GeneSearchProviderOptions = {
      provider: database,
      query: options.query,
      geneSymbol: options.geneSymbol,
      organism: options.organism,
      maxResult: options.maxResult || 10,
    };

    // Add authentication if in proxy mode
    if (mode === "proxy") {
      searchOptions.apiKey = generateSignature(accessPassword, Date.now());
    }

    try {
      return await createGeneSearchProvider(searchOptions);
    } catch (error) {
      console.error(`Error searching ${database}:`, error);
      return {
        sources: [],
        images: [],
        metadata: {
          totalResults: 0,
          database,
          searchTime: 0,
        },
      };
    }
  }

  /**
   * Get available biological databases
   */
  function getAvailableDatabases(): string[] {
    return [
      "pubmed", // Literature
      "uniprot", // Protein information
      "ncbi_gene", // Gene information
      "geo", // Gene expression
      "pdb", // Protein structures
      "kegg", // Pathways
      "string", // Protein interactions
      "omim", // Disease associations
      "ensembl", // Comparative genomics
      "reactome", // Biological pathways
    ];
  }

  /**
   * Format search results for AI consumption
   */
  function formatSearchResultsForAI(
    results: Map<string, GeneSearchResult>
  ): string {
    let formatted = "";

    for (const [database, result] of results) {
      if (result.sources.length > 0) {
        formatted += `\n## ${database.toUpperCase()} Results (${result.sources.length} sources)\n\n`;

        for (const source of result.sources) {
          formatted += `### ${source.title}\n`;
          formatted += `**Database**: ${source.database}\n`;
          formatted += `**Type**: ${source.type}\n`;
          formatted += `**URL**: ${source.url}\n`;
          if (source.confidence) {
            formatted += `**Confidence**: ${source.confidence}\n`;
          }
          formatted += `\n${source.content}\n\n`;
          if (source.evidence && source.evidence.length > 0) {
            formatted += `**Evidence**: ${source.evidence.join(", ")}\n\n`;
          }
          formatted += `---\n\n`;
        }
      }
    }

    return formatted;
  }

  return {
    searchBiologicalDatabases,
    searchDatabase,
    getAvailableDatabases,
    formatSearchResultsForAI,
  };
}

export default useProfessionalSearch;
