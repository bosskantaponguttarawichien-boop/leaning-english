import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const curriculum = JSON.parse(readFileSync(resolve("data/curriculum.json"), "utf8"));
const vocabulary = JSON.parse(readFileSync(resolve("data/vocab.json"), "utf8"));
const vocabularyWords = new Set(vocabulary.words.map((item) => item.word.toLowerCase()));

const supportedActivityTypes = new Set([
  "vocabulary",
  "concept",
  "classify",
  "fill_blank",
  "reorder",
  "transform",
  "dictation",
  "shadowing",
  "guided_output",
  "free_output",
  "roleplay",
  "reading",
  "work_task"
]);

const errors = [];
const lessonIds = new Set();
const activityIds = new Set();

if (!Array.isArray(curriculum.lessons) || curriculum.lessons.length !== 24) {
  errors.push(`Expected 24 lessons; found ${curriculum.lessons?.length ?? 0}.`);
}

for (const [lessonIndex, lesson] of (curriculum.lessons || []).entries()) {
  if (lessonIds.has(lesson.id)) errors.push(`Duplicate lesson id: ${lesson.id}`);
  lessonIds.add(lesson.id);

  const expectedId = `L${String(lessonIndex + 1).padStart(2, "0")}`;
  if (lesson.id !== expectedId) errors.push(`Expected ${expectedId}; found ${lesson.id}.`);

  for (const field of [
    "title_th",
    "title_en",
    "situation_th",
    "situation_en",
    "exit_task",
    "safe_default"
  ]) {
    if (!lesson[field]?.trim()) errors.push(`${lesson.id} is missing ${field}.`);
  }

  if (!Array.isArray(lesson.tense_focus) || lesson.tense_focus.length === 0) {
    errors.push(`${lesson.id} has no tense_focus.`);
  }

  const vocabularyActivity = lesson.activities?.[0];
  if (vocabularyActivity?.type !== "vocabulary") {
    errors.push(`${lesson.id} must begin with a vocabulary activity.`);
  }

  const shadowingIndex = lesson.activities?.findIndex((activity) => activity.type === "shadowing");
  const roleplayIndex = lesson.activities?.findIndex((activity) => activity.type === "roleplay");
  if (shadowingIndex < 0) errors.push(`${lesson.id} has no shadowing activity.`);
  if (roleplayIndex < 0) errors.push(`${lesson.id} has no roleplay activity.`);
  if (shadowingIndex >= roleplayIndex) errors.push(`${lesson.id} roleplay must follow shadowing.`);

  for (const activity of lesson.activities || []) {
    if (activityIds.has(activity.id)) errors.push(`Duplicate activity id: ${activity.id}`);
    activityIds.add(activity.id);

    if (!supportedActivityTypes.has(activity.type)) {
      errors.push(`${activity.id} has unsupported type ${activity.type}.`);
    }

    if (activity.type === "vocabulary") {
      if (!Array.isArray(activity.options) || activity.options.length < 12 || activity.options.length > 24) {
        errors.push(`${activity.id} must reference 12-24 vocabulary items.`);
      }
      for (const word of activity.options || []) {
        if (!vocabularyWords.has(word.toLowerCase())) {
          errors.push(`${activity.id} references missing vocabulary: ${word}`);
        }
      }
      if (!Number.isInteger(activity.coreVocabularyCount) || activity.coreVocabularyCount < 1) {
        errors.push(`${activity.id} must identify its core vocabulary count.`);
      }
      for (const note of activity.vocabularyNotes || []) {
        if (!activity.options.includes(note.word)) {
          errors.push(`${activity.id} has a contextual note for an unlisted word: ${note.word}`);
        }
        if (!note.formInLesson?.trim() || !note.contextualMeaning?.trim()) {
          errors.push(`${activity.id} has an incomplete contextual vocabulary note for ${note.word}.`);
        }
      }
    }

    if (activity.type === "reading") {
      const questions = (activity.question || "").split("\n").filter(Boolean);
      const answers = String(activity.answer || "").split(",").filter(Boolean);
      if (questions.length !== answers.length) {
        errors.push(`${activity.id} reading question/answer counts differ.`);
      }
      if ((activity.options || []).length !== questions.length * 2) {
        errors.push(`${activity.id} must provide two reading choices per question.`);
      }

      const storySentences = (activity.content || "")
        .match(/[^.!?]+(?:[.!?]+["”']?|$)/g)
        ?.map((sentence) => sentence.trim())
        .filter(Boolean) || [];
      if (!Array.isArray(activity.sentenceNotes) || activity.sentenceNotes.length !== storySentences.length) {
        errors.push(`${activity.id} must explain every story sentence.`);
      }
      for (const [noteIndex, note] of (activity.sentenceNotes || []).entries()) {
        for (const field of ["translation", "tense", "structure", "usage"]) {
          if (!note[field]?.trim()) {
            errors.push(`${activity.id} sentence note ${noteIndex + 1} is missing ${field}.`);
          }
        }
      }
    }

    if (activity.type === "shadowing") {
      if (!Array.isArray(activity.options) || activity.options.length < 4) {
        errors.push(`${activity.id} needs at least four shadowing sentences.`);
      }
      if (!Array.isArray(activity.answer) || activity.answer.length !== activity.options.length) {
        errors.push(`${activity.id} shadowing translations do not match sentences.`);
      }
    }

    if (activity.type === "roleplay") {
      if (!Array.isArray(activity.options) || activity.options.length < 4) {
        errors.push(`${activity.id} needs at least four roleplay turns.`);
      }
      if (!Array.isArray(activity.answer) || activity.answer.length !== activity.options.length) {
        errors.push(`${activity.id} roleplay models do not match prompts.`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Curriculum validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Curriculum valid: ${curriculum.lessons.length} lessons, ${activityIds.size} activities.`);
console.log(`Vocabulary preserved and linked: ${vocabulary.words.length} bank entries.`);
