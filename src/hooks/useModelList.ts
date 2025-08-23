import { useEffect, useState } from "react";
import {
  ANTHROPIC_BASE_URL,
  DEEPSEEK_BASE_URL,
  GEMINI_BASE_URL,
  MISTRAL_BASE_URL,
  OLLAMA_BASE_URL,
  OPENAI_BASE_URL,
  OPENROUTER_BASE_URL,
  POLLINATIONS_BASE_URL,
  XAI_BASE_URL,
} from "@/constants/urls";
import { useSettingStore } from "@/store/setting";
import { multiApiKeyPolling } from "@/utils/model";
import { generateSignature } from "@/utils/signature";
import { completePath } from "@/utils/url";

interface GeminiModel {
  name: string;
  description: string;
  displayName: string;
  inputTokenLimit: number;
  maxTemperature?: number;
  outputTokenLimit: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  supportedGenerationMethods: string[];
  version: string;
}

interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
    input_cache_read: string;
    input_cache_write: string;
    web_search: string;
    internal_reasoning: string;
  };
  per_request_limits: Record<string, string> | null;
}

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface AnthropicModel {
  id: string;
  display_name: string;
  type: string;
  created_at: string;
}

interface MistralModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  capabilities: {
    completion_chat: boolean;
    completion_fim: boolean;
    function_calling: boolean;
    fine_tuning: boolean;
    vision: boolean;
    classification: boolean;
  };
  name: string;
  description: string;
  max_context_length: number;
  aliases: string[];
  default_model_temperature: number;
  type: string;
}

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format?: string;
    family?: string;
    families?: string | null;
    parameter_size?: string;
    quantization_level?: string;
  };
}

function useModelList() {
  const [modelList, setModelList] = useState<string[]>([]);
  const { mode } = useSettingStore.getState();

  useEffect(() => {
    setModelList([]);
  }, []);

  async function refresh(provider: string): Promise<string[]> {
    const { accessPassword } = useSettingStore.getState();
    const accessKey = generateSignature(accessPassword, Date.now());

    if (provider === "google") {
      const { apiKey = "", apiProxy } = useSettingStore.getState();
      if (mode === "local" && !apiKey) {
        return [];
      }
      const key = multiApiKeyPolling(apiKey);
      const response = await fetch(
        mode === "local"
          ? `${completePath(apiProxy || GEMINI_BASE_URL, "/v1beta")}/models`
          : "/api/ai/google/v1beta/models",
        {
          headers: {
            "x-goog-api-key": mode === "local" ? key : accessKey,
          },
        }
      );
      const { models = [] } = await response.json();
      const newModelList = (models as GeminiModel[])
        .filter(
          (item) =>
            item.name.startsWith("models/gemini") &&
            item.supportedGenerationMethods.includes("generateContent")
        )
        .map((item) => item.name.replace("models/", ""));
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "openrouter") {
      const { openRouterApiKey = "", openRouterApiProxy } = useSettingStore.getState();
      if (mode === "local" && !openRouterApiKey) {
        return [];
      }
      const apiKey = multiApiKeyPolling(openRouterApiKey);
      const response = await fetch(
        mode === "local"
          ? `${completePath(openRouterApiProxy || OPENROUTER_BASE_URL, "/api/v1")}/models`
          : "/api/ai/openrouter/v1/models",
        {
          headers: {
            authorization: `Bearer ${mode === "local" ? apiKey : accessKey}`,
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as OpenRouterModel[]).map((item) => item.id);
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "openai") {
      const { openAIApiKey = "", openAIApiProxy } = useSettingStore.getState();
      if (mode === "local" && !openAIApiKey) {
        return [];
      }
      const apiKey = multiApiKeyPolling(openAIApiKey);
      const response = await fetch(
        mode === "local"
          ? `${completePath(openAIApiProxy || OPENAI_BASE_URL, "/v1")}/models`
          : "/api/ai/openai/v1/models",
        {
          headers: {
            authorization: `Bearer ${mode === "local" ? apiKey : accessKey}`,
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as OpenAIModel[])
        .map((item) => item.id)
        .filter(
          (id) =>
            !(
              id.startsWith("text") ||
              id.startsWith("tts") ||
              id.startsWith("whisper") ||
              id.startsWith("dall-e")
            )
        );
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "anthropic") {
      const { anthropicApiKey = "", anthropicApiProxy } = useSettingStore.getState();
      if (mode === "local" && !anthropicApiKey) {
        return [];
      }
      const apiKey = multiApiKeyPolling(anthropicApiKey);
      const response = await fetch(
        mode === "local"
          ? `${completePath(anthropicApiProxy || ANTHROPIC_BASE_URL, "/v1")}/models`
          : "/api/ai/anthropic/v1/models",
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": mode === "local" ? apiKey : accessKey,
            "Anthropic-Version": "2023-06-01",
            // Avoid cors error
            "anthropic-dangerous-direct-browser-access": "true",
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as AnthropicModel[]).map((item) => item.id);
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "deepseek") {
      const { deepseekApiKey = "", deepseekApiProxy } = useSettingStore.getState();
      if (mode === "local" && !deepseekApiKey) {
        return [];
      }
      const apiKey = multiApiKeyPolling(deepseekApiKey);
      const response = await fetch(
        mode === "local"
          ? `${completePath(deepseekApiProxy || DEEPSEEK_BASE_URL, "/v1")}/models`
          : "/api/ai/deepseek/v1/models",
        {
          headers: {
            authorization: `Bearer ${mode === "local" ? apiKey : accessKey}`,
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as OpenAIModel[]).map((item) => item.id);
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "xai") {
      const { xAIApiKey = "", xAIApiProxy } = useSettingStore.getState();
      if (mode === "local" && !xAIApiKey) {
        return [];
      }
      const apiKey = multiApiKeyPolling(xAIApiKey);
      const response = await fetch(
        mode === "local"
          ? `${completePath(xAIApiProxy || XAI_BASE_URL, "/v1")}/models`
          : "/api/ai/xai/v1/models",
        {
          headers: {
            authorization: `Bearer ${mode === "local" ? apiKey : accessKey}`,
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as OpenAIModel[])
        .map((item) => item.id)
        .filter((id) => !id.includes("image"));
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "mistral") {
      const { mistralApiKey = "", mistralApiProxy } = useSettingStore.getState();
      if (mode === "local" && !mistralApiKey) {
        return [];
      }
      const apiKey = multiApiKeyPolling(mistralApiKey);
      const response = await fetch(
        mode === "local"
          ? `${completePath(mistralApiProxy || MISTRAL_BASE_URL, "/v1")}/models`
          : "/api/ai/mistral/v1/models",
        {
          headers: {
            authorization: `Bearer ${mode === "local" ? apiKey : accessKey}`,
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as MistralModel[])
        .filter((item) => item.capabilities.completion_chat)
        .map((item) => item.id);
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "openaicompatible") {
      const { openAICompatibleApiKey = "", openAICompatibleApiProxy } = useSettingStore.getState();
      if (mode === "local" && !openAICompatibleApiKey) {
        return [];
      }
      const apiKey = multiApiKeyPolling(openAICompatibleApiKey);
      const response = await fetch(
        mode === "local"
          ? `${completePath(openAICompatibleApiProxy, "/v1")}/models`
          : "/api/ai/openaicompatible/v1/models",
        {
          headers: {
            authorization: `Bearer ${mode === "local" ? apiKey : accessKey}`,
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as OpenAIModel[]).map((item) => item.id);
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "pollinations") {
      const { pollinationsApiProxy } = useSettingStore.getState();
      const headers = new Headers();
      if (mode === "proxy") headers.set("Authorization", `Bearer ${accessKey}`);
      const response = await fetch(
        mode === "proxy"
          ? "/api/ai/pollinations/models"
          : `${completePath(pollinationsApiProxy || POLLINATIONS_BASE_URL)}/models`,
        {
          headers,
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as OpenAIModel[])
        .map((item) => item.id)
        .filter((name) => !name.includes("audio"));
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "ollama") {
      const { ollamaApiProxy } = useSettingStore.getState();
      const headers = new Headers();
      if (mode === "proxy") headers.set("Authorization", `Bearer ${accessKey}`);
      const response = await fetch(
        mode === "proxy"
          ? "/api/ai/ollama/api/tags"
          : `${completePath(ollamaApiProxy || OLLAMA_BASE_URL, "/api")}/tags`,
        {
          headers,
        }
      );
      const { models = [] } = await response.json();
      const newModelList = (models as OllamaModel[]).map((item) => item.name);
      setModelList(newModelList);
      return newModelList;
    } else {
      return [];
    }
  }
  return {
    modelList,
    refresh,
  };
}

export default useModelList;
