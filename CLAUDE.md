# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # vite dev server
npm run build    # tsc -b && vite build (typecheck blocks build)
npm run lint     # eslint . (flat config in eslint.config.js)
npm run preview  # serve dist/
```

There is **no test runner configured** — don't claim "tests pass". To validate, run `npx tsc -b` for typecheck and `npm run lint` for style. UI changes need browser verification via `npm run dev`.

Deploy target is Vercel (`.vercel/` is gitignored; `vercel --prod` is the publish path).

## Stack & toolchain

- **Vite 8 + React 19 + TypeScript 6 + Tailwind v4** (@tailwindcss/vite plugin, not PostCSS). Tailwind config lives **inside `src/index.css`** under `@theme { … }` — there is no `tailwind.config.*`.
- State: **Zustand 5**. Several stores use `persist` + `localStorage` (theme, persona). UI state is in-component.
- Animation: framer-motion. Toasts: sonner. Icons: lucide-react.
- Path alias `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`). Use `@/...` for cross-module imports.
- TS is strict on `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` — type-only imports must be written `import type { … }`.
- The app is **Chinese-language UI**. Source comments, copy, and seed data are predominantly Chinese — preserve that voice when editing copy and identifiers like `'比分卡'`, `'AI 分身'`.

## High-level architecture

Single-page demo of a "vibe-coding" workshop. No router; `src/main.tsx` → `App.tsx` mounts `<VibeCodingPage />` directly.

### Two modules under `src/modules/`

- **`vibecoding/`** — the chat-driven workshop shell. `VibeCodingPage.tsx` is the giant (~8k LOC) top-level component that hosts the home prompt, conversation stream, composer, project list, and right-pane workspace dispatcher. All of the chat "card" widgets live alongside it (`Proposal*`, `Resource*`, `Mini*`, `Avatar*`, `Capability*`, `Stream`, `MentionPicker`, …). Seed/static catalog data sits in `ResourceLibraryData.ts`, `ProjectProductView.ts`, `*ConfigData.ts`.
- **`editor/`** — the headless "platform" the workshop produces into. Holds the **Zustand stores**, the workspace-tab dispatcher (`components/platform/`), the per-node view shells (`components/platform/views/`), the chat-side publish modal, and the static seed catalogs in `data/`.

`vibecoding` imports `editor` (stores + the workspace adapter). Don't reverse the dependency.

### Core conceptual model (see `editor/store/artifact-store.ts` and `editor/store/workspace-nodes.ts`)

The product is intentionally **artifact-flat**: a project is a workshop that produces individually addressable artifacts the "end-device AI" can recall.

- **`ProjectKind`**: `ai-avatar` | `mini-program` | `ops-proposal` | `web-app`. Drives default workspace layout and Layer-2 sub-tab labels.
- **`ArtifactKind`**: `persona-card` | `scene-card` | `mp-page` | `mp-agent` | `proposal-doc`. Each carries `triggers` (intent / entity / context), a `render` spec, and `targets` (publish destinations).
- **Workspace tabs are two-layered**:
  - **Layer 1** — `WorkspaceNodeKind` (preview, code, database, agent, persona, knowledge, skills, triggers, proposal-doc, proposal-dashboard, …). `DEFAULT_NODES_BY_KIND` decides which are auto-pinned per project kind; `ADDABLE_NODES_BY_KIND` lists everything that can be added via the `+` picker.
  - **Layer 2** — `ArtifactKind` sub-tabs **filtered by project kind** via `getSubKindsFor(node, projectKind)`. Labels also re-key by project (`scene-card` is "比分卡" under AI 分身 but "Feed 流" under 小程序 — see `SUB_TAB_LABELS_BY_PROJECT`).
- **Publish targets** (`publish-flow-store.ts`) are `platform × scene` pairs encoded as flat ids `${platformId}:${sceneId}` (e.g. `douyin:comment`, `douyin-xiaohua:search`). Always reference targets by this id so same-named scenes across platforms don't collide.
- **`useArtifactViewSync(title, kind)`** in `PlatformModulesAdapter.tsx` is the bridge: it `ensureProjectByTitle`s into the store and returns the resolved `{ projectId, workspaceTabs, activeTabId, activeNodeKind, activeSubKind, activeArtifact }` tuple the right pane renders from. New workspace nodes plug in through `WorkspaceNodeContent`.

When extending the model:
- Adding a project kind → update `DEFAULT_NODES_BY_KIND`, `ADDABLE_NODES_BY_KIND`, `SUB_TAB_LABELS_BY_PROJECT`, `FALLBACK_SUB_TAB_LABELS`, and the kind classifier / `SHAPE_BY_KIND` map at the top of `VibeCodingPage.tsx`.
- Adding a workspace node → update `NODE_LABELS`, `NODE_ICONS`, `SUB_KINDS_BY_NODE`, the relevant `ADDABLE_NODES_BY_KIND` entries, and add a render branch in `WorkspaceNodeContent`.
- Adding a publish scene → extend the `PUBLISH_PLATFORMS` catalog; the tree picker and job cards iterate it directly.

### Theming

Dark is the default. `<html>` carries `dark` from `index.html` and an optional `theme-light` class managed by `src/shared/storage/theme.ts` (Zustand + `persist`). The store **eagerly applies the class on module load** (see the IIFE-ish block at the bottom of `theme.ts`) so there's no FOUC before React mounts — preserve that behavior.

All color/spacing tokens are CSS variables declared in `src/index.css`:
- `@theme { … }` defines design tokens consumed by Tailwind v4 utility generation.
- `:root` declares **adaptive fill/divider/syntax/composer tokens** (`--fill-subtle`, `--divider`, `--syntax-keyword`, `--bubble-me-bg`, …) that `html.theme-light` remaps for light mode.
- `.theme-dark-scope` re-declares the dark palette so simulated phone/mini-app previews stay dark inside a light host.

When adding theme-sensitive UI, **consume the tokens** (`bg-[var(--fill-subtle)]`, `border-[var(--divider)]`) rather than hardcoding `bg-white/[0.04]` — hardcoded values won't flip in light mode.

## Conventions & gotchas

- `VibeCodingPage.tsx` is enormous on purpose — it's the single chat-shell surface. Prefer extracting **leaf widgets** into siblings under `vibecoding/components/` (mirroring `Proposal*`, `Resource*`, etc.) over restructuring the file.
- Many components carry their own static catalogs (mock data) co-located in a `*Data.ts` sibling. Treat these as part of the demo content — edit them when copy changes, don't try to centralize.
- Imports of types must use `import type` (verbatimModuleSyntax). Unused locals/params are lint errors, not warnings.
- `.claude/` is gitignored — local settings, skills, and worktrees there aren't checked in. The `Read Figma SVGs (not lucide approximations)` user preference in auto-memory still applies when restoring Figma designs.
