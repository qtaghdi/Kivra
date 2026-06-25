# AGENTS.md

Guidance for coding agents working in this repository.

## Project Context

Kivra is a desktop-first developer memory app. It registers local projects,
captures command runs, stores logs and detected errors, and keeps resolution
notes searchable.

This branch extends `main` with external run capture:

- zsh shell integration writes captured runs under `~/.kivra/captured-runs`
- the desktop native layer reads captured runs back into the Runs UI
- a JetBrains IDE plugin captures Run/Debug console output
- `packages/protocol` owns the language-neutral captured-run contract

## Repository Layout

```text
apps/
  desktop/
    renderer/        React, TypeScript, TanStack Router, Tailwind
    native/          Tauri Rust native core

plugins/
  jetbrains/         Kotlin-only JetBrains IDE plugin

packages/
  config/
  database/
  shared/
  protocol/          shared app-plugin contracts, schemas, fixtures

tools/
  install-shell-capture.mjs
  kivra-shell-stream.mjs
  trace-diagnose.mjs
  validate-protocol-fixtures.mjs
```

Do not put IDE integrations in `apps/`. `apps/` is for standalone Kivra apps.
IDE integrations belong in `plugins/`. Shared contracts belong in
`packages/protocol`.

## Architecture Rules

- Renderer code belongs in `apps/desktop/renderer`.
- Rust native code belongs in `apps/desktop/native`.
- Do not use `apps/desktop/ui`.
- Renderer code must not directly read the filesystem or execute shell commands.
- Local system access belongs in the Rust native layer.
- Renderer-to-native communication goes through Tauri IPC commands.
- Use feature-based architecture in the renderer; do not use FSD.

## Coding Conventions

- All source code, comments, and documentation should be written in English.
- Use kebab-case for folders and files.
- Use named exports in TypeScript.
- Prefer `type` over `interface`.
- Do not use TypeScript `enum`; use const objects with string values.
- Use absolute renderer imports with `@/`.
- Route files use `index.tsx`; do not use `page.tsx`.
- Keep components focused; extract hooks, services, or child components when a
  component grows too large.

## Captured Run Protocol

Captured runs are written under:

```text
~/.kivra/captured-runs/<project-key>/<run-id>
```

Run directories use this layout:

```text
start.json
events.jsonl
end.json     # optional until the producer can report completion metadata
```

The sibling `index.jsonl` file stores summary rows for diagnostics.

`packages/protocol` is the source of truth for:

- protocol version
- JSON Schemas
- TypeScript protocol types
- example fixtures
- captured-run file layout

The JetBrains plugin is Kotlin-only. Do not try to make it import TypeScript
runtime code from `packages/protocol`. Kotlin producers should follow the JSON
Schemas and fixtures instead.

When changing the captured-run format, update all relevant producers/readers:

- `tools/kivra-shell-stream.mjs`
- `plugins/jetbrains/src/main/kotlin/ai/kivra/jetbrains/KivraCapturedRunWriter.kt`
- `apps/desktop/native/src/lib.rs`
- `packages/protocol`
- `tools/trace-diagnose.mjs`

Keep `protocolVersion` backward-compatible where possible. The Rust reader
should continue to tolerate legacy captured runs without `protocolVersion`.

## Commands

Install dependencies:

```bash
pnpm install
```

Run browser preview:

```bash
pnpm dev
```

Run the real desktop app:

```bash
pnpm desktop:tauri:dev
```

Build desktop renderer:

```bash
pnpm build
```

Check Rust native code:

```bash
cargo check --manifest-path apps/desktop/native/Cargo.toml
```

Check protocol fixtures:

```bash
pnpm protocol:check
```

Build or test the JetBrains plugin:

```bash
pnpm jetbrains:build
pnpm jetbrains:test
```

Install or refresh shell capture integration:

```bash
pnpm trace:install-shell
```

Diagnose capture state:

```bash
pnpm trace:diagnose /path/to/project
```

## Verification Guidance

- For renderer or service changes, run `pnpm build`.
- For Rust native changes, run `cargo check --manifest-path apps/desktop/native/Cargo.toml`.
- For captured-run protocol changes, run `pnpm protocol:check`.
- For JetBrains plugin changes, run `pnpm jetbrains:test`.
- If Gradle needs to write under `~/.gradle`, the command may require elevated
  filesystem permissions in sandboxed environments.

## Branch-Specific Notes

Compared with `main`, this branch adds the trace-agent capture path. Be careful
when editing files touched by that work:

- the desktop app now merges native command runs with captured external runs
- project registration syncs project paths for shell capture
- shell capture depends on `~/.kivra/trace-projects.json`
- JetBrains capture only records projects already registered in Kivra
- captured output is sanitized before being stored

Do not move `plugins/jetbrains` into `apps/`. It is an IDE extension, not a
standalone Kivra app.
