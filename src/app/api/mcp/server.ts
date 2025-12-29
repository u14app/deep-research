import { z } from "zod";
import { McpServer } from "@/libs/mcp-server/mcp";
import DeepResearch from "@/utils/deep-research";
import { multiApiKeyPolling } from "@/utils/model";
import {
  getAIProviderBaseURL,
  getAIProviderApiKey,
  getSearchProviderBaseURL,
  getSearchProviderApiKey,
} from "../utils";

const AI_PROVIDER = process.env.MCP_AI_PROVIDER || "";
const SEARCH_PROVIDER = process.env.MCP_SEARCH_PROVIDER || "model";
const THINKING_MODEL = process.env.MCP_THINKING_MODEL || "";
const TASK_MODEL = process.env.MCP_TASK_MODEL || "";

function initDeepResearchServer({
  language,
  maxResult,
}: {
  language?: string;
  maxResult?: number;
}) {
  const deepResearch = new DeepResearch({
    language,
    AIProvider: {
      baseURL: getAIProviderBaseURL(AI_PROVIDER),
      apiKey: multiApiKeyPolling(getAIProviderApiKey(AI_PROVIDER)),
      provider: AI_PROVIDER,
      thinkingModel: THINKING_MODEL,
      taskModel: TASK_MODEL,
    },
    searchProvider: {
      baseURL: getSearchProviderBaseURL(SEARCH_PROVIDER),
      apiKey: multiApiKeyPolling(getSearchProviderApiKey(SEARCH_PROVIDER)),
      provider: SEARCH_PROVIDER,
      maxResult,
    },
    onMessage: (event, data) => {
      if (event === "progress") {
        console.log(
          `[${data.step}]: ${data.name ? `"${data.name}" ` : ""}${data.status}`
        );
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
  const writeResearchPlanDescription =
    "Generate research plan based on user query.";
  const generateSERPQueryDescription =
    "Generate a list of data collection tasks based on the research plan.";
  const searchTaskDescription =
    "Generate SERP queries based on the research plan.";
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
      language: z
        .string()
        .optional()
        .describe("The final report text language."),
      maxResult: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of search results."),
      enableCitationImage: z
        .boolean()
        .default(true)
        .optional()
        .describe(
          "Whether to include content-related images in the final report."
        ),
      enableReferences: z
        .boolean()
        .default(true)
        .optional()
        .describe(
          "Whether to include citation links in search results and final reports."
        ),
    },
    {
      title: "Deep Research",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true, // Uses external search and AI APIs
    },
    async (
      { query, language, maxResult, enableCitationImage, enableReferences },
      { signal }
    ) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({
          language,
          maxResult,
        });
        const result = await deepResearch.start(
          query,
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
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
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
    {
      title: "Write Research Plan",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true, // Uses external AI API
    },
    async ({ query, language }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({ language });
        const result = await deepResearch.writeReportPlan(query);
        return {
          content: [
            { type: "text", text: JSON.stringify({ reportPlan: result }) },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
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
    {
      title: "Generate SERP Query",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true, // Uses external AI API
    },
    async ({ plan, language }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({ language });
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
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
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
      maxResult: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of search results."),
      enableReferences: z
        .boolean()
        .default(true)
        .optional()
        .describe(
          "Whether to include citation links in search results and final reports."
        ),
    },
    {
      title: "Search Task",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true, // Uses external search API
    },
    async (
      { tasks, language, maxResult, enableReferences = true },
      { signal }
    ) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({ language, maxResult });
        const result = await deepResearch.runSearchTask(
          tasks,
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
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
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
              .describe(
                "Knowledge learned while performing information gathering tasks."
              ),
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
                  description: z
                    .string()
                    .optional()
                    .describe("Image Description."),
                })
              )
              .optional()
              .describe(
                "Image resources obtained when performing information collection tasks."
              ),
          })
        )
        .describe(
          "The data information collected during the execution of the query task."
        ),
      language: z
        .string()
        .optional()
        .describe("The final report text language."),
      maxResult: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of search results."),
      enableCitationImage: z
        .boolean()
        .default(true)
        .optional()
        .describe(
          "Whether to include content-related images in the final report."
        ),
      enableReferences: z
        .boolean()
        .default(true)
        .optional()
        .describe(
          "Whether to include citation links in search results and final reports."
        ),
    },
    {
      title: "Write Final Report",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true, // Uses external AI API
    },
    async (
      {
        plan,
        tasks,
        language,
        maxResult,
        enableCitationImage = true,
        enableReferences = true,
      },
      { signal }
    ) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({ language, maxResult });
        const result = await deepResearch.writeFinalReport(
          plan,
          tasks,
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
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  return server;
}
