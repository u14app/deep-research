import { type NextRequest, NextResponse } from "next/server";
import { FIRECRAWL_BASE_URL } from "@/constants/urls";

export const runtime = "edge";
export const preferredRegion = ["cle1", "iad1", "pdx1", "sfo1", "sin1", "syd1", "hnd1", "kix1"];

const API_PROXY_BASE_URL = process.env["FIRECRAWL_API_BASE_URL"] || FIRECRAWL_BASE_URL;

export async function POST(req: NextRequest) {
  const body = await req.json();
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
        Authorization: req.headers.get("Authorization") || "",
      },
      body: JSON.stringify(body),
    };
    const response = await fetch(url, payload);
    return new NextResponse(response.body, response);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return NextResponse.json({ code: 500, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ code: 500, message: "Unknown error occurred" }, { status: 500 });
  }
}
