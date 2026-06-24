wireframe.md

Kivra Wireframe

Version: 1.0

⸻

Design References

References:

* Linear
* Notion
* Raycast
* GitHub Desktop
* VS Code Explorer

Principles:

* Dense
* Fast
* Minimal
* Utility First

Avoid:

* Large cards
* Marketing layouts
* Dashboard bloat
* Excessive whitespace

⸻

App Layout

Pre-Auth Layout

Before GitHub authentication, do not render the app shell or sidebar.

┌────────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│                     Kivra                                  │
│                     Continue with GitHub                   │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘

Post-Auth Layout

Global Layout

┌────────────────────────────────────────────────────────────┐
│ Top Bar                                                   │
├──────────────┬─────────────────────────────────────────────┤
│              │                                             │
│              │                                             │
│   Sidebar    │              Content Area                  │
│              │                                             │
│              │                                             │
├──────────────┴─────────────────────────────────────────────┤
│ Status Bar                                                 │
└────────────────────────────────────────────────────────────┘

⸻

Sidebar

The sidebar is visible only after GitHub authentication.

Width

240px

Items

Projects
Current Project

Example

Kivra
Projects
├─ Notiiv
├─ CBT Workbook
└─ Kivra
Current Project

⸻

Dashboard

Route

/

Layout

┌──────────────────────────────────────────┐
│ Welcome Back                             │
├──────────────────────────────────────────┤
│                                          │
│ Projects          12                     │
│ Runs Today        34                     │
│ Open Errors       5                      │
│ Notes             112                    │
│                                          │
├──────────────────────────────────────────┤
│ Recent Activity                          │
│                                          │
│ Build Failed                             │
│ Error Fixed                              │
│ Note Added                               │
│                                          │
└──────────────────────────────────────────┘

⸻

Projects Page

Route

/projects

Layout

┌──────────────────────────────────────────────────────────┐
│ Projects                                      [+ Add]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Name      Runtime   Framework   Branch     Updated       │
│                                                          │
│ Notiiv    Node      Next.js     main       2h ago        │
│ Kivra     Node      React       dev        now           │
│                                                          │
└──────────────────────────────────────────────────────────┘

⸻

Add Project Modal

┌────────────────────────────┐
│ Add Project                │
├────────────────────────────┤
│                            │
│ Select Folder             │
│                            │
│ [ Browse ]                │
│                            │
├────────────────────────────┤
│                            │
│ Runtime       React        │
│ Package       pnpm         │
│ Branch        main         │
│                            │
├────────────────────────────┤
│ Cancel      Create         │
└────────────────────────────┘

⸻

Project Detail

Route

/projects/:projectId

Layout

┌──────────────────────────────────────────────────────────┐
│ Kivra                                        main        │
├──────────────────────────────────────────────────────────┤
│ Explorer │                                                │
│ Runs     │                                                │
│ Errors   │               Main Content                     │
│ Notes    │                                                │
│          │                                                │
└──────────────────────────────────────────────────────────┘

⸻

Explorer

Route

/projects/:projectId

Layout

┌───────────────┬──────────────────────────────────────────┐
│ Project Tree  │                                          │
│               │                                          │
│ renderer      │                                          │
│ ├─ routes     │                                          │
│ ├─ features   │        File Preview                      │
│ ├─ shared     │                                          │
│ └─ core       │                                          │
│               │                                          │
└───────────────┴──────────────────────────────────────────┘

Ignored folders

node_modules
.git
dist
build
target
.next

⸻

Runs

Route

/projects/:projectId/runs

Layout

┌──────────────────────────────────────────────────────────┐
│ Runs                                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Command          Status     Duration     Time            │
│                                                          │
│ pnpm build       FAILED     12s          10:15           │
│ pnpm lint        SUCCESS    4s           10:12           │
│                                                          │
└──────────────────────────────────────────────────────────┘

⸻

Run Detail

Layout

┌──────────────────────────────────────────────────────────┐
│ pnpm build                                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Exit Code: 1                                             │
│ Duration: 12s                                            │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Terminal Output                                          │
│                                                          │
│ Error: Module not found...                               │
│                                                          │
└──────────────────────────────────────────────────────────┘

⸻

Errors

Route

/projects/:projectId/errors

Layout

┌──────────────────────────────────────────────────────────┐
│ Errors                                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Message              File           Status              │
│                                                          │
│ Module not found     app.tsx        OPEN                │
│ Type error           page.tsx       FIXED               │
│                                                          │
└──────────────────────────────────────────────────────────┘

⸻

Error Detail

Route

/projects/:projectId/errors/:errorId

Layout

┌──────────────────────────────────────────────────────────┐
│ Error Detail                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Message                                                  │
│ Module not found                                         │
│                                                          │
│ File                                                     │
│ renderer/routes/index.tsx                                │
│                                                          │
│ Line                                                     │
│ 42                                                       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Stack Trace                                              │
│                                                          │
│ Error...                                                 │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Resolution Notes                                         │
│                                                          │
│ Fixed import path.                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘

⸻

Create Resolution Note

┌────────────────────────────────────┐
│ Resolution Note                    │
├────────────────────────────────────┤
│                                    │
│ Cause                              │
│                                    │
│ [ textarea ]                       │
│                                    │
│ Resolution                         │
│                                    │
│ [ textarea ]                       │
│                                    │
├────────────────────────────────────┤
│ Cancel            Save             │
└────────────────────────────────────┘

⸻

Search

Route

/search

Layout

┌──────────────────────────────────────────────────────────┐
│ Search                                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [ Search... ]                                            │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Errors                                                   │
│ Notes                                                    │
│ Commands                                                 │
│                                                          │
│ Module not found                                         │
│ Fixed import path                                        │
│ pnpm build                                               │
│                                                          │
└──────────────────────────────────────────────────────────┘

⸻

Knowledge

Route

/knowledge

Layout

┌──────────────────────────────────────────────────────────┐
│ Knowledge Base                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Error Resolution Archive                                │
│                                                          │
│ TypeError Fix                                            │
│ Import Path Fix                                          │
│ Build Error Fix                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘

⸻

Settings

Route

/settings

Layout

┌──────────────────────────────────────────┐
│ Settings                                 │
├──────────────────────────────────────────┤
│                                          │
│ Language                                 │
│ Theme                                    │
│ GitHub Account                           │
│                                          │
└──────────────────────────────────────────┘

⸻

Visual Language

Typography

Inter
Geist
Pretendard

Theme

Dark First

Border Radius

8px

Design Style

Linear
Notion
GitHub Desktop

Animations

Subtle only

Use Framer Motion minimally.

Never prioritize animation over speed.ㅇ
