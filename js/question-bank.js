/**
 * ShaktiQ Question Bank & Practice Module
 * Modular Architecture (Feature 3.2)
 * Manages 2800+ PYQs, subject pills, active recall, card rendering, filtering & admin tools
 */

// ==========================================

    let INITIAL_QUESTIONS = [];
    let questionsLoaded = false;
    let questionsLoadPromise = null;

    const AUTH_BACKEND_ORIGIN = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? window.location.origin
      : 'https://shaktiq-auth-gate.shaktiq-portal.workers.dev';

    function getAspirantAuthToken() {
      try {
        return localStorage.getItem('shaktiq_auth_token') || '';
      } catch (e) {
        return '';
      }
    }

    async function requestSessionToken(email, name) {
      if (!email) return null;
      try {
        const res = await fetch(AUTH_BACKEND_ORIGIN + '/api/register-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, name: name || 'Aspirant' })
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.token) {
            localStorage.setItem('shaktiq_auth_token', json.token);
            return json.token;
          }
        }
      } catch (err) {
        console.warn('ShaktiQ token registration notice:', err);
      }
      return null;
    }

    function loadQuestionsData(forceReload) {
      if (!forceReload && questionsLoadPromise) return questionsLoadPromise;

      const token = getAspirantAuthToken();
      // On initial unauthenticated page load, defer question fetch until aspirant signs in or starts a test
      if (!token && !forceReload) {
        questionsLoaded = false;
        return Promise.resolve([]);
      }

      const fetchHeaders = {};
      if (token) {
        fetchHeaders['Authorization'] = 'Bearer ' + token;
      }

      const fetchOptions = {
        cache: 'no-store',
        headers: fetchHeaders
      };
      if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
        fetchOptions.signal = AbortSignal.timeout(6000);
      }

      questionsLoadPromise = fetch(AUTH_BACKEND_ORIGIN + '/questions.json?v=' + Date.now(), fetchOptions)
        .then(function(res) {
          if (res.status === 401 || res.status === 403) {
            console.warn('ShaktiQ: Session token required to load question bank.');
            INITIAL_QUESTIONS = [];
            questionsLoaded = false;
            return [];
          }
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function(data) {
          if (!Array.isArray(data)) {
            console.warn('ShaktiQ: Question bank format not array (likely unauthenticated decoy).');
            INITIAL_QUESTIONS = [];
            questionsLoaded = false;
            return [];
          }
          INITIAL_QUESTIONS = data;
          questionsLoaded = true;
          try {
            if (typeof caches !== 'undefined') {
              caches.open('shaktiq-data-v14').then(c => {
                c.put('./questions.json', new Response(JSON.stringify(data), {
                  headers: { 'Content-Type': 'application/json; charset=utf-8' }
                }));
              }).catch(() => {});
            }
          } catch (e) {}
          try {
            if (typeof PrepBackendEngine !== 'undefined' && PrepBackendEngine.questions) {
              PrepBackendEngine.questions.save(data);
            }
          } catch (e) {}
          try {
            if (typeof updateHeaderCounters === 'function') updateHeaderCounters();
            if (typeof populateExamDropdowns === 'function') populateExamDropdowns();
            if (typeof renderSubjectPills === 'function') renderSubjectPills();
            if (typeof renderQuestions === 'function') renderQuestions();
            if (typeof renderTestSeriesCards === 'function') renderTestSeriesCards();
            if (typeof updatePwaStatus === 'function') updatePwaStatus(navigator.onLine ? 'ready' : 'offline');
          } catch (e) {
            console.warn('Post-load question UI update notice:', e);
          }
          return data;
        })
        .catch(async function(err) {
          console.warn('Network fetch for questions.json failed, checking offline cache fallback:', err);
          // 1. Try CacheStorage
          try {
            if (typeof caches !== 'undefined') {
              const dataCache = await caches.open('shaktiq-data-v14');
              const match = await dataCache.match('./questions.json') || await caches.match('./questions.json');
              if (match) {
                const cachedData = await match.json();
                if (Array.isArray(cachedData) && cachedData.length > 0) {
                  INITIAL_QUESTIONS = cachedData;
                  questionsLoaded = true;
                  try {
                    if (typeof updateHeaderCounters === 'function') updateHeaderCounters();
                    if (typeof populateExamDropdowns === 'function') populateExamDropdowns();
                    if (typeof renderSubjectPills === 'function') renderSubjectPills();
                    if (typeof renderQuestions === 'function') renderQuestions();
                    if (typeof renderTestSeriesCards === 'function') renderTestSeriesCards();
                    if (typeof updatePwaStatus === 'function') updatePwaStatus('offline');
                  } catch (e) {}
                  return cachedData;
                }
              }
            }
          } catch (cErr) {
            console.warn('CacheStorage offline fallback notice:', cErr);
          }

          // 2. Try IndexedDB
          try {
            if (typeof PrepBackendEngine !== 'undefined' && PrepBackendEngine.questions) {
              const idbData = await PrepBackendEngine.questions.load();
              if (Array.isArray(idbData) && idbData.length > 0) {
                INITIAL_QUESTIONS = idbData;
                questionsLoaded = true;
                try {
                  if (typeof updateHeaderCounters === 'function') updateHeaderCounters();
                  if (typeof populateExamDropdowns === 'function') populateExamDropdowns();
                  if (typeof renderSubjectPills === 'function') renderSubjectPills();
                  if (typeof renderQuestions === 'function') renderQuestions();
                  if (typeof renderTestSeriesCards === 'function') renderTestSeriesCards();
                  if (typeof updatePwaStatus === 'function') updatePwaStatus('offline');
                } catch (e) {}
                return idbData;
              }
            }
          } catch (idbErr) {
            console.warn('IndexedDB offline fallback notice:', idbErr);
          }

          return [];
        });
      return questionsLoadPromise;
    }

    // Immediately kick off background fetch so questions arrive during initial render
    loadQuestionsData();

    const INITIAL_EXAMS = [
  {
    "name": "BPSC TRE 4.0",
    "displayTitle": "BPSC TRE 4.0 (Upcoming 2026)",
    "advt": "TRE 4.0",
    "date": "Upcoming (2026)",
    "year": "2026",
    "type": "Objective Teacher Recruitment",
    "status": "Upcoming — Ready to Add Questions",
    "url": "https://www.adda247.com/teaching-jobs-exam/bpsc-tre-4-0-notification-2026-out/"
  },
  {
    "name": "BPSC Stenographer Exam",
    "displayTitle": "BPSC Stenographer Exam (11/06/2026)",
    "advt": "BPSC",
    "date": "11 Jun 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (150 Qs)",
    "url": "https://testbook.com/bpsc-stenographer"
  },
  {
    "name": "BPSC Special Teacher Exam (Shift 2)",
    "displayTitle": "BPSC Special Teacher Exam (Shift 2) (29/01/2026)",
    "advt": "BPSC",
    "date": "29 Jan 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (79 Qs)",
    "url": "https://www.adda247.com/teaching-jobs-exam/bpsc-special-teacher-question-paper-2026/"
  },
  {
    "name": "BPSC Special Teacher Exam (Shift 1)",
    "displayTitle": "BPSC Special Teacher Exam (Shift 1) (29/01/2026)",
    "advt": "BPSC",
    "date": "29 Jan 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (150 Qs)",
    "url": "https://www.adda247.com/teaching-jobs-exam/bpsc-special-teacher-question-paper-2026/"
  },
  {
    "name": "BPSC Research Officer Prelims",
    "displayTitle": "BPSC Research Officer Prelims (15/07/2026)",
    "advt": "BPSC",
    "date": "15 Jul 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (150 Qs)",
    "url": "https://instituteofpublicservices.com/2026/07/28/bpsc-research-officer-preliminary-exam-2026-question-paper/"
  },
  {
    "name": "BPSC Prosecution Officer Prelims",
    "displayTitle": "BPSC Prosecution Officer Prelims (15/07/2026)",
    "advt": "BPSC",
    "date": "15 Jul 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (100 Qs)",
    "url": "https://instituteofpublicservices.com/2026/07/28/bpsc-prosecution-officer-preliminary-exam-2026-question-paper/"
  },
  {
    "name": "BPSC DSO Mains",
    "displayTitle": "BPSC DSO Mains (29/01/2026)",
    "advt": "BPSC",
    "date": "29 Jan 2026",
    "year": "2026",
    "type": "Descriptive Mains",
    "status": "Conducted & Extracted (4 Qs)",
    "url": "https://bpscconceptwallah.com/wp-content/uploads/2026/02/DSO-GS1-Paper.pdf"
  },
  {
    "name": "BPSC Auditor Prelims",
    "displayTitle": "BPSC Auditor Prelims (05/07/2026)",
    "advt": "BPSC",
    "date": "5 Jul 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (150 Qs)",
    "url": "https://instituteofpublicservices.com/2026/07/08/bpsc-auditor-prelims-exam-2026-question-paper/"
  },
  {
    "name": "BPSC Assistant Environmental Scientist",
    "displayTitle": "BPSC Assistant Environmental Scientist (11/06/2026)",
    "advt": "BPSC",
    "date": "11 Jun 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (19 Qs)",
    "url": "http://www.youtube.com/watch?v=OBZTMM7wjNA"
  },
  {
    "name": "BPSC ASO Mains",
    "displayTitle": "BPSC ASO Mains (27/02/2026)",
    "advt": "BPSC",
    "date": "27 Feb 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (150 Qs)",
    "url": "https://www.adda247.com/jobs/wp-content/uploads/sites/22/2026/04/29163622/BPSC-ASO-Mains-Question-Paper-Held-on-27-Feb-2026-exam.pdf"
  },
  {
    "name": "BPSC APS & WMO Exam",
    "displayTitle": "BPSC APS & WMO Exam (23/04/2026)",
    "advt": "BPSC",
    "date": "23 Apr 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (9 Qs)",
    "url": "http://www.youtube.com/watch?v=K_IRR3VmOpk"
  },
  {
    "name": "BPSC AEDO General Studies (Phase III)",
    "displayTitle": "BPSC AEDO General Studies (Phase III) (20/04/2026)",
    "advt": "BPSC",
    "date": "20 Apr 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (100 Qs)",
    "url": "https://www.scribd.com/document/1030976961/Bpsc-Aedo-All-Gs-Question-Bkk"
  },
  {
    "name": "BPSC AEDO General Studies (Phase II)",
    "displayTitle": "BPSC AEDO General Studies (Phase II) (17/04/2026)",
    "advt": "BPSC",
    "date": "17 Apr 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (100 Qs)",
    "url": "https://www.adda247.com/jobs/wp-content/uploads/sites/22/2026/04/17165603/BPSC-AEDO-GS-Paper-Phase-II.pdf"
  },
  {
    "name": "BPSC AEDO General Studies (Phase I)",
    "displayTitle": "BPSC AEDO General Studies (Phase I) (14/04/2026)",
    "advt": "BPSC",
    "date": "14 Apr 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (100 Qs)",
    "url": "https://www.scribd.com/document/1027265707/BPSC-AEDO-GS-Paper-2026-in-English"
  },
  {
    "name": "BPSC AEDO General Aptitude (Phase III)",
    "displayTitle": "BPSC AEDO General Aptitude (Phase III) (21/04/2026)",
    "advt": "BPSC",
    "date": "21 Apr 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (100 Qs)",
    "url": "https://www.youtube.com/watch?v=8QdNq2WHiIw"
  },
  {
    "name": "BPSC AEDO General Aptitude (Phase II)",
    "displayTitle": "BPSC AEDO General Aptitude (Phase II) (18/04/2026)",
    "advt": "BPSC",
    "date": "18 Apr 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (100 Qs)",
    "url": "https://www.adda247.com/jobs/wp-content/uploads/sites/22/2026/04/21130158/BPSC-AEDO-General-Aptitude-Paper-Shift-III.pdf"
  },
  {
    "name": "BPSC AEDO General Aptitude (Phase I)",
    "displayTitle": "BPSC AEDO General Aptitude (Phase I) (15/04/2026)",
    "advt": "BPSC",
    "date": "15 Apr 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (100 Qs)",
    "url": "https://www.scribd.com/document/1033715115/BPSC-AEDO-General-Aptitude-Paper-English"
  },
  {
    "name": "71st BPSC CCE Mains",
    "displayTitle": "71st BPSC CCE Mains (29/04/2026)",
    "advt": "BPSC",
    "date": "29 Apr 2026",
    "year": "2026",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (16 Qs)",
    "url": "https://instituteofpublicservices.com/2026/06/17/bpsc-71st-cce-main-examination-2026-question-paper/"
  },
  {
    "name": "BPSC MVI GS Paper",
    "displayTitle": "BPSC MVI GS Paper (09/08/2025)",
    "advt": "BPSC",
    "date": "9 Aug 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (100 Qs)",
    "url": "https://instituteofpublicservices.com/2025/08/14/bpsc-motor-vehicle-inspector-exam-2025-question-paper/"
  },
  {
    "name": "BPSC MDO Exam",
    "displayTitle": "BPSC MDO Exam (09/08/2025)",
    "advt": "BPSC",
    "date": "9 Aug 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (100 Qs)",
    "url": "https://instituteofpublicservices.com/2025/08/14/bpsc-mineral-development-officer-exam-2025-question-paper/"
  },
  {
    "name": "BPSC Lecturer Mining Engineering Exam",
    "displayTitle": "BPSC Lecturer Mining Engineering Exam (20/03/2025)",
    "advt": "BPSC",
    "date": "20 Mar 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (3 Qs)",
    "url": "https://bpsc.bihar.gov.in/"
  },
  {
    "name": "BPSC LDC Exam",
    "displayTitle": "BPSC LDC Exam (20/09/2025)",
    "advt": "BPSC",
    "date": "20 Sep 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (150 Qs)",
    "url": "https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/Notices/14-11-25-2-Advt.-No.-43-2025-LDC-Sub-General-Knowledge-Final-answer-key_BPSC-20251114-p2e43t.pdf"
  },
  {
    "name": "BPSC ITI Vice Principal Exam",
    "displayTitle": "BPSC ITI Vice Principal Exam (17/08/2025)",
    "advt": "BPSC",
    "date": "17 Aug 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (7 Qs)",
    "url": "https://testbook.com/bpsc-vice-principal"
  },
  {
    "name": "BPSC DSO Prelims",
    "displayTitle": "BPSC DSO Prelims (03/08/2025)",
    "advt": "BPSC",
    "date": "3 Aug 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (52 Qs)",
    "url": "https://bpscconceptwallah.com/wp-content/uploads/2026/02/DSO-Prelims-General-Studies.pdf"
  },
  {
    "name": "BPSC Consumer Commission Judicial Member Exam",
    "displayTitle": "BPSC Consumer Commission Judicial Member Exam (03/05/2025)",
    "advt": "BPSC",
    "date": "3 May 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (4 Qs)",
    "url": "https://bpsc.bihar.gov.in/"
  },
  {
    "name": "BPSC Combined AE GS",
    "displayTitle": "BPSC Combined AE GS (18/07/2025)",
    "advt": "BPSC",
    "date": "18 Jul 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (50 Qs)",
    "url": "https://www.adda247.com/exams/bihar/bpsc-exam-calendar-2026/"
  },
  {
    "name": "BPSC BSPCB Exam",
    "displayTitle": "BPSC BSPCB Exam (27/07/2025)",
    "advt": "BPSC",
    "date": "27 Jul 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (9 Qs)",
    "url": "https://instituteofpublicservices.com/2025/08/14/bpsc-bspcb-posts-exam-2025-question-paper/"
  },
  {
    "name": "BPSC ASO Prelims",
    "displayTitle": "BPSC ASO Prelims (10/09/2025)",
    "advt": "BPSC",
    "date": "10 Sep 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (12 Qs)",
    "url": "https://testbook.com/bpsc-aso/previous-year-papers"
  },
  {
    "name": "71st BPSC CCE Prelims",
    "displayTitle": "71st BPSC CCE Prelims (13/09/2025)",
    "advt": "BPSC",
    "date": "13 Sep 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (150 Qs)",
    "url": "https://www.unlockias.in/bpsc-71st-cce-2025-prelims-question-paper"
  },
  {
    "name": "70th BPSC CCE Prelims (Re-Exam)",
    "displayTitle": "70th BPSC CCE Prelims (04/01/2025, Re)",
    "advt": "BPSC",
    "date": "4 Jan 2025",
    "year": "2025",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (150 Qs)",
    "url": "https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/QuestionBooklets/GENERAL-STUDIES-04-01-25.pdf"
  },
  {
    "name": "70th BPSC CCE Mains",
    "displayTitle": "70th BPSC CCE Mains (25/04/2025)",
    "advt": "BPSC",
    "date": "25 Apr 2025",
    "year": "2025",
    "type": "Descriptive Mains",
    "status": "Conducted & Extracted (7 Qs)",
    "url": "https://www.drishtiias.com/images/pdf/70th_BPSC_Mains_Essay_Paper.pdf"
  },
  {
    "name": "70th BPSC CCE Prelims (Main)",
    "displayTitle": "70th BPSC CCE Prelims (13/12/2024)",
    "advt": "BPSC",
    "date": "13 Dec 2024",
    "year": "2024",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (101 Qs)",
    "url": "https://www.unlockias.in/bpsc-70th-cce-2024-prelims-question-paper"
  },
  {
    "name": "69th BPSC CCE Prelims",
    "displayTitle": "69th BPSC CCE Prelims (30/09/2023)",
    "advt": "BPSC",
    "date": "30 Sep 2023",
    "year": "2023",
    "type": "Objective GS / Aptitude",
    "status": "Conducted & Extracted (25 Qs)",
    "url": "https://testbook.com/bpsc-exam/previous-year-papers"
  }
];

    const SUBJECT_ORDER = [
      "Physics",
      "Chemistry",
      "Biology",
      "History",
      "Geography",
      "Economics",
      "Polity",
      "Current Affairs",
      "Bihar Special",
      "Environment",
      "Mathematics",
      "Reasoning"
    ];

    const SUBJECT_COLORS = {
      "History": "bg-amber-500/15 text-amber-300 border-amber-500/30",
      "Polity": "bg-amber-500/15 text-amber-300 border-amber-500/30",
      "Bihar Special": "bg-amber-500/15 text-amber-300 border-amber-500/30",
      "Economics": "bg-amber-500/15 text-amber-300 border-amber-500/30",
      "Biology": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      "Geography": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      "Environment": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      "Physics": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      "Chemistry": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      "General Studies": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      "Current Affairs": "bg-rose-500/15 text-rose-300 border-rose-500/30",
      "Mathematics": "bg-rose-500/15 text-rose-300 border-rose-500/30",
      "Reasoning": "bg-rose-500/15 text-rose-300 border-rose-500/30"
    };

    // Storage keys loaded from ./js/storage.js

    let customQuestions = [];
    let customExams = [];
    let bookmarkedIds = {};
    let userAttempts = {}; // { qid: selectedLetter }
    let practiceFilterStatus = 'all'; // 'all', 'unattempted', 'attempted'
    let isMistakeRetryMode = false;
    let mistakeRetryAttempts = {};

        // Mistake Register storage loaded from ./js/storage.js


    function toggleMistakesFilter(forceValue) {
      if (typeof forceValue === "boolean") {
        selectedType = forceValue ? "MISTAKES" : "ALL";
      } else {
        selectedType = (selectedType === "MISTAKES") ? "ALL" : "MISTAKES";
      }
      const typeFilter = document.getElementById("typeFilter");
      if (typeFilter) typeFilter.value = selectedType;
      displayLimit = (selectedType === "MISTAKES") ? 99999 : 60;
      try {
        if (selectedType === "MISTAKES") {
          history.replaceState(null, null, '#mistakes');
        } else if (window.location.hash === '#mistakes') {
          history.replaceState(null, null, '#pyq-bank');
        }
      } catch (e) {}
      updateMistakeCountBadge();
      renderQuestions();
    }

    function toggleMistakeRetryMode(active) {
      isMistakeRetryMode = !!active;
      renderQuestions();
    }

    function clearMistakeAttemptsForRetry() {
      mistakeRetryAttempts = {};
      isMistakeRetryMode = true;
      renderQuestions();
      showToast("Ready for fresh retry! All mistake questions reset for re-attempt.", "🔄");
    }

    function updateMistakeCountBadge() {
      const reg = loadMistakeRegister();
      const count = Object.keys(reg).length;
      const isHi = (typeof ShaktiQBilingualEngine !== 'undefined' && ShaktiQBilingualEngine.currentLang === 'hi');
      const badgeEl = document.getElementById("mistakeBadgeCount");
      if (badgeEl) {
        badgeEl.textContent = count;
      }
      const btnText = document.getElementById("filterMistakesBtnText");
      if (btnText) {
        btnText.textContent = isHi ? "🎯 केवल गलत प्रश्न" : "🎯 Only My Incorrect Questions";
      }
      const typeFilterOpt = document.querySelector('#typeFilter option[value="MISTAKES"]');
      if (typeFilterOpt) {
        typeFilterOpt.textContent = isHi ? `❌ केवल मेरे गलत प्रश्न (${count})` : `❌ Only My Incorrect Questions (${count})`;
      }
      const bannerCount = document.getElementById("mistakeBannerCount");
      if (bannerCount) {
        bannerCount.textContent = `${count} ${isHi ? 'प्रश्न' : (count === 1 ? 'question' : 'questions')}`;
      }
      const btn = document.getElementById("filterMistakesBtn");
      if (btn) {
        if (selectedType === "MISTAKES") {
          btn.classList.remove("border-rose-200", "bg-rose-50", "text-rose-800", "hover:bg-rose-100");
          btn.classList.add("bg-[#10402D]", "text-white", "border-[#10402D]", "shadow-sm");
        } else {
          btn.classList.remove("bg-[#10402D]", "text-white", "border-[#10402D]", "shadow-sm");
          btn.classList.add("border-rose-200", "bg-rose-50", "text-rose-800", "hover:bg-rose-100");
        }
      }
    }

    function loadStudentPracticeAttempts() {
      const prefix = getStudentStoragePrefix();
      try {
        const saved = localStorage.getItem(prefix + '_practice');
        if (saved) return JSON.parse(saved) || {};
        // Backward-compatible fallback / migration
        const legacy = localStorage.getItem('bpsc_practice_attempts_v1');
        if (legacy) {
          const parsed = JSON.parse(legacy) || {};
          localStorage.setItem(prefix + '_practice', JSON.stringify(parsed));
          return parsed;
        }
      } catch (e) {}
      return {};
    }

    function saveStudentPracticeAttempt(qid, opt) {
      userAttempts[qid] = opt;
      const prefix = getStudentStoragePrefix();
      const now = Date.now();
      try {
        localStorage.setItem(prefix + '_practice', JSON.stringify(userAttempts));
        localStorage.setItem('bpsc_practice_attempts_v1', JSON.stringify(userAttempts));

        // Save timestamp for genuine 24-hour daily goal tracking
        const tsMap = JSON.parse(localStorage.getItem(prefix + '_timestamps') || '{}');
        tsMap[qid] = now;
        localStorage.setItem(prefix + '_timestamps', JSON.stringify(tsMap));
      } catch (e) {}
    }

    // Filter state
    let activeView = "bank";
    let selectedSubject = "ALL";
    let selectedYear = "ALL";
    let selectedExam = "ALL";
    let selectedType = "ALL";
    let searchQuery = "";
    let groupBySubject = true;
    let showAllAnswers = false;
    let displayLimit = 60;

    function loadStoredState() {
      try {
        const rawQs = localStorage.getItem(STORAGE_KEY_CUSTOM_QS);
        if (rawQs) customQuestions = JSON.parse(rawQs) || [];
      } catch (e) {
        customQuestions = [];
      }
      try {
        const rawBm = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
        if (rawBm) bookmarkedIds = JSON.parse(rawBm) || {};
      } catch (e) {
        bookmarkedIds = {};
      }
      try {
        const rawEx = localStorage.getItem(STORAGE_KEY_CUSTOM_EXAMS);
        if (rawEx) customExams = JSON.parse(rawEx) || [];
      } catch (e) {
        customExams = [];
      }
      if (typeof updateMistakeCountBadge === 'function') updateMistakeCountBadge();
    }

    function saveCustomQuestions() {
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_QS, JSON.stringify(customQuestions));
      } catch (e) {}
    }

    function saveBookmarks() {
      try {
        localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarkedIds));
      } catch (e) {}
    }

    function saveCustomExams() {
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_EXAMS, JSON.stringify(customExams));
      } catch (e) {}
    }

    function getAllQuestions() {
      return INITIAL_QUESTIONS.concat(customQuestions);
    }

    function getAllExams() {
      return INITIAL_EXAMS.concat(customExams);
    }

    // Legacy QB toast routed to global unified toast
    function showToastQb(msg, icon) {
      showToast(msg, icon === '⚠' ? 'error' : 'success');
    }

    function escapeHtml(str) {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

        // BILINGUAL HELPERS loaded from ./js/bilingual.js


    function formatQuestionText(text) {
      if (!text || typeof text !== "string") return text;
      let q = text.trim();
      if (q.includes("\n")) return q;
      let hasStatements = false;
      const hasNumberedParens = /(?:^|\s|\()(?:1\)|[१]\))\s+[^]*?(?:2\)|[२]\))\s+/i.test(q);
      const hasParenDigits = /(?:^|\s)\((?:1|[१])\)\s+[^]*?\((?:2|[२])\)\s+/i.test(q);
      const hasRoman = /(?:^|\s)(?:I\.|I\))\s+[^]*?(?:II\.|II\))\s+/i.test(q);
      const hasLetters = /(?:^|\s)(?:a\)|[aA]\.)\s+[^]*?(?:b\)|[bB]\.)\s+/i.test(q);
      const hasNumberedDots = /(?:^|\s)(?:1\.|[१]\.)\s+[A-Z\u0900-\u097F"'][^]*?(?:2\.|[२]\.)\s+[A-Z\u0900-\u097F"']/i.test(q);
      const hasRomanLower = /(?:^|\s)\(i\)\s+[^]*?\(ii\)\s+/i.test(q);

      if (hasNumberedParens || hasParenDigits || hasRoman || hasLetters || hasNumberedDots || hasRomanLower) {
        hasStatements = true;
        if (hasNumberedParens) {
          q = q.replace(/([:?.]|[^\d\s—–-])\s+([1-9]\d?\)\s+)/g, "$1\n$2");
          q = q.replace(/([:?।.]|[^\d\s—–-])\s+([१-९]\d?\)\s+)/g, "$1\n$2");
        }
        if (hasParenDigits) {
          q = q.replace(/([:?.]|[^\d\s—–-])\s+(\([1-9]\d?\)\s+)/g, "$1\n$2");
          q = q.replace(/([:?।.]|[^\d\s—–-])\s+(\([१-९]\d?\)\s+)/g, "$1\n$2");
        }
        if (hasRomanLower) {
          q = q.replace(/([:?.]|[^\d\s—–-])\s+(\((?:i|ii|iii|iv|v|vi|vii|viii|ix|x)\)\s+)/gi, "$1\n$2");
        }
        if (hasRoman) {
          q = q.replace(/([:?.]|[^\w\s—–-]|\w)\s+((?:I|II|III|IV|V|VI|VII|VIII|IX|X)[\.)]\s+)/g, "$1\n$2");
        }
        if (hasNumberedDots) {
          q = q.replace(/([:?.]|[^\d\s—–-])\s+([1-9]\d?\.\s+(?=[A-Z\u0900-\u097F"']))/g, "$1\n$2");
          q = q.replace(/([:?।.]|[^\d\s—–-])\s+([१-९]\d?\.\s+(?=[\u0900-\u097F"']))/g, "$1\n$2");
        }
        if (hasLetters) {
          q = q.replace(/([:?,.]|[^\w\s—–-])\s+([a-h]\)\s+)/gi, "$1\n$2");
        }
      }

      if (hasStatements) {
        const concludingRegex = /(?<=\S)\s+((?:(?:Which|How many) of the (?:above|statements|pairs|following statements)|Select the correct|Choose the correct|Out of these,? which|Arrange (?:these|the following)|In the light of the above|Codes?:|उपर्युक्त कथनों में से|उपरोक्त में से|नीचे दिए गए कूट|इनमें से कौन)[^]*)$/i;
        if (concludingRegex.test(q)) {
          q = q.replace(concludingRegex, "\n$1");
        }
      }
      return q.replace(/\n{3,}/g, "\n\n").trim();
    }

    function renderFormattedQuestionHtml(rawText) {
      if (!rawText || typeof rawText !== "string") return "";
      const formatted = formatQuestionText(rawText);
      if (!formatted.includes("\n")) {
        return escapeHtml(formatted);
      }
      const lines = formatted.split("\n");
      return lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        if (idx === 0) {
          return `<span>${escapeHtml(trimmed)}</span>`;
        }
        return `<span class="block mt-1 sm:mt-1.5">${escapeHtml(trimmed)}</span>`;
      }).join("");
    }

    function isAdminMode() {
      return (window.location.hash || '').toLowerCase().includes('#admin');
    }

    function updateAdminUI() {
      const isAdmin = isAdminMode();
      const manageBtn = document.getElementById("subnav-btn-manage");
      if (manageBtn) {
        if (isAdmin) {
          manageBtn.classList.remove("hidden");
          manageBtn.style.display = "";
        } else {
          manageBtn.classList.add("hidden");
          manageBtn.style.display = "none";
        }
      }
      const quickAddBtn = document.getElementById("quickAddQuestionBtn");
      if (quickAddBtn) {
        if (isAdmin) {
          quickAddBtn.classList.remove("hidden");
          quickAddBtn.style.display = "";
        } else {
          quickAddBtn.classList.add("hidden");
          quickAddBtn.style.display = "none";
        }
      }
      const customWrapper = document.getElementById("headerCustomCountWrapper");
      if (customWrapper) {
        if (isAdmin) {
          customWrapper.classList.remove("hidden");
          customWrapper.style.display = "";
        } else {
          customWrapper.classList.add("hidden");
          customWrapper.style.display = "none";
        }
      }
    }

    function switchView(viewName) {
      if (viewName === 'manage' && !isAdminMode()) {
        showToast('Admin mode required (access via #admin in URL)', 'info');
        return;
      }
      if (viewName === 'bank' && !getCurrentAspirant()) {
        openAspirantRegModal('Please sign in with your profile before accessing the Question Bank.');
        return;
      }
      activeView = viewName;
      const views = ["testseries", "bank", "analytics", "exams", "manage", "practice"];
      views.forEach(v => {
        const el = document.getElementById("view-" + v);
        if (el) {
          if (v === viewName) el.classList.remove("hidden");
          else el.classList.add("hidden");
        }
      });
      const ttWork = document.getElementById("test-taking-workspace");
      if (ttWork) ttWork.classList.add("hidden");
      const solWork = document.getElementById("test-solution-workspace");
      if (solWork) solWork.classList.add("hidden");
      const resModal = document.getElementById("tt-result-modal");
      if (resModal) resModal.classList.add("hidden");

      if (viewName === 'analytics') {
        updatePageMeta({
          title: "My Prep & Weak Areas Analytics | ShaktiQ",
          description: "Track your subject-wise accuracy, question attempts, and weak areas across BPSC syllabus on ShaktiQ.",
          url: "https://shaktiq.com/#analytics",
          image: "https://shaktiq.com/share-card.png"
        });
      } else if (viewName === 'manage') {
        updatePageMeta({
          title: "Question Management Portal (Admin) | ShaktiQ",
          description: "Internal administration interface for ShaktiQ question bank management.",
          url: "https://shaktiq.com/#admin",
          image: "https://shaktiq.com/share-card.png"
        });
      } else if (viewName === 'bank') {
        updatePageMeta({
          title: "2,800+ Subject-Wise BPSC PYQ Bank | ShaktiQ",
          description: "Explore 2,800+ verified BPSC previous year questions organized by subject and exam with active recall self-testing.",
          url: "https://shaktiq.com/#pyq-bank",
          image: "https://shaktiq.com/share-card.png"
        });
      } else if (viewName === 'testseries') {
        updatePageMeta({
          title: "22 Full-Length BPSC Mock Tests | ShaktiQ",
          description: "Attempt 22 full-length 150-question mock tests calibrated to exact BPSC pattern with 1/3 negative marking and Option E safe-skip rule.",
          url: "https://shaktiq.com/#test-series",
          image: "https://shaktiq.com/share-card.png"
        });
      }

      document.querySelectorAll(".nav-tab").forEach(btn => {
        if (btn.getAttribute("data-view") === viewName) {
          btn.classList.add("nav-tab-active");
          btn.classList.remove("text-slate-400", "text-slate-300");
        } else {
          btn.classList.remove("nav-tab-active");
          btn.classList.add("text-slate-400");
        }
      });

      // Update pyq-subnav active button styling
      const subnavMap = {
        'bank': 'subnav-btn-bank',
        'analytics': 'subnav-btn-analytics',
        'manage': 'subnav-btn-manage'
      };
      Object.keys(subnavMap).forEach(key => {
        const btn = document.getElementById(subnavMap[key]);
        if (btn) {
          const hideClass = (key === 'manage' && !isAdminMode()) ? ' hidden' : '';
          if (key === viewName) {
            btn.className = 'subnav-btn subnav-active px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#10402D] bg-[#EBF3E6] border border-[#C6DEC0] cursor-pointer shadow-2xs inline-flex items-center gap-1.5' + hideClass;
          } else {
            btn.className = 'subnav-btn subnav-inactive px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#111C15] hover:text-[#10402D] bg-white border border-[#DCE6DF] hover:bg-[#F8FAF7] cursor-pointer shadow-2xs inline-flex items-center gap-1.5' + hideClass;
          }
        }
      });
      if (typeof updateAdminUI === 'function') updateAdminUI();

      // Synchronize workspace mode buttons with viewName
      const btnTS = document.getElementById('workspace-mode-btn-testseries');
      const btnPYQ = document.getElementById('workspace-mode-btn-pyq');
      if (viewName === 'testseries') {
        if (btnTS) btnTS.className = 'mode-active flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-[#10402D] text-white border border-[#10402D] shadow-sm cursor-pointer';
        if (btnPYQ) btnPYQ.className = 'mode-inactive flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-[#10402D] bg-white hover:bg-[#EBF3E6] border border-[#DCE6DF] cursor-pointer';
      } else {
        if (btnTS) btnTS.className = 'mode-inactive flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-[#10402D] bg-white hover:bg-[#EBF3E6] border border-[#DCE6DF] cursor-pointer';
        if (btnPYQ) btnPYQ.className = 'mode-active flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-[#10402D] text-white border border-[#10402D] shadow-sm cursor-pointer';
      }

      if (viewName === "testseries") {
        renderTestSeriesCards();
      } else if (viewName === "analytics") {
        renderStudentAnalyticsView();
      } else if (viewName === "exams") {
        renderExamDirectoryAndStats();
      } else if (viewName === "practice") {
        updatePracticeScorecard();
            if (typeof updateAbhyasUI === "function") updateAbhyasUI();
      } else if (viewName === "manage") {
        populateExamDropdowns();
      }
    }

    function getFilteredQuestions() {
      const all = getAllQuestions();
      const qLower = searchQuery.trim().toLowerCase();

      return all.filter(item => {
        if (selectedSubject !== "ALL" && item.subject !== selectedSubject) return false;

        if (selectedYear === "2025_2026") {
          if (item.year !== "2025" && item.year !== "2026") return false;
        } else if (selectedYear === "2026") {
          if (item.year !== "2026") return false;
        } else if (selectedYear === "2025") {
          if (item.year !== "2025") return false;
        } else if (selectedYear === "2024") {
          if (item.year !== "2024") return false;
        } else if (selectedYear === "2023") {
          if (item.year !== "2023") return false;
        } else if (selectedYear === "OLDER") {
          const yr = parseInt(item.year, 10);
          if (!isNaN(yr) && yr >= 2025) return false;
        } else if (selectedYear !== "ALL") {
          if (item.year !== selectedYear) return false;
        }

        if (selectedExam !== "ALL" && item.exam !== selectedExam) return false;

        if (selectedType === "MCQ" && item.type !== "MCQ") return false;
        if (selectedType === "Mains" && item.type !== "Mains") return false;
        if (selectedType === "BOOKMARKED" && !bookmarkedIds[item.id]) return false;
        if (selectedType === "CUSTOM" && !item.custom) return false;
        if (selectedType === "MISTAKES") {
          const reg = loadMistakeRegister();
          if (!reg[item.id]) return false;
        }
        if (selectedType === "UNATTEMPTED" && userAttempts[item.id]) return false;
        if (selectedType === "ATTEMPTED" && !userAttempts[item.id]) return false;
        if (practiceFilterStatus === 'unattempted' && userAttempts[item.id]) return false;
        if (practiceFilterStatus === 'attempted' && !userAttempts[item.id]) return false;

        if (qLower) {
          const hay = (
            (item.q || "") + " " +
            (item.ansText || "") + " " +
            (item.exp || "") + " " +
            (item.exam || "") + " " +
            (item.subject || "") + " " +
            (item.date || "") + " " +
            (item.options || []).join(" ")
          ).toLowerCase();
          if (!hay.includes(qLower)) return false;
        }
        return true;
      });
    }

    function updateHeaderCounters() {
      const all = getAllQuestions();
      const totalEl = document.getElementById("headerTotalCount");
      const customEl = document.getElementById("headerCustomCount");
      if (totalEl) totalEl.textContent = all.length;
      if (customEl) customEl.textContent = customQuestions.length;

      // Dynamically sync Year Filter Pills
      const yrCounts = { ALL: all.length, '2026': 0, '2025': 0, '2024': 0, '2023': 0 };
      all.forEach(q => {
        const y = String(q.year || '2025');
        if (yrCounts[y] !== undefined) yrCounts[y]++;
      });

      const allYearsBtn = document.querySelector('button[data-year-btn="ALL"]');
      if (allYearsBtn) allYearsBtn.textContent = 'All Years (' + all.length.toLocaleString() + ')';

      const btn2026 = document.querySelector('button[data-year-btn="2026"]');
      if (btn2026) btn2026.textContent = '2026 Exams (' + yrCounts['2026'].toLocaleString() + ')';

      const btn2025 = document.querySelector('button[data-year-btn="2025"]');
      if (btn2025) btn2025.textContent = '2025 Exams (' + yrCounts['2025'].toLocaleString() + ')';

      const btn2024 = document.querySelector('button[data-year-btn="2024"]');
      if (btn2024) btn2024.textContent = '2024 Exams (' + yrCounts['2024'].toLocaleString() + ')';

      const btn2023 = document.querySelector('button[data-year-btn="2023"]');
      if (btn2023) btn2023.textContent = '2023 Exams (' + yrCounts['2023'].toLocaleString() + ')';

      // Dynamically sync Test Series Category Buttons
      if (typeof CURATED_TESTS !== 'undefined' && Array.isArray(CURATED_TESTS)) {
        const totalTests = CURATED_TESTS.length;
        const cceCount = CURATED_TESTS.filter(t => t.category === 'BPSC_CCE').length;
        const treCount = CURATED_TESTS.filter(t => t.category === 'BPSC_TRE').length;
        const aedoCount = CURATED_TESTS.filter(t => t.category === 'AEDO').length;
        const otherCount = CURATED_TESTS.filter(t => t.category === 'OTHER_2026').length;

        const modeBtnSpan = document.querySelector('#workspace-mode-btn-testseries span');
        if (modeBtnSpan) modeBtnSpan.textContent = totalTests + ' Full-Length Mock Tests (Complete)';

        const tsAllBtn = document.querySelector('button[data-ts-filter="ALL"]');
        if (tsAllBtn) tsAllBtn.textContent = 'All BPSC-Pattern Tests (' + totalTests + ')';

        const tsCceBtn = document.querySelector('button[data-ts-filter="BPSC_CCE"]');
        if (tsCceBtn) tsCceBtn.textContent = '71st, 70th & 69th CCE (' + cceCount + ')';

        const tsTreBtn = document.querySelector('button[data-ts-filter="BPSC_TRE"]');
        if (tsTreBtn) tsTreBtn.textContent = 'TRE 4.0 & Teacher Exams (' + treCount + ')';

        const tsAedoBtn = document.querySelector('button[data-ts-filter="AEDO"]');
        if (tsAedoBtn) tsAedoBtn.textContent = 'AEDO Phase 1-3 Papers (' + aedoCount + ')';

        const tsOtherBtn = document.querySelector('button[data-ts-filter="OTHER_2026"]');
        if (tsOtherBtn) tsOtherBtn.textContent = 'Auditor, APO, Steno & Dept Exams (' + otherCount + ')';

        const bsscCount = CURATED_TESTS.filter(t => t.category === 'BSSC').length;
        const tsBsscLabel = document.getElementById('ts-filter-bssc-label');
        if (tsBsscLabel) {
          const isHi = (typeof ShaktiQBilingualEngine !== 'undefined' && ShaktiQBilingualEngine.currentLang === 'hi');
          if (bsscCount > 0) {
            tsBsscLabel.textContent = isHi ? `बीएसएससी पैक्स (${bsscCount})` : `BSSC Packs (${bsscCount})`;
          } else {
            tsBsscLabel.textContent = isHi ? 'बीएसएससी पैक्स (प्रारूप)' : 'BSSC Packs (Placeholder)';
          }
        }
      }
    }

    function renderSubjectPills() {
      const all = getAllQuestions();
      const counts = { ALL: all.length };
      const attemptedCounts = { ALL: 0 };
      SUBJECT_ORDER.forEach(s => { counts[s] = 0; attemptedCounts[s] = 0; });
      all.forEach(item => {
        counts[item.subject] = (counts[item.subject] || 0) + 1;
        if (userAttempts[item.id]) {
          attemptedCounts.ALL = (attemptedCounts.ALL || 0) + 1;
          attemptedCounts[item.subject] = (attemptedCounts[item.subject] || 0) + 1;
        }
      });

      const container = document.getElementById("subjectPillsContainer");
      if (!container) return;

      const allAtt = attemptedCounts.ALL || 0;
      const allTot = counts.ALL || 0;
      const allLeft = Math.max(0, allTot - allAtt);

      let html = `<button type="button" data-subject="ALL" class="subject-pill ${selectedSubject === 'ALL' ? 'subject-pill-active' : 'bg-[#F8FAF7] text-[#223127] hover:bg-[#EBF3E6] border-[#DCE6DF]'} border rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition flex items-center gap-1.5" title="${allAtt} attempted, ${allLeft} unattempted">
        <span>All Subjects</span>
        <span class="px-2 py-0.5 text-xs rounded-full ${selectedSubject === 'ALL' ? 'bg-white/20 text-white' : 'bg-black/10 text-[#111C15]'}">${allAtt > 0 ? `${allAtt}/${allTot}` : allTot}</span>
      </button>`;

      SUBJECT_ORDER.forEach(subj => {
        const isActive = selectedSubject === subj;
        const count = counts[subj] || 0;
        const att = attemptedCounts[subj] || 0;
        const unatt = Math.max(0, count - att);
        const countLabel = att > 0 ? `${att}/${count}` : count;
        html += `<button type="button" data-subject="${escapeHtml(subj)}" class="subject-pill ${isActive ? 'subject-pill-active' : 'bg-white text-[#223127] hover:bg-[#EBF3E6] border-[#DCE6DF]'} border rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition flex items-center gap-1.5" title="${att} attempted, ${unatt} unattempted remaining">
          <span>${escapeHtml(subj)}</span>
          <span class="px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#EBF3E6] text-[#10402D] font-bold'}">${countLabel}</span>
        </button>`;
      });

      container.innerHTML = html;

      container.querySelectorAll(".subject-pill").forEach(btn => {
        btn.addEventListener("click", () => {
          selectedSubject = btn.getAttribute("data-subject");
          displayLimit = 60;
          renderSubjectPills();
          updateSubjectProgressUI();
          renderQuestions();
        });
      });

      updateSubjectProgressUI();
    }

    function setPracticeStatusFilter(mode) {
      practiceFilterStatus = mode; // 'all', 'unattempted', 'attempted'
      displayLimit = 60;
      updateSubjectProgressUI();
      renderQuestions();
    }

    function updateSubjectProgressUI() {
      const all = getAllQuestions();
      const currentSubj = selectedSubject || 'ALL';

      let total = 0;
      let attempted = 0;

      all.forEach(q => {
        if (currentSubj === 'ALL' || q.subject === currentSubj) {
          total += 1;
          if (userAttempts[q.id]) attempted += 1;
        }
      });

      const unattempted = Math.max(0, total - attempted);
      const pct = total > 0 ? Math.round((attempted / total) * 100) : 0;

      const titleEl = document.getElementById('progSubjectTitle');
      const attEl = document.getElementById('progSubjectAttemptedBadge');
      const unattEl = document.getElementById('progSubjectUnattemptedBadge');
      const totEl = document.getElementById('progSubjectTotalBadge');
      const barEl = document.getElementById('progSubjectBar');

      const subjName = currentSubj === 'ALL' ? 'All Subjects' : currentSubj;
      if (titleEl) titleEl.textContent = `${subjName} Practice Progress:`;
      if (attEl) attEl.textContent = `${attempted} Attempted`;
      if (unattEl) unattEl.textContent = `${unattempted} Unattempted`;
      if (totEl) totEl.textContent = `(${total} Total Questions • ${pct}% Completed)`;
      if (barEl) barEl.style.width = `${pct}%`;

      const btnAll = document.getElementById('filterStatusBtn-all');
      const btnUnatt = document.getElementById('filterStatusBtn-unattempted');
      const btnAtt = document.getElementById('filterStatusBtn-attempted');

      if (btnAll) {
        btnAll.textContent = `All (${total})`;
        btnAll.className = practiceFilterStatus === 'all'
          ? 'px-3 py-1.5 rounded-xl font-bold text-xs bg-[#10402D] text-white transition cursor-pointer shadow-2xs'
          : 'px-3 py-1.5 rounded-xl font-bold text-xs bg-white text-[#223127] hover:bg-[#EBF3E6] border border-[#DCE6DF] transition cursor-pointer shadow-2xs';
      }
      if (btnUnatt) {
        btnUnatt.textContent = `Unattempted Only (${unattempted})`;
        btnUnatt.className = practiceFilterStatus === 'unattempted'
          ? 'px-3 py-1.5 rounded-xl font-bold text-xs bg-[#10402D] text-white transition cursor-pointer shadow-2xs'
          : 'px-3 py-1.5 rounded-xl font-bold text-xs bg-white text-[#223127] hover:bg-[#EBF3E6] border border-[#DCE6DF] transition cursor-pointer shadow-2xs';
      }
      if (btnAtt) {
        btnAtt.textContent = `Attempted (${attempted})`;
        btnAtt.className = practiceFilterStatus === 'attempted'
          ? 'px-3 py-1.5 rounded-xl font-bold text-xs bg-[#10402D] text-white transition cursor-pointer shadow-2xs'
          : 'px-3 py-1.5 rounded-xl font-bold text-xs bg-white text-[#223127] hover:bg-[#EBF3E6] border border-[#DCE6DF] transition cursor-pointer shadow-2xs';
      }
    }


    function toDdMmYyyy(dateStr) {
      const s = String(dateStr || '').trim();
      const monthMap = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
      };
      const m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
      if (m) {
        const d = String(m[1]).padStart(2, '0');
        const mon = monthMap[m[2].slice(0, 3).toLowerCase()] || '01';
        return `${d}/${mon}/${m[3]}`;
      }
      return s;
    }

    function formatUserExamTitle(examName, dateStr) {
      const cleanDate = toDdMmYyyy(dateStr);
      const isRe = examName.includes('Re-Exam') || String(dateStr).includes('Re');
      const cleanName = examName.replace(/\s*\(Re-Exam\)/g, '').replace(/\s*\(Main\)/g, '').trim();
      if (isRe) {
        return `${cleanName} (${cleanDate}, Re)`;
      } else {
        return `${cleanName} (${cleanDate})`;
      }
    }

    function populateExamDropdowns() {
      const allQs = getAllQuestions();
      const examCounts = {};
      const examDates = {};
      const examYears = {};

      allQs.forEach(q => {
        examCounts[q.exam] = (examCounts[q.exam] || 0) + 1;
        if (!examDates[q.exam] && q.date) examDates[q.exam] = q.date;
        if (!examYears[q.exam] && q.year) examYears[q.exam] = q.year;
      });

      const allExamsList = getAllExams();
      allExamsList.forEach(ex => {
        if (!examDates[ex.name] && ex.date) examDates[ex.name] = ex.date;
        if (!examYears[ex.name] && ex.year) examYears[ex.name] = ex.year;
      });

      // Include ONLY exams that have questions in the database
      const examNames = Object.keys(examCounts).filter(en => (examCounts[en] || 0) > 0);

      // Sort exam names by Year descending, then display name
      examNames.sort((a, b) => {
        const yrA = String(examYears[a] || '2025');
        const yrB = String(examYears[b] || '2025');
        if (yrB !== yrA) return yrB.localeCompare(yrA);
        return a.localeCompare(b);
      });

      const examFilter = document.getElementById("examFilter");
      if (examFilter) {
        const currentVal = examFilter.value || "ALL";
        let opts = `<option value="ALL">All BPSC Exams (${allQs.length} Qs)</option>`;
        
        let curYearGroup = "";
        examNames.forEach(name => {
          const c = examCounts[name] || 0;
          if (c === 0) return; // Strict guard: never render 0-Q exams
          const dt = examDates[name] || "";
          const yr = examYears[name] || "2025";
          const formattedTitle = formatUserExamTitle(name, dt);

          if (yr !== curYearGroup) {
            if (curYearGroup !== "") opts += `</optgroup>`;
            curYearGroup = yr;
            opts += `<optgroup label="── ${yr} Exams ──">`;
          }
          opts += `<option value="${escapeHtml(name)}">${escapeHtml(formattedTitle)} — ${c} Qs</option>`;
        });
        if (curYearGroup !== "") opts += `</optgroup>`;

        examFilter.innerHTML = opts;
        if (examNames.includes(currentVal) || currentVal === "ALL") {
          examFilter.value = currentVal;
        }
      }

      const formExamSelect = document.getElementById("formExamSelect");
      if (formExamSelect) {
        const curFormVal = formExamSelect.value;
        let fOpts = "";
        examNames.forEach(name => {
          const dt = examDates[name] || "";
          const formattedTitle = formatUserExamTitle(name, dt);
          fOpts += `<option value="${escapeHtml(name)}">${escapeHtml(formattedTitle)}</option>`;
        });
        fOpts += `<option value="__NEW__">+ Create / Add a New or Older Year Exam...</option>`;
        formExamSelect.innerHTML = fOpts;
        if (curFormVal && (examNames.includes(curFormVal) || curFormVal === "__NEW__")) {
          formExamSelect.value = curFormVal;
        }
      }
    }

    function isMainsDescriptiveQuestion(item) {
      if (!item) return false;
      return item.type === "Mains" || item.ans === "Mains" || !Array.isArray(item.options) || item.options.length === 0;
    }

    function buildQuestionCardHtml(item, idx) {
      const displayIndex = (typeof idx === 'number' && !isNaN(idx)) ? (idx + 1) : 1;
      const subjBadgeClass = SUBJECT_COLORS[item.subject] || "bg-slate-100 text-slate-800 border-slate-200";
      const isBookmarked = !!bookmarkedIds[item.id];
      const isMains = isMainsDescriptiveQuestion(item);
      const reg = (typeof loadMistakeRegister === 'function') ? loadMistakeRegister() : {};
      const mistakeEntry = reg[item.id];
      const inMistakeView = (selectedType === "MISTAKES");
      const userChoice = (inMistakeView && isMistakeRetryMode) ? (mistakeRetryAttempts[item.id] || null) : userAttempts[item.id];
      const isAttempted = !!userChoice;
      const revealAnswer = showAllAnswers || isAttempted;
      const isGlobalHi = (typeof ShaktiQBilingualEngine !== 'undefined' && ShaktiQBilingualEngine.currentLang === 'hi');

      // Check if this question has a cached Hindi translation with all options
      const cachedBundle = (typeof ShaktiQBilingualEngine !== 'undefined') ? ShaktiQBilingualEngine.getCachedQuestion(item.id || item.q) : null;
      const reqOptCount = (item.options || []).length;
      const useHindi = isGlobalHi && cachedBundle && Array.isArray(cachedBundle.options) && cachedBundle.options.length >= reqOptCount;

      const displayQText = cleanQuestionStem(useHindi ? cachedBundle.q : item.q);
      const displayOptions = (useHindi ? (cachedBundle.options || item.options) : (item.options || [])).map((opt, i) => formatBilingualOption(opt, i, useHindi));
      const displayExp = useHindi ? (cachedBundle.exp || item.exp) : item.exp;

      let optionsHtml = "";
      let answerBoxHtml = "";

      if (isMains) {
        // Descriptive Mains Question Card
        optionsHtml = `
          <div class="mt-3.5 p-3.5 rounded-xl bg-[#FEF6D6]/60 border border-[#F5DF8B] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#785600]">
            <div class="flex items-center gap-2 font-semibold">
              <span class="px-2 py-0.5 rounded bg-[#785600] text-white font-bold text-[10px] uppercase tracking-wider">Descriptive Mains</span>
              <span>Format / Weightage: <strong>${escapeHtml(item.ansText || 'Descriptive Mains Essay / Long Answer')}</strong> • <em>Excluded from MCQ Negative Marking</em></span>
            </div>
            <button type="button" data-toggle-ans="${escapeHtml(item.id)}" class="px-3 py-1.5 rounded-lg bg-[#10402D] text-white font-bold text-xs hover:bg-[#17593F] transition shrink-0 cursor-pointer">
              ${showAllAnswers ? 'Hide Model Answer' : 'View Model Answer & Structure'}
            </button>
          </div>
        `;

        answerBoxHtml = `
          <div id="ansbox-${escapeHtml(item.id)}" class="${showAllAnswers ? '' : 'hidden'} mt-3.5 pt-3 border-t border-[#C5DEC0] bg-[#ECF6E7] rounded-xl p-4 text-xs sm:text-sm space-y-2 text-[#111C15]">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span class="font-extrabold text-[#111C15]">Paper Structure & Marks:</span>
                <span class="font-bold text-[#10402D] ml-1">${escapeHtml(item.ansText || 'BPSC Mains Descriptive Paper')}</span>
              </div>
            </div>
            <div class="text-[#1E2D23] leading-relaxed">
              <span class="font-bold text-[#10402D]">Model Answer & Evaluation Framework:</span> ${escapeHtml(displayExp)}
            </div>
          </div>
        `;
      } else {
        // Standard Objective MCQ Card
        optionsHtml = `<div id="pyq-opts-${escapeHtml(item.id)}" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3.5">`;
        displayOptions.forEach((optText, oIdx) => {
          const letters = ["A", "B", "C", "D", "E"];
          const letter = letters[oIdx] || "A";
          let stateClass = "bg-[#F8FAF7] border-[#DCE6DF] text-[#111C15]";

          if (userChoice) {
            if (letter === item.ans) {
              stateClass = "option-correct";
            } else if (letter === userChoice && userChoice !== item.ans) {
              stateClass = "option-wrong";
            }
          } else if (showAllAnswers && letter === item.ans) {
            stateClass = "option-correct";
          }

          optionsHtml += `<button type="button" data-qid="${escapeHtml(item.id)}" data-opt="${letter}" class="option-btn text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${stateClass} flex items-start justify-between gap-2 cursor-pointer">
            <span>${escapeHtml(optText)}</span>
            ${(revealAnswer && letter === item.ans) ? '<span class="text-emerald-700 font-extrabold shrink-0">✓</span>' : ''}
          </button>`;
        });
        optionsHtml += `</div>`;

        answerBoxHtml = `${!revealAnswer ? `<div class="mt-2.5 text-xs font-semibold text-[#36443A] italic bg-[#F8FAF7] border border-dashed border-[#DCE6DF] rounded-xl px-3 py-2 flex items-center justify-between"><span>💡 Select an option above to test yourself and unlock the solution &amp; explanation</span><button type="button" data-toggle-ans="${escapeHtml(item.id)}" class="text-xs font-bold text-[#10402D] hover:underline cursor-pointer">Reveal Key Directly</button></div>` : ''}
        <div id="ansbox-${escapeHtml(item.id)}" class="${revealAnswer ? '' : 'hidden'} mt-3.5 pt-3 border-t border-[#C5DEC0] bg-[#ECF6E7] rounded-xl p-4 text-xs sm:text-sm space-y-1.5 text-[#111C15]">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span class="font-extrabold text-[#111C15]">Published Key / Answer:</span>
              <span class="font-bold text-[#10402D] ml-1">${escapeHtml(item.ansText)}</span>
            </div>
          </div>
          <div class="text-[#1E2D23] leading-relaxed">
            <span class="font-bold text-[#10402D]">Decoded Explanation:</span> ${escapeHtml(displayExp)}
          </div>
        </div>`;
      }

      const langToggleLabel = useHindi ? 'English' : 'हिन्दी';

      return `<article class="question-card bg-white rounded-2xl shadow-sm border border-[#DCE6DF] p-4 sm:p-6 transition hover:border-[#10402D] text-[#111C15]">
        <!-- Top Metadata Badges: Uniform Dark Green Background with White Text -->
        <div class="flex items-center justify-between gap-2 flex-wrap mb-2.5">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#10402D] text-white border border-[#17593F] shadow-2xs">${escapeHtml(item.subject)}</span>
            <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#10402D] text-white border border-[#17593F] shadow-2xs">${escapeHtml(item.exam)}</span>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#10402D] text-white border border-[#17593F] shadow-2xs">📅 ${escapeHtml(item.date)} (${escapeHtml(item.year)})</span>
            <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#10402D] text-white border border-[#17593F] shadow-2xs">${isMains ? 'Descriptive Mains' : escapeHtml(item.type)}</span>
            ${item.custom ? '<span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#0A2E20] text-emerald-200 border border-[#17593F]">Custom Added</span>' : ''}
            ${mistakeEntry ? `
              <span class="text-xs font-bold px-2.5 py-1 rounded-lg ${mistakeEntry.consecutiveCorrect === 1 ? 'bg-[#FEF6D6] text-[#785600] border border-[#F5DF8B]' : 'bg-[#FFF5F5] text-rose-800 border border-rose-300'} flex items-center gap-1 shadow-2xs">
                <span>${mistakeEntry.consecutiveCorrect === 1 ? '⚡ 1/2 Correct (Needs 1 more to clear)' : '❌ Mistake Register (' + (mistakeEntry.wrongCount || 1) + ' wrong)'}</span>
              </span>
            ` : ''}
            ${isAttempted ? `
              <span class="text-xs font-bold px-2.5 py-1 rounded-lg ${userChoice === item.ans ? 'bg-[#EBF3E6] text-[#10402D] border border-[#C6DEC0]' : 'bg-[#FEF6D6] text-[#785600] border border-[#F5DF8B]'} flex items-center gap-1 shadow-2xs">
                <i data-lucide="${userChoice === item.ans ? 'check-circle' : 'alert-circle'}" class="w-3.5 h-3.5"></i>
                <span>Previously Attempted (Selected ${userChoice}) • ${userChoice === item.ans ? 'Correct' : 'Needs Review'}</span>
              </span>
            ` : ''}
          </div>

          <div class="flex items-center gap-1.5 no-print flex-wrap">
            <!-- 1-Tap Bilingual Toggle for this Question -->
            <button type="button" onclick="togglePyqCardLang('${escapeHtml(item.id)}')" id="btn-lang-${escapeHtml(item.id)}" title="Switch Language / भाषा बदलें" class="text-xs font-bold px-2.5 py-1 rounded-lg border border-[#C6DEC0] bg-[#EBF3E6] text-[#10402D] hover:bg-[#DCE9D5] transition cursor-pointer flex items-center gap-1">
              <i data-lucide="languages" class="w-3.5 h-3.5"></i>
              <span>${langToggleLabel}</span>
            </button>
            <button type="button" data-toggle-ans="${escapeHtml(item.id)}" class="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer">
              ${(isMains ? showAllAnswers : revealAnswer) ? (isMains ? 'Hide Model Answer' : 'Hide Key') : (isMains ? 'Show Model Answer' : 'Show Key')}
            </button>
            <button type="button" data-bookmark="${escapeHtml(item.id)}" title="Bookmark Question" class="text-xs font-bold px-2.5 py-1 rounded-lg border ${isBookmarked ? 'bg-amber-100 border-amber-300 text-amber-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'} transition cursor-pointer">
              ${isBookmarked ? '★ Saved' : '☆ Save'}
            </button>
            <button type="button" data-copy="${escapeHtml(item.id)}" title="Copy Question & Answer" class="text-xs font-medium px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer">
              Copy
            </button>
            ${item.custom ? `
              <button type="button" data-edit="${escapeHtml(item.id)}" class="text-xs font-semibold px-2 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer">Edit</button>
              <button type="button" data-delete="${escapeHtml(item.id)}" class="text-xs font-semibold px-2 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer">Delete</button>
            ` : ''}
          </div>
        </div>

        <!-- Question Text -->
        <h3 class="text-sm sm:text-base font-semibold text-[#111C15] leading-relaxed">
          <span class="font-extrabold text-[#10402D] mr-1.5 shrink-0">${displayIndex}. </span><span id="pyq-qtext-${escapeHtml(item.id)}" data-lang="${useHindi ? 'hi' : 'en'}">${renderFormattedQuestionHtml(displayQText)}</span>
        </h3>

        ${optionsHtml}
        ${answerBoxHtml}
      </article>`;
    }

    function togglePyqCardLang(qid) {
      const allQ = (typeof getAllQuestions === 'function') ? getAllQuestions() : [];
      const q = allQ.find(x => x.id === qid);
      if (!q) return;

      const qTextEl = document.getElementById('pyq-qtext-' + qid);
      const btn = document.getElementById('btn-lang-' + qid);
      if (!qTextEl) return;

      const isCurrentHi = (qTextEl.getAttribute('data-lang') === 'hi');
      if (isCurrentHi) {
        // Switch back to English
        qTextEl.innerHTML = renderFormattedQuestionHtml(cleanQuestionStem(q.q));
        qTextEl.setAttribute('data-lang', 'en');
        if (btn) btn.innerHTML = '<i data-lucide="languages" class="w-3.5 h-3.5"></i> <span>हिन्दी</span>';
        renderPyqCardOptions(qid, q, (q.options || []).map((o, i) => formatBilingualOption(o, i, false)), false);
        initIcons();
      } else {
        // Switch to Hindi
        const cached = ShaktiQBilingualEngine.getCachedQuestion(qid || q.q);
        const reqCount = (q.options || []).length;
        if (cached && Array.isArray(cached.options) && cached.options.length >= reqCount) {
          qTextEl.innerHTML = renderFormattedQuestionHtml(cleanQuestionStem(cached.q));
          qTextEl.setAttribute('data-lang', 'hi');
          if (btn) btn.innerHTML = '<i data-lucide="languages" class="w-3.5 h-3.5"></i> <span>English</span>';
          renderPyqCardOptions(qid, q, cached.options.map((o, i) => formatBilingualOption(o, i, true)), true);
          initIcons();
        } else {
          if (btn) btn.innerHTML = '<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> <span>अनुवाद...</span>';
          initIcons();
          ShaktiQBilingualEngine.translateQuestionBundle(qid || q.q, q.q, q.options || [], q.exp || '').then(bundle => {
            qTextEl.innerHTML = renderFormattedQuestionHtml(cleanQuestionStem(bundle.q));
            qTextEl.setAttribute('data-lang', 'hi');
            if (btn) btn.innerHTML = '<i data-lucide="languages" class="w-3.5 h-3.5"></i> <span>English</span>';
            renderPyqCardOptions(qid, q, (bundle.options || []).map((o, i) => formatBilingualOption(o, i, true)), true);
            initIcons();
          });
        }
      }
    }

    function renderPyqCardOptions(qid, q, optionsArray, isHi) {
      const container = document.getElementById('pyq-opts-' + qid);
      if (!container) return;
      const userChoice = userAttempts[qid];
      const isAttempted = !!userChoice;
      const revealAnswer = showAllAnswers || isAttempted;

      let html = '';
      (optionsArray || []).forEach((optText, oIdx) => {
        const letters = ["A", "B", "C", "D", "E"];
        const letter = letters[oIdx] || "A";
        const formattedOpt = formatBilingualOption(optText, oIdx, isHi);
        let stateClass = "bg-[#F8FAF7] border-[#DCE6DF] text-[#111C15]";

        if (userChoice) {
          if (letter === q.ans) {
            stateClass = "option-correct";
          } else if (letter === userChoice && userChoice !== q.ans) {
            stateClass = "option-wrong";
          }
        } else if (showAllAnswers && letter === q.ans) {
          stateClass = "option-correct";
        }

        html += `<button type="button" data-qid="${escapeHtml(qid)}" data-opt="${letter}" class="option-btn text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${stateClass} flex items-start justify-between gap-2 cursor-pointer">
          <span>${escapeHtml(formattedOpt)}</span>
          ${(revealAnswer && letter === q.ans) ? '<span class="text-emerald-700 font-extrabold shrink-0">✓</span>' : ''}
        </button>`;
      });
      container.innerHTML = html;
      attachQuestionCardListeners();
    }

    function renderQuestions() {
      const filtered = getFilteredQuestions();
      const countLabel = document.getElementById("filteredCountLabel");
      if (countLabel) countLabel.textContent = filtered.length;

      const summaryEl = document.getElementById("activeFilterSummary");
      if (summaryEl) {
        const parts = [];
        if (selectedSubject !== "ALL") parts.push(`Subject: ${selectedSubject}`);
        if (selectedYear !== "ALL") parts.push(`Year: ${selectedYear}`);
        if (selectedExam !== "ALL") parts.push(`Exam: ${typeof formatUserExamTitle === "function" ? formatUserExamTitle(selectedExam, (getAllQuestions().find(q => q.exam === selectedExam) || {}).date) : selectedExam}`);
        if (selectedType !== "ALL") parts.push(`Filter: ${selectedType}`);
        if (searchQuery.trim()) parts.push(`Search: "${searchQuery.trim()}"`);
        summaryEl.textContent = parts.length ? `(${parts.join(" • ")})` : "(All 2023–2026 BPSC Exams)";
      }

      const container = document.getElementById("questionsContainer");
      const jumpBar = document.getElementById("subjectJumpBar");
      const jumpLinks = document.getElementById("subjectJumpLinks");
      const loadMoreWrapper = document.getElementById("loadMoreWrapper");

      if (!container) return;

      if (!questionsLoaded) {
        container.innerHTML = `<div class="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div class="inline-block w-8 h-8 border-3 border-[#0A3826] border-t-transparent rounded-full animate-spin"></div>
          <div class="text-sm font-semibold text-slate-800">Loading question bank database...</div>
          <p class="text-xs text-slate-500">Retrieving 2,800+ BPSC PYQs based on published answer keys.</p>
        </div>`;
        return;
      }

      const isHiLang = (typeof ShaktiQBilingualEngine !== 'undefined' && ShaktiQBilingualEngine.currentLang === 'hi');

      if (filtered.length === 0) {
        if (selectedType === "MISTAKES") {
          container.innerHTML = `<div class="bg-white rounded-3xl border border-[#DCE6DF] p-10 text-center space-y-4 max-w-lg mx-auto shadow-sm my-6 scroll-mt-32">
            <div class="w-16 h-16 rounded-full bg-[#EBF3E6] text-[#10402D] flex items-center justify-center text-3xl mx-auto shadow-xs">🎯</div>
            <div class="text-xl font-extrabold text-[#111C15]">${isHiLang ? 'शानदार! कोई गलत प्रश्न नहीं है' : 'Clean Slate! Your Mistake Register is empty'}</div>
            <p class="text-sm text-[#526056] leading-relaxed">
              ${isHiLang ? 'शानदार! आपके पास अभी कोई अनसुलझी गलतियाँ नहीं हैं। PYQ अभ्यास या मॉक टेस्ट के दौरान आपके द्वारा गलत उत्तर दिए गए प्रश्न यहाँ दिखाई देंगे, जब तक कि आप उन्हें लगातार दो बार सही हल नहीं कर लेते।' : 'Outstanding! You have no unresolved mistakes right now. Any questions you answer incorrectly during PYQ practice or mock tests will automatically appear here until you solve them correctly twice in a row.'}
            </p>
            <div class="pt-2 flex justify-center gap-3">
              <button type="button" onclick="resetAllFilters()" class="bg-[#10402D] hover:bg-[#17593F] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer">${isHiLang ? 'सभी प्रश्न देखें' : 'Browse All Questions'}</button>
            </div>
          </div>`;
          if (jumpBar) jumpBar.classList.add("hidden");
          if (loadMoreWrapper) loadMoreWrapper.classList.add("hidden");
          return;
        }

        container.innerHTML = `<div class="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div class="text-lg font-bold text-slate-800">No questions match your current filters</div>
          <p class="text-xs sm:text-sm text-slate-500">Try clearing your search query, switching the Subject/Year filter, or adding a new question to this category.</p>
          <div class="pt-2 flex justify-center gap-3">
            <button type="button" id="emptyResetBtn" class="bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-xl">Reset Filters</button>
            ${isAdminMode() ? '<button type="button" id="emptyAddBtn" class="bg-amber-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl">+ Add Question Here</button>' : ''}
          </div>
        </div>`;
        if (jumpBar) jumpBar.classList.add("hidden");
        if (loadMoreWrapper) loadMoreWrapper.classList.add("hidden");
        const emptyResetBtn = document.getElementById("emptyResetBtn");
        if (emptyResetBtn) emptyResetBtn.addEventListener("click", resetAllFilters);
        const emptyAddBtn = document.getElementById("emptyAddBtn");
        if (emptyAddBtn) emptyAddBtn.addEventListener("click", () => switchView("manage"));
        return;
      }

      let mistakeBannerHtml = "";
      if (selectedType === "MISTAKES") {
        mistakeBannerHtml = `<div id="mistakeRegisterBanner" class="p-4 rounded-2xl bg-[#FFF5F5] border border-rose-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 scroll-mt-32">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 font-extrabold flex items-center justify-center text-lg shrink-0">🎯</div>
            <div>
              <div class="text-sm font-extrabold text-[#111C15] flex items-center gap-2">
                <span>${isHiLang ? 'मेरी भूल सुधार पुस्तिका (Mistake Register)' : 'My Mistake Register'}</span>
                <span id="mistakeBannerCount" class="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">${filtered.length} ${isHiLang ? 'प्रश्न' : (filtered.length === 1 ? 'question' : 'questions')}</span>
              </div>
              <div class="text-xs text-[#526056] mt-0.5">
                ${isHiLang ? 'नियम: किसी प्रश्न को <strong>लगातार 2 बार सही (2/2)</strong> हल करने पर वह यहाँ से हट जाता है।' : 'Mastery rule: A question leaves this register after being answered <strong>correctly twice in a row (2/2)</strong>.'}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <label class="inline-flex items-center gap-2 text-xs font-bold text-[#111C15] bg-white px-3.5 py-2 rounded-xl border border-[#DCE6DF] shadow-2xs cursor-pointer hover:bg-slate-50 transition">
              <input type="checkbox" id="mistakeRetryModeToggle" ${isMistakeRetryMode ? 'checked' : ''} onchange="toggleMistakeRetryMode(this.checked)" class="rounded text-[#10402D] focus:ring-emerald-700">
              <span>${isHiLang ? '🔄 पुनः प्रयास मोड (उत्तर छिपाएं और अभ्यास करें)' : '🔄 Retry Mode (Hide past answers & re-test)'}</span>
            </label>
            <button type="button" onclick="clearMistakeAttemptsForRetry()" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-rose-800 hover:bg-rose-50 border border-rose-200 transition cursor-pointer shadow-2xs">
              ${isHiLang ? 'सत्र रीसेट करें' : 'Reset Retry Session'}
            </button>
          </div>
        </div>`;
      }

      const sliced = filtered.slice(0, displayLimit);

      if (groupBySubject && selectedSubject === "ALL") {
        // Group all filtered questions by subject order
        const bySubj = {};
        SUBJECT_ORDER.forEach(s => { bySubj[s] = []; });
        filtered.forEach(q => {
          if (!bySubj[q.subject]) bySubj[q.subject] = [];
          bySubj[q.subject].push(q);
        });

        let jumpHtml = "";
        let sectionsHtml = "";
        let renderedSoFar = 0;

        SUBJECT_ORDER.forEach((subj, sIdx) => {
          const list = bySubj[subj] || [];
          if (list.length === 0) return;
          const secId = "sec-subj-" + subj.toLowerCase().replace(/[^a-z0-9]/g, "-");
          jumpHtml += `<button type="button" data-scroll-to="${secId}" class="px-3 py-1 rounded-xl bg-white hover:bg-[#10402D] hover:text-white text-[#223127] border border-[#DCE6DF] font-semibold transition whitespace-nowrap cursor-pointer">
            ${escapeHtml(subj)} (${list.length})
          </button>`;

          if (renderedSoFar >= displayLimit) return;
          const availableForThisSubj = list.slice(0, Math.max(0, displayLimit - renderedSoFar));
          renderedSoFar += availableForThisSubj.length;

          sectionsHtml += `<div id="${secId}" class="space-y-3.5 pt-2">
            <div class="bg-[#ECF6E7] border-l-4 border-[#10402D] border border-[#C5DEC0] text-[#111C15] px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-sm">
              <div class="flex items-center gap-2.5">
                <span class="w-7 h-7 rounded-lg bg-[#10402D] text-white font-extrabold text-xs flex items-center justify-center">${sIdx + 1}</span>
                <h2 class="text-base sm:text-lg font-display font-extrabold tracking-tight text-[#111C15]">${escapeHtml(subj)}</h2>
              </div>
              <span class="text-xs font-bold text-[#10402D] bg-white border border-[#C5DEC0] px-3 py-1 rounded-full">${list.length} Questions in ${escapeHtml(subj)}</span>
            </div>
            <div class="space-y-3.5">
              ${availableForThisSubj.map((item, i) => buildQuestionCardHtml(item, i)).join("")}
            </div>
          </div>`;
        });

        if (jumpBar && jumpLinks) {
          jumpBar.classList.remove("hidden");
          jumpLinks.innerHTML = jumpHtml;
          jumpLinks.querySelectorAll("[data-scroll-to]").forEach(btn => {
            btn.addEventListener("click", () => {
              const targetId = btn.getAttribute("data-scroll-to");
              // Ensure all questions are loaded if jumping to a later subject section
              if (displayLimit < filtered.length) {
                displayLimit = filtered.length;
                renderQuestions();
              }
              setTimeout(() => {
                const targetEl = document.getElementById(targetId);
                if (targetEl) targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 50);
            });
          });
        }
        container.innerHTML = mistakeBannerHtml + sectionsHtml;
      } else {
        if (jumpBar) jumpBar.classList.add("hidden");
        container.innerHTML = mistakeBannerHtml + `<div class="space-y-3.5">${sliced.map((item, i) => buildQuestionCardHtml(item, i)).join("")}</div>`;
      }

      if (loadMoreWrapper) {
        if (displayLimit < filtered.length) {
          loadMoreWrapper.classList.remove("hidden");
          const loadMoreBtn = document.getElementById("loadMoreBtn");
          if (loadMoreBtn) {
            loadMoreBtn.textContent = `Show Next 60 Questions (${filtered.length - displayLimit} remaining)`;
          }
        } else {
          loadMoreWrapper.classList.add("hidden");
        }
      }

      attachQuestionCardListeners();
    }

    function attachQuestionCardListeners() {
      const container = document.getElementById("questionsContainer");
      if (!container) return;

      // Option click (interactive practice — strictly gated behind Sign-In)
      container.querySelectorAll(".option-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          requireAspirant((aspirant) => {
            const qid = btn.getAttribute("data-qid");
            const opt = btn.getAttribute("data-opt");
            userAttempts[qid] = opt;
            saveStudentPracticeAttempt(qid, opt);
            if (selectedType === "MISTAKES" && isMistakeRetryMode) {
              mistakeRetryAttempts[qid] = opt;
            }
            if (typeof handlePracticeMistakeRegister === "function") {
              handlePracticeMistakeRegister(qid, opt);
            }
            updateSubjectProgressUI();
            logPyqInteraction(aspirant, qid, opt);
            renderQuestions();
            updatePracticeScorecard();
            if (typeof updateAbhyasUI === "function") updateAbhyasUI();
          }, "Please sign in with your profile to attempt PYQ questions and track your accuracy.");
        });
      });

      // Toggle individual answer key / model answer (strictly gated behind Sign-In)
      container.querySelectorAll("[data-toggle-ans]").forEach(btn => {
        btn.addEventListener("click", () => {
          requireAspirant(() => {
            const qid = btn.getAttribute("data-toggle-ans");
            const item = getAllQuestions().find(x => x.id === qid);
            const isMains = isMainsDescriptiveQuestion(item);
            const box = document.getElementById("ansbox-" + qid);
            if (box) {
              const isHidden = box.classList.contains("hidden");
              if (isHidden) {
                box.classList.remove("hidden");
                btn.textContent = isMains ? "Hide Model Answer" : "Hide Key";
              } else {
                box.classList.add("hidden");
                btn.textContent = isMains ? "Show Model Answer" : "Show Key";
              }
            }
          }, "Please sign in to view solutions & explanations based on published answer keys.");
        });
      });

      // Bookmark toggle
      container.querySelectorAll("[data-bookmark]").forEach(btn => {
        btn.addEventListener("click", () => {
          const qid = btn.getAttribute("data-bookmark");
          if (bookmarkedIds[qid]) {
            delete bookmarkedIds[qid];
            showToast("Removed from saved bookmarks", "☆");
          } else {
            bookmarkedIds[qid] = true;
            showToast("Question bookmarked for revision!", "★");
          }
          saveBookmarks();
          renderQuestions();
        });
      });

      // Copy question
      container.querySelectorAll("[data-copy]").forEach(btn => {
        btn.addEventListener("click", () => {
          const qid = btn.getAttribute("data-copy");
          const item = getAllQuestions().find(x => x.id === qid);
          if (!item) return;
          const text = `[${item.exam} | ${item.date} | ${item.subject}] ${item.qno}. ${item.q}\n${(item.options || []).join("\n")}\nAnswer: ${item.ansText}\nExplanation: ${item.exp}`;
          copyTextSafe(text);
          showToast("Question & explanation copied to clipboard!");
        });
      });

      // Edit custom question
      container.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => {
          const qid = btn.getAttribute("data-edit");
          startEditCustomQuestion(qid);
        });
      });

      // Delete custom question
      container.querySelectorAll("[data-delete]").forEach(btn => {
        btn.addEventListener("click", () => {
          const qid = btn.getAttribute("data-delete");
          customQuestions = customQuestions.filter(x => x.id !== qid);
          saveCustomQuestions();
          updateHeaderCounters();
          renderSubjectPills();
          populateExamDropdowns();
          renderQuestions();
          showToast("Custom question deleted.");
        });
      });
    }

    function copyTextSafe(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    }

    function fallbackCopy(text) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }

    function renderExamDirectoryAndStats() {
      const allQs = getAllQuestions();
      const subjCounts = {};
      SUBJECT_ORDER.forEach(s => { subjCounts[s] = { total: 0, y2025: 0, y2026: 0 }; });
      allQs.forEach(q => {
        if (!subjCounts[q.subject]) subjCounts[q.subject] = { total: 0, y2025: 0, y2026: 0 };
        subjCounts[q.subject].total += 1;
        if (q.year === "2025") subjCounts[q.subject].y2025 += 1;
        if (q.year === "2026") subjCounts[q.subject].y2026 += 1;
      });

      const grid = document.getElementById("subjectStatsGrid");
      if (grid) {
        grid.innerHTML = SUBJECT_ORDER.map(subj => {
          const st = subjCounts[subj] || { total: 0, y2025: 0, y2026: 0 };
          const badgeClass = SUBJECT_COLORS[subj] || "bg-slate-100 text-slate-800";
          return `<div class="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-md transition flex flex-col justify-between">
            <div>
              <span class="text-xs font-extrabold px-2.5 py-1 rounded-lg border ${badgeClass}">${escapeHtml(subj)}</span>
              <div class="text-2xl font-extrabold text-slate-900 mt-2.5">${st.total} <span class="text-xs font-medium text-slate-500">Questions</span></div>
              <div class="text-xs text-slate-500 mt-1">2025: <strong>${st.y2025}</strong> • 2026: <strong>${st.y2026}</strong></div>
            </div>
            <button type="button" data-jump-subject="${escapeHtml(subj)}" class="mt-3 text-xs font-bold text-emerald-800 hover:underline text-left">
              Open ${escapeHtml(subj)} Questions →
            </button>
          </div>`;
        }).join("");

        grid.querySelectorAll("[data-jump-subject]").forEach(btn => {
          btn.addEventListener("click", () => {
            selectedSubject = btn.getAttribute("data-jump-subject");
            displayLimit = 100;
            switchView("bank");
            renderSubjectPills();
            renderQuestions();
          });
        });
      }

      // Render Exam Directory Table
      const examCounts = {};
      allQs.forEach(q => {
        examCounts[q.exam] = (examCounts[q.exam] || 0) + 1;
      });

      const tbody = document.getElementById("examDirectoryTableBody");
      if (tbody) {
        const allEx = getAllExams();
        tbody.innerHTML = allEx.map(ex => {
          const qCount = examCounts[ex.name] || 0;
          return `<tr class="hover:bg-slate-50">
            <td class="py-3 px-3 font-bold text-slate-900">
              <a href="${escapeHtml(ex.url || 'https://bpsc.bihar.gov.in/')}" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-700 hover:underline">${escapeHtml(typeof formatUserExamTitle === "function" ? formatUserExamTitle(ex.name, ex.date) : ex.name)} ↗</a>
              <div class="text-[11px] font-normal text-slate-400">Internal Key: ${escapeHtml(ex.name)}</div>
            </td>
            <td class="py-3 px-3 text-slate-600">${escapeHtml(ex.advt || '—')}</td>
            <td class="py-3 px-3 text-slate-700 font-medium">${escapeHtml(ex.date)} (${escapeHtml(ex.year)})</td>
            <td class="py-3 px-3 text-slate-600">${escapeHtml(ex.type)}</td>
            <td class="py-3 px-3">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold ${qCount > 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}">
                ${qCount} Questions
              </span>
            </td>
            <td class="py-3 px-3 space-x-2 whitespace-nowrap">
              <button type="button" data-filter-exam="${escapeHtml(ex.name)}" class="text-xs font-bold text-emerald-800 hover:underline">View Questions</button>
              <button type="button" data-add-to-exam="${escapeHtml(ex.name)}" data-exam-year="${escapeHtml(ex.year)}" data-exam-date="${escapeHtml(ex.date)}" class="text-xs font-bold text-amber-700 hover:underline">+ Add Question</button>
            </td>
          </tr>`;
        }).join("");

        tbody.querySelectorAll("[data-filter-exam]").forEach(btn => {
          btn.addEventListener("click", () => {
            selectedExam = btn.getAttribute("data-filter-exam");
            selectedSubject = "ALL";
            selectedYear = "ALL";
            displayLimit = 99999;
            populateExamDropdowns();
            const examFilter = document.getElementById("examFilter");
            if (examFilter) examFilter.value = selectedExam;
            switchView("bank");
            renderSubjectPills();
            renderQuestions();
          });
        });

        tbody.querySelectorAll("[data-add-to-exam]").forEach(btn => {
          btn.addEventListener("click", () => {
            const exName = btn.getAttribute("data-add-to-exam");
            const exYear = btn.getAttribute("data-exam-year");
            const exDate = btn.getAttribute("data-exam-date");
            switchView("manage");
            const sel = document.getElementById("formExamSelect");
            if (sel) sel.value = exName;
            const yrIn = document.getElementById("formYear");
            if (yrIn && exYear) yrIn.value = exYear;
            const dtIn = document.getElementById("formDate");
            if (dtIn && exDate) dtIn.value = exDate;
          });
        });
      }
    }

    function startEditCustomQuestion(qid) {
      const item = customQuestions.find(x => x.id === qid);
      if (!item) return;
      switchView("manage");
      document.getElementById("editQuestionId").value = item.id;
      document.getElementById("formHeadingTitle").textContent = "Edit Custom Question (" + item.qno + ")";
      document.getElementById("cancelEditBtn").classList.remove("hidden");

      populateExamDropdowns();
      const sel = document.getElementById("formExamSelect");
      if (sel) sel.value = item.exam;
      document.getElementById("formQno").value = item.qno || "Q1";
      document.getElementById("formYear").value = item.year || "2026";
      document.getElementById("formDate").value = item.date || "2026";
      document.getElementById("formSubject").value = item.subject || "History";
      document.getElementById("formType").value = item.type || "MCQ";
      document.getElementById("formSourceUrl").value = item.sourceUrl || "";
      document.getElementById("formQuestionText").value = item.q || "";
      document.getElementById("formAnsText").value = item.ansText || "";
      document.getElementById("formExplanation").value = item.exp || "";

      if (item.options && item.options.length) {
        document.getElementById("formOptA").value = (item.options[0] || "").replace(/^\([A-E]\)\s*/, "");
        document.getElementById("formOptB").value = (item.options[1] || "").replace(/^\([A-E]\)\s*/, "");
        document.getElementById("formOptC").value = (item.options[2] || "").replace(/^\([A-E]\)\s*/, "");
        document.getElementById("formOptD").value = (item.options[3] || "").replace(/^\([A-E]\)\s*/, "");
        document.getElementById("formOptE").value = (item.options[4] || "").replace(/^\([A-E]\)\s*/, "");
      }
      if (item.ans && ["A", "B", "C", "D", "E"].includes(item.ans)) {
        document.getElementById("formCorrectOption").value = item.ans;
      }
    }

    function resetAddForm() {
      document.getElementById("editQuestionId").value = "";
      document.getElementById("formHeadingTitle").textContent = "Add New Exam Question or Older Year PYQ";
      document.getElementById("cancelEditBtn").classList.add("hidden");
      document.getElementById("formQuestionText").value = "";
      document.getElementById("formOptA").value = "";
      document.getElementById("formOptB").value = "";
      document.getElementById("formOptC").value = "";
      document.getElementById("formOptD").value = "";
      document.getElementById("formOptE").value = "";
      document.getElementById("formAnsText").value = "";
      document.getElementById("formExplanation").value = "";
    }

    function updatePracticeScorecard() {
      const allMap = {};
      getAllQuestions().forEach(q => { allMap[q.id] = q; });
      let attempted = 0;
      let correct = 0;
      let wrong = 0;

      Object.keys(userAttempts).forEach(qid => {
        const q = allMap[qid];
        if (!q || isMainsDescriptiveQuestion(q)) return;
        const choice = userAttempts[qid];
        if (choice === "E" && q.options && q.options[4] && q.options[4].toLowerCase().includes("not attempted")) {
          return;
        }
        attempted += 1;
        if (choice === q.ans) correct += 1;
        else wrong += 1;
      });

      const net = correct - (wrong / 3);
      document.getElementById("scoreAttempted").textContent = attempted;
      document.getElementById("scoreCorrect").textContent = correct;
      document.getElementById("scoreWrong").textContent = wrong;
      document.getElementById("scoreNet").textContent = net.toFixed(2);
    }

    function updateOptionECalculator() {
      const c = parseFloat(document.getElementById("calcCorrect").value) || 0;
      const w = parseFloat(document.getElementById("calcWrong").value) || 0;
      const e = parseFloat(document.getElementById("calcOptionE").value) || 0;
      const b = parseFloat(document.getElementById("calcBlank").value) || 0;

      const score = c - (w / 3) - (b / 3);
      document.getElementById("calcFormulaText").textContent = `${c} Right - (${w} Wrong × 1/3) - (${b} Blank × 1/3) [Option E: ${e} = 0 penalty]`;
      document.getElementById("calcFinalResult").textContent = score.toFixed(2);
    }

    function resetAllFilters() {
      selectedSubject = "ALL";
      selectedYear = "ALL";
      selectedExam = "ALL";
      selectedType = "ALL";
      searchQuery = "";
      displayLimit = 60;
      document.getElementById("searchInput").value = "";
      document.getElementById("clearSearchBtn").classList.add("hidden");
      document.getElementById("yearFilter").value = "ALL";
      document.getElementById("examFilter").value = "ALL";
      document.getElementById("typeFilter").value = "ALL";
      if (typeof updateYearPillsUI === "function") updateYearPillsUI();
      if (typeof updateMistakeCountBadge === "function") updateMistakeCountBadge();
      renderSubjectPills();
      renderQuestions();
    }

    function handleBulkPasteImport() {
      const raw = (document.getElementById("bulkPasteTextarea").value || "").trim();
      if (!raw) {
        showToast("Please paste questions or JSON array first.", "⚠");
        return;
      }
      const defaultExam = (document.getElementById("bulkExamName").value || "").trim() || "Custom BPSC Exam Paper";
      const defaultYear = (document.getElementById("bulkExamYear").value || "").trim() || "2026";
      const defaultDate = (document.getElementById("bulkExamDate").value || "").trim() || defaultYear;
      const defaultSubject = document.getElementById("bulkSubject").value || "History";

      let addedCount = 0;

      // Check if JSON array
      if (raw.startsWith("[") || raw.startsWith("{")) {
        try {
          const parsed = JSON.parse(raw);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          arr.forEach((obj, idx) => {
            if (!obj.q && !obj.question) return;
            customQuestions.push({
              id: "custom_" + Date.now() + "_" + idx,
              exam: obj.exam || defaultExam,
              date: obj.date || defaultDate,
              year: String(obj.year || defaultYear),
              qno: obj.qno || ("Q" + (customQuestions.length + 1)),
              type: obj.type || (obj.options && obj.options.length ? "MCQ" : "Mains"),
              subject: SUBJECT_ORDER.includes(obj.subject) ? obj.subject : defaultSubject,
              q: obj.q || obj.question,
              options: obj.options || [],
              ans: obj.ans || "A",
              ansText: obj.ansText || obj.answer || "See Explanation",
              exp: obj.exp || obj.explanation || "Added via Bulk Import.",
              sourceUrl: obj.sourceUrl || "https://bpsc.bihar.gov.in/",
              sourceTitle: obj.sourceTitle || (obj.exam || defaultExam),
              custom: true
            });
            addedCount += 1;
          });
        } catch (err) {
          showToast("Invalid JSON format. Trying plain-text block parser...", "⚠");
        }
      }

      if (addedCount === 0) {
        // Parse blocks separated by blank lines
        const blocks = raw.split(/\n\s*\n/);
        blocks.forEach((block, idx) => {
          const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
          if (lines.length === 0) return;

          let qLine = lines[0];
          let qnoMatch = qLine.match(/^(Q\d+|Question\s*\d+)[\.:\)\s]+(.*)$/i);
          let qno = qnoMatch ? qnoMatch[1].toUpperCase().replace(/\s+/g, "") : ("Q" + (customQuestions.length + 1));
          let qText = qnoMatch ? qnoMatch[2] : qLine;

          const opts = [];
          let ansLetter = "A";
          let ansText = "";
          let expText = "Added via Bulk Paste.";

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (/^\(?[A-E][\)\.]\s+/i.test(line)) {
              const letter = line.replace(/^\(?([A-E])[\)\.]\s+.*/i, "$1").toUpperCase();
              const cleanOpt = line.replace(/^\(?[A-E][\)\.]\s+/i, "").trim();
              opts.push(`(${letter}) ${cleanOpt}`);
            } else if (/^(Ans|Answer)\s*[:\-]/i.test(line)) {
              const val = line.replace(/^(Ans|Answer)\s*[:\-]\s*/i, "").trim();
              const m = val.match(/^\(?([A-E])\)?/i);
              if (m) ansLetter = m[1].toUpperCase();
              ansText = val;
            } else if (/^(Exp|Explanation)\s*[:\-]/i.test(line)) {
              expText = line.replace(/^(Exp|Explanation)\s*[:\-]\s*/i, "").trim();
            } else if (opts.length === 0 && !ansText) {
              qText += " " + line;
            }
          }

          if (!ansText && opts.length > 0) {
            const idxMap = { A: 0, B: 1, C: 2, D: 3, E: 4 };
            ansText = opts[idxMap[ansLetter] || 0] || ("(" + ansLetter + ")");
          }

          customQuestions.push({
            id: "custom_" + Date.now() + "_" + idx,
            exam: defaultExam,
            date: defaultDate,
            year: String(defaultYear),
            qno: qno,
            type: opts.length > 0 ? "MCQ" : "Mains",
            subject: defaultSubject,
            q: qText,
            options: opts,
            ans: opts.length > 0 ? ansLetter : "Mains",
            ansText: ansText || "Solved / Added Question",
            exp: expText,
            sourceUrl: "https://bpsc.bihar.gov.in/",
            sourceTitle: defaultExam,
            custom: true
          });
          addedCount += 1;
        });
      }

      if (addedCount > 0) {
        if (!getAllExams().some(e => e.name === defaultExam)) {
          customExams.push({
            name: defaultExam,
            advt: "Custom",
            date: defaultDate,
            year: String(defaultYear),
            type: "Custom Added Paper",
            status: "User Added",
            url: "https://bpsc.bihar.gov.in/"
          });
          saveCustomExams();
        }
        saveCustomQuestions();
        document.getElementById("bulkPasteTextarea").value = "";
        updateHeaderCounters();
        populateExamDropdowns();
        renderSubjectPills();
        renderQuestions();
        showToast(`Added ${addedCount} question(s) to ${defaultExam}!`);
      }
    }

    function downloadFile(filename, content, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

// Global exports for browser and node test runners
if (typeof window !== 'undefined') {
  window.INITIAL_QUESTIONS = INITIAL_QUESTIONS;
  window.questionsLoaded = questionsLoaded;
  window.SUBJECT_ORDER = SUBJECT_ORDER;
  window.SUBJECT_COLORS = SUBJECT_COLORS;
  window.INITIAL_EXAMS = INITIAL_EXAMS;
  window.getAspirantAuthToken = getAspirantAuthToken;
  window.requestSessionToken = requestSessionToken;
  window.loadQuestionsData = loadQuestionsData;
  window.toggleMistakesFilter = toggleMistakesFilter;
  window.toggleMistakeRetryMode = toggleMistakeRetryMode;
  window.clearMistakeAttemptsForRetry = clearMistakeAttemptsForRetry;
  window.updateMistakeCountBadge = updateMistakeCountBadge;
  window.loadStudentPracticeAttempts = loadStudentPracticeAttempts;
  window.saveStudentPracticeAttempt = saveStudentPracticeAttempt;
  window.loadStoredState = loadStoredState;
  window.saveCustomQuestions = saveCustomQuestions;
  window.saveBookmarks = saveBookmarks;
  window.saveCustomExams = saveCustomExams;
  window.getAllQuestions = getAllQuestions;
  window.getAllExams = getAllExams;
  window.showToastQb = showToastQb;
  window.escapeHtml = escapeHtml;
  window.formatQuestionText = formatQuestionText;
  window.renderFormattedQuestionHtml = renderFormattedQuestionHtml;
  window.isAdminMode = isAdminMode;
  window.updateAdminUI = updateAdminUI;
  window.switchView = switchView;
  window.getFilteredQuestions = getFilteredQuestions;
  window.updateHeaderCounters = updateHeaderCounters;
  window.renderSubjectPills = renderSubjectPills;
  window.setPracticeStatusFilter = setPracticeStatusFilter;
  window.updateSubjectProgressUI = updateSubjectProgressUI;
  window.toDdMmYyyy = toDdMmYyyy;
  window.formatUserExamTitle = formatUserExamTitle;
  window.populateExamDropdowns = populateExamDropdowns;
  window.isMainsDescriptiveQuestion = isMainsDescriptiveQuestion;
  window.buildQuestionCardHtml = buildQuestionCardHtml;
  window.togglePyqCardLang = togglePyqCardLang;
  window.renderPyqCardOptions = renderPyqCardOptions;
  window.renderQuestions = renderQuestions;
  window.attachQuestionCardListeners = attachQuestionCardListeners;
  window.copyTextSafe = copyTextSafe;
  window.fallbackCopy = fallbackCopy;
  window.renderExamDirectoryAndStats = renderExamDirectoryAndStats;
  window.startEditCustomQuestion = startEditCustomQuestion;
  window.resetAddForm = resetAddForm;
  window.updatePracticeScorecard = updatePracticeScorecard;
  window.updateOptionECalculator = updateOptionECalculator;
  window.resetAllFilters = resetAllFilters;
  window.handleBulkPasteImport = handleBulkPasteImport;
  window.downloadFile = downloadFile;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadQuestionsData,
    getAllQuestions,
    renderQuestions,
    renderSubjectPills,
    SUBJECT_ORDER,
    SUBJECT_COLORS,
    isAdminMode
  };
}
