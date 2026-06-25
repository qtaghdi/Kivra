# Kivra

Build. Fail. Remember.

Kivra is a desktop-first developer memory app. It registers local projects,
captures command runs, stores logs and detected errors, and keeps resolution
notes searchable.

## Run Locally

Install dependencies:

```bash
pnpm install
```

Run the real desktop app:

```bash
pnpm desktop:tauri:dev
```

Use this mode when testing project folder selection, project scanning, file
reading, and command execution. Those features need the native desktop layer.

Run the browser UI preview:

```bash
pnpm dev
```

This mode is only for checking the React interface. Native actions are disabled
in the browser preview.

## Optional Supabase Sync

Create `apps/desktop/.env` from `apps/desktop/.env.example`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

When Supabase is configured, GitHub OAuth and cloud sync are enabled. Without
those values, Kivra continues to work as a local-only desktop app.

For desktop OAuth, add this redirect URL in Supabase Auth settings:

```text
http://127.0.0.1:3000/auth/callback
```

## Verify

```bash
pnpm build
cargo check --manifest-path apps/desktop/native/Cargo.toml
```

## External Log Capture

Kivra captures logs from registered local projects through zsh shell
integration. Install or refresh the integration with:

```bash
pnpm trace:install-shell
```

Open a new terminal or IDE terminal after installing it. Then run any command
from a cwd inside a registered project:

```bash
flutter run
pnpm build
python -m pytest
mvn test
```

Captured stdout/stderr events are written to:

```bash
~/.kivra/captured-runs
```

The captured-run file contract is owned by `packages/protocol`. Shell capture,
JetBrains capture, and the desktop reader should follow the same protocol
version and JSON file layout.

Check the current capture status with:

```bash
pnpm trace:diagnose /path/to/project
```

## JetBrains Run/Debug Capture

Kivra also includes a JetBrains IDE plugin for Run/Debug configurations. It
writes the same captured-run files under `~/.kivra/captured-runs`, so the
desktop app can display IDE-run logs without the command being launched from a
terminal. The plugin stays in `plugins/jetbrains` because it is an IDE extension,
not a standalone Kivra app.

Build the local plugin ZIP:

```bash
pnpm jetbrains:build
```

Install the ZIP from `plugins/jetbrains/build/distributions` in a JetBrains IDE.
The plugin only captures projects already registered in Kivra.
