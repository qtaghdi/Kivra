LANDING-PAGE.md

Kivra Marketing Website

Version: 1.0

⸻

Goal

The marketing website should feel like a modern developer product.

It must not resemble a documentation site, dashboard, SaaS admin template, or marketing-heavy landing page.

The website should communicate one message:

Kivra remembers what development forgets.

Inspired by:

* Linear
* Vercel
* Raycast
* Arc Browser
* Cursor

Avoid:

* excessive gradients
* glassmorphism
* large illustrations
* stock graphics
* feature cards everywhere

Screenshots and product interactions should be the primary visual elements.

⸻

Design Principles

The product is the hero.

Every section should answer one question:

“How does Kivra help developers?”

Do not create decorative sections.

Every section must support the product.

⸻

Theme

Background

Almost black.

Use subtle elevation only.

Do not use colorful backgrounds.

Accent color

Use the existing Kivra accent.

Animations

Subtle.

Smooth.

Never distracting.

Motion should feel closer to Linear than Apple.

⸻

Page Structure

1. Navigation
2. Hero
3. Product Preview
4. Core Features
5. Workflow
6. IDE Integration
7. Download
8. Footer

Nothing else.

⸻

Navigation

Height

72px

Left

Logo

Kivra

Right

Download

GitHub

No additional navigation items.

⸻

Hero

This is the most important section.

Height

100vh

Split layout

Left

Headline

Remember everything
your project has already taught you.

Subtext

Git remembers code.

Kivra remembers why.

Buttons

Download for macOS

GitHub

Right

Interactive Three.js visualization.

⸻

Hero Visualization

Do not create a decorative particle scene.

The animation should visualize developer knowledge.

Example structure:

             Imports
Hooks      main.tsx      Exports
Errors     Notes      Runs

Nodes should slowly float.

Connections should animate softly.

Mouse movement creates subtle parallax.

Hovering a node highlights connected nodes.

No rotation.

No spinning.

No excessive bloom.

Performance is more important than visual complexity.

The hero should look like a living project graph.

⸻

Product Preview

Large screenshot.

Nearly full-width.

Use the actual Kivra application.

Do not use mockups.

Do not use fake browser frames.

Caption

File-aware project memory.

⸻

Core Features

Three columns.

Remember

Capture project context.

Understand

Visualize relationships.

Reuse

Find previous solutions.

Each feature should have:

small title

one sentence

small icon

No large cards.

⸻

Workflow

Single horizontal timeline.

Build → Fail → Capture → Understand → Remember → Reuse

Minimal.

No large diagrams.

⸻

IDE Integration

Show supported environments.

Desktop

VS Code

JetBrains

Terminal

Use monochrome icons.

No paragraphs.

⸻

Download

Current release.

Only macOS.

Primary CTA

Download for Apple Silicon

Secondary

GitHub Releases

Do not show Windows or Linux until officially supported.

⸻

Footer

Logo

Tagline

GitHub

AGPL-3.0 License

Copyright 2026 Sangmin Park

⸻

Motion

Use Framer Motion.

Fade

Slide

Scale

Opacity

Only.

Never animate every element simultaneously.

Avoid long entrance animations.

Everything should feel responsive.

⸻

Typography

Headlines

Large

Bold

Confident

Body

Compact

Readable

Avoid marketing language.

Speak like a developer tool.

⸻

Copywriting

Bad

“The most amazing AI-powered revolutionary platform.”

Good

“Remember every run, every error, and every solution.”

⸻

Technical Stack

React

Framer Motion

Three.js

React Three Fiber

Tailwind CSS

shadcn/ui

Use Three.js only inside the Hero section.

The rest of the website should remain lightweight.

⸻

Success Criteria

The website should feel like a product demonstration rather than a marketing page.

Visitors should understand what Kivra does within 10 seconds.

The first impression should communicate:

Professional.

Developer-first.

Focused.

Modern.

Quietly confident.
