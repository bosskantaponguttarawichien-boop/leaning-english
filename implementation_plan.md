# 🧠 English Vocab Typing Web — Implementation Plan

## Stack

| เครื่องมือ | การใช้งาน |
|---|---|
| **Next.js 14** (App Router) | Framework หลัก |
| **React 18** | UI Component |
| **TypeScript** | Type Safety ทั้งโปรเจกต์ |
| **Tailwind CSS** | Styling |
| **Google Font: Noto Sans Thai** | Font หลัก (รองรับภาษาไทย) |
| **React Hook Form** | จัดการ form / input |
| **Zod** | Validate schema คำศัพท์ + input |

---

## 📁 Project Structure

```
/englist/
├── app/
│   ├── layout.tsx          ← font + global layout
│   ├── page.tsx            ← Home / Mode selector
│   ├── practice/
│   │   └── page.tsx        ← Typing Practice
│   ├── sentence/
│   │   └── page.tsx        ← Sentence Typing Mode
│   ├── dashboard/
│   │   └── page.tsx        ← Progress Dashboard
│   └── globals.css         ← Tailwind base
├── components/
│   ├── TypingInput.tsx      ← react-hook-form input
│   ├── WordCard.tsx         ← word + POS + meaning
│   ├── Timer.tsx
│   ├── ResultSummary.tsx
│   └── Dashboard.tsx
├── lib/
│   ├── srs.ts              ← Spaced Repetition logic
│   ├── storage.ts          ← localStorage helpers
│   └── utils.ts            ← WPM, Accuracy calculators
├── schemas/
│   └── vocab.schema.ts     ← Zod schema
├── types/
│   └── vocab.ts            ← TypeScript types
├── data/
│   └── vocab.json          ← Word database
└── public/
```

---

## 🔷 Type & Schema Design

### `types/vocab.ts`
```ts
export type POS = "n" | "v" | "adj" | "adv"
export type Difficulty = "beginner" | "intermediate" | "advanced"
export type Category = "Daily Life" | "Work" | "Dev / Tech" | "Medical" | "Trading"

export interface Word {
  word: string
  pos: POS
  meaning: string
  example: string
  difficulty: Difficulty
  category: Category[]
}
```

### `schemas/vocab.schema.ts` (Zod)
```ts
import { z } from "zod"

export const WordSchema = z.object({
  word: z.string().min(1),
  pos: z.enum(["n", "v", "adj", "adv"]),
  meaning: z.string().min(1),
  example: z.string().min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  category: z.array(z.enum(["Daily Life", "Work", "Dev / Tech", "Medical", "Trading"])),
})

export const VocabDBSchema = z.object({ words: z.array(WordSchema) })
```

---

## 🗂 Phase 1: Project Setup

- `npx create-next-app@latest englist --typescript --tailwind --app --no-src-dir`
- เพิ่ม Google Font **Noto Sans Thai** ใน `app/layout.tsx`
- ติดตั้ง deps: `react-hook-form`, `zod`, `@hookform/resolvers`
- สร้าง `vocab.json` + validate ด้วย Zod ณ runtime

---

## 🗂 Phase 2: Core Features (Must Have)

| Feature | Component / File |
|---|---|
| Typing Practice (RHF input) | `TypingInput.tsx` + `practice/page.tsx` |
| Meaning Reveal + POS tag | `WordCard.tsx` |
| Color coding POS | Tailwind class map (n=blue, v=red, adj=green, adv=purple) |
| WPM + Accuracy | `lib/utils.ts` |
| Timer Mode (1/3 min / Custom) | `Timer.tsx` |
| Result Summary | `ResultSummary.tsx` |

### Typing Input (React Hook Form)
```tsx
const { register, watch, reset } = useForm<{ input: string }>()
// watch("input") → real-time check กับ currentWord
```

---

## 🗂 Phase 3: Smart Learning

| Feature | File |
|---|---|
| Mistake Tracking | `lib/storage.ts` — เก็บ `mistakeCount[word]` |
| SRS Weight | `lib/srs.ts` — คำนวณ probability จาก correctStreak / wrongCount |
| Difficulty Filter | filter จาก `vocab.json` ตาม `difficulty` field |

---

## 🗂 Phase 4: Communication Mode

- **Sentence Typing Mode** — `sentence/page.tsx` — RHF + Zod validate แต่ละคำ
- **Build-a-Sentence** — drag & drop array ของ tokens

---

## 🗂 Phase 5: UX / Dashboard / Save

- **Dashboard** — `dashboard/page.tsx` — อ่านจาก localStorage
- **LocalStorage** — helper ใน `lib/storage.ts`
- **JSON Export/Import** — `JSON.stringify` / `FileReader`

---

## 🗂 Phase 6: Advanced Features

| Feature | วิธีทำ |
|---|---|
| Pronunciation | `window.speechSynthesis` (Web Speech API) |
| Topic Filter | filter `word.category` จาก dropdown |
| Think in English Mode | toggle state → ซ่อน `meaning` (ภาษาไทย) |

---

## 🚦 Build Order

```
Phase 1 → Setup + Font + vocab.json + Zod Schema
Phase 2 → Core Typing + Timer + WPM
Phase 3 → SRS + Mistake Tracking
Phase 4 → Sentence Mode
Phase 5 → Dashboard + LocalStorage
Phase 6 → Pronunciation + Filter
```

---

## ✅ Verification Plan

- TypeScript strict mode ผ่าน (`tsc --noEmit`)
- Zod validate `vocab.json` ตอน app โหลด
- ทดสอบ RHF real-time input vs. currentWord
- ตรวจ localStorage persist ข้ามการ reload
- ทดสอบ SRS weight ใน browser console
- ทดสอบ Web Speech API บน Chrome/Edge
