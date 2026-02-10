# AGENTS

This file describes how automated coding agents (and humans) should work in this repository.

## Scope

- Applies to the entire repository unless a deeper `AGENTS.md` exists in a subdirectory.

## Goals

- Keep changes small, focused, and easy to review.
- Preserve existing behavior unless the task explicitly requires behavior changes.
- Prefer clarity over cleverness.

## Working Agreement

- Read relevant files before editing.
- Reuse existing patterns and conventions in the codebase.
- Do not make unrelated refactors while implementing a task.
- Add or update tests when behavior changes.
- Run the smallest relevant validation (tests/lint/typecheck) before finishing.

## Safety

- Never commit secrets, tokens, or private keys.
- Avoid destructive actions (`rm -rf`, history rewriting) unless explicitly requested.
- If unexpected local changes are present, do not revert them unless asked.

## Communication

- Summarize what changed, where, and why.
- Call out tradeoffs, assumptions, and known limitations.
- If validation could not be run, say so explicitly.

## File/Code Style

- Follow existing formatting and lint rules.
- Keep functions and modules cohesive.
- Use descriptive names and add comments only where intent is non-obvious.

## Preferred Workflow

1. Understand the request and inspect the relevant code.
2. Implement the minimal correct change.
3. Validate with targeted checks.
4. Provide a concise summary with touched files.
