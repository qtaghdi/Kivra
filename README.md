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
