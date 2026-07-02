# 🧠 Agent Operating Manual & Repository Harness

Welcome! This document governs all autonomous and semi-autonomous sessions in this repository. It defines the constraints, guidelines, and processes that you **MUST** follow.

---

## 1. Project Context & Target Audience

This is a Next.js web application called **English Vocab Typing Web (Englist)**. It is a personalized tool built specifically for **Boss** (Kantapong), a 28-year-old engineer at SCB TechX working on coding, AI, and AI agents.

### Learner Profile & Goals
- **Goal:** Real-world conversation, technical coding/AI terminology, and reading technical docs/issues.
- **Starting Level:** A1-A2.
- **Learning Philosophy:** Focus on sentence structure (Subject + Verb + Object), separating auxiliary verb `be` from main verbs, using correct tenses, and learning through spaced repetition (SRS).

---

## 2. Technical Stack & Architecture

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict type checking)
- **Styling:** Tailwind CSS v4 + PostCSS
- **Forms/Validation:** React Hook Form + Zod (`schemas/vocab.schema.ts`)
- **Database/Storage:** Local JSON database (`data/vocab.json`), Web Speech API (speech synthesis for pronunciation check), and Firebase configuration (available in `lib/firebase.ts` / `lib/db.ts`).
- **State/SRS:** Spaced Repetition System logic in `lib/srs.ts` and LocalStorage helper logic in `lib/storage.ts`.

---

## 3. The 5 Subsystems of the Harness

### 3.1 Instructions (This file & Root files)
You must read and adhere to the guidelines set in `harness/AGENTS.md` and check the session status before starting any task.

### 3.2 State Tracking (`harness/claude-progress.md`)
At the end of every session, you must document what you did, what files were changed, and the result of your verification. This enables the next agent or session to pick up exactly where you left off.

### 3.3 Scope Control (`harness/feature_list.json`)
You are constrained to work on **exactly one feature/task at a time**.
- Check `harness/feature_list.json` to find the next `todo` or `in-progress` item.
- Update its status to `in_progress` when you start, and `done` when fully verified.
- Do not work on tasks outside the current scope.

### 3.4 Verification & Validation (Tests & Builds)
Before declaring any task complete, you must verify that:
- TypeScript compilation passes: `npx tsc --noEmit`
- Linter is clean: `npm run lint`
- Production build succeeds: `npm run build`
- All changes are functional and do not break existing modes.

### 3.5 Session Lifecycle (Init & Wrap-Up)
Every session follows this exact sequence:
1. **Initialize:** Run `.\harness\init.ps1` (Windows) or `bash harness/init.sh` (Unix/WSL) to check environment health.
2. **Read State:** Read `harness/claude-progress.md` and check `harness/feature_list.json`.
3. **Select Scope:** Pick the next feature to work on.
4. **Implement:** Write and edit code.
5. **Verify:** Run compile & lint commands.
6. **Log & Commit:** Update `harness/claude-progress.md` and `harness/feature_list.json`, then commit your changes.

---

## 4. Coding & Design Guidelines

### Design Aesthetics
- **Premium UI:** Implement beautiful styling using Tailwind CSS v4. Use custom colors, subtle transitions, and card layouts instead of plain browser defaults.
- **Dark Mode Support:** Keep layout adaptable to dark themes (utilizing CSS variables and Tailwind's dark utility).
- **Responsive Layouts:** Make sure all screens look stunning on mobile, tablet, and desktop viewports.

### Code Quality
- **Type Safety:** Always declare strict TypeScript types/interfaces. Do not use `any`. Use Zod schemas under `schemas/` for validating runtime data.
- **Component Design:** Keep components modular and reusable. Place UI-only/primitive widgets in `components/ui/` and complex features in `components/` or page directories.
- **Maintain Comments:** Preserve all existing comments and documentation inside source files.
