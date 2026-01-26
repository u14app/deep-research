import { NextResponse, type NextRequest } from "next/server";
import { BRAVE_BASE_URL } from "@/constants/urls";

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

const API_PROXY_BASE_URL = process.env.BRAVE_API_BASE_URL || BRAVE_BASE_URL;

export async function POST(req: NextRequest) {
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
        Accept: req.headers.get("Accept") || "application/json",
        "Accept-Encoding": req.headers.get("Accept-Encoding") || "gzip",
        "X-Subscription-Token": req.headers.get("X-Subscription-Token") || "",
      },
    };
    const response = await fetch(url, payload);
    return new NextResponse(response.body, response);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return NextResponse.json(
        { code: 500, message: error.message },
        { status: 500 },
      );
    }
  }
}
