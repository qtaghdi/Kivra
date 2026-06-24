design-system.md

Kivra Design System

Version: 1.0

⸻

Philosophy

Kivra is not a SaaS dashboard.

Kivra is not a marketing product.

Kivra is a developer tool.

Design decisions should prioritize:

* Clarity
* Density
* Speed
* Focus
* Utility

Over:

* Visual excitement
* Decorative design
* Marketing aesthetics

⸻

Design References

Primary References

* Linear
* Raycast
* VS Code
* GitHub Desktop

Secondary References

* Notion
* Cursor
* Arc Browser

Avoid References

* Stripe Dashboard
* Modern SaaS Landing Pages
* Productivity Templates
* Analytics Dashboards

⸻

Design Keywords

The product should feel:

* Technical
* Quiet
* Dense
* Precise
* Professional
* Minimal

The product should not feel:

* Playful
* Colorful
* Gamified
* Corporate
* Marketing-oriented

⸻

Theme

Dark First

Light theme is optional.

Dark theme is the primary experience.

⸻

Color System

Background

--background: 220 14% 7%;

Surface

--card: 220 13% 9%;

Foreground

--foreground: 220 12% 92%;

Muted

--muted: 220 12% 13%;
--muted-foreground: 220 8% 58%;

Border

--border: 220 10% 18%;

Primary

--primary: 0 0% 100%;
--primary-foreground: 220 14% 7%;

Destructive

--destructive: 0 72% 52%;

⸻

Color Rules

Do not use colorful accents.

Do not use gradients.

Do not use brand colors.

Do not use green GitHub buttons.

Use monochrome by default.

Color should communicate state only.

Allowed state colors:

* Success
* Warning
* Error

⸻

Typography

Primary Font

Inter

Alternative

Geist
Pretendard

Code Font

JetBrains Mono

Use monospace for:

* Commands
* Logs
* Stack traces
* File paths
* Git branches

⸻

Spacing

Prefer compact spacing.

Avoid large empty areas.

Bad

Huge cards
Large hero sections

Good

Dense tables
Compact panels
Split layouts

⸻

Border Radius

Global

8px

Do not use:

20px
24px
9999px

Avoid pill-shaped UI.

⸻

Shadows

Use minimal shadows.

Preferred:

box-shadow: none;

or

box-shadow: 0 1px 2px rgba(0,0,0,.2);

Avoid floating card designs.

⸻

Layout Philosophy

Prefer:

* Sidebars
* Tables
* Panels
* Split views

Avoid:

* Dashboard cards
* Hero layouts
* Centered marketing layouts

⸻

Navigation

Application layout:

Sidebar
├─ Projects
└─ Current Project

Sidebar is always visible after login.

Project-specific workflows belong inside the project detail tabs.

Do not duplicate project tabs in the sidebar.

⸻

Login Screen

Bad

Centered card
Large empty space
Marketing copy

Good

Simple
Focused
Minimal

Layout

Kivra
Build. Fail. Remember.
Capture the work your terminal forgets.
Continue with GitHub
GitHub OAuth only

⸻

Logo System

The finalized favicon symbol lives at:

packages/shared/logo/img.png

Do not redraw, crop, recolor, mask, or geometrically modify the favicon symbol.

Wordmark system lives in:

packages/shared/logo

Required lockups:

* horizontal-lockup.svg
* compact-lockup.svg
* wordmark-only.svg

Use the horizontal lockup in the app sidebar and login screen.

Use the favicon symbol for browser favicon and native app icon surfaces.

Wordmark typography:

* Geist SemiBold
* Inter SemiBold fallback
* letter spacing: -0.03em

Spacing:

* icon-to-wordmark gap: 0.3x icon size
* compact stack gap: 0.45x icon size
* minimum clear space: 0.5x icon size

⸻

Dashboard

Dashboard is not a KPI dashboard.

Avoid:

12 large metric cards

Prefer:

Projects
Recent Runs
Recent Errors
Recent Notes

The dashboard should feel like a workspace.

⸻

Tables

Tables are primary UI elements.

Used for:

* Runs
* Errors
* Search Results
* Projects

Tables should be compact.

Row height:

36px ~ 40px

⸻

Project Explorer

Inspired by VS Code Explorer.

Requirements:

* Tree structure
* Compact rows
* Keyboard friendly
* Fast rendering

Avoid:

Card-based file browsers

⸻

Commands

Command input should feel like:

* Raycast
* VS Code Command Palette

Command execution is a core workflow.

Treat commands as first-class UI.

⸻

Error Views

Error pages should resemble:

* GitHub Actions logs
* Build logs
* IDE error panels

Not customer-facing error pages.

⸻

Animations

Use Framer Motion minimally.

Allowed:

* Page transitions
* Sidebar collapse
* Modal appearance

Avoid:

* Bounce
* Spring-heavy interactions
* Decorative animations

Speed is more important than animation.

⸻

Empty States

Avoid illustrations.

Avoid onboarding mascots.

Use text only.

Example:

No projects found.
Add your first project to begin.

⸻

Icons

Use Lucide Icons.

Keep icon size consistent.

Default:

16px
18px

Avoid oversized icons.

⸻

Component Style

Buttons

* Small
* Functional
* Sharp

Inputs

* Compact
* High contrast

Modals

* Utility focused

Cards

* Rarely used

Tables and panels should be preferred.

⸻

Visual Hierarchy

Priority order:

1. Content
2. Structure
3. Interaction
4. Decoration

Decoration should always be last.

⸻

Kivra Principle

The UI should feel like a tool.

Not a product showcase.

If a screen looks suitable for a landing page, redesign it.

If a screen looks suitable for daily engineering work, keep it.
