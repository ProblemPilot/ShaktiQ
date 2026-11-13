/**
 * ShaktiQ Application Orchestration & Bootstrap Module
 * Modular Architecture (Feature 3.2)
 * Manages view routing, navigation, DPDP aspirant lead registration, Google Sheets sync & Service Worker
 */

// Unified Lucide Icons Initializer
        // Theme, Menu, Dropdowns & Toasts loaded from ./js/ui.js


    // ==========================================
    // FULL QUESTION BANK LOGIC & DATASET
        // QUESTION BANK & PRACTICE ENGINE loaded from ./js/question-bank.js



        
    
    // ==========================================
    // SHAKTIQ INTERACTIVE TOOLS (REVISION TABS, DAILY ABHYAS, SUN ATTACHMENT & CREATOR TOGGLE)
    // ==========================================
        // Revision tabs & Daily Abhyas loaded from ./js/ui.js


    // ==========================================
    // DISTINCT TEST SERIES vs PYQ BANK NAVIGATION (STRICTLY GATED BEHIND SIGN-IN)
    // ==========================================
    let currentAppMode = 'testseries'; // 'testseries' or 'pyq'

    function openTestSeriesMode() {
      const portal = document.getElementById('page-portal-view');
      const qb = document.getElementById('page-bpsc-pyq-view');
      const qbHeader = document.getElementById('qb-sticky-header');
      if (qbHeader) qbHeader.classList.remove('mock-hide-header-mobile');
      if (portal && qb) {
        portal.classList.add('hidden');
        qb.classList.remove('hidden');
        switchMainMode('testseries');
        safeScrollToTop();
        initIcons();
        try { history.pushState(null, null, '#test-series'); } catch(e){}
      }
      updatePageMeta({
        title: "22 Full-Length BPSC Mock Tests | ShaktiQ",
        description: "Attempt 22 full-length 150-question mock tests calibrated to exact BPSC pattern with 1/3 negative marking and Option E safe-skip rule.",
        url: "https://shaktiq.com/#test-series",
        image: "https://shaktiq.com/share-card.png"
      });
    }

    function openSpeedDrills() {
      const portal = document.getElementById('page-portal-view');
      const qb = document.getElementById('page-bpsc-pyq-view');
      const qbHeader = document.getElementById('qb-sticky-header');
      if (qbHeader) qbHeader.classList.remove('mock-hide-header-mobile');
      if (portal && qb) {
        portal.classList.add('hidden');
        qb.classList.remove('hidden');
        switchMainMode('testseries');
        if (typeof filterTestSeries === 'function') {
          filterTestSeries('SPEED_DRILLS');
        }
        safeScrollToTop();
        initIcons();
        try { history.pushState(null, null, '#speed-drills'); } catch(e){}
      }
      updatePageMeta({
        title: "10-Minute BPSC Speed Drills (15 Qs by Subject) | ShaktiQ",
        description: "Attempt rapid 10-minute subject speed drills for BPSC Prelims with 15 questions from verified PYQs under official negative marking.",
        url: "https://shaktiq.com/#speed-drills",
        image: "https://shaktiq.com/share-card.png"
      });
    }

    function openPyqBankMode() {
      const portal = document.getElementById('page-portal-view');
      const qb = document.getElementById('page-bpsc-pyq-view');
      const qbHeader = document.getElementById('qb-sticky-header');
      if (qbHeader) qbHeader.classList.remove('mock-hide-header-mobile');
      if (portal && qb) {
        portal.classList.add('hidden');
        qb.classList.remove('hidden');
        switchMainMode('pyq');
        safeScrollToTop();
        initIcons();
        try {
          if (!window.location.hash.toLowerCase().includes('#admin') && !window.location.hash.toLowerCase().includes('#mistakes')) {
            history.pushState(null, null, '#pyq-bank');
          }
        } catch(e){}
      }
      if (window.location.hash.toLowerCase().includes('#admin')) {
        updatePageMeta({
          title: "Question Management Portal (Admin) | ShaktiQ",
          description: "Internal administration interface for ShaktiQ question bank management.",
          url: "https://shaktiq.com/#admin",
          image: "https://shaktiq.com/share-card.png"
        });
      } else if (window.location.hash.toLowerCase().includes('#mistakes')) {
        updatePageMeta({
          title: "My Mistake Register | ShaktiQ BPSC Prep",
          description: "Track, review, and master your incorrect BPSC questions until you solve them correctly twice in a row.",
          url: "https://shaktiq.com/#mistakes",
          image: "https://shaktiq.com/share-card.png"
        });
      } else {
        updatePageMeta({
          title: "2,800+ Subject-Wise BPSC PYQ Bank | ShaktiQ",
          description: "Explore 2,800+ verified BPSC previous year questions organized by subject and exam with active recall self-testing.",
          url: "https://shaktiq.com/#pyq-bank",
          image: "https://shaktiq.com/share-card.png"
        });
      }
    }

    function switchMainMode(mode) {
      currentAppMode = mode;
      const btnTS = document.getElementById('workspace-mode-btn-testseries');
      const btnPYQ = document.getElementById('workspace-mode-btn-pyq');
      const pyqSubNav = document.getElementById('pyq-subnav');

      if (pyqSubNav) pyqSubNav.classList.remove('hidden');

      if (mode === 'testseries') {
        if (btnTS) {
          btnTS.className = 'mode-active flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-[#10402D] text-white border border-[#10402D] shadow-sm cursor-pointer';
        }
        if (btnPYQ) {
          btnPYQ.className = 'mode-inactive flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-[#10402D] bg-white hover:bg-[#EBF3E6] border border-[#DCE6DF] cursor-pointer';
        }
        switchView('testseries');
      } else {
        if (btnTS) {
          btnTS.className = 'mode-inactive flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-[#10402D] bg-white hover:bg-[#EBF3E6] border border-[#DCE6DF] cursor-pointer';
        }
        if (btnPYQ) {
          btnPYQ.className = 'mode-active flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-[#10402D] text-white border border-[#10402D] shadow-sm cursor-pointer';
        }
        switchView('bank');
      }
      initIcons();
    }


        // BILINGUAL ENGINE loaded from ./js/bilingual.js


    function getSubjectInHindi(subj) {
      const map = {
        'History': 'इतिहास (History)',
        'Bihar Special': 'बिहार विशेष (Bihar Special)',
        'Science': 'सामान्य विज्ञान (Science)',
        'Polity': 'भारतीय राजव्यवस्था (Polity)',
        'Economy': 'भारतीय अर्थव्यवस्था (Economy)',
        'Geography': 'भूगोल (Geography)',
        'Current Affairs': 'समसामयिकी (Current Affairs)',
        'Mental Ability': 'तर्कशक्ति व गणित (Reasoning & Math)',
        'General Studies': 'सामान्य अध्ययन (General Studies)'
      };
      return map[subj] || subj || 'सामान्य अध्ययन';
    }

    function updateYearPillsUI() {
      const curYear = (typeof selectedYear !== "undefined" ? selectedYear : (window.selectedYear || "all"));
      document.querySelectorAll(".year-pill").forEach(btn => {
        const yVal = btn.getAttribute("data-year-btn");
        if (yVal === curYear) {
          btn.className = "year-pill bg-[#10402D] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl border border-[#10402D] transition shadow-sm cursor-pointer";
        } else {
          btn.className = "year-pill bg-[#F8FAF7] text-[#223127] hover:bg-[#EBF3E6] font-semibold text-xs px-3.5 py-1.5 rounded-xl border border-[#DCE6DF] transition cursor-pointer";
        }
      });
    }

    function initApp() {
      ShaktiQBilingualEngine.init();
      initAuth();
      renderTestSeriesCards();
      loadStoredState();
      updateHeaderCounters();
      populateExamDropdowns();
      renderSubjectPills();
      renderQuestions();
      updateOptionECalculator();

      // Navigation tabs
      document.querySelectorAll(".nav-tab").forEach(btn => {
        btn.addEventListener("click", () => {
          switchView(btn.getAttribute("data-view"));
        });
      });

      // Header quick buttons
      document.getElementById("quickAddQuestionBtn").addEventListener("click", () => {
        switchView("manage");
      });
      const printBtn = document.getElementById("printPageBtn");
      if (printBtn) {
        printBtn.addEventListener("click", () => {
          window.print();
        });
      }
      const mobPrintBtn = document.getElementById("mobilePrintPdfBtn");
      if (mobPrintBtn) {
        mobPrintBtn.addEventListener("click", () => {
          window.print();
          toggleMobileMoreMenu();
        });
      }

      // Group by subject & Show answers toggles
      document.getElementById("groupBySubjectToggle").addEventListener("change", (e) => {
        groupBySubject = e.target.checked;
        renderQuestions();
      });
      document.getElementById("showAllAnswersToggle").addEventListener("change", (e) => {
        showAllAnswers = e.target.checked;
        renderQuestions();
      });

      // Search & Filters
      const searchInput = document.getElementById("searchInput");
      const clearSearchBtn = document.getElementById("clearSearchBtn");
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        displayLimit = 60;
        if (searchQuery.trim()) clearSearchBtn.classList.remove("hidden");
        else clearSearchBtn.classList.add("hidden");
        renderQuestions();
      });
      clearSearchBtn.addEventListener("click", () => {
        searchQuery = "";
        searchInput.value = "";
        clearSearchBtn.classList.add("hidden");
        renderQuestions();
      });

      // updateYearPillsUI moved to module level

      document.querySelectorAll(".year-pill").forEach(btn => {
        btn.addEventListener("click", () => {
          selectedYear = btn.getAttribute("data-year-btn");
          const ySel = document.getElementById("yearFilter");
          if (ySel) ySel.value = selectedYear;
          updateYearPillsUI();
          displayLimit = 60;
          renderQuestions();
        });
      });

      document.getElementById("yearFilter").addEventListener("change", (e) => {
        selectedYear = e.target.value;
        updateYearPillsUI();
        displayLimit = 60;
        renderQuestions();
      });
      document.getElementById("examFilter").addEventListener("change", (e) => {
        selectedExam = e.target.value;
        // When user selects a specific exam, ensure ALL questions of that exam appear (100 for AEDO, 150 for 71st)
        displayLimit = (selectedExam === "ALL") ? 60 : 99999;
        renderQuestions();
      });
      document.getElementById("typeFilter").addEventListener("change", (e) => {
        selectedType = e.target.value;
        displayLimit = (selectedType === "MISTAKES") ? 99999 : 100;
        try {
          if (selectedType === "MISTAKES") {
            history.replaceState(null, null, '#mistakes');
          } else if (window.location.hash === '#mistakes') {
            history.replaceState(null, null, '#pyq-bank');
          }
        } catch (err) {}
        if (typeof updateMistakeCountBadge === "function") updateMistakeCountBadge();
        renderQuestions();
      });
      document.getElementById("resetFiltersBtn").addEventListener("click", resetAllFilters);

      // Pagination buttons
      document.getElementById("loadMoreBtn").addEventListener("click", () => {
        displayLimit += 60;
        renderQuestions();
      });
      document.getElementById("showAllQuestionsBtn").addEventListener("click", () => {
        displayLimit = 99999;
        renderQuestions();
      });

      // Exam Directory "+ Add New Exam" button
      document.getElementById("addNewExamFromTableBtn").addEventListener("click", () => {
        switchView("manage");
        const sel = document.getElementById("formExamSelect");
        if (sel) {
          sel.value = "__NEW__";
          document.getElementById("customExamRow").classList.remove("hidden");
        }
      });

      // Add Question Form interactions
      const formExamSelect = document.getElementById("formExamSelect");
      formExamSelect.addEventListener("change", (e) => {
        const customRow = document.getElementById("customExamRow");
        if (e.target.value === "__NEW__") {
          customRow.classList.remove("hidden");
        } else {
          customRow.classList.add("hidden");
          const matchedExam = getAllExams().find(x => x.name === e.target.value);
          if (matchedExam) {
            document.getElementById("formYear").value = matchedExam.year;
            document.getElementById("formDate").value = matchedExam.date;
          }
        }
      });

      document.getElementById("formType").addEventListener("change", (e) => {
        const block = document.getElementById("mcqOptionsBlock");
        if (e.target.value === "Mains") block.classList.add("hidden");
        else block.classList.remove("hidden");
      });

      document.getElementById("cancelEditBtn").addEventListener("click", resetAddForm);

      document.getElementById("addQuestionForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const editId = document.getElementById("editQuestionId").value;
        const examSelVal = document.getElementById("formExamSelect").value;
        const examName = examSelVal === "__NEW__"
          ? (document.getElementById("formCustomExamName").value.trim() || "Custom BPSC Exam")
          : examSelVal;

        const yearVal = document.getElementById("formYear").value.trim() || "2026";
        const dateVal = document.getElementById("formDate").value.trim() || yearVal;
        const qnoVal = document.getElementById("formQno").value.trim() || ("Q" + (customQuestions.length + 1));
        const subjVal = document.getElementById("formSubject").value;
        const typeVal = document.getElementById("formType").value;
        const qText = document.getElementById("formQuestionText").value.trim();
        if (!qText) return;

        let optionsArr = [];
        let ansLetter = "Mains";
        let ansTextVal = document.getElementById("formAnsText").value.trim();

        if (typeVal === "MCQ") {
          const a = document.getElementById("formOptA").value.trim() || "Option A";
          const b = document.getElementById("formOptB").value.trim() || "Option B";
          const c = document.getElementById("formOptC").value.trim() || "Option C";
          const d = document.getElementById("formOptD").value.trim() || "Option D";
          const optE = document.getElementById("formOptE").value.trim();
          optionsArr = [`(A) ${a}`, `(B) ${b}`, `(C) ${c}`, `(D) ${d}`];
          if (optE) optionsArr.push(`(E) ${optE}`);
          ansLetter = document.getElementById("formCorrectOption").value || "A";
          const mapIdx = { A: 0, B: 1, C: 2, D: 3, E: 4 };
          if (!ansTextVal) {
            ansTextVal = optionsArr[mapIdx[ansLetter] || 0] || `(${ansLetter})`;
          }
        } else {
          if (!ansTextVal) ansTextVal = "Descriptive / Direct Key";
        }

        const expVal = document.getElementById("formExplanation").value.trim() || "Added by user.";
        const srcUrl = document.getElementById("formSourceUrl").value.trim() || "https://bpsc.bihar.gov.in/";

        if (!getAllExams().some(x => x.name === examName)) {
          customExams.push({
            name: examName,
            advt: "Custom",
            date: dateVal,
            year: yearVal,
            type: typeVal === "MCQ" ? "Objective GS" : "Descriptive Mains",
            status: "User Added",
            url: srcUrl
          });
          saveCustomExams();
        }

        const newObj = {
          id: editId || ("custom_" + Date.now()),
          exam: examName,
          date: dateVal,
          year: yearVal,
          qno: qnoVal,
          type: typeVal,
          subject: subjVal,
          q: qText,
          options: optionsArr,
          ans: ansLetter,
          ansText: ansTextVal,
          exp: expVal,
          sourceUrl: srcUrl,
          sourceTitle: examName,
          custom: true
        };

        if (editId) {
          const idx = customQuestions.findIndex(x => x.id === editId);
          if (idx !== -1) customQuestions[idx] = newObj;
          showToast("Question updated!");
        } else {
          customQuestions.unshift(newObj);
          showToast(`Added ${qnoVal} (${subjVal}) to ${examName}!`);
        }

        saveCustomQuestions();
        resetAddForm();
        updateHeaderCounters();
        populateExamDropdowns();
        renderSubjectPills();
        renderQuestions();
      });

      // Bulk import button
      document.getElementById("runBulkImportBtn").addEventListener("click", handleBulkPasteImport);

      // Export JSON & CSV
      const expJson = document.getElementById("exportJsonBtn"); if (expJson) expJson.onclick = () => showToast("Export disabled.", "error");

      // Import JSON
      const importJsonEl = document.getElementById("importJsonFile");
      if (importJsonEl) {
        importJsonEl.addEventListener("change", (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const imported = JSON.parse(ev.target.result);
              if (Array.isArray(imported)) {
                const existingIds = new Set(getAllQuestions().map(x => x.id));
                let added = 0;
                imported.forEach(item => {
                  if (item && item.q && !existingIds.has(item.id)) {
                    item.custom = true;
                    customQuestions.push(item);
                    added += 1;
                  }
                });
                saveCustomQuestions();
                updateHeaderCounters();
                populateExamDropdowns();
                renderSubjectPills();
                renderQuestions();
                showToast(`Imported ${added} new question(s)!`);
              }
            } catch (err) {
              showToast("Could not parse JSON file.", "⚠");
            }
          };
          reader.readAsText(file);
        });
      }

      // Practice Scorecard & Option E Calculator
      document.getElementById("resetPracticeScoreBtn").addEventListener("click", () => {
        userAttempts = {};
        updatePracticeScorecard();
            if (typeof updateAbhyasUI === "function") updateAbhyasUI();
        renderQuestions();
        showToast("Practice attempts reset!");
      });

      ["calcCorrect", "calcWrong", "calcOptionE", "calcBlank"].forEach(id => {
        document.getElementById(id).addEventListener("input", updateOptionECalculator);
      });
    }


    // ==========================================
    // REAL MULTI-PROVIDER AUTHENTICATION ENGINE (Google, Facebook & Aspirant Email)
    // ==========================================
        // ==========================================
    // ASPIRANT REGISTRATION, DPDP CONSENT & GOOGLE SHEETS LEAD COLLECTION ENGINE
    // ==========================================
    // PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL BELOW:
    const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwNLhgnbVhYOC-EtQgb3hMih_i2Kpcu0lH9J-bGFxsAG1p8pJae3jN1Bh2jCUY4d5gR/exec";
    const RATE_LIMIT_STORAGE_KEY = "pwa_reg_rate_limit_v1";
    const PENDING_LEADS_QUEUE_KEY = "pwa_pending_sheets_queue_v1";

    let pendingAspirantCallback = null;
    let regModalOpenedAt = 0;

        // Aspirant accessors loaded from ./js/storage.js


    // getAllTestAttempts loaded from ./js/storage.js

    function quickResumeAspirant() {
      const all = getAllAspirants();
      const existing = getCurrentAspirant() || (all.length > 0 ? all[0] : null);
      if (existing) {
        PrepBackendEngine.auth.saveUserSession(existing).then(async () => {
          let token = getAspirantAuthToken();
          if (!token) {
            token = await requestSessionToken(existing.email, existing.name);
          }
          if (!questionsLoaded || INITIAL_QUESTIONS.length === 0) {
            loadQuestionsData(true);
          }
          userAttempts = loadStudentPracticeAttempts();
        updateAspirantNavUI();
        renderSubjectPills();
        updateSubjectProgressUI();
        renderQuestions();
        if (typeof renderTestSeriesCards === 'function') renderTestSeriesCards();
        if (activeView === 'analytics') renderStudentAnalyticsView();
        closeAspirantRegModal();
          showToast(`Welcome back, ${existing.name}! Resumed your session.`, 'success');
          if (pendingAspirantCallback) {
            const cb = pendingAspirantCallback;
            pendingAspirantCallback = null;
            try { cb(existing); } catch(e){}
          }
        });
      }
    }

    function openAspirantRegModal(intentNote) {
      const modal = document.getElementById('aspirant-reg-modal');
      if (modal) {
        regModalOpenedAt = Date.now();
        const hp = document.getElementById('reg-website-hp');
        if (hp) hp.value = '';
        const banner = document.getElementById('reg-modal-intent-banner');
        if (banner && intentNote) {
          banner.textContent = intentNote;
        }

        // Check for returning user
        const all = getAllAspirants();
        const existing = getCurrentAspirant() || (all.length > 0 ? all[0] : null);
        const resumeCard = document.getElementById('quick-resume-card');
        const resumeText = document.getElementById('quick-resume-user-text');
        
        if (existing && resumeCard && resumeText) {
          resumeText.textContent = `Welcome back, ${existing.name || 'Aspirant'}!`;
          resumeCard.classList.remove('hidden');
          // Pre-fill form fields
          const nameInp = document.getElementById('reg-student-name');
          const emailInp = document.getElementById('reg-student-email');
          const phoneInp = document.getElementById('reg-student-phone');
          const distInp = document.getElementById('reg-student-district');
          const examInp = document.getElementById('reg-target-exam');
          const consentInp = document.getElementById('reg-consent-check');
          if (nameInp && existing.name) nameInp.value = existing.name;
          if (emailInp && existing.email) emailInp.value = existing.email;
          if (phoneInp && existing.phone) phoneInp.value = existing.phone;
          if (distInp && existing.district) distInp.value = existing.district;
          if (examInp && existing.targetExam) examInp.value = existing.targetExam;
          if (consentInp) consentInp.checked = true;
        } else if (resumeCard) {
          resumeCard.classList.add('hidden');
        }

        modal.classList.remove('hidden');
        initIcons();
        setTimeout(() => {
          const nameInput = document.getElementById('reg-student-name');
          if (nameInput && (!existing || !existing.name)) nameInput.focus();
        }, 50);
        if (intentNote) {
          showToast(intentNote, 'info');
        }
      }
    }

    function closeAspirantRegModal() {
      const modal = document.getElementById('aspirant-reg-modal');
      if (modal) modal.classList.add('hidden');
      pendingAspirantCallback = null;
    }


    // ADMIN: Google Sheets Integration & Lead Management
    

    function saveGoogleSheetsWebhookUrl() {
      const urlInput = document.getElementById('admin-sheets-url-input');
      const url = (urlInput ? urlInput.value : (prompt('Enter Google Apps Script Web App URL:') || '')).trim();
      if (!url) {
        showToast('Please paste a valid Google Apps Script Web App URL.', 'error');
        return;
      }
      if (!url.startsWith('https://script.google.com/')) {
        showToast('URL must start with https://script.google.com/macros/s/...', 'error');
        return;
      }
      localStorage.setItem('pwa_webhook_url', url);
      showToast('Google Sheets Web App connected successfully!', 'success');
      // Flush any queued leads to the new sheet
      flushPendingSheetsQueue();
      closeAdminLeadsModal();
    }

    function exportAllAspirantsCSV() {
      const all = getAllAspirants();
      if (!all || all.length === 0) {
        showToast('No registered aspirants found yet.', 'info');
        return;
      }
      const headers = ['ID', 'Name', 'Phone', 'Email', 'District', 'Target Exam', 'Registered At', 'Tests Attempted', 'PYQ Count'];
      const rows = all.map(a => [
        a.id || '',
        '"' + (a.name || '').replace(/"/g, '""') + '"',
        a.phone || '',
        a.email || '',
        '"' + (a.district || '').replace(/"/g, '""') + '"',
        '"' + (a.targetExam || '').replace(/"/g, '""') + '"',
        '"' + (a.registeredAt || '').replace(/"/g, '""') + '"',
        a.testsAttempted || 0,
        a.pyqCount || 0
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'ShaktiQ_Student_Leads_' + new Date().toISOString().slice(0, 10) + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Student leads downloaded successfully!', 'success');
    }


    // Simple Client-Side Rate Limit Check (Max 3 sign-up submissions per 10 mins, min 20s between attempts)
    function checkRegistrationRateLimit() {
      try {
        const now = Date.now();
        const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
        let history = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(history)) history = [];
        // Keep timestamps from the last 10 minutes (600,000 ms)
        history = history.filter(ts => (now - ts) < 600000);
        if (history.length > 0 && (now - history[history.length - 1]) < 20000) {
          const waitSecs = Math.ceil((20000 - (now - history[history.length - 1])) / 1000);
          return { allowed: false, reason: `Please wait ${waitSecs} seconds before submitting again.` };
        }
        if (history.length >= 5) {
          return { allowed: false, reason: "Too many sign-up attempts. Please wait a few minutes and try again." };
        }
        history.push(now);
        localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(history));
        return { allowed: true };
      } catch (e) {
        return { allowed: true };
      }
    }

    function handleAspirantRegistration(e) {
      if (e) e.preventDefault();

      const submitBtn = document.getElementById('reg-submit-btn');
      const resetBtn = () => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
        }
      };

      // 1. SPAM PROTECTION: Honeypot check
      const honeypot = document.getElementById('reg-website-hp');
      if (honeypot && honeypot.value.trim() !== '') {
        closeAspirantRegModal();
        return;
      }

      // 2. SPAM PROTECTION: Bot instant-submit check (< 1.2 seconds since modal opened)
      if (regModalOpenedAt > 0 && (Date.now() - regModalOpenedAt) < 1200) {
        showToast('Please fill in your details carefully before submitting.', 'error');
        return;
      }

      const consentCheck = document.getElementById('reg-consent-check');
      if (!consentCheck || !consentCheck.checked) {
        resetBtn();
        showToast('Please check the consent box to agree to Terms and Privacy Policy before proceeding.', 'error');
        return;
      }

      const name = (document.getElementById('reg-student-name').value || '').trim();
      const email = (document.getElementById('reg-student-email').value || '').trim();
      const phone = (document.getElementById('reg-student-phone').value || '').trim().replace(/\D/g, '');
      const targetExam = document.getElementById('reg-target-exam').value || '72nd BPSC CCE';
      const district = (document.getElementById('reg-student-district').value || '').trim();

      if (!name || name.length < 2) {
        resetBtn();
        showToast('Please enter your full name.', 'error');
        return;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        resetBtn();
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      if (!/^[6-9]\d{9}$/.test(phone)) {
        resetBtn();
        showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
        return;
      }

      if (!district) {
        resetBtn();
        showToast('Please select your home district in Bihar.', 'error');
        return;
      }

      // 3. SPAM PROTECTION: Rate limit check
      const rateCheck = checkRegistrationRateLimit();
      if (!rateCheck.allowed) {
        resetBtn();
        showToast(rateCheck.reason, 'error');
        return;
      }

      if (submitBtn) {
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-60', 'cursor-not-allowed');
      }

      const aspirant = {
        id: 'asp_' + Date.now(),
        name: name,
        email: email.toLowerCase(),
        phone: phone,
        targetExam: targetExam,
        district: district,
        consentAccepted: true,
        consentVersion: 'DPDP-2023-v1',
        consentTimestamp: new Date().toISOString(),
        registeredAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        testsAttempted: 0,
        pyqCount: 0,
        lastActive: new Date().toISOString()
      };

      const savedCallback = pendingAspirantCallback;
      pendingAspirantCallback = null;

      // 4. Save locally (localStorage + IndexedDB fallback) AND sync to Google Sheets
      PrepBackendEngine.auth.saveUserSession(aspirant).then(async () => {
        resetBtn();

        // Obtain secure session token from Cloudflare Worker
        const token = await requestSessionToken(aspirant.email, aspirant.name);
        if (token) {
          aspirant.token = token;
        }

        syncAspirantToGoogleSheets({
          event: 'student_registered',
          token: token || '',
          name: aspirant.name,
          email: aspirant.email,
          phone: aspirant.phone,
          district: aspirant.district,
          targetExam: aspirant.targetExam,
          consentAccepted: aspirant.consentAccepted,
          consentVersion: aspirant.consentVersion,
          consentTimestamp: aspirant.consentTimestamp,
          registeredAt: aspirant.registeredAt,
          userAgent: navigator.userAgent,
          website_hp: ''
        });

        // Add to local all aspirants directory if not present
        const allAspirants = getAllAspirants();
        const existingIdx = allAspirants.findIndex(a => a.email.toLowerCase() === aspirant.email.toLowerCase());
        if (existingIdx !== -1) {
          allAspirants[existingIdx] = Object.assign(allAspirants[existingIdx], aspirant);
        } else {
          allAspirants.push(aspirant);
        }
        try {
          localStorage.setItem('pwa_all_aspirants', JSON.stringify(allAspirants));
        } catch(e) {}

        // Unlock question bank with new session token
        if (!questionsLoaded || INITIAL_QUESTIONS.length === 0) {
          loadQuestionsData(true);
        }

        updateAspirantNavUI();
        closeAspirantRegModal();
        showToast(`Welcome, ${name}! Access to 2,800+ PYQs & 22 Full-Length Mock Tests unlocked.`, 'success');

        if (savedCallback) {
          try { savedCallback(aspirant); } catch(e) {}
        }
      }).catch((err) => {
        resetBtn();
        showToast('Registration failed: ' + (err.message || 'Storage error'), 'error');
      });
    }

    function switchAspirantAccount() {
      closeStudentProfileModal();
      PrepBackendEngine.auth.clearUserSession();
      try {
        localStorage.removeItem('shaktiq_auth_token');
      } catch (e) {}
      INITIAL_QUESTIONS = [];
      questionsLoaded = false;
      questionsLoadPromise = null;
      updateAspirantNavUI();
      openPortalView();
      showToast('Signed out of your profile.', 'info');
    }

    // DPDP Act 2023 Data Principal Right: Withdraw Consent & Erase Personal Data
    function eraseMyPersonalData() {
      const current = getCurrentAspirant();
      try {
        localStorage.removeItem('pwa_current_aspirant');
        localStorage.removeItem('pwa_all_aspirants');
        localStorage.removeItem('pwa_test_attempts');
        localStorage.removeItem('bpsc_practice_attempts_v1');
        localStorage.removeItem(PENDING_LEADS_QUEUE_KEY);
      } catch (e) {}
      if (window.indexedDB && PrepBackendEngine.dbName) {
        try { window.indexedDB.deleteDatabase(PrepBackendEngine.dbName); } catch (e) {}
      }
      if (current && current.email) {
        syncAspirantToGoogleSheets({
          event: 'consent_withdrawn_erase',
          email: current.email,
          phone: current.phone || '',
          timestamp: new Date().toISOString()
        });
      }
      userAttempts = {};
      closeStudentProfileModal();
      closeLegalModal();
      updateAspirantNavUI();
      openPortalView();
      showToast('Your consent has been withdrawn and your local personal data has been erased.', 'success');
    }

    // Legal / Privacy / Terms / Contact Modal Controls
        // Legal modal controls loaded from ./js/ui.js


    // ==========================================
    // HIGH-CAPACITY ASYNCHRONOUS BACKEND ENGINE (IndexedDB v3 + LocalStorage Fallback)
    // ==========================================
        // PrepBackendEngine loaded from ./js/storage.js


    function updateAspirantNavUI() {
      const user = PrepBackendEngine.auth.getCurrentUser();
      const navContainer = document.getElementById('nav-auth-container');
      const mobileNavContainer = document.getElementById('mobile-nav-auth-container');
      const qbNav = document.getElementById('qb-auth-container');

      if (user && user.email) {
        const firstName = (user.name || '').trim().split(' ')[0] || 'Aspirant';
        const targetShort = (user.targetExam || '72nd BPSC').split(' ')[0];

        if (navContainer) {
          navContainer.innerHTML = `
            <button type="button" onclick="openStudentProfileModal()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#10402D] bg-[#EBF3E6] hover:bg-[#DCE9D5] border border-[#C6DEC0] shadow-sm transition-all cursor-pointer" title="View Student Profile & Performance Records">
              <span class="w-2 h-2 rounded-full bg-[#10402D]"></span>
              <i data-lucide="user-check" class="w-3.5 h-3.5 text-[#10402D]"></i>
              <span class="font-bold text-[#111C15]">${escapeHtml(firstName)}</span>
              <span class="text-[10px] text-[#10402D] font-mono px-1.5 py-0.5 rounded bg-white border border-[#C5DEC0] hidden lg:inline">(${escapeHtml(targetShort)})</span>
            </button>
          `;
        }

        if (mobileNavContainer) {
          mobileNavContainer.innerHTML = `
            <button type="button" onclick="openStudentProfileModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#10402D] bg-[#EBF3E6] border border-[#C6DEC0] cursor-pointer">
              <span class="w-2 h-2 rounded-full bg-[#10402D]"></span>
              <i data-lucide="user-check" class="w-3 h-3 text-[#10402D]"></i>
              <span class="font-bold text-[#111C15]">${escapeHtml(firstName)}</span>
            </button>
          `;
        }

        if (qbNav) {
          qbNav.innerHTML = `
            <button type="button" onclick="openStudentProfileModal()" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EBF3E6] border border-[#C6DEC0] text-xs cursor-pointer">
              <span class="w-2 h-2 rounded-full bg-[#10402D]"></span>
              <span class="text-[#111C15] font-bold">${escapeHtml(firstName)}</span>
            </button>
          `;
        }
      } else {
        const signInBtnHtml = `
          <button type="button" onclick="openAspirantRegModal('Sign in with your name, email, mobile number, and district to unlock the PYQ Bank and Mock Tests.')" class="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0A3826] hover:bg-[#145239] shadow-sm transition-all cursor-pointer" id="nav-signin-btn">
            <i data-lucide="user" class="w-4 h-4 text-[#FCE27B]"></i>
            <span>Sign In</span>
          </button>
        `;

        const mobileSignInBtnHtml = `
          <button type="button" onclick="openAspirantRegModal('Sign in with your name, email, mobile number, and district to unlock the PYQ Bank and Mock Tests.')" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0A3826] cursor-pointer">
            <i data-lucide="user" class="w-3.5 h-3.5 text-[#FCE27B]"></i>
            <span>Sign In</span>
          </button>
        `;

        if (navContainer) navContainer.innerHTML = signInBtnHtml;
        if (mobileNavContainer) mobileNavContainer.innerHTML = mobileSignInBtnHtml;
        if (qbNav) qbNav.innerHTML = `<button type="button" onclick="openAspirantRegModal('Sign in to track your test scores and bookmarks.')" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#10402D] bg-white hover:bg-[#EBF3E6] border border-white/80 shadow-sm transition-all cursor-pointer"><i data-lucide="user" class="w-3.5 h-3.5 text-[#10402D]"></i><span>Sign In</span></button>`;
      }

      initIcons();
    }

    async function openStudentProfileModal() {
      const user = PrepBackendEngine.auth.getCurrentUser();
      if (!user) {
        openAspirantRegModal();
        return;
      }

      const modal = document.getElementById('student-profile-modal');
      if (!modal) return;

      document.getElementById('sp-full-name').textContent = user.name;
      document.getElementById('sp-first-name').textContent = user.firstName || user.name.split(' ')[0];
      document.getElementById('sp-email').textContent = user.email;
      document.getElementById('sp-phone').textContent = user.phone || 'Not specified';
      document.getElementById('sp-target-exam').textContent = user.targetExam || '72nd/73rd BPSC CCE';
      document.getElementById('sp-district').textContent = user.district || 'Bihar';
      document.getElementById('sp-registered-date').textContent = user.registeredAt || 'Active Aspirant';

      const attempts = await PrepBackendEngine.tests.getAttemptsForStudent(user.email);
      document.getElementById('sp-total-tests').textContent = attempts.length;

      let highestScore = null;
      let totalQuestions = 0;
      let totalCorrect = 0;

      attempts.forEach(a => {
        const s = parseFloat(a.score);
        if (!isNaN(s)) {
          if (highestScore === null || s > highestScore) highestScore = s;
        }
        totalQuestions += (parseInt(a.totalQ) || 0);
        totalCorrect += (parseInt(a.correct) || 0);
      });

      document.getElementById('sp-highest-score').textContent = highestScore !== null ? highestScore.toFixed(2) : '0.00';
      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      document.getElementById('sp-avg-accuracy').textContent = accuracy + '%';

      const attemptsList = document.getElementById('sp-attempts-container');
      if (attemptsList) {
        if (attempts.length === 0) {
          attemptsList.innerHTML = `
            <div class="p-6 text-center rounded-2xl bg-[#F8FAF7] border border-[#DCE6DF] text-[#36443A] text-xs">
              <p>No mock test submissions recorded yet.</p>
              <button type="button" onclick="closeStudentProfileModal(); openTestSeriesMode();" class="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#10402D] hover:bg-[#17593F] transition cursor-pointer">
                Take Your First Mock Test Now
              </button>
            </div>
          `;
        } else {
          attemptsList.innerHTML = attempts.map((att) => `
            <div class="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#DCE6DF] flex items-center justify-between gap-3 text-xs">
              <div class="min-w-0 flex-1">
                <div class="font-bold text-[#111C15] truncate">${escapeHtml(att.examTitle || 'BPSC Mock Test')}</div>
                <div class="text-[11px] text-[#36443A] mt-0.5">${escapeHtml(att.timestamp || 'Recent')} • ${escapeHtml(att.attempted)}/${escapeHtml(att.totalQ)} Attempted</div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-[#10402D] font-extrabold text-sm">${escapeHtml(att.score)} Marks</div>
                <div class="text-[10px] text-[#36443A]">${escapeHtml(att.correct)} Right • ${escapeHtml(att.wrong)} Wrong</div>
              </div>
            </div>
          `).join('');
        }
      }

      modal.classList.remove('hidden');
      initIcons();
    }

    function closeStudentProfileModal() {
      const modal = document.getElementById('student-profile-modal');
      if (modal) modal.classList.add('hidden');
    }

    function downloadMyTestData() {
      const user = PrepBackendEngine.auth.getCurrentUser();
      if (user && user.email) {
        PrepBackendEngine.exportStudentDataJSON(user.email);
      } else {
        showToast("Please sign in to export your data.", "error");
      }
    }

    // STRICT SIGN-IN GATING FOR PYQ & MOCK TESTS
    function requireAspirant(actionCallback, intentMessage) {
      const user = getCurrentAspirant();
      if (user && user.email && user.name) {
        if (actionCallback) actionCallback(user);
        return true;
      }
      pendingAspirantCallback = actionCallback || null;
      openAspirantRegModal(intentMessage || 'Please sign in with your name, email, phone, and district to access the PYQ Bank and Mock Tests.');
      return false;
    }

    function logPyqInteraction(aspirant, qid, opt) {
      if (!aspirant) return;
      try {
        const all = getAllAspirants();
        const student = all.find(a => a.email.toLowerCase() === aspirant.email.toLowerCase());
        if (student) {
          student.pyqCount = (student.pyqCount || 0) + 1;
          student.lastActive = new Date().toISOString();
          localStorage.setItem('pwa_all_aspirants', JSON.stringify(all));
        }
      } catch (e) {}
    }

    function saveTestAttemptRecord(attempt) {
      PrepBackendEngine.tests.saveAttempt(attempt).then(() => {
        const all = PrepBackendEngine.auth.getAllLocalAspirants();
        const student = all.find(a => a.email.toLowerCase() === (attempt.studentEmail || '').toLowerCase());
        if (student) {
          student.testsAttempted = (student.testsAttempted || 0) + 1;
          student.lastActive = new Date().toISOString();
          try {
            localStorage.setItem('pwa_all_aspirants', JSON.stringify(all));
          } catch(e) {}
        }
        // Sync test attempt to Google Sheets Web App
        syncAspirantToGoogleSheets({
          event: 'test_completed',
          attemptId: attempt.attemptId,
          name: attempt.studentName,
          email: attempt.studentEmail,
          phone: attempt.studentPhone,
          district: attempt.studentDistrict || (student && student.district) || '',
          targetExam: attempt.targetExam,
          examTitle: attempt.examTitle,
          score: attempt.score,
          correct: attempt.correct,
          wrong: attempt.wrong,
          attempted: attempt.attempted,
          totalQ: attempt.totalQ,
          timestamp: attempt.timestamp,
          website_hp: ''
        });
      });
    }

    // Google Sheets Web App Sync (with localStorage offline queue fallback)
    function getGoogleSheetsEndpoint() {
      if (GOOGLE_SHEETS_WEB_APP_URL && !GOOGLE_SHEETS_WEB_APP_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_DEPLOYMENT_ID')) {
        return GOOGLE_SHEETS_WEB_APP_URL;
      }
      const customUrl = localStorage.getItem('pwa_webhook_url');
      if (customUrl && customUrl.startsWith('https://script.google.com/')) return customUrl;
      return '';
    }

    function queuePendingSheetPayload(payload) {
      try {
        const raw = localStorage.getItem(PENDING_LEADS_QUEUE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        list.push(payload);
        localStorage.setItem(PENDING_LEADS_QUEUE_KEY, JSON.stringify(list.slice(-50)));
      } catch (e) {}
    }

    function syncAspirantToGoogleSheets(payload) {
      const endpoint = getGoogleSheetsEndpoint();
      if (!endpoint) {
        // Store in pending queue until Google Apps Script URL is configured
        queuePendingSheetPayload(payload);
        return;
      }
      try {
        fetch(endpoint, {
          method: 'POST',
          mode: 'no-cors',
          keepalive: true,
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        }).catch(() => {
          queuePendingSheetPayload(payload);
        });
      } catch (e) {
        queuePendingSheetPayload(payload);
      }
    }

    function flushPendingSheetsQueue() {
      const endpoint = getGoogleSheetsEndpoint();
      if (!endpoint || !navigator.onLine) return;
      try {
        const raw = localStorage.getItem(PENDING_LEADS_QUEUE_KEY);
        if (!raw) return;
        const list = JSON.parse(raw);
        if (!Array.isArray(list) || list.length === 0) return;
        localStorage.removeItem(PENDING_LEADS_QUEUE_KEY);
        list.forEach(item => syncAspirantToGoogleSheets(item));
      } catch (e) {}
    }

    window.addEventListener('online', flushPendingSheetsQueue);

    // Backward compatibility aliases
    function initAuth() { updateAspirantNavUI(); }
    function updateAuthUI() { updateAspirantNavUI(); }
    function openSignInModal(cb) { openAspirantRegModal('Sign in to continue'); if(cb) pendingAspirantCallback=cb; }
    function closeSignInModal() { closeAspirantRegModal(); }
    function requireAuth(cb) { return requireAspirant(cb); }
    function signOutAccount() { switchAspirantAccount(); }

    // ==========================================
    // EXAM PACKS REGISTRY & MODULAR ARCHITECTURE (Feature 3.3)
    // Clean data structure to add new exam packs (BSSC, TRE 4.0, etc.) by dropping in data.
    // Strict data integrity: Zero invented questions.
        // EXAM PACKS REGISTRY & TEST CONFIGS loaded from ./js/exam-packs.js


        // TEST ENGINE, OMR SHEET & SOLUTION REVIEW loaded from ./js/test-engine.js


        window.addEventListener("DOMContentLoaded", initApp);
  

    // Portal Initializer
    // Register Versioned Offline Service Worker (PWA) with background update check & status indicator
      window.waitingServiceWorker = null;

      function updatePwaStatus(status, worker) {
        if (worker) window.waitingServiceWorker = worker;

        const textEls = [
          document.getElementById('pwa-status-text'),
          document.getElementById('pwa-status-text-mobile'),
          document.getElementById('qb-pwa-status-text'),
          document.getElementById('drawer-pwa-text')
        ];
        const dotEls = [
          document.getElementById('pwa-status-dot'),
          document.getElementById('pwa-status-dot-mobile'),
          document.getElementById('qb-pwa-status-dot'),
          document.getElementById('drawer-pwa-dot')
        ];
        const badgeEls = [
          document.getElementById('pwa-status-badge'),
          document.getElementById('pwa-status-badge-mobile'),
          document.getElementById('qb-pwa-status-badge'),
          document.getElementById('drawer-pwa-status')
        ];

        let label = 'Offline ready';
        let dotClass = 'bg-[#10402D]';
        let title = 'ShaktiQ works offline. All 2,800+ questions and mock tests are cached.';

        if (status === 'update') {
          label = 'Update available';
          dotClass = 'bg-[#10402D] animate-ping';
          title = 'New questions or updates ready! Click to refresh now.';
          const mobileBadge = document.getElementById('pwa-status-badge-mobile');
          if (mobileBadge) mobileBadge.classList.remove('hidden');
        } else if (status === 'offline' || !navigator.onLine) {
          label = 'Offline mode';
          dotClass = 'bg-[#8A6400]';
          title = 'You are currently offline. All tests, answers, and bookmarks are saved on your device.';
        } else {
          label = 'Offline ready';
          dotClass = 'bg-[#10402D]';
          title = 'ShaktiQ works offline. All 2,800+ questions and mock tests are cached.';
        }

        textEls.forEach(el => { if (el) el.textContent = label; });
        dotEls.forEach(el => {
          if (el) {
            el.className = `w-2 h-2 rounded-full shrink-0 ${dotClass}`;
          }
        });
        badgeEls.forEach(el => {
          if (el) {
            el.title = title;
            if (status === 'update') {
              el.classList.add('border-[#F5DF8B]', 'bg-[#FEF6D6]', 'text-[#785600]');
              el.classList.remove('border-[#C6DEC0]', 'bg-[#EBF3E6]', 'text-[#10402D]');
            } else if (status === 'offline') {
              el.classList.add('border-[#F5DF8B]', 'bg-[#FEF6D6]', 'text-[#785600]');
              el.classList.remove('border-[#C6DEC0]', 'bg-[#EBF3E6]', 'text-[#10402D]');
            } else {
              el.classList.remove('border-[#F5DF8B]', 'bg-[#FEF6D6]', 'text-[#785600]');
              el.classList.add('border-[#C6DEC0]', 'bg-[#EBF3E6]', 'text-[#10402D]');
            }
          }
        });
      }
      window.updatePwaStatus = updatePwaStatus;

      function handlePwaBadgeClick() {
        if (window.waitingServiceWorker) {
          if (typeof showToast === 'function') {
            showToast("Updating ShaktiQ with the latest question bank...", "info");
          }
          window.waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
          setTimeout(() => {
            window.location.reload();
          }, 350);
          return;
        }
        if (!navigator.onLine) {
          if (typeof showToast === 'function') {
            showToast("Working offline. All tests, answers, and bookmarks are preserved on your device.", "info");
          }
        } else {
          if (typeof showToast === 'function') {
            showToast("Offline ready! All 2,800+ questions and mock tests are cached for offline study.", "success");
          }
        }
      }
      window.handlePwaBadgeClick = handlePwaBadgeClick;

      

    document.addEventListener('DOMContentLoaded', () => {
      initIcons();
      setupThemeToggle();
      setupDecodedDropdown();
      setupMobileMenu();
      setupFlipCards();
      setupVideoFilters();
      setupFaq();
      setupPracticeWorkspace();
      initShaktiQExtras();

            // Restore saved PYQ attempts per student
      try {
        userAttempts = loadStudentPracticeAttempts();
      } catch (e) {}

      // Initialize High-Capacity Backend Engine & Restore Aspirant Identity
      PrepBackendEngine.init().then(async () => {
        updateAspirantNavUI();
        flushPendingSheetsQueue();
        const current = getCurrentAspirant();
        if (current && current.email) {
          const token = getAspirantAuthToken();
          if (!token) {
            await requestSessionToken(current.email, current.name);
            loadQuestionsData(true);
          }
        }
      });

      if (window.location.hash === '#practice-bpsc-pyq' || window.location.hash === '#pyq-bank') {
        openPyqBankMode();
      } else if (window.location.hash === '#mistakes') {
        openPyqBankMode();
        if (typeof toggleMistakesFilter === 'function') toggleMistakesFilter(true);
      } else if (window.location.hash === '#test-series') {
        openTestSeriesMode();
      } else if (window.location.hash === '#speed-drills') {
        openSpeedDrills();
      } else if ((window.location.hash || '').toLowerCase().includes('#admin')) {
        openPyqBankMode();
        switchView('manage');
      }
      if (typeof updateAdminUI === 'function') updateAdminUI();

      // PWA Service Worker & Status Indicator
      if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js').then((reg) => {
            updatePwaStatus(navigator.onLine ? 'ready' : 'offline');

            reg.update().catch(() => {});
            window.addEventListener('focus', () => {
              reg.update().catch(() => {});
            });

            if (reg.waiting && navigator.serviceWorker.controller) {
              updatePwaStatus('update', reg.waiting);
            }

            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    updatePwaStatus('update', newWorker);
                    if (typeof showToast === 'function') {
                      showToast("New questions or updates ready! Click 'Update available' to refresh.", "info");
                    }
                  }
                });
              }
            });
          }).catch(() => {});

          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
              if (typeof activeMockTest !== 'undefined' && activeMockTest) {
                if (typeof showToast === 'function') {
                  showToast("Update ready — will apply automatically after your test.", "info");
                }
                return;
              }
              refreshing = true;
              window.location.reload();
            }
          });
        });

        window.addEventListener('online', () => {
          updatePwaStatus('ready');
          if (typeof flushPendingSheetsQueue === 'function') flushPendingSheetsQueue();
          if (typeof showToast === 'function') showToast("Internet connected — syncing progress", "success");
        });

        window.addEventListener('offline', () => {
          updatePwaStatus('offline');
          if (typeof showToast === 'function') showToast("Working offline — test progress is saved locally.", "info");
        });
      }
    });

  
    function setupPracticeWorkspace() {
      const tabBtns = document.querySelectorAll('.practice-tab-btn');
      const panels = {
        bpsc: document.getElementById('practice-panel-bpsc'),
        bssc: document.getElementById('practice-panel-bssc'),
        aedo: document.getElementById('practice-panel-aedo')
      };

      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const exam = btn.getAttribute('data-exam');
          tabBtns.forEach(b => {
            b.className = 'practice-tab-btn px-4 py-2 rounded-xl text-xs font-bold transition-all text-[#3B493F] hover:text-[#111C15] cursor-pointer';
          });
          btn.className = 'practice-tab-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#10402D] text-white shadow-sm cursor-pointer';

          Object.keys(panels).forEach(k => {
            if (panels[k]) {
              if (k === exam) panels[k].classList.remove('hidden');
              else panels[k].classList.add('hidden');
            }
          });
        });
      });

      ['bpsc', 'bssc', 'aedo'].forEach(exam => {
        const container = document.getElementById(exam + '-options');
        const feedback = document.getElementById(exam + '-feedback');
        if (!container) return;

        const opts = container.querySelectorAll('.practice-option-btn');
        opts.forEach(opt => {
          opt.addEventListener('click', () => {
            const isCorrect = opt.getAttribute('data-correct') === 'true';
            opts.forEach(o => {
              const oRight = o.getAttribute('data-correct') === 'true';
              if (oRight) {
                o.className = 'practice-option-btn w-full p-4 rounded-xl bg-[#ECF6E7] border-2 border-[#10402D] text-left text-sm font-bold text-[#10402D] transition-all flex items-center justify-between cursor-pointer';
              } else if (o === opt && !isCorrect) {
                o.className = 'practice-option-btn w-full p-4 rounded-xl bg-rose-50 border-2 border-rose-500 text-left text-sm font-bold text-rose-800 transition-all flex items-center justify-between cursor-pointer';
              } else {
                o.className = 'practice-option-btn w-full p-4 rounded-xl bg-[#F8FAF7] border border-[#DCE6DF] text-left text-sm font-medium text-[#526056] opacity-75 transition-all flex items-center justify-between cursor-pointer';
              }
            });
            if (feedback) feedback.classList.remove('hidden');
          });
        });
      });
    }

    function filterStudioVideos(category, btnElement) {
      document.querySelectorAll('.yt-filter-btn').forEach(btn => {
        btn.className = 'yt-filter-btn px-4 py-2 rounded-xl font-bold transition-all bg-white border border-[#DCE6DF] text-[#223127] hover:text-[#10402D] hover:bg-[#EBF3E6] cursor-pointer';
      });
      if (btnElement) {
        btnElement.className = 'yt-filter-btn px-4 py-2 rounded-xl font-bold transition-all bg-[#10402D] text-white shadow-sm cursor-pointer';
      }

      const cards = document.querySelectorAll('.studio-video-card');
      cards.forEach(card => {
        const cats = card.getAttribute('data-cat') || '';
        if (category === 'all' || cats.includes(category)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }


    // ==========================================
    // ANTI-SCRAPING & CONTENT PROTECTION SUITE
    // ==========================================
    function initContentProtection() {
      // 1. Block Context Menu (Right-Click) on Question Views
      document.addEventListener('contextmenu', function(e) {
        const protectedTarget = e.target.closest('#page-bpsc-pyq-view, #active-test-view, #test-review-modal, #modalQuestionContent, .question-card, .pyq-card');
        if (protectedTarget) {
          e.preventDefault();
          showToast('Right-click inspection is disabled on ShaktiQ to protect exam content.', 'warning');
        }
      });

      // 2. Block Copy Shortcut (Ctrl+C / Cmd+C) on Question Content
      document.addEventListener('copy', function(e) {
        const sel = window.getSelection();
        if (sel && sel.anchorNode && sel.anchorNode.parentElement) {
          const protectedTarget = sel.anchorNode.parentElement.closest('#page-bpsc-pyq-view, #active-test-view, #test-review-modal, #modalQuestionContent, .question-card, .pyq-card');
          if (protectedTarget) {
            e.preventDefault();
            if (e.clipboardData) {
              e.clipboardData.setData('text/plain', 'Questions and test materials are protected under copyright. Practise online at https://shaktiq.com');
            }
            showToast('Copying question content is restricted on ShaktiQ.', 'warning');
          }
        }
      });

      // 3. Block Inspection & Source View Shortcuts (F12, Ctrl+U, Ctrl+Shift+I, Ctrl+S)
      document.addEventListener('keydown', function(e) {
        if (
          e.key === 'F12' ||
          ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) ||
          ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) ||
          ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
        ) {
          e.preventDefault();
          showToast('Keyboard shortcuts are disabled to protect examination integrity.', 'warning');
        }
      });
    
      // Ensure any legacy watermark overlays are completely eliminated
      const legacyOverlay = document.getElementById('security-watermark-overlay');
      if (legacyOverlay) legacyOverlay.remove();

    }
    initContentProtection();

// Admin Lead Export Helper
window.exportLeads = function() { if (typeof exportAllAspirantsCSV === "function") exportAllAspirantsCSV(); };

// Global exports for browser and node test runners
if (typeof window !== 'undefined') {
  window.openTestSeriesMode = openTestSeriesMode;
  window.openSpeedDrills = openSpeedDrills;
  window.openPyqBankMode = openPyqBankMode;
  window.switchMainMode = switchMainMode;
  window.getSubjectInHindi = getSubjectInHindi;
  window.initApp = initApp;
  window.updateYearPillsUI = updateYearPillsUI;
  window.quickResumeAspirant = quickResumeAspirant;
  window.openAspirantRegModal = openAspirantRegModal;
  window.closeAspirantRegModal = closeAspirantRegModal;
  window.saveGoogleSheetsWebhookUrl = saveGoogleSheetsWebhookUrl;
  window.exportAllAspirantsCSV = exportAllAspirantsCSV;
  window.checkRegistrationRateLimit = checkRegistrationRateLimit;
  window.handleAspirantRegistration = handleAspirantRegistration;
  window.switchAspirantAccount = switchAspirantAccount;
  window.eraseMyPersonalData = eraseMyPersonalData;
  window.updateAspirantNavUI = updateAspirantNavUI;
  window.openStudentProfileModal = openStudentProfileModal;
  window.closeStudentProfileModal = closeStudentProfileModal;
  window.downloadMyTestData = downloadMyTestData;
  window.requireAspirant = requireAspirant;
  window.logPyqInteraction = logPyqInteraction;
  window.saveTestAttemptRecord = saveTestAttemptRecord;
  window.getGoogleSheetsEndpoint = getGoogleSheetsEndpoint;
  window.queuePendingSheetPayload = queuePendingSheetPayload;
  window.syncAspirantToGoogleSheets = syncAspirantToGoogleSheets;
  window.flushPendingSheetsQueue = flushPendingSheetsQueue;
  window.initAuth = initAuth;
  window.updateAuthUI = updateAuthUI;
  window.openSignInModal = openSignInModal;
  window.closeSignInModal = closeSignInModal;
  window.requireAuth = requireAuth;
  window.signOutAccount = signOutAccount;
  window.updatePwaStatus = updatePwaStatus;
  window.handlePwaBadgeClick = handlePwaBadgeClick;
  window.setupPracticeWorkspace = setupPracticeWorkspace;
  window.filterStudioVideos = filterStudioVideos;
  window.initContentProtection = initContentProtection;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    openTestSeriesMode,
    openSpeedDrills,
    openPyqBankMode,
    switchMainMode,
    getSubjectInHindi,
    initApp,
    updateYearPillsUI,
    quickResumeAspirant,
    openAspirantRegModal,
    closeAspirantRegModal,
    saveGoogleSheetsWebhookUrl,
    exportAllAspirantsCSV,
    checkRegistrationRateLimit,
    handleAspirantRegistration,
    switchAspirantAccount,
    eraseMyPersonalData,
    updateAspirantNavUI,
    openStudentProfileModal,
    closeStudentProfileModal,
    downloadMyTestData,
    requireAspirant,
    logPyqInteraction,
    saveTestAttemptRecord,
    getGoogleSheetsEndpoint,
    queuePendingSheetPayload,
    syncAspirantToGoogleSheets,
    flushPendingSheetsQueue,
    initAuth,
    updateAuthUI,
    openSignInModal,
    closeSignInModal,
    requireAuth,
    signOutAccount,
    updatePwaStatus,
    handlePwaBadgeClick,
    setupPracticeWorkspace,
    filterStudioVideos,
    initContentProtection
  };
}
