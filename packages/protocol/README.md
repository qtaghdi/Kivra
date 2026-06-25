# @kivra/protocol

Language-neutral contracts shared by Kivra apps, plugins, and tools.

The JetBrains plugin is Kotlin-only, so this package is not intended to be a
runtime dependency for every producer. Instead, it owns the protocol version,
file layout, JSON Schemas, and fixtures that each implementation follows.

## Captured Run Protocol

Captured runs are written under:

```text
~/.kivra/captured-runs/<project-key>/<run-id>
```

Each run directory contains:

```text
start.json
events.jsonl
end.json     # optional until the producer can report completion metadata
```

The sibling `index.jsonl` file stores one summary row per run for quick
diagnostics.

## Producers

- `shell`: `tools/kivra-shell-stream.mjs`
- `jetbrains`: `plugins/jetbrains`
- `vscode`: reserved for a future VS Code extension

Kotlin producers should follow the schemas in `schemas/` and use the fixtures in
`fixtures/` for compatibility tests.
