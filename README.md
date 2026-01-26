<div align="center">
<h1>Deep Research</h1>

![GitHub deployments](https://img.shields.io/github/deployments/u14app/gemini-next-chat/Production)
![GitHub Release](https://img.shields.io/github/v/release/u14app/deep-research)
![Docker Image Size](https://img.shields.io/docker/image-size/xiangfa/deep-research/latest)
![Docker Pulls](https://img.shields.io/docker/pulls/xiangfa/deep-research)
[![License: MIT](https://img.shields.io/badge/License-MIT-default.svg)](https://opensource.org/licenses/MIT)

[![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Next](https://img.shields.io/badge/Next.js-111111?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-111111?style=flat&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)

[![Vercel](https://img.shields.io/badge/Vercel-111111?style=flat&logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fu14app%2Fdeep-research&project-name=deep-research&repository-name=deep-research)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F69652?style=flat&logo=cloudflare&logoColor=white)](./docs/How-to-deploy-to-Cloudflare-Pages.md)
[![PWA](https://img.shields.io/badge/PWA-blue?style=flat&logo=pwa&logoColor=white)](https://research.u14.app/)

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/u14app/deep-research)

</div>

**Lightning-Fast Deep Research Report**

Deep Research uses a variety of powerful AI models to generate in-depth research reports in just a few minutes. It leverages advanced "Thinking" and "Task" models, combined with an internet connection, to provide fast and insightful analysis on a variety of topics. **Your privacy is paramount - all data is processed and stored locally.**

## ✨ Features

- **Rapid Deep Research:** Generates comprehensive research reports in about 2 minutes, significantly accelerating your research process.
- **Multi-platform Support:** Supports rapid deployment to Vercel, Cloudflare and other platforms.
- **Powered by AI:** Utilizes the advanced AI models for accurate and insightful analysis.
- **Privacy-Focused:** Your data remains private and secure, as all data is stored locally on your browser.
- **Support for Multi-LLM:** Supports a variety of mainstream large language models, including Gemini, OpenAI, Anthropic, Deepseek, Grok, Mistral, Azure OpenAI, any OpenAI Compatible LLMs, OpenRouter, Ollama, etc.
- **Support Web Search:** Supports search engines such as Searxng, Tavily, Firecrawl, Exa, Bocha, Brave, etc., allowing LLMs that do not support search to use the web search function more conveniently.
- **Thinking & Task Models:** Employs sophisticated "Thinking" and "Task" models to balance depth and speed, ensuring high-quality results quickly. Support switching research models.
- **Support Further Research:** You can refine or adjust the research content at any stage of the project and support re-research from that stage.
- **Local Knowledge Base:** Supports uploading and processing text, Office, PDF and other resource files to generate local knowledge base.
- **Artifact:** Supports editing of research content, with two editing modes: WYSIWYM and Markdown. It is possible to adjust the reading level, article length and full text translation.
- **Knowledge Graph:** It supports one-click generation of knowledge graph, allowing you to have a systematic understanding of the report content.
- **Research History:** Support preservation of research history, you can review previous research results at any time and conduct in-depth research again.
- **Local & Server API Support:** Offers flexibility with both local and server-side API calling options to suit your needs.
- **Support for SaaS and MCP:** You can use this project as a deep research service (SaaS) through the SSE API, or use it in other AI services through MCP service.
- **Support PWA:** With Progressive Web App (PWA) technology, you can use the project like a software.
- **Support Multi-Key payload:** Support Multi-Key payload to improve API response efficiency.
- **Multi-language Support**: English, 简体中文, Español.
- **Built with Modern Technologies:** Developed using Next.js 15 and Shadcn UI, ensuring a modern, performant, and visually appealing user experience.
- **MIT Licensed:** Open-source and freely available for personal and commercial use under the MIT License.

## 🎯 Roadmap

- [x] Support preservation of research history
- [x] Support editing final report and search results
- [x] Support for other LLM models
- [x] Support file upload and local knowledge base
- [x] Support SSE API and MCP server

## 🚀 Getting Started

### Use Free Gemini (recommend)

1. Get [Gemini API Key](https://aistudio.google.com/app/apikey)
2. One-click deployment of the project, you can choose to deploy to Vercel or Cloudflare

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fu14app%2Fdeep-research&project-name=deep-research&repository-name=deep-research)

   Currently the project supports deployment to Cloudflare, but you need to follow [How to deploy to Cloudflare Pages](./docs/How-to-deploy-to-Cloudflare-Pages.md) to do it.

3. Start using

### Use Other LLM

1. Deploy the project to Vercel or Cloudflare
2. Set the LLM API key
3. Set the LLM API base URL (optional)
4. Start using

## ⌨️ Development

Follow these steps to get Deep Research up and running on your local browser.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.18.0 or later recommended)
- [pnpm](https://pnpm.io/) or [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/u14app/deep-research.git
   cd deep-research
   ```

2. **Install dependencies:**

   ```bash
   pnpm install  # or npm install or yarn install
   ```

3. **Set up Environment Variables:**

   You need to modify the file `env.tpl` to `.env`, or create a `.env` file and write the variables to this file.

   ```bash
   # For Development
   cp env.tpl .env.local
   # For Production
   cp env.tpl .env
   ```

4. **Run the development server:**

   ```bash
   pnpm dev  # or npm run dev or yarn dev
   ```

   Open your browser and visit [http://localhost:3000](http://localhost:3000) to access Deep Research.

### Custom Model List

The project allow custom model list, but **only works in proxy mode**. Please add an environment variable named `NEXT_PUBLIC_MODEL_LIST` in the `.env` file or environment variables page.

Custom model lists use `,` to separate multiple models. If you want to disable a model, use the `-` symbol followed by the model name, i.e. `-existing-model-name`. To only allow the specified model to be available, use `-all,+new-model-name`.

## 🚢 Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fu14app%2Fdeep-research&project-name=deep-research&repository-name=deep-research)

### Cloudflare

Currently the project supports deployment to Cloudflare, but you need to follow [How to deploy to Cloudflare Pages](./docs/How-to-deploy-to-Cloudflare-Pages.md) to do it.

### Docker

> The Docker version needs to be 20 or above, otherwise it will prompt that the image cannot be found.

> ⚠️ Note: Most of the time, the docker version will lag behind the latest version by 1 to 2 days, so the "update exists" prompt will continue to appear after deployment, which is normal.

```bash
docker pull xiangfa/deep-research:latest
docker run -d --name deep-research -p 3333:3000 xiangfa/deep-research
```

You can also specify additional environment variables:

```bash
docker run -d --name deep-research \
   -p 3333:3000 \
   -e ACCESS_PASSWORD=your-password \
   -e GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy... \
   xiangfa/deep-research
```

or build your own docker image:

```bash
docker build -t deep-research .
docker run -d --name deep-research -p 3333:3000 deep-research
```

If you need to specify other environment variables, please add `-e key=value` to the above command to specify it.

Deploy using `docker-compose.yml`:

```bash
version: '3.9'
services:
   deep-research:
      image: xiangfa/deep-research
      container_name: deep-research
      environment:
         - ACCESS_PASSWORD=your-password
         - GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
      ports:
         - 3333:3000
```

or build your own docker compose:

```bash
docker compose -f docker-compose.yml build
```

### Static Deployment

You can also build a static page version directly, and then upload all files in the `out` directory to any website service that supports static pages, such as Github Page, Cloudflare, Vercel, etc..

```bash
pnpm build:export
```

## ⚙️ Configuration

As mentioned in the "Getting Started" section, Deep Research utilizes the following environment variables for server-side API configurations:

Please refer to the file [env.tpl](./env.tpl) for all available environment variables.

**Important Notes on Environment Variables:**

- **Privacy Reminder:** These environment variables are primarily used for **server-side API calls**. When using the **local API mode**, no API keys or server-side configurations are needed, further enhancing your privacy.

- **Multi-key Support:** Supports multiple keys, each key is separated by `,`, i.e. `key1,key2,key3`.

- **Security Setting:** By setting `ACCESS_PASSWORD`, you can better protect the security of the server API.

- **Make variables effective:** After adding or modifying this environment variable, please redeploy the project for the changes to take effect.

## 📄 API documentation

Currently the project supports two forms of API: Server-Sent Events (SSE) and Model Context Protocol (MCP).

### Server-Sent Events API

The Deep Research API provides a real-time interface for initiating and monitoring complex research tasks.

Recommended to use the API via `@microsoft/fetch-event-source`, to get the final report, you need to listen to the `message` event, the data will be returned in the form of a text stream.

#### POST method

Endpoint: `/api/sse`

Method: `POST`

Body:

```typescript
interface SSEConfig {
  // Research topic
  query: string;
  // AI provider, Possible values ​​include: google, openai, anthropic, deepseek, xai, mistral, azure, openrouter, openaicompatible, pollinations, ollama
  provider: string;
  // Thinking model id
  thinkingModel: string;
  // Task model id
  taskModel: string;
  // Search provider, Possible values ​​include: model, tavily, firecrawl, exa, bocha, searxng
  searchProvider: string;
  // Response Language, also affects the search language. (optional)
  language?: string;
  // Maximum number of search results. Default, `5` (optional)
  maxResult?: number;
  // Whether to include content-related images in the final report. Default, `true`. (optional)
  enableCitationImage?: boolean;
  // Whether to include citation links in search results and final reports. Default, `true`. (optional)
  enableReferences?: boolean;
}
```

Headers:

```typescript
interface Headers {
  "Content-Type": "application/json";
  // If you set an access password
  // Authorization: "Bearer YOUR_ACCESS_PASSWORD";
}
```

See the detailed [API documentation](./docs/deep-research-api-doc.md).

#### GET method

This is an interesting implementation. You can watch the whole process of deep research directly through the URL just like watching a video.

You can access the deep research report via the following link:

```text
http://localhost:3000/api/sse/live?query=AI+trends+for+this+year&provider=pollinations&thinkingModel=openai&taskModel=openai-fast&searchProvider=searxng
```

Query Params:

```typescript
// The parameters are the same as POST parameters
interface QueryParams extends SSEConfig {
  // If you set the `ACCESS_PASSWORD` environment variable, this parameter is required
  password?: string;
}
```

### Model Context Protocol (MCP) Server

Currently supports `StreamableHTTP` and `SSE` Server Transport.

StreamableHTTP server endpoint: `/api/mcp`, transport type: `streamable-http`

SSE server endpoint: `/api/mcp/sse`, transport type: `sse`

```json
{
  "mcpServers": {
    "deep-research": {
      "url": "http://127.0.0.1:3000/api/mcp",
      "transportType": "streamable-http",
      "timeout": 600
    }
  }
}
```

**Note:** Since deep research take a long time to execute, you need to set a longer timeout to avoid interrupting the study.

If your server sets `ACCESS_PASSWORD`, the MCP service will be protected and you need to add additional headers parameters:

```json
{
  "mcpServers": {
    "deep-research": {
      "url": "http://127.0.0.1:3000/api/mcp",
      "transportType": "streamable-http",
      "timeout": 600,
      "headers": {
        "Authorization": "Bearer YOUR_ACCESS_PASSWORD"
      }
    }
  }
}
```

**Enabling MCP service requires setting global environment variables:**

```bash
# MCP Server AI provider
# Possible values ​​include: google, openai, anthropic, deepseek, xai, mistral, azure, openrouter, openaicompatible, pollinations, ollama
MCP_AI_PROVIDER=google
# MCP Server search provider. Default, `model`
# Possible values ​​include: model, tavily, firecrawl, exa, bocha, searxng
MCP_SEARCH_PROVIDER=tavily
# MCP Server thinking model id, the core model used in deep research.
MCP_THINKING_MODEL=gemini-2.0-flash-thinking-exp
# MCP Server task model id, used for secondary tasks, high output models are recommended.
MCP_TASK_MODEL=gemini-2.0-flash-exp
```

**Note:** To ensure that the MCP service can be used normally, you need to set the environment variables of the corresponding model and search engine. For specific environment variable parameters, please refer to [env.tpl](./env.tpl).

## 🪄 How it works

1. **Research topic**
   - Input research topic
   - Use local research resources (optional)
   - Start thinking (or rethinking)

2. **Propose your ideas**
   - The system asks questions
     - Answer system questions (optional)
     - Write a research plan (or rewrite the research plan)
   - The system outputs the research plan
     - Start in-depth research (or re-research)
     - The system generates SERP queries

3. **Information collection**
   - Initial research
     - Retrieve local research resources based on SERP queries
     - Collect information from the Internet based on SERP queries
   - In-depth research (this process can be repeated)
     - Propose research suggestions (optional)
     - Start a new round of information collection (the process is the same as the initial research)

4. **Generate Final Report**
   - Make a writing request (optional)
   - Summarize all research materials into a comprehensive Markdown report
   - Regenerate research report (optional)

```mermaid
flowchart TB
    A[Research Topic]:::start

    subgraph Propose[Propose your ideas]
        B1[System asks questions]:::process
        B2[System outputs the research plan]:::process
        B3[System generates SERP queries]:::process
        B1 --> B2
        B2 --> B3
    end

    subgraph Collect[Information collection]
        C1[Initial research]:::collection
        C1a[Retrieve local research resources based on SERP queries]:::collection
        C1b[Collect information from the Internet based on SERP queries]:::collection
        C2[In-depth research]:::recursive
        Refine{More in-depth research needed?}:::decision

        C1 --> C1a
        C1 --> C1b
        C1a --> C2
        C1b --> C2
        C2 --> Refine
        Refine -->|Yes| C2
    end

    Report[Generate Final Report]:::output

    A --> Propose
    B3 --> C1

    %% Connect the exit from the loop/subgraph to the final report
    Refine -->|No| Report

    %% Styling
    classDef start fill:#7bed9f,stroke:#2ed573,color:black
    classDef process fill:#70a1ff,stroke:#1e90ff,color:black
    classDef recursive fill:#ffa502,stroke:#ff7f50,color:black
    classDef output fill:#ff4757,stroke:#ff6b81,color:black
    classDef collection fill:#a8e6cf,stroke:#3b7a57,color:black
    classDef decision fill:#c8d6e5,stroke:#8395a7,color:black

    class A start
    class B1,B2,B3 process
    class C1,C1a,C1b collection
    class C2 recursive
    class Refine decision
    class Report output
```

## 🙋 FAQs

**Why does my Ollama or SearXNG not work properly and displays the error `TypeError: Failed to fetch`?**

If your request generates `CORS` due to browser security restrictions, you need to configure parameters for Ollama or SearXNG to allow cross-domain requests. You can also consider using the server proxy mode, which is a backend server that makes requests, which can effectively avoid cross-domain issues.

## 🛡️ Privacy

Deep Research is designed with your privacy in mind. **All research data and generated reports are stored locally on your machine.** We do not collect or transmit any of your research data to external servers (unless you are explicitly using server-side API calls, in which case data is sent to API through your configured proxy if any). Your privacy is our priority.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) - The React framework for building performant web applications.
- [Shadcn UI](https://ui.shadcn.com/) - Beautifully designed components that helped streamline the UI development.
- [AI SDKs](https://sdk.vercel.ai) - Powering the intelligent research capabilities of Deep Research.
- [Deep Research](https://github.com/dzhng/deep-research) - Thanks to the project `dzhng/deep-research` for inspiration.

## 🤝 Contributing

We welcome contributions to Deep Research! If you have ideas for improvements, bug fixes, or new features, please feel free to:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Submit a pull request.

For major changes, please open an issue first to discuss your proposed changes.

## ✉️ Contact

If you have any questions, suggestions, or feedback, please create a new [issue](https://github.com/u14app/deep-research/issues).

## 📝 License

Deep Research is released under the [MIT License](LICENSE). This license allows for free use, modification, and distribution for both commercial and non-commercial purposes.
