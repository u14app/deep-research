import type { ReadableStreamController } from "node:stream/web";
import { customAlphabet } from "nanoid";
import type { Transport } from "./shared/transport";
import {
  isInitializeRequest,
  isJSONRPCError,
  isJSONRPCRequest,
  isJSONRPCResponse,
  type JSONRPCMessage,
  JSONRPCMessageSchema,
  type RequestId,
} from "./types";

export type StreamId = string;
export type EventId = string;

/**
 * Interface for resumability support via event storage
 */
export interface EventStore {
  /**
   * Stores an event for later retrieval
   * @param streamId ID of the stream the event belongs to
   * @param message The JSON-RPC message to store
   * @returns The generated event ID for the stored event
   */
  storeEvent(streamId: StreamId, message: JSONRPCMessage): Promise<EventId>;

  replayEventsAfter(
    lastEventId: EventId,
    {
      send,
    }: {
      send: (eventId: EventId, message: JSONRPCMessage) => Promise<void>;
    }
  ): Promise<StreamId>;
}

/**
 * Configuration options for StreamableHTTPServerTransport
 */
export interface StreamableHTTPServerTransportOptions {
  /**
   * Function that generates a session ID for the transport.
   * The session ID SHOULD be globally unique and cryptographically secure (e.g., a securely generated UUID, a JWT, or a cryptographic hash)
   *
   * Return undefined to disable session management.
   */
  sessionIdGenerator: (() => string) | undefined;

  /**
   * A callback for session initialization events
   * This is called when the server initializes a new session.
   * Useful in cases when you need to register multiple mcp sessions
   * and need to keep track of them.
   * @param sessionId The generated session ID
   */
  onsessioninitialized?: (sessionId: string) => void;

  /**
   * If true, the server will return JSON responses instead of starting an SSE stream.
   * This can be useful for simple request/response scenarios without streaming.
   * Default is false (SSE streams are preferred).
   */
  enableJsonResponse?: boolean;

  /**
   * Event store for resumability support
   * If provided, resumability will be enabled, allowing clients to reconnect and resume messages
   */
  eventStore?: EventStore;

  cors?: boolean;
}

const nanoid = customAlphabet("1234567890abcdef");

/**
 * Server transport for Streamable HTTP adapted for Next.js API Routes.
 * It supports both SSE streaming and direct HTTP responses using Request and Response.
 *
 * Usage example in a Next.js API route (e.g., `app/api/mcp/route.ts`):
 *
 * ```typescript
 * // Create and configure your transport instance globally or within a factory
 * const transport = new StreamableHTTPServerTransport({
 *   sessionIdGenerator: () => randomUUID(), // Stateful mode
 *   // sessionIdGenerator: undefined, // Stateless mode
 *   enableJsonResponse: false, // Or true for JSON-only responses
 *   // eventStore: myEventStore, // Optional resumability
 *   onsessioninitialized: (id) => console.log('Session initialized:', id)
 * });
 *
 * // Implement your message handling logic
 * transport.onmessage = async (message, { authInfo }) => {
 *   console.log('Received message:', message, 'Auth:', authInfo);
 *   // Process the message and potentially send responses/notifications back
 *   if (message.id !== undefined) { // It's a request or response/error with ID
 *      // Example: Echo back a response for requests
 *      if (isJSONRPCRequest(message)) {
 *          await transport.send({
 *              jsonrpc: "2.0",
 *              result: { echo: message.params ?? "no params" },
 *              id: message.id
 *          });
 *      }
 *      // If it's a response or error, handle it (e.g., if this transport instance
 *      // is also acting as a client to another service)
 *      // if (isJSONRPCResponse(message) || isJSONRPCError(message)) { ... }
 *   } else { // It's a notification
 *      // Example: Send a notification back to the client
 *      await transport.send({
 *          jsonrpc: "2.0",
 *          method: "serverNotification",
 *          params: { received: message.method, data: message.params }
 *      });
 *   }
 * };
 *
 * transport.onerror = (error) => {
 *   console.error('Transport error:', error);
 * };
 *
 * transport.onclose = () => {
 *   console.log('Transport closed.');
 * };
 *
 * // Start the transport (no-op for HTTP but good practice)
 * transport.start().catch(console.error);
 *
 * // Your API route handler function
 * export async function GET(req: Request) {
 *   // In a real app, add auth logic here if needed and pass info to handleRequest
 *   // const authInfo = await getAuthInfo(req);
 *   // (req as any).auth = authInfo; // Example: adding auth info
 *   return transport.handleRequest(req);
 * }
 *
 * export async function POST(req: Request) {
 *   // In a real app, add auth logic here if needed and pass info to handleRequest
 *   // const authInfo = await getAuthInfo(req);
 *   // (req as any).auth = authInfo; // Example: adding auth info
 *   return transport.handleRequest(req);
 * }
 *
 * export async function DELETE(req: Request) {
 *   // In a real app, add auth logic here if needed and pass info to handleRequest
 *   // const authInfo = await getAuthInfo(req);
 *   // (req as any).auth = authInfo; // Example: adding auth info
 *   return transport.handleRequest(req);
 * }
 *
 * // Add other HTTP methods if your spec supports them, otherwise handleUnsupportedRequest will return 405
 * // export async function PUT(req: Request) { return transport.handleRequest(req); }
 * ```
 *
 * In stateful mode:
 * - Session ID is generated and included in response headers
 * - Session ID is always included in initialization responses
 * - Requests with invalid session IDs are rejected with 404 Not Found
 * - Non-initialization requests without a session ID are rejected with 400 Bad Request
 * - State is maintained in-memory (connections, message history)
 *
 * In stateless mode:
 * - No Session ID is included in any responses
 * - No session validation is performed
 */
export class StreamableHTTPServerTransport implements Transport {
  // when sessionId is not set (undefined), it means the transport is in stateless mode
  private sessionIdGenerator: (() => string) | undefined;
  private _started: boolean = false;
  // Map streamId to the ReadableStream controller for SSE streams
  private _streamMapping: Map<string, ReadableStreamController<Uint8Array>> = new Map();
  // Maps request ID to stream ID for POST requests resulting in SSE streams
  private _requestToStreamMapping: Map<RequestId, string> = new Map();
  // In SSE mode, stores responses waiting for the entire batch to be ready before closing the stream.
  // In JSON mode, this map is conceptually replaced by _pendingJsonResponses awaiting mechanism.
  private _requestResponseMap: Map<RequestId, JSONRPCMessage> = new Map();
  // For managing pending JSON responses in handlePostRequest when _enableJsonResponse is true
  private _pendingJsonResponses: Map<
    RequestId,
    { resolve: (message: JSONRPCMessage) => void; reject: (error: any) => void }
  > = new Map();

  private _initialized: boolean = false;
  private _enableJsonResponse: boolean = false;
  private _standaloneSseStreamId: string = "_GET_stream"; // Fixed ID for GET SSE stream
  private _eventStore?: EventStore;
  private _onsessioninitialized?: (sessionId: string) => void;
  private _cors: boolean;

  sessionId?: string | undefined; // Current active session ID
  onclose?: () => void;
  onerror?: (error: Error) => void;
  // onmessage now includes the request object for potential context access (e.g. auth)
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(options: StreamableHTTPServerTransportOptions) {
    this.sessionIdGenerator = options.sessionIdGenerator;
    this._enableJsonResponse = options.enableJsonResponse ?? false;
    this._eventStore = options.eventStore;
    this._onsessioninitialized = options.onsessioninitialized;
    this._cors = !!options.cors;
  }

  get corsHeader() {
    return this._cors ? { "Access-Control-Allow-Origin": "*" } : undefined;
  }

  /**
   * Starts the transport. This is required by the Transport interface but is a no-op
   * for the Streamable HTTP transport as connections are managed per-request.
   */
  async start(): Promise<void> {
    if (this._started) {
      // console.warn("Transport already started"); // Use console.warn for non-critical restarts
      return; // Or throw new Error("Transport already started"); if strict single start needed
    }
    this._started = true;
    // Perform any global setup if needed later
  }

  /**
   * Handles an incoming HTTP request, whether GET, POST, or DELETE.
   * Returns a Response to be sent back to the client.
   */
  async handleRequest(req: Request): Promise<Response> {
    req.signal.addEventListener("abort", () => {
      this.close();
    });

    try {
      // Note: req.auth requires middleware or wrapper to add it to the request object.
      // If not using a wrapper, authInfo would need to be retrieved here from headers/cookies etc.
      // or passed as a separate argument to handleRequest.
      // Keeping req.auth for now assuming such a wrapper exists.

      if (req.method === "POST") {
        return await this.handlePostRequest(req);
      } else if (req.method === "GET") {
        return await this.handleGetRequest(req);
      } else if (req.method === "DELETE") {
        return await this.handleDeleteRequest(req);
      } else {
        return this.handleUnsupportedRequest();
      }
    } catch (error) {
      // Catch any unexpected errors during request processing
      this.onerror?.(error as Error);
      // Return a standard internal server error response
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32603, // Internal error
            message: "Internal server error during request handling.",
            data: String(error), // Include error details for debugging
          },
          id: null,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  /**
   * Handles GET requests for SSE stream, returns a Response with a ReadableStream.
   */
  private async handleGetRequest(req: Request): Promise<Response> {
    // If an Mcp-Session-Id is returned by the server during initialization,
    // clients using the Streamable HTTP transport MUST include it
    // in the Mcp-Session-Id header on all of their subsequent HTTP requests.
    const sessionValidation = this.validateSession(req);
    if (sessionValidation !== true) {
      return sessionValidation; // Return the error response from validateSession
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.corsHeader,
    };

    // Handle resumability: check for Last-Event-ID header
    const lastEventId = req.headers.get("last-event-id") as string | undefined;
    if (lastEventId && this._eventStore) {
      // If replaying, create a new stream specifically for the replay+live stream
      // The spec mentions replayEventsAfter returns a StreamId. Let's assume the replay
      // process can use a temporary stream ID or the standalone ID depending on implementation details.
      // For simplicity here, let's use the standalone ID and ensure the stream logic handles replay.
      // The spec implies the client reconnects to the *same* stream conceptually.
      // Let's check if an active stream already exists before replaying.
      if (this._streamMapping.has(this._standaloneSseStreamId)) {
        // Only one GET SSE stream allowed per session
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Conflict: Only one SSE stream is allowed per session",
            },
            id: null,
          }),
          {
            status: 409,
            headers,
          }
        );
      }

      // Create stream, replay will happen in the stream's start method
      const stream = this.createSSEStream(this._standaloneSseStreamId, {
        lastEventId,
      });
      return new Response(stream, { status: 200, headers });
    }

    // Check if there's already an active standalone SSE stream for this session
    if (this._streamMapping.has(this._standaloneSseStreamId)) {
      // Only one GET SSE stream allowed per session
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Conflict: Only one SSE stream is allowed per session",
          },
          id: null,
        }),
        {
          status: 409,
          headers,
        }
      );
    }

    // Create and return the new standalone SSE stream
    const stream = this.createSSEStream(this._standaloneSseStreamId);

    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...this.corsHeader,
    };
    // After initialization, always include the session ID if we have one
    if (this.sessionId !== undefined) {
      responseHeaders["mcp-session-id"] = this.sessionId;
    }

    // Note: Headers are sent when the stream starts pushing data
    return new Response(stream, {
      status: 200,
      headers: responseHeaders,
    });
  }

  /**
   * Helper to create and manage a ReadableStream for SSE.
   * Handles controller setup, mapping, replay, and cleanup on cancel.
   */
  private createSSEStream(
    streamId: string,
    options?: { lastEventId?: string }
  ): ReadableStream<Uint8Array> {
    let controller: ReadableStreamController<Uint8Array>;

    const stream = new ReadableStream<Uint8Array>({
      start: async (c) => {
        controller = c;
        // Store the controller keyed by streamId
        this._streamMapping.set(streamId, controller);
        this.onerror?.(
          new Error(`SSE Stream [${streamId}] started for session ${this.sessionId || "stateless"}`)
        ); // Debug log

        // If replaying is needed, do it now
        if (options?.lastEventId && this._eventStore) {
          try {
            this.onerror?.(
              new Error(`Replaying events for stream [${streamId}] after ${options.lastEventId}`)
            ); // Debug
            await this._eventStore.replayEventsAfter(options.lastEventId, {
              send: async (eventId, message) => {
                // Ensure the stream is still active before enqueuing
                if (!this._streamMapping.has(streamId)) {
                  this.onerror?.(new Error(`Stream [${streamId}] closed during replay.`));
                  // Stop replaying if stream is gone
                  return; // Decide if this should throw or just stop
                }
                if (!this.writeSSEEvent(controller, message, eventId)) {
                  // Failed to enqueue replayed event - potentially the stream is full or closing
                  this.onerror?.(
                    new Error(`Failed to enqueue replayed event ${eventId} for stream ${streamId}`)
                  );
                  // Decide how to handle enqueue failure during replay - closing seems appropriate
                  controller.error(new Error("Failed to enqueue replayed events"));
                }
              },
            });
            this.onerror?.(new Error(`Finished replaying events for stream [${streamId}]`)); // Debug
          } catch (error) {
            this.onerror?.(error as Error);
            // Close stream on replay error
            try {
              controller.error(error);
            } catch (e) {
              this.onerror?.(e as Error);
            } // Ensure error doesn't throw again
          }
        }
        // Optional: Send a comment or initial event to ensure connection is live
        // controller.enqueue(': stream active\n\n');
      },
      cancel: (reason) => {
        this.onerror?.(
          new Error(
            `SSE Stream [${streamId}] cancelled/closed for session ${
              this.sessionId || "stateless"
            }. Reason: ${reason}`
          )
        ); // Debug
        // Cleanup mappings when the client disconnects or the stream is closed from our side
        this._streamMapping.delete(streamId);
        // Also clean up any request mappings pointing to this stream
        for (const [reqId, mappedStreamId] of this._requestToStreamMapping.entries()) {
          if (mappedStreamId === streamId) {
            this._requestToStreamMapping.delete(reqId);
            // Clear any pending responses for these requests
            this._requestResponseMap.delete(reqId);
            // If in JSON mode and a promise was pending (shouldn't happen for SSE streams but good practice), reject it
            if (this._pendingJsonResponses.has(reqId)) {
              this._pendingJsonResponses
                .get(reqId)
                ?.reject(
                  new Error(`Stream closed before JSON response could be processed: ${reason}`)
                );
              this._pendingJsonResponses.delete(reqId);
            }
          }
        }
        // Check if this was the last stream and potentially call onclose (if transport lifecycle depends on streams)
        if (this._streamMapping.size === 0) {
          // this.close(); // Careful with recursion or double-closing
          // Maybe set a flag or trigger a deferred close check
        }
      },
    });

    return stream;
  }

  /**
   * Writes an event to the SSE stream controller.
   * Returns false if the enqueue fails (e.g., stream is closed or full).
   */
  private writeSSEEvent(
    controller: ReadableStreamController<Uint8Array>,
    message: JSONRPCMessage,
    eventId?: string
  ): boolean {
    // Check if the stream is ready to accept data
    // desiredSize can be positive, zero, or negative (indicating buffering)
    // null means the stream is closed
    if (controller.desiredSize === null || controller.desiredSize <= 0) {
      // Stream is closed or buffer is full/negative, indicating backpressure or closure.
      this.onerror?.(
        new Error(
          `Stream controller buffer full or closed for enqueueing event ${
            eventId || "no-id"
          }. Desired size: ${controller.desiredSize}`
        )
      );
      return false; // Indicate failure
    }

    let eventData = `event: message\n`;
    // Include event ID if provided - this is important for resumability
    if (eventId) {
      eventData += `id: ${eventId}\n`;
    }
    eventData += `data: ${JSON.stringify(message)}\n\n`;

    // enqueue returns void, success is implied unless it throws or controller is closed asynchronously
    try {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(eventData));
      return true; // Indicate success
    } catch (error) {
      // Catch synchronous errors during enqueue (e.g. controller is already errored)
      this.onerror?.(new Error(`Failed to enqueue SSE event ${eventId || "no-id"}: ${error}`));
      return false; // Indicate failure
    }
  }

  /**
   * Handles unsupported requests (PUT, PATCH, etc.), returns a Response 405.
   */
  private handleUnsupportedRequest(): Response {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000, // Generic server error for method not allowed by transport
          message: "Method not allowed.",
        },
        id: null,
      }),
      {
        status: 405,
        headers: {
          Allow: "GET, POST, DELETE",
          "Content-Type": "application/json",
          ...this.corsHeader,
        },
      }
    );
  }

  /**
   * Handles POST requests containing JSON-RPC messages, returns a Response.
   * This method now awaits responses if enableJsonResponse is true.
   */
  private async handlePostRequest(req: Request): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.corsHeader,
    };

    try {
      // Validate Content-Type header
      const ct = req.headers.get("content-type");
      if (!ct || !ct.includes("application/json")) {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Unsupported Media Type: Content-Type must be application/json",
            },
            id: null,
          }),
          {
            status: 415,
            headers,
          }
        );
      }

      // Read and parse the request body as JSON
      let rawMessage: any;
      try {
        // Request.json() handles parsing and checks Content-Type internally
        // It might also respect serverless function body size limits automatically
        rawMessage = await req.json();
        // Potential improvement: Manually check body size if req.json() doesn't enforce MAXIMUM_MESSAGE_SIZE
      } catch (parseError) {
        // Handle JSON parsing errors
        this.onerror?.(parseError as Error);
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32700,
              message: "Parse error",
              data: String(parseError),
            },
            id: null,
          }),
          {
            status: 400,
            headers,
          }
        );
      }

      let messages: JSONRPCMessage[];
      // handle batch and single messages
      try {
        if (Array.isArray(rawMessage)) {
          // Validate each message in the batch using Zod
          messages = rawMessage.map((msg) => JSONRPCMessageSchema.parse(msg));
        } else {
          // Validate single message
          messages = [JSONRPCMessageSchema.parse(rawMessage)];
        }
      } catch (validationError) {
        // Handle message validation errors (e.g. Zod errors)
        this.onerror?.(validationError as Error);
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32600,
              message: "Invalid Request",
              data: String(validationError),
            },
            id: null, // Or the id from the message if available before validation failed
          }),
          {
            status: 400,
            headers,
          }
        );
      }

      // Check if this is an initialization request
      const isInitializationRequest = messages.some(isInitializeRequest);

      if (isInitializationRequest) {
        // Initialization request handling
        if (this._initialized && this.sessionId !== undefined) {
          // Server already initialized, reject re-initialization
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32600,
                message: "Invalid Request: Server already initialized",
              },
              id: null,
            }),
            {
              status: 400,
              headers,
            }
          );
        }
        if (messages.length > 1) {
          // Initialization must be a single message
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32600,
                message: "Invalid Request: Only one initialization request is allowed",
              },
              id: null,
            }),
            {
              status: 400,
              headers,
            }
          );
        }

        // Generate and set session ID if generator is provided
        this.sessionId = this.sessionIdGenerator?.();
        this._initialized = true;

        // Call session initialized callback
        if (this.sessionId && this._onsessioninitialized) {
          this._onsessioninitialized(this.sessionId);
        }
      } else {
        // Validate session for non-initialization requests
        const sessionValidation = this.validateSession(req);
        if (sessionValidation !== true) {
          return sessionValidation; // Return the error response
        }
      }

      // Separate requests from notifications/responses for processing flow
      const requests = messages.filter(isJSONRPCRequest);
      const otherMessages = messages.filter((msg) => !isJSONRPCRequest(msg));

      // If there are no requests (only notifications or responses), return 202 Accepted immediately
      if (requests.length === 0) {
        // Process other messages asynchronously
        otherMessages.forEach((message) => {
          this.onmessage?.(message);
        });
        // Return 202 Accepted as per spec for messages without requests
        const headers: Record<string, string> = {};
        if (this.sessionId !== undefined) {
          headers["mcp-session-id"] = this.sessionId;
        }
        return new Response(null, { status: 202, headers });
      }

      // If there are requests, handle based on enableJsonResponse
      if (this._enableJsonResponse) {
        // --- JSON Response Mode ---
        const responsePromises: Promise<JSONRPCMessage>[] = [];
        const requestIds: RequestId[] = [];

        for (const request of requests) {
          // Ensure request has an ID
          if (request.id === undefined) {
            // Malformed request in a batch intended for JSON response?
            this.onerror?.(
              new Error(
                `Received request without ID in batch expected for JSON response: ${JSON.stringify(
                  request
                )}`
              )
            );
            // Reject the whole batch or return a specific error? Spec implies all or nothing for batch.
            // Let's return a batch error for simplicity for now.
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                error: {
                  code: -32600,
                  message: "Invalid Request: Request in batch must have an ID in JSON mode",
                },
                id: null,
              }),
              {
                status: 400,
                headers,
              }
            );
          }
          requestIds.push(request.id);

          // Create a promise that will be resolved when the response for this request ID arrives via `send`
          const responsePromise = new Promise<JSONRPCMessage>((resolve, reject) => {
            // Store the resolve/reject callbacks keyed by request ID
            this._pendingJsonResponses.set(request.id, { resolve, reject });
          });
          responsePromises.push(responsePromise);

          // In JSON mode, stream mapping (_requestToStreamMapping) is not strictly needed for sending
          // data back via a stream, but we can use a conceptual streamId for cleanup consistency if needed.
          // Let's skip mapping request ID to stream ID in JSON mode for clarity.
        }

        // Process all messages (requests and others) - this will trigger the core logic
        // and eventually call `send` for the responses.
        messages.forEach((message) => {
          this.onmessage?.(message);
        });

        // Wait for all responses for the initial batch requests to be received
        const responses = await Promise.all(responsePromises);

        // Clean up the pending promises mapping after all promises have resolved
        requestIds.forEach((id) => {
          this._pendingJsonResponses.delete(id);
          // No _requestToStreamMapping or _requestResponseMap cleanup needed for JSON mode requests here
        });

        // Construct the final JSON response
        const responseHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          ...this.corsHeader,
        };
        if (this.sessionId !== undefined) {
          responseHeaders["mcp-session-id"] = this.sessionId;
        }

        const responseBody = responses.length === 1 ? responses[0] : responses;

        return new Response(JSON.stringify(responseBody), {
          status: 200, // Assuming all responses were successful JSON-RPC responses or errors
          headers: responseHeaders,
        });
      } else {
        // --- SSE Streaming Mode ---
        // Create a unique stream ID for this batch of requests
        const streamId = nanoid(32);

        // Create the SSE stream. The controller will be stored in _streamMapping inside createSSEStream.
        const stream = this.createSSEStream(streamId);

        // Link all requests in this batch to this stream ID
        requests.forEach((request) => {
          // Ensure request has an ID to map
          if (request.id !== undefined) {
            this._requestToStreamMapping.set(request.id, streamId);
          } else {
            // Request without ID in SSE mode POST? Spec might allow this as a notification,
            // but if it's intended to have a response, something is wrong.
            this.onerror?.(
              new Error(
                `Received request without ID in batch expected for SSE stream: ${JSON.stringify(
                  request
                )}`
              )
            );
            // Decide how to handle - for now, log and proceed, it won't get a mapped response stream.
          }
        });

        // Process all messages (requests and others) asynchronously
        // The `send` method will enqueue responses/notifications onto the created stream.
        messages.forEach((message) => {
          this.onmessage?.(message);
        });

        // Return the SSE response immediately. Data is sent via the stream asynchronously.
        const responseHeaders: Record<string, string> = {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
          ...this.corsHeader,
        };
        if (this.sessionId !== undefined) {
          responseHeaders["mcp-session-id"] = this.sessionId;
        }

        return new Response(stream, {
          status: 200,
          headers: responseHeaders,
        });
      }
    } catch (error) {
      // Catch any errors occurring *before* a response is returned (e.g., during parsing, validation, initialization logic)
      this.onerror?.(error as Error);
      // Return a JSON-RPC formatted error response
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            // Use Parse error (-32700) for JSON issues, Invalid Request (-32600) for validation/logic issues
            code:
              error instanceof Error &&
              (error.message.includes("Parse error") || error.message.includes("Invalid Request"))
                ? error.message.includes("Parse error")
                  ? -32700
                  : -32600
                : -32603, // Default to internal error
            message: `Request handling error: ${String(error)}`,
            data: String(error), // Include error details
          },
          id: null, // No ID if request couldn't be parsed or validated
        }),
        {
          status: 400, // Bad Request for -32700/-32600, maybe 500 for -32603
          headers,
        }
      );
    }
  }

  /**
   * Handles DELETE requests to terminate sessions, returns a Response 200.
   */
  private async handleDeleteRequest(req: Request): Promise<Response> {
    const sessionValidation = this.validateSession(req);
    if (sessionValidation !== true) {
      return sessionValidation; // Return the error response
    }

    await this.close(); // Close the transport, which closes all streams for this session
    return new Response(null, { status: 200, headers: this.corsHeader }); // Return success response
  }

  /**
   * Validates session ID for non-initialization requests.
   * Returns a Response error if validation fails, otherwise returns true.
   */
  private validateSession(req: Request): Response | true {
    if (this.sessionIdGenerator === undefined) {
      // If the sessionIdGenerator is undefined, session management is disabled
      return true; // Always valid in stateless mode
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.corsHeader,
    };

    if (!this._initialized) {
      // Server must be initialized in stateful mode before receiving non-init requests
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: Server not initialized",
          },
          id: null,
        }),
        {
          status: 400,
          headers,
        }
      );
    }

    // Use req.headers.get() to get header values in Request
    const sessionId = req.headers.get("mcp-session-id");

    if (!sessionId) {
      // Mcp-Session-Id header is required in stateful mode after initialization
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: Mcp-Session-Id header is required",
          },
          id: null,
        }),
        {
          status: 400,
          headers,
        }
      );
      // Note: req.headers.get() handles multiple headers by returning the first one,
      // so Array.isArray check is not needed for Request headers.
    } else if (sessionId !== this.sessionId) {
      // Provided session ID does not match the active server session ID
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32001, message: "Session not found" }, // Spec uses 404 for session not found
          id: null,
        }),
        {
          status: 404,
          headers,
        }
      );
    }

    // Session is valid
    return true;
  }

  /**
   * Closes the transport, ending all active streams and cleaning up resources.
   */
  async close(): Promise<void> {
    // Close all active SSE stream controllers
    this._streamMapping.forEach((controller, streamId) => {
      try {
        // Calling close() on the controller signals the stream end to the client.
        // The stream's cancel handler will be triggered subsequently to clean up mappings.
        controller.close();
        this.onerror?.(new Error(`Closing stream [${streamId}] via transport.close()`)); // Debug log
      } catch (error) {
        // Catch errors if the controller is already closing or errored
        this.onerror?.(
          new Error(`Error closing stream [${streamId}] via transport.close(): ${error}`)
        );
      }
    });
    // Clear the map immediately, even though cancel handlers also remove entries,
    // ensures no new messages are sent to closing streams.
    this._streamMapping.clear();

    // Clean up request mappings and pending responses/promises
    this._requestToStreamMapping.clear();
    this._requestResponseMap.clear();

    // Reject any pending JSON response promises
    this._pendingJsonResponses.forEach(({ reject }) => {
      // Reject promises with an error indicating closure
      reject(new Error("Transport closed before response was sent."));
    });
    this._pendingJsonResponses.clear();

    if (this.onclose) this.onclose(); // Call the transport close callback
    this._started = false; // Reset started state
    this._initialized = false; // Reset initialization state
    this.sessionId = undefined; // Clear session ID
  }

  /**
   * Sends a JSON-RPC message.
   * In SSE mode, enqueues the message to the appropriate stream.
   * In JSON mode, resolves the promise awaiting the response if it's a response/error.
   */
  async send(message: JSONRPCMessage, options?: { relatedRequestId?: RequestId }): Promise<void> {
    // This method does NOT return a Response. It modifies internal state or pushes data.

    let requestId = options?.relatedRequestId;
    if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
      // If the message is a response or error, use the ID from the message
      // Note: `id` can be number, string, or null. `RequestId` type should reflect this.
      requestId = message.id;
    }

    // --- Handle JSON Response Mode ---
    // If enableJsonResponse is true AND this message is a response/error, resolve the pending promise.
    if (this._enableJsonResponse && (isJSONRPCResponse(message) || isJSONRPCError(message))) {
      if (requestId !== undefined && requestId !== null) {
        // Only valid JSON-RPC response IDs (number/string) map to pending requests
        const pending = this._pendingJsonResponses.get(requestId);
        if (pending) {
          // Resolve the promise that handlePostRequest is awaiting
          pending.resolve(message);
          // The entry will be deleted from _pendingJsonResponses in handlePostRequest after Promise.all resolves.
          // This handles batch requests correctly.
        } else {
          // Received a response/error for an ID we weren't explicitly waiting for in JSON mode.
          // This could be a response for a notification that was sent with an ID accidentally,
          // or a response for a request that timed out or was already processed.
          // Log a warning but otherwise ignore it in JSON mode flow.
          this.onerror?.(
            new Error(
              `Received JSON response/error for unknown or non-pending request ID: ${String(
                requestId
              )}. Message: ${JSON.stringify(message)}`
            )
          );
        }
      } else {
        // Received a response/error with id: null in JSON mode. This indicates a server error response
        // related to parsing/invalid request of the *original* batch itself.
        // The original batch handling in handlePostRequest should ideally catch these errors before calling send.
        // If somehow send is called with an id: null error, it's likely a bug in the core logic calling send.
        // Log an error.
        this.onerror?.(
          new Error(
            `Received JSON response/error with id: null in send method. Message: ${JSON.stringify(
              message
            )}`
          )
        );
      }
      // In JSON mode, sending a response finishes the job for that request ID.
      return; // Exit the send method early.
    }

    // --- Handle SSE Streaming Mode ---
    // Find the stream ID associated with this message
    let streamId: string | undefined;
    if (requestId === undefined || requestId === null) {
      // Messages without IDs are typically server-initiated notifications or requests.
      // These go to the standalone GET stream if available.
      streamId = this._standaloneSseStreamId;
      // Only send requests and notifications on standalone stream.
      // Responses/Errors without a relatedRequestId or null ID are malformed per JSON-RPC.
      // Responses/Errors *with* a relatedRequestId are handled below.
      if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
        // This case means send was called for a response/error, but with undefined/null ID, AND no relatedRequestId was provided.
        // This shouldn't happen if the core logic follows JSON-RPC spec.
        // If it happens, it's likely a bug in the core logic.
        this.onerror?.(
          new Error(
            `Received malformed response/error message in send method (undefined/null id, no relatedRequestId): ${JSON.stringify(
              message
            )}`
          )
        );
        // Decide whether to throw or ignore. Throwing is more indicative of a bug.
        throw new Error(
          "Cannot send a response or error message without a valid ID or relatedRequestId."
        );
      }
    } else {
      // Messages with IDs (requests, responses, errors) sent by the core logic
      // and related to a client request should map back to the stream opened for that request batch.
      streamId = this._requestToStreamMapping.get(requestId);
      if (!streamId) {
        // This happens if the client disconnected and the stream's cancel handler
        // already cleaned up the streamId -> requestId mapping.
        // Or if a message arrives for a request ID the transport never saw (e.g., from another session).
        this.onerror?.(
          new Error(
            `No stream found for request ID: ${String(
              requestId
            )}. Client likely disconnected or ID is invalid.`
          )
        );
        // Don't throw, just silently discard - the client is gone or the message is irrelevant.
        return;
      }
    }

    // Get the stream controller using the determined stream ID
    const controller = this._streamMapping.get(streamId);

    if (!controller) {
      // This is a potential state inconsistency if _requestToStreamMapping has the ID
      // but _streamMapping doesn't have the controller. The cancel handler should prevent this.
      this.onerror?.(
        new Error(
          `Stream ID [${streamId}] found for request ID [${String(
            requestId
          )}], but controller is missing.`
        )
      );
      return; // Cannot send if controller is gone
    }

    // Generate and store event ID if event store is provided
    let eventId: string | undefined;
    if (this._eventStore) {
      try {
        // Stores the event and gets the generated event ID
        // Need to store the message *before* sending, in case sending fails.
        eventId = await this._eventStore.storeEvent(streamId, message);
        // this.onerror?.(new Error(`Stored event ${eventId} for stream ${streamId}`)); // Debug log
      } catch (storageError) {
        this.onerror?.(new Error(`Failed to store event for stream ${streamId}: ${storageError}`));
        // Log error, but continue trying to send the message (client might still be connected).
      }
    }

    // Send the message as an SSE event via the stream controller
    const success = this.writeSSEEvent(controller, message, eventId);
    if (!success) {
      // Failed to enqueue. The stream might be closed, errored, or buffer is full.
      // This indicates a problem with the stream or client connection.
      this.onerror?.(
        new Error(`Failed to enqueue SSE event for stream ${streamId}. Stream may be closed.`)
      );
      // The stream's cancel handler should handle cleanup if it's truly closed.
      // We could proactively call controller.error here, but it might double-error.
      // Relying on the enqueue failure + subsequent cancel handler seems safer.
    }

    // In SSE mode, if this message is a response or error, check if all related responses for this stream are ready.
    if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
      // Store the completed response for the "all ready" check
      if (requestId !== undefined && requestId !== null) {
        this._requestResponseMap.set(requestId, message);

        // Find all request IDs that were mapped to this specific stream (batch)
        const relatedIds = Array.from(this._requestToStreamMapping.entries())
          .filter(([, mappedStreamId]) => mappedStreamId === streamId) // Find all request IDs mapped to this stream
          .map(([id]) => id);

        // Check if we have received responses for all requests that initiated this stream
        const allResponsesReady = relatedIds.every((id) => this._requestResponseMap.has(id));

        if (allResponsesReady) {
          this.onerror?.(
            new Error(`All responses ready for stream [${streamId}]. Closing stream.`)
          ); // Debug log

          // All responses for this batch/stream are ready, close the SSE stream
          try {
            controller.close(); // Signals end of stream to the client
          } catch (error) {
            this.onerror?.(
              new Error(`Error calling controller.close on stream [${streamId}]: ${error}`)
            );
          }

          // Clean up mappings for this stream and the requests associated with it
          for (const id of relatedIds) {
            this._requestResponseMap.delete(id);
            // Important: Delete from _requestToStreamMapping as well
            // The cancel handler also does this, but doing it here ensures cleanup
            // is tied to the completion logic regardless of client disconnect timing.
            this._requestToStreamMapping.delete(id);
          }
          // The streamId should be removed from _streamMapping by the stream's cancel handler
          // when controller.close() finishes.
        }
      } else {
        // Received response/error with id: null in SSE mode send.
        // This is likely a server error response related to the batch itself.
        // If the stream is still open, it's okay to send this as a regular SSE message event.
        // The client should interpret JSON-RPC error messages correctly.
        // No special handling needed here beyond sending the message.
      }
    }
  }
}
