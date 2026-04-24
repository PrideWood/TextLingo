# AGENTS.md
## Project Direction
TextLingo is a personal language-learning workspace inspired by OpenMAIC-style generated learning experiences.
The product is not a general translation tool, not an API demo, and not an admin dashboard.
Its core goal is:
> Paste real language material → generate a structured learning session → study page by page → copy clean Markdown into Obsidian → build a learning habit.
Keep all future changes aligned with this direction.
---
## Current Scope
This branch focuses on the personal-use MVP.
Do not add the following unless explicitly requested:
- payment
- invite code system
- subscription or billing logic
- multi-user credit system
- heavy authentication
- admin dashboard
- database-backed SaaS features
A future branch may discuss invite codes and public access separately. Do not mix that into the current branch.
---
## Product Principles
### 1. Minimize user input
The main page should stay lightweight.
Users should mainly:
1. paste source text
2. click analyze
3. study the generated result
Avoid adding too many controls to the main page.  
Long-term preferences should live in settings or the user menu.
### 2. Preserve the learning context
Generated content must respect language roles:
- title: source language
- original text: source language
- quiz questions and options: source language
- translation: target language
- knowledge explanations: target language
- source snippets: source language
Do not accidentally generate English-source quizzes in Chinese unless the user explicitly wants that.
### 3. Preserve text structure
Do not flatten original text or translation into one paragraph.
Avoid destructive normalization such as:
```ts
text.replace(/\s+/g, " ")

Paragraph breaks and readable spacing are important for language learning and Markdown export.

4. Prefer page-based learning

The result view should feel like a learning workspace, not a long report.

Prefer:

* left outline navigation
* page-by-page sections
* original/translation side-by-side
* internal scrolling inside long sections
* smooth, subtle page transitions

Avoid returning to one endless scrolling page unless explicitly requested.

5. Keep Obsidian export central

Markdown export is a core feature, not an afterthought.

Generated Markdown should be clean, readable, and easy to paste into Obsidian.

Keep export formatting in a dedicated utility instead of duplicating it in components.

⸻

Technical Guardrails

Use the existing project stack and structure unless there is a clear reason to change it.

Keep API keys server-side only.

Do not expose private keys in frontend components.
Do not use NEXT_PUBLIC_ for LLM provider keys.

Provider/API logic should stay outside UI components.

Recommended separation:

* route handlers: request validation and response normalization
* provider files: model/API calls
* UI components: rendering and interaction
* export utilities: Markdown generation
* storage utilities: local settings and progress

Use a consistent API response shape:

{ ok: true, data: ... }

or:

{ ok: false, error: "Human-readable error message" }

Do not return raw provider errors directly to the user.

⸻

UI Guidelines

The interface should feel:

* calm
* readable
* modern
* study-oriented
* lightweight

Avoid:

* dense dashboards
* noisy controls
* raw JSON display
* excessive statistics on the homepage
* large admin-style panels

Use lucide icons sparingly and consistently.
Icon-only buttons must have accessible labels.

⸻

Quiz Rules

Quiz interaction should feel like practice.

Before submission:

* show questions and options
* hide answers and explanations

After submission:

* show score
* show correct answers
* show explanations
* allow retry/reset

Prefer one unified submit button for the quiz section.

⸻

Progress and Heatmap

Progress tracking should remain local unless a future user system is explicitly added.

The homepage should not be cluttered with full usage details.

Usage details and heatmap details should live in the user menu, modal, drawer, or similar secondary surface.

Reserve UI space for future login/avatar support, but do not implement a full auth system unless requested.

⸻

Development Priorities

When improving the project, prioritize:

1. correctness
2. preserving working features
3. learning flow
4. readability
5. Markdown export
6. UI polish
7. refactoring only when it reduces complexity

Do not make broad rewrites for small fixes.

When fixing bugs, identify the root cause before changing unrelated files.

⸻

Common Mistakes to Avoid

* Do not turn TextLingo into a generic translator.
* Do not turn the interface into an admin dashboard.
* Do not expose API keys to the client.
* Do not show quiz answers before submission.
* Do not flatten paragraph structure.
* Do not return prompt text, mock text, or preview text as final model output.
* Do not add billing, invite codes, or SaaS infrastructure in this branch.
* Do not scatter Markdown export logic across multiple components.

⸻

Working Style

For each change:

1. inspect the current implementation first
2. make the smallest safe change
3. keep existing features working
4. update types if data shape changes
5. keep UI consistent
6. report files changed and remaining TODOs

The long-term direction is:

A lightweight personal language-learning workspace, not a monetized SaaS platform yet.

