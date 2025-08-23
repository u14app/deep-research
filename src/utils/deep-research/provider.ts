import type { AzureOpenAIProviderSettings } from "@ai-sdk/azure";
import type { GoogleVertexProviderSettings } from "@ai-sdk/google-vertex/edge";

export interface AIProviderOptions {
  provider: string;
  baseURL: string;
  apiKey?: string;
  auth?: Record<string, string>;
  headers?: Record<string, string>;
  model: string;
  settings?: any;
}

export async function createAIProvider({
  provider,
  apiKey,
  baseURL,
  auth,
  headers,
  model,
  settings,
}: AIProviderOptions) {
  if (provider === "google") {
    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    const config: any = { baseURL };
    if (apiKey) config.apiKey = apiKey;
    const google = createGoogleGenerativeAI(config);
    return google(model, settings);
  } else if (provider === "google-vertex") {
    const { createVertex } = await import("@ai-sdk/google-vertex/edge");
    const googleVertexOptions: GoogleVertexProviderSettings = {};
    if (auth) {
      if (auth["project"]) googleVertexOptions.project = auth["project"];
      if (auth["location"]) googleVertexOptions.location = auth["location"];
    }
    if (baseURL) {
      googleVertexOptions.baseURL = baseURL;
    }
    if (auth?.["clientEmail"] && auth?.["privateKey"]) {
      const creds: any = {
        clientEmail: auth["clientEmail"],
        privateKey: auth["privateKey"],
      };
      if (auth["privateKeyId"]) creds.privateKeyId = auth["privateKeyId"];
      googleVertexOptions.googleCredentials = creds;
    }
    const googleVertex = createVertex(googleVertexOptions);
    return googleVertex(model, settings);
  } else if (provider === "openai") {
    const { createOpenAI } = await import("@ai-sdk/openai");
    const config: any = { baseURL };
    if (apiKey) config.apiKey = apiKey;
    const openai = createOpenAI(config);
    return model.startsWith("gpt-4o") ? openai.responses(model) : openai(model, settings);
  } else if (provider === "anthropic") {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    const config: any = { baseURL };
    if (apiKey) config.apiKey = apiKey;
    if (headers) config.headers = headers;
    const anthropic = createAnthropic(config);
    return anthropic(model, settings);
  } else if (provider === "deepseek") {
    const { createDeepSeek } = await import("@ai-sdk/deepseek");
    const config: any = { baseURL };
    if (apiKey) config.apiKey = apiKey;
    const deepseek = createDeepSeek(config);
    return deepseek(model, settings);
  } else if (provider === "xai") {
    const { createXai } = await import("@ai-sdk/xai");
    const config: any = { baseURL };
    if (apiKey) config.apiKey = apiKey;
    const xai = createXai(config);
    return xai(model, settings);
  } else if (provider === "mistral") {
    const { createMistral } = await import("@ai-sdk/mistral");
    const config: any = { baseURL };
    if (apiKey) config.apiKey = apiKey;
    const mistral = createMistral(config);
    return mistral(model, settings);
  } else if (provider === "azure") {
    const { createAzure } = await import("@ai-sdk/azure");
    const azureOptions: AzureOpenAIProviderSettings = {};
    if (auth) {
      if (auth["resourceName"]) azureOptions.resourceName = auth["resourceName"];
      if (auth["apiKey"]) azureOptions.apiKey = auth["apiKey"];
      if (auth["apiVersion"]) azureOptions.apiVersion = auth["apiVersion"];
    }
    if (baseURL) {
      azureOptions.baseURL = baseURL;
      if (apiKey) azureOptions.apiKey = apiKey;
    }
    const azure = createAzure(azureOptions);
    return azure(model, settings);
  } else if (provider === "openrouter") {
    const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
    const config: any = { baseURL };
    if (apiKey) config.apiKey = apiKey;
    const openrouter = createOpenRouter(config);
    return openrouter(model, settings);
  } else if (provider === "openaicompatible") {
    const { createOpenAICompatible } = await import("@ai-sdk/openai-compatible");
    const config: any = { name: "openaicompatible", baseURL };
    if (apiKey) config.apiKey = apiKey;
    const openaicompatible = createOpenAICompatible(config);
    return openaicompatible(model, settings);
  } else if (provider === "pollinations") {
    const { createOpenAICompatible } = await import("@ai-sdk/openai-compatible");
    const config: any = { name: "pollinations", baseURL };
    if (apiKey) config.apiKey = apiKey;
    const pollinations = createOpenAICompatible(config);
    return pollinations(model, settings);
  } else if (provider === "ollama") {
    const { createOllama } = await import("ollama-ai-provider");
    const local = global.location || {};
    const config: any = {
      baseURL,
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = (init?.headers || {}) as Record<string, string>;
        if (!baseURL?.startsWith(local.origin)) delete headers["Authorization"];
        return await fetch(input, {
          ...init,
          headers,
          credentials: "omit",
        });
      },
    };
    if (headers) config.headers = headers;
    const ollama = createOllama(config);
    return ollama(model, settings);
  } else {
    throw new Error(`Unsupported Provider: ${provider}`);
  }
}
