PRD.md

Kivra Product Requirement Document

Version: 1.0

⸻

Product Name

Kivra

Tagline

Build.
Fail.
Remember.

⸻

Product Overview

Kivra is a Desktop-First Developer Memory Platform.

Kivra automatically collects project structure, execution history, errors, stack traces, and developer notes.

The goal is not error monitoring.

The goal is preserving development knowledge.

Git stores code history.

Kivra stores problem-solving history.

⸻

Problem Statement

Developers repeatedly encounter the same problems.

Common issues:

* Previously solved errors are forgotten.
* Execution logs disappear after terminal sessions.
* Project context becomes fragmented over time.
* Team members repeat investigations.
* Debugging knowledge is not preserved.

Current workflow:

Problem
→ Fix
→ Forget

Desired workflow:

Problem
→ Fix
→ Store
→ Search
→ Reuse

⸻

Product Goals

Primary Goal

Preserve project knowledge.

Secondary Goals

* Store execution history.
* Store error history.
* Store resolution history.
* Create searchable project memory.
* Build a developer knowledge layer.

⸻

Target Users

Primary

* Solo Developers
* Indie Hackers
* Side Project Developers

Secondary

* Small Teams
* Startup Engineers

⸻

Platform

Desktop Application

Technology

* Tauri
* React
* Rust
* Supabase

⸻

Authentication

GitHub OAuth Only

No email login.

No password login.

Reason:

Target audience is developers.

⸻

Core Features

Feature 1

Project Registration

Users can register local projects.

User selects project folder.

Example

C:/Projects/kivra

System analyzes:

* package.json
* pnpm-workspace.yaml
* Cargo.toml
* pyproject.toml
* go.mod
* git repository

⸻

Feature 2

Project Explorer

Project Explorer is a core feature.

Display local project structure.

Example

apps/desktop/ui
├─ features
├─ shared
├─ routes
└─ core

Users can navigate files and folders.

⸻

Feature 3

Project Metadata Detection

Automatically detect:

* Project Name
* Runtime
* Framework
* Package Manager
* Git Repository
* Current Branch

Example

Project:
Kivra
Framework:
React
Package Manager:
pnpm
Branch:
main

⸻

Feature 4

Command Execution

Users can execute commands inside Kivra.

Examples

npm run dev
npm run build
npm run test
pnpm lint
cargo build
cargo test

⸻

Feature 5

Execution History

Store execution history.

Data

* command
* status
* duration
* timestamp
* project

⸻

Feature 6

Terminal Log Collection

Collect

* stdout
* stderr
* exit code

Store logs per execution.

⸻

Feature 7

Error Detection

Detect execution errors.

Examples

Cannot read properties of undefined
Module not found
Type error
Build failed

⸻

Feature 8

Error Parsing

Extract

* file path
* line number
* column number
* stack trace

Example

apps/desktop/ui/features/project/index.ts
Line 42
Column 13

⸻

Feature 9

Error History

Store every detected error.

Fields

* project
* execution
* timestamp
* error
* stack trace

⸻

Feature 10

Resolution Notes

Developers can save solutions.

Example

Cause
Undefined API response.
Resolution
Added optional chaining.

⸻

Feature 11

Knowledge Base

Create searchable knowledge.

Search by

* project
* file path
* error message
* note content

⸻

MVP Scope

Version 1.0

Must Include

* GitHub Login
* Project Registration
* Project Explorer
* Metadata Detection
* Command Execution
* Execution History
* Log Collection
* Error Parsing
* Error Dashboard
* Resolution Notes

Must Not Include

* AI
* Teams
* Slack
* Discord
* VSCode Extension

⸻

User Flow

First Launch

User launches Kivra.

↓

GitHub Login

↓

Create profile

↓

Open Dashboard

⸻

Register Project

Dashboard

↓

Add Project

↓

Select Folder

↓

Analyze Project

↓

Save Project

⸻

Execute Command

Project

↓

Run Command

↓

Capture Logs

↓

Store History

↓

Parse Errors

↓

Store Errors

⸻

Resolve Error

Error Detail

↓

Add Resolution Note

↓

Mark Resolved

⸻

Screens

Dashboard

Display

* Projects
* Runs Today
* Open Errors
* Recent Activity

⸻

Projects

Display

* Project Name
* Runtime
* Framework
* Branch
* Last Execution

⸻

Project Detail

Tabs

* Explorer
* Runs
* Errors
* Knowledge
* Settings

⸻

Explorer

Display project tree.

File and folder navigation.

⸻

Runs

Display execution history.

Columns

* Command
* Status
* Duration
* Timestamp

⸻

Errors

Display error list.

Columns

* Message
* File Path
* Line
* Status

⸻

Error Detail

Display

* Message
* Stack Trace
* Source Location
* Related Runs
* Resolution Notes

⸻

Knowledge

Display searchable notes and solutions.

⸻

Database Schema

users

* id
* github_id
* username
* avatar_url
* created_at

⸻

projects

* id
* owner_id
* name
* runtime
* framework
* package_manager
* branch
* repository_url
* created_at

⸻

runs

* id
* project_id
* command
* status
* duration
* created_at

⸻

logs

* id
* run_id
* level
* content
* created_at

⸻

errors

* id
* project_id
* run_id
* error_code
* message
* file_path
* line_number
* column_number
* stack_trace
* created_at

⸻

notes

* id
* error_id
* content
* created_at

⸻

Future Features

Version 2

* Error Deduplication
* Search
* Tags
* Markdown Export
* Git Commit Tracking
* Branch History

⸻

Future Features

Version 3

* AI Error Analysis
* AI Root Cause Detection
* AI Fix Suggestions
* Similar Error Discovery
* Semantic Search

⸻

Future Features

Version 4

* VSCode Extension
* JetBrains Plugin
* Team Workspace
* GitHub PR Integration
* Slack Integration
* Discord Integration

⸻

Success Metrics

Users can:

* Register projects.
* Execute commands.
* View project structure.
* Track execution history.
* Review errors.
* Save solutions.
* Search previous resolutions.

If a developer can find a previously solved issue in under 30 seconds, Kivra succeeds.

⸻

Product Principle

Build.
Fail.
Remember.

Every problem solved today should be available tomorrow.
