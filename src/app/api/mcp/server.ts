import { z } from "zod";
import { McpServer } from "@/libs/mcp-server/mcp";
import DeepResearch from "@/utils/deep-research";
import { multiApiKeyPolling } from "@/utils/model";
import {
  getAIProviderApiKey,
  getAIProviderBaseURL,
  getSearchProviderApiKey,
  getSearchProviderBaseURL,
} from "../utils";

const AI_PROVIDER = process.env["MCP_AI_PROVIDER"] || "";
const SEARCH_PROVIDER = process.env["MCP_SEARCH_PROVIDER"] || "model";
const THINKING_MODEL = process.env["MCP_THINKING_MODEL"] || "";
const TASK_MODEL = process.env["MCP_TASK_MODEL"] || "";

function initDeepResearchServer({
  language,
  maxResult,
}: {
  language?: string;
  maxResult?: number;
}) {
  const aiApiKey = multiApiKeyPolling(getAIProviderApiKey(AI_PROVIDER));
  const searchApiKey = multiApiKeyPolling(getSearchProviderApiKey(SEARCH_PROVIDER));

  const deepResearch = new DeepResearch({
    ...(language && { language }),
    AIProvider: {
      baseURL: getAIProviderBaseURL(AI_PROVIDER),
      ...(aiApiKey && { apiKey: aiApiKey }),
      provider: AI_PROVIDER,
      thinkingModel: THINKING_MODEL,
      taskModel: TASK_MODEL,
    },
    searchProvider: {
      baseURL: getSearchProviderBaseURL(SEARCH_PROVIDER),
      ...(searchApiKey && { apiKey: searchApiKey }),
      provider: SEARCH_PROVIDER,
      ...(maxResult && { maxResult }),
    },
    onMessage: (event, data) => {
      if (event === "progress") {
        console.log(`[${data.step}]: ${data.name ? `"${data.name}" ` : ""}${data.status}`);
        if (data.status === "end" && data.data) {
          console.log(data.data);
        }
      } else if (event === "error") {
        console.error(data.message);
        throw new Error(data.message);
      }
    },
  });

  return deepResearch;
}

export function initMcpServer() {
  const deepResearchToolDescription =
    "Start deep research on any question, obtain and organize information through search engines, and generate research report.";
  const writeResearchPlanDescription = "Generate research plan based on user query.";
  const generateSERPQueryDescription =
    "Generate a list of data collection tasks based on the research plan.";
  const searchTaskDescription = "Generate SERP queries based on the research plan.";
  const writeFinalReportDescription =
    "Write a final research report based on the research plan and the results of the information collection tasks.";

  const server = new McpServer(
    {
      name: "deep-research",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {
          "deep-research": {
            description: deepResearchToolDescription,
          },
          "write-research-plan": {
            description: writeResearchPlanDescription,
          },
          "generate-SERP-query": {
            description: generateSERPQueryDescription,
          },
          "search-task": {
            description: searchTaskDescription,
          },
          "write-final-report": {
            description: writeFinalReportDescription,
          },
        },
      },
    }
  );

  server.tool(
    "deep-research",
    deepResearchToolDescription,
    {
      query: z.string().describe("The topic for deep research."),
      language: z.string().optional().describe("The final report text language."),
      maxResult: z.number().optional().default(5).describe("Maximum number of search results."),
      enableCitationImage: z
        .boolean()
        .default(true)
        .optional()
        .describe("Whether to include content-related images in the final report."),
      enableReferences: z
        .boolean()
        .default(true)
        .optional()
        .describe("Whether to include citation links in search results and final reports."),
    },
    async ({ query, language, maxResult, enableCitationImage, enableReferences }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({
          ...(language && { language }),
          ...(maxResult && { maxResult }),
        });
        const result = await deepResearch.start(query, enableCitationImage, enableReferences);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "write-research-plan",
    writeResearchPlanDescription,
    {
      query: z.string().describe("The topic for deep research."),
      language: z.string().optional().describe("The response Language."),
    },
    async ({ query, language }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({
          ...(language && { language }),
        });
        const result = await deepResearch.writeReportPlan(query);
        return {
          content: [{ type: "text", text: JSON.stringify({ reportPlan: result }) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "generate-SERP-query",
    generateSERPQueryDescription,
    {
      plan: z.string().describe("Research plan for deep research."),
      language: z.string().optional().describe("The response Language."),
    },
    async ({ plan, language }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({
          ...(language && { language }),
        });
        const result = await deepResearch.generateSERPQuery(plan);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "search-task",
    searchTaskDescription,
    {
      tasks: z
        .array(
          z.object({
            query: z.string().describe("Information to be queried."),
            researchGoal: z.string().describe("The goal of this query task."),
          })
        )
        .describe("Information Collection Task List."),
      language: z.string().optional().describe("The response Language."),
      maxResult: z.number().optional().default(5).describe("Maximum number of search results."),
      enableReferences: z
        .boolean()
        .default(true)
        .optional()
        .describe("Whether to include citation links in search results and final reports."),
    },
    async ({ tasks, language, maxResult, enableReferences = true }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({
          ...(language && { language }),
          ...(maxResult && { maxResult }),
        });
        const result = await deepResearch.runSearchTask(tasks, enableReferences);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "write-final-report",
    writeFinalReportDescription,
    {
      plan: z.string().describe("Research plan for deep research."),
      tasks: z
        .array(
          z.object({
            query: z.string().describe("Information to be queried."),
            researchGoal: z.string().describe("The goal of this query task."),
            learning: z
              .string()
              .describe("Knowledge learned while performing information gathering tasks."),
            sources: z
              .array(
                z.object({
                  url: z.string().describe("Web link."),
                  title: z.string().optional().describe("Page title."),
                })
              )
              .optional()
              .describe(
                "Web page information that was queried when performing information collection tasks."
              ),
            images: z
              .array(
                z.object({
                  url: z.string().describe("Image link."),
                  description: z.string().optional().describe("Image Description."),
                })
              )
              .optional()
              .describe("Image resources obtained when performing information collection tasks."),
          })
        )
        .describe("The data information collected during the execution of the query task."),
      language: z.string().optional().describe("The final report text language."),
      maxResult: z.number().optional().default(5).describe("Maximum number of search results."),
      enableCitationImage: z
        .boolean()
        .default(true)
        .optional()
        .describe("Whether to include content-related images in the final report."),
      enableReferences: z
        .boolean()
        .default(true)
        .optional()
        .describe("Whether to include citation links in search results and final reports."),
    },
    async (
      { plan, tasks, language, maxResult, enableCitationImage = true, enableReferences = true },
      { signal }
    ) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({
          ...(language && { language }),
          ...(maxResult && { maxResult }),
        });
        // Filter out undefined properties to match exact type requirements
        const sanitizedTasks = tasks.map((task) => ({
          query: task.query,
          researchGoal: task.researchGoal,
          learning: task.learning,
          ...(task.sources && {
            sources: task.sources.map((source) => ({
              url: source.url,
              ...(source.title && { title: source.title }),
            })),
          }),
          ...(task.images && {
            images: task.images.map((image) => ({
              url: image.url,
              ...(image.description && { description: image.description }),
            })),
          }),
        }));

        const result = await deepResearch.writeFinalReport(
          plan,
          sanitizedTasks,
          enableCitationImage,
          enableReferences
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    }
  );

  return server;
}
