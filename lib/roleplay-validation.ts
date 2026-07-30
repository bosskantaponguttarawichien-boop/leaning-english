import vocabData from "@/data/vocab.json";
import { VocabDBSchema } from "@/schemas/vocab.schema";

export interface RoleplayValidationCheck {
    id: "english" | "sentence" | "grammar" | "relevance";
    label: string;
    passed: boolean;
    message: string;
}

export interface RoleplayValidationResult {
    valid: boolean;
    score: number;
    checks: RoleplayValidationCheck[];
    summary: string;
}

const vocabulary = VocabDBSchema.parse(vocabData);
const vocabularyByWord = new Map(
    vocabulary.words.map((item) => [item.word.toLowerCase(), item]),
);
const commonWords = new Set(
    "i'm i've i'll i'd you're you've you'll we're we've we'll they're they've they'll he's she's it's isn't aren't wasn't weren't don't doesn't didn't won't can't couldn't shouldn't would please thanks thank okay yes no hi hello".split(" "),
);
const subjectWords = new Set([
    "i", "i'm", "i've", "i'll", "i'd", "we", "we're", "we've", "we'll",
    "you", "you're", "you've", "he", "he's", "she", "she's", "they", "they're", "my",
]);
const fragmentQuestionWords = ["where", "when", "what time", "who"];
const irregularPastWords = new Set([
    "ate", "bought", "came", "did", "drank", "drove", "felt", "found", "gave",
    "got", "had", "heard", "kept", "knew", "left", "lost", "made", "met",
    "paid", "read", "said", "saw", "sent", "slept", "spoke", "took", "told",
    "tried", "watched", "went", "worked", "wrote",
]);

function tokenize(text: string) {
    return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
}

function resolveKnownWord(token: string) {
    const candidates = [
        token,
        token.replace(/'s$/, ""),
        token.replace(/ies$/, "y"),
        token.replace(/ied$/, "y"),
        token.replace(/ing$/, ""),
        token.replace(/ing$/, "e"),
        token.replace(/(.)\1ing$/, "$1"),
        token.replace(/ed$/, ""),
        token.replace(/ed$/, "e"),
        token.replace(/(.)\1ed$/, "$1"),
        token.replace(/s$/, ""),
        token.replace(/es$/, ""),
    ];

    return candidates.find((candidate) => vocabularyByWord.has(candidate));
}

function hasKnownVerb(tokens: string[]) {
    return tokens.some((token) => {
        const word = resolveKnownWord(token);
        return word ? vocabularyByWord.get(word)?.pos === "v" : false;
    });
}

function grammarRequirement(prompt: string, model: string) {
    const target = `${prompt} ${model}`.toLowerCase();

    if (target.includes("going to")) {
        return {
            label: "be going to",
            test: (response: string) => /\b(am|is|are|'m|'re|'s)\s+(?:not\s+)?going to\s+[a-z]+\b/i.test(response),
            tip: "ลองใช้ Subject + am/is/are + going to + กริยารูปพื้นฐาน",
        };
    }

    if (target.includes("right now") || target.includes("currently") || /\bwhat are you doing\b/.test(target)) {
        return {
            label: "Present Continuous",
            test: (response: string) => /\b(am|is|are|'m|'re|'s)\s+(?:not\s+)?[a-z]+ing\b/i.test(response),
            tip: "โจทย์ถามสิ่งที่กำลังเกิด ลองใช้ Subject + am/is/are + V-ing",
        };
    }

    if (
        target.includes("have you ever")
        || target.includes("already")
        || target.includes("since then")
        || /\b(i|we|you|they|he|she)\s+(have|has)\s+(?!to\b)[a-z]+/i.test(target)
        || /\b(i've|we've|you've|they've|he's|she's)\s+[a-z]+/i.test(target)
    ) {
        return {
            label: "Present Perfect",
            test: (response: string) => /\b(haven't|hasn't)\b|(?:\b(have|has|'ve|'s)\s+(?:already\s+|never\s+|ever\s+)?[a-z]+\b)/i.test(response),
            tip: "ลองใช้ Subject + have/has + V3 เพื่อเชื่อมอดีตกับตอนนี้",
        };
    }

    if (
        target.includes("yesterday")
        || target.includes("last week")
        || target.includes("last weekend")
        || /\bwhat did\b/.test(target)
    ) {
        return {
            label: "Past Simple",
            test: (response: string) => {
                const responseTokens = tokenize(response);
                return responseTokens.some((token) => irregularPastWords.has(token))
                    || responseTokens.some((token) => /ed$/.test(token) && Boolean(resolveKnownWord(token)));
            },
            tip: "โจทย์ถามเหตุการณ์ที่จบแล้ว ลองใช้กริยาช่อง 2 หรือกริยาที่ลงท้าย -ed",
        };
    }

    if (/\b(i'll|we'll|will|won't)\b/.test(target)) {
        return {
            label: "will / offer",
            test: (response: string) => /\b(i'll|we'll|i will|we will|i won't|we won't|let me|i can)\b/i.test(response),
            tip: "ถ้าเป็นการตัดสินใจหรือเสนอความช่วยเหลือ ลองใช้ I'll + กริยารูปพื้นฐาน",
        };
    }

    if (target.includes("usually")) {
        return {
            label: "Present Simple",
            test: (response: string) => hasKnownVerb(tokenize(response)),
            tip: "โจทย์ถามกิจวัตร ลองใช้ I usually + กริยารูปพื้นฐาน",
        };
    }

    return null;
}

function relevanceRequirement(prompt: string) {
    const text = prompt.toLowerCase();

    if (text.includes("your name")) {
        return {
            test: (response: string) => /\b(my name is|i am|i'm)\b/i.test(response),
            tip: "ตอบชื่อด้วย My name is... หรือ I'm...",
        };
    }
    if (text.includes("interested in")) {
        return {
            test: (response: string) => /\b(interested in|like|love|enjoy)\b/i.test(response),
            tip: "บอกสิ่งที่สนใจด้วย I'm interested in... หรือ I like...",
        };
    }
    if (text.startsWith("why")) {
        return {
            test: (response: string) => /\b(because|so that|to)\b/i.test(response),
            tip: "โจทย์ถามเหตุผล ลองเชื่อมคำตอบด้วย because... หรือ to...",
        };
    }
    if (text.startsWith("where") || text.includes("where are")) {
        return {
            test: (response: string) => /\b(in|at|to|from|near|home|office|café|cafe)\b/i.test(response),
            tip: "โจทย์ถามสถานที่ ลองใช้ in, at, to หรือ from ตามด้วยสถานที่",
        };
    }
    if (text.startsWith("when") || text.includes("what time")) {
        return {
            test: (response: string) => /\b(at|on|in|today|tomorrow|yesterday|morning|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\d/i.test(response),
            tip: "โจทย์ถามเวลา ลองใส่เวลา วัน หรือช่วงเวลาในคำตอบ",
        };
    }
    if (text.startsWith("who")) {
        return {
            test: (response: string) => /\b(with|my|friend|family|colleague|customer|team|manager)\b/i.test(response),
            tip: "โจทย์ถามบุคคล ลองตอบด้วย my..., a... หรือ with...",
        };
    }

    return null;
}

export function validateRoleplayResponse(
    response: string,
    prompt: string,
    model: string,
): RoleplayValidationResult {
    const trimmedResponse = response.trim();
    const tokens = tokenize(trimmedResponse);
    const knownTokens = tokens.filter((token) => commonWords.has(token) || Boolean(resolveKnownWord(token)));
    const unknownAllowance = Math.max(1, Math.floor(tokens.length * 0.4));
    const englishPassed = tokens.length >= 2 && tokens.length - knownTokens.length <= unknownAllowance;

    const promptAllowsFragment = fragmentQuestionWords.some((word) => prompt.toLowerCase().includes(word));
    const hasSubject = tokens.some((token) => subjectWords.has(token));
    const hasPoliteImperative = /^(please|sorry|excuse me)\b/i.test(trimmedResponse);
    const sentencePassed = promptAllowsFragment
        ? englishPassed
        : englishPassed
            && (hasSubject || hasPoliteImperative)
            && (hasKnownVerb(tokens) || /\b(am|is|are|can|will|feel)\b|i'm|we're/i.test(trimmedResponse));

    const grammar = grammarRequirement(prompt, model);
    const grammarPassed = grammar ? grammar.test(trimmedResponse) : sentencePassed;
    const relevance = relevanceRequirement(prompt);
    const relevancePassed = relevance ? relevance.test(trimmedResponse) : sentencePassed;

    const checks: RoleplayValidationCheck[] = [
        {
            id: "english",
            label: "คำภาษาอังกฤษ",
            passed: englishPassed,
            message: englishPassed
                ? "ตรวจพบคำภาษาอังกฤษที่อ่านเป็นคำได้"
                : "ยังตรวจไม่พบประโยคภาษาอังกฤษ ลองใช้คำจาก Phrase Bank และเว้นวรรคระหว่างคำ",
        },
        {
            id: "sentence",
            label: "โครงสร้างคำตอบ",
            passed: sentencePassed,
            message: sentencePassed
                ? "มีประธานหรือรูปคำตอบที่เหมาะกับคำถาม และมีคำกริยา"
                : "ลองตอบเป็นประโยค เช่น I + verb... หรือ I'm + V-ing...",
        },
        {
            id: "grammar",
            label: grammar ? `รูปเวลา: ${grammar.label}` : "รูปประโยค",
            passed: grammarPassed,
            message: grammarPassed
                ? grammar
                    ? `ใช้รูป ${grammar.label} ตรงกับโจทย์`
                    : "รูปประโยคเหมาะกับโจทย์นี้"
                : grammar?.tip || "ลองตรวจรูปประโยคอีกครั้ง",
        },
        {
            id: "relevance",
            label: "ตอบตรงคำถาม",
            passed: relevancePassed,
            message: relevancePassed
                ? "คำตอบมีข้อมูลชนิดที่คำถามต้องการ"
                : relevance?.tip || "ลองอ่านคำถามอีกครั้งและตอบข้อมูลที่ถูกถาม",
        },
    ];

    const passedCount = checks.filter((check) => check.passed).length;
    const valid = checks.every((check) => check.passed);

    return {
        valid,
        score: Math.round((passedCount / checks.length) * 100),
        checks,
        summary: valid
            ? "ผ่านการตรวจพื้นฐานแล้ว เปรียบเทียบกับ Natural Model ได้"
            : "ยังไม่ผ่าน กรุณาแก้ตามข้อแนะนำก่อนดู Natural Model",
    };
}
