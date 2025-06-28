export const systemInstruction = `You are an expert researcher. Today is {now}. Follow these instructions when responding:

- You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news.
- The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
- Be highly organized.
- Suggest solutions that I didn't think about.
- Be proactive and anticipate my needs.
- Treat me as an expert in all subject matter.
- Mistakes erode my trust, so be accurate and thorough.
- Provide detailed explanations, I'm comfortable with lots of detail.
- Value good arguments over authorities, the source is irrelevant.
- Consider new technologies and contrarian ideas, not just the conventional wisdom.
- You may use high levels of speculation or prediction, just flag it for me.`;

export const outputGuidelinesPrompt = `<OutputGuidelines>

## Typographical rules

Follow these rules to organize your output:

- **Title:** Use \`#\` to create article title.
- **Headings:** Use \`##\` through \`######\` to create headings of different levels.
- **Paragraphs:** Use blank lines to separate paragraphs.
- **Bold emphasis (required):** Use asterisks to highlight **important** content from the rest of the text.
- **Links:** Use \`[link text](URL)\` to insert links.
- **Lists:**
    - **Unordered lists:** Use \`*\`, \`-\`, or \`+\` followed by a space.
    - **Ordered lists:** Use \`1.\`, \`2.\`, etc., and a period.
* **Code:**
    - **Inline code:** Enclose it in backticks (\` \`).
    - **Code blocks:** Enclose it in triple backticks (\`\`\` \`\`\`), optionally in a language.
- **Quotes:** Use the \`>\` symbol.
- **Horizontal rule:** Use \`---\`, \`***\` or \`___\`.
- **Table**: Use basic GFM table syntax, do not include any extra spaces or tabs for alignment, and use \`|\` and \`-\` symbols to construct. **For complex tables, GFM table syntax is not suitable. You must use HTML syntax to output complex tables.**
- **Emoji:** You can insert Emoji before the title or subtitle, such as \`🔢### 1. Determine the base area of the prism\`.
- **LaTeX:**
    - **Inline formula:** Use \`$E=mc^2$\`
    - **Block-level formula (preferred):** Use \`$$E=mc^2$$\` to display the formula in the center.

## Generate Mermaid

1. Use Mermaid's graph TD (Top-Down) or graph LR (Left-Right) type.
2. Create a unique node ID for each identified entity (must use English letters or abbreviations as IDs), and display the full name or key description of the entity in the node shape (e.g., PersonA[Alice], OrgB[XYZ Company]).
3. Relationships are represented as edges with labels, and the labels indicate the type of relationship (e.g., A --> |"Relationship Type"| B).
4. Respond with ONLY the Mermaid code (including block), and no additional text before or after.
5. Please focus on the most core entities in the article and the most important relationships between them, and ensure that the generated graph is concise and easy to understand.
6. All text content **MUST** be wrapped in \`"\` syntax. (e.g., "Any Text Content")
7. You need to double-check that all content complies with Mermaid syntax, especially that all text needs to be wrapped in \`"\`.
</OutputGuidelines>`;

export const systemQuestionPrompt = `Given the following query from the user, ask at least 5 follow-up questions to clarify the research direction:

<QUERY>
{query}
</QUERY>

Questions need to be brief and concise. No need to output content that is irrelevant to the question.`;

export const guidelinesPrompt = `Integration guidelines:
<GUIDELINES>
- Ensure each section has a distinct purpose with no content overlap.
- Combine related concepts rather than separating them.
- CRITICAL: Every section MUST be directly relevant to the main topic.
- Avoid tangential or loosely related sections that don't directly address the core topic.
</GUIDELINES>`;

export const reportPlanPrompt = `Given the following query from the user:
<QUERY>
{query}
</QUERY>

Generate a list of sections for the report based on the topic and feedback.
Your plan should be tight and focused with NO overlapping sections or unnecessary filler. Each section needs a sentence summarizing its content.

${guidelinesPrompt}

Before submitting, review your structure to ensure it has no redundant sections and follows a logical flow.`;

export const serpQuerySchemaPrompt = `You MUST respond in **JSON** matching this **JSON schema**:

\`\`\`json
{outputSchema}
\`\`\`

Expected output:

\`\`\`json
[
  {
    query: "This is a sample query.",
    researchGoal: "This is the reason for the query."
  }
]
\`\`\``;

export const serpQueriesPrompt = `This is the report plan after user confirmation:
<PLAN>
{plan}
</PLAN>

Based on previous report plan, generate a list of SERP queries to further research the topic. Make sure each query is unique and not similar to each other.

${serpQuerySchemaPrompt}`;

export const queryResultPrompt = `Please use the following query to get the latest information via the web:
<QUERY>
{query}
</QUERY>

You need to organize the searched information according to the following requirements:
<RESEARCH_GOAL>
{researchGoal}
</RESEARCH_GOAL>

You need to think like a human researcher.
Generate a list of learnings from the search results.
Make sure each learning is unique and not similar to each other.
The learnings should be to the point, as detailed and information dense as possible.
Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any specific entities, metrics, numbers, and dates when available. The learnings will be used to research the topic further.`;

export const citationRulesPrompt = `Citation Rules:

- Please cite the context at the end of sentences when appropriate.
- Please use the format of citation number [number] to reference the context in corresponding parts of your answer.
- If a sentence comes from multiple contexts, please list all relevant citation numbers, e.g., [1][2]. Remember not to group citations at the end but list them in the corresponding parts of your answer.`;

export const searchResultPrompt = `Given the following contexts from a SERP search for the query:
<QUERY>
{query}
</QUERY>

You need to organize the searched information according to the following requirements:
<RESEARCH_GOAL>
{researchGoal}
</RESEARCH_GOAL>

The following context from the SERP search:
<CONTEXT>
{context}
</CONTEXT>

You need to think like a human researcher.
Generate a list of learnings from the contexts.
Make sure each learning is unique and not similar to each other.
The learnings should be to the point, as detailed and information dense as possible.
Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any specific entities, metrics, numbers, and dates when available. The learnings will be used to research the topic further.`;

export const searchKnowledgeResultPrompt = `Given the following contents from a local knowledge base search for the query:
<QUERY>
{query}
</QUERY>

You need to organize the searched information according to the following requirements:
<RESEARCH_GOAL>
{researchGoal}
</RESEARCH_GOAL>

The following contexts from the SERP search:
<CONTEXT>
{context}
</CONTEXT>

You need to think like a human researcher.
Generate a list of learnings from the contents.
Make sure each learning is unique and not similar to each other.
The learnings should be to the point, as detailed and information dense as possible.
Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any specific entities, metrics, numbers, and dates when available. The learnings will be used to research the topic further.`;

export const reviewPrompt = `This is the report plan after user confirmation:
<PLAN>
{plan}
</PLAN>

Here are all the learnings from previous research:
<LEARNINGS>
{learnings}
</LEARNINGS>

This is the user's suggestion for research direction:
<SUGGESTION>
{suggestion}
</SUGGESTION>

Based on previous research and user research suggestions, determine whether further research is needed.
If further research is needed, list of follow-up SERP queries to research the topic further.
Make sure each query is unique and not similar to each other.
If you believe no further research is needed, you can output an empty queries.

${serpQuerySchemaPrompt}`;

export const finalReportCitationImagePrompt = `Image Rules:

- Images related to the paragraph content at the appropriate location in the article according to the image description.
- Include images using \`![Image Description](image_url)\` in a separate section.
- **Do not add any images at the end of the article.**`;

export const finalReportReferencesPrompt = `Citation Rules:

- Please cite research references at the end of your paragraphs when appropriate.
- If the citation is from the reference, please **ignore**. Include only references from sources.
- Please use the reference format [number], to reference the learnings link in corresponding parts of your answer.
- If a paragraphs comes from multiple learnings reference link, please list all relevant citation numbers, e.g., [1][2]. Remember not to group citations at the end but list them in the corresponding parts of your answer. Control the number of footnotes.
- Do not have more than 3 reference link in a paragraph, and keep only the most relevant ones.
- **Do not add references at the end of the report.**`;

export const finalReportPrompt = `This is the report plan after user confirmation:
<PLAN>
{plan}
</PLAN>

Here are all the learnings from previous research:
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

When presenting comparisons, structured data, or feature lists, use Markdown tables.
**Markdown Table Syntax Reminder:**
- Start the table with a header row, separating columns with | (pipe) characters.
- The second row must contain only dashes (-) and pipes to define the header.
- Each subsequent row represents data, with columns separated by pipes.
- Do not use HTML or other table formats.
- Example:
\`\`\`
| Feature         | Option A | Option B |
|-----------------|----------|----------|
| Current Rating  | 100A     | 120A     |
| IP Rating       | IP67     | IP69K    |
\`\`\`
- Ensure there are no extra line breaks inside the table block.
- Respond only with valid Markdown.

Write a final report based on the report plan using the learnings from research.
Make it as detailed as possible, aim for 5 pages or more, the more the better, include ALL the learnings from research.
**Respond only the final report content, and no additional text before or after.**`;

export const rewritingPrompt = `You are tasked with re-writing the following text to markdown. Ensure you do not change the meaning or story behind the text. 

**Respond only the updated markdown text, and no additional text before or after.**`;

export const knowledgeGraphPrompt = `Based on the following article, please extract the key entities (e.g., names of people, places, organizations, concepts, events, etc.) and the main relationships between them, and then generate a Mermaid graph code that visualizes these entities and relationships.

## Output format requirements

1. Use Mermaid's graph TD (Top-Down) or graph LR (Left-Right) type.
2. Create a unique node ID for each identified entity (must use English letters or abbreviations as IDs), and display the full name or key description of the entity in the node shape (e.g., PersonA[Alice], OrgB[XYZ Company]).
3. Relationships are represented as edges with labels, and the labels indicate the type of relationship (e.g., A --> |"Relationship Type"| B).
4. Respond with ONLY the Mermaid code (including block), and no additional text before or after.
5. Please focus on the most core entities in the article and the most important relationships between them, and ensure that the generated graph is concise and easy to understand.
6. All text content **MUST** be wrapped in \`"\` syntax. (e.g., "Any Text Content")
7. You need to double-check that all content complies with Mermaid syntax, especially that all text needs to be wrapped in \`"\`.`;
