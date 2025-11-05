import { shuffle } from "radash";

export function multiApiKeyPolling(apiKeys = "") {
  return shuffle(apiKeys.split(","))[0];
}

export function isThinkingModel(model: string) {
  return (
    model.includes("thinking") ||
    model.startsWith("gemini-2.5-pro") ||
    model.startsWith("gemini-2.5-flash")
  );
}

export function isNetworkingModel(model: string) {
  return (
    (model.startsWith("gemini-2.0-flash") &&
      !model.includes("lite") &&
      !model.includes("thinking") &&
      !model.includes("image")) ||
    model.startsWith("gemini-2.5-pro") ||
    model.startsWith("gemini-2.5-flash")
  );
}

export function isOpenRouterFreeModel(model: string) {
  return model.endsWith(":free");
}

export function filterThinkingModelList(modelList: string[]) {
  const thinkingModelList: string[] = [];
  const nonThinkingModelList: string[] = [];
  modelList.forEach((model) => {
    if (isThinkingModel(model)) {
      thinkingModelList.push(model);
    } else {
      nonThinkingModelList.push(model);
    }
  });
  return [thinkingModelList, nonThinkingModelList];
}

export function filterNetworkingModelList(modelList: string[]) {
  const networkingModelList: string[] = [];
  const nonNetworkingModelList: string[] = [];
  modelList.filter((model) => {
    if (isNetworkingModel(model)) {
      networkingModelList.push(model);
    } else {
      nonNetworkingModelList.push(model);
    }
  });
  return [networkingModelList, nonNetworkingModelList];
}

export function filterOpenRouterModelList(modelList: string[]) {
  const freeModelList: string[] = [];
  const paidModelList: string[] = [];
  modelList.filter((model) => {
    if (isOpenRouterFreeModel(model)) {
      freeModelList.push(model);
    } else {
      paidModelList.push(model);
    }
  });
  return [freeModelList, paidModelList];
}

export function filterDeepSeekModelList(modelList: string[]) {
  const thinkingModelList: string[] = [];
  const nonThinkingModelList: string[] = [];
  modelList.filter((model) => {
    if (model.includes("reasoner")) {
      thinkingModelList.push(model);
    } else {
      nonThinkingModelList.push(model);
    }
  });
  return [thinkingModelList, nonThinkingModelList];
}

export function filterOpenAIModelList(modelList: string[]) {
  const networkingModelList: string[] = [];
  const nonNetworkingModelList: string[] = [];
  modelList.filter((model) => {
    if (
      model.startsWith("gpt-4o") ||
      model.startsWith("gpt-4.1") ||
      model.startsWith("gpt-5") ||
      !model.includes("nano")
    ) {
      networkingModelList.push(model);
    } else {
      nonNetworkingModelList.push(model);
    }
  });
  return [networkingModelList, nonNetworkingModelList];
}

export function filterPollinationsModelList(modelList: string[]) {
  const recommendModelList: string[] = [];
  const normalModelList: string[] = [];
  modelList.filter((model) => {
    if (
      model.startsWith("openai") ||
      model.startsWith("deepseek") ||
      model.startsWith("searchgpt")
    ) {
      recommendModelList.push(model);
    } else {
      normalModelList.push(model);
    }
  });
  return [recommendModelList, normalModelList];
}

export function filterMistralModelList(modelList: string[]) {
  const recommendModelList: string[] = [];
  const normalModelList: string[] = [];
  modelList.filter((model) => {
    if (model.includes("large-latest") || model.includes("medium-latest")) {
      recommendModelList.push(model);
    } else {
      normalModelList.push(model);
    }
  });
  return [recommendModelList, normalModelList];
}

export function getCustomModelList(customModelList: string[]) {
  const availableModelList: string[] = [];
  const disabledModelList: string[] = [];
  customModelList.forEach((model) => {
    if (model.startsWith("+")) {
      availableModelList.push(model.substring(1));
    } else if (model.startsWith("-")) {
      disabledModelList.push(model.substring(1));
    } else {
      availableModelList.push(model);
    }
  });
  return { availableModelList, disabledModelList };
}
