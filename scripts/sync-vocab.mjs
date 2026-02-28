import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data/vocabulary');
const OUTPUT_FILE = path.join(__dirname, '../data/vocab.json');

function getAllJsonFiles(dir, files = []) {
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

function syncVocab() {
    console.log('🔄 Syncing vocabulary data...');

    if (!fs.existsSync(DATA_DIR)) {
        console.error(`❌ Data directory not found: ${DATA_DIR}`);
        return;
    }

    const jsonFiles = getAllJsonFiles(DATA_DIR);
    let allWords = [];

    for (const file of jsonFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const data = JSON.parse(content);
            if (data.words && Array.isArray(data.words)) {
                allWords = allWords.concat(data.words);
                console.log(`✅ Loaded ${data.words.length} words from ${path.basename(file)}`);
            }
        } catch (error) {
            console.error(`❌ Error parsing ${file}:`, error.message);
        }
    }

    const output = {
        words: allWords
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`✨ Successfully synced ${allWords.length} words to ${OUTPUT_FILE}`);
}

syncVocab();
