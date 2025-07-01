import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SettingStore {
  provider: string;
  mode: string;
  apiKey: string;
  apiProxy: string;
  openRouterApiKey: string;
  openRouterApiProxy: string;
  openRouterThinkingModel: string;
  openRouterNetworkingModel: string;
  openAIApiKey: string;
  openAIApiProxy: string;
  openAIThinkingModel: string;
  openAINetworkingModel: string;
  anthropicApiKey: string;
  anthropicApiProxy: string;
  anthropicThinkingModel: string;
  anthropicNetworkingModel: string;
  deepseekApiKey: string;
  deepseekApiProxy: string;
  deepseekThinkingModel: string;
  deepseekNetworkingModel: string;
  xAIApiKey: string;
  xAIApiProxy: string;
  xAIThinkingModel: string;
  xAINetworkingModel: string;
  mistralApiKey: string;
  mistralApiProxy: string;
  mistralThinkingModel: string;
  mistralNetworkingModel: string;
  azureApiKey: string;
  azureResourceName: string;
  azureApiVersion: string;
  azureThinkingModel: string;
  azureNetworkingModel: string;
  openAICompatibleApiKey: string;
  openAICompatibleApiProxy: string;
  openAICompatibleThinkingModel: string;
  openAICompatibleNetworkingModel: string;
  pollinationsApiProxy: string;
  pollinationsThinkingModel: string;
  pollinationsNetworkingModel: string;
  ollamaApiProxy: string;
  ollamaThinkingModel: string;
  ollamaNetworkingModel: string;
  accessPassword: string;
  thinkingModel: string;
  networkingModel: string;
  enableSearch: string;
  searchProvider: string;
  tavilyApiKey: string;
  tavilyApiProxy: string;
  tavilyScope: string;
  firecrawlApiKey: string;
  firecrawlApiProxy: string;
  exaApiKey: string;
  exaApiProxy: string;
  exaScope: string;
  bochaApiKey: string;
  bochaApiProxy: string;
  searxngApiProxy: string;
  searxngScope: string;
  parallelSearch: number;
  searchMaxResult: number;
  crawler: string;
  language: string;
  theme: string;
  debug: string;
  references: string;
  citationImage: string;
  smoothTextStreamType: "character" | "word" | "line";
  onlyUseLocalResource: boolean;
}

interface SettingFunction {
  update: (values: Partial<SettingStore>) => void;
  reset: () => void;
}

export const defaultValues: SettingStore = {
  provider: "google",
  mode: "",
  apiKey: "",
  apiProxy: "",
  thinkingModel: "gemini-2.0-flash-thinking-exp",
  networkingModel: "gemini-2.0-flash-exp",
  openRouterApiKey: "",
  openRouterApiProxy: "",
  openRouterThinkingModel: "",
  openRouterNetworkingModel: "",
  openAIApiKey: "",
  openAIApiProxy: "",
  openAIThinkingModel: "gpt-4o",
  openAINetworkingModel: "gpt-4o-mini",
  anthropicApiKey: "",
  anthropicApiProxy: "",
  anthropicThinkingModel: "",
  anthropicNetworkingModel: "",
  deepseekApiKey: "",
  deepseekApiProxy: "",
  deepseekThinkingModel: "deepseek-reasoner",
  deepseekNetworkingModel: "deepseek-chat",
  xAIApiKey: "",
  xAIApiProxy: "",
  xAIThinkingModel: "",
  xAINetworkingModel: "",
  mistralApiKey: "",
  mistralApiProxy: "",
  mistralThinkingModel: "mistral-large-latest",
  mistralNetworkingModel: "mistral-medium-latest",
  azureApiKey: "",
  azureResourceName: "",
  azureApiVersion: "",
  azureThinkingModel: "",
  azureNetworkingModel: "",
  openAICompatibleApiKey: "",
  openAICompatibleApiProxy: "",
  openAICompatibleThinkingModel: "",
  openAICompatibleNetworkingModel: "",
  pollinationsApiProxy: "",
  pollinationsThinkingModel: "",
  pollinationsNetworkingModel: "",
  ollamaApiProxy: "",
  ollamaThinkingModel: "",
  ollamaNetworkingModel: "",
  accessPassword: "",
  enableSearch: "1",
  searchProvider: "model",
  tavilyApiKey: "",
  tavilyApiProxy: "",
  tavilyScope: "general",
  firecrawlApiKey: "",
  firecrawlApiProxy: "",
  exaApiKey: "",
  exaApiProxy: "",
  exaScope: "research paper",
  bochaApiKey: "",
  bochaApiProxy: "",
  searxngApiProxy: "",
  searxngScope: "all",
  parallelSearch: 1,
  searchMaxResult: 5,
  crawler: "jina",
  language: "",
  theme: "system",
  debug: "disable",
  references: "enable",
  citationImage: "enable",
  smoothTextStreamType: "word",
  onlyUseLocalResource: false,
};

export const useSettingStore = create(
  persist<SettingStore & SettingFunction>(
    (set) => ({
      ...defaultValues,
      update: (values) => set(values),
      reset: () => set(defaultValues),
    }),
    { name: "setting" }
  )
);
