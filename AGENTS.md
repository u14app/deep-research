# AGENTS.md

This document provides essential guidelines and technical references for AI agents (and human developers) working on the **Deep Research** repository. Adhere to these patterns to ensure consistency, security, and maintainability.

---

## 🚀 Development Workflow & Commands

The project uses **pnpm** as the primary package manager.

### Core Commands

- **Install Dependencies**: `pnpm install`
- **Development Server**: `pnpm dev` (Runs at `http://localhost:3000`)
- **Build Project**: `pnpm build`
- **Static Export**: `pnpm build:export` (Generates `out/` directory)
- **Standalone Build**: `pnpm build:standalone`
- **Linting**: `pnpm lint`

### Testing

- **Status**: Currently, there are no automated tests in the codebase.
- **Guideline**: If adding tests, use **Vitest** or **Jest** following standard Next.js patterns. Place test files next to the code they test (e.g., `ComponentName.test.tsx`) or in a `__tests__` directory.
- **Single Test**: To run a single test (if added), use `pnpm vitest run path/to/file.test.ts`.

---

## 📂 Project Structure

- `src/app`: Next.js App Router (Pages, API routes, Layouts).
- `src/components`: UI components.
  - `ui/`: Shadcn primitives.
  - `Internal/`: Custom shared components.
  - `Research/`, `Knowledge/`, etc.: Feature-specific components.
- `src/hooks`: Custom React hooks for business logic and state interaction.
- `src/libs`: External service integrations (e.g., MCP server logic).
- `src/store`: Zustand stores for global state and persistence.
- `src/utils`: Helper functions and core deep research logic.
- `src/locales`: I18n translation files (JSON).

---

## 🎨 Code Style & Conventions

### 1. TypeScript & Types

- **Strict Mode**: `strict: true` is enabled in `tsconfig.json`. Always provide explicit types for function parameters and return values.
- **Global Types**: Core business logic types (e.g., `SearchTask`, `Knowledge`, `Source`) are defined in `src/types.d.ts`. Check this file before creating new interfaces.
- **Explicit Any**: While `@typescript-eslint/no-explicit-any` is currently `off`, avoid `any` unless absolutely necessary for external library compatibility. Prefer `unknown` or specific interfaces.
- **Zod**: Use **Zod** for schema validation, especially for AI response parsing and API request bodies. See `src/app/api/mcp/server.ts` for examples.

### 2. React & Next.js

- **App Router**: This project uses the Next.js App Router.
- **Client Components**: Use `"use client";` at the top of files that require browser APIs or React hooks (state, effects).
- **Dynamic Imports**: Use Next.js `dynamic()` for heavy components or those that rely on browser-only libraries (e.g., `MagicDown`, `Mermaid`).
- **Hooks**: Prefer custom hooks for complex logic (e.g., `useDeepResearch`, `useKnowledge`).

### 3. Components & UI

- **Shadcn UI**: UI primitives are located in `@/components/ui`. Do not modify them directly; extend them or create wrappers in `src/components/Internal`.
- **Styling**: Use **Tailwind CSS**. Follow mobile-first responsive design patterns.
- **Icons**: Use **lucide-react**.
- **I18n**: All UI strings must use `useTranslation` from `react-i18next`. Use `t("key.path")` for all labels.

### 4. State Management

- **Zustand**: Used for global state and persistence.
- **Persistence**: Most stores use the `persist` middleware (e.g., `useTaskStore` in `src/store/task.ts`) to save research data in `localStorage`.
- **Radash**: Use **radash** utilities for common operations like `pick`, `isString`, `isObject`, etc.

### 5. Imports

- **Path Alias**: Always use the `@/` prefix for absolute imports from the `src` directory.
- **Ordering**:
  1. React/Next.js core
  2. Third-party libraries
  3. Components (Internal/UI)
  4. Hooks & Stores
  5. Utils & Types

---

## 🛠 Backend & API Patterns

### 1. Error Handling

- Use the `parseError` utility from `@/utils/error.ts` to standardize error messages.
- In async functions, use `try...catch...finally` to manage loading states and error reporting.
- Standardized API error format: `{ isError: true, content: [{ type: "text", text: "..." }] }`.

### 2. API Routes

- **SSE API**: Located at `src/app/api/sse`. Handles real-time streaming research reports.
- **MCP Server**: Located at `src/app/api/mcp`. Implements the Model Context Protocol for tool use by other AI agents.
- **Proxying**: The project proxies various AI and search providers via `next.config.ts` rewrites to avoid CORS issues and manage keys.

### 3. Environment Variables

- Refer to `env.tpl` for all available environment variables.
- Critical variables include `GOOGLE_GENERATIVE_AI_API_KEY`, `TAVILY_API_BASE_URL`, and `ACCESS_PASSWORD`.
- Never commit `.env` or `.env.local` files.

---

## 🔒 Security & Safety

- **Secrets**: Do not hardcode API keys or credentials.
- **Sanitization**: Use Zod to sanitize and validate all external inputs (web search results, user input).
- **Destructive Actions**: Avoid `rm -rf` or history rewriting in git unless explicitly requested.

---

## 🤖 Agent Instructions

- **Read First**: Always read the relevant file and its neighbors before proposing edits.
- **Follow Patterns**: If adding a new component, look at `src/components/Research/SearchResult.tsx` for a reference implementation.
- **Keep it Focused**: Make small, cohesive changes. Avoid unrelated refactors.
- **Validate**: Run `pnpm lint` and `pnpm build` to ensure your changes don't break the build.
- **Communication**: Summarize what changed, where, and why. Call out tradeoffs, assumptions, and known limitations. If validation could not be run, say so explicitly.
- **Clarity**: Prefer clarity and simplicity over cleverness. Preserve existing behavior unless the task explicitly requires changes.
- **UI Consistency**: Ensure all new UI elements support both light and dark modes using Tailwind `dark:` classes.
