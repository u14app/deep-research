import type { ReadableStreamController } from "node:stream/web";
import { customAlphabet } from "nanoid";
import type { Transport } from "./shared/transport";
import { type JSONRPCMessage, JSONRPCMessageSchema } from "./types";

interface SSEServerTransportOptions {
  endpoint: string;
  cors?: boolean;
}

const nanoid = customAlphabet("1234567890abcdef");

/**
 * Server transport for SSE adapted for Next.js API Routes.
 * It supports sending messages over an SSE connection and receiving messages from HTTP POST requests.
 *
 * Each instance of this class is intended to manage a single SSE session.
 * A separate manager (like a Map in your API route) is needed to handle multiple concurrent sessions.
 *
 * Usage example in Next.js API routes:
 *
 * // api/sse-stream/route.ts (GET handler)
 * import { Request, Response } from 'next/server';
 * import { SSEServerTransport } from './SSEServerTransport'; // Assuming relative path
 *
 * // In-memory storage for active transport sessions.
 * // In a production app, consider a more robust distributed cache or state store.
 * const activeTransports = new Map<string, SSEServerTransport>();
 *
 * // The API route path clients will POST messages to
 * const POST_ENDPOINT_PATH = '/api/sse-post'; // This must match your POST API route path
 *
 * export async function GET(req: Request): Promise<Response> {
 *   // Create a new transport instance for this session
 *   const transport = new SSEServerTransport(POST_ENDPOINT_PATH);
 *   const sessionId = transport.sessionId;
 *
 *   // Store the transport instance keyed by session ID
 *   activeTransports.set(sessionId, transport);
 *
 *   console.log(`[${sessionId}] New SSE session initiated.`);
 *
 *   // Set up the event handlers for this transport instance
 *   transport.onmessage = async (message, extra) => {
 *     console.log(`[${sessionId}] Received message:`, message, 'Auth:', extra?.authInfo);
 *     // Add your core JSON-RPC handling logic here
 *     // Example: Echo back requests
 *     if (message.id !== undefined) {
 *         try {
 *            await transport.send({
 *                jsonrpc: "2.0",
 *                result: { received: message },
 *                id: message.id
 *            });
 *         } catch (sendError) {
 *             console.error(`[${sessionId}] Failed to send message:`, sendError);
 *             // Handle potential stream closure or other send errors
 *         }
 *     }
 *   };
 *
 *   transport.onerror = (error) => {
 *     console.error(`[${sessionId}] Transport error:`, error);
 *     // Handle errors (e.g., log, close session)
 *   };
 *
 *   transport.onclose = () => {
 *     console.log(`[${sessionId}] SSE session closed. Removing from map.`);
 *     activeTransports.delete(sessionId); // Clean up the instance
 *   };
 *
 *   // Call the transport method to handle the GET request and return the SSE response
 *   return transport.handleGetRequest(req);
 * }
 *
 * // api/sse-post/route.ts (POST handler)
 * import { Request, Response } from 'next/server';
 * import { activeTransports } from '../sse-stream/route'; // Import the map from the GET route file
 *
 * export async function POST(req: Request): Promise<Response> {
 *   // Extract the session ID from the query parameter sent by the client
 *   const sessionId = req.nextUrl.searchParams.get('sessionId');
 *
 *   if (!sessionId) {
 *      return new Response(JSON.stringify({
 *          jsonrpc: "2.0",
 *          error: { code: -32600, message: "Missing sessionId query parameter" },
 *          id: null
 *      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
 *   }
 *
 *   // Find the corresponding transport instance
 *   const transport = activeTransports.get(sessionId);
 *
 *   if (!transport) {
 *      // Session not found or already closed
 *      console.warn(`Received POST for unknown session ID: ${sessionId}`);
 *      return new Response(JSON.stringify({
 *          jsonrpc: "2.0",
 *          error: { code: -32001, message: "Session not found" },
 *          id: null
 *      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
 *   }
 *
 *   // Optional: Retrieve auth info from req (e.g., via middleware) and pass it
 *   // const authInfo = (req as any).auth;
 *
 *   // Delegate the POST message handling to the specific transport instance
 *   return transport.handlePostMessage(req); // Pass the request object directly
 * }
 *
 */
export class SSEServerTransport implements Transport {
  // Store the ReadableStream controller for the SSE stream
  private _sseController?: ReadableStreamController<Uint8Array>;
  private _started: boolean = false;
  private _sessionId: string;
  // Counter for generating SSE event IDs (optional but good practice for SSE)
  private _messageIdCounter: number = 0;
  private _endpoint: string;
  private _cors: boolean;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  // onmessage now includes the request object for potential context access (e.g. auth)
  onmessage?: (message: JSONRPCMessage) => void;

  /**
   * Creates a new SSE server transport instance for a single session.
   * The client will be directed to POST messages to the URL path identified by `_postEndpointPath`.
   *
   * @param _postEndpointPath The URL path clients should use for POSTing messages (e.g., '/api/messages').
   */
  constructor(options: SSEServerTransportOptions) {
    this._endpoint = options.endpoint;
    this._cors = !!options.cors;
    this._sessionId = nanoid(32); // Generate unique session ID for this instance
    // The 'res' parameter from the original constructor is removed as Response is returned.
  }

  get corsHeader() {
    return this._cors ? { "Access-Control-Allow-Origin": "*" } : undefined;
  }

  async start(): Promise<void> {
    if (this._started) {
      // console.warn("Transport already started"); // Use console.warn for non-critical restarts
      return; // Or throw new Error("Transport already started"); if strict single start needed
    }
    this._started = true;
    // Perform any global setup if needed later
  }

  /**
   * Handles the initial GET request to establish the SSE stream.
   * Creates a ReadableStream and returns a Response.
   *
   * This should be called by the GET API route handler.
   * @param req The incoming Request.
   * @returns A Promise resolving to the Response containing the SSE stream.
   */
  async handleGetRequest(): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...this.corsHeader,
    };

    // Create the ReadableStream for the SSE body
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this._sseController = controller; // Store the controller to send messages later
        console.log(`[${this._sessionId}] SSE stream started.`);

        // Send the initial 'endpoint' event as per spec
        // Construct the POST endpoint URL with the session ID query parameter
        const dummyBase = "http://localhost"; // Any valid base works
        const endpointUrl = new URL(this._endpoint, dummyBase);
        endpointUrl.searchParams.set("sessionId", this._sessionId);

        const relativeUrlWithSession = endpointUrl.pathname + endpointUrl.search + endpointUrl.hash;

        // Send the event
        // The 'id' field for this SSE event is not strictly necessary per the spec for the endpoint event,
        // but adding an ID to messages is good practice for SSE resiliency.
        // Let's add a simple auto-incrementing ID to all events for consistency.
        const endpointEventData = `event: endpoint\ndata: ${relativeUrlWithSession}\n\n`;
        try {
          controller.enqueue(encoder.encode(endpointEventData));
          console.log(`[${this._sessionId}] Sent 'endpoint' event: ${relativeUrlWithSession}`);
        } catch (error) {
          console.error(`[${this._sessionId}] Failed to enqueue endpoint event:`, error);
          // If enqueue fails immediately, the stream might be broken
          controller.error(new Error("Failed to enqueue initial SSE event."));
        }

        // Optional: Send a comment or initial event to keep the connection alive if no data for a while
        // You might need a timer here to periodically send a ': comment\n\n'
      },
    });

    // Return the Response with the stream body
    return new Response(stream, { status: 200, headers });
  }

  /**
   * Handles incoming POST requests containing JSON-RPC messages.
   * Validates the session ID from the URL and processes the message.
   *
   * This should be called by the POST API route handler.
   * @param req The incoming Request.
   * @returns A Promise resolving to a Response (e.g., 202 Accepted or an error).
   */
  async handlePostMessage(req: Request): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.corsHeader,
    };

    const sessionIdFromUrl = new URL(req.url).searchParams.get("sessionId");

    if (sessionIdFromUrl !== this._sessionId) {
      // This indicates a mismatch between the session ID in the URL
      // used to find this transport instance and the instance's own ID.
      // Or, the route handler failed to validate/provide the ID correctly.
      // Return 400 Bad Request or 404 Not Found depending on desired strictness.
      console.warn(
        `[${this._sessionId}] POST received with mismatched or missing sessionId in URL. Expected: ${this._sessionId}, Received: ${sessionIdFromUrl}`
      );
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: Invalid or mismatched sessionId in URL.",
          },
          id: null,
        }),
        { status: 400, headers }
      );
    }

    // Ensure the SSE stream is active for this session instance
    if (!this._sseController) {
      // Received a POST message for a session where the SSE stream is not active.
      // This could mean the client connected via GET, got the endpoint, but
      // the SSE connection subsequently failed/closed before they POSTed.
      // Return 404 Not Found (session stream is not active).
      console.warn(`[${this._sessionId}] Received POST but SSE stream is not active.`);
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32001, // Using session not found code as the stream is the core of the session here
            message: "Session stream not active.",
          },
          id: null,
        }),
        { status: 404, headers }
      );
    }

    req.signal.addEventListener("abort", () => {
      this.close();
    });

    let rawMessage: any;
    try {
      // Request.json() handles content-type and parses JSON
      rawMessage = await req.json();
      // Add size limit check if req.json() doesn't strictly enforce it based on serverless provider
      // const bodyText = await req.text();
      // if (bodyText.length > /* calculated byte limit from MAXIMUM_MESSAGE_SIZE */) { ... throw Error('Too large') ... }
      // rawMessage = JSON.parse(bodyText);
    } catch (error) {
      console.error(`[${this._sessionId}] Failed to parse POST body:`, error);
      this.onerror?.(error as Error);
      // Return a JSON-RPC parse error response
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error", data: String(error) },
          id: null,
        }),
        { status: 400, headers }
      );
    }

    try {
      // Handle the message, which will validate and call onmessage
      await this.handleMessage(rawMessage);
    } catch (error) {
      console.error(`[${this._sessionId}] Failed to handle message after parsing:`, error);
      // If handleMessage throws (likely due to Zod validation error or onmessage handler error)
      // Return a JSON-RPC Invalid Request error response
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code:
              error instanceof Error && error.message.includes("Invalid Request") ? -32600 : -32603, // Use Invalid Request or Internal Error
            message: `Message handling error: ${String(error)}`,
            data: String(error),
          },
          id: (rawMessage as any)?.id ?? null, // Include ID if available in the failed message
        }),
        { status: 400, headers }
      );
    }

    // If processing succeeds, return 202 Accepted
    console.log(`[${this._sessionId}] POST message accepted.`);
    return new Response(null, {
      status: 202,
      headers: { ...headers, "mcp-session-id": this._sessionId },
    });
  }

  /**
   * Handle a client message, regardless of how it arrived.
   * Parses and validates the message, then calls the onmessage callback.
   */
  async handleMessage(message: unknown): Promise<void> {
    let parsedMessage: JSONRPCMessage;
    try {
      // Validate the message using Zod schema
      parsedMessage = JSONRPCMessageSchema.parse(message);
    } catch (error) {
      // Wrap Zod errors as Invalid Request
      const validationError = new Error(`Invalid Request: Message validation failed - ${error}`);
      this.onerror?.(validationError);
      throw validationError; // Re-throw to be caught by handlePostMessage for proper response
    }

    try {
      // Call the user-provided message handler
      // Note: onmessage is async in the interface but not marked async here.
      // Ensure your onmessage handler can handle async operations internally
      // or wrap the call in await if necessary, depending on your onmessage signature.
      this.onmessage?.(parsedMessage);
    } catch (error) {
      // Catch errors *within* the onmessage handler
      const messageHandlerError = new Error(`Error in onmessage handler: ${error}`);
      this.onerror?.(messageHandlerError);
      // Decide whether to re-throw to potentially return a 500 or just log
      // Re-throwing allows handlePostMessage to return an error response.
      throw messageHandlerError;
    }
  }

  /**
   * Closes the SSE stream for this transport instance.
   * This should be called when the session is ended on the server side.
   */
  async close(): Promise<void> {
    console.log(`[${this._sessionId}] Closing transport.`);
    // Close the SSE stream controller, triggering the 'cancel' handler
    try {
      this._sseController?.close();
      if (this.onclose) this.onclose();
    } catch (error) {
      console.error(`[${this._sessionId}] Error during controller.close():`, error);
      this.onerror?.(error as Error); // Report closing error
    }
    this._sseController = undefined; // Ensure controller is cleared immediately
    this._started = false; // Reset started state
    // The onclose callback is called by the stream's cancel handler.
  }

  /**
   * Sends a JSON-RPC message to the client via the SSE stream.
   * @param message The JSON-RPC message to send.
   * @returns A Promise that resolves when the message is enqueued.
   * @throws Error if the SSE stream is not active.
   */
  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._sseController) {
      const error = new Error(`[${this._sessionId}] Cannot send message: SSE stream not active.`);
      console.error(error.message);
      // Decide if sending when not connected should be a hard error or silent discard.
      // Original code throws, let's keep that behavior.
      throw error;
    }

    const encoder = new TextEncoder();
    // Format the message as an SSE event
    const eventData = `event: message\nid: ${this
      ._messageIdCounter++}\ndata: ${JSON.stringify(message)}\n\n`;

    try {
      // Enqueue the data onto the stream controller
      // Check desiredSize to potentially handle backpressure, though enqueue is usually sufficient
      // for typical message rates in web apps.
      // If desiredSize is null, the stream is closed.
      if (this._sseController.desiredSize === null) {
        const error = new Error(`[${this._sessionId}] Cannot send message: SSE stream is closed.`);
        console.error(error.message);
        // The cancel handler should have cleared _sseController, but double check.
        this._sseController = undefined;
        throw error;
      }
      this._sseController.enqueue(encoder.encode(eventData));
      // console.log(`[${this._sessionId}] Sent message (SSE event ID: ${this._messageIdCounter - 1})`); // Debug log
    } catch (error) {
      // Catch synchronous errors during enqueue (e.g. controller already errored)
      const sendError = new Error(`[${this._sessionId}] Failed to enqueue SSE message: ${error}`);
      console.error(sendError.message);
      this.onerror?.(sendError); // Report the error via the transport's error handler
      // Re-throw the error as the message failed to send
      throw sendError;
    }
  }

  /**
   * Returns the session ID for this transport instance.
   * This ID is used by clients to associate their POST requests with this session.
   */
  get sessionId(): string {
    return this._sessionId;
  }
}
