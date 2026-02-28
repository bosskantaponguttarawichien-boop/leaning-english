import { z } from "zod";

export const POSSchema = z.enum(["n", "v", "adj", "adv", "pron", "prep", "conj", "int"]);
export const DifficultySchema = z.enum(["A1", "A2", "B1"]);
export const CategorySchema = z.enum([
  "Daily Life", "Work", "Dev / Tech", "Medical", "Trading", "Education", "Technology", "Place", "Transport", "Travel", "Health", "General", "Communication", "Finance", "Time", "Direction", "Culture",
  "Personal", "Possessive", "Demonstrative", "Question", "Indefinite", "Reflexive", "Relative", "Distributive", "Reciprocal", "Clause",
  "Basic", "Reason", "Condition", "Contrast", "Comparison", "Choice", "Addition", "Purpose", "Result",
  "Reaction", "Surprise", "Mistake", "Pain", "Greeting", "Farewell", "Politeness", "Answer", "Agreement", "Positive", "Negative", "Thinking", "Realization", "Joy", "Relief", "Confusion", "Praise", "Conversation",
  "Disbelief", "Encouragement", "Pause", "Sadness", "Apology", "Excitement", "Start", "Approval", "Reassurance", "Acceptance", "Warning", "Frustration", "Anger", "Expectation", "Uncertain", "Disagreement", "Sarcasm", "Dismissive", "Decision", "Serious", "Emphasis", "Arrival", "Completion", "Polite"
]);

export const WordSchema = z.object({
  word: z.string().min(1),
  pos: POSSchema,
  meaning: z.string().min(1),
  example: z.string().min(1),
  difficulty: DifficultySchema,
  category: z.array(CategorySchema),
});

export const VocabDBSchema = z.object({
  words: z.array(WordSchema),
});

export type POS = z.infer<typeof POSSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Word = z.infer<typeof WordSchema>;
export type VocabDB = z.infer<typeof VocabDBSchema>;
