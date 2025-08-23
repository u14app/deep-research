# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

### Development

```bash
pnpm dev              # Start development server with Turbopack
pnpm build            # Production build
pnpm build:standalone # Standalone build for Docker deployment
pnpm build:export     # Static export for CDN deployment
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Testing

Currently, there is no dedicated test suite configured. Consider running:

- `pnpm lint` to check code quality
- Manual testing of API endpoints and UI features

## High-Level Architecture

### Core Technology Stack

- **Framework:** Next.js 15 with App Router and Edge Runtime
- **Language:** TypeScript with strict mode
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand with persistent storage
- **AI Integration:** Vercel AI SDK for unified LLM access
- **Streaming:** Server-Sent Events (SSE) for real-time updates

### Agent Architecture

#### Dual-Model System

The system employs two distinct AI models with specialized roles:

**1. Thinking Model** (`thinkingModel`)

- **Purpose:** High-level reasoning, planning, and analysis
- **Tasks:** Report planning, SERP query generation, final synthesis
- **Features:** Uses `<think>` tags for internal reasoning that's hidden from output
- **Location:** `/src/utils/deep-research/index.ts`

**2. Task Model** (`taskModel`)

- **Purpose:** Execution-focused tasks with tool integration
- **Tasks:** Search result processing, data extraction, specific research tasks
- **Features:** Can leverage provider-specific tools (OpenAI search, Google grounding)
- **Optimization:** High-throughput models preferred for parallel processing

#### Research Pipeline Flow

```
1. Report Planning (Thinking Model)
   ↓
2. SERP Query Generation (Thinking Model)
   ↓
3. Parallel Search Execution (Task Model + Search Providers)
   ↓
4. Result Processing (Task Model)
   ↓
5. Final Report Synthesis (Thinking Model)
```

Each phase uses structured prompts with JSON schema validation for consistent outputs.

### System Architecture

#### Data Flow Pattern

```
User Input
    ↓
[Report Planner] → Generates structured research outline
    ↓
[Query Generator] → Creates targeted search queries
    ↓
[Search Orchestrator] → Parallel execution across providers
    ↓                     ├── AI Provider Search (if supported)
                         ├── External Search APIs
                         └── Local Knowledge Base
    ↓
[Result Processor] → Aggregates and deduplicates findings
    ↓
[Report Synthesizer] → Generates comprehensive final report
    ↓
User Output (Streaming)
```

#### Streaming Architecture (SSE)

- **Edge Runtime:** All API routes use edge runtime for global performance
- **Real-time Updates:** Progress events stream during research
- **Event Types:** `progress`, `message`, `reasoning`, `error`
- **Think Tag Processing:** Separates internal reasoning from user-visible output
- **Location:** `/src/app/api/sse/route.ts`

#### State Management Architecture

```
Zustand Stores (with persistence)
├── TaskStore       # Core research state and results
├── SettingStore    # User preferences and API keys
├── HistoryStore    # Research session history
├── KnowledgeStore  # Local document management
└── GlobalStore     # UI state and navigation
```

### Provider Architecture

#### Multi-Provider Abstraction

The system abstracts 12+ AI providers and 5+ search providers through unified interfaces:

```
User Request
    ↓
[Provider Router] → Determines provider based on settings
    ↓
[Provider Adapter] → Translates to provider-specific format
    ↓
[API Proxy] → Edge-deployed proxy endpoint
    ↓
[Provider API] → Actual provider service
```

#### Provider Integration Patterns

- **AI Providers:** `/src/app/api/ai/[provider]/[...slug]/route.ts`
- **Search Providers:** `/src/app/api/search/[provider]/route.ts`
- **Unified Interface:** Single `createAIProvider()` function
- **Feature Detection:** Automatic capability detection (built-in search, tools)
- **Multi-Key Support:** Load balancing across multiple API keys

### Core Components Structure

```
/src
├── app/
│   ├── api/
│   │   ├── ai/          # AI provider proxies (edge runtime)
│   │   ├── search/      # Search provider endpoints
│   │   ├── sse/         # Streaming research endpoint
│   │   └── mcp/         # Model Context Protocol server
│   └── [locale]/        # Internationalized pages
│
├── components/
│   ├── research/        # Research UI components
│   │   ├── topic.tsx    # Research input
│   │   ├── feedback.tsx # Interactive feedback
│   │   └── report.tsx   # Final report display
│   ├── internal/        # Core app components
│   └── ui/              # shadcn/ui components
│
├── utils/
│   ├── deep-research/   # Core research engine
│   │   ├── index.ts     # Main DeepResearch class
│   │   ├── prompts.ts   # Prompt engineering
│   │   └── provider.ts  # AI provider abstraction
│   ├── search/          # Search provider integration
│   ├── model.ts         # Model capability detection
│   └── error.ts         # Error handling utilities
│
└── store/               # Zustand state management
```

### Key Architectural Patterns

#### 1. Prompt Engineering System

- **Hierarchical Structure:** System → Task → Output → Conditional prompts
- **JSON Schema Validation:** Structured outputs with type safety
- **Reasoning Separation:** `<think>` tags for internal deliberation
- **Dynamic Localization:** Language-aware prompt generation
- **Location:** `/src/constants/prompts.ts`

#### 2. Error Handling & Recovery

- **Provider-Specific Parsing:** Custom error handlers per provider
- **Graceful Degradation:** Fallback to alternative providers
- **Task Isolation:** Individual task failures don't break pipeline
- **User-Friendly Messages:** Technical errors translated to actionable feedback

#### 3. Parallel Processing

- **Concurrency Control:** P-limit based task management
- **Resource Optimization:** Provider-specific rate limiting
- **State Synchronization:** Atomic updates to shared state
- **Progress Tracking:** Real-time status per parallel task

#### 4. Content Processing Pipeline

```
Raw Search Results
    ↓
Content Extraction (HTML → Markdown)
    ↓
Metadata Processing (titles, descriptions, images)
    ↓
Deduplication (source-level and content-level)
    ↓
Context Preparation (trimming, formatting)
    ↓
AI Processing Input
```

### Working with the Codebase

#### Adding New AI Providers

1. Create proxy route in `/src/app/api/ai/[new-provider]/`
2. Add provider configuration in `/src/utils/deep-research/provider.ts`
3. Update environment variables in `env.tpl`
4. Add provider to type definitions

#### Adding New Search Providers

1. Implement provider in `/src/utils/search/[provider].ts`
2. Add to search factory in `/src/utils/search/index.ts`
3. Create API endpoint if needed
4. Update provider types and settings

#### Modifying Research Logic

- **Core Logic:** `/src/utils/deep-research/index.ts`
- **Prompts:** `/src/constants/prompts.ts`
- **Model Selection:** `/src/utils/model.ts`
- **Search Integration:** `/src/utils/search/`

#### Component Conventions

- Use TypeScript interfaces for all props
- Follow shadcn/ui patterns for UI components
- Implement streaming updates where applicable
- Use Zustand stores for shared state
- Handle loading/error states consistently

### API Endpoints

#### Main APIs

- `POST /api/sse` - Start streaming research session
- `GET /api/sse/live` - Watch research via URL parameters
- `/api/mcp` - MCP server for AI service integration
- `/api/ai/[provider]/[...slug]` - AI provider proxies
- `/api/search/[provider]` - Search provider endpoints
- `/api/crawler` - Web content extraction

### Environment Configuration

Key environment variables (see `env.tpl` for complete list):

- **AI Keys:** `[PROVIDER]_API_KEY` (e.g., `OPENAI_API_KEY`)
- **Search Keys:** `TAVILY_API_KEY`, `FIRECRAWL_API_KEY`, etc.
- **MCP Config:** `MCP_AI_PROVIDER`, `MCP_THINKING_MODEL`, `MCP_TASK_MODEL`
- **Security:** `ACCESS_PASSWORD` for API protection
- **Provider URLs:** `[PROVIDER]_BASE_URL` for custom endpoints

### Performance Considerations

- **Edge Runtime:** All API routes optimized for edge deployment
- **Streaming First:** Real-time updates throughout research process
- **Parallel Processing:** Concurrent search execution with limits
- **Provider Optimization:** Automatic selection of best provider features
- **Caching:** Local knowledge base and research history persistence

### Deployment Notes

- Supports Vercel, Cloudflare Pages, Docker, and static export
- Edge runtime required for API routes
- PWA support with service worker configuration
- Multi-region deployment capable
- Environment-based configuration without code changes
