import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const lessons = [
  {
    id: "L01", level: "A1", phase: "foundation",
    th: "แผนที่เวลา: Tense ที่ต้องใช้จริง", en: "The Essential Tense Map",
    situationTh: "เลือกมุมเวลาที่ตรงกับสิ่งที่ต้องการสื่อ ก่อนกังวลเรื่องกฎย่อย",
    situationEn: "Choose the time view that matches your message.",
    tense: ["12-tense overview", "7 priority forms"],
    exit: "เลือกกลุ่มเวลาให้ข้อความ 6 แบบและพูดตัวอย่างของตัวเอง 3 ประโยค",
    safe: "เริ่มจาก Present Simple, Present Continuous, Past Simple และรูปอนาคตที่ตรงกับเจตนา",
    vocab: ["usually", "happen", "finish", "plan", "experience", "continue", "before", "future"],
    tags: ["Time", "Daily Life"],
    chunks: ["I usually...", "I'm ...ing now", "I ... yesterday", "I'm going to...", "I'll...", "I've already...", "I was ...ing when..."],
    concept: `# Tense คือมุมที่เราเลือกมองเวลา
ตำรามักแบ่งเป็น 12 tense แต่ชีวิตจริงไม่จำเป็นต้องผลิตทุก tense ตั้งแต่แรก
- Present Simple: กิจวัตร ข้อเท็จจริง สภาพ — \`I work from home.\`
- Present Continuous: กำลังเกิดหรือชั่วคราว — \`I'm working now.\`
- Past Simple: เกิดและจบแล้ว — \`I worked yesterday.\`
- Past Continuous: กำลังเกิดในอดีต — \`I was working when you called.\`
- going to: แผนหรือสิ่งที่เห็นแนวโน้ม — \`I'm going to rest.\`
- will: ตัดสินใจทันที เสนอ หรือคาดการณ์ — \`I'll help you.\`
- Present Perfect: อดีตเชื่อมกับตอนนี้ — \`I've finished the task.\`
💡 ใน 7 รูปที่เราเน้น \`going to\` เป็นโครงสร้างอนาคตที่ใช้จริงแต่ไม่ใช่หนึ่งในตาราง 12 แบบดั้งเดิม ส่วนอีก 6 รูปในตาราง 12 ให้รู้จักไว้ก่อน: Present Perfect Continuous, Past Perfect, Past Perfect Continuous, Future Continuous, Future Perfect และ Future Perfect Continuous
## คำถามก่อนเลือก tense
เหตุการณ์เป็นกิจวัตร กำลังเกิด จบแล้ว เป็นแผน หรืออดีตยังมีผลตอนนี้?`,
    story: `Nina uses English every day. Right now, she is talking to a customer. Yesterday, she answered an email in English. Tomorrow, she is going to join an online meeting. She thinks the meeting will be useful. She has prepared three questions, so she feels ready.`,
    questions: ["Which sentence describes an action happening now?", "Which form connects a past action to the present?"],
    readingOptions: ["She is talking to a customer.", "She answered an email yesterday.", "She has prepared three questions.", "She is going to join a meeting."],
    readingAnswers: ["She is talking to a customer.", "She has prepared three questions."],
    fill: [["Nina ___ English every day. (use)", "uses"], ["Right now she ___ to a customer. (talk)", "is talking"], ["Yesterday she ___ an email. (answer)", "answered"], ["She ___ three questions already. (prepare)", "has prepared"]],
    shadow: [["I use English every day.", "ฉันใช้ภาษาอังกฤษทุกวัน"], ["I'm studying right now.", "ตอนนี้ฉันกำลังเรียนอยู่"], ["I practiced yesterday.", "ฉันฝึกเมื่อวาน"], ["I'm going to practice tomorrow.", "ฉันวางแผนจะฝึกพรุ่งนี้"], ["I've finished today's lesson.", "ฉันเรียนบทของวันนี้เสร็จแล้ว"]],
    prompts: ["What do you usually do in the morning?", "What are you doing right now?", "What did you do yesterday?", "What are you going to do tomorrow?"],
    models: ["I usually check my messages and have breakfast.", "I'm studying English right now.", "I worked and watched a video yesterday.", "I'm going to review this lesson tomorrow."]
  },
  {
    id: "L02", level: "A1", phase: "foundation",
    th: "แนะนำตัว: เป็นอะไร เป็นอย่างไร อยู่ที่ไหน", en: "Introduce Yourself with Be",
    situationTh: "แนะนำตัวกับคนใหม่อย่างสั้นและชัดเจน",
    situationEn: "Give a clear introduction to someone new.",
    tense: ["Present Simple with be"],
    exit: "แนะนำตัวต่อเนื่อง 45 วินาทีโดยใช้ be อย่างน้อย 4 ประโยค",
    safe: "I am + คำนาม/คำคุณศัพท์/สถานที่ — ห้ามใช้ I am + กริยารูปพื้นฐาน",
    vocab: ["name", "work", "job", "excited", "interest", "from", "live", "company"],
    tags: ["Personal", "Work"],
    chunks: ["My name is...", "I'm from...", "I live in...", "I work at...", "I'm interested in...", "I'm excited to..."],
    concept: `# \`be\` ใช้บอกข้อมูลของประธาน
- เป็นอะไร: \`I'm a software worker.\`
- เป็นอย่างไร: \`I'm excited.\`
- อยู่ที่ไหน/มาจากไหน: \`I'm at home.\` / \`I'm from Thailand.\`
✅ \`I am interested in AI.\`
❌ \`I am work at a company.\`
กริยาการกระทำใช้ตรง ๆ: \`I work at a company.\`
💡 ค่าเริ่มต้นที่ปลอดภัย: \`I'm + noun/adjective/place\``,
    story: `Hi, my name is Boss. I'm from Thailand, and I live in Bangkok. I work at a technology company. My job is about software and AI. I'm interested in learning new tools. I'm excited to improve my English because I want to communicate more clearly at work.`,
    questions: ["Where does Boss live?", "Why is he improving his English?"],
    readingOptions: ["He lives in Bangkok.", "He lives in New York.", "To communicate more clearly.", "To change his name."],
    readingAnswers: ["He lives in Bangkok.", "To communicate more clearly."],
    fill: [["I ___ from Thailand.", "am"], ["My job ___ about software.", "is"], ["I ___ at a technology company. (work)", "work"], ["I ___ interested in AI.", "am"]],
    shadow: [["Hi, my name is Boss.", "สวัสดี ผมชื่อบอส"], ["I'm from Thailand.", "ผมมาจากประเทศไทย"], ["I work at a technology company.", "ผมทำงานที่บริษัทเทคโนโลยี"], ["I'm interested in AI.", "ผมสนใจ AI"], ["I'm excited to improve my English.", "ผมตื่นเต้นที่จะพัฒนาภาษาอังกฤษ"]],
    prompts: ["Hello! What's your name?", "Where are you from?", "What do you do?", "What are you interested in?"],
    models: ["Hi, my name is Boss.", "I'm from Thailand, and I live in Bangkok.", "I work in technology.", "I'm interested in coding, AI, and learning English."]
  },
  {
    id: "L03", level: "A1", phase: "foundation",
    th: "วันธรรมดาของฉัน", en: "My Normal Weekday",
    situationTh: "เล่ากิจวัตรตั้งแต่เช้าถึงเย็น",
    situationEn: "Describe a normal day from morning to evening.",
    tense: ["Present Simple", "frequency adverbs"],
    exit: "เล่ากิจวัตร 6 ขั้นพร้อมคำบอกความถี่อย่างน้อย 2 คำ",
    safe: "I/You/We/They + verb; He/She/It + verb-s",
    vocab: ["wake", "breakfast", "bus", "usually", "often", "start", "finish", "relax"],
    tags: ["Daily Life", "Time"],
    chunks: ["wake up at...", "have breakfast", "start work at...", "usually work from...", "finish work at...", "relax after work"],
    concept: `# Present Simple = สิ่งที่เป็นปกติ
ใช้กับกิจวัตร ข้อเท็จจริง ความชอบ และตารางประจำ
- \`I start work at nine.\`
- \`She starts work at nine.\`
คำที่พบบ่อย: usually, often, sometimes, every day
ตำแหน่ง: \`I usually work at home.\` แต่ \`I am usually tired.\`
💡 อย่าเติม am ก่อน action verb: \`I work\` ไม่ใช่ \`I am work\``,
    story: `On weekdays, Ken usually wakes up at seven. He has breakfast at home and takes a bus to work. He starts work at nine. He often has lunch with a colleague. He finishes work at six and walks home. In the evening, he relaxes and studies English for twenty minutes.`,
    questions: ["How does Ken go to work?", "What does he do in the evening?"],
    readingOptions: ["He takes a bus.", "He drives a taxi.", "He relaxes and studies English.", "He starts work again."],
    readingAnswers: ["He takes a bus.", "He relaxes and studies English."],
    fill: [["Ken usually ___ up at seven. (wake)", "wakes"], ["He ___ work at nine. (start)", "starts"], ["I often ___ English after work. (study)", "study"], ["She ___ at home in the evening. (relax)", "relaxes"]],
    shadow: [["I usually wake up at seven.", "ปกติฉันตื่นเจ็ดโมง"], ["I have breakfast at home.", "ฉันกินอาหารเช้าที่บ้าน"], ["I start work at nine.", "ฉันเริ่มงานเก้าโมง"], ["I often study after work.", "ฉันมักเรียนหลังเลิกงาน"], ["I relax in the evening.", "ฉันพักผ่อนตอนเย็น"]],
    prompts: ["What time do you usually wake up?", "What do you do before work?", "When do you start work?", "What do you do in the evening?"],
    models: ["I usually wake up at seven.", "I have breakfast and check my messages.", "I start work at nine.", "I usually relax and study English in the evening."]
  },
  {
    id: "L04", level: "A1", phase: "foundation",
    th: "ถามเพื่อรู้จักกัน", en: "Getting to Know Someone",
    situationTh: "ถามและตอบเรื่องงาน ความชอบ และวันหยุด",
    situationEn: "Ask and answer about work, interests, and weekends.",
    tense: ["Present Simple questions and negatives"],
    exit: "สนทนาแนะนำตัว 6 ช่วงโดยถามกลับอย่างน้อย 3 คำถาม",
    safe: "Do/Does + subject + base verb? และ don't/doesn't + base verb",
    vocab: ["hobby", "weekend", "family", "question", "understand", "prefer", "enjoy", "often"],
    tags: ["Personal", "Communication"],
    chunks: ["What do you do?", "Where do you work?", "What do you enjoy?", "Do you...?", "I don't usually...", "How about you?"],
    concept: `# คำถาม Present Simple ใช้ do/does
- \`Do you work from home?\`
- \`Does she work from home?\`
- \`Where do you live?\`
หลัง do/does ใช้กริยารูปพื้นฐานเสมอ
✅ \`Does he enjoy music?\`
❌ \`Does he enjoys music?\`
ปฏิเสธ: \`I don't...\` / \`He doesn't...\`
💡 ตอบแล้วถามกลับด้วย \`How about you?\` เพื่อให้บทสนทนาเดินต่อ`,
    story: `Maya meets a new colleague named Tom. She asks, “What do you do?” Tom says he works with customers. Maya asks, “Do you enjoy your job?” He says, “Yes, I do, but I don't work on weekends.” Tom then asks Maya about her hobbies. She enjoys cooking and often visits her family.`,
    questions: ["Does Tom work on weekends?", "What does Maya enjoy?"],
    readingOptions: ["No — he doesn't.", "Yes — he does.", "She enjoys cooking.", "She enjoys driving a bus."],
    readingAnswers: ["No — he doesn't.", "She enjoys cooking."],
    fill: [["___ you work from home?", "Do"], ["Where ___ she live?", "does"], ["He doesn't ___ on weekends. (work)", "work"], ["What do you ___? (enjoy)", "enjoy"]],
    shadow: [["What do you do?", "คุณทำงานอะไร"], ["Where do you work?", "คุณทำงานที่ไหน"], ["Do you enjoy your job?", "คุณชอบงานของคุณไหม"], ["I don't work on weekends.", "ฉันไม่ทำงานวันหยุดสุดสัปดาห์"], ["How about you?", "แล้วคุณล่ะ"]],
    prompts: ["What do you do?", "Do you work from home?", "What do you enjoy after work?", "What do you usually do on weekends?"],
    models: ["I work in technology.", "Yes, I sometimes work from home.", "I enjoy watching videos and learning new things.", "I usually relax and spend time with my family. How about you?"]
  },
  {
    id: "L05", level: "A1", phase: "foundation",
    th: "ตอนนี้กำลังเกิดอะไรขึ้น", en: "What's Happening Now?",
    situationTh: "บอกสิ่งที่ตนเองและคนรอบตัวกำลังทำ",
    situationEn: "Describe actions happening around you now.",
    tense: ["Present Continuous"],
    exit: "บรรยายภาพหรือสถานการณ์ปัจจุบัน 5 ประโยค",
    safe: "subject + am/is/are + verb-ing",
    vocab: ["wait", "wear", "talk", "use", "currently", "now", "sit", "stand"],
    tags: ["Daily Life", "Time"],
    chunks: ["I'm waiting for...", "She's talking to...", "They're sitting...", "What are you doing?", "I'm using...", "right now"],
    concept: `# Present Continuous = กำลังเกิดหรือชั่วคราว
โครงสร้าง: subject + am/is/are + V-ing
- \`I'm waiting for the bus.\`
- \`She is talking on the phone.\`
- \`They are sitting near the door.\`
คำใบ้: now, right now, at the moment, currently
คำถาม: \`What are you doing?\`
💡 \`I am at the station\` บอกตำแหน่ง ไม่ใช่ Continuous เพราะไม่มี V-ing`,
    story: `It is eight in the morning. Arun is waiting at a bus stop. He is wearing a blue shirt and carrying a bag. Two people are sitting on a bench. A woman is talking on her phone. A bus is coming now, so everyone is standing up.`,
    questions: ["Where is Arun waiting?", "What are people doing when the bus comes?"],
    readingOptions: ["At a bus stop.", "At an airport.", "They are standing up.", "They are going to sleep."],
    readingAnswers: ["At a bus stop.", "They are standing up."],
    fill: [["Arun ___ for the bus. (wait)", "is waiting"], ["Two people ___ on a bench. (sit)", "are sitting"], ["I ___ English now. (study)", "am studying"], ["What ___ you doing?", "are"]],
    shadow: [["I'm waiting for the bus.", "ฉันกำลังรอรถบัส"], ["She's talking on the phone.", "เธอกำลังคุยโทรศัพท์"], ["They're sitting near the door.", "พวกเขากำลังนั่งใกล้ประตู"], ["The bus is coming now.", "รถบัสกำลังมาแล้ว"], ["What are you doing?", "คุณกำลังทำอะไรอยู่"]],
    prompts: ["Where are you right now?", "What are you doing?", "What is someone near you doing?", "Are you using a phone or a computer?"],
    models: ["I'm at home right now.", "I'm studying English.", "Someone near me is working.", "I'm using a computer."]
  },
  {
    id: "L06", level: "A1", phase: "foundation",
    th: "ปกติ vs ตอนนี้", en: "Usually vs Right Now",
    situationTh: "แยกกิจวัตรออกจากเหตุการณ์ชั่วคราว",
    situationEn: "Contrast a normal routine with a temporary action.",
    tense: ["Present Simple", "Present Continuous"],
    exit: "พูดคู่เปรียบเทียบกิจวัตรกับวันนี้ 4 คู่",
    safe: "usually/every day → Simple; now/today at this moment → Continuous",
    vocab: ["normally", "today", "usually", "currently", "work", "study", "stay", "change"],
    tags: ["Daily Life", "Time"],
    chunks: ["I usually..., but today I'm...", "normally works...", "is currently...", "every day", "right now"],
    concept: `# ให้ดู “ความหมาย” ไม่ใช่แค่คำบอกเวลา
Present Simple = รูปแบบปกติ: \`I work at the office.\`
Present Continuous = ตอนนี้หรือชั่วคราว: \`I'm working at home today.\`
\`today\` อาจใช้ Simple ได้ถ้าพูดถึงตารางหรือข้อเท็จจริง แต่ในบทนี้เราใช้กับสถานการณ์ชั่วคราว
💡 สูตรพูดที่ใช้ได้จริง: \`I usually..., but today I'm...\``,
    story: `Leo usually works at the office, but today he is working from home. He normally eats lunch with his team, but today he is eating alone. His team usually has a meeting on Thursday. Right now, they are using an online call because Leo is not at the office.`,
    questions: ["Where does Leo usually work?", "Why is the team using an online call?"],
    readingOptions: ["At the office.", "At a hotel.", "Because Leo is at home.", "Because Thursday is a holiday."],
    readingAnswers: ["At the office.", "Because Leo is at home."],
    fill: [["Leo usually ___ at the office. (work)", "works"], ["Today he ___ from home. (work)", "is working"], ["We normally ___ at noon. (eat)", "eat"], ["Right now we ___ online. (talk)", "are talking"]],
    shadow: [["I usually work at the office.", "ปกติฉันทำงานที่ออฟฟิศ"], ["Today, I'm working from home.", "วันนี้ฉันกำลังทำงานจากบ้าน"], ["We normally eat together.", "ปกติเรากินด้วยกัน"], ["Right now, we're talking online.", "ตอนนี้เรากำลังคุยออนไลน์"], ["My routine is changing today.", "กิจวัตรของฉันเปลี่ยนไปวันนี้"]],
    prompts: ["Where do you usually work?", "Where are you working today?", "What do you normally eat for lunch?", "What are you doing differently today?"],
    models: ["I usually work at the office.", "I'm working at home today.", "I normally eat rice for lunch.", "Today, I'm studying English after work."]
  },
  {
    id: "L07", level: "A1", phase: "communication",
    th: "เมื่อวานฉันทำอะไร", en: "What I Did Yesterday",
    situationTh: "เล่าเหตุการณ์ง่าย ๆ ที่เกิดและจบแล้ว",
    situationEn: "Report completed actions from yesterday.",
    tense: ["Past Simple regular verbs"],
    exit: "เล่าเหตุการณ์เมื่อวาน 6 ประโยคตามลำดับ",
    safe: "finished past time → verb-ed; negative/question → did + base verb",
    vocab: ["yesterday", "clean", "cook", "watch", "call", "visit", "finish", "start"],
    tags: ["Daily Life", "Time"],
    chunks: ["Yesterday, I...", "started work", "finished at...", "called a friend", "watched a video", "didn't..."],
    concept: `# Past Simple = จบแล้วในอดีต
- \`I worked yesterday.\`
- \`She called me last night.\`
- \`We didn't watch the movie.\`
- \`Did you finish the task?\`
กริยาปกติเติม -ed แต่การออกเสียงมีหลายแบบ ไม่ต้องท่องสัญลักษณ์ก่อน ให้ฟังและพูดเป็นคำ
💡 เมื่อมี did/didn't กริยาหลักกลับเป็นรูปพื้นฐาน`,
    story: `Yesterday, Mali started work at nine. She answered several messages and finished a report before lunch. In the afternoon, she called a customer. After work, she visited her sister. They cooked dinner and watched a movie. Mali didn't study English because she arrived home late.`,
    questions: ["What did Mali finish before lunch?", "Why didn't she study English?"],
    readingOptions: ["A report.", "A movie.", "She arrived home late.", "She forgot her name."],
    readingAnswers: ["A report.", "She arrived home late."],
    fill: [["Mali ___ work at nine. (start)", "started"], ["She ___ a customer. (call)", "called"], ["They ___ dinner. (cook)", "cooked"], ["She didn't ___ English. (study)", "study"]],
    shadow: [["Yesterday, I started work at nine.", "เมื่อวานฉันเริ่มงานเก้าโมง"], ["I finished a report before lunch.", "ฉันทำรายงานเสร็จก่อนมื้อเที่ยง"], ["I called a customer.", "ฉันโทรหาลูกค้า"], ["I visited my sister after work.", "ฉันไปหาพี่สาวหรือน้องสาวหลังเลิกงาน"], ["I didn't study last night.", "เมื่อคืนฉันไม่ได้เรียน"]],
    prompts: ["What time did you start your day?", "What did you do in the morning?", "Who did you talk to?", "What did you do after work?"],
    models: ["I started my day at seven.", "I worked and answered messages in the morning.", "I talked to my colleagues.", "I watched a video and relaxed after work."]
  },
  {
    id: "L08", level: "A1", phase: "communication",
    th: "เล่าเรื่องวันหยุดที่ผ่านมา", en: "My Last Weekend",
    situationTh: "เล่าเรื่องสั้นโดยใช้กริยาอดีตที่เปลี่ยนรูปบ่อย",
    situationEn: "Tell a short weekend story with common irregular verbs.",
    tense: ["Past Simple irregular verbs"],
    exit: "เล่าเรื่องวันหยุด 60 วินาทีโดยใช้กริยาอดีตต่างกัน 5 คำ",
    safe: "จำกริยาเป็นคู่ใน chunk: go-went, have-had, get-got, make-made",
    vocab: ["go", "have", "make", "find", "take", "meet", "buy", "get"],
    tags: ["Daily Life", "Time"],
    chunks: ["went to...", "had lunch", "met a friend", "took a bus", "bought...", "got home"],
    concept: `# Irregular verbs เปลี่ยนรูป
อย่าจำเป็นรายการยาว ให้จำจากเรื่องที่ใช้จริง
- go → went
- have → had
- meet → met
- take → took
- buy → bought
- get → got
- make → made
- find → found
คำถามและปฏิเสธยังใช้ did + base verb: \`Did you go?\` / \`I didn't go.\``,
    story: `Last Saturday, Dan went to a market with his friend. They took a train and got there at ten. Dan bought a small gift and found a good restaurant. They had lunch and met another friend there. In the evening, Dan made dinner at home and went to bed early.`,
    questions: ["How did Dan travel to the market?", "What did he do at home in the evening?"],
    readingOptions: ["He took a train.", "He drove a plane.", "He made dinner.", "He bought another train."],
    readingAnswers: ["He took a train.", "He made dinner."],
    fill: [["Dan ___ to a market. (go)", "went"], ["They ___ a train. (take)", "took"], ["He ___ a gift. (buy)", "bought"], ["They ___ lunch. (have)", "had"]],
    shadow: [["I went to a market last Saturday.", "ฉันไปตลาดเมื่อวันเสาร์ที่แล้ว"], ["I took a train with a friend.", "ฉันนั่งรถไฟกับเพื่อน"], ["We had lunch together.", "เรากินมื้อเที่ยงด้วยกัน"], ["I bought a small gift.", "ฉันซื้อของขวัญชิ้นเล็ก"], ["I got home in the evening.", "ฉันถึงบ้านตอนเย็น"]],
    prompts: ["Where did you go last weekend?", "How did you get there?", "Who did you meet?", "What did you eat or buy?"],
    models: ["I went to a shopping center.", "I took a car.", "I met my family.", "We had lunch, and I bought some food."]
  },
  {
    id: "L09", level: "A2", phase: "communication",
    th: "ตอนที่ปัญหาเกิดขึ้น", en: "When Something Interrupted",
    situationTh: "เล่าการกระทำที่กำลังดำเนินอยู่และเหตุการณ์ที่เข้ามาแทรก",
    situationEn: "Explain what was in progress when another event happened.",
    tense: ["Past Continuous", "Past Simple"],
    exit: "เล่าเหตุขัดข้องหนึ่งเรื่องด้วย was/were-ing + past event",
    safe: "background: was/were + V-ing; interrupting event: Past Simple",
    vocab: ["while", "when", "drive", "rain", "call", "happen", "suddenly", "problem"],
    tags: ["Daily Life", "Time"],
    chunks: ["I was ...ing when...", "While I was...", "suddenly...", "the problem happened", "What were you doing?"],
    concept: `# ฉากหลัง + เหตุการณ์ที่แทรก
- \`I was driving when my phone rang.\`
- \`While I was working, the system stopped.\`
Past Continuous สร้างฉากหรือการกระทำที่กำลังดำเนินอยู่
Past Simple บอกเหตุการณ์สั้นที่เกิดขึ้น
💡 when มักนำเหตุการณ์ที่แทรก; while มักนำการกระทำที่กำลังดำเนินอยู่ แต่ให้ดูความหมายเป็นหลัก`,
    story: `Nok was driving home when heavy rain started. She was listening to music, so she didn't hear her phone. While she was waiting at a red light, the car suddenly stopped. She called her brother and explained the problem. He arrived twenty minutes later and helped her.`,
    questions: ["What was Nok doing when the rain started?", "When did the car stop?"],
    readingOptions: ["She was driving home.", "She was sleeping.", "While she was waiting at a red light.", "After she arrived home."],
    readingAnswers: ["She was driving home.", "While she was waiting at a red light."],
    fill: [["Nok ___ home when it started to rain. (drive)", "was driving"], ["She ___ for the light when the car stopped. (wait)", "was waiting"], ["The car suddenly ___. (stop)", "stopped"], ["What ___ you doing?", "were"]],
    shadow: [["I was driving home when it started to rain.", "ฉันกำลังขับรถกลับบ้านตอนฝนเริ่มตก"], ["I was listening to music.", "ฉันกำลังฟังเพลงอยู่"], ["The car suddenly stopped.", "รถหยุดกะทันหัน"], ["I called my brother.", "ฉันโทรหาพี่ชายหรือน้องชาย"], ["He arrived and helped me.", "เขามาถึงและช่วยฉัน"]],
    prompts: ["What were you doing when the problem happened?", "What happened suddenly?", "Who did you call?", "How did the situation end?"],
    models: ["I was working when the problem happened.", "My computer suddenly stopped.", "I called a colleague.", "We restarted it, and it worked again."]
  },
  {
    id: "L10", level: "A2", phase: "communication",
    th: "แผนที่ตั้งใจไว้", en: "Plans with Going To",
    situationTh: "บอกสิ่งที่ตั้งใจจะทำและเหตุผล",
    situationEn: "State intended plans and reasons.",
    tense: ["be going to"],
    exit: "พูดแผน 3 เรื่องพร้อมเหตุผลและเวลา",
    safe: "subject + am/is/are going to + base verb",
    vocab: ["plan", "travel", "visit", "learn", "money", "walk", "next", "reason"],
    tags: ["Daily Life", "Future"],
    chunks: ["I'm going to...", "next week", "this weekend", "because I want to...", "Are you going to...?"],
    concept: `# going to = มีความตั้งใจหรือแผนแล้ว
- \`I'm going to visit my family this weekend.\`
- \`She's going to learn English.\`
- \`Are you going to travel next month?\`
รูปปฏิเสธ: \`I'm not going to...\`
💡 \`I'm going to Bangkok\` อาจหมายถึงกำลังเดินทางไปกรุงเทพ เพราะหลัง to เป็นสถานที่ ส่วน future pattern ต้องเป็น \`going to + verb\``,
    story: `This weekend, Fern is going to visit her parents. She is going to take an early train because she wants more time with them. On Saturday, they are going to cook together. On Sunday, Fern is going to walk in the park and take some photos. She isn't going to work.`,
    questions: ["Why is Fern taking an early train?", "Is she going to work on Sunday?"],
    readingOptions: ["She wants more time with her parents.", "She dislikes trains.", "No — she isn't.", "Yes — she is."],
    readingAnswers: ["She wants more time with her parents.", "No — she isn't."],
    fill: [["I ___ going to visit my family.", "am"], ["She is going to ___ a train. (take)", "take"], ["They ___ going to cook together.", "are"], ["I am not going to ___ this weekend. (work)", "work"]],
    shadow: [["I'm going to visit my family.", "ฉันวางแผนจะไปหาครอบครัว"], ["I'm going to take an early train.", "ฉันวางแผนจะขึ้นรถไฟเช้า"], ["We're going to cook together.", "เราวางแผนจะทำอาหารด้วยกัน"], ["I'm not going to work this weekend.", "ฉันไม่ได้วางแผนทำงานสุดสัปดาห์นี้"], ["What are you going to do?", "คุณวางแผนจะทำอะไร"]],
    prompts: ["What are you going to do this weekend?", "Where are you going to go?", "Who are you going to meet?", "Why are you going to do that?"],
    models: ["I'm going to relax and study English.", "I'm going to go to a café.", "I'm going to meet a friend.", "Because I want to practice speaking and have a good time."]
  },
  {
    id: "L11", level: "A2", phase: "communication",
    th: "นัดหมายที่จัดไว้แล้ว", en: "Arrangements and Appointments",
    situationTh: "นัดเวลาและยืนยันแผนที่จัดไว้แล้ว",
    situationEn: "Arrange and confirm a scheduled meeting.",
    tense: ["Present Continuous for future"],
    exit: "นัดพบหนึ่งครั้งโดยตกลงวัน เวลา และสถานที่",
    safe: "am/is/are + V-ing + future time for a fixed arrangement",
    vocab: ["appointment", "available", "meet", "schedule", "tomorrow", "tonight", "free", "arrange"],
    tags: ["Work", "Time", "Communication"],
    chunks: ["Are you free...?", "I'm meeting...", "We're having...", "What time are we meeting?", "See you at..."],
    concept: `# Present Continuous ใช้กับนัดหมายอนาคตได้
เมื่อเวลา/คน/สถานที่ถูกจัดไว้แล้ว:
- \`I'm meeting May tomorrow at ten.\`
- \`We're having dinner tonight.\`
เปรียบเทียบ: \`I'm going to meet May\` เน้นความตั้งใจ; \`I'm meeting May at ten\` ฟังเหมือนนัดเรียบร้อยแล้ว
💡 ถ้าไม่ต้องการเน้นความต่างมาก ใช้รูปที่จำง่ายและสื่อได้ก่อน`,
    story: `Pat calls Mina to arrange a meeting. Mina is meeting a customer on Monday morning, but she is free in the afternoon. They agree to meet at three at a café near the office. Pat is bringing the project notes, and Mina is preparing three questions. They are meeting for about one hour.`,
    questions: ["When are Pat and Mina meeting?", "What is Pat bringing?"],
    readingOptions: ["Monday at three.", "Sunday at nine.", "The project notes.", "A customer."],
    readingAnswers: ["Monday at three.", "The project notes."],
    fill: [["We ___ meeting at three tomorrow.", "are"], ["I ___ having dinner with May tonight.", "am"], ["What time ___ we meeting?", "are"], ["She is ___ a customer on Monday. (meet)", "meeting"]],
    shadow: [["Are you free tomorrow afternoon?", "พรุ่งนี้บ่ายคุณว่างไหม"], ["I'm meeting a customer in the morning.", "ฉันมีนัดพบลูกค้าตอนเช้า"], ["We're meeting at three.", "เรานัดเจอกันตอนบ่ายสาม"], ["I'm bringing the project notes.", "ฉันจะนำบันทึกโครงการไป"], ["See you at the café.", "เจอกันที่คาเฟ่"]],
    prompts: ["Are you free tomorrow afternoon?", "What time can we meet?", "Where are we meeting?", "What are you bringing?"],
    models: ["Yes, I'm free after two.", "We're meeting at three.", "We're meeting at the café near the office.", "I'm bringing my notes."]
  },
  {
    id: "L12", level: "A2", phase: "communication",
    th: "ตัดสินใจ เสนอ และคาดการณ์", en: "Decisions and Offers with Will",
    situationTh: "ตอบสนองต่อสถานการณ์ที่เพิ่งเกิดขึ้น",
    situationEn: "React with an immediate decision, offer, or prediction.",
    tense: ["will"],
    exit: "ตอบสนองต่อสถานการณ์เปลี่ยนแปลง 4 แบบอย่างเป็นธรรมชาติ",
    safe: "will + base verb; ใช้ I'll... สำหรับการตัดสินใจหรือเสนอ ณ ตอนพูด",
    vocab: ["decide", "promise", "offer", "probably", "think", "help", "check", "worry"],
    tags: ["Future", "Communication"],
    chunks: ["I'll help you.", "I'll check.", "Don't worry.", "I think it will...", "Will you...?", "I won't..."],
    concept: `# will ใช้เมื่อเราตอบสนองตอนพูด
- ตัดสินใจทันที: \`The phone is ringing. I'll answer it.\`
- เสนอ: \`I'll help you.\`
- สัญญา: \`I won't forget.\`
- คาดการณ์/ความเห็น: \`I think it will rain.\`
เปรียบเทียบ: going to = มีแผนก่อนพูด; will = ตัดสินใจตอนนี้หรือคาดการณ์
💡 ในชีวิตจริงสองรูปอาจทับกันได้ ให้เลือกจากเจตนาหลัก`,
    story: `Kai and June are preparing dinner. June sees that there is no rice. Kai says, “I'll buy some.” Then June's phone rings, but her hands are wet. Kai says, “I'll answer it.” The sky is getting dark, and June thinks it will rain. Kai promises he won't be long.`,
    questions: ["Why does Kai decide to buy rice?", "What does June predict?"],
    readingOptions: ["There is no rice.", "He planned it last week.", "She thinks it will rain.", "She thinks dinner will disappear."],
    readingAnswers: ["There is no rice.", "She thinks it will rain."],
    fill: [["The phone is ringing. I ___ answer it.", "will"], ["Don't worry. I ___ help you.", "will"], ["I think it ___ rain.", "will"], ["I ___ forget. (negative)", "won't"]],
    shadow: [["I'll buy some rice.", "ฉันจะไปซื้อข้าวเอง"], ["I'll answer the phone.", "ฉันจะรับโทรศัพท์เอง"], ["Don't worry. I'll help you.", "ไม่ต้องกังวล ฉันจะช่วยคุณ"], ["I think it will rain.", "ฉันคิดว่าฝนจะตก"], ["I won't be long.", "ฉันจะไปไม่นาน"]],
    prompts: ["I can't carry these bags.", "The phone is ringing.", "We don't know the answer.", "Look at those dark clouds."],
    models: ["I'll help you carry them.", "I'll answer it.", "I'll check the information.", "I think it will rain soon."]
  },
  {
    id: "L13", level: "A2", phase: "communication",
    th: "เคยหรือไม่เคย", en: "Life Experience",
    situationTh: "ถามและตอบเกี่ยวกับประสบการณ์โดยไม่ระบุเวลา",
    situationEn: "Ask and answer about life experience without a finished time.",
    tense: ["Present Perfect for experience"],
    exit: "ถามและตอบ Have you ever...? 4 หัวข้อพร้อมรายละเอียดต่อหนึ่งประโยค",
    safe: "have/has + past participle; ใช้ Past Simple เมื่อตามด้วยเวลาที่จบแล้ว",
    vocab: ["ever", "never", "experience", "try", "visit", "see", "eat", "travel"],
    tags: ["Daily Life", "Travel"],
    chunks: ["Have you ever...?", "I've never...", "Yes, I have.", "No, I haven't.", "I went there in..."],
    concept: `# Present Perfect มองประสบการณ์ถึงตอนนี้
- \`Have you ever visited Japan?\`
- \`I've never tried that food.\`
ไม่ระบุเวลาที่จบแล้วในประโยค Present Perfect
✅ \`I've visited Japan.\`
✅ \`I visited Japan in 2024.\`
❌ \`I've visited Japan in 2024.\`
💡 หลังตอบ Yes/No ให้เพิ่มรายละเอียดด้วย Past Simple`,
    story: `Pim and Alex are talking about travel. Pim has visited three countries, but she has never been to Japan. Alex has been to Japan twice. He first went there in 2023. Pim asks if he has ever tried a traditional breakfast. Alex says yes and tells her that he ate it in Kyoto.`,
    questions: ["Has Pim been to Japan?", "When did Alex first go to Japan?"],
    readingOptions: ["No — she hasn't.", "Yes — she has.", "In 2023.", "He has never gone."],
    readingAnswers: ["No — she hasn't.", "In 2023."],
    fill: [["Have you ever ___ Japan? (visit)", "visited"], ["I have never ___ that food. (try)", "tried"], ["He ___ there in 2023. (go)", "went"], ["___ she ever traveled abroad?", "Has"]],
    shadow: [["Have you ever visited Japan?", "คุณเคยไปญี่ปุ่นไหม"], ["No, I haven't.", "ไม่ ฉันยังไม่เคย"], ["I've never tried that food.", "ฉันไม่เคยลองอาหารนั้น"], ["I've traveled to three countries.", "ฉันเคยเดินทางไปสามประเทศ"], ["I went there in 2023.", "ฉันไปที่นั่นในปี 2023"]],
    prompts: ["Have you ever traveled abroad?", "Have you ever tried Japanese food?", "Have you ever met someone famous?", "Have you ever studied all night?"],
    models: ["Yes, I have. I traveled abroad a few years ago.", "Yes, I have. I tried it at a restaurant.", "No, I haven't, but I'd like to.", "Yes, I have. I studied all night before an important task."]
  },
  {
    id: "L14", level: "A2", phase: "communication",
    th: "อดีตที่ยังมีผลตอนนี้", en: "A Recent Result",
    situationTh: "อธิบายปัญหาหรือผลลัพธ์ปัจจุบันและบอกว่าเกิดเมื่อใด",
    situationEn: "Explain a present result and say when it happened.",
    tense: ["Present Perfect", "Past Simple"],
    exit: "รายงานปัญหาปัจจุบันหนึ่งเรื่องและตอบคำถามว่าเกิดเมื่อใด",
    safe: "result now → Present Perfect; finished time/detail → Past Simple",
    vocab: ["already", "yet", "just", "lose", "break", "finish", "happen", "problem"],
    tags: ["Daily Life", "Time"],
    chunks: ["I've just...", "I've already...", "I haven't ... yet.", "What happened?", "When did it happen?"],
    concept: `# Present Perfect เชื่อมอดีตกับตอนนี้
- \`I've lost my key.\` → ตอนนี้ยังไม่มีกุญแจ
- \`I've just finished.\`
- \`I haven't called yet.\`
เมื่อถามรายละเอียดเวลาที่จบแล้ว เปลี่ยนเป็น Past Simple:
\`When did you lose it?\` — \`I lost it this morning.\`
💡 เลือกตามสิ่งที่กำลังเน้น: ผลตอนนี้ หรือเหตุการณ์ตอนนั้น`,
    story: `Nina can't open her apartment door because she has lost her key. She thinks she dropped it this morning. She has already checked her bag, but she hasn't found it yet. Her brother has just arrived, so he can open the door. Nina calls the café she visited earlier and asks about the key.`,
    questions: ["Why can't Nina open the door?", "What has she already checked?"],
    readingOptions: ["She has lost her key.", "The door has disappeared.", "Her bag.", "Her brother's phone."],
    readingAnswers: ["She has lost her key.", "Her bag."],
    fill: [["I have just ___ the task. (finish)", "finished"], ["She hasn't ___ the key yet. (find)", "found"], ["When did you ___ it? (lose)", "lose"], ["I ___ it this morning. (lose)", "lost"]],
    shadow: [["I've lost my key.", "ฉันทำกุญแจหายและตอนนี้ยังหาไม่เจอ"], ["I've already checked my bag.", "ฉันตรวจในกระเป๋าแล้ว"], ["I haven't found it yet.", "ฉันยังหาไม่เจอ"], ["When did you lose it?", "คุณทำหายเมื่อไร"], ["I lost it this morning.", "ฉันทำหายเมื่อเช้านี้"]],
    prompts: ["What's the problem?", "What have you already done?", "When did the problem happen?", "What are you going to do next?"],
    models: ["I've lost an important file.", "I've already checked my computer.", "It happened this morning.", "I'm going to ask a colleague for help."]
  },
  {
    id: "L15", level: "A2", phase: "communication",
    th: "นานแค่ไหน: for, since, ago, about", en: "Talking About Duration",
    situationTh: "บอกระยะเวลา จุดเริ่มต้น และเวลาประมาณ",
    situationEn: "Explain duration, starting point, and approximate time.",
    tense: ["Present Perfect with for/since", "Past Simple with ago"],
    exit: "บอกระยะเวลาเกี่ยวกับชีวิตจริง 3 เรื่องโดยเลือก for/since/ago/about ถูกความหมาย",
    safe: "for + ระยะเวลา; since + จุดเริ่ม; ago + ย้อนจากตอนนี้; about + ประมาณ",
    vocab: ["for", "since", "ago", "about", "time", "hour", "year", "wait"],
    tags: ["Time", "Daily Life"],
    chunks: ["for three hours", "for about three hours", "since Monday", "two years ago", "How long have you...?"],
    concept: `# สี่คำที่ไม่ควรจำปนกัน
- \`for three hours\` = เป็นเวลา 3 ชั่วโมง
- \`for about three hours\` = เป็นเวลาประมาณ 3 ชั่วโมง
- \`since Monday\` = ตั้งแต่วันจันทร์ถึงตอนนี้
- \`two years ago\` = เมื่อสองปีก่อน
\`about\` บอกความไม่เป๊ะ ส่วน \`for\` บอกระยะเวลา จึงใช้ร่วมกันได้
✅ \`I studied for about three hours.\`
❌ \`I studied about for three hours.\``,
    story: `Mew has worked at the same company for four years. She has lived in Bangkok since 2021. She started learning English about two years ago. So far today, she has studied for about thirty minutes. Yesterday, she waited for a bus for forty minutes, but the trip took only twenty minutes.`,
    questions: ["How long has Mew worked at the company?", "When did she start learning English?"],
    readingOptions: ["For four years.", "Since four hours.", "About two years ago.", "For yesterday."],
    readingAnswers: ["For four years.", "About two years ago."],
    fill: [["I have worked here ___ four years.", "for"], ["She has lived here ___ 2021.", "since"], ["I started two years ___.", "ago"], ["I studied for ___ thirty minutes.", "about"]],
    shadow: [["I've worked here for four years.", "ฉันทำงานที่นี่มาเป็นเวลาสี่ปี"], ["I've lived here since 2021.", "ฉันอยู่ที่นี่มาตั้งแต่ปี 2021"], ["I started two years ago.", "ฉันเริ่มเมื่อสองปีก่อน"], ["I studied for about thirty minutes.", "ฉันเรียนประมาณสามสิบนาที"], ["How long have you worked here?", "คุณทำงานที่นี่มานานเท่าไร"]],
    prompts: ["How long have you lived in your city?", "How long have you worked at your company?", "When did you start learning English?", "How long did you study today?"],
    models: ["I've lived in my city for many years.", "I've worked at my company since 2022.", "I started learning English a few years ago.", "I studied for about thirty minutes today."]
  },
  {
    id: "L16", level: "A2", phase: "connector",
    th: "ทำได้ จำเป็น และควรทำ", en: "Ability, Need, and Advice",
    situationTh: "ขอความช่วยเหลือ บอกความจำเป็น และให้คำแนะนำ",
    situationEn: "Ask for help, state a need, and give practical advice.",
    tense: ["can/could", "should", "have to"],
    exit: "แก้สถานการณ์หนึ่งเรื่องด้วยคำขอ คำแนะนำ และข้อจำเป็น",
    safe: "modal + base verb; have to + base verb",
    vocab: ["ability", "advice", "ask", "necessary", "possible", "recommend", "help", "need"],
    tags: ["Communication", "Daily Life"],
    chunks: ["Can you help me?", "Could you...?", "You should...", "I have to...", "Do I need to...?", "You don't have to..."],
    concept: `# เครื่องมือสื่อสารที่จำเป็น แต่ไม่ใช่ tense
- can = ความสามารถ/ขอแบบทั่วไป
- could = ขออย่างสุภาพขึ้นหรือความเป็นไปได้
- should = คำแนะนำ
- have to = ความจำเป็น
หลัง can/could/should ใช้กริยารูปพื้นฐาน
✅ \`Could you help me?\`
❌ \`Could you to help me?\`
💡 คำขอที่ปลอดภัยและใช้กว้าง: \`Could you help me with this?\``,
    story: `Ben is visiting a clinic because he has a bad cough. He asks, “Could you help me?” The nurse says he has to wait for the doctor. She tells him, “You should drink water, and you shouldn't smoke.” Ben asks if he has to pay now. The nurse says he can pay after he sees the doctor.`,
    questions: ["What does Ben have to do?", "What advice does the nurse give?"],
    readingOptions: ["He has to wait.", "He has to leave.", "He should drink water.", "He should run outside."],
    readingAnswers: ["He has to wait.", "He should drink water."],
    fill: [["Could you ___ me? (help)", "help"], ["You should ___ some water. (drink)", "drink"], ["I have to ___ for the doctor. (wait)", "wait"], ["You don't have to ___ now. (pay)", "pay"]],
    shadow: [["Could you help me?", "คุณช่วยฉันได้ไหม"], ["You should drink some water.", "คุณควรดื่มน้ำ"], ["You shouldn't smoke.", "คุณไม่ควรสูบบุหรี่"], ["I have to wait for the doctor.", "ฉันจำเป็นต้องรอหมอ"], ["You can pay later.", "คุณจ่ายทีหลังได้"]],
    prompts: ["I don't understand this form.", "I have a bad cough.", "Do I have to pay now?", "Can I wait here?"],
    models: ["Could you show me how to complete it?", "You should see a doctor and drink water.", "No, you don't have to pay now.", "Yes, you can wait here."]
  },
  {
    id: "L17", level: "A2", phase: "connector",
    th: "ฟังไม่ทันก็ไปต่อได้", en: "Clarify and Repair",
    situationTh: "กู้บทสนทนาเมื่อฟังไม่ออกหรือไม่เข้าใจคำหนึ่งคำ",
    situationEn: "Repair a conversation when you miss or misunderstand something.",
    tense: ["clarification phrases"],
    exit: "ใช้วลีแก้บทสนทนาอย่างน้อย 4 แบบโดยไม่เปลี่ยนเป็นภาษาไทย",
    safe: "Sorry, could you say that again more slowly?",
    vocab: ["repeat", "slowly", "mean", "explain", "understand", "clearly", "confirm", "again"],
    tags: ["Communication", "Politeness"],
    chunks: ["Could you say that again?", "Could you speak more slowly?", "What does ... mean?", "Do you mean...?", "Let me check if I understand."],
    concept: `# เป้าหมายไม่ใช่ฟังออกทุกคำ แต่รักษาบทสนทนา
1. บอกปัญหา: \`Sorry, I didn't catch that.\`
2. ขอซ้ำ/ช้าลง: \`Could you say that again more slowly?\`
3. ถามความหมาย: \`What does “refund” mean?\`
4. ยืนยัน: \`Do you mean I should wait here?\`
5. สรุป: \`Let me check if I understand.\`
💡 ประโยคค่าเริ่มต้นใช้ได้แทบทุกที่: \`Sorry, could you say that again?\``,
    story: `A customer tells Jay that his appointment has been moved to Thursday. Jay doesn't catch the new time. He says, “Sorry, could you say that again more slowly?” The customer repeats the information. Jay asks, “Do you mean Thursday at three?” The customer says yes. Jay then confirms, “So the appointment is Thursday at three, correct?”`,
    questions: ["What information did Jay miss?", "How did he confirm the information?"],
    readingOptions: ["The new appointment time.", "The customer's name.", "He repeated Thursday at three.", "He ended the call."],
    readingAnswers: ["The new appointment time.", "He repeated Thursday at three."],
    fill: [["Could you say that ___?", "again"], ["Could you speak more ___?", "slowly"], ["What does this word ___?", "mean"], ["Do you ___ Thursday at three?", "mean"]],
    shadow: [["Sorry, I didn't catch that.", "ขอโทษ ฉันฟังตรงนั้นไม่ทัน"], ["Could you say that again?", "ช่วยพูดอีกครั้งได้ไหม"], ["Could you speak more slowly?", "ช่วยพูดช้าลงได้ไหม"], ["What does this word mean?", "คำนี้หมายความว่าอะไร"], ["Do you mean Thursday at three?", "คุณหมายถึงวันพฤหัสบดีตอนบ่ายสามใช่ไหม"]],
    prompts: ["Your appointment is on the fifteenth at thirteen thirty.", "Please bring your identification document.", "The service is temporarily unavailable.", "So you need to arrive before noon."],
    models: ["Sorry, could you say the date and time again more slowly?", "What does identification document mean here?", "Do you mean I can't use the service right now?", "Let me check if I understand. I have to arrive before twelve, right?"]
  },
  {
    id: "L18", level: "A2", phase: "connector",
    th: "พูดความรู้สึกและต้นเหตุ", en: "Feelings and Their Causes",
    situationTh: "บอกว่ารู้สึกอย่างไรและอะไรทำให้เกิดความรู้สึกนั้น",
    situationEn: "Express a feeling and explain its cause.",
    tense: ["be/feel + adjective", "-ed vs -ing adjectives"],
    exit: "พูดความรู้สึก 4 แบบพร้อมสาเหตุและระดับอารมณ์",
    safe: "person feels -ed; thing/situation is -ing",
    vocab: ["excited", "exciting", "feel", "boring", "interest", "interesting", "tired", "relaxed"],
    tags: ["Personal", "Communication", "Excitement"],
    chunks: ["I'm excited about...", "I feel...", "It's exciting.", "I'm interested in...", "It makes me feel...", "I'm so..."],
    concept: `# ผู้รู้สึก vs สิ่งที่ทำให้รู้สึก
- \`I'm excited.\` = บอกสภาพตรง ๆ และเป็นธรรมชาติที่สุด
- \`I feel excited.\` = เน้นความรู้สึกภายใน
- \`I'm so excited!\` = เพิ่มระดับอารมณ์
- \`The trip is exciting.\` = การเดินทางทำให้เกิดความตื่นเต้น
หลัก -ed/-ing: person is interested; topic is interesting
💡 ถ้าเลือกไม่ถูก ใช้ \`I'm + feeling adjective\` เป็นค่าเริ่มต้น`,
    story: `Lina is going on her first international trip tomorrow. She is excited about the flight, but she also feels a little nervous. The airport looks busy, and the check-in process is confusing at first. A helpful employee explains everything clearly. Lina feels relaxed after that. She thinks the whole experience is exciting.`,
    questions: ["How does Lina feel about the flight?", "What makes her feel relaxed?"],
    readingOptions: ["She is excited.", "She is boring.", "An employee explains everything.", "The airport closes."],
    readingAnswers: ["She is excited.", "An employee explains everything."],
    fill: [["I am ___ about the trip. (feeling)", "excited"], ["The trip is ___. (cause)", "exciting"], ["This topic is ___. (cause)", "interesting"], ["I feel ___ after work. (feeling)", "tired"]],
    shadow: [["I'm excited about the trip.", "ฉันตื่นเต้นกับการเดินทาง"], ["I feel a little nervous.", "ฉันรู้สึกกังวลเล็กน้อย"], ["The airport is confusing.", "สนามบินชวนให้สับสน"], ["The employee is helpful.", "พนักงานให้ความช่วยเหลือดี"], ["I feel relaxed now.", "ตอนนี้ฉันรู้สึกผ่อนคลาย"]],
    prompts: ["How do you feel about learning English?", "What makes you feel excited?", "What is sometimes confusing for you?", "How do you feel after a long day?"],
    models: ["I'm excited about learning English, but I sometimes feel nervous.", "Traveling and learning new things make me feel excited.", "Fast English is sometimes confusing for me.", "I usually feel tired, but I feel relaxed after I rest."]
  },
  {
    id: "L19", level: "A2", phase: "connector",
    th: "สนามบินและเช็กอิน", en: "Airport Check-in",
    situationTh: "เช็กอิน ถามข้อมูล และเข้าใจประกาศพื้นฐาน",
    situationEn: "Check in, ask for information, and understand basic instructions.",
    tense: ["present forms", "future arrangements", "polite requests"],
    exit: "จบบทสนทนาเช็กอินตั้งแต่ยื่นพาสปอร์ตจนรู้ที่นั่งและเวลาขึ้นเครื่อง",
    safe: "Could you tell me...? / Where is...? / I'm flying to...",
    vocab: ["airport", "passport", "board", "luggage", "flight", "check-in", "passenger", "seat"],
    tags: ["Travel", "Communication"],
    chunks: ["I'm flying to...", "Here is my passport.", "I'd like to check in.", "Do you have any luggage?", "Where is my seat?", "What time does boarding start?"],
    concept: `# บทจริงใช้หลายรูป แต่มีหน้าที่ชัด
- \`I'm flying to New York today.\` = แผนที่จัดไว้
- \`Here is my passport.\` = ส่งสิ่งของให้
- \`Do you have any luggage?\` = ถามข้อมูล
- \`Boarding starts at ten.\` = ตาราง
- \`Could you tell me where to go?\` = ขออย่างสุภาพ
💡 อย่าพยายามตั้งชื่อ tense ขณะพูด ให้ดึง chunk ที่ตรงกับหน้าที่`,
    story: `Mina arrives at the airport two hours before her flight. At the check-in desk, she says, “I'd like to check in for my flight to Singapore.” She gives the employee her passport and puts her luggage on the scale. The employee gives her a seat near the window and says boarding starts at ten. Mina asks where she should go next.`,
    questions: ["What does Mina give the employee?", "When does boarding start?"],
    readingOptions: ["Her passport.", "Her hotel key.", "At ten.", "Two days later."],
    readingAnswers: ["Her passport.", "At ten."],
    fill: [["I'd like to ___ in.", "check"], ["Here ___ my passport.", "is"], ["What time ___ boarding start?", "does"], ["Where should I ___ next?", "go"]],
    shadow: [["I'd like to check in for my flight.", "ฉันต้องการเช็กอินสำหรับเที่ยวบิน"], ["Here is my passport.", "นี่คือหนังสือเดินทางของฉัน"], ["Do you have any luggage?", "คุณมีสัมภาระไหม"], ["What time does boarding start?", "เริ่มขึ้นเครื่องกี่โมง"], ["Could you tell me where to go next?", "ช่วยบอกฉันได้ไหมว่าต้องไปที่ไหนต่อ"]],
    prompts: ["Good morning. Where are you flying today?", "May I see your passport?", "Do you have any luggage?", "Boarding starts at ten. Do you have any questions?"],
    models: ["Good morning. I'm flying to Singapore.", "Of course. Here is my passport.", "Yes, I have one bag.", "Yes. Could you tell me where I should go next?"]
  },
  {
    id: "L20", level: "A2", phase: "connector",
    th: "แท็กซี่และเส้นทาง", en: "Taxi and Directions",
    situationTh: "บอกจุดหมาย ขอข้อมูล และแก้ความเข้าใจผิด",
    situationEn: "Give a destination, ask for information, and repair a misunderstanding.",
    tense: ["polite requests", "Past Simple retell"],
    exit: "เดินทางถึงจุดหมายและเล่าเหตุเข้าใจผิดสั้น ๆ หลังจบสถานการณ์",
    safe: "Could you take me to this address? / Could you say that again?",
    vocab: ["taxi", "car", "address", "destination", "route", "turn", "traffic", "arrive"],
    tags: ["Travel", "Transport", "Communication"],
    chunks: ["Could you take me to...?", "Here is the address.", "How long will it take?", "Please stop here.", "Could you say that again?", "I misunderstood..."],
    concept: `# สถานการณ์ปัจจุบัน + การเล่าย้อน
ตอนอยู่ในรถ ใช้ request chunks:
- \`Could you take me to this address?\`
- \`How long will it take?\`
- \`Please stop here.\`
หลังเหตุการณ์ ใช้ Past Simple:
- \`The driver misunderstood the address.\`
- \`I asked him to repeat it.\`
💡 หนึ่งสถานการณ์อาจมีมากกว่าหนึ่ง tense เพราะเราทำหลายหน้าที่`,
    story: `Sara gets into a taxi and shows the address of her hotel. The taxi moves, but the driver is going in the wrong direction. Sara asks, “Are we going to Central Hotel?” The driver says a different hotel name. Sara realizes he misunderstood the address. She asks him to stop and shows the map. Finally, they arrive at the correct hotel.`,
    questions: ["What did the driver misunderstand?", "How did Sara solve the problem?"],
    readingOptions: ["The hotel address.", "The taxi color.", "She showed him the map.", "She bought another hotel."],
    readingAnswers: ["The hotel address.", "She showed him the map."],
    fill: [["Could you ___ me to this address?", "take"], ["How long will it ___?", "take"], ["The driver ___ the address. (misunderstand)", "misunderstood"], ["We finally ___ at the hotel. (arrive)", "arrived"]],
    shadow: [["Could you take me to this address?", "ช่วยพาฉันไปที่อยู่นี้ได้ไหม"], ["Here is the address.", "นี่คือที่อยู่"], ["How long will it take?", "จะใช้เวลานานเท่าไร"], ["Could you say that again?", "ช่วยพูดอีกครั้งได้ไหม"], ["Please stop here.", "กรุณาจอดตรงนี้"]],
    prompts: ["Hello. Where would you like to go?", "It will take about thirty minutes.", "Did you say Central Hotel or City Hotel?", "We're here. Would you like a receipt?"],
    models: ["Could you take me to Central Hotel? Here is the address.", "Thank you. Is there a faster route?", "Central Hotel. Could you check the address on my phone?", "No, thank you. I can pay by card."]
  },
  {
    id: "L21", level: "A2", phase: "connector",
    th: "สั่งอาหารและแก้รายการผิด", en: "Restaurant Problem-solving",
    situationTh: "สั่งอาหาร ถามราคา และแก้ความผิดพลาดอย่างสุภาพ",
    situationEn: "Order food, ask about price, and resolve a mistake politely.",
    tense: ["would like", "polite requests", "present problem language"],
    exit: "สั่งอาหารครบหนึ่งมื้อและแก้รายการผิดหนึ่งอย่าง",
    safe: "I'd like... / Could I have...? / I think there's a mistake.",
    vocab: ["restaurant", "food", "order", "waiter", "customer", "pay", "price", "wrong"],
    tags: ["Daily Life", "Communication"],
    chunks: ["I'd like...", "Could I have...?", "What do you recommend?", "I ordered...", "I think there's a mistake.", "Could you change this?"],
    concept: `# ประโยคที่ทำให้งานสำเร็จ
- สั่ง: \`I'd like the chicken, please.\`
- ขอ: \`Could I have some water?\`
- ขอคำแนะนำ: \`What do you recommend?\`
- แจ้งปัญหา: \`I think there's a mistake.\`
- บอกสิ่งที่เกิด: \`I ordered tea, but I got coffee.\`
💡 แจ้งข้อเท็จจริงก่อน แล้วขอทางแก้ ไม่ต้องอธิบายแกรมมาร์ยาว`,
    story: `At a restaurant, Ton orders chicken and rice with a glass of water. The waiter brings fish and tea. Ton says politely, “Excuse me, I think there's a mistake. I ordered chicken and water.” The waiter apologizes and changes the order. Later, Ton checks the price before he pays. The final order is correct.`,
    questions: ["What did Ton originally order?", "How did he report the problem?"],
    readingOptions: ["Chicken and water.", "Fish and tea.", "He said there was a mistake.", "He left without speaking."],
    readingAnswers: ["Chicken and water.", "He said there was a mistake."],
    fill: [["I'd ___ the chicken please.", "like"], ["Could I ___ some water?", "have"], ["I think there ___ a mistake.", "is"], ["I ___ chicken but I got fish. (order)", "ordered"]],
    shadow: [["I'd like the chicken, please.", "ฉันขอสั่งไก่"], ["Could I have some water?", "ฉันขอน้ำได้ไหม"], ["What do you recommend?", "คุณแนะนำอะไร"], ["I think there's a mistake.", "ฉันคิดว่ามีข้อผิดพลาด"], ["I ordered chicken, but I got fish.", "ฉันสั่งไก่แต่ได้ปลา"]],
    prompts: ["Good evening. What would you like?", "Would you like anything to drink?", "Here's your fish and tea.", "I'm sorry. I'll change it now."],
    models: ["I'd like the chicken and rice, please.", "Could I have a glass of water?", "Excuse me, I think there's a mistake. I ordered chicken and water.", "Thank you. I appreciate your help."]
  },
  {
    id: "L22", level: "A2", phase: "technical",
    th: "คุยกับเพื่อนร่วมงาน", en: "Small Talk and Work Status",
    situationTh: "เริ่มบทสนทนา ตอบพร้อมรายละเอียด และถามกลับ",
    situationEn: "Start a colleague conversation and keep it moving.",
    tense: ["mixed present/past", "Answer + Detail + Question"],
    exit: "สนทนากับเพื่อนร่วมงานต่อเนื่องหนึ่งนาทีโดยถามกลับอย่างน้อย 2 ครั้ง",
    safe: "Answer + one detail + a related question",
    vocab: ["weekend", "project", "busy", "interesting", "colleague", "progress", "work", "sound"],
    tags: ["Work", "Communication"],
    chunks: ["How was your weekend?", "What are you working on?", "That sounds interesting.", "I'm currently...", "How about you?", "How's it going?"],
    concept: `# สูตรรักษาบทสนทนา
Answer + Detail + Question
\`It was good. I visited my family. How about yours?\`
\`I'm fixing a problem in our project. What are you working on?\`
ใช้ Past Simple กับวันหยุดที่จบแล้ว และ Present Continuous กับงานที่กำลังทำตอนนี้
💡 ไม่ต้องตอบยาว ให้เพิ่มรายละเอียดหนึ่งอย่างแล้วถามกลับ`,
    story: `On Monday morning, Kim meets a colleague in the kitchen. The colleague asks about her weekend. Kim says it was relaxing because she visited her family. Then she asks, “How about yours?” Later, they talk about work. Kim is currently preparing a report, and her colleague is testing a new service. They agree to talk again after lunch.`,
    questions: ["What did Kim do on the weekend?", "What is she doing now?"],
    readingOptions: ["She visited her family.", "She tested a service.", "She is preparing a report.", "She is traveling abroad."],
    readingAnswers: ["She visited her family.", "She is preparing a report."],
    fill: [["How ___ your weekend?", "was"], ["I ___ my family. (visit)", "visited"], ["What are you ___ on? (work)", "working"], ["That ___ interesting.", "sounds"]],
    shadow: [["How was your weekend?", "วันหยุดสุดสัปดาห์เป็นอย่างไรบ้าง"], ["It was good. I visited my family.", "ดีเลย ฉันไปหาครอบครัว"], ["How about yours?", "แล้วของคุณล่ะ"], ["What are you working on?", "คุณกำลังทำงานอะไรอยู่"], ["That sounds interesting.", "ฟังดูน่าสนใจ"]],
    prompts: ["How was your weekend?", "What are you working on today?", "How is the project going?", "Do you want to talk after lunch?"],
    models: ["It was good. I relaxed and watched a movie. How about yours?", "I'm currently preparing a report. What are you working on?", "It's going well, but I still have one problem to solve.", "Sure. I'm free after one."]
  },
  {
    id: "L23", level: "B1", phase: "technical",
    th: "อธิบายปัญหาในงาน", en: "Explain a Bug Clearly",
    situationTh: "รายงานสิ่งที่คาดหวัง สิ่งที่เกิดจริง บริบท สิ่งที่ลอง และหลักฐาน",
    situationEn: "Report expected behavior, actual behavior, context, attempts, and evidence.",
    tense: ["Past Simple", "Present Simple/Continuous", "Present Perfect"],
    exit: "รายงานปัญหา 5 ส่วนภายใน 90 วินาที",
    safe: "Expected → Actual → Context → Tried → Evidence",
    vocab: ["problem", "happen", "cause", "report", "result", "fix", "test", "system"],
    tags: ["Work", "Technology", "Communication"],
    chunks: ["I expected...", "Instead, the system...", "It happens when...", "I've already tried...", "I found...", "I haven't found the cause yet."],
    concept: `# รายงานให้ผู้ฟังทำงานต่อได้
1. Expected: \`I expected the page to open.\`
2. Actual: \`Instead, the system shows a blank page.\`
3. Context: \`It happens when I sign in.\`
4. Attempt: \`I've already restarted the service.\`
5. Evidence: \`I found the same message in the report.\`
ใช้ Past Simple กับการทดสอบที่จบแล้ว และ Present Perfect กับสิ่งที่ลองซึ่งเกี่ยวข้องกับสถานะตอนนี้`,
    story: `A page should show a customer's order, but it shows a blank screen. The problem happens after the user signs in. Nat tested the page twice and got the same result. He has already restarted the service and checked the system report. He found one unusual message, but he hasn't found the exact cause yet.`,
    questions: ["When does the problem happen?", "What has Nat already tried?"],
    readingOptions: ["After the user signs in.", "Before the computer starts.", "He restarted the service.", "He changed the customer."],
    readingAnswers: ["After the user signs in.", "He restarted the service."],
    fill: [["I ___ the page to open. (expect)", "expected"], ["The problem ___ after sign-in. (happen)", "happens"], ["I have already ___ the service. (restart)", "restarted"], ["I haven't ___ the cause yet. (find)", "found"]],
    shadow: [["I expected the page to open.", "ฉันคาดว่าหน้าจะเปิด"], ["Instead, the system shows a blank screen.", "แต่ระบบกลับแสดงหน้าว่าง"], ["The problem happens after sign-in.", "ปัญหาเกิดหลังเข้าสู่ระบบ"], ["I've already restarted the service.", "ฉันรีสตาร์ตบริการแล้ว"], ["I haven't found the cause yet.", "ฉันยังไม่พบสาเหตุ"]],
    prompts: ["What did you expect to happen?", "What actually happens?", "When does the problem happen?", "What have you already tried?", "What evidence did you find?"],
    models: ["I expected the page to show the customer's order.", "Instead, the system shows a blank screen.", "It happens after the user signs in.", "I've already restarted the service and tested twice.", "I found an unusual message in the system report, but I haven't found the cause yet."]
  },
  {
    id: "L24", level: "B1", phase: "technical",
    th: "ภารกิจรวม: ภาษาอังกฤษของฉัน", en: "Integrated Real-life Challenge",
    situationTh: "รวมอดีต ปัจจุบัน อนาคต ประสบการณ์ และการแก้ปัญหาในเรื่องเดียว",
    situationEn: "Combine past, present, future, experience, and repair language.",
    tense: ["7 priority forms", "Past Perfect recognition"],
    exit: "พูด 3 นาทีเกี่ยวกับตนเอง งานหนึ่งเรื่อง ปัญหาที่เคยเกิด และแผนถัดไป",
    safe: "สื่อสารตามลำดับ Now → Past → Result now → Next; ไม่ต้องฝืนใช้ทุก tense",
    vocab: ["challenge", "goal", "improve", "experience", "plan", "work", "problem", "solution"],
    tags: ["Personal", "Work", "Communication"],
    chunks: ["I currently...", "Last week, I...", "I've learned...", "The problem happened when...", "I'm going to...", "I think it will...", "My next step is..."],
    concept: `# เลือก tense จากเส้นเรื่อง
1. ตัวตน/กิจวัตร: Present Simple
2. สิ่งที่กำลังทำ: Present Continuous
3. เหตุการณ์จบแล้ว: Past Simple
4. ฉากก่อนเหตุการณ์: Past Continuous
5. ประสบการณ์/ผลถึงตอนนี้: Present Perfect
6. แผน: going to
7. การคาดการณ์/ตัดสินใจ: will
Past Perfect ใช้บอกว่าเหตุการณ์หนึ่งจบก่อนอีกเหตุการณ์ในอดีต: \`I had finished the test before the meeting started.\` ในระดับนี้ให้รู้ความหมายก่อน ยังไม่บังคับใช้
💡 ความสำเร็จคือเล่าแล้วผู้ฟังเข้าใจ ไม่ใช่ยัด tense ให้ครบ`,
    story: `Boss works in technology and is currently improving a project. Last week, he found a problem while he was testing the system. He had completed the first test before the problem appeared. Since then, he has tried two solutions and has learned more about the system. Tomorrow, he is going to test again. He thinks the next version will work better.`,
    questions: ["What is Boss currently doing?", "What is he going to do tomorrow?"],
    readingOptions: ["He is improving a project.", "He is traveling.", "He is going to test again.", "He is going to forget the project."],
    readingAnswers: ["He is improving a project.", "He is going to test again."],
    fill: [["I currently ___ on a project. (work)", "am working"], ["Last week I ___ a problem. (find)", "found"], ["I have ___ two solutions. (try)", "tried"], ["Tomorrow I am going to ___ again. (test)", "test"]],
    shadow: [["I currently work on a technology project.", "ตอนนี้ฉันทำงานในโครงการเทคโนโลยี"], ["Last week, I found a problem.", "สัปดาห์ก่อนฉันพบปัญหา"], ["I was testing when it happened.", "ฉันกำลังทดสอบตอนที่มันเกิดขึ้น"], ["I've tried two solutions.", "ฉันได้ลองสองวิธีแล้ว"], ["I'm going to test again tomorrow.", "ฉันวางแผนจะทดสอบอีกครั้งพรุ่งนี้"], ["I think the next version will work better.", "ฉันคิดว่าเวอร์ชันถัดไปจะทำงานดีขึ้น"]],
    prompts: ["Please introduce yourself and describe your normal work.", "What are you working on now?", "Tell me about a recent problem.", "What have you learned or tried?", "What are you going to do next?"],
    models: ["I'm Boss, and I work in technology. I usually build and improve software.", "I'm currently working on a project that helps people complete a task.", "Last week, I found a problem while I was testing the system.", "I've tried two solutions, and I've learned more about the cause.", "I'm going to test again tomorrow. I think the next version will work better."]
  }
];

function activityId(lessonId, suffix) {
  return `${lessonId}-${suffix}`;
}

function buildLesson(spec, index) {
  const translations = spec.shadow.map((pair) => pair[1]);
  const sentences = spec.shadow.map((pair) => pair[0]);
  const fillQuestions = spec.fill.map((pair) => pair[0]).join("\n");
  const fillAnswers = spec.fill.map((pair) => pair[1]).join(",");

  return {
    id: spec.id,
    slug: spec.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    level: spec.level,
    phase: spec.phase,
    title_th: spec.th,
    title_en: spec.en,
    situation_th: spec.situationTh,
    situation_en: spec.situationEn,
    tense_focus: spec.tense,
    exit_task: spec.exit,
    safe_default: spec.safe,
    estimated_minutes: index === 0 ? 40 : 35,
    prerequisites: index === 0 ? [] : [lessons[index - 1].id],
    goals: [
      spec.situationTh,
      spec.exit
    ],
    grammar_targets: spec.tense,
    vocabulary_tags: spec.tags,
    chunks: spec.chunks,
    activities: [
      {
        id: activityId(spec.id, "V1"),
        type: "vocabulary",
        instruction: "รู้คำสำคัญก่อนเข้าสู่เรื่อง",
        context: `คำเหล่านี้จะปรากฏในสถานการณ์ “${spec.th}” ฟังเสียง อ่านตัวอย่าง และนึกความหมายก่อนเปิดภาษาไทย`,
        options: spec.vocab
      },
      {
        id: activityId(spec.id, "C1"),
        type: "concept",
        instruction: `Tense lens: ${spec.tense.join(" + ")}`,
        content: `${spec.concept}\n## Safe default\n\`${spec.safe}\``
      },
      {
        id: activityId(spec.id, "R1"),
        type: "reading",
        instruction: "อ่านเรื่องเพื่อเข้าใจภาพรวมก่อนวิเคราะห์",
        content: spec.story,
        question: spec.questions.join("\n"),
        options: spec.readingOptions,
        answer: spec.readingAnswers.join(",")
      },
      {
        id: activityId(spec.id, "F1"),
        type: "fill_blank",
        instruction: "เลือกโครงสร้างที่ทำให้ความหมายของเวลาถูกต้อง",
        question: fillQuestions,
        answer: fillAnswers,
        hint: spec.safe
      },
      {
        id: activityId(spec.id, "S1"),
        type: "shadowing",
        instruction: "ฝึกประโยคหลักให้เรียกออกมาได้โดยไม่แปลทีละคำ",
        context: spec.situationEn,
        options: sentences,
        answer: translations
      },
      {
        id: activityId(spec.id, "P1"),
        type: "roleplay",
        instruction: spec.exit,
        context: `สถานการณ์: ${spec.situationTh}`,
        question: spec.exit,
        options: spec.prompts,
        answer: spec.models,
        hint: spec.chunks.join(" • ")
      }
    ],
    mastery: {
      recognition_accuracy: 80,
      production_accuracy: 70,
      required_outputs: Math.min(5, spec.prompts.length)
    }
  };
}

const curriculum = { lessons: lessons.map(buildLesson) };
const outputPath = resolve(process.cwd(), "data/curriculum.json");
writeFileSync(outputPath, `${JSON.stringify(curriculum, null, 2)}\n`, "utf8");
console.log(`Wrote ${curriculum.lessons.length} lessons to ${outputPath}`);
