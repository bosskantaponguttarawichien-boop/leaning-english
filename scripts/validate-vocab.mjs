import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSSchema = z.enum(["n", "v", "adj", "adv", "pron", "prep", "conj", "int"]);
const DifficultySchema = z.enum(["A1", "A2", "B1"]);
const CategorySchema = z.enum([
    "Daily Life", "Work", "Dev / Tech", "Medical", "Trading", "Education", "Technology", "Place", "Transport", "Travel", "Health", "General", "Communication", "Finance", "Time", "Direction", "Culture",
    "Personal", "Possessive", "Demonstrative", "Question", "Indefinite", "Reflexive", "Relative", "Distributive", "Reciprocal", "Clause",
    "Basic", "Reason", "Condition", "Contrast", "Comparison", "Choice", "Addition", "Purpose", "Result",
    "Reaction", "Surprise", "Mistake", "Pain", "Greeting", "Farewell", "Politeness", "Answer", "Agreement", "Positive", "Negative", "Thinking", "Realization", "Joy", "Relief", "Confusion", "Praise", "Conversation",
    "Disbelief", "Encouragement", "Pause", "Sadness", "Apology", "Excitement", "Start", "Approval", "Reassurance", "Acceptance", "Warning", "Frustration", "Anger", "Expectation", "Uncertain", "Disagreement", "Sarcasm", "Dismissive", "Decision", "Serious", "Emphasis", "Arrival", "Completion", "Polite"
]);

const WordSchema = z.object({
    word: z.string().min(1),
    pos: POSSchema,
    meaning: z.string().min(1),
    example: z.string().min(1),
    difficulty: DifficultySchema,
    category: z.array(CategorySchema),
});

const VocabDBSchema = z.object({
    words: z.array(WordSchema),
});

const DATA_DIR = path.join(__dirname, '../data/vocabulary');

function getAllJsonFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllJsonFiles(fullPath, files);
        } else if (item.endsWith('.json')) {
            files.push(fullPath);
        }
    }
    return files;
}

const jsonFiles = getAllJsonFiles(DATA_DIR);
let errorCount = 0;

for (const file of jsonFiles) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(content);
        VocabDBSchema.parse(data);
        console.log(`✅ ${path.relative(DATA_DIR, file)} is valid.`);
    } catch (error) {
        errorCount++;
        console.error(`❌ Validation error in ${path.relative(DATA_DIR, file)}:`);
        if (error instanceof z.ZodError) {
            error.issues.forEach(err => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
                // Print the offending word if possible
                const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                if (err.path[0] === 'words' && typeof err.path[1] === 'number') {
                    const word = data.words[err.path[1]];
                    console.error(`    Word: ${word?.word || 'unknown'}`);
                }
            });
        } else {
            console.error(`  - ${error.message}`);
        }
    }
}

if (errorCount === 0) {
    console.log('✨ All files are valid!');
} else {
    console.log(`\n⚠️ Found ${errorCount} invalid files.`);
}
