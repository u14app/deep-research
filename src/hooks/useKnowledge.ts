import { streamText, smoothStream } from "ai";
import { Md5 } from "ts-md5";
import { toast } from "sonner";
import useModelProvider from "@/hooks/useAiProvider";
import { useKnowledgeStore } from "@/store/knowledge";
import { useTaskStore } from "@/store/task";
import { useSettingStore } from "@/store/setting";
import { rewritingPrompt } from "@/constants/prompts";
import { jinaReader, localCrawler } from "@/utils/crawler";
import { fileParser } from "@/utils/parser";
import { getTextByteSize } from "@/utils/file";
import {
  splitText,
  containsXmlHtmlTags,
  ThinkTagStreamProcessor,
} from "@/utils/text";
import { parseError } from "@/utils/error";
import { omit } from "radash";

const MAX_CHUNK_LENGTH = 10000;

function smoothTextStream(type: "character" | "word" | "line") {
  return smoothStream({
    chunking: type === "character" ? /./ : type,
    delayInMs: 0,
  });
}

function handleError(error: unknown) {
  const errorMessage = parseError(error);
  toast.error(errorMessage);
}

function useKnowledge() {
  const { smoothTextStreamType } = useSettingStore();
  const { createModelProvider, getModel } = useModelProvider();
  const knowledgeStore = useKnowledgeStore();

  function generateId(
    type: "file" | "url" | "knowledge",
    options?: {
      fileMeta?: FileMeta;
      url?: string;
    }
  ): string {
    if (type === "file" && options && options.fileMeta) {
      const { fileMeta } = options;
      const meta = `${fileMeta.name}::${fileMeta.size}::${fileMeta.type}::${fileMeta.lastModified}`;
      return Md5.hashStr(meta);
    } else if (type === "url" && options && options.url) {
      return Md5.hashStr(
        `${options.url}::${Date.now().toString().substring(0, 8)}`
      );
    } else if (type === "knowledge") {
      return Md5.hashStr(`KNOWLEDGE::${Date.now()}`);
    } else {
      throw new Error("Parameter error");
    }
  }

  async function getKnowledgeFromFile(file: File) {
    const { resources, addResource, updateResource } = useTaskStore.getState();

    const fileMeta: FileMeta = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
    const id = generateId("file", { fileMeta });
    const isExist = resources.find((item) => item.id === id);
    if (isExist) {
      return toast.message(`File already exist: ${file.name}`);
    }

    async function extractText(rid: string, title: string, text: string) {
      const { networkingModel } = getModel();

      let content = "";
      let reasoning = "";
      const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
      const result = streamText({
        model: await createModelProvider(networkingModel),
        prompt: text,
        system: rewritingPrompt,
        onFinish: () => {
          const currentTime = Date.now();
          knowledgeStore.save({
            id: rid,
            title,
            content,
            type: "file",
            fileMeta,
            createdAt: currentTime,
            updatedAt: currentTime,
          });
        },
        experimental_transform: smoothTextStream(smoothTextStreamType),
        onError: (err) => {
          updateResource(id, { status: "failed" });
          handleError(err);
        },
      });
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
          thinkTagStreamProcessor.processChunk(
            part.textDelta,
            (data) => {
              content += data;
            },
            (data) => {
              reasoning += data;
            }
          );
        } else if (part.type === "reasoning") {
          reasoning += part.textDelta;
        }
      }
      if (reasoning) console.log(reasoning);
      return content;
    }

    try {
      if (knowledgeStore.exist(id)) {
        const knowledge = knowledgeStore.get(id);
        if (knowledge) {
          addResource({
            id,
            name: knowledge.title,
            type: knowledge.type,
            size: getTextByteSize(knowledge.content),
            status: "completed",
          });
        }
      } else {
        addResource({
          ...omit(fileMeta, ["lastModified"]),
          id,
          status: "processing",
        });

        const text = await fileParser(file);
        if (text.length > MAX_CHUNK_LENGTH || !file.type.startsWith("text/")) {
          const chunks = splitText(text, MAX_CHUNK_LENGTH);
          for (const idx in chunks) {
            const chunk = chunks[idx];
            const index = Number(idx);
            let rid = id;
            const names = fileMeta.name.split(".");
            const filename = `${names[0]}-${index + 1}.${names[1] || "txt"}`;

            if (index > 0) {
              rid = `${id}_${index}`;
              addResource({
                ...omit(fileMeta, ["lastModified"]),
                id: rid,
                name: filename,
                size: getTextByteSize(chunk),
                status: "processing",
              });
            } else {
              updateResource(rid, {
                name: filename,
                size: getTextByteSize(chunk),
                status: "processing",
              });
            }

            let content = "";
            if (containsXmlHtmlTags(chunk)) {
              content = await extractText(rid, filename, chunk);
            } else {
              content = chunk;
              // Save to knowledge store for non-XML/HTML content
              const currentTime = Date.now();
              knowledgeStore.save({
                id: rid,
                title: filename,
                content,
                type: "file",
                fileMeta,
                createdAt: currentTime,
                updatedAt: currentTime,
              });
            }
            updateResource(rid, {
              name: filename,
              size: getTextByteSize(content),
              status: "completed",
            });
          }
        } else {
          knowledgeStore.save({
            id,
            title: fileMeta.name,
            content: text,
            type: "file",
            fileMeta,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          updateResource(id, {
            size: getTextByteSize(text),
            status: "completed",
          });
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        updateResource(id, { status: "failed" });
        toast.error(err.message);
      } else {
        toast.error("File parsing failed");
      }
    }
  }

  async function getKnowledgeFromUrl(url: string, crawler: string) {
    const knowledgeStore = useKnowledgeStore.getState();
    const { resources, addResource, updateResource } = useTaskStore.getState();

    const id = generateId("url", { url });
    const isExist = resources.find((item) => item.id === id);
    if (isExist) {
      return toast.message(`Url already loaded: ${url}`);
    }
    try {
      if (knowledgeStore.exist(id)) {
        const knowledge = knowledgeStore.get(id);
        if (knowledge) {
          addResource({
            id,
            name: url,
            type: "url",
            size: getTextByteSize(knowledge.content),
            status: "completed",
          });
        }
      } else {
        addResource({
          id,
          name: url,
          type: "url",
          size: 0,
          status: "processing",
        });
        if (crawler === "jina") {
          const result = await jinaReader(url);
          const currentTime = Date.now();
          knowledgeStore.save({
            id,
            title: result.title,
            content: result.content,
            type: "url",
            url,
            createdAt: currentTime,
            updatedAt: currentTime,
          });
          updateResource(id, {
            size: getTextByteSize(result.content),
            status: "completed",
          });
        } else if (crawler === "local") {
          const { networkingModel } = getModel();
          const { accessPassword } = useSettingStore.getState();
          const result = await localCrawler(url, accessPassword);
          let content = "";
          const stream = streamText({
            model: await createModelProvider(networkingModel),
            prompt: result.content,
            system: rewritingPrompt,
            onFinish: () => {
              const currentTime = Date.now();
              knowledgeStore.save({
                id,
                title: result.title,
                content,
                type: "url",
                url,
                createdAt: currentTime,
                updatedAt: currentTime,
              });
            },
            experimental_transform: smoothTextStream(smoothTextStreamType),
            onError: (err) => {
              updateResource(id, { status: "failed" });
              handleError(err);
            },
          });
          for await (const textPart of stream.textStream) {
            content += textPart;
          }
          updateResource(id, {
            size: getTextByteSize(content),
            status: "completed",
          });
        } else {
          throw new Error(`Unknown crawler: ${crawler}`);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        updateResource(id, { status: "failed" });
        return toast.error(err.message);
      } else {
        toast.error("Url parsing failed");
      }
    }
  }

  return {
    generateId,
    getKnowledgeFromFile,
    getKnowledgeFromUrl,
  };
}

export default useKnowledge;
