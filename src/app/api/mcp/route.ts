import { type NextRequest, NextResponse } from "next/server";
import type { Transport } from "@/libs/mcp-server/shared/transport";
import { StreamableHTTPServerTransport } from "@/libs/mcp-server/streamableHttp";
import { initMcpServer } from "./server";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const preferredRegion = ["cle1", "iad1", "pdx1", "sfo1", "sin1", "syd1", "hnd1", "kix1"];

export async function POST(req: NextRequest) {
  try {
    const server = initMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    transport.onclose = () => {
      transport.close();
      server.close();
    };

    transport.onerror = (err) => {
      return NextResponse.json({ code: 500, message: err.message }, { status: 500 });
    };

    await server.connect(transport as Transport);
    const response = await transport.handleRequest(req);
    return new NextResponse(response.body, response);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return NextResponse.json({ code: 500, message: error.message }, { status: 500 });
    }
    // Fallback for non-Error instances
    return NextResponse.json({ code: 500, message: "Unknown error occurred" }, { status: 500 });
  }
}
