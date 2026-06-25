architecture.md

Kivra Architecture

Version: 1.0

⸻

Purpose

This document defines the system architecture for Kivra.

Kivra is a Desktop-First Developer Memory Platform.

Kivra preserves development knowledge by collecting:

* Project structure
* Command execution history
* Terminal logs
* Detected errors
* Stack traces
* Resolution notes
* Searchable project memory

This document must be read together with:

1. docs/convention.md
2. docs/prd.md
3. docs/master-convention.md

⸻

Architecture Summary

Kivra uses a desktop-first architecture.

The application is divided into three major layers:

Renderer Layer
↓
Tauri IPC
↓
Rust Native Core

Persistent cloud data is stored in Supabase.

Renderer Layer
↓
Supabase
Rust Native Core
↓
Supabase

The Renderer Layer is responsible for user interaction.

The Rust Native Core is responsible for local system access.

Supabase is responsible for authentication, persistence, and authorization.

⸻

High-Level System Diagram

┌──────────────────────────────────────┐
│           Renderer Layer             │
│  apps/desktop/renderer               │
│                                      │
│  - Dashboard                         │
│  - Project Explorer                  │
│  - Runs                              │
│  - Errors                            │
│  - Knowledge                         │
│  - Search                            │
│  - Settings                          │
└───────────────────┬──────────────────┘
│
│ Tauri IPC
↓
┌──────────────────────────────────────┐
│          Rust Native Core             │
│  apps/desktop/native                 │
│                                      │
│  - Filesystem access                 │
│  - Project scanning                  │
│  - Command execution                 │
│  - Log collection                    │
│  - Error parsing                     │
│  - Git information                   │
│  - Local cache                       │
└───────────────────┬──────────────────┘
│
│ HTTPS
↓
┌──────────────────────────────────────┐
│              Supabase                │
│                                      │
│  - GitHub Auth                       │
│  - Postgres                          │
│  - RLS                               │
│  - Storage                           │
└──────────────────────────────────────┘

⸻

Repository Structure

Kivra uses a monorepo-style structure.

apps
├─ desktop
│  ├─ renderer
│  │  ├─ core
│  │  ├─ features
│  │  ├─ routes
│  │  ├─ shared
│  │  └─ styles
│  └─ native
│     └─ src
│
plugins
├─ jetbrains
│  └─ src
│
packages
├─ shared
├─ database
├─ config
└─ protocol

Do not use apps/desktop/ui.

The React application belongs in apps/desktop/renderer.

The Rust native application belongs in apps/desktop/native.

IDE integrations belong in plugins/.

Shared app-plugin contracts belong in packages/protocol.

The captured-run protocol is language-neutral. TypeScript code may import
@kivra/protocol, while Kotlin plugins must follow the JSON Schemas and fixtures
published by packages/protocol.

⸻

Layer Responsibilities

Renderer Layer

Location:

apps/desktop/renderer

Responsibilities:

* Render desktop application screens
* Handle user interaction
* Manage client state
* Manage server state
* Call Tauri commands
* Call Supabase client APIs
* Display project tree
* Display command runs
* Display logs
* Display errors
* Display resolution notes
* Display search results

The Renderer Layer must not directly access the filesystem.

The Renderer Layer must not execute shell commands.

The Renderer Layer must not parse local project files directly.

Those responsibilities belong to Rust Native Core.

⸻

Rust Native Core

Location:

apps/desktop/native

Responsibilities:

* Read local directories
* Build project tree
* Detect project metadata
* Read package files
* Execute commands
* Capture stdout
* Capture stderr
* Capture exit code
* Parse common error output
* Read Git branch
* Read Git remote URL
* Read Git commit hash
* Manage local cache when needed

Rust owns all local system operations.

The Renderer Layer communicates with Rust only through Tauri IPC commands.

⸻

Supabase

Responsibilities:

* GitHub OAuth authentication
* User profile persistence
* Project persistence
* Run persistence
* Log persistence
* Error persistence
* Note persistence
* Basic search persistence
* Authorization through RLS

Supabase service role keys must never be exposed to the frontend.

⸻

Data Ownership

Local Data

Local data belongs to the user’s machine.

Examples:

* Project path
* Project tree
* Local command output
* Git metadata
* Local cache

Rust is the source of truth for local data.

⸻

Cloud Data

Cloud data belongs to Supabase.

Examples:

* User profile
* Projects
* Runs
* Logs
* Errors
* Notes

Supabase is the source of truth for persisted data.

⸻

Renderer Architecture

The Renderer Layer uses Feature-Based Architecture.

Do not use FSD.

apps/desktop/renderer
├─ core
├─ features
├─ routes
├─ shared
└─ styles

⸻

Core Layer

Location:

apps/desktop/renderer/core

Purpose:

Application-wide configuration and infrastructure.

Suggested structure:

core
├─ config
├─ i18n
├─ providers
├─ router
├─ supabase
└─ tauri

core/config

Responsibilities:

* Environment variables
* App constants
* Runtime config

core/i18n

Responsibilities:

* i18next initialization
* English resources
* Korean resources
* Language detection

core/providers

Responsibilities:

* App-level providers
* QueryClientProvider
* Auth session bridge

core/router

Responsibilities:

* TanStack Router setup
* Route tree integration

core/supabase

Responsibilities:

* Supabase client initialization
* Shared Supabase sync helpers
* Common database model mapping

core/tauri

Responsibilities:

* Typed wrappers around Tauri IPC commands
* Command input/output types

Current MVP implementation uses `features/auth` for GitHub OAuth UI and auth service logic.

Do not create `core/auth` or `core/database` unless the implementation first outgrows the current `features/auth` and `core/supabase` split.

⸻

Feature Layer

Location:

apps/desktop/renderer/features

Current MVP features:

features
├─ auth
├─ project
├─ run
├─ error
└─ docs

Planned MVP features not yet implemented:

features
└─ search

Future candidate features:

features
└─ settings

Each feature should follow:

feature-name
├─ components
├─ hooks
├─ services
├─ stores
├─ types
├─ utils
└─ index.ts

README.md files are optional and should only be added when the feature needs local documentation.

⸻

Feature Responsibilities

auth

Responsible for:

* GitHub OAuth login UI
* Supabase auth session retrieval
* Logout
* Current user display

Main Supabase dependencies:

* auth session
* users table

⸻

project

Responsible for:

* Project registration
* Project list
* Project detail
* Project metadata display
* Project Explorer UI
* Project tree rendering

Main Rust dependencies:

* scan project
* read project tree
* detect metadata

Main Supabase dependencies:

* projects table

⸻

run

Responsible for:

* Command input UI
* Command execution request
* Run status display
* Run history
* Terminal output display

Main Rust dependencies:

* execute command
* collect stdout
* collect stderr
* return exit code

Main Supabase dependencies:

* runs table
* logs table

⸻

error

Responsible for:

* Error list
* Error detail
* Stack trace display
* Source location display
* Error status
* Resolution notes

Main Rust dependencies:

* parse error output

Main Supabase dependencies:

* errors table
* notes table

⸻

search

Responsible for:

* Basic keyword search
* Search previous resolutions
* Search errors
* Search notes
* Search file paths
* Search commands

MVP search must be simple.

Do not implement semantic search in MVP.

Do not implement AI search in MVP.

Search is part of the MVP, but it is not implemented yet. Create `features/search` when implementing the search flow.

⸻

docs

Responsible for:

* Knowledge view
* Resolution note browsing
* Future markdown export

Markdown export is not part of MVP.

⸻

settings

Responsible for:

* User settings
* Language settings
* UI preferences
* Local app configuration

Settings is a future candidate feature. Do not create `features/settings` during the MVP unless explicitly requested.

⸻

Shared Layer

Location:

apps/desktop/renderer/shared

Reusable code only.

Suggested structure:

shared
├─ ui
├─ hooks
├─ utils
├─ constants
├─ types
└─ lib

Feature-specific logic must not be placed in shared.

⸻

Routing Architecture

Kivra uses TanStack Router with file-based routing.

Route files use index.tsx.

Never use page.tsx.

Current MVP routes:

routes
├─ index.tsx
├─ login
│  └─ index.tsx
└─ projects
   └─ $project-id
      └─ index.tsx

Project detail tabs are represented by route search state:

* explorer
* runs
* errors
* knowledge
* settings

Future candidate routes:

routes
├─ projects
│  └─ $project-id
│     ├─ runs
│     ├─ errors
│     └─ knowledge
├─ search
└─ settings

Route files should only compose feature components.

Route files must not contain heavy business logic.

⸻

State Management Architecture

Server State

Use TanStack Query.

Server state examples:

* projects
* project detail
* runs
* logs
* errors
* notes
* search results

Client State

Use Zustand.

Client state examples:

* selected project
* sidebar open state
* command panel state
* local UI preferences
* current explorer selection

Context API

Do not use Context API for application state.

Context may be used only for provider composition.

⸻

Authentication Flow

Kivra uses GitHub OAuth only.

Before authentication, Kivra renders only the GitHub login screen.

The app shell, sidebar, project list, project detail, command execution, and persisted-memory views must not render before a valid Supabase session exists.

User
↓
Click "Continue with GitHub"
↓
Supabase Auth
↓
GitHub OAuth
↓
Supabase session created
↓
Renderer receives session
↓
User enters dashboard

Authentication responsibilities:

* Renderer starts OAuth flow.
* Supabase handles provider authentication.
* Renderer stores session through Supabase client.
* AuthGate checks session before rendering the app shell.
* Unauthenticated users only see the GitHub login screen.
* Authenticated users entering `/login` are redirected to the dashboard.
* RLS protects user-owned data.

Do not implement:

* email login
* password login
* magic link login
* Google login

⸻

Project Registration Flow

User
↓
Click "Add Project"
↓
Open native folder picker
↓
Rust receives selected path
↓
Rust scans project
↓
Rust detects metadata
↓
Renderer displays preview
↓
User confirms
↓
Project is saved to Supabase

Project scan should detect:

* project name
* runtime
* framework
* package manager
* git repository URL
* current branch
* current commit hash when available

Supported project indicators:

package.json
pnpm-workspace.yaml
Cargo.toml
pyproject.toml
go.mod
.git

⸻

Project Explorer Flow

User opens project
↓
Renderer requests project tree
↓
Tauri IPC calls Rust
↓
Rust scans filesystem
↓
Rust returns ProjectNode[]
↓
Renderer renders tree

Project node model:

export type ProjectNode = {
id: string;
name: string;
path: string;
type: "file" | "folder";
children?: ProjectNode[];
};

The project tree should exclude unnecessary heavy folders by default.

Recommended ignored folders:

node_modules
.git
dist
build
target
.next
.svelte-kit
.turbo
.cache
coverage

⸻

Command Execution Flow

User selects project
↓
User enters command
↓
Renderer calls Tauri command
↓
Rust executes command in project directory
↓
Rust captures stdout and stderr
↓
Rust captures exit code
↓
Rust returns run result
↓
Renderer stores run in Supabase
↓
Renderer stores logs in Supabase
↓
Renderer requests error parsing if run failed

Command execution result:

export type CommandRunResult = {
command: string;
exitCode: number;
stdout: string;
stderr: string;
startedAt: string;
finishedAt: string;
durationMs: number;
};

Rust should never silently discard stdout or stderr.

⸻

Error Parsing Flow

Run fails
↓
Rust parses stdout and stderr
↓
Rust extracts error candidates
↓
Renderer stores parsed errors
↓
User reviews errors in dashboard

Error parser should try to extract:

* message
* file path
* line number
* column number
* stack trace

Error model:

export type ParsedError = {
message: string;
filePath?: string;
lineNumber?: number;
columnNumber?: number;
stackTrace?: string;
rawOutput: string;
};

If parsing fails, preserve raw output.

Never discard debugging information.

⸻

Persistence Flow

Kivra stores data in Supabase.

Renderer
↓
Service Layer
↓
Supabase Client
↓
Postgres

Service layer responsibilities:

* call Supabase
* transform snake_case database rows to camelCase frontend models
* transform camelCase frontend inputs to snake_case database inserts
* hide database details from components

Components must not directly transform database rows.

⸻

Search Flow

Basic Search is part of MVP.

User enters keyword
↓
Renderer calls search service
↓
Search service queries Supabase
↓
Results include errors, notes, file paths, and commands
↓
Renderer displays grouped results

MVP search targets:

* error message
* file path
* command
* note content

Do not implement:

* semantic search
* embeddings
* AI search
* fuzzy ranking beyond simple keyword matching

⸻

Database Access Pattern

Each feature must own its service layer.

Example:

features/project/services/project-service.ts
features/run/services/run-service.ts
features/error/services/error-service.ts
features/search/services/search-service.ts

Services should expose frontend-friendly models.

Example:

export type Project = {
id: string;
ownerId: string;
name: string;
runtime?: string;
framework?: string;
packageManager?: string;
branch?: string;
repositoryUrl?: string;
createdAt: string;
};

Database row mapping should stay private to the service.

⸻

Tauri Command Boundary

Renderer must call Rust through typed wrappers.

Suggested wrapper location:

apps/desktop/renderer/core/tauri

Example:

export async function getProjectTree(projectPath: string): Promise<ProjectNode[]> {
return invoke<ProjectNode[]>("get_project_tree", { projectPath });
}

Rust command names should use snake_case.

Renderer wrapper names should use camelCase.

Example:

Rust command:
get_project_tree
Renderer wrapper:
getProjectTree

⸻

Rust Module Architecture

Current MVP structure:

apps/desktop/native/src
├─ lib.rs
└─ main.rs

Future candidate structure:

apps/desktop/native/src
├─ commands
├─ filesystem
├─ project
├─ runner
├─ parser
├─ git
├─ cache
└─ main.rs

commands

Tauri command entry points.

filesystem

Directory traversal and filesystem helpers.

project

Project metadata detection.

runner

Command execution and process handling.

parser

Error parsing.

git

Git metadata extraction.

cache

Local cache helpers.

⸻

Rust Responsibilities

Rust must handle:

* local path validation
* directory traversal
* ignored folders
* command working directory
* process execution
* stdout capture
* stderr capture
* exit code capture
* error parsing
* git metadata extraction

Rust must not handle:

* UI state
* React rendering
* user-facing layouts
* route state
* Supabase session UI

⸻

Supabase Responsibilities

Supabase must handle:

* GitHub OAuth
* user identity
* project persistence
* run persistence
* log persistence
* error persistence
* note persistence
* RLS authorization

Supabase must not handle:

* local filesystem access
* local command execution
* local project scanning

⸻

Data Model Overview

Core entities:

users
projects
runs
logs
errors
notes

Relationship overview:

users
└─ projects
└─ runs
├─ logs
└─ errors
└─ notes

A project belongs to a user.

A run belongs to a project.

Logs belong to a run.

Errors belong to a run and project.

Notes belong to an error.

⸻

Security Architecture

Local Security

Validate all local project paths.

Do not execute commands outside the selected project directory.

Do not expose arbitrary filesystem access to Renderer.

Do not send secrets to Supabase unless explicitly required.

Cloud Security

Use Supabase RLS.

Every user-owned table must be scoped by owner_id or a related project owner.

Never expose service role keys.

Only use public anon key in Renderer.

⸻

Performance Architecture

Project Tree

Large folders should be ignored by default.

Tree rendering should support large projects.

Virtualization should be considered if the tree becomes heavy.

Logs

Do not load entire large logs unless requested.

Long logs should be truncated in list views.

Full logs should be loaded only in detail views.

Tables

Use TanStack Table.

Use virtualization for large run/error lists.

⸻

UX Architecture

Kivra is a developer tool.

Prioritize:

* speed
* clarity
* density
* utility

Preferred UI patterns:

* sidebar navigation
* split panes
* data tables
* command input
* searchable lists
* compact cards
* source detail panels

Avoid:

* excessive animation
* decorative visuals
* marketing-heavy UI
* playful illustrations

Framer Motion should be used only for subtle transitions.

⸻

MVP Architecture Boundaries

MVP includes:

* GitHub login
* project registration
* project explorer
* metadata detection
* command execution
* execution history
* log collection
* error parsing
* error dashboard
* resolution notes
* basic search

MVP excludes:

* AI
* semantic search
* embeddings
* team workspace
* Slack integration
* Discord integration
* VSCode extension
* JetBrains plugin
* markdown export
* advanced error deduplication

⸻

Implementation Order

Recommended order:

1. Set up monorepo structure.
2. Set up Tauri + React app.
3. Set up routing.
4. Set up Supabase client.
5. Set up GitHub OAuth.
6. Set up feature folders.
7. Implement project registration.
8. Implement Rust project scanning.
9. Implement Project Explorer.
10. Implement command execution.
11. Implement run persistence.
12. Implement log persistence.
13. Implement error parsing.
14. Implement error dashboard.
15. Implement resolution notes.
16. Implement basic search.

Do not start AI features before MVP completion.

⸻

Final Principle

Kivra exists to preserve development knowledge.

Every architecture decision must support this flow:

Build
↓
Fail
↓
Capture
↓
Understand
↓
Remember
↓
Reuse
