import { type NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const preferredRegion = ["cle1", "iad1", "pdx1", "sfo1", "sin1", "syd1", "hnd1", "kix1"];

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) throw new Error("Missing parameters!");
    const response = await fetch(url, { next: { revalidate: 60 } });
    const result = await response.text();

    const titleRegex = /<title>(.*?)<\/title>/i;
    const titleMatch = result.match(titleRegex);
    const title = titleMatch ? titleMatch[1]?.trim() || "" : "";

    return NextResponse.json({ url, title, content: result });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ code: 500, message }, { status: 500 });
  }
}
