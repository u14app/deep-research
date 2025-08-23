import { type NextRequest, NextResponse } from "next/server";
import { getCustomModelList, multiApiKeyPolling } from "@/utils/model";
import { verifySignature } from "@/utils/signature";
import { generateAuthToken } from "@/utils/vertexAuth";

const NODE_ENV = process.env.NODE_ENV;
const accessPassword = process.env["ACCESS_PASSWORD"] || "";
// AI provider API key
const GOOGLE_GENERATIVE_AI_API_KEY = process.env["GOOGLE_GENERATIVE_AI_API_KEY"] || "";
const OPENROUTER_API_KEY = process.env["OPENROUTER_API_KEY"] || "";
const OPENAI_API_KEY = process.env["OPENAI_API_KEY"] || "";
const ANTHROPIC_API_KEY = process.env["ANTHROPIC_API_KEY"] || "";
const DEEPSEEK_API_KEY = process.env["DEEPSEEK_API_KEY"] || "";
const XAI_API_KEY = process.env["XAI_API_KEY"] || "";
const MISTRAL_API_KEY = process.env["MISTRAL_API_KEY"] || "";
const AZURE_API_KEY = process.env["AZURE_API_KEY"] || "";
const GOOGLE_CLIENT_EMAIL = process.env["GOOGLE_CLIENT_EMAIL"] || "";
const GOOGLE_PRIVATE_KEY = process.env["GOOGLE_PRIVATE_KEY"] || "";
const GOOGLE_PRIVATE_KEY_ID = process.env["GOOGLE_PRIVATE_KEY_ID"] || "";
const OPENAI_COMPATIBLE_API_KEY = process.env["OPENAI_COMPATIBLE_API_KEY"] || "";
// Search provider API key
const TAVILY_API_KEY = process.env["TAVILY_API_KEY"] || "";
const FIRECRAWL_API_KEY = process.env["FIRECRAWL_API_KEY"] || "";
const EXA_API_KEY = process.env["EXA_API_KEY"] || "";
const BOCHA_API_KEY = process.env["BOCHA_API_KEY"] || "";
// Disabled Provider
const DISABLED_AI_PROVIDER = process.env["NEXT_PUBLIC_DISABLED_AI_PROVIDER"] || "";
const DISABLED_SEARCH_PROVIDER = process.env["NEXT_PUBLIC_DISABLED_SEARCH_PROVIDER"] || "";
const MODEL_LIST = process.env["NEXT_PUBLIC_MODEL_LIST"] || "";

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: "/api/:path*",
};

const ERRORS = {
  NO_PERMISSIONS: {
    code: 403,
    message: "No permissions",
    status: "FORBIDDEN",
  },
  NO_API_KEY: {
    code: 500,
    message: "The server does not have an API key.",
    status: "Internal Server Error",
  },
};

export async function middleware(request: NextRequest) {
  if (NODE_ENV === "production") console.debug(request);

  const disabledAIProviders =
    DISABLED_AI_PROVIDER.length > 0 ? DISABLED_AI_PROVIDER.split(",") : [];
  const disabledSearchProviders =
    DISABLED_SEARCH_PROVIDER.length > 0 ? DISABLED_SEARCH_PROVIDER.split(",") : [];

  const hasDisabledGeminiModel = () => {
    if (request.method.toUpperCase() === "GET") return false;
    const { availableModelList, disabledModelList } = getCustomModelList(
      MODEL_LIST.length > 0 ? MODEL_LIST.split(",") : []
    );
    const isAvailableModel = availableModelList.some((availableModel) =>
      request.nextUrl.pathname.includes(`models/${availableModel}:`)
    );
    if (isAvailableModel) return false;
    if (disabledModelList.includes("all")) return true;
    return disabledModelList.some((disabledModel) =>
      request.nextUrl.pathname.includes(`models/${disabledModel}:`)
    );
  };
  const hasDisabledAIModel = async () => {
    if (request.method.toUpperCase() === "GET") return false;
    const { model = "" } = await request.json();
    const { availableModelList, disabledModelList } = getCustomModelList(
      MODEL_LIST.length > 0 ? MODEL_LIST.split(",") : []
    );
    const isAvailableModel = availableModelList.some((availableModel) => availableModel === model);
    if (isAvailableModel) return false;
    if (disabledModelList.includes("all")) return true;
    return disabledModelList.some((disabledModel) => disabledModel === model);
  };

  if (request.nextUrl.pathname.startsWith("/api/ai/google")) {
    const authorization = request.headers.get("x-goog-api-key") || "";
    const isDisabledGeminiModel = hasDisabledGeminiModel();
    if (
      !verifySignature(authorization, accessPassword, Date.now()) ||
      disabledAIProviders.includes("google") ||
      isDisabledGeminiModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(GOOGLE_GENERATIVE_AI_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set(
          "x-goog-api-client",
          request.headers.get("x-goog-api-client") || "genai-js/0.24.0"
        );
        requestHeaders.set("x-goog-api-key", apiKey);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/openrouter")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = await hasDisabledAIModel();
    if (
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledAIProviders.includes("openrouter") ||
      isDisabledModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(OPENROUTER_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/openaicompatible")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = await hasDisabledAIModel();
    if (
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledAIProviders.includes("openaicompatible") ||
      isDisabledModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(OPENAI_COMPATIBLE_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/openai")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = await hasDisabledAIModel();
    if (
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledAIProviders.includes("openai") ||
      isDisabledModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(OPENAI_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/anthropic")) {
    const authorization = request.headers.get("x-api-key") || "";
    const isDisabledModel = await hasDisabledAIModel();
    if (
      !verifySignature(authorization, accessPassword, Date.now()) ||
      disabledAIProviders.includes("anthropic") ||
      isDisabledModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(ANTHROPIC_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("x-api-key", apiKey);
        requestHeaders.set(
          "anthropic-version",
          request.headers.get("anthropic-version") || "2023-06-01"
        );
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/deepseek")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = await hasDisabledAIModel();
    if (
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledAIProviders.includes("deepseek") ||
      isDisabledModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(DEEPSEEK_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/xai")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = await hasDisabledAIModel();
    if (
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledAIProviders.includes("xai") ||
      isDisabledModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(XAI_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/mistral")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = await hasDisabledAIModel();
    if (
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledAIProviders.includes("mistral") ||
      isDisabledModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(MISTRAL_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/azure")) {
    const authorization = request.headers.get("api-key") || "";
    const isDisabledModel = await hasDisabledAIModel();
    if (
      !verifySignature(authorization, accessPassword, Date.now()) ||
      disabledAIProviders.includes("azure") ||
      isDisabledModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(AZURE_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("api-key", apiKey);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/google-vertex")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = await hasDisabledAIModel();
    if (
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledAIProviders.includes("google-vertex") ||
      isDisabledModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = await generateAuthToken({
        clientEmail: GOOGLE_CLIENT_EMAIL,
        privateKey: GOOGLE_PRIVATE_KEY,
        privateKeyId: GOOGLE_PRIVATE_KEY_ID,
      });

      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  // The pollinations model only verifies access to the backend API
  if (request.nextUrl.pathname.startsWith("/api/ai/pollinations")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = await hasDisabledAIModel();
    if (
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledAIProviders.includes("pollinations") ||
      isDisabledModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const requestHeaders = new Headers();
      requestHeaders.set("Content-Type", request.headers.get("Content-Type") || "application/json");
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  // The ollama model only verifies access to the backend API
  if (request.nextUrl.pathname.startsWith("/api/ai/ollama")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = await hasDisabledAIModel();
    if (
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledAIProviders.includes("ollama") ||
      isDisabledModel
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const requestHeaders = new Headers();
      requestHeaders.set("Content-Type", request.headers.get("Content-Type") || "application/json");
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/tavily")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledSearchProviders.includes("tavily")
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(TAVILY_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/firecrawl")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledSearchProviders.includes("firecrawl")
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(FIRECRAWL_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/exa")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledSearchProviders.includes("exa")
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(EXA_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/bocha")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledSearchProviders.includes("bocha")
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const apiKey = multiApiKeyPolling(BOCHA_API_KEY);
      if (apiKey) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/searxng")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(authorization.substring(7), accessPassword, Date.now()) ||
      disabledSearchProviders.includes("searxng")
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const requestHeaders = new Headers();
      requestHeaders.set("Content-Type", request.headers.get("Content-Type") || "application/json");
      requestHeaders.delete("Authorization");
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/crawler")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(authorization.substring(7), accessPassword, Date.now())
    ) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const requestHeaders = new Headers();
      requestHeaders.set("Content-Type", request.headers.get("Content-Type") || "application/json");
      requestHeaders.delete("Authorization");
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/sse")) {
    let authorization = request.headers.get("authorization") || "";
    if (authorization !== "") {
      authorization = authorization.substring(7);
    } else if (request.method.toUpperCase() === "GET") {
      authorization = request.nextUrl.searchParams.get("password") || "";
    }
    if (authorization !== accessPassword) {
      return NextResponse.json({ error: ERRORS.NO_PERMISSIONS }, { status: 403 });
    } else {
      const requestHeaders = new Headers();
      requestHeaders.set("Content-Type", request.headers.get("Content-Type") || "application/json");
      requestHeaders.delete("Authorization");
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/mcp")) {
    const authorization = request.headers.get("authorization") || "";
    if (authorization.substring(7) !== accessPassword) {
      const responseHeaders = new Headers();
      responseHeaders.set("WWW-Authenticate", ERRORS.NO_PERMISSIONS.message);
      return NextResponse.json(
        {
          error: 401,
          error_description: ERRORS.NO_PERMISSIONS.message,
          error_uri: request.nextUrl,
        },
        { headers: responseHeaders, status: 401 }
      );
    } else {
      const requestHeaders = new Headers();
      requestHeaders.set("Content-Type", request.headers.get("Content-Type") || "application/json");
      requestHeaders.delete("Authorization");
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  return NextResponse.next();
}
