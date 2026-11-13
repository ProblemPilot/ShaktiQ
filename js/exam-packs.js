/**
 * ShaktiQ Exam Packs, Test Series Registry & Cutoff Configuration
 * Modular Architecture (Feature 3.2 & 3.3)
 */
// ==========================================
    const SHAKTIQ_EXAM_PACKS = {
      bpsc_cce: {
        id: "bpsc_cce",
        name: "BPSC Combined Competitive Examination (CCE)",
        shortName: "BPSC CCE",
        nameHi: "बीपीएससी संयुक्त प्रतियोगिता परीक्षा (CCE)",
        conductedBy: "Bihar Public Service Commission (BPSC)",
        categoryKey: "BPSC_CCE",
        icon: "award",
        badge: "71st • 70th • 69th",
        markingScheme: { correct: 1.0, wrong: -1/3, safeSkip: 0, blank: -1/3 },
        optionsCount: 5,
        hasData: true,
        totalQuestions: 594,
        activeMocksCount: 4,
        isPlaceholder: false,
        description: "Official full-length timed mock tests from 71st, 70th Re-exam, 70th Main and 69th Prelims on official BPSC pattern.",
        descriptionHi: "71वीं, 70वीं पुनर्परीक्षा, 70वीं मुख्य सत्र और 69वीं प्रारंभिक परीक्षा के आधिकारिक मॉक टेस्ट।"
      },
      bpsc_tre: {
        id: "bpsc_tre",
        name: "BPSC TRE 4.0 & Teacher Recruitment Exams",
        shortName: "TRE 4.0 & Teacher Exams",
        nameHi: "बीपीएससी टीआरई 4.0 एवं शिक्षक भर्ती परीक्षा",
        conductedBy: "Bihar Public Service Commission (BPSC)",
        categoryKey: "BPSC_TRE",
        icon: "graduation-cap",
        badge: "TRE 4.0 • 2026 Pattern",
        markingScheme: { correct: 1.0, wrong: -1/3, safeSkip: 0, blank: -1/3 },
        optionsCount: 5,
        hasData: true,
        totalQuestions: 229,
        activeMocksCount: 2,
        isPlaceholder: false,
        description: "Curated tests matching the BPSC TRE 4.0 teacher recruitment pattern (General Studies, Environmental Science, Pedagogy) built strictly from verified papers in repo.",
        descriptionHi: "बीपीएससी टीआरई 4.0 शिक्षक भर्ती पैटर्न (सामान्य अध्ययन, पर्यावरण विज्ञान, शिक्षण अभिरुचि) पर आधारित मॉक टेस्ट।"
      },
      aedo: {
        id: "aedo",
        name: "BPSC AEDO (Assistant Executive Officer)",
        shortName: "AEDO Phase 1-3",
        nameHi: "बीपीएससी एईडीओ परीक्षा",
        conductedBy: "Bihar Public Service Commission (BPSC)",
        categoryKey: "AEDO",
        icon: "briefcase",
        badge: "Phases 1, 2 & 3",
        markingScheme: { correct: 1.0, wrong: -1/3, safeSkip: 0, blank: -1/3 },
        optionsCount: 5,
        hasData: true,
        totalQuestions: 600,
        activeMocksCount: 6,
        isPlaceholder: false,
        description: "Complete 6-paper series (100 Qs each) covering General Studies and General Aptitude across all 3 phases.",
        descriptionHi: "सभी 3 चरणों में सामान्य अध्ययन और सामान्य योग्यता को कवर करने वाली 6 प्रश्नपत्रों की श्रृंखला।"
      },
      bpsc_dept: {
        id: "bpsc_dept",
        name: "BPSC Auditor, Prosecution Officer & Specialized Exams",
        shortName: "Auditor, APO, Steno & Dept",
        nameHi: "बीपीएससी अंकेक्षक, अभियोजन पदाधिकारी एवं अन्य परीक्षाएं",
        conductedBy: "Bihar Public Service Commission (BPSC)",
        categoryKey: "OTHER_2026",
        icon: "file-text",
        badge: "10 Specialized Papers",
        markingScheme: { correct: 1.0, wrong: -1/3, safeSkip: 0, blank: -1/3 },
        optionsCount: 5,
        hasData: true,
        totalQuestions: 1386,
        activeMocksCount: 10,
        isPlaceholder: false,
        description: "Published official papers for BPSC Auditor, APO, LDC, Stenographer, Research Officer, MDO, and Engineering services.",
        descriptionHi: "बीपीएससी अंकेक्षक, एपीओ, एलडीसी, आशुलिपिक, अनुसंधान अधिकारी एवं अन्य तकनीकी सेवाओं के प्रश्नपत्र।"
      },
      bssc: {
        id: "bssc",
        name: "BSSC CGL & Inter Level Examination Pack",
        shortName: "BSSC CGL 4 (Coming Soon)",
        nameHi: "बीएसएससी सीजीएल 4 (जल्द आ रहा है)",
        conductedBy: "Bihar Staff Selection Commission (BSSC)",
        categoryKey: "BSSC",
        icon: "layers",
        badge: "Coming Soon (सामग्री संकलन जारी)",
        markingScheme: { correct: 4.0, wrong: -1.0, safeSkip: 0, blank: 0 },
        optionsCount: 4,
        hasData: false, // Strict integrity: 0 questions currently in repo
        totalQuestions: 0,
        activeMocksCount: 0,
        isPlaceholder: true,
        placeholderNotice: "BSSC CGL 4 study material and official papers are currently being accumulated. High quality tests will be released soon. Zero artificial or invented questions.",
        description: "BSSC CGL 4 official material is currently being accumulated. Timed mock tests (+4 / -1 marking pattern) will unlock as verified question sets are added.",
        descriptionHi: "बीएसएससी सीजीएल 4 आधिकारिक सामग्री और प्रश्नपत्रों का संकलन जारी है। गुणवत्तापूर्ण मॉक टेस्ट जल्द उपलब्ध होंगे (+4 / -1 अंक प्रणाली)।"
      },
      speed_drills: {
        id: "speed_drills",
        name: "10-Minute Subject Speed Drills",
        shortName: "10-Min Speed Drills",
        nameHi: "10-मिनट विषयवार स्पीड ड्रिल",
        conductedBy: "ShaktiQ Timed Practice Engine",
        categoryKey: "SPEED_DRILLS",
        icon: "zap",
        badge: "8 Subject Drills",
        markingScheme: { correct: 1.0, wrong: -1/3, safeSkip: 0, blank: -1/3 },
        optionsCount: 5,
        hasData: true,
        totalQuestions: 120,
        activeMocksCount: 8,
        isPlaceholder: false,
        description: "Rapid 15-question subject drills strictly from the verified bank for focused time-pressured revision.",
        descriptionHi: "सटीक और त्वरित अभ्यास के लिए प्रमाणित बैंक से 15 प्रश्नों के विषयवार त्वरित टेस्ट।"
      },

      getAllPacks: function() {
        return Object.values(this).filter(p => typeof p === 'object' && p.id);
      },
      getActivePacks: function() {
        return this.getAllPacks().filter(p => p.hasData);
      },
      getPack: function(id) {
        return this[id] || null;
      },
      dropInPackData: function(packId, payload) {
        if (!packId || !payload) {
          throw new Error('Exam pack ID and payload are required');
        }
        const pack = this.getPack(packId);
        if (!pack) {
          throw new Error(`Exam pack "${packId}" not found in registry`);
        }
        if (!payload.test || !payload.test.id || !payload.test.title) {
          throw new Error('Valid test configuration object is required');
        }
        if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
          throw new Error('Array of verified questions is required');
        }
        payload.questions.forEach((q, idx) => {
          if (!q.q || !q.ans) {
            throw new Error(`Question at index ${idx} is missing required 'q' or 'ans' fields`);
          }
        });
        const existingIdx = CURATED_TESTS.findIndex(t => t.id === payload.test.id);
        const testObj = {
          id: payload.test.id,
          examMatch: payload.test.examMatch || payload.test.title,
          title: payload.test.title,
          category: pack.categoryKey,
          questionsCount: payload.questions.length,
          marks: payload.test.marks || payload.questions.length,
          timeMins: payload.test.timeMins || 120,
          year: payload.test.year || "2026",
          statusLabel: payload.test.statusLabel || "100% Complete Full Paper",
          desc: payload.test.desc || `Official full-length paper for ${payload.test.title}.`,
          customQuestions: payload.questions,
          markingScheme: pack.markingScheme
        };
        if (existingIdx >= 0) {
          CURATED_TESTS[existingIdx] = testObj;
        } else {
          CURATED_TESTS.push(testObj);
        }
        pack.hasData = true;
        pack.isPlaceholder = false;
        pack.totalQuestions = (pack.totalQuestions || 0) + payload.questions.length;
        pack.activeMocksCount = (pack.activeMocksCount || 0) + 1;
        return {
          status: 'success',
          packId: pack.id,
          testId: testObj.id,
          questionsLoaded: payload.questions.length
        };
      }
    };
    window.SHAKTIQ_EXAM_PACKS = SHAKTIQ_EXAM_PACKS;

    // ==========================================
    // FULL LENGTH TEST SERIES ENGINE
    // ==========================================
    const CURATED_TESTS = [
  {
    "id": "ts_71st_cce",
    "examMatch": "71st BPSC CCE Prelims",
    "title": "71st BPSC CCE Prelims (Full Mock 1)",
    "category": "BPSC_CCE",
    "questionsCount": 150,
    "marks": 150,
    "timeMins": 120,
    "year": "2025/2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Complete 150-question Prelims paper on BPSC pattern covering History, Bihar Special, Science, Polity, Economy, Geography, and Mental Ability."
  },
  {
    "id": "ts_70th_re",
    "examMatch": "70th BPSC CCE Prelims (Re-Exam)",
    "title": "70th BPSC CCE Prelims Re-Exam (Full Mock 2)",
    "category": "BPSC_CCE",
    "questionsCount": 150,
    "marks": 150,
    "timeMins": 120,
    "year": "2025/2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Full 150 questions from the re-examination session with statement-based analytical questions on the BPSC pattern."
  },
  {
    "id": "ts_70th_main",
    "examMatch": "70th BPSC CCE Prelims (Main)",
    "title": "70th BPSC CCE Prelims Main Session (Full Mock 3)",
    "category": "BPSC_CCE",
    "questionsCount": 150,
    "marks": 150,
    "timeMins": 120,
    "year": "2024/2025",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Complete 150-question Prelims paper from the 70th BPSC CCE main session covering History, Science, Geography, Polity, and Economy."
  },
  {
    "id": "ts_69th_cce",
    "examMatch": "69th BPSC CCE Prelims",
    "title": "69th BPSC CCE Prelims (Full Mock 4)",
    "category": "BPSC_CCE",
    "questionsCount": 144,
    "marks": 144,
    "timeMins": 120,
    "year": "2023/2024",
    "statusLabel": "100% Complete Paper (BPSC Pattern)",
    "desc": "Complete 144-question Prelims paper of the 69th BPSC CCE featuring the 4-option format and -1/3 negative marking."
  },
  {
    "id": "ts_tre_4_0",
    "examMatch": "BPSC Special Teacher Exam (Shift 1)",
    "title": "BPSC TRE 4.0 Teacher Recruitment (2026 Pattern Mock)",
    "category": "BPSC_TRE",
    "questionsCount": 150,
    "marks": 150,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "2026 Recruitment (32,388 Posts)",
    "desc": "Full 150-question mock test matching BPSC TRE 4.0 2-phase format (General Studies, Environmental Science, and Pedagogy)."
  },
  {
    "id": "ts_special_teacher",
    "examMatch": "BPSC Special Teacher Exam (Shift 1)",
    "title": "BPSC Special Teacher Exam (Shift 1 - 2026 Full Paper)",
    "category": "BPSC_TRE",
    "questionsCount": 150,
    "marks": 150,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Complete 150 questions conducted by BPSC in 2026 covering General Science, Geography, History, and Reasoning."
  },
  {
    "id": "ts_bpsc_auditor",
    "examMatch": "BPSC Auditor Prelims",
    "title": "BPSC Auditor Prelims (Panchayati Raj Dept 2026)",
    "category": "OTHER_2026",
    "questionsCount": 150,
    "marks": 150,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "2026 Recruitment (102 Posts)",
    "desc": "150 questions based on published BPSC Auditor Prelims for the Bihar Panchayati Raj Department."
  },
  {
    "id": "ts_bpsc_research_officer",
    "examMatch": "BPSC Research Officer Prelims",
    "title": "BPSC Research Officer Prelims (2026 Full Paper)",
    "category": "OTHER_2026",
    "questionsCount": 150,
    "marks": 150,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "150 questions based on published BPSC Research Officer Prelims testing advanced statistics, economic governance, and public policy."
  },
  {
    "id": "ts_bpsc_apo",
    "examMatch": "BPSC Prosecution Officer Prelims",
    "title": "BPSC Assistant Prosecution Officer (APO 2026)",
    "category": "OTHER_2026",
    "questionsCount": 100,
    "marks": 100,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "2026 Recruitment (300 Posts)",
    "desc": "100 questions based on published BPSC Assistant Prosecution Officer Prelims testing criminal jurisprudence, constitution, and general studies."
  },
  {
    "id": "ts_bpsc_steno",
    "examMatch": "BPSC Stenographer Exam",
    "title": "BPSC Stenographer Written Exam (2026 Full Paper)",
    "category": "OTHER_2026",
    "questionsCount": 150,
    "marks": 150,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "2026 Recruitment Paper",
    "desc": "Complete 150-question mock test from the BPSC Stenographer recruitment exam with solutions & explanations based on published answer keys."
  },
  {
    "id": "ts_bpsc_ldc",
    "examMatch": "BPSC LDC Exam",
    "title": "BPSC Lower Division Clerk (LDC 2026 Full Paper)",
    "category": "OTHER_2026",
    "questionsCount": 150,
    "marks": 150,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "150 questions from BPSC Lower Division Clerk written examination covering GS, Math, and General Hindi/English."
  },
  {
    "id": "ts_bpsc_aso",
    "examMatch": "BPSC ASO Mains",
    "title": "BPSC ASO Mains (Secretariat Assistant / ASO 2026)",
    "category": "OTHER_2026",
    "questionsCount": 150,
    "marks": 150,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Complete 150-question mock test from BPSC Assistant Section Officer Mains examination tailored for Secretariat recruitment."
  },
  {
    "id": "ts_bpsc_aso_pre",
    "examMatch": "BPSC ASO Prelims",
    "title": "BPSC ASO Prelims (Assistant Section Officer 2025 Full Paper)",
    "category": "OTHER_2026",
    "questionsCount": 150,
    "marks": 150,
    "timeMins": 120,
    "year": "2025/2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Complete 150-question Prelims paper conducted on 10 Sept 2025 for Bihar Secretariat Assistant / ASO vacancies with detailed solutions & explanations."
  },
  {
    "id": "ts_bpsc_mdo",
    "examMatch": "BPSC MDO Exam",
    "title": "BPSC Mineral Development Officer (MDO 2026 Full Paper)",
    "category": "OTHER_2026",
    "questionsCount": 100,
    "marks": 100,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "100 questions based on published BPSC Mineral Development Officer Prelims testing geology, mineral economics, and general science."
  },
  {
    "id": "ts_bpsc_mvi",
    "examMatch": "BPSC MVI GS Paper",
    "title": "BPSC Motor Vehicle Inspector (MVI 2026 GS Paper)",
    "category": "OTHER_2026",
    "questionsCount": 100,
    "marks": 100,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "100 questions based on published BPSC Motor Vehicle Inspector GS Paper covering transport laws, physics, and state general awareness."
  },
  {
    "id": "ts_bpsc_ae",
    "examMatch": "BPSC Combined AE GS",
    "title": "BPSC Combined Assistant Engineer (AE 2026 GS Paper)",
    "category": "OTHER_2026",
    "questionsCount": 50,
    "marks": 50,
    "timeMins": 60,
    "year": "2026",
    "statusLabel": "BPSC AE GS Paper",
    "desc": "50 questions based on published BPSC Combined Assistant Engineer General Studies examination."
  },
  {
    "id": "ts_aedo_p1_gs",
    "examMatch": "BPSC AEDO General Studies (Phase I)",
    "title": "BPSC AEDO Phase 1 — General Studies (100 Qs)",
    "category": "AEDO",
    "questionsCount": 100,
    "marks": 100,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Complete 100 questions covering Bihar Panchayati Raj Act 2006, State Schemes, and core General Studies on BPSC pattern."
  },
  {
    "id": "ts_aedo_p1_apt",
    "examMatch": "BPSC AEDO General Aptitude (Phase I)",
    "title": "BPSC AEDO Phase 1 — General Aptitude (100 Qs)",
    "category": "AEDO",
    "questionsCount": 100,
    "marks": 100,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Complete 100 questions of Quantitative Aptitude, Logical Reasoning, and Data Interpretation for Phase 1."
  },
  {
    "id": "ts_aedo_p2_gs",
    "examMatch": "BPSC AEDO General Studies (Phase II)",
    "title": "BPSC AEDO Phase 2 — General Studies (100 Qs)",
    "category": "AEDO",
    "questionsCount": 100,
    "marks": 100,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Complete 100 questions covering Bihar rural administration, Indian polity, and General Science on BPSC pattern."
  },
  {
    "id": "ts_aedo_p2_apt",
    "examMatch": "BPSC AEDO General Aptitude (Phase II)",
    "title": "BPSC AEDO Phase 2 — General Aptitude (100 Qs)",
    "category": "AEDO",
    "questionsCount": 100,
    "marks": 100,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Complete 100 questions of mathematical reasoning, series, and elimination drills for Phase 2."
  },
  {
    "id": "ts_aedo_p3_gs",
    "examMatch": "BPSC AEDO General Studies (Phase III)",
    "title": "BPSC AEDO Phase 3 — General Studies (100 Qs)",
    "category": "AEDO",
    "questionsCount": 100,
    "marks": 100,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Complete 100 questions covering key state schemes (Saat Nischay-2, Jal-Jeevan-Hariyali) and Economics on BPSC pattern."
  },
  {
    "id": "ts_aedo_p3_apt",
    "examMatch": "BPSC AEDO General Aptitude (Phase III)",
    "title": "BPSC AEDO Phase 3 — General Aptitude (100 Qs)",
    "category": "AEDO",
    "questionsCount": 100,
    "marks": 100,
    "timeMins": 120,
    "year": "2026",
    "statusLabel": "100% Complete Full Paper",
    "desc": "Complete 100 questions completing the full 600-question AEDO mock series based on published answer keys."
  }
];

    // ==========================================
    // 10-MINUTE SPEED DRILLS ENGINE (Feature 2.2)
    // 15 Questions strictly from existing PYQ bank by Subject
    // Zero Invented Questions
    // ==========================================
    const SPEED_DRILLS_CONFIG = [
      {
        id: "drill_bihar_special",
        title: "Bihar Special & Heritage 10-Min Speed Drill",
        category: "SPEED_DRILLS",
        subject: "Bihar Special",
        subjectFilter: ["Bihar Special"],
        questionsCount: 15,
        marks: 15,
        timeMins: 10,
        statusLabel: "10-Min Subject Drill",
        desc: "15 high-frequency questions on Bihar history, geography, heritage & state schemes under strict 10-minute exam pressure.",
        isSpeedDrill: true
      },
      {
        id: "drill_polity",
        title: "Indian Polity & Constitution 10-Min Speed Drill",
        category: "SPEED_DRILLS",
        subject: "Polity",
        subjectFilter: ["Polity"],
        questionsCount: 15,
        marks: 15,
        timeMins: 10,
        statusLabel: "10-Min Subject Drill",
        desc: "15 high-yield MCQs on the Indian Constitution, Fundamental Rights, Parliament & Panchayati Raj under BPSC negative marking.",
        isSpeedDrill: true
      },
      {
        id: "drill_economy",
        title: "Indian & Bihar Economy 10-Min Speed Drill",
        category: "SPEED_DRILLS",
        subject: "Economics",
        subjectFilter: ["Economics"],
        questionsCount: 15,
        marks: 15,
        timeMins: 10,
        statusLabel: "10-Min Subject Drill",
        desc: "15 rapid questions on Union & Bihar budgets, economic survey, fiscal policy & inflation.",
        isSpeedDrill: true
      },
      {
        id: "drill_history",
        title: "History of India & Bihar 10-Min Speed Drill",
        category: "SPEED_DRILLS",
        subject: "History",
        subjectFilter: ["History"],
        questionsCount: 15,
        marks: 15,
        timeMins: 10,
        statusLabel: "10-Min Subject Drill",
        desc: "15 questions covering Ancient, Medieval, and Modern Indian National Movement with Bihar freedom fighters.",
        isSpeedDrill: true
      },
      {
        id: "drill_geography",
        title: "Geography & Environment 10-Min Speed Drill",
        category: "SPEED_DRILLS",
        subject: "Geography",
        subjectFilter: ["Geography", "Environment"],
        questionsCount: 15,
        marks: 15,
        timeMins: 10,
        statusLabel: "10-Min Subject Drill",
        desc: "15 targeted MCQs on Indian & Bihar rivers, climate, soil types, forests & sanctuaries.",
        isSpeedDrill: true
      },
      {
        id: "drill_science",
        title: "General Science (Bio, Phy, Chem) 10-Min Speed Drill",
        category: "SPEED_DRILLS",
        subject: "General Science",
        subjectFilter: ["Biology", "Physics", "Chemistry"],
        questionsCount: 15,
        marks: 15,
        timeMins: 10,
        statusLabel: "10-Min Subject Drill",
        desc: "15 everyday science questions spanning Human Biology, Everyday Physics, and Chemical Reactions.",
        isSpeedDrill: true
      },
      {
        id: "drill_current_affairs",
        title: "Current Affairs & Schemes 10-Min Speed Drill",
        category: "SPEED_DRILLS",
        subject: "Current Affairs",
        subjectFilter: ["Current Affairs"],
        questionsCount: 15,
        marks: 15,
        timeMins: 10,
        statusLabel: "10-Min Subject Drill",
        desc: "15 questions testing national events, sports awards, summits & key Bihar government initiatives.",
        isSpeedDrill: true
      },
      {
        id: "drill_reasoning",
        title: "Mental Ability & Reasoning 10-Min Speed Drill",
        category: "SPEED_DRILLS",
        subject: "Reasoning",
        subjectFilter: ["Reasoning", "Mathematics"],
        questionsCount: 15,
        marks: 15,
        timeMins: 10,
        statusLabel: "10-Min Subject Drill",
        desc: "15 sharp aptitude, series, coding-decoding, and quantitative reasoning questions for Prelims Paper 1.",
        isSpeedDrill: true
      }
    ];
// ==========================================
    const SHAKTIQ_CUTOFF_CONFIG = {
      safe: 98,              // Score >= 98: Safe Zone
      borderline: 85,        // Score 85 - 97.99: Borderline Zone
      needsImprovement: 0,   // Score < 85: Needs Improvement Zone
      maxScore: 150,
      // Helper for speed drills & varying test sizes
      getThresholdsForTest: function(totalQ) {
        const total = (typeof totalQ === 'number' && totalQ > 0) ? totalQ : 150;
        const scale = total / 150;
        return {
          safe: parseFloat((this.safe * scale).toFixed(1)),
          borderline: parseFloat((this.borderline * scale).toFixed(1)),
          scale: scale,
          total: total
        };
      }
    };
    window.SHAKTIQ_CUTOFF_CONFIG = SHAKTIQ_CUTOFF_CONFIG;

// Global exports for browser and node test runners
if (typeof window !== 'undefined') {
  window.SHAKTIQ_EXAM_PACKS = SHAKTIQ_EXAM_PACKS;
  window.CURATED_TESTS = CURATED_TESTS;
  window.SPEED_DRILLS_CONFIG = SPEED_DRILLS_CONFIG;
  window.SHAKTIQ_CUTOFF_CONFIG = SHAKTIQ_CUTOFF_CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SHAKTIQ_EXAM_PACKS,
    CURATED_TESTS,
    SPEED_DRILLS_CONFIG,
    SHAKTIQ_CUTOFF_CONFIG
  };
}
