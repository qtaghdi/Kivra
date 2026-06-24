CONVENTION.md

Kivra Engineering Convention

Version: 1.0

⸻

Project Philosophy

Kivra is a Desktop-First Developer Memory Platform.

Kivra stores:

* Project structure
* Execution history
* Error history
* Resolution history
* Developer knowledge

Every implementation must prioritize:

* Readability
* Maintainability
* Scalability
* Type Safety
* Developer Experience

⸻

Technology Stack

Desktop

* Tauri

Frontend

* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* TanStack Router
* TanStack Query
* TanStack Table
* Zustand
* Shiki
* Framer Motion
* i18next

Internationalization

* react-i18next

Supported languages:

* English
* Korean

Language must follow the user's environment when possible.

Native

* Rust

Backend

* Supabase

Authentication

* GitHub OAuth Only

⸻

Language Rules

All code must be written in English.

All comments must be written in English.

All documentation must be written in English.

Do not use Korean in source code.

⸻

Naming Convention

Variables

Use camelCase.

Examples

projectId
errorMessage
createdAt
selectedProject

⸻

Functions

Use camelCase.

Examples

getProjectTree()
parseErrorLog()
createProject()
runCommand()

⸻

React Components

Use PascalCase.

Examples

ProjectTree
ErrorTable
RunHistory
ProjectExplorer

⸻

Hooks

Use camelCase.

Must start with “use”.

Examples

useProjects()
useProjectTree()
useErrors()

⸻

Types

Use camelCase.

Examples

project
errorLog
projectNode
runHistory

Type Alias preferred.

export type project = {}

⸻

Interfaces

Avoid interfaces unless required.

Prefer type.

Good

export type project = {}

Avoid

export interface Project {}

⸻

Enums

Use SCREAMING_SNAKE_CASE values.

Examples

export const RUN_STATUS = {
SUCCESS: "SUCCESS",
FAILED: "FAILED"
};

Avoid TypeScript enum.

⸻

Folder Naming

Use kebab-case.

Examples

project
error
run-history
project-explorer

⸻

File Naming

Use kebab-case.

Examples

project-tree.tsx
error-table.tsx
project-service.ts
use-projects.ts
project-store.ts

⸻

Route Naming

Use TanStack Router.

Route files use index.tsx.

Examples

routes
├─ index.tsx
├─ login
│  └─ index.tsx
├─ projects
│  ├─ index.tsx
│  └─ $project-id
│     ├─ index.tsx
│     ├─ runs
│     │  └─ index.tsx
│     └─ errors
│        └─ $error-id
│           └─ index.tsx

Never use page.tsx.

Always use index.tsx.

⸻

Architecture

Use Feature-Based Architecture.

Do not use FSD.

⸻

Project Structure

Repository Structure

apps
├─ desktop
│  ├─ ui
│  │  ├─ core
│  │  ├─ features
│  │  ├─ routes
│  │  ├─ shared
│  │  └─ styles
│  └─ native
│     └─ src
│
packages
├─ shared
├─ database
└─ config

Do not place application source code in the repository root.

Desktop UI source belongs in apps/desktop/ui.

Desktop native source belongs in apps/desktop/native.

⸻

Core Layer

Contains application-wide concerns.

ui/core
├─ auth
├─ database
├─ tauri
├─ router
├─ providers
└─ config

⸻

Feature Layer

Each feature owns its logic.

ui/features
├─ project
├─ run
├─ error
├─ docs
└─ settings

⸻

Feature Structure

project
├─ components
├─ hooks
├─ services
├─ stores
├─ types
├─ utils
└─ index.ts

⸻

Shared Layer

Reusable code only.

ui/shared
├─ ui
├─ hooks
├─ utils
├─ constants
├─ types
└─ lib

⸻

Import Rules

Use absolute imports.

Good

import { ProjectTree } from "@/features/project";

Bad

import { ProjectTree } from "../../../features/project";

⸻

Component Rules

One component per file.

Prefer composition.

Avoid inheritance.

Component files should remain under 300 lines.

If component grows:

* extract hook
* extract service
* extract child component

⸻

Export Rules

Use named exports.

Good

export function ProjectTree() {}

Bad

export default function ProjectTree() {}

⸻

TypeScript Rules

Strict Mode required.

Never use any.

Prefer unknown.

Good

const data: unknown;

Bad

const data: any;

⸻

State Management

Server State

Use TanStack Query.

Examples

* projects
* runs
* errors
* notes

⸻

Client State

Use Zustand.

Examples

* sidebar
* selectedProject
* uiSettings

⸻

Context API

Do not use Context API for application state.

Only use for provider composition.

⸻

Database Convention

Tables

Use snake_case.

Examples

users
projects
runs
error_logs

⸻

Columns

Use snake_case.

Examples

project_id
created_at
updated_at
error_message

⸻

Primary Key

Always

id

⸻

Foreign Key

Always

resource_id

Examples

project_id
run_id
user_id
error_id

⸻

Application Models

Database

project_id
created_at
error_message

Frontend

projectId
createdAt
errorMessage

Transformation must happen inside service layer.

⸻

API Convention

JSON must use camelCase.

Example

{
"projectId": "123",
"errorMessage": "Failed",
"createdAt": "2026-01-01"
}

⸻

Logging Convention

Every log must contain

timestamp
level
projectId
message

Supported levels

INFO
WARN
ERROR
DEBUG

⸻

Error Convention

Every error must contain

errorCode
message
stackTrace
filePath
lineNumber

Examples

PROJECT_NOT_FOUND
RUN_FAILED
ERROR_PARSE_FAILED
AUTH_REQUIRED

⸻

Git Convention

Branch

feature/project-tree
feature/error-parser
fix/run-history
refactor/project-service
docs/update-readme

⸻

Commit

Use Conventional Commits.

feat:
fix:
refactor:
docs:
style:
test:
chore:

Examples

feat: add project explorer
fix: resolve run parser issue
refactor: simplify project service

⸻

Testing

Business logic must not live inside components.

Business logic belongs in:

services
hooks
utils

⸻

Documentation

Each feature must contain README.md.

README must describe:

* purpose
* responsibilities
* dependencies
* data flow

⸻

Project Tree Convention

Project Explorer is a core feature.

Node structure:

export type projectNode = {
id: string;
name: string;
path: string;
type: "file" | "folder";
children?: projectNode[];
};

⸻

Performance Rules

Avoid unnecessary re-renders.

Use memoization when required.

Virtualize large tables.

Do not load entire log files unless requested.

⸻

Security Rules

Never expose Supabase service keys.

Never expose secrets to the frontend.

Always use RLS.

Validate all external input.

⸻

Kivra Principle

Build.
Fail.
Remember.

Kivra is not a logging tool.

Kivra is a developer memory platform.

Every architectural decision should support long-term knowledge preservation.
