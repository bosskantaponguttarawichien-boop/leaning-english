# 🤖 Agent Operating Manual & Harness Instructions

This repository utilizes an **Agent Harness** to ensure reliable and predictable development. 

## 🚨 IMPORTANT: Bootstrapping & Lifecycle
Before you begin editing any files or writing code, you **MUST** run the initialization script to check environment health and dependencies:

* **Windows (PowerShell):**
  ```powershell
  .\harness\init.ps1
  ```
* **macOS / Linux / WSL (Bash):**
  ```bash
  bash harness/init.sh
  ```

## 📖 Main Agent Instructions
Please refer to the following files under the `harness/` directory:
1. **Operating Rules & Guidelines:** Read [harness/AGENTS.md](file:///C:/Users/boss_/Documents/GitHub/leaning-english/harness/AGENTS.md) for full context, coding guidelines, and rules.
2. **Feature & Scope Boundaries:** Read [harness/feature_list.json](file:///C:/Users/boss_/Documents/GitHub/leaning-english/harness/feature_list.json) to know which features are complete, in progress, or pending.
3. **Session Progress Logs:** Read [harness/claude-progress.md](file:///C:/Users/boss_/Documents/GitHub/leaning-english/harness/claude-progress.md) to pick up where the previous session left off.

## 🛠️ Verification & Build Commands
- **Install Dependencies:** `npm install`
- **Development Server:** `npm run dev`
- **Linter:** `npm run lint`
- **TypeScript Compilation:** `npx tsc --noEmit`
- **Production Build:** `npm run build`
