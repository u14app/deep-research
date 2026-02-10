# Deep Research API Documentation

## Overview

The Deep Research API provides a real-time interface for initiating and monitoring complex research tasks. Leveraging Server-Sent Events (SSE), it delivers updates, information, message, progress, and errors as they occur, allowing clients to receive continuous streams of data without polling.

## Protocol

This API uses **Server-Sent Events (SSE)** over HTTP. Clients should establish an HTTP connection and keep it open to receive a stream of events from the server.

## Data Format

All data sent via SSE adheres to the following structure:

```text
event: EventName
data: JSON_String

```

- `event`: Specifies the type of event being sent (e.g., `infor`, `message`, `reasoning`, `progress`, `error`).
- `data`: A string containing a JSON object relevant to the event type.
- A double newline (`\n\n`) signifies the end of an event block.

## API config

Recommended to use the API via `@microsoft/fetch-event-source`.

Endpoint: `/api/sse`

Method: `POST`

Body:

```typescript
interface Config {
  // Research topic
  query: string;
  // AI provider, Possible values ​​include: google, openai, anthropic, deepseek, xai, mistral, azure, openrouter, openaicompatible, pollinations, ollama
  provider: string;
  // Thinking model id
  thinkingModel: string;
  // Task model id
  taskModel: string;
  // Search provider, Possible values ​​include: model, tavily, firecrawl, exa, bocha, searxng
  searchProvider: string;
  // Response Language, also affects the search language. (optional)
  language?: string;
  // Maximum number of search results. Default, `5` (optional)
  maxResult?: number;
  // Whether to include content-related images in the final report. Default, `true`. (optional)
  enableCitationImage?: boolean;
  // Whether to include citation links in search results and final reports. Default, `true`. (optional)
  enableReferences?: boolean;
  // Override built-in prompt templates. You can provide one or more prompt keys as needed. (optional)
  promptOverrides?: Partial<{
    systemInstruction: string;
    outputGuidelinesPrompt: string;
    systemQuestionPrompt: string;
    reportPlanPrompt: string;
    serpQueriesPrompt: string;
    queryResultPrompt: string;
    citationRulesPrompt: string;
    searchResultPrompt: string;
    searchKnowledgeResultPrompt: string;
    reviewPrompt: string;
    finalReportCitationImagePrompt: string;
    finalReportReferencesPrompt: string;
    finalReportPrompt: string;
  }>;
}
```

Headers:

```typescript
interface Headers {
  "Content-Type": "application/json";
  // If you set an access password
  // Authorization: "Bearer YOUR_ACCESS_PASSWORD";
}
```

For specific usage parameter forms, see the [example code](#client-code-example).

## Response Events

The API streams data as a series of events. Each event has a type (`event`) and associated data (`data`).

### General Structure

```text
event: [event_type]
data: [JSON_payload]

```

### Event Types

The following event types are supported:

- `infor`
- `message`
- `reasoning`
- `progress`
- `error`

---

### `infor` Event

Sent at the beginning of the stream (or upon specific requests) to provide initial information about the API instance or the research session.

**Description:** Provides basic information about the running API instance.

**Data Structure (`data` field):** A JSON string representing the following structure:

| Parameter | Type   | Description         |
| :-------- | :----- | :------------------ |
| `name`    | string | Project name        |
| `version` | string | Current API version |

```typescript
interface InforEvent {
  // Project name
  name: string;
  // Current API version
  version: string;
}
```

**Example:**

```text
event: infor
data: {"name":"deep-research","version":"0.1.0"}

```

---

### `message` Event

Used to send text content of deep research to the client.

**Description:** Delivers textual messages during the research process.

**Data Structure (`data` field):** A JSON string representing the following structure:

| Parameter | Type   | Description                            | Notes                                                 |
| :-------- | :----- | :------------------------------------- | :---------------------------------------------------- |
| `type`    | string | Type of the message content            | Currently only `"text"` is supported.                 |
| `text`    | string | The message content (Markdown format). | Optional for future types, but required for `"text"`. |

```typescript
interface MessageEvent {
  // Message type, currently only "text" is supported
  type: "text";
  // Textual data
  text?: string;
}
```

**Example:**

```text
event: message
data: {"type":"text","text":"This is a **markdown** string."}

```

---

### `reasoning` Event

Used to send thinking content of deep research to the client. Some thinking models support output thinking process.

**Description:** Delivers textual messages during the research process.

**Data Structure (`data` field):** A JSON string representing the following structure:

| Parameter | Type   | Description                              | Notes                                 |
| :-------- | :----- | :--------------------------------------- | :------------------------------------ |
| `type`    | string | Type of the reasoning content            | Currently only `"text"` is supported. |
| `text`    | string | The reasoning content (Markdown format). | Required for `"text"`.                |

```typescript
interface ReasoningEvent {
  // Reasoning type, currently only "text" is supported
  type: "text";
  // Textual data
  text: string;
}
```

**Example:**

```text
event: message
data: {"type":"text","text":"Output thinking process"}

```

---

### `progress` Event

Communicates the current step and status of the research task execution. This is crucial for providing real-time feedback on the process flow.

**Description:** Indicates the progress of the research task, including the current step and its status (start or end).

**Data Structure (`data` field):** A JSON string representing the following structure:

| Parameter | Type                                                                            | Description                                                                                  | Notes                                                                              |
| :-------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `step`    | "report-plan" \| "serp-query" \| "task-list" \| "search-task" \| "final-report" | The identifier of the current step in the research process.                                  | See "Possible `step` Values" below.                                                |
| `status`  | "start" \| "end"                                                                | The status of the current step.                                                              | Indicates if the step is starting or ending. See "Possible `status` Values" below. |
| `name`    | string                                                                          | A descriptive name for the specific instance of the step (e.g., for a specific search task). | Included only when `step` is `"search-task"`.                                      |
| `data`    | any                                                                             | Optional data relevant to the step's outcome or details.                                     | May be included when `status` is `"end"`. The content varies by step.              |

```typescript
interface ProgressEvent {
  // Current step
  step:
    | "report-plan"
    | "serp-query"
    | "task-list"
    | "search-task"
    | "final-report";
  // Status of the step
  status: "start" | "end";
  // Name of the specific task (e.g., search query)
  name?: string;
  // Data related to the step's outcome or details
  data?: any;
}
```

**Possible `step` Values:**

- `report-plan`: The system is generating or processing the overall report plan.
- `serp-query`: The system is performing a Search Engine Results Page (SERP) query.
- `task-list`: The system is generating or processing a list of specific research tasks.
- `search-task`: The system is executing a specific search task. This step includes the `name` parameter.
- `final-report`: The system is compiling or finalizing the comprehensive research report.

**Possible `status` Values:**

- `start`: Indicates that the specified `step` has just begun.
- `end`: Indicates that the specified `step` has just finished.

**Example:**

```text
event: progress
data: {"step":"search-task","status":"start","name":"AI trends for this year"}

event: progress
data: {"step":"search-task","status":"end","name":"AI trends for this year","data":{"results_count": 15}}

```

---

### `error` Event

Sent when an error occurs during the research process that prevents the task from completing successfully or requires user attention.

**Description:** Signals that an error has occurred.

**Data Structure (`data` field):** A JSON string typically containing information about the error. A common structure is:

| Parameter | Type   | Description                                | Notes |
| :-------- | :----- | :----------------------------------------- | :---- |
| `message` | string | A human-readable description of the error. |       |

```typescript
interface ErrorEvent {
  // A human-readable description of the error.
  message: string;
}
```

**Example:**

```text
event: error
data: {"message":"Invalid query parameters."}

```

---

## Error Handling

Clients should always listen for the `error` event. Upon receiving an `error` event, the client should typically display the error message to the user and may consider the current research task terminated unless otherwise specified by the API's behavior.

## Client Code Example

This example demonstrates how to connect to the SSE endpoint using `EventSource` API and listen for the defined event types, specifically focusing on displaying `message` events.

```typescript
import { fetchEventSource } from "@microsoft/fetch-event-source";

const ctrl = new AbortController();

let report = "";
fetchEventSource("/api/sse", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // If you set an access password
    // Authorization: "Bearer YOUR_ACCESS_PASSWORD",
  },
  body: JSON.stringify({
    query: "AI trends for this year",
    provider: "google",
    thinkingModel: "gemini-2.0-flash-thinking-exp",
    taskModel: "gemini-2.0-flash-exp",
    searchProvider: "model",
    language: "en-US",
    maxResult: 5,
    enableCitationImage: true,
    enableReferences: true,
    promptOverrides: {
      systemInstruction:
        "You are an expert researcher. Keep answers concise and evidence-driven.",
    },
  }),
  signal: ctrl.signal,
  onmessage(msg) {
    const msgData = JSON.parse(msg.data);
    if (msg.event === "message") {
      if (msgData.type === "text") {
        report += msgData.text;
      }
    } else if (msg.event === "progress") {
      console.log(
        `[${data.step}]: ${msgData.name ? `${msgData.name} ` : ""}${
          msgData.status
        }`
      );
      if (msgData.data) console.log(msgData.data);
    } else if (msg.event === "error") {
      throw new Error(msgData.message);
    }
  },
  onclose() {
    console.log(report);
  },
});
```
