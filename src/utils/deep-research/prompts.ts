import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import {
  resolveDeepResearchPromptTemplates,
  type DeepResearchPromptOverrides,
} from "@/constants/prompts";

function getPromptTemplates(promptOverrides?: DeepResearchPromptOverrides) {
  return resolveDeepResearchPromptTemplates(promptOverrides);
}

export function getSERPQuerySchema() {
  return z
    .array(
      z
        .object({
          query: z.string().describe("The SERP query."),
          researchGoal: z
            .string()
            .describe(
              "First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions. JSON reserved words should be escaped."
            ),
        })
        .required({ query: true, researchGoal: true })
    )
    .describe(`List of SERP queries.`);
}

export function getSERPQueryOutputSchema() {
  const SERPQuerySchema = getSERPQuerySchema();
  return JSON.stringify(zodToJsonSchema(SERPQuerySchema), null, 4);
}

export function getSystemPrompt(promptOverrides?: DeepResearchPromptOverrides) {
  const { systemInstruction } = getPromptTemplates(promptOverrides);
  return systemInstruction.replace("{now}", new Date().toISOString());
}

export function getOutputGuidelinesPrompt(
  promptOverrides?: DeepResearchPromptOverrides
) {
  const { outputGuidelinesPrompt } = getPromptTemplates(promptOverrides);
  return outputGuidelinesPrompt;
}

export function generateQuestionsPrompt(
  query: string,
  promptOverrides?: DeepResearchPromptOverrides
) {
  const { systemQuestionPrompt } = getPromptTemplates(promptOverrides);
  return systemQuestionPrompt.replace("{query}", query);
}

export function writeReportPlanPrompt(
  query: string,
  promptOverrides?: DeepResearchPromptOverrides
) {
  const { reportPlanPrompt } = getPromptTemplates(promptOverrides);
  return reportPlanPrompt.replace("{query}", query);
}

export function generateSerpQueriesPrompt(
  plan: string,
  promptOverrides?: DeepResearchPromptOverrides
) {
  const { serpQueriesPrompt } = getPromptTemplates(promptOverrides);
  return serpQueriesPrompt
    .replace("{plan}", plan)
    .replace("{outputSchema}", getSERPQueryOutputSchema());
}

export function processResultPrompt(
  query: string,
  researchGoal: string,
  promptOverrides?: DeepResearchPromptOverrides
) {
  const { queryResultPrompt } = getPromptTemplates(promptOverrides);
  return queryResultPrompt
    .replace("{query}", query)
    .replace("{researchGoal}", researchGoal);
}

export function processSearchResultPrompt(
  query: string,
  researchGoal: string,
  results: Source[],
  enableReferences: boolean,
  promptOverrides?: DeepResearchPromptOverrides
) {
  const { searchResultPrompt, citationRulesPrompt } =
    getPromptTemplates(promptOverrides);
  const context = results.map(
    (result, idx) =>
      `<content index="${idx + 1}" url="${result.url}">\n${
        result.content
      }\n</content>`
  );
  return (
    searchResultPrompt + (enableReferences ? `\n\n${citationRulesPrompt}` : "")
  )
    .replace("{query}", query)
    .replace("{researchGoal}", researchGoal)
    .replace("{context}", context.join("\n"));
}

export function processSearchKnowledgeResultPrompt(
  query: string,
  researchGoal: string,
  results: Knowledge[],
  promptOverrides?: DeepResearchPromptOverrides
) {
  const { searchKnowledgeResultPrompt } = getPromptTemplates(promptOverrides);
  const context = results.map(
    (result, idx) =>
      `<content index="${idx + 1}" url="${location.host}">\n${
        result.content
      }\n</content>`
  );
  return searchKnowledgeResultPrompt
    .replace("{query}", query)
    .replace("{researchGoal}", researchGoal)
    .replace("{context}", context.join("\n"));
}

export function reviewSerpQueriesPrompt(
  plan: string,
  learning: string[],
  suggestion: string,
  promptOverrides?: DeepResearchPromptOverrides
) {
  const { reviewPrompt } = getPromptTemplates(promptOverrides);
  const learnings = learning.map(
    (detail) => `<learning>\n${detail}\n</learning>`
  );
  return reviewPrompt
    .replace("{plan}", plan)
    .replace("{learnings}", learnings.join("\n"))
    .replace("{suggestion}", suggestion)
    .replace("{outputSchema}", getSERPQueryOutputSchema());
}

export function writeFinalReportPrompt(
  plan: string,
  learning: string[],
  source: Source[],
  images: ImageSource[],
  requirement: string,
  enableCitationImage: boolean,
  enableReferences: boolean,
  enableFileFormatResource: boolean,
  promptOverrides?: DeepResearchPromptOverrides
) {
  const {
    finalReportPrompt,
    finalReportCitationImagePrompt,
    finalReportReferencesPrompt,
  } = getPromptTemplates(promptOverrides);
  const learnings = learning.map(
    (detail) => `<learning>\n${detail}\n</learning>`
  );
  const sources = source.map(
    (item, idx) =>
      `<source index="${idx + 1}" url="${item.url}">\n${item.title}\n</source>`
  );
  const imageList = images.map(
    (source, idx) => `${idx + 1}. ![${source.description}](${source.url})`
  );
  return (
    finalReportPrompt +
    (enableCitationImage
      ? `\n**Including meaningful images from the previous research in the report is very helpful.**\n\n${finalReportCitationImagePrompt}`
      : "") +
    (enableReferences ? `\n\n${finalReportReferencesPrompt}` : "")
  )
    .replace("{plan}", plan)
    .replace(
      "{learnings}",
      enableFileFormatResource
        ? "**Please get all the learnings information from the attached file `resources.md`.**"
        : learnings.join("\n")
    )
    .replace(
      "{sources}",
      enableFileFormatResource
        ? "**Please get all the sources from the attached file `resources.md`.**"
        : sources.join("\n")
    )
    .replace(
      "{images}",
      enableFileFormatResource
        ? "**Please get all the images from the attached file `resources.md`.**"
        : imageList.join("\n")
    )
    .replace("{requirement}", requirement);
}
