import { NextResponse, type NextRequest } from "next/server";
import { GEMINI_BASE_URL } from "@/constants/urls";

export const runtime = "edge";
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

// Mod AI Studio uses NewAPI.ai service which is Gemini-compatible
const API_PROXY_BASE_URL =
  process.env.MODAI_API_BASE_URL || GEMINI_BASE_URL;

async function handler(req: NextRequest) {
  let body;
  if (req.method.toUpperCase() !== "GET") {
    body = await req.json();
  }
  const searchParams = req.nextUrl.searchParams;
  const path = searchParams.getAll("slug");
  searchParams.delete("slug");

  // Get the API key from x-goog-api-key header (sent by client)
  const apiKey = req.headers.get("x-goog-api-key") || "";

  // Add the key as a query parameter for NewAPI.ai
  if (apiKey) {
    searchParams.set("key", apiKey);
  }

  const params = searchParams.toString();

  try {
    let url = `${API_PROXY_BASE_URL}/${decodeURIComponent(path.join("/"))}`;
    if (params) url += `?${params}`;

    const payload: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("Content-Type") || "application/json",
        "x-goog-api-client":
          req.headers.get("x-goog-api-client") || "genai-js/0.24.0",
        // Include API key in both header and query param for maximum compatibility
        // NewAPI.ai supports both methods, and some features (like citations) may need header auth
        "x-goog-api-key": apiKey,
      },
    };
    if (body) payload.body = JSON.stringify(body);
    const response = await fetch(url, payload);
    return new NextResponse(response.body, response);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return NextResponse.json(
        { code: 500, message: error.message },
        { status: 500 }
      );
    }
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
