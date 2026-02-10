import { NextResponse, type NextRequest } from "next/server";
import DeepResearch from "@/utils/deep-research";
import { multiApiKeyPolling } from "@/utils/model";
import { parseDeepResearchPromptOverrides } from "@/constants/prompts";
import {
  getAIProviderBaseURL,
  getAIProviderApiKey,
  getSearchProviderBaseURL,
  getSearchProviderApiKey,
} from "../../utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const preferredRegion = [
  "cle1",
  "iad1",
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
  "hnd1",
  "kix1",
];

export async function GET(req: NextRequest) {
  function getValueFromSearchParams(key: string) {
    return req.nextUrl.searchParams.get(key);
  }
  const query = getValueFromSearchParams("query") || "";
  const provider = getValueFromSearchParams("provider") || "";
  const thinkingModel = getValueFromSearchParams("thinkingModel") || "";
  const taskModel = getValueFromSearchParams("taskModel") || "";
  const searchProvider = getValueFromSearchParams("searchProvider") || "";
  const language = getValueFromSearchParams("language") || "";
  const maxResult = Number(getValueFromSearchParams("maxResult")) || 5;
  const enableCitationImage =
    getValueFromSearchParams("enableCitationImage") === "false";
  const enableReferences =
    getValueFromSearchParams("enableReferences") === "false";
  const enableFileFormatResource =
    getValueFromSearchParams("enableFileFormatResource") === "true";
  let promptOverrides = {};
  try {
    promptOverrides = parseDeepResearchPromptOverrides(
      getValueFromSearchParams("promptOverrides") || ""
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid prompt overrides";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    start: async (controller) => {
      console.log("Client connected");

      req.signal.addEventListener("abort", () => {
        console.log("Client disconnected");
      });

      const deepResearch = new DeepResearch({
        language,
        AIProvider: {
          baseURL: getAIProviderBaseURL(provider),
          apiKey: multiApiKeyPolling(getAIProviderApiKey(provider)),
          provider,
          thinkingModel,
          taskModel,
        },
        searchProvider: {
          baseURL: getSearchProviderBaseURL(searchProvider),
          apiKey: multiApiKeyPolling(getSearchProviderApiKey(searchProvider)),
          provider: searchProvider,
          maxResult,
        },
        promptOverrides,
        onMessage: (event, data) => {
          if (event === "message") {
            controller.enqueue(encoder.encode(data.text));
          } else if (event === "progress") {
            console.log(
              `[${data.step}]: ${data.name ? `"${data.name}" ` : ""}${
                data.status
              }`
            );
            if (data.step === "final-report" && data.status === "end") {
              controller.close();
            }
          } else if (event === "error") {
            console.error(data);
            controller.close();
          }
        },
      });

      req.signal.addEventListener("abort", () => {
        controller.close();
      });

      try {
        await deepResearch.start(
          query,
          enableCitationImage,
          enableReferences,
          enableFileFormatResource
        );
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Unknown error");
      }
      controller.close();
    },
  });

  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
