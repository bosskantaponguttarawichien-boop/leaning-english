import json
import os
import glob
import re
import ast

# 1. Configuration & Directories
VOCAB_DIR = "/Users/macintoshhd/front-end/leaning-english/data/vocabulary"
NEW_JSON_PATH = "/Users/macintoshhd/front-end/leaning-english/new.json"

# Zod Schema allowed POS & Categories
ALLOWED_POS = {"n", "v", "adj", "adv", "pron", "prep", "conj", "int"}
ALLOWED_CATEGORIES = {
    "Daily Life", "Work", "Dev / Tech", "Medical", "Trading", "Education", "Technology", "Place", "Transport", "Travel", "Health", "General", "Communication", "Finance", "Time", "Direction", "Culture",
    "Personal", "Possessive", "Demonstrative", "Question", "Indefinite", "Reflexive", "Relative", "Distributive", "Reciprocal", "Clause",
    "Basic", "Reason", "Condition", "Contrast", "Comparison", "Choice", "Addition", "Purpose", "Result",
    "Reaction", "Surprise", "Mistake", "Pain", "Greeting", "Farewell", "Politeness", "Answer", "Agreement", "Positive", "Negative", "Thinking", "Realization", "Joy", "Relief", "Confusion", "Praise", "Conversation",
    "Disbelief", "Encouragement", "Pause", "Sadness", "Apology", "Excitement", "Start", "Approval", "Reassurance", "Acceptance", "Warning", "Frustration", "Anger", "Expectation", "Uncertain", "Disagreement", "Sarcasm", "Dismissive", "Decision", "Serious", "Emphasis", "Arrival", "Completion", "Polite"
}

# Mapping custom POS to allowed ones
POS_MAP = {
    'article': 'pron',
    'det': 'pron',
    'modal': 'v',
    'interj': 'int',
}

# Mapping custom categories to allowed ones
CATEGORY_MAP = {
    'Family & People': 'Personal',
    'Food & Drink': 'Daily Life',
    'Home & Objects': 'Daily Life',
    'Colors': 'Daily Life',
    'Numbers': 'Basic',
    'Body': 'Health',
    'Nature': 'General',
    'Work & Career': 'Work',
    'Travel & Transport': 'Travel',
    'Emotions & Character': 'Personal',
}

# Map folder names to file singular prefixes
DIR_TO_PREFIX = {
    'adjectives': 'adjective',
    'adverbs': 'adverb',
    'conjunctions': 'conjunction',
    'interjections': 'interjection',
    'nouns': 'noun',
    'prepositions': 'preposition',
    'pronouns': 'pronoun',
    'verbs': 'verb'
}

# Mapping POS to folder names
POS_TO_DIR = {
    'adj': 'adjectives',
    'adv': 'adverbs',
    'conj': 'conjunctions',
    'int': 'interjections',
    'n': 'nouns',
    'prep': 'prepositions',
    'pron': 'pronouns',
    'v': 'verbs'
}

DIFFICULTY_PRIORITY = {
    "A1": 1,
    "A2": 2,
    "B1": 3
}

def clean_meaning(meaning_str):
    # Splits the meaning by /, ,, ;, and groups them back after deduplicating
    parts = re.split(r'[/,;]', meaning_str)
    cleaned_parts = []
    seen = set()
    for p in parts:
        p_clean = p.strip()
        if p_clean and p_clean.lower() not in seen:
            seen.add(p_clean.lower())
            cleaned_parts.append(p_clean)
    return " / ".join(cleaned_parts)

def merge_words(w1, w2):
    # w1 and w2 are dicts with keys: word, pos, meaning, example, difficulty, category
    
    # 1. Word and POS are assumed same
    word = w1['word']
    pos = w1['pos']
    
    # 2. Merge meanings
    m1 = w1.get('meaning', '')
    m2 = w2.get('meaning', '')
    merged_meaning = clean_meaning(f"{m1} / {m2}")
    
    # 3. Choose best example: keep the longer one
    ex1 = w1.get('example', '')
    ex2 = w2.get('example', '')
    best_example = ex1 if len(ex1) >= len(ex2) else ex2
    
    # 4. Choose lower difficulty so it is learned earlier
    diff1 = w1.get('difficulty', 'B1')
    diff2 = w2.get('difficulty', 'B1')
    p1 = DIFFICULTY_PRIORITY.get(diff1, 3)
    p2 = DIFFICULTY_PRIORITY.get(diff2, 3)
    best_diff = diff1 if p1 <= p2 else diff2
    
    # 5. Merge categories and map them
    cats1 = w1.get('category', [])
    cats2 = w2.get('category', [])
    
    merged_cats = set()
    for cat in (cats1 + cats2):
        # Apply mapping
        mapped_cat = CATEGORY_MAP.get(cat, cat)
        if mapped_cat in ALLOWED_CATEGORIES:
            merged_cats.add(mapped_cat)
        else:
            merged_cats.add("Daily Life") # Fallback
            
    return {
        "word": word,
        "pos": pos,
        "meaning": merged_meaning,
        "example": best_example,
        "difficulty": best_diff,
        "category": sorted(list(merged_cats))
    }

def main():
    merged_db = {} # (word.lower(), pos) -> word_dict
    
    # --- 1. Load Existing Vocabulary ---
    print("Loading existing vocabulary...")
    existing_files = glob.glob(os.path.join(VOCAB_DIR, "**/*.json"), recursive=True)
    loaded_count = 0
    for file_path in existing_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for w in data.get('words', []):
                    word_str = w['word'].strip()
                    pos_str = w['pos'].strip().lower()
                    key = (word_str.lower(), pos_str)
                    
                    # Store or merge
                    if key in merged_db:
                        merged_db[key] = merge_words(merged_db[key], w)
                    else:
                        # Normalize meaning and categories in existing too
                        w['meaning'] = clean_meaning(w.get('meaning', ''))
                        w['category'] = [CATEGORY_MAP.get(c, c) for c in w.get('category', [])]
                        w['category'] = sorted(list({c for c in w['category'] if c in ALLOWED_CATEGORIES}))
                        if not w['category']:
                            w['category'] = ["Daily Life"]
                        merged_db[key] = w
                    loaded_count += 1
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
    print(f"Loaded {loaded_count} words from existing files.")
    print(f"Unique words after initial deduplication: {len(merged_db)}")

    # --- 2. Load and Parse new.json ---
    print(f"Parsing new words from {NEW_JSON_PATH}...")
    with open(NEW_JSON_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Clean the file content to parse it as python list
    content_trimmed = content.strip()
    if content_trimmed.startswith('{'):
        content_trimmed = content_trimmed[1:]
    if content_trimmed.endswith('}'):
        content_trimmed = content_trimmed[:-1]

    words_def_match = re.search(r'words\s*=\s*\[', content_trimmed)
    if words_def_match:
        start_idx = words_def_match.end() - 1
        list_content = content_trimmed[start_idx:]
    else:
        list_content = content_trimmed

    local_ns = {}
    try:
        exec(f"words = {list_content}", {}, local_ns)
        new_words_tuples = local_ns.get('words', [])
    except Exception as e:
        print(f"Failed to compile new.json content: {e}")
        return

    print(f"Found {len(new_words_tuples)} word tuples in new.json.")
    
    new_added_count = 0
    new_merged_count = 0
    
    for item in new_words_tuples:
        if len(item) >= 7:
            _, word, pos, meaning, example, difficulty, category = item[:7]
            word = word.strip()
            pos = pos.strip().lower()
            
            # Map POS
            mapped_pos = POS_MAP.get(pos, pos)
            if mapped_pos not in ALLOWED_POS:
                print(f"Warning: POS '{pos}' (mapped: '{mapped_pos}') for word '{word}' not allowed. Skipping.")
                continue
                
            # Clean and map categories
            mapped_cats = []
            for cat in category:
                mapped_cat = CATEGORY_MAP.get(cat, cat)
                if mapped_cat in ALLOWED_CATEGORIES:
                    mapped_cats.append(mapped_cat)
                else:
                    mapped_cats.append("Daily Life")
            if not mapped_cats:
                mapped_cats = ["Daily Life"]
                
            new_w = {
                "word": word,
                "pos": mapped_pos,
                "meaning": clean_meaning(meaning),
                "example": example.strip(),
                "difficulty": difficulty.strip(),
                "category": sorted(list(set(mapped_cats)))
            }
            
            key = (word.lower(), mapped_pos)
            if key in merged_db:
                merged_db[key] = merge_words(merged_db[key], new_w)
                new_merged_count += 1
            else:
                merged_db[key] = new_w
                new_added_count += 1

    print(f"Merged {new_merged_count} existing words and added {new_added_count} brand new words.")
    print(f"Total vocabulary size: {len(merged_db)}")

    # --- 3. Group and Sort ---
    # Group words by POS and Difficulty to write back to files
    grouped_db = {} # (pos, difficulty) -> list of words
    
    for word_dict in merged_db.values():
        pos = word_dict['pos']
        difficulty = word_dict['difficulty']
        if difficulty not in DIFFICULTY_PRIORITY:
            # Fallback for unexpected difficulties
            difficulty = "B1"
            word_dict['difficulty'] = difficulty
            
        group_key = (pos, difficulty)
        if group_key not in grouped_db:
            grouped_db[group_key] = []
        grouped_db[group_key].append(word_dict)

    # --- 4. Write Back to JSON Files ---
    # Let's clear the old json files content first to make sure there are no orphans if difficulty changed
    # We can do this by initializing empty lists for all standard POS + Difficulty combinations
    all_groups = []
    for pos in ALLOWED_POS:
        for diff in DIFFICULTY_PRIORITY.keys():
            all_groups.append((pos, diff))
            
    for pos, diff in all_groups:
        pos_dir_name = POS_TO_DIR[pos]
        prefix = DIR_TO_PREFIX[pos_dir_name]
        file_name = f"{prefix}_{diff}.json"
        full_dir = os.path.join(VOCAB_DIR, pos_dir_name)
        os.makedirs(full_dir, exist_ok=True)
        file_path = os.path.join(full_dir, file_name)
        
        words_list = grouped_db.get((pos, diff), [])
        
        # Sort words alphabetically case-insensitive
        words_list.sort(key=lambda x: x['word'].lower())
        
        output_data = {
            "words": words_list
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=4)
            
    print("Successfully wrote all updated and sorted vocabulary files.")

if __name__ == "__main__":
    main()
