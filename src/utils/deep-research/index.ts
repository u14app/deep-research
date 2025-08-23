import type { GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { flat, isFunction, pick, unique } from "radash";
import { outputGuidelinesPrompt } from "@/constants/prompts";
import { isNetworkingModel } from "@/utils/model";
import { removeJsonMarkdown, ThinkTagStreamProcessor } from "@/utils/text";
import {
  generateSerpQueriesPrompt,
  getSERPQuerySchema,
  getSystemPrompt,
  processResultPrompt,
  processSearchResultPrompt,
  writeFinalReportPrompt,
  writeReportPlanPrompt,
} from "./prompts";
import { createAIProvider } from "./provider";
import { createSearchProvider } from "./search";

export interface DeepResearchOptions {
  AIProvider: {
    baseURL: string;
    apiKey?: string;
    provider: string;
    thinkingModel: string;
    taskModel: string;
  };
  searchProvider: {
    baseURL: string;
    apiKey?: string;
    provider: string;
    maxResult?: number;
  };
  language?: string;
  onMessage?: (event: string, data: any) => void;
}

interface FinalReportResult {
  title: string;
  finalReport: string;
  learnings: string[];
  sources: Source[];
  images: ImageSource[];
}

export interface DeepResearchSearchTask {
  query: string;
  researchGoal: string;
}

export interface DeepResearchSearchResult {
  query: string;
  researchGoal: string;
  learning: string;
  sources?: {
    url: string;
    title?: string;
  }[];
  images?: {
    url: string;
    description?: string;
  }[];
}

function addQuoteBeforeAllLine(text: string = "") {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

class DeepResearch {
  protected options: DeepResearchOptions;
  onMessage: (event: string, data: any) => void = () => {};
  constructor(options: DeepResearchOptions) {
    this.options = options;
    if (isFunction(options.onMessage)) {
      this.onMessage = options.onMessage;
    }
  }

  async getThinkingModel() {
    const { AIProvider } = this.options;
    const AIProviderBaseOptions = pick(AIProvider, ["baseURL", "apiKey"]);
    return await createAIProvider({
      provider: AIProvider.provider,
      model: AIProvider.thinkingModel,
      ...AIProviderBaseOptions,
    });
  }

  async getTaskModel() {
    const { AIProvider } = this.options;
    const AIProviderBaseOptions = pick(AIProvider, ["baseURL", "apiKey"]);
    return await createAIProvider({
      provider: AIProvider.provider,
      model: AIProvider.taskModel,
      settings:
        ["google", "google-vertex"].includes(AIProvider.provider) &&
        isNetworkingModel(AIProvider.taskModel)
          ? { useSearchGrounding: true }
          : undefined,
      ...AIProviderBaseOptions,
    });
  }

  getResponseLanguagePrompt() {
    return this.options.language
      ? `**Respond in ${this.options.language}**`
      : `**Respond in the same language as the user's language**`;
  }

  async writeReportPlan(query: string): Promise<string> {
    this.onMessage("progress", { step: "report-plan", status: "start" });
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const result = streamText({
      model: await this.getThinkingModel(),
      system: getSystemPrompt(),
      prompt: [writeReportPlanPrompt(query), this.getResponseLanguagePrompt()].join("\n\n"),
    });
    let content = "";
    this.onMessage("message", { type: "text", text: "<report-plan>\n" });
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        thinkTagStreamProcessor.processChunk(
          part.textDelta,
          (data) => {
            content += data;
            this.onMessage("message", { type: "text", text: data });
          },
          (data) => {
            this.onMessage("reasoning", { type: "text", text: data });
          }
        );
      } else if (part.type === "reasoning") {
        this.onMessage("reasoning", { type: "text", text: part.textDelta });
      }
    }
    this.onMessage("message", { type: "text", text: "\n</report-plan>\n\n" });
    this.onMessage("progress", {
      step: "report-plan",
      status: "end",
      data: content,
    });
    return content;
  }

  async generateSERPQuery(reportPlan: string): Promise<DeepResearchSearchTask[]> {
    this.onMessage("progress", { step: "serp-query", status: "start" });
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const { text } = await generateText({
      model: await this.getThinkingModel(),
      system: getSystemPrompt(),
      prompt: [generateSerpQueriesPrompt(reportPlan), this.getResponseLanguagePrompt()].join(
        "\n\n"
      ),
    });
    const querySchema = getSERPQuerySchema();
    let content = "";
    thinkTagStreamProcessor.processChunk(text, (data) => {
      content += data;
    });
    const data = JSON.parse(removeJsonMarkdown(content));
    thinkTagStreamProcessor.end();
    const result = querySchema.safeParse(data);
    if (result.success) {
      const tasks: DeepResearchSearchTask[] = data.map(
        (item: { query: string; researchGoal?: string }) => ({
          query: item.query,
          researchGoal: item.researchGoal || "",
        })
      );
      this.onMessage("progress", {
        step: "serp-query",
        status: "end",
        data: tasks,
      });
      return tasks;
    } else {
      throw new Error(result.error.message);
    }
  }

  async runSearchTask(
    tasks: DeepResearchSearchTask[],
    enableReferences = true
  ): Promise<SearchTask[]> {
    this.onMessage("progress", { step: "task-list", status: "start" });
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const results: SearchTask[] = [];
    for await (const item of tasks) {
      this.onMessage("progress", {
        step: "search-task",
        status: "start",
        name: item.query,
      });
      let content = "";
      let searchResult;
      let sources: Source[] = [];
      let images: ImageSource[] = [];
      const { taskModel } = this.options.AIProvider;
      const { provider = "model", maxResult = 5 } = this.options.searchProvider;
      if (provider === "model") {
        const getTools = async () => {
          // Enable OpenAI's built-in search tool
          if (
            provider === "model" &&
            ["openai", "azure", "openaicompatible"].includes(taskModel) &&
            taskModel.startsWith("gpt-4o")
          ) {
            const { openai } = await import("@ai-sdk/openai");
            return {
              web_search_preview: openai.tools.webSearchPreview({
                // optional configuration:
                searchContextSize: maxResult > 5 ? "high" : "medium",
              }),
            };
          } else {
            return undefined;
          }
        };
        const getProviderOptions = () => {
          // Enable OpenRouter's built-in search tool
          if (provider === "model" && taskModel === "openrouter") {
            return {
              openrouter: {
                plugins: [
                  {
                    id: "web",
                    max_results: maxResult ?? 5,
                  },
                ],
              },
            };
          } else {
            return undefined;
          }
        };

        const tools = await getTools();
        const providerOptions = getProviderOptions();

        searchResult = streamText({
          model: await this.getTaskModel(),
          system: getSystemPrompt(),
          prompt: [
            processResultPrompt(item.query, item.researchGoal),
            this.getResponseLanguagePrompt(),
          ].join("\n\n"),
          ...(tools && { tools }),
          ...(providerOptions && { providerOptions }),
        });
      } else {
        try {
          const result = await createSearchProvider({
            query: item.query,
            ...this.options.searchProvider,
          });

          sources = result.sources;
          images = result.images;
        } catch (err) {
          const errorMessage = `[${provider}]: ${
            err instanceof Error ? err.message : "Search Failed"
          }`;
          throw new Error(errorMessage);
        }
        searchResult = streamText({
          model: await this.getTaskModel(),
          system: getSystemPrompt(),
          prompt: [
            processSearchResultPrompt(
              item.query,
              item.researchGoal,
              sources,
              sources.length > 0 && enableReferences
            ),
            this.getResponseLanguagePrompt(),
          ].join("\n\n"),
        });
      }

      this.onMessage("message", { type: "text", text: "<search-task>\n" });
      this.onMessage("message", { type: "text", text: `## ${item.query}\n\n` });
      this.onMessage("message", {
        type: "text",
        text: `${addQuoteBeforeAllLine(item.researchGoal)}\n\n`,
      });
      for await (const part of searchResult.fullStream) {
        if (part.type === "text-delta") {
          thinkTagStreamProcessor.processChunk(
            part.textDelta,
            (data) => {
              content += data;
              this.onMessage("message", { type: "text", text: data });
            },
            (data) => {
              this.onMessage("reasoning", { type: "text", text: data });
            }
          );
        } else if (part.type === "reasoning") {
          this.onMessage("reasoning", { type: "text", text: part.textDelta });
        } else if (part.type === "source") {
          sources.push(part.source);
        } else if (part.type === "finish") {
          if (part.providerMetadata?.google) {
            const { groundingMetadata } = part.providerMetadata["google"];
            const googleGroundingMetadata =
              groundingMetadata as GoogleGenerativeAIProviderMetadata["groundingMetadata"];
            if (googleGroundingMetadata?.groundingSupports) {
              googleGroundingMetadata.groundingSupports.forEach(
                ({ segment, groundingChunkIndices }) => {
                  if (segment.text && groundingChunkIndices) {
                    const index = groundingChunkIndices.map((idx: number) => `[${idx + 1}]`);
                    content = content.replaceAll(segment.text, `${segment.text}${index.join("")}`);
                  }
                }
              );
            }
          } else if (part.providerMetadata?.["openai"]) {
            // Fixed the problem that OpenAI cannot generate markdown reference link syntax properly in Chinese context
            content = content.replaceAll("【", "[").replaceAll("】", "]");
          }
        }
      }
      thinkTagStreamProcessor.end();

      if (images.length > 0) {
        const imageContent =
          "\n\n---\n\n" +
          images
            .map((source) => `![${source.description || source.url}](${source.url})`)
            .join("\n");
        content += imageContent;
        this.onMessage("message", { type: "text", text: imageContent });
      }

      if (sources.length > 0) {
        const sourceContent =
          "\n\n---\n\n" +
          sources
            .map(
              (item, idx) =>
                `[${idx + 1}]: ${item.url}${
                  item.title ? ` "${item.title.replaceAll('"', " ")}"` : ""
                }`
            )
            .join("\n");
        content += sourceContent;
        this.onMessage("message", { type: "text", text: sourceContent });
      }
      this.onMessage("message", { type: "text", text: "\n</search-task>\n\n" });

      const task: SearchTask = {
        query: item.query,
        researchGoal: item.researchGoal,
        state: "completed",
        learning: content,
        sources,
        images,
      };
      results.push(task);
      this.onMessage("progress", {
        step: "search-task",
        status: "end",
        name: item.query,
        data: task,
      });
    }
    this.onMessage("progress", { step: "task-list", status: "end" });
    return results;
  }

  async writeFinalReport(
    reportPlan: string,
    tasks: DeepResearchSearchResult[],
    enableCitationImage = true,
    enableReferences = true
  ): Promise<FinalReportResult> {
    this.onMessage("progress", { step: "final-report", status: "start" });
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const learnings = tasks.map((item) => item.learning);
    const sources: Source[] = unique(
      flat(tasks.map((item) => item.sources || [])),
      (item) => item.url
    );
    const images: ImageSource[] = unique(
      flat(tasks.map((item) => item.images || [])),
      (item) => item.url
    );
    const result = streamText({
      model: await this.getThinkingModel(),
      system: [getSystemPrompt(), outputGuidelinesPrompt].join("\n\n"),
      prompt: [
        writeFinalReportPrompt(
          reportPlan,
          learnings,
          sources.map((item) => pick(item, ["title", "url"])),
          images,
          "",
          images.length > 0 && enableCitationImage,
          sources.length > 0 && enableReferences
        ),
        this.getResponseLanguagePrompt(),
      ].join("\n\n"),
    });
    let content = "";
    this.onMessage("message", { type: "text", text: "<final-report>\n" });
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        thinkTagStreamProcessor.processChunk(
          part.textDelta,
          (data) => {
            content += data;
            this.onMessage("message", { type: "text", text: data });
          },
          (data) => {
            this.onMessage("reasoning", { type: "text", text: data });
          }
        );
      } else if (part.type === "reasoning") {
        this.onMessage("reasoning", { type: "text", text: part.textDelta });
      } else if (part.type === "source") {
        sources.push(part.source);
      } else if (part.type === "finish") {
        if (sources.length > 0) {
          const sourceContent =
            "\n\n---\n\n" +
            sources
              .map(
                (item, idx) =>
                  `[${idx + 1}]: ${item.url}${
                    item.title ? ` "${item.title.replaceAll('"', " ")}"` : ""
                  }`
              )
              .join("\n");
          content += sourceContent;
        }
      }
    }
    this.onMessage("message", { type: "text", text: "\n</final-report>\n\n" });
    thinkTagStreamProcessor.end();

    const title = (content || "").split("\n")[0].replaceAll("#", "").replaceAll("*", "").trim();

    const finalReportResult: FinalReportResult = {
      title,
      finalReport: content,
      learnings,
      sources,
      images,
    };
    this.onMessage("progress", {
      step: "final-report",
      status: "end",
      data: finalReportResult,
    });
    return finalReportResult;
  }

  async start(query: string, enableCitationImage = true, enableReferences = true) {
    try {
      const reportPlan = await this.writeReportPlan(query);
      const tasks = await this.generateSERPQuery(reportPlan);
      const results = await this.runSearchTask(tasks, enableReferences);
      const finalReport = await this.writeFinalReport(
        reportPlan,
        results,
        enableCitationImage,
        enableReferences
      );
      return finalReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      this.onMessage("error", { message: errorMessage });
      throw new Error(errorMessage);
    }
  }
}

export default DeepResearch;
