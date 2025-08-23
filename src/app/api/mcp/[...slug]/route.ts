import { type NextRequest, NextResponse } from "next/server";
import { SSEServerTransport } from "@/libs/mcp-server/sse";
import { initMcpServer } from "../server";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const preferredRegion = ["cle1", "iad1", "pdx1", "sfo1", "sin1", "syd1", "hnd1", "kix1"];

// In-memory storage for active transport sessions.
// In a production app, consider a more robust distributed cache or state store.
const activeTransports = new Map<string, SSEServerTransport>();

// The API route path clients will POST messages to
const POST_ENDPOINT_PATH = "/api/mcp/sse/messages"; // This must match your POST API route path

export async function GET(): Promise<NextResponse> {
  // Create an MCP server
  const server = initMcpServer();

  // Create a new transport instance for this session
  const transport = new SSEServerTransport({
    endpoint: POST_ENDPOINT_PATH,
  });
  const sessionId = transport.sessionId;

  // Store the transport instance keyed by session ID
  activeTransports.set(sessionId, transport);

  transport.onerror = (error) => {
    return NextResponse.json({ code: 500, message: error.message }, { status: 500 });
  };

  transport.onclose = () => {
    activeTransports.delete(sessionId); // Clean up the instance
    transport.close();
    server.close();
  };

  await server.connect(transport);
  // Call the transport method to handle the GET request and return the SSE response
  const response = await transport.handleGetRequest();
  return new NextResponse(response.body, response);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Extract the session ID from the query parameter sent by the client
  const sessionId = req.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return new NextResponse(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32600, message: "Missing sessionId query parameter" },
        id: null,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Find the corresponding transport instance
  const transport = activeTransports.get(sessionId);

  if (!transport) {
    // Session not found or already closed
    console.warn(`Received POST for unknown session ID: ${sessionId}`);
    return new NextResponse(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Session not found" },
        id: null,
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Delegate the POST message handling to the specific transport instance
  const response = await transport.handlePostMessage(req);
  return new NextResponse(response.body, response);
}
