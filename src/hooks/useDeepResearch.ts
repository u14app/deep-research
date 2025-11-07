import { useState } from "react";
import {
  streamText,
  smoothStream,
  type JSONValue,
  type Tool,
  type UserContent,
} from "ai";
import { parsePartialJson } from "@ai-sdk/ui-utils";
import { openai } from "@ai-sdk/openai";
import { type GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";
import { useTranslation } from "react-i18next";
import Plimit from "p-limit";
import { toast } from "sonner";
import useModelProvider from "@/hooks/useAiProvider";
import useWebSearch from "@/hooks/useWebSearch";
import useProfessionalSearch from "@/hooks/useProfessionalSearch";
import { useTaskStore } from "@/store/task";
import { useHistoryStore } from "@/store/history";
import { useSettingStore } from "@/store/setting";
import { useKnowledgeStore } from "@/store/knowledge";
import { useModeStore } from "@/store/mode";
import { outputGuidelinesPrompt } from "@/constants/prompts";
import {
  getSystemPrompt,
  generateQuestionsPrompt,
  writeReportPlanPrompt,
  generateSerpQueriesPrompt,
  processResultPrompt,
  processSearchResultPrompt,
  processSearchKnowledgeResultPrompt,
  reviewSerpQueriesPrompt,
  writeFinalReportPrompt,
  getSERPQuerySchema,
} from "@/utils/deep-research/prompts";
import {
  geneResearchSystemInstruction,
  geneResearchQuestionPrompt,
  geneReportPlanPrompt,
  geneSerpQueriesPrompt,
} from "@/constants/gene-research-prompts";
import { createGeneQueryGenerator } from "@/utils/gene-research/query-generator";
import { generateGeneReportTemplate } from "@/utils/gene-research/report-templates";
import { GeneDataExtractor } from "@/utils/gene-research/data-extractor";
import { createGeneQualityControl } from "@/utils/gene-research/quality-control";
import type { GeneSearchTask, GeneDataExtractionResult } from "@/types/gene-research";
import { isNetworkingModel } from "@/utils/model";
import { ThinkTagStreamProcessor, removeJsonMarkdown } from "@/utils/text";
import { parseError } from "@/utils/error";
import { pick, flat, unique } from "radash";

type ProviderOptions = Record<string, Record<string, JSONValue>>;
type Tools = Record<string, Tool>;

function getResponseLanguagePrompt() {
  return `\n\n**Respond in the same language as the user's language**`;
}

function smoothTextStream(type: "character" | "word" | "line") {
  return smoothStream({
    chunking: type === "character" ? /./ : type,
    delayInMs: 0,
  });
}

function handleError(error: unknown) {
  console.log(error);
  const errorMessage = parseError(error);
  toast.error(errorMessage);
}

function useDeepResearch() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { smoothTextStreamType } = useSettingStore();
  const { createModelProvider, getModel } = useModelProvider();
  const { search } = useWebSearch();
  const { searchBiologicalDatabases } = useProfessionalSearch();
  const [status, setStatus] = useState<string>("");

  // Helper function to convert GeneSearchTask to SearchTask
  function convertGeneTasksToSearchTasks(geneTasks: GeneSearchTask[]): SearchTask[] {
    return geneTasks.map(task => ({
      state: "unprocessed" as const,
      query: task.query,
      researchGoal: task.researchGoal,
      learning: "",
      sources: [],
      images: [],
    }));
  }

  // Helper function to perform mode-aware search
  async function modeAwareSearch(query: string): Promise<{ sources: Source[]; images: ImageSource[] }> {
    const { mode } = useModeStore.getState();
    const { question } = useTaskStore.getState();

    // In professional mode, use specialized biological database search
    if (mode === 'professional') {
      try {
        // Extract gene symbol and organism from question if available
        const geneSymbolMatch = question.match(/Gene:\s*(\w+)/i);
        const organismMatch = question.match(/Organism:\s*([^,]+)/i);

        const geneSymbol = geneSymbolMatch ? geneSymbolMatch[1].trim() : undefined;
        const organism = organismMatch ? organismMatch[1].trim() : undefined;

        console.log(`[Professional Search] Searching biological databases for: ${query}`);
        console.log(`[Professional Search] Gene: ${geneSymbol}, Organism: ${organism}`);

        const bioResults = await searchBiologicalDatabases({
          query,
          geneSymbol,
          organism,
          databases: ['pubmed', 'uniprot', 'ncbi_gene'],  // Start with core databases
          maxResult: 5,
        });

        // Convert biological database results to standard Source format
        const sources: Source[] = [];
        const images: ImageSource[] = [];

        for (const [, result] of bioResults) {
          for (const source of result.sources) {
            sources.push({
              title: source.title,
              content: source.content,
              url: source.url,
            });
          }

          for (const image of result.images) {
            images.push({
              url: image.url,
              description: image.description,
            });
          }
        }

        console.log(`[Professional Search] Found ${sources.length} sources from biological databases`);

        // If biological databases returned results, use them
        if (sources.length > 0) {
          return { sources, images };
        }

        // Fall back to standard search if no results
        console.log(`[Professional Search] No results from biological databases, falling back to standard search`);
      } catch (error) {
        console.error('[Professional Search] Error:', error);
        // Fall through to standard search
      }
    }

    // Use standard search for general mode or as fallback
    return await search(query);
  }

  // Helper functions to select prompts based on mode
  function getModeAwareSystemPrompt(): string {
    const { mode } = useModeStore.getState();
    if (mode === 'professional') {
      return geneResearchSystemInstruction.replace('{now}', new Date().toISOString());
    }
    return getSystemPrompt();
  }

  function getModeAwareQuestionsPrompt(query: string): string {
    const { mode } = useModeStore.getState();
    if (mode === 'professional') {
      return geneResearchQuestionPrompt.replace('{query}', query);
    }
    return generateQuestionsPrompt(query);
  }

  function getModeAwareReportPlanPrompt(query: string): string {
    const { mode } = useModeStore.getState();
    if (mode === 'professional') {
      return geneReportPlanPrompt.replace('{query}', query);
    }
    return writeReportPlanPrompt(query);
  }

  function getModeAwareSerpQueriesPrompt(plan: string): string {
    const { mode } = useModeStore.getState();
    if (mode === 'professional') {
      return geneSerpQueriesPrompt.replace('{plan}', plan);
    }
    return generateSerpQueriesPrompt(plan);
  }

  async function generateSearchSettings(searchModel: string) {
    const { provider, enableSearch, searchProvider, searchMaxResult } =
      useSettingStore.getState();

    if (enableSearch && searchProvider === "model") {
      const createModel = (model: string) => {
        // Enable Gemini's built-in search tool
        if (
          ["google", "google-vertex", "modai"].includes(provider) &&
          isNetworkingModel(model)
        ) {
          return createModelProvider(model, { useSearchGrounding: true });
        } else {
          return createModelProvider(model);
        }
      };
      const getTools = (model: string) => {
        // Enable OpenAI's built-in search tool
        if (
          ["openai", "azure", "openaicompatible"].includes(provider) &&
          (model.startsWith("gpt-4o") ||
            model.startsWith("gpt-4.1") ||
            model.startsWith("gpt-5"))
        ) {
          return {
            web_search_preview: openai.tools.webSearchPreview({
              // optional configuration:
              searchContextSize: searchMaxResult > 5 ? "high" : "medium",
            }),
          } as Tools;
        }
      };
      const getProviderOptions = (model: string) => {
        // Enable OpenRouter's built-in search tool
        if (provider === "openrouter") {
          return {
            openrouter: {
              plugins: [
                {
                  id: "web",
                  max_results: searchMaxResult, // Defaults to 5
                },
              ],
            },
          } as ProviderOptions;
        } else if (
          provider === "xai" &&
          model.startsWith("grok-3") &&
          !model.includes("mini")
        ) {
          return {
            xai: {
              search_parameters: {
                mode: "auto",
                max_search_results: searchMaxResult,
              },
            },
          } as ProviderOptions;
        }
      };

      return {
        model: await createModel(searchModel),
        tools: getTools(searchModel),
        providerOptions: getProviderOptions(searchModel),
      };
    } else {
      return {
        model: await createModelProvider(searchModel),
      };
    }
  }

  async function askQuestions() {
    const { question } = useTaskStore.getState();
    const { thinkingModel } = getModel();
    setStatus(t("research.common.thinking"));
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const searchSettings = await generateSearchSettings(thinkingModel);
    const result = streamText({
      ...searchSettings,
      system: getModeAwareSystemPrompt(),
      prompt: [
        getModeAwareQuestionsPrompt(question),
        getResponseLanguagePrompt(),
      ].join("\n\n"),
      experimental_transform: smoothTextStream(smoothTextStreamType),
      onError: handleError,
    });
    let content = "";
    let reasoning = "";
    taskStore.setQuestion(question);
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        thinkTagStreamProcessor.processChunk(
          part.textDelta,
          (data) => {
            content += data;
            taskStore.updateQuestions(content);
          },
          (data) => {
            reasoning += data;
          }
        );
      } else if (part.type === "reasoning") {
        reasoning += part.textDelta;
      }
    }
    if (reasoning) console.log(reasoning);
  }

  async function writeReportPlan() {
    const { query } = useTaskStore.getState();
    const { thinkingModel } = getModel();
    setStatus(t("research.common.thinking"));
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const searchSettings = await generateSearchSettings(thinkingModel);
    const result = streamText({
      ...searchSettings,
      system: getModeAwareSystemPrompt(),
      prompt: [getModeAwareReportPlanPrompt(query), getResponseLanguagePrompt()].join(
        "\n\n"
      ),
      experimental_transform: smoothTextStream(smoothTextStreamType),
      onError: handleError,
    });
    let content = "";
    let reasoning = "";
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        thinkTagStreamProcessor.processChunk(
          part.textDelta,
          (data) => {
            content += data;
            taskStore.updateReportPlan(content);
          },
          (data) => {
            reasoning += data;
          }
        );
      } else if (part.type === "reasoning") {
        reasoning += part.textDelta;
      }
    }
    if (reasoning) console.log(reasoning);
    return content;
  }

  async function searchLocalKnowledges(query: string, researchGoal: string) {
    const { resources } = useTaskStore.getState();
    const knowledgeStore = useKnowledgeStore.getState();
    const knowledges: Knowledge[] = [];

    for (const item of resources) {
      if (item.status === "completed") {
        const resource = knowledgeStore.get(item.id);
        if (resource) {
          knowledges.push(resource);
        }
      }
    }

    const { networkingModel } = getModel();
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const searchResult = streamText({
      model: await createModelProvider(networkingModel),
      system: getModeAwareSystemPrompt(),
      prompt: [
        processSearchKnowledgeResultPrompt(query, researchGoal, knowledges),
        getResponseLanguagePrompt(),
      ].join("\n\n"),
      experimental_transform: smoothTextStream(smoothTextStreamType),
      onError: handleError,
    });
    let content = "";
    let reasoning = "";
    for await (const part of searchResult.fullStream) {
      if (part.type === "text-delta") {
        thinkTagStreamProcessor.processChunk(
          part.textDelta,
          (data) => {
            content += data;
            taskStore.updateTask(query, { learning: content });
          },
          (data) => {
            reasoning += data;
          }
        );
      } else if (part.type === "reasoning") {
        reasoning += part.textDelta;
      }
    }
    if (reasoning) console.log(reasoning);
    return content;
  }

  async function runSearchTask(queries: SearchTask[]) {
    const {
      enableSearch,
      searchProvider,
      parallelSearch,
      references,
      onlyUseLocalResource,
    } = useSettingStore.getState();
    const { resources } = useTaskStore.getState();
    const { networkingModel } = getModel();
    setStatus(t("research.common.research"));
    const plimit = Plimit(parallelSearch);
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    await Promise.all(
      queries.map((item) => {
        plimit(async () => {
          let content = "";
          let reasoning = "";
          let searchResult;
          let sources: Source[] = [];
          let images: ImageSource[] = [];
          taskStore.updateTask(item.query, { state: "processing" });

          if (resources.length > 0) {
            const knowledges = await searchLocalKnowledges(
              item.query,
              item.researchGoal
            );
            content += [
              knowledges,
              `### ${t("research.searchResult.references")}`,
              resources.map((item) => `- ${item.name}`).join("\n"),
            ].join("\n\n");

            if (onlyUseLocalResource === "enable") {
              taskStore.updateTask(item.query, {
                state: "completed",
                learning: content,
                sources,
                images,
              });
              return content;
            } else {
              content += "\n\n---\n\n";
            }
          }

          if (enableSearch) {
            if (searchProvider !== "model") {
              try {
                const results = await modeAwareSearch(item.query);
                sources = results.sources;
                images = results.images;

                if (sources.length === 0) {
                  throw new Error("Invalid Search Results");
                }
              } catch (err) {
                console.error(err);
                handleError(
                  `[${searchProvider}]: ${
                    err instanceof Error ? err.message : "Search Failed"
                  }`
                );
                return plimit.clearQueue();
              }
              const enableReferences =
                sources.length > 0 && references === "enable";
              searchResult = streamText({
                model: await createModelProvider(networkingModel),
                system: getModeAwareSystemPrompt(),
                prompt: [
                  processSearchResultPrompt(
                    item.query,
                    item.researchGoal,
                    sources,
                    enableReferences
                  ),
                  getResponseLanguagePrompt(),
                ].join("\n\n"),
                experimental_transform: smoothTextStream(smoothTextStreamType),
                onError: handleError,
              });
            } else {
              const searchSettings = await generateSearchSettings(
                networkingModel
              );
              searchResult = streamText({
                ...searchSettings,
                system: getModeAwareSystemPrompt(),
                prompt: [
                  processResultPrompt(item.query, item.researchGoal),
                  getResponseLanguagePrompt(),
                ].join("\n\n"),
                experimental_transform: smoothTextStream(smoothTextStreamType),
                onError: handleError,
              });
            }
          } else {
            searchResult = streamText({
              model: await createModelProvider(networkingModel),
              system: getModeAwareSystemPrompt(),
              prompt: [
                processResultPrompt(item.query, item.researchGoal),
                getResponseLanguagePrompt(),
              ].join("\n\n"),
              experimental_transform: smoothTextStream(smoothTextStreamType),
              onError: (err) => {
                taskStore.updateTask(item.query, { state: "failed" });
                handleError(err);
              },
            });
          }
          for await (const part of searchResult.fullStream) {
            if (part.type === "text-delta") {
              thinkTagStreamProcessor.processChunk(
                part.textDelta,
                (data) => {
                  content += data;
                  taskStore.updateTask(item.query, { learning: content });
                },
                (data) => {
                  reasoning += data;
                }
              );
            } else if (part.type === "reasoning") {
              reasoning += part.textDelta;
            } else if (part.type === "source") {
              sources.push(part.source);
            } else if (part.type === "finish") {
              if (part.providerMetadata?.google) {
                const { groundingMetadata } = part.providerMetadata.google;
                const googleGroundingMetadata =
                  groundingMetadata as GoogleGenerativeAIProviderMetadata["groundingMetadata"];
                if (googleGroundingMetadata?.groundingSupports) {
                  googleGroundingMetadata.groundingSupports.forEach(
                    ({ segment, groundingChunkIndices }) => {
                      if (segment.text && groundingChunkIndices) {
                        const index = groundingChunkIndices.map(
                          (idx: number) => `[${idx + 1}]`
                        );
                        content = content.replaceAll(
                          segment.text,
                          `${segment.text}${index.join("")}`
                        );
                      }
                    }
                  );
                }
              } else if (part.providerMetadata?.openai) {
                // Fixed the problem that OpenAI cannot generate markdown reference link syntax properly in Chinese context
                content = content.replaceAll("【", "[").replaceAll("】", "]");
              }
            }
          }
          if (reasoning) console.log(reasoning);

          if (sources.length > 0) {
            content +=
              "\n\n" +
              sources
                .map(
                  (item, idx) =>
                    `[${idx + 1}]: ${item.url}${
                      item.title ? ` "${item.title.replaceAll('"', " ")}"` : ""
                    }`
                )
                .join("\n");
          }

          if (content.length > 0) {
            taskStore.updateTask(item.query, {
              state: "completed",
              learning: content,
              sources,
              images,
            });
            return content;
          } else {
            taskStore.updateTask(item.query, {
              state: "failed",
              learning: "",
              sources: [],
              images: [],
            });
            return "";
          }
        });
      })
    );
  }

  async function reviewSearchResult() {
    const { reportPlan, tasks, suggestion } = useTaskStore.getState();
    const { thinkingModel } = getModel();
    setStatus(t("research.common.research"));
    const learnings = tasks.map((item) => item.learning);
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const result = streamText({
      model: await createModelProvider(thinkingModel),
      system: getModeAwareSystemPrompt(),
      prompt: [
        reviewSerpQueriesPrompt(reportPlan, learnings, suggestion),
        getResponseLanguagePrompt(),
      ].join("\n\n"),
      experimental_transform: smoothTextStream(smoothTextStreamType),
      onError: handleError,
    });

    const querySchema = getSERPQuerySchema();
    let content = "";
    let reasoning = "";
    let queries: SearchTask[] = [];
    for await (const textPart of result.textStream) {
      thinkTagStreamProcessor.processChunk(
        textPart,
        (text) => {
          content += text;
          const data: PartialJson = parsePartialJson(
            removeJsonMarkdown(content)
          );
          if (
            querySchema.safeParse(data.value) &&
            data.state === "successful-parse"
          ) {
            if (data.value) {
              queries = data.value.map(
                (item: { query: string; researchGoal: string }) => ({
                  state: "unprocessed",
                  learning: "",
                  ...pick(item, ["query", "researchGoal"]),
                })
              );
            }
          }
        },
        (text) => {
          reasoning += text;
        }
      );
    }
    if (reasoning) console.log(reasoning);
    if (queries.length > 0) {
      taskStore.update([...tasks, ...queries]);
      await runSearchTask(queries);
    }
  }

  async function writeFinalReport() {
    const { citationImage, references, useFileFormatResource } =
      useSettingStore.getState();
    const {
      reportPlan,
      tasks,
      setId,
      setTitle,
      setSources,
      requirement,
      updateFinalReport,
      question,
    } = useTaskStore.getState();
    const { mode } = useModeStore.getState();
    const { save } = useHistoryStore.getState();
    const { thinkingModel } = getModel();
    setStatus(t("research.common.writing"));
    updateFinalReport("");
    setTitle("");
    setSources([]);
    const learnings = tasks.map((item) => item.learning);
    const sources: Source[] = unique(
      flat(tasks.map((item) => item.sources || [])),
      (item) => item.url
    );
    const images: ImageSource[] = unique(
      flat(tasks.map((item) => item.images || [])),
      (item) => item.url
    );
    const enableCitationImage = images.length > 0 && citationImage === "enable";
    const enableReferences = sources.length > 0 && references === "enable";
    const enableFileFormatResource = useFileFormatResource === "enable";
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();

    // Professional mode: Extract data and assess quality
    let professionalReportTemplate = "";
    let qualityAssessment = "";

    if (mode === 'professional') {
      const geneSymbolMatch = question.match(/Gene:\s*(\w+)/i);
      const organismMatch = question.match(/Organism:\s*([^,]+)/i);

      if (geneSymbolMatch && organismMatch) {
        const geneSymbol = geneSymbolMatch[1].trim();
        const organism = organismMatch[1].trim();

        console.log(`[Professional Mode] Extracting structured data for ${geneSymbol}`);

        // Extract structured data from learnings
        const dataExtractor = new GeneDataExtractor(geneSymbol, organism);
        let combinedExtractionResult: Partial<GeneDataExtractionResult> | null = null;

        try {
          // Combine all learnings into one text for extraction
          const allContent = learnings.join('\n\n---\n\n');
          const sourceName = sources.length > 0 ? sources[0].url : 'combined_sources';

          combinedExtractionResult = await dataExtractor.extractFromContent(allContent, sourceName);

          console.log(`[Professional Mode] Data extraction completed:`, {
            qualityScore: combinedExtractionResult.qualityScore,
            confidence: combinedExtractionResult.extractionMetadata?.confidence,
            completeness: combinedExtractionResult.extractionMetadata?.completeness,
            referencesValidated: (combinedExtractionResult.extractionMetadata as any)?.referenceQuality?.validatedReferences
          });

          // Assess quality if we have sufficient data
          if (combinedExtractionResult.geneBasicInfo && combinedExtractionResult.functionalData) {
            console.log(`[Professional Mode] Performing quality assessment`);

            const qualityControl = createGeneQualityControl(geneSymbol, organism);
            const qualityResult = qualityControl.assessQuality(
              combinedExtractionResult.geneBasicInfo,
              combinedExtractionResult.functionalData,
              combinedExtractionResult.proteinInfo!,
              combinedExtractionResult.expressionData!,
              combinedExtractionResult.interactionData!,
              combinedExtractionResult.diseaseData || [],
              combinedExtractionResult.evolutionaryData!,
              combinedExtractionResult.literatureReferences || []
            );

            console.log(`[Professional Mode] Quality assessment completed:`, {
              overallScore: (qualityResult.overallScore * 100).toFixed(1) + '%',
              dataCompleteness: (qualityResult.categoryScores.dataCompleteness * 100).toFixed(1) + '%',
              literatureCoverage: (qualityResult.categoryScores.literatureCoverage * 100).toFixed(1) + '%',
              issues: qualityResult.issues.length
            });

            // Add quality assessment to report guidance
            qualityAssessment = `\n\n### Research Quality Assessment\n\n**Overall Quality Score**: ${(qualityResult.overallScore * 100).toFixed(1)}%\n\n**Category Scores**:\n- Data Completeness: ${(qualityResult.categoryScores.dataCompleteness * 100).toFixed(1)}%\n- Literature Coverage: ${(qualityResult.categoryScores.literatureCoverage * 100).toFixed(1)}%\n- Experimental Evidence: ${(qualityResult.categoryScores.experimentalEvidence * 100).toFixed(1)}%\n- Cross-Species Validation: ${(qualityResult.categoryScores.crossSpeciesValidation * 100).toFixed(1)}%\n- Database Consistency: ${(qualityResult.categoryScores.databaseConsistency * 100).toFixed(1)}%\n- Scientific Rigor: ${(qualityResult.categoryScores.scientificRigor * 100).toFixed(1)}%\n\n`;

            if (qualityResult.issues.length > 0) {
              qualityAssessment += `**Quality Issues** (${qualityResult.issues.length} found):\n`;
              qualityResult.issues.slice(0, 5).forEach((issue, idx) => {
                qualityAssessment += `${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.description}\n`;
              });
              qualityAssessment += '\n';
            }

            if (qualityResult.recommendations.length > 0) {
              qualityAssessment += `**Recommendations**:\n`;
              qualityResult.recommendations.slice(0, 5).forEach((rec, idx) => {
                qualityAssessment += `${idx + 1}. ${rec}\n`;
              });
              qualityAssessment += '\n';
            }

            // Add literature quality info if available
            const refQuality = (combinedExtractionResult.extractionMetadata as any)?.referenceQuality;
            if (refQuality) {
              qualityAssessment += `**Literature Quality**:\n`;
              qualityAssessment += `- Validated References: ${refQuality.validatedReferences}\n`;
              qualityAssessment += `- High Confidence: ${refQuality.highConfidenceReferences}\n`;
              qualityAssessment += `- Duplicates Removed: ${refQuality.duplicateReferences}\n`;
              if (refQuality.potentiallyFabricated > 0) {
                qualityAssessment += `- ⚠️ Potentially Fabricated: ${refQuality.potentiallyFabricated}\n`;
              }
              qualityAssessment += '\n';
            }
          }
        } catch (error) {
          console.error('[Professional Mode] Data extraction error:', error);
        }

        // Generate report template
        console.log(`[Professional Mode] Generating professional report template for ${geneSymbol}`);

        const template = generateGeneReportTemplate(
          geneSymbol,
          organism,
          'comprehensive',
          'researchers'
        );

        // Extract section structure for prompt guidance
        const sectionStructure = template.sections
          .map(section => `## ${section.title}\n${section.subsections ? section.subsections.map(sub => `### ${sub.title}`).join('\n') : ''}`)
          .join('\n\n');

        professionalReportTemplate = `\n\nIMPORTANT: Structure your report according to the following professional gene research template:\n\n${sectionStructure}\n\nEnsure each section includes:\n- Specific molecular details\n- Quantitative data where available\n- Literature citations\n- Experimental evidence\n\n${qualityAssessment}NOTE: The quality assessment above should inform your writing. Address any identified issues and incorporate recommendations where relevant.\n\n`;
      }
    }

    const sourceList = enableReferences
      ? sources.map((item) => pick(item, ["title", "url"]))
      : [];
    const imageList = enableCitationImage ? images : [];
    const file = new File(
      [
        [
          `<LEARNINGS>\n${learnings
            .map((detail) => `<learning>\n${detail}\n</learning>`)
            .join("\n")}\n</LEARNINGS>`,
          `<SOURCES>\n${sourceList
            .map(
              (item, idx) =>
                `<source index="${idx + 1}" url="${item.url}">\n${
                  item.title
                }\n</source>`
            )
            .join("\n")}\n</SOURCES>`,
          `<IMAGES>\n${imageList
            .map(
              (source, idx) =>
                `${idx + 1}. ![${source.description}](${source.url})`
            )
            .join("\n")}\n</IMAGES>`,
        ].join("\n\n"),
      ],
      "resources.md",
      { type: "text/markdown" }
    );
    const fileData = await file.arrayBuffer();
    const messageContent: UserContent = [
      {
        type: "text",
        text: [
          writeFinalReportPrompt(
            reportPlan,
            learnings,
            sourceList,
            imageList,
            requirement,
            enableCitationImage,
            enableReferences,
            enableFileFormatResource
          ),
          professionalReportTemplate,  // Add professional template guidance
          getResponseLanguagePrompt(),
        ].join("\n\n"),
      },
    ];
    if (enableFileFormatResource) {
      messageContent.push({
        type: "file",
        mimeType: "text/markdown",
        filename: "resources.md",
        data: fileData,
      });
    }

    const result = streamText({
      model: await createModelProvider(thinkingModel),
      system: [getModeAwareSystemPrompt(), outputGuidelinesPrompt].join("\n\n"),
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
      temperature: 0.5,
      experimental_transform: smoothTextStream(smoothTextStreamType),
      onError: handleError,
    });
    let content = "";
    let reasoning = "";
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        thinkTagStreamProcessor.processChunk(
          part.textDelta,
          (data) => {
            content += data;
            updateFinalReport(content);
          },
          (data) => {
            reasoning += data;
          }
        );
      } else if (part.type === "reasoning") {
        reasoning += part.textDelta;
      }
    }
    if (reasoning) console.log(reasoning);
    if (sources.length > 0) {
      content +=
        "\n\n" +
        sources
          .map(
            (item, idx) =>
              `[${idx + 1}]: ${item.url}${
                item.title ? ` "${item.title.replaceAll('"', " ")}"` : ""
              }`
          )
          .join("\n");
      updateFinalReport(content);
    }
    if (content.length > 0) {
      const title = (content || "")
        .split("\n")[0]
        .replaceAll("#", "")
        .replaceAll("*", "")
        .trim();
      setTitle(title);
      setSources(sources);
      const id = save(taskStore.backup());
      setId(id);
      return content;
    } else {
      return "";
    }
  }

  async function deepResearch() {
    const { reportPlan, question } = useTaskStore.getState();
    const { mode } = useModeStore.getState();
    const { thinkingModel } = getModel();
    setStatus(t("research.common.thinking"));

    try {
      let queries: SearchTask[] = [];

      // Professional mode: Use GeneQueryGenerator for specialized queries
      if (mode === 'professional') {
        console.log('[Professional Mode] Using GeneQueryGenerator for query generation');

        // Extract gene information from the question
        const geneSymbolMatch = question.match(/Gene:\s*(\w+)/i);
        const organismMatch = question.match(/Organism:\s*([^,]+)/i);
        const focusMatch = question.match(/Focus:\s*([^,\n]+)/i);
        const aspectsMatch = question.match(/Specific Aspects:\s*([^,\n]+)/i);
        const diseaseMatch = question.match(/Disease:\s*([^,\n]+)/i);
        const approachMatch = question.match(/Experimental Approach:\s*([^,\n]+)/i);

        if (geneSymbolMatch && organismMatch) {
          const geneSymbol = geneSymbolMatch[1].trim();
          const organism = organismMatch[1].trim();
          const researchFocus = focusMatch ? focusMatch[1].split(',').map(f => f.trim()) : [];
          const specificAspects = aspectsMatch ? aspectsMatch[1].split(',').map(a => a.trim()) : [];
          const diseaseContext = diseaseMatch ? diseaseMatch[1].trim() : undefined;
          const experimentalApproach = approachMatch ? approachMatch[1].trim() : undefined;

          console.log(`[Professional Mode] Gene: ${geneSymbol}, Organism: ${organism}`);
          console.log(`[Professional Mode] Focus: ${researchFocus.join(', ')}`);

          // Create query generator
          const queryGenerator = createGeneQueryGenerator({
            geneSymbol,
            organism,
            researchFocus,
            specificAspects,
            diseaseContext,
            experimentalApproach
          });

          // Generate comprehensive queries
          const geneQueries = queryGenerator.generateComprehensiveQueries();
          console.log(`[Professional Mode] Generated ${geneQueries.length} specialized queries`);

          // Convert to SearchTask format
          queries = convertGeneTasksToSearchTasks(geneQueries);
          taskStore.update(queries);

          // Execute searches immediately
          await runSearchTask(queries);
          return;
        }

        // Fall through to general mode if gene info not found
        console.log('[Professional Mode] Could not extract gene info, falling back to general query generation');
      }

      // General mode: Use AI-generated queries
      const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
      const result = streamText({
        model: await createModelProvider(thinkingModel),
        system: getModeAwareSystemPrompt(),
        prompt: [
          getModeAwareSerpQueriesPrompt(reportPlan),
          getResponseLanguagePrompt(),
        ].join("\n\n"),
        experimental_transform: smoothTextStream(smoothTextStreamType),
        onError: handleError,
      });

      const querySchema = getSERPQuerySchema();
      let content = "";
      let reasoning = "";
      for await (const textPart of result.textStream) {
        thinkTagStreamProcessor.processChunk(
          textPart,
          (text) => {
            content += text;
            const data: PartialJson = parsePartialJson(
              removeJsonMarkdown(content)
            );
            if (querySchema.safeParse(data.value)) {
              if (
                data.state === "repaired-parse" ||
                data.state === "successful-parse"
              ) {
                if (data.value) {
                  queries = data.value.map(
                    (item: { query: string; researchGoal: string }) => ({
                      state: "unprocessed",
                      learning: "",
                      ...pick(item, ["query", "researchGoal"]),
                    })
                  );
                  taskStore.update(queries);
                }
              }
            }
          },
          (text) => {
            reasoning += text;
          }
        );
      }
      if (reasoning) console.log(reasoning);
      await runSearchTask(queries);
    } catch (err) {
      console.error(err);
    }
  }

  return {
    status,
    deepResearch,
    askQuestions,
    writeReportPlan,
    runSearchTask,
    reviewSearchResult,
    writeFinalReport,
  };
}

export default useDeepResearch;
