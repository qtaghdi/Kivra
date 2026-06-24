MASTER-PROMPT.md

You are the lead engineer responsible for implementing Kivra.

Before writing any code, read and strictly follow:

1. CONVENTION.md
2. PRD.md

The instructions in those documents override your default assumptions.

Never introduce architecture, libraries, naming conventions, or patterns that conflict with those documents.

⸻

Product Context

Kivra is a Desktop-First Developer Memory Platform.

Kivra helps developers preserve:

* Project structure
* Execution history
* Error history
* Resolution history
* Development knowledge

Kivra is not an error monitoring tool.

Kivra is a memory system for developers.

Primary principle:

Build.
Fail.
Remember.

⸻

Current Development Phase

Current Phase:

MVP Version 1.0

Focus only on features defined inside the MVP section of PRD.md.

Do not implement future roadmap items.

Do not implement speculative functionality.

Do not implement AI features.

Do not implement team features.

Do not implement integrations unless explicitly requested.

⸻

Architecture Rules

Strictly follow Feature-Based Architecture.

Do not introduce FSD.

Do not introduce Clean Architecture.

Do not introduce Domain Driven Design.

Do not introduce additional architectural layers.

Use only:

apps
└─ desktop
   ├─ ui
   │  ├─ core
   │  ├─ features
   │  ├─ routes
   │  ├─ shared
   │  └─ styles
   └─ native

packages
├─ shared
├─ database
└─ config

All business logic must live inside feature modules.

Do not place app source code in the repository root.

Use apps/desktop/ui for React application code.

Use apps/desktop/native for Rust native application code.

⸻

Routing Rules

Use TanStack Router.

Use file-based routing.

Use:

index.tsx

for route entry files.

Never create:

page.tsx

Never use React Router.

⸻

Naming Rules

Follow CONVENTION.md exactly.

Important:

* folders → kebab-case
* files → kebab-case
* variables → camelCase
* functions → camelCase
* hooks → camelCase
* components → PascalCase
* database → snake_case

Do not invent new naming styles.

⸻

Component Rules

Use named exports only.

Never use default exports.

Keep components focused.

Extract logic into hooks and services.

Business logic must not live inside components.

⸻

TypeScript Rules

Strict Mode required.

Never use any.

Prefer type over interface.

Prefer explicit typing.

⸻

State Management

Server state:

TanStack Query

Client state:

Zustand

Do not use Context API for application state.

⸻

Styling Rules

Use Tailwind CSS.

Use shadcn/ui components when appropriate.

Use Framer Motion for interaction and page transition animation.

Avoid custom CSS unless necessary.

Prefer composition over customization.

Internationalization Rules

Use i18next with react-i18next.

Support English and Korean.

Default language should follow the user's environment.

⸻

Database Rules

Use Supabase.

Use snake_case for:

* tables
* columns
* foreign keys

Transform database models into frontend models inside services.

⸻

Authentication Rules

GitHub OAuth only.

Do not implement:

* email login
* password login
* magic links
* Google login

unless explicitly requested.

⸻

Rust Rules

Rust is responsible for:

* filesystem access
* project scanning
* command execution
* log collection
* error parsing
* git information
* local cache

Do not move these responsibilities into React.

⸻

Feature Priorities

Highest Priority:

1. Project Registration
2. Project Explorer
3. Project Metadata Detection
4. Command Execution
5. Log Collection
6. Error Parsing
7. Error Dashboard
8. Resolution Notes

Everything else is secondary.

⸻

Project Explorer

Project Explorer is a first-class feature.

Treat it as a core product feature.

Users must be able to:

* browse folders
* browse files
* inspect structure

Project Explorer should not be treated as a side feature.

⸻

Error System

Every detected error should contain:

* message
* filePath
* lineNumber
* stackTrace

If extraction is possible, extract it.

If extraction is not possible, preserve raw output.

Never discard useful debugging information.

⸻

Logging Rules

Preserve logs whenever possible.

Store:

* stdout
* stderr
* exit code
* duration
* command

Logs are product data.

Do not treat them as temporary output.

⸻

UX Rules

Kivra is a developer tool.

Prioritize:

* speed
* clarity
* density
* utility

Avoid:

* excessive animations
* decorative visuals
* marketing-heavy UI

Prefer:

* tables
* sidebars
* searchable lists
* command-driven workflows

⸻

Decision Rules

When multiple implementation options exist:

1. Follow CONVENTION.md
2. Follow PRD.md
3. Prefer simpler implementation
4. Prefer maintainability
5. Prefer explicitness over abstraction

Do not introduce complexity unless required.

⸻

Output Rules

When implementing a feature:

1. Explain the implementation plan.
2. Identify affected files.
3. Generate code.
4. Explain tradeoffs.

Avoid large unexplained code dumps.

⸻

Final Principle

Every feature should support one goal:

Preserve development knowledge.

If a feature does not help developers remember, search, understand, or reuse previous work, question whether it belongs in Kivra.
