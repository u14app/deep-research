import { useState } from "react";
import { streamText, smoothStream, type JSONValue, type Tool } from "ai";
import { parsePartialJson } from "@ai-sdk/ui-utils";
import { openai } from "@ai-sdk/openai";
import { type GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";
import { useTranslation } from "react-i18next";
import Plimit from "p-limit";
import { toast } from "sonner";
import useModelProvider from "@/hooks/useAiProvider";
import useWebSearch from "@/hooks/useWebSearch";
import { useTaskStore } from "@/store/task";
import { useHistoryStore } from "@/store/history";
import { useSettingStore } from "@/store/setting";
import { useKnowledgeStore } from "@/store/knowledge";
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
import { isNetworkingModel } from "@/utils/model";
import { ThinkTagStreamProcessor, removeJsonMarkdown } from "@/utils/text";
import { parseError } from "@/utils/error";
import { pick, flat, unique } from "radash";

type ProviderOptions = Record<string, Record<string, JSONValue>>;
type Tools = Record<string, Tool>;

const modelMaxTokens: Record<string, number> = {
  "gemini-2.5-pro": 65536,
  "gemini-2.5-flash": 65536,
  "gemini-2.5-flash-preview-05-20": 64000,
  "gemini-2.5-flash-lite-preview": 65536,
  "gemini-2.0-flash": 8192,
  "gemini-2.0-flash-lite": 8192,
};

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
  const errorMessage = parseError(error);
  toast.error(errorMessage);
}

function useDeepResearch() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { smoothTextStreamType } = useSettingStore();
  const { createModelProvider, getModel } = useModelProvider();
  const { search } = useWebSearch();
  const [status, setStatus] = useState<string>("");

  async function askQuestions() {
    const { question } = useTaskStore.getState();
    const { thinkingModel } = getModel();
    setStatus(t("research.common.thinking"));
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const modelName = await createModelProvider(thinkingModel);
    const modelKey = typeof modelName === 'string' ? modelName : String(modelName);
    const maxTokens = modelMaxTokens[modelKey] || 4096;
    const result = streamText({
      model: modelName,
      system: getSystemPrompt(),
      prompt: [
        generateQuestionsPrompt(question),
        getResponseLanguagePrompt(),
      ].join("\n\n"),
      experimental_transform: smoothTextStream(smoothTextStreamType),
      maxTokens: maxTokens,
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
    const modelName = await createModelProvider(thinkingModel);
    const modelKey = typeof modelName === 'string' ? modelName : String(modelName);
    const maxTokens = modelMaxTokens[modelKey] || 4096;
    const result = streamText({
      model: modelName,
      system: getSystemPrompt(),
      prompt: [writeReportPlanPrompt(query), getResponseLanguagePrompt()].join(
        "\n\n"
      ),
      experimental_transform: smoothTextStream(smoothTextStreamType),
      maxTokens: maxTokens,
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
    const modelName = await createModelProvider(networkingModel);
    const modelKey = typeof modelName === 'string' ? modelName : String(modelName);
    const maxTokens = modelMaxTokens[modelKey] || 4096;
    const result = streamText({
      model: modelName,
      system: getSystemPrompt(),
      prompt: [
        processSearchKnowledgeResultPrompt(query, researchGoal, knowledges),
        getResponseLanguagePrompt(),
      ].join("\n\n"),
      experimental_transform: smoothTextStream(smoothTextStreamType),
      maxTokens: maxTokens,
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
      provider,
      enableSearch,
      searchProvider,
      parallelSearch,
      searchMaxResult,
      references,
    } = useSettingStore.getState();
    const { resources } = useTaskStore.getState();
    const { networkingModel } = getModel();
    setStatus(t("research.common.research"));
    const plimit = Plimit(parallelSearch);
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const createModel = (model: string) => {
      // Enable Gemini's built-in search tool
      if (
        enableSearch &&
        searchProvider === "model" &&
        provider === "google" &&
        isNetworkingModel(model)
      ) {
        return createModelProvider(model, { useSearchGrounding: true });
      } else {
        return createModelProvider(model);
      }
    };
    const getTools = (model: string) => {
      // Enable OpenAI's built-in search tool
      if (enableSearch && searchProvider === "model") {
        if (
          ["openai", "azure"].includes(provider) &&
          model.startsWith("gpt-4o")
        ) {
          return {
            web_search_preview: openai.tools.webSearchPreview({
              // optional configuration:
              searchContextSize: "medium",
            }),
          } as Tools;
        }
      }
      return undefined;
    };
    const getProviderOptions = (model: string) => {
      if (enableSearch && searchProvider === "model") {
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
      }
      return undefined;
    };
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
              "---",
              "",
            ].join("\n\n");
          }
          if (enableSearch) {
            if (searchProvider !== "model") {
              try {
                const results = await search(item.query);
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
                model: await createModel(networkingModel),
                system: getSystemPrompt(),
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
                maxTokens: modelMaxTokens[networkingModel] || 4096,
                onError: handleError,
              });
            } else {
              searchResult = streamText({
                model: await createModel(networkingModel),
                system: getSystemPrompt(),
                prompt: [
                  processResultPrompt(item.query, item.researchGoal),
                  getResponseLanguagePrompt(),
                ].join("\n\n"),
                tools: getTools(networkingModel),
                providerOptions: getProviderOptions(networkingModel),
                experimental_transform: smoothTextStream(smoothTextStreamType),
                maxTokens: modelMaxTokens[networkingModel] || 4096,
                onError: handleError,
              });
            }
          } else {
            searchResult = streamText({
              model: await createModelProvider(networkingModel),
              system: getSystemPrompt(),
              prompt: [
                processResultPrompt(item.query, item.researchGoal),
                getResponseLanguagePrompt(),
              ].join("\n\n"),
              experimental_transform: smoothTextStream(smoothTextStreamType),
              maxTokens: modelMaxTokens[networkingModel] || 4096,
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
    const modelName = await createModelProvider(thinkingModel);
    const modelKey = typeof modelName === 'string' ? modelName : String(modelName);
    const maxTokens = modelMaxTokens[modelKey] || 4096;
    const result = streamText({
      model: modelName,
      system: getSystemPrompt(),
      prompt: [
        reviewSerpQueriesPrompt(reportPlan, learnings, suggestion),
        getResponseLanguagePrompt(),
      ].join("\n\n"),
      experimental_transform: smoothTextStream(smoothTextStreamType),
      maxTokens: maxTokens,
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
    const { citationImage, references } = useSettingStore.getState();
    const {
      reportPlan,
      tasks,
      setId,
      setTitle,
      setSources,
      requirement,
      updateFinalReport,
    } = useTaskStore.getState();
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
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const modelName = await createModelProvider(thinkingModel);
    const modelKey = typeof modelName === 'string' ? modelName : String(modelName);
    const maxTokens = modelMaxTokens[modelKey] || 4096;
    const result = streamText({
      model: modelName,
      system: [getSystemPrompt(), outputGuidelinesPrompt].join("\n\n"),
      prompt: [
        writeFinalReportPrompt(
          reportPlan,
          learnings,
          enableReferences
            ? sources.map((item) => pick(item, ["title", "url"]))
            : [],
          enableCitationImage ? images : [],
          requirement,
          enableCitationImage,
          enableReferences
        ),
        getResponseLanguagePrompt(),
      ].join("\n\n"),
      experimental_transform: smoothTextStream(smoothTextStreamType),
      maxTokens: maxTokens,
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
    const { reportPlan } = useTaskStore.getState();
    const { thinkingModel } = getModel();
    setStatus(t("research.common.thinking"));
    try {
      const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
      const modelName = await createModelProvider(thinkingModel);
      const modelKey = typeof modelName === 'string' ? modelName : String(modelName);
      const maxTokens = modelMaxTokens[modelKey] || 4096;
      const result = streamText({
        model: modelName,
        system: getSystemPrompt(),
        prompt: [
          generateSerpQueriesPrompt(reportPlan),
          getResponseLanguagePrompt(),
        ].join("\n\n"),
        experimental_transform: smoothTextStream(smoothTextStreamType),
        maxTokens: maxTokens,
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
