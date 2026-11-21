/**
 * Shakti AI — Minimalist Study Assistant Drawer
 * Shared across index.html and predictor.html
 * Strictly adheres to ShaktiQ Forest Green (#10402D) & Soft Sage (#F8FAF7 / #EBF3E6) palette.
 */
(function () {
  'use strict';

  const AI_ENDPOINT = (typeof window !== 'undefined' && window.SHAKTIQ_AI_ENDPOINT)
    ? window.SHAKTIQ_AI_ENDPOINT
    : '/api/ask-ai';

  const STORAGE_LANG_KEY = 'shaktiq_ai_lang_v1';

  const STARTER_CHIPS = [
    'Give me a memory trick for this',
    'Explain why the other options are wrong',
    'Summarize key Bihar exam facts on this topic'
  ];

  const state = {
    isOpen: false,
    isLoading: false,
    language: 'en',
    context: null,
    messages: [],
    lastSubmitAt: 0
  };

  try {
    const savedLang = localStorage.getItem(STORAGE_LANG_KEY);
    if (savedLang && ['en', 'hinglish', 'hi'].includes(savedLang)) {
      state.language = savedLang;
    }
  } catch (_) {}

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatAiMarkdown(raw) {
    const safe = escapeHtml(raw || '');
    const lines = safe.split(/\r?\n/);
    let html = '';
    let inList = false;

    const formatInline = (text) =>
      text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        return;
      }

      if (/^[-*•]\s+/.test(line)) {
        if (!inList) {
          html += '<ul class="shakti-ai-list">';
          inList = true;
        }
        html += '<li>' + formatInline(line.replace(/^[-*•]\s+/, '')) + '</li>';
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += '<p>' + formatInline(line) + '</p>';
      }
    });

    if (inList) html += '</ul>';
    return html || '<p>' + formatInline(safe) + '</p>';
  }

  function isGreeting(text) {
    const norm = String(text || '').trim().toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, '');
    const singleWords = [
      'hi', 'hello', 'hey', 'namaste', 'namaskar', 'pranam', 'pranaam', 'kya kar sakte ho',
      'who are you', 'help', 'start', 'intro', 'kya hai', 'namaskaar', 'good morning', 'good evening',
      'नमस्ते', 'प्रणाम', 'नमस्कार', 'हेलो', 'हाय', 'मदद', 'तुम कौन हो', 'आप कौन हैं'
    ];
    if (singleWords.includes(norm)) return true;
    return /^(hi+|hello+|hey+|namaste+|namaskar+|pranam+|नमस्ते|प्रणाम|नमस्कार)(\s|$)/i.test(norm) ||
      norm === 'who are you' || norm === 'what can you do' || norm === 'help';
  }

  const GREETING_REPLIES = {
    en: [
      '**Hello! I am Shakti AI**, your dedicated study companion for BPSC, BSSC, and Bihar competitive examinations.',
      '',
      '**How I can assist your preparation:**',
      '- **Instant PYQ Breakdown:** Click **Ask AI** under any question card in the Question Bank or Mock Test review to receive the verified official explanation, distractor elimination, and exam memory hook.',
      '- **Concept & Topic Doubts:** Ask me about any Bihar syllabus topic — 1857 Revolt in Bihar, Article 356, Bihar soil and river systems, budget allocations, or general science.',
      '- **Bilingual Learning:** Toggle effortlessly between **English**, **Hinglish**, and **हिन्दी** anytime using the tabs above.',
      '',
      'What topic or question would you like to explore right now?'
    ].join('\n'),

    hinglish: [
      '**Namaste! Main hoon Shakti AI**, aapka Bihar competitive examinations (BPSC, BSSC, TRE) ka dedicated study companion.',
      '',
      '**Main aapki preparation mein aise help kar sakta hoon:**',
      '- **PYQ Deep Breakdown:** Kisi bhi question card ke neeche **Ask AI** click karein — aapko official explanation, option elimination logic, aur exam memory trick turant mil jayegi.',
      '- **Concept & Doubts:** BPSC / BSSC ka koi bhi topic poochiye — jaise Veer Kunwar Singh 1858, Article 356, Bihar rivers & geography, ya science formulas.',
      '- **Medium Selection:** Upar diye gaye tabs se kabhi bhi **English**, **Hinglish**, ya **हिन्दी** switch kar sakte hain.',
      '',
      'Aap abhi kaun sa topic ya question practice karna chahte hain?'
    ].join('\n'),

    hi: [
      '**नमस्ते! मैं हूँ Shakti AI**, बिहार प्रतियोगी परीक्षाओं (BPSC, BSSC, TRE) के लिए आपका समर्पित अध्ययन साथी।',
      '',
      '**मैं आपकी तैयारी में इस प्रकार सहायता कर सकता हूँ:**',
      '- **PYQ का संपूर्ण विश्लेषण:** प्रश्न बैंक या मॉक टेस्ट के किसी भी प्रश्न कार्ड पर **Ask AI** क्लिक करें — आपको आधिकारिक व्याख्या, गलत विकल्पों का खंडन (Elimination Logic) और Memory Hook तुरंत मिलेगा।',
      '- **अवधारणा एवं संदेह समाधान:** BPSC/BSSC का कोई भी विषय पूछें — जैसे 1857 की क्रांति में बिहार की भूमिका, अनुच्छेद 356, बिहार का भूगोल या विज्ञान के नियम।',
      '- **माध्यम का चयन:** ऊपर दिए गए विकल्पों से आप कभी भी **English**, **Hinglish**, या **हिन्दी** चुन सकते हैं।',
      '',
      'आज आप किस प्रश्न या विषय का अभ्यास करना चाहते हैं?'
    ].join('\n')
  };

  const BUILTIN_KNOWLEDGE = [
    {
      keywords: ['negative marking', 'marking scheme', 'pattern', 'cut off', 'cutoff', 'negative', 'मार्किंग', 'पैटर्न', 'कटाफ', 'कटऑफ'],
      en: [
        '**BPSC CCE Examination Pattern & Marking Scheme**',
        '',
        '**Core Structure:**',
        '- **Total Questions:** 150 Objective Multiple Choice Questions.',
        '- **Total Marks:** 150 Marks (1 mark per correct answer).',
        '- **Duration:** 2 Hours (120 Minutes).',
        '- **Negative Marking:** **-1/3rd (0.33 marks)** deducted for every incorrect response.',
        '- **Option E (Safe Skip):** Unattempted questions incur zero penalty. Always avoid blind guesswork when doubtful.',
        '',
        '**High-Yield Preparation Strategy:**',
        'Focus on History (35 Qs), Current Affairs (30 Qs), General Science (30 Qs), and Bihar Special (20 Qs) — these four sections cover over 75% of the total paper.'
      ].join('\n'),
      hinglish: [
        '**BPSC CCE Exam Pattern & Negative Marking Rules**',
        '',
        '**Key Details:**',
        '- **Total Questions:** 150 MCQs (150 Marks, 1 mark per question).',
        '- **Time:** 2 Ghante (120 Minutes).',
        '- **Negative Marking:** **-1/3rd (0.33 marks)** har galat answer ke liye kat-ta hai.',
        '- **Option E (Safe Skip):** Agar kisi question mein doubt ho, toh blind guess mat kijiye — unattempted questions par zero penalty hai.',
        '',
        '**High-Scoring Strategy:**',
        'History (35 Qs), Current Affairs (30 Qs), General Science (30 Qs), aur Bihar Special (20 Qs) par sabse zyada focus karein.'
      ].join('\n'),
      hi: [
        '**BPSC CCE परीक्षा पैटर्न एवं नकारात्मक अंकन (Negative Marking)**',
        '',
        '**मुख्य संरचना:**',
        '- **कुल प्रश्न:** 150 वस्तुनिष्ठ बहुविकल्पीय प्रश्न (MCQs)।',
        '- **कुल अंक:** 150 अंक (प्रत्येक सही उत्तर के लिए 1 अंक)।',
        '- **समय अवधि:** 2 घंटे (120 मिनट)।',
        '- **नकारात्मक अंकन:** प्रत्येक गलत उत्तर पर **-1/3 अंक (0.33)** की कटौती की जाती है।',
        '- **Option E (सुरक्षित छोड़ना):** यदि किसी प्रश्न में अनिश्चितता हो, तो अनुमान लगाने से बचें — अनुत्तरित प्रश्नों पर कोई अंक नहीं कटता।',
        '',
        '**उच्च स्कोरिंग रणनीति:**',
        'इतिहास (35 प्रश्न), समसामयिकी (30 प्रश्न), सामान्य विज्ञान (30 प्रश्न) और बिहार विशेष (20 प्रश्न) पर विशेष ध्यान दें — ये चार विषय 75% से अधिक अंक तय करते हैं।'
      ].join('\n')
    },
    {
      keywords: ['kunwar singh', 'veer kunwar', '1857', 'jagdishpur', 'arrah', 'कुंवर सिंह', 'जगदीशपुर', '1857 की क्रांति'],
      en: [
        '**Veer Kunwar Singh & 1857 Revolt in Bihar**',
        '',
        '**Core Concept:**',
        'Veer Kunwar Singh (Zamindar of Jagdishpur, Bhojpur/Arrah) was the legendary leader of the 1857 rebellion in Bihar, fighting the British at nearly 80 years of age.',
        '',
        '**Key BPSC Facts & Exam Dates:**',
        '- **Danapur Mutiny:** On 25 July 1857, sepoys of the 7th, 8th, and 40th regiments at Danapur mutinied and joined Kunwar Singh.',
        '- **Siege of Arrah:** Kunwar Singh besieged the British garrison at Arrah and defeated Captain Dunbar.',
        '- **Historic Victory:** On 23 April 1858, he decisively defeated British troops led by Captain Le Grand near Jagdishpur (celebrated annually as **Vijayotsav** in Bihar).',
        '- **Succession:** After his martyrdom on 26 April 1858, his brother **Amar Singh** continued guerrilla resistance in the Kaimur hills.',
        '',
        '**Quick Exam Memory Hook:**',
        '*23 April 1858 = Le Grand Defeated = Bihar Vijayotsav.*'
      ].join('\n'),
      hinglish: [
        '**Veer Kunwar Singh & 1857 Revolt in Bihar**',
        '',
        '**Core Facts for BPSC:**',
        '- **Jagdishpur (Bhojpur):** Veer Kunwar Singh ne lagbhag 80 varsh ki umar mein Bihar mein 1857 ki kranti ka netritva kiya.',
        '- **25 July 1857:** Danapur regiment ke sainik mutiny karke Kunwar Singh se jud gaye.',
        '- **Vijayotsav (23 April 1858):** Kunwar Singh ne Captain Le Grand ki British sena ko buri tarah haraya. Is din ko Bihar mein "Vijayotsav" ke roop mein manaya jata hai.',
        '- **Amar Singh:** Kunwar Singh ke baad unke bhai Amar Singh ne Kaimur hills mein guerrilla yuddh jaari rakha.',
        '',
        '**Exam Memory Hook:**',
        '*23 April 1858 = Captain Le Grand par vijay = Bihar Vijayotsav.*'
      ].join('\n'),
      hi: [
        '**वीर कुंवर सिंह एवं बिहार में 1857 की क्रांति**',
        '',
        '**मुख्य तथ्य:**',
        'जगदीशपुर (भोजपुर/आरा) के उज्जैनिया राजपूत जमींदार वीर कुंवर सिंह ने लगभग 80 वर्ष की आयु में बिहार में 1857 के प्रथम स्वतंत्रता संग्राम का नेतृत्व किया।',
        '',
        '**BPSC परीक्षा हेतु महत्वपूर्ण बिंदु:**',
        '- **दानापुर विद्रोह:** 25 जुलाई 1857 को दानापुर छावनी की तीन रेजीमेंटों (7वीं, 8वीं, 40वीं) ने विद्रोह कर कुंवर सिंह को अपना नेता माना।',
        '- **कैप्टन ली ग्रैंड की पराजय:** 23 अप्रैल 1858 को कुंवर सिंह ने जगदीशपुर के समीप कैप्टन ली ग्रैंड की अंग्रेजी सेना को निर्णायक शिकस्त दी। इसी उपलक्ष्य में प्रतिवर्ष 23 अप्रैल को बिहार में **विजयोत्सव** मनाया जाता है।',
        '- **अमर सिंह का प्रतिरोध:** 26 अप्रैल 1858 को कुंवर सिंह के देहावसान के पश्चात उनके अनुज **अमर सिंह** ने कैमूर की पहाड़ियों से समानांतर सरकार और गुरिल्ला संघर्ष जारी रखा।',
        '',
        '**परीक्षा स्मृति सूत्र:**',
        '*23 अप्रैल 1858 = कैप्टन ली ग्रैंड पराजित = बिहार विजयोत्सव।*'
      ].join('\n')
    },
    {
      keywords: ['champaran', 'tinkathia', 'shukla', 'चंपारण', 'तिनकठिया', 'राजकुमार शुक्ल'],
      en: [
        '**Champaran Satyagraha (1917)**',
        '',
        '**Core Concept:**',
        'Champaran Satyagraha was Mahatma Gandhi’s first civil disobedience experiment in India, launched against the oppressive Tinkathia system.',
        '',
        '**Key Exam Points:**',
        '- **Tinkathia System:** European planters forced Bihar farmers to cultivate Indigo (Neel) on **3/20th part** of their land.',
        '- **Invitation:** **Raj Kumar Shukla** met Gandhiji at the December 1916 Lucknow Session of INC and persuaded him to visit Champaran.',
        '- **Arrival:** Gandhiji arrived in Champaran on 15 April 1917, joined by Dr. Rajendra Prasad, J.B. Kripalani, Gorakh Prasad, and Mazhar-ul-Haque.',
        '- **Champaran Agrarian Committee:** Appointed by Lieutenant Governor Sir Edward Gait, with Gandhiji as an active member. The committee recommended abolishing Tinkathia and refunding 25% of illegally collected dues.',
        '',
        '**Quick Exam Memory Hook:**',
        '*1916 Lucknow Invitation (Raj Kumar Shukla) -> 1917 Champaran (3/20 Tinkathia abolished, 25% refund).*'
      ].join('\n'),
      hinglish: [
        '**Champaran Satyagraha (1917) - High Yield Facts**',
        '',
        '**Core Facts for BPSC:**',
        '- **Tinkathia System:** Kisanon ko apni zameen ke **3/20ven hisse** par neel (indigo) ki kheti karna anivarya tha.',
        '- **Raj Kumar Shukla:** 1916 ke Lucknow Congress session mein Gandhiji se milkar unhein Champaran aane ke liye raazi kiya.',
        '- **Key Associates:** Dr. Rajendra Prasad, J.B. Kripalani, Mahadev Desai, Mazhar-ul-Haque, Narhari Parikh.',
        '- **Outcome:** Champaran Agrarian Committee banayi gayi (Gandhiji sadasya the). Tinkathia radd hua aur kisanon ko 25% avaidh vasooli lautaai gayi.',
        '',
        '**Exam Memory Hook:**',
        '*3/20 Tinkathia = Raj Kumar Shukla ka nimantran (1916 Lucknow) = 25% refund.*'
      ].join('\n'),
      hi: [
        '**चंपारण सत्याग्रह (1917) — मुख्य परीक्षा तथ्य**',
        '',
        '**मुख्य अवधारणा:**',
        'चंपारण सत्याग्रह भारत में महात्मा गांधी द्वारा प्रथम सविनय अवज्ञा (Civil Disobedience) का सफल प्रयोग था, जो तिनकठिया प्रथा के विरुद्ध संचालित हुआ।',
        '',
        '**BPSC परीक्षा हेतु महत्वपूर्ण तथ्य:**',
        '- **तिनकठिया प्रथा:** यूरोपीय नीलहे किसानों को अपनी भूमि के **3/20वें भाग** पर अनिवार्य रूप से नील की खेती करने के लिए बाध्य करते थे।',
        '- **आमंत्रण:** मुरली भरहवा गांव के **राजकुमार शुक्ल** ने दिसंबर 1916 के लखनऊ कांग्रेस अधिवेशन में गांधीजी से भेंट कर उन्हें चंपारण आने का न्योता दिया।',
        '- **प्रमुख सहयोगी:** डॉ. राजेंद्र प्रसाद, जे.बी. कृपलानी, मजहरुल हक, ब्रजकिशोर प्रसाद, नरहरि पारिख।',
        '- **चंपारण कृषक समिति (Agrarian Committee):** उपराज्यपाल सर एडवर्ड गैट द्वारा गठित समिति के सदस्य गांधीजी भी थे। समिति की सिफारिश पर तिनकठिया प्रथा समाप्त हुई और अवैध वसूली का **25%** किसानों को लौटाया गया।',
        '',
        '**परीक्षा स्मृति सूत्र:**',
        '*3/20 तिनकठिया = राजकुमार शुक्ल का आमंत्रण (1916 लखनऊ) = 25% अवैध वसूली वापस।*'
      ].join('\n')
    },
    {
      keywords: ['buxar', 'battle of buxar', '1764', 'बक्सर', 'बक्सर का युद्ध'],
      en: [
        '**Battle of Buxar (22 October 1764)**',
        '',
        '**Core Concept:**',
        'The decisive battle that established British political supremacy in India. Unlike Plassey (which was won by treachery), Buxar was a direct military triumph.',
        '',
        '**Belligerents & Outcome:**',
        '- **British Commander:** Major **Hector Munro**.',
        '- **Tripartite Confederacy:** **Mir Qasim** (deposed Nawab of Bengal), **Shuja-ud-Daula** (Nawab of Awadh), and **Shah Alam II** (Mughal Emperor).',
        '- **Treaty of Allahabad (August 1765):** Signed by Lord Clive. Granted the **Diwani Rights** (revenue collection rights) of Bengal, Bihar, and Orissa to the British East India Company.',
        '',
        '**Quick Exam Memory Hook:**',
        '*22 Oct 1764 = Hector Munro vs Tripartite Allies = 1765 Treaty of Allahabad (Diwani Rights).*'
      ].join('\n'),
      hinglish: [
        '**Battle of Buxar (22 October 1764)**',
        '',
        '**Exam Key Points:**',
        '- **Date:** 22 October 1764.',
        '- **British Commander:** Major Hector Munro.',
        '- **Opponents (Tripartite Alliance):** Mir Qasim (Bengal), Shuja-ud-Daula (Awadh), Shah Alam II (Mughal Emperor).',
        '- **Treaty of Allahabad (1765):** Lord Clive ne sign kiya — Company ko Bengal, Bihar aur Orissa ke **Diwani Rights** (revenue collection) prapt hue.',
        '',
        '**Exam Memory Hook:**',
        '*22 Oct 1764: Hector Munro jeeta -> 1765 Allahabad Treaty se Bihar-Bengal Diwani Britishers ke paas.*'
      ].join('\n'),
      hi: [
        '**बक्सर का युद्ध (22 अक्टूबर 1764)**',
        '',
        '**मुख्य अवधारणा:**',
        'बक्सर का युद्ध भारत में ब्रिटिश प्रभुसत्ता की स्थापना का वास्तविक प्रस्थान बिंदु था। प्लासी के विपरीत, यह अंग्रेजों की प्रत्यक्ष सैन्य श्रेष्ठता की विजय थी।',
        '',
        '**प्रमुख परीक्षा तथ्य:**',
        '- **ब्रिटिश सेनापति:** मेजर **हेक्टर मुनरो**।',
        '- **त्रिकुट गठबंधन:** **मीर कासिम** (बंगाल का अपदस्थ नवाब), **शुजाउद्दौला** (अवध का नवाब), और **शाह आलम द्वितीय** (मुगल सम्राट)।',
        '- **इलाहाबाद की संधि (अगस्त 1765):** लॉर्ड क्लाइव और मुगल सम्राट शाह आलम द्वितीय के मध्य हस्ताक्षरित। कंपनी को बंगाल, बिहार और ओडिशा के **दीवानी अधिकार** (राजस्व वसूली) प्राप्त हुए।',
        '',
        '**परीक्षा स्मृति सूत्र:**',
        '*22 अक्टूबर 1764 = हेक्टर मुनरो बनाम त्रिकुट = 1765 इलाहाबाद संधि (बिहार-बंगाल दीवानी अधिकार)।*'
      ].join('\n')
    },
    {
      keywords: ['river', 'ganga', 'kosi', 'son', 'gandak', 'falgu', 'नदी', 'गंगा', 'कोसी', 'सोन', 'गंडक', 'फल्गु'],
      en: [
        '**Rivers & Drainage System of Bihar**',
        '',
        '**Core Facts for BPSC:**',
        '- **Ganga River:** Enters Bihar at **Chausa (Buxar)**, flows ~445 km eastward through 12 districts, dividing Bihar into North and South plains, and exits near Bhagalpur/Katihar.',
        '- **North Tributaries (Himalayan, Perennial, Flood-Prone):** Ghaghara (Saryu), Gandak, Burhi Gandak (originates in Someshwar hills), Bagmati, Kamla-Balan, **Kosi** ("Sorrow of Bihar"), and Mahananda.',
        '- **South Tributaries (Peninsular, Rain-Fed):** **Karmanasa** (considered unholy in mythology), **Son** (enters from Amarkantak via Rohtas), **Punpun** (sacred, joins Ganga at Fatwah), **Falgu** (Bodh Gaya, Vishnupad Temple), Kiul, and Chandan.',
        '',
        '**Quick Exam Memory Hook:**',
        '*Ganga enters at Chausa (Buxar) | Kosi = Sorrow of Bihar | Punpun joins at Fatwah.*'
      ].join('\n'),
      hinglish: [
        '**Bihar River System & Exam Facts**',
        '',
        '**Important Points for BPSC:**',
        '- **Ganga:** Bihar mein Chausa (Buxar) se pravesh karti hai, 12 zilon se hokar ~445 km behti hai aur Katihar/Bhagalpur se bahar nikalti hai.',
        '- **North Bank Rivers:** Ghaghara, Gandak, Burhi Gandak, Bagmati, Kamla, Kosi ("Sorrow of Bihar"), Mahananda.',
        '- **South Bank Rivers:** Karmanasa, Son (Amarkantak se aati hai, Dehri-on-Sone), Punpun (Fatwah mein Ganga se milti hai), Falgu (Gaya, Pitrapaksha mela), Kiul.',
        '',
        '**Exam Memory Hook:**',
        '*Chausa = Entry Point | Fatwah = Punpun Confluence | Kosi = Sorrow of Bihar.*'
      ].join('\n'),
      hi: [
        '**बिहार की नदियाँ एवं अपवाह तंत्र**',
        '',
        '**BPSC परीक्षा हेतु महत्वपूर्ण तथ्य:**',
        '- **गंगा नदी:** बिहार में **चौसा (बक्सर)** के पास प्रवेश करती है, 12 जिलों से होकर लगभग 445 किमी बहती है और कटिहार/भागलपुर के निकट बाहर निकलती है। यह बिहार को उत्तरी और दक्षिणी मैदानों में विभाजित करती है।',
        '- **उत्तरी सहायक नदियाँ (हिमालयी, सदानीरा, बाढ़कारी):** घाघरा (सरयू), गंडक, बूढ़ी गंडक (सोमेश्वर पहाड़ी से उद्गम), बागमती, कमला-बलान, **कोसी** (बिहार का शोक), और महानंदा।',
        '- **दक्षिणी सहायक नदियाँ (प्र प्रायद्वीपीय, बरसाती):** **कर्मनाशा** (अपवित्र मानी जाने वाली), **सोन** (अमरकंटक से रोहतास में प्रवेश), **पुनपुन** (फतुहा के निकट गंगा में संगम), **फल्गु** (गया, विष्णुपद मंदिर, पितृपक्ष मेला), किऊल और चंदन।',
        '',
        '**परीक्षा स्मृति सूत्र:**',
        '*चौसा = गंगा प्रवेश | फतुहा = पुनपुन संगम | कोसी = बिहार का शोक।*'
      ].join('\n')
    },
    {
      keywords: ['article 356', 'presidents rule', 'rashtrapati shasan', '356', 'राष्ट्रपति शासन'],
      en: [
        '**Article 356 & President’s Rule in Bihar**',
        '',
        '**Constitutional Provision:**',
        'Article 356 empowers the President of India to impose President’s Rule upon receipt of a report from the Governor that the constitutional machinery in the state has failed.',
        '',
        '**BPSC Specific Facts for Bihar:**',
        '- **Total Times Imposed:** President’s Rule has been imposed **8 times** in Bihar.',
        '- **First Time:** Imposed on **29 June 1968** under Governor Nityanand Kanungo, when **Bhola Paswan Shastri** was the Chief Minister.',
        '- **Most Recent:** Imposed in **2005** (February 2005 to November 2005) under Governor Buta Singh.',
        '',
        '**Quick Exam Memory Hook:**',
        '*Bihar = 8 times President Rule | 1st in 1968 (Bhola Paswan Shastri ministry).*'
      ].join('\n'),
      hinglish: [
        '**Article 356: President’s Rule in Bihar**',
        '',
        '**BPSC Core Facts:**',
        '- **Kul Kitni Baar:** Bihar mein ab tak **8 baar** Rashtrapati Shasan lag chuka hai.',
        '- **Pehli Baar:** 29 June 1968 ko laga tha jab **Bhola Paswan Shastri** CM the aur Nityanand Kanungo Governor the.',
        '- **Aakhiri Baar:** 2005 mein (Governor Buta Singh ke samay) laga tha.',
        '',
        '**Exam Memory Hook:**',
        '*Bihar mein 8 baar Article 356 | 1st time 1968 (Bhola Paswan Shastri).*'
      ].join('\n'),
      hi: [
        '**अनुच्छेद 356 एवं बिहार में राष्ट्रपति शासन**',
        '',
        '**संवैधानिक प्रावधान:**',
        'अनुच्छेद 356 के अंतर्गत राज्य में संवैधानिक तंत्र के विफल होने पर राज्यपाल की रिपोर्ट के आधार पर राष्ट्रपति शासन लगाया जाता है।',
        '',
        '**बिहार विशेष BPSC तथ्य:**',
        '- **कुल बारंबारता:** बिहार में अब तक कुल **8 बार** राष्ट्रपति शासन लागू किया जा चुका है।',
        '- **प्रथम बार:** **29 जून 1968** को लागू हुआ था, उस समय **भोला पासवान शास्त्री** मुख्यमंत्री तथा नित्यानंद कानूनगो राज्यपाल थे।',
        '- **अंतिम बार:** **2005** में (फरवरी 2005 से नवंबर 2005 तक) बूटा सिंह के राज्यपाल कार्यकाल में लगा था।',
        '',
        '**परीक्षा स्मृति सूत्र:**',
        '*बिहार में 8 बार राष्ट्रपति शासन | प्रथम बार: 1968 (भोला पासवान शास्त्री मंत्रिमंडल)।*'
      ].join('\n')
    }
  ];

  function findBuiltinTopicAnswer(query, language) {
    const norm = String(query || '').trim().toLowerCase();
    for (const item of BUILTIN_KNOWLEDGE) {
      const match = item.keywords.some((k) => norm.includes(k));
      if (match) {
        return item[language] || item.en;
      }
    }
    return null;
  }

  function extractOptionLetter(str) {
    const m = String(str || '').trim().match(/^\(?([A-Ea-e])[\)\.\s]/);
    return m ? m[1].toUpperCase() : '';
  }

  function extractAnswerLetter(str) {
    const m = String(str || '').trim().match(/([A-Ea-e])/);
    return m ? m[1].toUpperCase() : '';
  }

  function formatContextExplanation(ctx, language) {
    const isHi = language === 'hi';
    const isHing = language === 'hinglish';
    const parts = [];

    if (ctx.subject || ctx.exam) {
      parts.push(`**${[ctx.subject, ctx.exam].filter(Boolean).join(' · ')}**`);
      parts.push('');
    }

    if (ctx.correctAnswer) {
      const ansLabel = isHi ? '**आधिकारिक सही उत्तर:** ' : '**Official Answer:** ';
      const ansVal = ctx.correctAnswer.startsWith('Option') ? ctx.correctAnswer : 'Option ' + ctx.correctAnswer;
      parts.push(`${ansLabel}${ansVal}`);
      parts.push('');
    }

    const coreHeading = isHi ? '**मुख्य अवधारणा (Core Concept):**' : '**Core Concept:**';
    parts.push(coreHeading);
    if (ctx.explanation && ctx.explanation.trim()) {
      parts.push(ctx.explanation.trim());
    } else {
      parts.push(isHi
        ? 'यह प्रश्न BPSC/BSSC के आधिकारिक पाठ्यक्रम और मानक NCERT संदर्भ पर आधारित है।'
        : 'This question tests core factual concepts per the official Bihar examination syllabus and NCERT reference texts.');
    }
    parts.push('');

    if (Array.isArray(ctx.options) && ctx.options.length > 0) {
      const optHeading = isHi ? '**विकल्प विश्लेषण (Option Analysis):**' : '**Option Breakdown:**';
      parts.push(optHeading);
      const ansLetter = extractAnswerLetter(ctx.correctAnswer);
      ctx.options.forEach((opt) => {
        const optStr = String(opt).trim();
        const optLetter = extractOptionLetter(optStr);
        const isCorrect = Boolean(optLetter && ansLetter && optLetter === ansLetter);
        if (isCorrect) {
          parts.push(`- **${optStr}** — ${isHi ? 'यह आधिकारिक रूप से सही उत्तर है।' : 'Verified correct choice per official BPSC answer key.'}`);
        } else {
          parts.push(`- ${optStr} — ${isHi ? 'यह विकल्प सही नहीं है।' : 'Incorrect distractor.'}`);
        }
      });
      parts.push('');
    }

    const hookHeading = isHi ? '**परीक्षा स्मृति सूत्र (Exam Memory Hook):**' : '**Quick Exam Memory Hook:**';
    parts.push(hookHeading);
    const defaultHook = isHi
      ? `स्मरण रखें: ${ctx.subject || 'इस विषय'} में BPSC सीधे तथ्यात्मक प्रावधानों और उन्मूलन विधि (Elimination Method) का परीक्षण करता है। इस मुख्य बिंदु को परीक्षा कक्ष के लिए कंठस्थ रखें।`
      : isHing
        ? `Revision Tip: ${ctx.subject || 'Is subject'} mein BPSC direct factual key points test karta hai. Is point ko exam hall ke liye commit kar lijiye.`
        : `Revision Tip: For ${ctx.subject || 'this topic'}, BPSC tests precise factual provisions and direct elimination. Commit this official key point to memory for the exam hall.`;
    parts.push(defaultHook);

    return parts.join('\n');
  }

  function injectStylesIfNeeded() {
    if (document.getElementById('shakti-ai-inline-styles')) return;
    const style = document.createElement('style');
    style.id = 'shakti-ai-inline-styles';
    style.textContent = `
      .shakti-ai-fab {
        position: fixed;
        right: 1.25rem;
        bottom: 1.25rem;
        z-index: 65;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.05rem;
        border-radius: 9999px;
        background: #10402D;
        color: #FFFFFF;
        border: 1px solid #C6DEC0;
        font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.01em;
        box-shadow: 0 8px 24px -6px rgba(16, 64, 45, 0.28);
        cursor: pointer;
        transition: transform 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
        min-height: 44px;
      }
      .shakti-ai-fab:hover {
        background: #17593F;
        transform: translateY(-2px);
        box-shadow: 0 12px 28px -6px rgba(16, 64, 45, 0.34);
      }
      .shakti-ai-fab:focus-visible {
        outline: 3px solid #10402D;
        outline-offset: 2px;
        box-shadow: 0 0 0 4px rgba(252, 226, 123, 0.8);
      }
      .shakti-ai-fab.shakti-ai-fab-hidden {
        opacity: 0;
        pointer-events: none;
        transform: translateY(10px);
      }
      @media (max-width: 1023px) {
        body.shakti-exam-active .shakti-ai-fab {
          opacity: 0;
          pointer-events: none;
        }
        .shakti-ai-fab {
          right: 1rem;
          bottom: max(1rem, env(safe-area-inset-bottom, 0px));
          padding: 0.65rem 0.95rem;
        }
      }

      .shakti-ai-backdrop {
        position: fixed;
        inset: 0;
        z-index: 90;
        background: rgba(17, 28, 21, 0.34);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      .shakti-ai-backdrop.open {
        opacity: 1;
        pointer-events: auto;
      }

      .shakti-ai-drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 440px;
        z-index: 95;
        background: #F8FAF7;
        color: #111C15;
        border-left: 1px solid #DCE6DF;
        box-shadow: -16px 0 40px -12px rgba(16, 64, 45, 0.18);
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        visibility: hidden;
        pointer-events: none;
        transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), visibility 0.24s ease;
        font-family: "Plus Jakarta Sans", "Noto Sans Devanagari", system-ui, -apple-system, sans-serif;
      }
      .shakti-ai-drawer.open {
        transform: translateX(0);
        visibility: visible;
        pointer-events: auto;
      }

      @media (max-width: 639.98px) {
        .shakti-ai-drawer {
          top: auto;
          left: 0;
          right: 0;
          bottom: 0;
          max-width: 100%;
          height: 86vh;
          max-height: 86vh;
          border-left: none;
          border-top: 1px solid #DCE6DF;
          border-radius: 1.25rem 1.25rem 0 0;
          transform: translateY(100%);
          visibility: hidden;
          pointer-events: none;
          box-shadow: 0 -14px 36px -8px rgba(16, 64, 45, 0.2);
        }
        .shakti-ai-drawer.open {
          transform: translateY(0);
          visibility: visible;
          pointer-events: auto;
        }
      }

      .shakti-ai-header {
        background: #FFFFFF;
        border-bottom: 1px solid #DCE6DF;
        padding: 0.9rem 1rem 0.75rem;
        flex-shrink: 0;
      }
      .shakti-ai-header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .shakti-ai-brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        min-width: 0;
      }
      .shakti-ai-mark {
        width: 2rem;
        height: 2rem;
        border-radius: 0.65rem;
        background: #EBF3E6;
        border: 1px solid #C6DEC0;
        color: #10402D;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .shakti-ai-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #111C15;
        line-height: 1.2;
      }
      .shakti-ai-subtitle {
        font-size: 0.72rem;
        color: #526056;
        margin-top: 0.1rem;
      }
      .shakti-ai-header-actions {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        flex-shrink: 0;
      }
      .shakti-ai-icon-btn {
        min-width: 36px;
        min-height: 36px;
        padding: 0 0.55rem;
        border-radius: 0.6rem;
        border: 1px solid #DCE6DF;
        background: #FFFFFF;
        color: #223127;
        font-size: 0.72rem;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }
      .shakti-ai-icon-btn:hover {
        background: #EBF3E6;
        border-color: #C6DEC0;
        color: #10402D;
      }

      .shakti-ai-lang-bar {
        margin-top: 0.65rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .shakti-ai-lang-label {
        font-size: 0.7rem;
        font-weight: 700;
        color: #526056;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .shakti-ai-lang-tabs {
        display: inline-flex;
        padding: 0.2rem;
        border-radius: 0.65rem;
        background: #F8FAF7;
        border: 1px solid #DCE6DF;
        gap: 0.15rem;
      }
      .shakti-ai-lang-tab {
        border: none;
        background: transparent;
        color: #223127;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.32rem 0.6rem;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
      }
      .shakti-ai-lang-tab[aria-selected="true"] {
        background: #10402D;
        color: #FFFFFF;
      }

      .shakti-ai-context {
        margin: 0.75rem 1rem 0;
        padding: 0.7rem 0.8rem;
        border-radius: 0.85rem;
        background: #ECF6E7;
        border: 1px solid #C6DEC0;
        font-size: 0.75rem;
        color: #1E2D23;
        flex-shrink: 0;
      }
      .shakti-ai-context-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.3rem;
      }
      .shakti-ai-context-tag {
        font-size: 0.68rem;
        font-weight: 800;
        color: #10402D;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      .shakti-ai-context-clear {
        border: none;
        background: transparent;
        color: #526056;
        font-size: 0.7rem;
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
      }
      .shakti-ai-context-q {
        margin: 0;
        color: #111C15;
        font-weight: 600;
        line-height: 1.45;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .shakti-ai-body {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        scroll-behavior: smooth;
      }

      .shakti-ai-welcome {
        background: #FFFFFF;
        border: 1px solid #DCE6DF;
        border-radius: 1rem;
        padding: 1rem;
      }
      .shakti-ai-welcome-title {
        font-size: 0.9rem;
        font-weight: 800;
        color: #111C15;
        margin-bottom: 0.3rem;
      }
      .shakti-ai-welcome-desc {
        font-size: 0.8rem;
        color: #526056;
        line-height: 1.55;
        margin-bottom: 0.85rem;
      }
      .shakti-ai-chips {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }
      .shakti-ai-chip {
        text-align: left;
        background: #F8FAF7;
        border: 1px solid #DCE6DF;
        color: #1E2D23;
        padding: 0.6rem 0.8rem;
        border-radius: 0.75rem;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        min-height: 40px;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }
      .shakti-ai-chip:hover {
        background: #EBF3E6;
        border-color: #10402D;
        color: #10402D;
      }

      .shakti-ai-msg {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        max-width: 94%;
      }
      .shakti-ai-msg.user {
        align-self: flex-end;
      }
      .shakti-ai-msg.assistant {
        align-self: flex-start;
        max-width: 100%;
      }
      .shakti-ai-bubble {
        padding: 0.75rem 0.9rem;
        border-radius: 0.95rem;
        font-size: 0.84rem;
        line-height: 1.62;
        word-break: break-word;
      }
      .shakti-ai-msg.user .shakti-ai-bubble {
        background: #10402D;
        color: #FFFFFF;
        border-bottom-right-radius: 0.25rem;
      }
      .shakti-ai-msg.assistant .shakti-ai-bubble {
        background: #FFFFFF;
        color: #111C15;
        border: 1px solid #DCE6DF;
        border-bottom-left-radius: 0.25rem;
      }
      .shakti-ai-msg.assistant.error .shakti-ai-bubble {
        background: #FFF5F5;
        border-color: #FECACA;
        color: #991B1B;
      }
      .shakti-ai-bubble p {
        margin: 0 0 0.5rem 0;
      }
      .shakti-ai-bubble p:last-child {
        margin-bottom: 0;
      }
      .shakti-ai-bubble strong {
        color: #10402D;
        font-weight: 700;
      }
      .shakti-ai-msg.user .shakti-ai-bubble strong {
        color: #FCE27B;
      }
      .shakti-ai-list {
        margin: 0.25rem 0 0.55rem 1.1rem;
        padding: 0;
        list-style: disc;
      }
      .shakti-ai-list li {
        margin-bottom: 0.3rem;
      }
      .shakti-ai-msg-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0 0.15rem;
      }
      .shakti-ai-copy-btn {
        border: 1px solid #DCE6DF;
        background: #FFFFFF;
        color: #36443A;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.2rem 0.55rem;
        border-radius: 0.45rem;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
      }
      .shakti-ai-copy-btn:hover {
        background: #EBF3E6;
        color: #10402D;
      }

      .shakti-ai-typing {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.65rem 0.85rem;
        border-radius: 0.9rem;
        background: #FFFFFF;
        border: 1px solid #DCE6DF;
        color: #526056;
        font-size: 0.78rem;
        font-weight: 600;
        align-self: flex-start;
      }
      .shakti-ai-dots {
        display: inline-flex;
        gap: 3px;
      }
      .shakti-ai-dots span {
        width: 5px;
        height: 5px;
        border-radius: 9999px;
        background: #10402D;
        opacity: 0.35;
        animation: shaktiAiBounce 1.1s infinite ease-in-out;
      }
      .shakti-ai-dots span:nth-child(2) { animation-delay: 0.18s; }
      .shakti-ai-dots span:nth-child(3) { animation-delay: 0.36s; }
      @keyframes shaktiAiBounce {
        0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
        40% { opacity: 1; transform: translateY(-2px); }
      }

      .shakti-ai-footer {
        background: #FFFFFF;
        border-top: 1px solid #DCE6DF;
        padding: 0.75rem 0.9rem max(0.75rem, env(safe-area-inset-bottom, 0px));
        flex-shrink: 0;
      }
      .shakti-ai-form {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
      }
      .shakti-ai-input {
        flex: 1 1 auto;
        min-height: 44px;
        max-height: 120px;
        resize: none;
        padding: 0.65rem 0.85rem;
        border-radius: 0.8rem;
        border: 1px solid #DCE6DF;
        background: #F8FAF7;
        color: #111C15;
        font-family: inherit;
        font-size: 0.875rem;
        line-height: 1.45;
      }
      @media (max-width: 640px) {
        .shakti-ai-input {
          font-size: 16px !important;
        }
      }
      .shakti-ai-input:focus {
        outline: none;
        border-color: #10402D;
        background: #FFFFFF;
      }
      .shakti-ai-send-btn {
        min-width: 44px;
        height: 44px;
        padding: 0 0.95rem;
        border-radius: 0.8rem;
        border: none;
        background: #10402D;
        color: #FFFFFF;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        flex-shrink: 0;
        transition: background-color 0.15s ease, opacity 0.15s ease;
      }
      .shakti-ai-send-btn:hover:not(:disabled) {
        background: #17593F;
      }
      .shakti-ai-send-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .shakti-ai-note {
        margin-top: 0.45rem;
        font-size: 0.68rem;
        color: #526056;
        text-align: center;
      }

      /* Subtle contextual "Explain with AI" button shared across PYQ, Solution Review & Predictor */
      .shakti-explain-ai-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.72rem;
        border-radius: 0.65rem;
        background: #FFFFFF;
        color: #10402D;
        border: 1px solid #C6DEC0;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        min-height: 32px;
      }
      .shakti-explain-ai-btn:hover {
        background: #10402D;
        color: #FFFFFF;
        border-color: #10402D;
      }
      .shakti-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
    document.head.appendChild(style);
  }

  function createIconSvg(type) {
    if (type === 'spark') {
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z"/></svg>';
    }
    if (type === 'close') {
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    }
    if (type === 'send') {
      return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
    }
    return '';
  }

  let els = {};

  function buildDrawerDom() {
    if (document.getElementById('shakti-ai-drawer')) return;
    injectStylesIfNeeded();

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'shakti-ai-fab';
    fab.className = 'shakti-ai-fab no-print';
    fab.setAttribute('aria-label', 'Open Shakti AI Study Assistant');
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = createIconSvg('spark') + '<span>Ask AI</span>';

    const backdrop = document.createElement('div');
    backdrop.id = 'shakti-ai-backdrop';
    backdrop.className = 'shakti-ai-backdrop no-print';
    backdrop.setAttribute('aria-hidden', 'true');

    const drawer = document.createElement('aside');
    drawer.id = 'shakti-ai-drawer';
    drawer.className = 'shakti-ai-drawer no-print';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'shakti-ai-drawer-title');
    drawer.setAttribute('aria-hidden', 'true');

    drawer.innerHTML = `
      <div class="shakti-ai-header">
        <div class="shakti-ai-header-top">
          <div class="shakti-ai-brand">
            <span class="shakti-ai-mark">${createIconSvg('spark')}</span>
            <div>
              <h2 id="shakti-ai-drawer-title" class="shakti-ai-title">Shakti AI</h2>
              <p class="shakti-ai-subtitle">Bihar Exam Study Companion</p>
            </div>
          </div>
          <div class="shakti-ai-header-actions">
            <button type="button" id="shakti-ai-clear-btn" class="shakti-ai-icon-btn" title="Clear conversation" aria-label="Clear conversation">Clear</button>
            <button type="button" id="shakti-ai-close-btn" class="shakti-ai-icon-btn" title="Close Shakti AI" aria-label="Close Shakti AI">${createIconSvg('close')}</button>
          </div>
        </div>

        <div class="shakti-ai-lang-bar">
          <span class="shakti-ai-lang-label">Reply Language</span>
          <div class="shakti-ai-lang-tabs" role="tablist" aria-label="AI explanation language">
            <button type="button" class="shakti-ai-lang-tab" role="tab" data-ai-lang="en" aria-selected="${state.language === 'en' ? 'true' : 'false'}">English</button>
            <button type="button" class="shakti-ai-lang-tab" role="tab" data-ai-lang="hinglish" aria-selected="${state.language === 'hinglish' ? 'true' : 'false'}">Hinglish</button>
            <button type="button" class="shakti-ai-lang-tab" role="tab" data-ai-lang="hi" aria-selected="${state.language === 'hi' ? 'true' : 'false'}">हिन्दी</button>
          </div>
        </div>
      </div>

      <div id="shakti-ai-context-bar" class="shakti-ai-context" hidden>
        <div class="shakti-ai-context-top">
          <span id="shakti-ai-context-meta" class="shakti-ai-context-tag">Active Question Context</span>
          <button type="button" id="shakti-ai-context-clear" class="shakti-ai-context-clear">Remove</button>
        </div>
        <p id="shakti-ai-context-text" class="shakti-ai-context-q"></p>
      </div>

      <div id="shakti-ai-messages" class="shakti-ai-body" role="log" aria-live="polite" aria-relevant="additions"></div>

      <div class="shakti-ai-footer">
        <form id="shakti-ai-form" class="shakti-ai-form" novalidate>
          <label for="shakti-ai-input" class="shakti-sr-only">Ask a Bihar exam question or concept</label>
          <textarea id="shakti-ai-input" class="shakti-ai-input" rows="1" maxlength="1200" placeholder="Ask a Bihar exam doubt or concept..."></textarea>
          <button type="submit" id="shakti-ai-send-btn" class="shakti-ai-send-btn" aria-label="Send question to Shakti AI">
            ${createIconSvg('send')}
            <span>Ask</span>
          </button>
        </form>
        <p class="shakti-ai-note">Always cross-check dates &amp; keys with official notifications.</p>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    els = {
      fab,
      backdrop,
      drawer,
      clearBtn: drawer.querySelector('#shakti-ai-clear-btn'),
      closeBtn: drawer.querySelector('#shakti-ai-close-btn'),
      langTabs: Array.from(drawer.querySelectorAll('.shakti-ai-lang-tab')),
      contextBar: drawer.querySelector('#shakti-ai-context-bar'),
      contextMeta: drawer.querySelector('#shakti-ai-context-meta'),
      contextText: drawer.querySelector('#shakti-ai-context-text'),
      contextClear: drawer.querySelector('#shakti-ai-context-clear'),
      messages: drawer.querySelector('#shakti-ai-messages'),
      form: drawer.querySelector('#shakti-ai-form'),
      input: drawer.querySelector('#shakti-ai-input'),
      sendBtn: drawer.querySelector('#shakti-ai-send-btn')
    };

    fab.addEventListener('click', () => openDrawer());
    backdrop.addEventListener('click', () => closeDrawer());
    els.closeBtn.addEventListener('click', () => closeDrawer());
    els.clearBtn.addEventListener('click', () => clearChat());

    els.contextClear.addEventListener('click', () => {
      state.context = null;
      renderContextBar();
    });

    els.langTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        setLanguage(tab.getAttribute('data-ai-lang'));
      });
    });

    els.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (els.input.value || '').trim();
      if (!val) return;
      els.input.value = '';
      autoResizeInput();
      sendMessage(val);
    });

    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const val = (els.input.value || '').trim();
        if (val && !state.isLoading) {
          els.input.value = '';
          autoResizeInput();
          sendMessage(val);
        }
      }
    });

    els.input.addEventListener('input', autoResizeInput);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeDrawer();
      }
    });

    // Keep FAB clear of mobile mock-exam bottom bar
    const syncExamBarCollision = () => {
      const activeTest = document.getElementById('test-taking-workspace');
      const isExamLive = activeTest && !activeTest.classList.contains('hidden');
      document.body.classList.toggle('shakti-exam-active', Boolean(isExamLive));
    };
    const activeTestEl = document.getElementById('test-taking-workspace');
    if (activeTestEl && typeof MutationObserver !== 'undefined') {
      const obs = new MutationObserver(syncExamBarCollision);
      obs.observe(activeTestEl, { attributes: true, attributeFilter: ['class'] });
      syncExamBarCollision();
    }

    renderMessages();
    renderContextBar();
  }

  function autoResizeInput() {
    if (!els.input) return;
    els.input.style.height = 'auto';
    els.input.style.height = Math.min(els.input.scrollHeight, 120) + 'px';
  }

  function renderContextBar() {
    if (!els.contextBar) return;
    if (!state.context || !state.context.question) {
      els.contextBar.hidden = true;
      return;
    }
    const metaParts = [state.context.subject, state.context.exam].filter(Boolean);
    els.contextMeta.textContent = metaParts.length > 0 ? metaParts.join(' · ') : 'Loaded Question Context';
    els.contextText.textContent = state.context.question;
    els.contextBar.hidden = false;
  }

  function renderMessages() {
    if (!els.messages) return;
    els.messages.innerHTML = '';

    if (state.messages.length === 0) {
      const welcome = document.createElement('div');
      welcome.className = 'shakti-ai-welcome';
      welcome.innerHTML = `
        <div class="shakti-ai-welcome-title">Focused Bihar Exam Guidance</div>
        <p class="shakti-ai-welcome-desc">
          Ask about any BPSC, BSSC CGL 4, or AEDO question, Bihar Special fact, or option elimination logic. Answers stay structured: <strong>Core Concept</strong> &rarr; <strong>Option Breakdown</strong> &rarr; <strong>Memory Hook</strong>.
        </p>
        <div class="shakti-ai-chips" id="shakti-ai-starter-chips"></div>
      `;
      const chipsWrap = welcome.querySelector('#shakti-ai-starter-chips');
      STARTER_CHIPS.forEach((chipText) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'shakti-ai-chip';
        btn.textContent = chipText;
        btn.addEventListener('click', () => {
          if (!state.isLoading) sendMessage(chipText);
        });
        chipsWrap.appendChild(btn);
      });
      els.messages.appendChild(welcome);
    }

    state.messages.forEach((msg) => {
      const wrap = document.createElement('div');
      wrap.className = 'shakti-ai-msg ' + msg.role + (msg.isError ? ' error' : '');

      const bubble = document.createElement('div');
      bubble.className = 'shakti-ai-bubble';
      if (msg.role === 'assistant') {
        bubble.innerHTML = formatAiMarkdown(msg.text);
      } else {
        bubble.textContent = msg.text;
      }
      wrap.appendChild(bubble);

      if (msg.role === 'assistant' && !msg.isError) {
        const meta = document.createElement('div');
        meta.className = 'shakti-ai-msg-meta';
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'shakti-ai-copy-btn';
        copyBtn.textContent = 'Copy explanation';
        copyBtn.addEventListener('click', () => {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(msg.text).then(() => {
              copyBtn.textContent = 'Copied';
              setTimeout(() => { copyBtn.textContent = 'Copy explanation'; }, 1600);
            }).catch(() => {});
          }
        });
        meta.appendChild(copyBtn);
        wrap.appendChild(meta);
      }

      els.messages.appendChild(wrap);
    });

    if (state.isLoading) {
      const typing = document.createElement('div');
      typing.className = 'shakti-ai-typing';
      typing.id = 'shakti-ai-typing';
      typing.innerHTML = '<span>Shakti AI is preparing a clear explanation</span><span class="shakti-ai-dots"><span></span><span></span><span></span></span>';
      els.messages.appendChild(typing);
    }

    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function setLoading(loading) {
    state.isLoading = loading;
    if (els.sendBtn) els.sendBtn.disabled = loading;
    if (els.input) els.input.disabled = loading;
    renderMessages();
  }

  function setLanguage(lang) {
    if (!['en', 'hinglish', 'hi'].includes(lang)) return;
    state.language = lang;
    try { localStorage.setItem(STORAGE_LANG_KEY, lang); } catch (_) {}
    if (els.langTabs) {
      els.langTabs.forEach((tab) => {
        tab.setAttribute('aria-selected', tab.getAttribute('data-ai-lang') === lang ? 'true' : 'false');
      });
    }
  }

  function openDrawer() {
    buildDrawerDom();
    state.isOpen = true;
    els.backdrop.classList.add('open');
    els.backdrop.setAttribute('aria-hidden', 'false');
    els.drawer.classList.add('open');
    els.drawer.setAttribute('aria-hidden', 'false');
    els.fab.classList.add('shakti-ai-fab-hidden');
    els.fab.setAttribute('aria-expanded', 'true');
    setTimeout(() => {
      if (els.input && !state.isLoading) els.input.focus();
    }, 220);
  }

  function closeDrawer() {
    if (!els.drawer) return;
    state.isOpen = false;
    els.backdrop.classList.remove('open');
    els.backdrop.setAttribute('aria-hidden', 'true');
    els.drawer.classList.remove('open');
    els.drawer.setAttribute('aria-hidden', 'true');
    els.fab.classList.remove('shakti-ai-fab-hidden');
    els.fab.setAttribute('aria-expanded', 'false');
    els.fab.focus();
  }

  function clearChat() {
    if (state.isLoading) return;
    state.messages = [];
    renderMessages();
  }

  const NO_BACKEND_REPLIES = {
    en: [
      '**Shakti AI Study Companion**',
      '',
      'I am focused on Bihar competitive examination prep (BPSC CCE, BSSC CGL 4, AEDO, TRE).',
      '',
      '- **Instant PYQ Breakdown:** Click **Ask AI** under any question card in the Question Bank or Mock Test review for verified official solutions, distractor elimination, and exam memory hooks.',
      '- **Topic Doubts:** The study server is currently indexing notes for this topic. In the meantime, explore the 2,800+ subject-wise questions filtered by topic above!'
    ].join('\n'),

    hinglish: [
      '**Shakti AI Study Companion**',
      '',
      'Main Bihar competitive exams (BPSC CCE, BSSC CGL 4, AEDO, TRE) ke liye dedicated study companion hoon.',
      '',
      '- **Instant Verified Solutions:** Question Bank ya Mock Tests mein kisi bhi question card ke neeche **Ask AI** click karein — aapko official explanation, option elimination logic, aur memory hook turant mil jayega.',
      '- **Topic Doubts:** Study server is topic ke notes index kar raha hai. Is dauran aap upar diye gaye 2,800+ subject-wise questions ka practice kar sakte hain!'
    ].join('\n'),

    hi: [
      '**Shakti AI अध्ययन साथी**',
      '',
      'मैं बिहार प्रतियोगी परीक्षाओं (BPSC CCE, BSSC CGL 4, AEDO, TRE) के लिए आपका समर्पित अध्ययन साथी हूँ।',
      '',
      '- **विस्तृत आधिकारिक समाधान के लिए:** प्रश्न बैंक या मॉक टेस्ट के किसी भी प्रश्न कार्ड पर **Ask AI** क्लिक करें — आपको आधिकारिक व्याख्या, विकल्प विश्लेषण और Memory Hook तुरंत मिलेगा।',
      '- **सामान्य अवधारणात्मक प्रश्नों के लिए:** अध्ययन सर्वर अद्यतन हो रहा है। इस बीच आप ऊपर दिए गए 2,800+ विषयवार प्रश्नों का अभ्यास कर सकते हैं!'
    ].join('\n')
  };

  async function sendMessage(text) {
    const cleanText = String(text || '').trim();
    if (!cleanText || state.isLoading) return;

    const now = Date.now();
    if (now - state.lastSubmitAt < 400) return;
    state.lastSubmitAt = now;

    buildDrawerDom();

    state.messages.push({ role: 'user', text: cleanText });

    // 1. Instant offline check
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (state.context && state.context.question) {
        const explanation = formatContextExplanation(state.context, state.language);
        state.messages.push({ role: 'assistant', text: explanation });
      } else if (isGreeting(cleanText)) {
        const reply = GREETING_REPLIES[state.language] || GREETING_REPLIES.en;
        state.messages.push({ role: 'assistant', text: reply });
      } else {
        const topicAnswer = findBuiltinTopicAnswer(cleanText, state.language);
        if (topicAnswer) {
          state.messages.push({ role: 'assistant', text: topicAnswer });
        } else {
          state.messages.push({
            role: 'assistant',
            text: state.language === 'hi'
              ? 'आप अभी ऑफलाइन हैं। 2,800+ प्रश्न बैंक और आपके हल सुरक्षित हैं। सामान्य अवधारणाओं के लिए ऑनलाइन होने पर पुनः पूछें।'
              : 'You are currently offline. Your 2,800+ PYQ Question Bank and test attempts work completely offline; connect online to query broader study topics.'
          });
        }
      }
      renderMessages();
      return;
    }

    // 2. Instant Greetings: Immediate, zero latency, 100% reliable
    if (isGreeting(cleanText)) {
      const reply = GREETING_REPLIES[state.language] || GREETING_REPLIES.en;
      state.messages.push({ role: 'assistant', text: reply });
      renderMessages();
      return;
    }

    // 3. Instant Built-in Topic Fact Sheet: Core high-yield BPSC syllabus topics
    const topicAnswer = findBuiltinTopicAnswer(cleanText, state.language);
    if (topicAnswer) {
      state.messages.push({ role: 'assistant', text: topicAnswer });
      renderMessages();
      return;
    }

    setLoading(true);

    let answerObtained = false;
    let answerText = '';

    // 4. Query Backend Study Endpoint (powered by server-configured AI model or key)
    try {
      const historyPayload = state.messages
        .slice(0, -1)
        .filter((m) => !m.isError)
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

      const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          language: state.language,
          context: state.context,
          history: historyPayload
        }),
        signal: controller ? controller.signal : undefined
      }).catch(() => null);

      if (timeoutId) clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.answer) {
          answerText = data.answer;
          answerObtained = true;
        }
      }
    } catch (_) {}

    // 5. Active Question Context Fallback (Official verified explanation)
    if (!answerObtained && state.context && state.context.question) {
      answerText = formatContextExplanation(state.context, state.language);
      answerObtained = true;
    }

    // 6. If answer obtained, display it!
    if (answerObtained && answerText) {
      state.messages.push({ role: 'assistant', text: answerText });
      setLoading(false);
      return;
    }

    // 7. Free-form question when backend is not yet configured: Dignified study companion guidance
    setLoading(false);
    state.messages.push({
      role: 'assistant',
      text: NO_BACKEND_REPLIES[state.language] || NO_BACKEND_REPLIES.en
    });
    renderMessages();
  }

  function explainQuestion(ctx, autoPrompt) {
    buildDrawerDom();
    state.context = {
      question: ctx && ctx.question ? String(ctx.question).trim() : '',
      options: ctx && Array.isArray(ctx.options) ? ctx.options : [],
      correctAnswer: ctx && ctx.correctAnswer ? String(ctx.correctAnswer).trim() : '',
      explanation: ctx && ctx.explanation ? String(ctx.explanation).trim() : '',
      subject: ctx && ctx.subject ? String(ctx.subject).trim() : '',
      exam: ctx && ctx.exam ? String(ctx.exam).trim() : ''
    };
    renderContextBar();
    openDrawer();

    const promptText = autoPrompt || 'Explain this question clearly, why the other options are wrong, and give a quick Bihar exam memory hook.';
    if (!state.isLoading) {
      sendMessage(promptText);
    }
  }

  function init() {
    buildDrawerDom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ShaktiAI = {
    open: openDrawer,
    close: closeDrawer,
    explainQuestion,
    setLanguage,
    clearChat,
    sendMessage
  };
})();
