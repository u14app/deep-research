import { type NextRequest, NextResponse } from "next/server";
import { ANTHROPIC_BASE_URL } from "@/constants/urls";

export const runtime = "edge";
export const preferredRegion = ["cle1", "iad1", "pdx1", "sfo1", "sin1", "syd1", "hnd1", "kix1"];

const API_PROXY_BASE_URL = process.env["ANTHROPIC_API_BASE_URL"] || ANTHROPIC_BASE_URL;

async function handler(req: NextRequest) {
  let body;
  if (req.method.toUpperCase() !== "GET") {
    body = await req.json();
  }
  const searchParams = req.nextUrl.searchParams;
  const path = searchParams.getAll("slug");
  searchParams.delete("slug");
  const params = searchParams.toString();

  try {
    let url = `${API_PROXY_BASE_URL}/${decodeURIComponent(path.join("/"))}`;
    if (params) url += `?${params}`;
    const payload: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("Content-Type") || "application/json",
        "x-api-key": req.headers.get("x-api-key") || "",
        "anthropic-version": req.headers.get("anthropic-version") || "2023-06-01",
      },
    };
    if (body) payload.body = JSON.stringify(body);
    const response = await fetch(url, payload);
    return new NextResponse(response.body, response);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ code: 500, message }, { status: 500 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
