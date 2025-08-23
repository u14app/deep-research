# API Endpoints and AI SDK Migration Plan

## Current Analysis

### UI Flow Analysis

The current UI follows this interactive research flow:

1. **Topic Input** - User provides research topic + optional resources
2. **AI Questions** - System generates clarifying questions
3. **Feedback** - User provides answers/refinements
4. **Report Plan** - System creates structured research outline
5. **Research Execution** - Parallel search tasks with real-time updates
6. **Final Report** - Comprehensive markdown report with citations

### Current Architecture

- **Frontend**: React components with Zustand state management
- **Backend**: SSE streaming endpoint at `/api/sse`
- **Core Logic**: `DeepResearch` class in `/src/utils/deep-research/`
- **AI SDK**: v4.3.12 (stable version)

## API Design Options

### Option 1: Stateful Session-Based API (⭐ RECOMMENDED)

Create a session-based API that maintains research state server-side, perfectly mirroring the UI's interactive flow:

#### Core Endpoints

```text
POST   /api/research/sessions              # Create new research session
GET    /api/research/sessions/:id          # Get session state
POST   /api/research/sessions/:id/questions # Submit initial topic, get AI questions
POST   /api/research/sessions/:id/feedback  # Submit feedback/answers
POST   /api/research/sessions/:id/plan      # Generate research plan
POST   /api/research/sessions/:id/execute   # Start research execution
GET    /api/research/sessions/:id/results   # Get current results
POST   /api/research/sessions/:id/refine    # Submit refinement at any stage
DELETE /api/research/sessions/:id          # Delete session
GET    /api/research/sessions/:id/stream    # SSE stream for real-time updates
```

#### Session State Structure

```typescript
interface ResearchSession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  phase: 'topic' | 'questions' | 'feedback' | 'planning' | 'executing' | 'completed';
  topic: string;
  questions?: string;
  feedback?: string;
  reportPlan?: string;
  tasks?: SearchTask[];
  results?: SearchResult[];
  finalReport?: string;
  settings: {
    provider: string;
    thinkingModel: string;
    taskModel: string;
    searchProvider: string;
    language?: string;
    maxResults?: number;
  };
}
```

#### Advantages

- ✅ Perfectly mirrors UI flow
- ✅ Allows interruption/resumption at any stage
- ✅ Supports refinement and iteration
- ✅ Clean REST semantics
- ✅ Easy to test and debug
- ✅ Natural fit for building client SDKs

### Option 2: Stateless Single-Call API

Extend current approach with comprehensive input parameters:

#### Endpoints

```text
POST   /api/research/complete    # Full research with all parameters upfront
POST   /api/research/stream      # Enhanced SSE with interactive callbacks
```

#### Advantages

- ✅ Simple integration
- ✅ Stateless (scales better)
- ❌ No refinement capability
- ❌ All-or-nothing approach

### Option 3: Hybrid Approach

Combine both approaches for maximum flexibility:

- Stateful sessions for interactive use cases
- Single-call endpoints for automation
- Shared core logic and streaming

## AI SDK v5 Migration Assessment

### Current Status: AI SDK v4.3.12

### AI SDK v5 Key Changes

1. **Redesigned Chat Architecture** - Complete useChat overhaul
2. **Message Structure** - Parts array instead of content string
3. **Tool Handling** - Dynamic tools, inputSchema vs parameters
4. **Framework Updates** - Vue/Svelte restructured
5. **Provider Options** - Renamed from providerMetadata

### Benefits of v5

- ✅ **Better Streaming** - Content differentiation, concurrent streams
- ✅ **Dynamic Tools** - Runtime tool definition (great for MCP)
- ✅ **Improved Framework Support** - Better multi-framework integration
- ✅ **Typed Chat** - Could enhance future UI features

### Risks of v5

- ⚠️ **Beta Status** - APIs may still change (breaking changes in minor releases)
- ⚠️ **Major Migration** - Significant refactoring needed
- ⚠️ **No Tests** - Current codebase lacks comprehensive tests
- ⚠️ **Production Risk** - Could introduce instability

### Migration Impact Areas

1. **Frontend**: All useChat implementations need rework
2. **Backend**: streamText API changes minimal
3. **Provider Integration**: providerOptions renaming
4. **Tool Definitions**: Schema changes for search tools

### **RECOMMENDATION: Stay on AI SDK v4**

**Reasoning:**

- Current v4 is stable and working perfectly
- v5 benefits don't critically impact API implementation
- Focus resources on API development first
- Can migrate to v5 later when it's stable (likely v5.1+)

## Implementation Plan

### Phase 1: Core Session Infrastructure (Week 1)

#### 1.1 Session Management

- [ ] Create session store (Redis for production, in-memory for dev)
- [ ] Implement session middleware for auth/validation
- [ ] Add session cleanup/expiration logic
- [ ] Create session DTOs and validation schemas

#### 1.2 Base API Structure

```typescript
// /src/app/api/research/sessions/route.ts
export async function POST() {
  // Create new session
}

export async function GET() {
  // List user sessions
}
```

#### 1.3 Authentication System

- [ ] API key authentication
- [ ] Rate limiting per key
- [ ] Session ownership validation

### Phase 2: Research Flow Endpoints (Week 1-2)

#### 2.1 Questions Endpoint

```typescript
// /src/app/api/research/sessions/[id]/questions/route.ts
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Use existing askQuestions logic from useDeepResearch
  // Stream response or return complete questions
}
```

#### 2.2 Feedback & Planning

- [ ] Implement feedback processing (mirrors UI Feedback component)
- [ ] Create plan generation endpoint (uses writeReportPlan)
- [ ] Add plan modification/approval flow

#### 2.3 Research Execution

- [ ] Execute endpoint that triggers parallel search tasks
- [ ] Progress tracking via session state
- [ ] Partial results retrieval

### Phase 3: Real-time Updates (Week 2)

#### 3.1 Enhanced SSE Support

- [ ] Session-aware SSE endpoint: `/api/research/sessions/:id/stream`
- [ ] Event types: progress, message, reasoning, error, complete
- [ ] Reconnection support with session resume

#### 3.2 WebSocket Alternative

- [ ] Bidirectional communication for interactive refinements
- [ ] Live feedback during research phases

### Phase 4: Advanced Features (Week 3)

#### 4.1 Batch Operations

```typescript
POST /api/research/batch
{
  "requests": [
    {
      "topic": "AI trends 2025",
      "settings": {...}
    }
  ]
}
```

#### 4.2 Export & Templates

- [ ] Multiple export formats (JSON, Markdown, PDF)
- [ ] Research templates/presets
- [ ] Webhook notifications for completion

### Phase 5: Documentation & Testing (Week 3-4)

#### 5.1 API Documentation

- [ ] OpenAPI 3.0 spec generation
- [ ] Interactive Swagger UI
- [ ] Code examples in multiple languages

#### 5.2 Client SDKs

```typescript
// Example Python SDK usage
from deep_research import Client

client = Client(api_key="...")
session = client.create_session()
questions = session.ask_questions("AI trends 2025")
session.provide_feedback("Focus on enterprise applications")
report = session.execute_research()
```

#### 5.3 Testing Suite

- [ ] Integration tests for all endpoints
- [ ] Load testing for concurrent sessions
- [ ] Error handling validation

## Technical Implementation Details

### File Structure

```bash
/src/app/api/research/
├── middleware.ts                    # Auth, rate limiting, validation
├── sessions/
│   ├── route.ts                     # Session CRUD
│   └── [sessionId]/
│       ├── route.ts                 # Get session details
│       ├── questions/route.ts       # Ask questions phase
│       ├── feedback/route.ts        # Feedback phase
│       ├── plan/route.ts           # Planning phase
│       ├── execute/route.ts        # Execution phase
│       ├── results/route.ts        # Get current results
│       ├── stream/route.ts         # SSE endpoint
│       └── refine/route.ts         # Refinement at any stage
├── batch/route.ts                  # Batch processing
└── templates/route.ts              # Research templates

/src/utils/api/
├── session-manager.ts              # Session state management
├── api-deep-research.ts           # Extended DeepResearch for API
├── auth.ts                        # Authentication utilities
├── validation.ts                  # Request/response validation
└── types.ts                       # Shared API types
```

### Session State Management

```typescript
class SessionManager {
  async create(userId: string, settings: ResearchSettings): Promise<ResearchSession>
  async get(sessionId: string): Promise<ResearchSession | null>
  async update(sessionId: string, updates: Partial<ResearchSession>): Promise<void>
  async delete(sessionId: string): Promise<void>
  async listByUser(userId: string): Promise<ResearchSession[]>
  async cleanup(): Promise<void> // Remove expired sessions
}
```

### Extended DeepResearch Class

```typescript
class APIDeepResearch extends DeepResearch {
  constructor(
    options: DeepResearchOptions,
    private sessionManager: SessionManager,
    private sessionId: string
  ) {
    super(options);
  }

  // Override methods to save state after each phase
  async writeReportPlan(query: string): Promise<string> {
    const result = await super.writeReportPlan(query);
    await this.sessionManager.update(this.sessionId, { 
      reportPlan: result,
      phase: 'planning'
    });
    return result;
  }

  // Add session-aware streaming
  onMessage = (event: string, data: any) => {
    // Save progress to session
    // Emit to SSE streams
  }
}
```

## Migration Strategy

### Backward Compatibility

- Keep existing `/api/sse` endpoint unchanged
- New API runs alongside current implementation
- Gradual migration path for existing integrations

### Rollout Plan

1. **Week 1-2**: Internal testing with session API
2. **Week 3**: Beta release with documentation
3. **Week 4**: Production deployment with monitoring
4. **Week 5+**: Gather feedback, iterate

### Success Metrics

- API response times < 200ms for session operations
- 99.9% uptime for session management
- Complete feature parity with UI flow
- Comprehensive test coverage (>90%)

## Conclusion

**Recommended Approach:**

1. ✅ Implement stateful session-based API (Option 1)
2. ✅ Keep AI SDK v4 for stability
3. ✅ Focus on perfect UI flow replication
4. ✅ Add comprehensive testing and documentation
5. 📅 Consider AI SDK v5 migration in Q2 2025 when stable

This plan provides a robust, scalable API that maintains the sophisticated interactive research flow while offering the flexibility needed for various integration scenarios.
