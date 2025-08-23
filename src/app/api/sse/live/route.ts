import { type NextRequest, NextResponse } from "next/server";
import DeepResearch from "@/utils/deep-research";
import { multiApiKeyPolling } from "@/utils/model";
import {
  getAIProviderApiKey,
  getAIProviderBaseURL,
  getSearchProviderApiKey,
  getSearchProviderBaseURL,
} from "../../utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const preferredRegion = ["cle1", "iad1", "pdx1", "sfo1", "sin1", "syd1", "hnd1", "kix1"];

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
  const enableCitationImage = getValueFromSearchParams("enableCitationImage") === "false";
  const enableReferences = getValueFromSearchParams("enableReferences") === "false";

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    start: async (controller) => {
      console.log("Client connected");

      req.signal.addEventListener("abort", () => {
        console.log("Client disconnected");
      });

      const aiApiKey = multiApiKeyPolling(getAIProviderApiKey(provider));
      const searchApiKey = multiApiKeyPolling(getSearchProviderApiKey(searchProvider));

      const deepResearch = new DeepResearch({
        ...(language && { language }),
        AIProvider: {
          baseURL: getAIProviderBaseURL(provider),
          ...(aiApiKey && { apiKey: aiApiKey }),
          provider,
          thinkingModel,
          taskModel,
        },
        searchProvider: {
          baseURL: getSearchProviderBaseURL(searchProvider),
          ...(searchApiKey && { apiKey: searchApiKey }),
          provider: searchProvider,
          maxResult,
        },
        onMessage: (event, data) => {
          if (event === "message") {
            controller.enqueue(encoder.encode(data.text));
          } else if (event === "progress") {
            console.log(`[${data.step}]: ${data.name ? `"${data.name}" ` : ""}${data.status}`);
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
        await deepResearch.start(query, enableCitationImage, enableReferences);
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
