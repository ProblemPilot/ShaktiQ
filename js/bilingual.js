/**
 * ShaktiQ Bilingual Translation & Language Switching Engine
 * Modular Architecture (Feature 3.2)
 */

const OPTION_PREFIX_REGEX = /^\s*(?:\((?:[A-Ea-e1-5१-५]|ए|बी|सी|डी|ई|क|ख|ग|घ|ङ)\)|(?:[A-Ea-e1-5१-५]|ए|बी|सी|डी|ई|क|ख|ग|घ|ङ)[\).:-])\s*/i;

    function stripOptionPrefix(text) {
      if (!text) return "";
      return String(text).trim().replace(OPTION_PREFIX_REGEX, "");
    }

    function cleanQuestionStem(text) {
      if (!text || typeof text !== "string") return "";
      let s = text.trim();
      s = s.replace(/^[.\s—–-]+/, "");
      return s;
    }

    function formatBilingualOption(optText, index, isHi) {
      const letters = ["A", "B", "C", "D", "E"];
      const letter = letters[index] || "A";
      if (!optText) return `(${letter}) `;
      const raw = String(optText).trim();
      let body = stripOptionPrefix(raw);

      if (index === 4 && isHi) {
        const lower = body.toLowerCase();
        if (lower.includes("none of the above") && lower.includes("more than one")) {
          body = "उपर्युक्त में से कोई नहीं / उपर्युक्त में से एक से अधिक";
        } else if (lower.includes("none of the above")) {
          body = "उपर्युक्त में से कोई नहीं";
        } else if (lower.includes("more than one of the above")) {
          body = "उपर्युक्त में से एक से अधिक";
        } else if (lower.includes("not attempted")) {
          body = "अनुत्तरित प्रश्न (सुरक्षित छोड़ें • 0 अंक कटेगा)";
        }
      }

      return `(${letter}) ${body}`;
    }

// ==========================================
    // SHAKTIQ BILINGUAL ENGINE (HINDI & ENGLISH)
    // ==========================================
    const ShaktiQBilingualEngine = {
      currentLang: localStorage.getItem('shaktiq_preferred_lang') || 'en',
      cacheKey: 'shaktiq_hi_translations_v2',
      cache: {},

      init() {
        try {
          const stored = localStorage.getItem(this.cacheKey);
          if (stored) this.cache = JSON.parse(stored);
        } catch (e) {
          this.cache = {};
        }
        this.updateButtonsUI();
      },

      saveCache() {
        try {
          const keys = Object.keys(this.cache);
          if (keys.length > 1500) {
            const trimmed = {};
            keys.slice(-1000).forEach(k => { trimmed[k] = this.cache[k]; });
            this.cache = trimmed;
          }
          localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
        } catch (e) {}
      },

      getCachedQuestion(idOrText) {
        if (!idOrText) return null;
        const key = 'q_' + String(idOrText).substring(0, 60);
        const item = this.cache[key] || null;
        if (item && Array.isArray(item.options)) {
          item.options = item.options.map((opt, i) => formatBilingualOption(opt, i, true));
        }
        return item;
      },

      setCachedQuestion(idOrText, bundle) {
        if (!idOrText) return;
        const key = 'q_' + String(idOrText).substring(0, 60);
        this.cache[key] = bundle;
        this.saveCache();
      },

      async translateQuestionBundle(idOrText, qText, options, exp) {
        const cached = this.getCachedQuestion(idOrText);
        const expectedCount = (options && options.length) ? options.length : 0;
        if (cached && Array.isArray(cached.options) && cached.options.length >= expectedCount) {
          return cached;
        }

        const safeOpts = (options && options.length) ? options.slice(0, 5) : [];
        const optBodies = safeOpts.map((opt) => stripOptionPrefix(opt));
        const delimiter = '\n|||\n';
        const combined = [cleanQuestionStem(qText || ''), ...optBodies, exp || ''].join(delimiter);

        try {
          const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=' + encodeURIComponent(combined);
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          if (!res.ok) throw new Error('Translation failed');
          const data = await res.json();
          const fullTranslated = data[0].map(x => x[0]).join('');
          const parts = fullTranslated.split(/\n?\|\|\|\n?/);

          const rawTranslatedOpts = parts.slice(1, 1 + safeOpts.length);
          const finalOpts = safeOpts.map((originalOpt, i) => {
            const trBody = rawTranslatedOpts[i] || stripOptionPrefix(originalOpt);
            return formatBilingualOption(trBody, i, true);
          });

          const bundle = {
            q: cleanQuestionStem(parts[0] || qText),
            options: finalOpts,
            exp: parts[parts.length - 1] || exp
          };

          this.setCachedQuestion(idOrText, bundle);
          return bundle;
        } catch (e) {
          const fallback = {
            q: cleanQuestionStem(qText),
            options: safeOpts.map((o, i) => formatBilingualOption(o, i, true)),
            exp: exp
          };
          return fallback;
        }
      },

      updateButtonsUI() {
        const lang = this.currentLang;
        document.querySelectorAll('.lang-switch-btn').forEach(btn => {
          const btnLang = btn.getAttribute('data-lang-btn');
          if (btnLang === lang) {
            btn.className = 'lang-switch-btn px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer font-bold bg-[#10402D] text-white shadow-xs';
          } else {
            btn.className = 'lang-switch-btn px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer font-bold text-[#223127] hover:text-[#10402D]';
          }
        });
        document.querySelectorAll('.sq-lang-btn').forEach(btn => {
          const btnLang = btn.getAttribute('data-lang-btn');
          const active = btnLang === lang;
          btn.classList.toggle('sq-lang-active', active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        syncHomePageLanguage(lang);
      }
    };

    const HOME_I18N_DICT = {
      en: {
        brand_title: 'Shakti Question Bank',
        nav_practice: 'Practice',
        nav_mocks: 'Mock Tests',
        nav_drills: 'Speed Drills',
        nav_predictor: 'Predictor',
        nav_profile: 'Aspirant Profile',
        hero_subtitle: 'A free, serene sanctuary for Bihar & competitive exam mastery.',
        cta_practice: 'Start Practicing',
        cta_mock: 'Take Mock Test',
        gateway_heading: 'Choose Your Path',
        tag_bpsc: '72nd & 73rd CCE mocks',
        tag_bssc: 'Secretariat Assistant prep',
        tag_aedo: '6 full 2-hour papers',
        title_pyqs: 'PYQs',
        tag_pyqs: '2,800+ subject-wise questions',
        title_predictor: 'Predictor',
        tag_predictor: '25 curated 2027 questions',
        footer_dedication: 'Free Forever for Every Learner',
        footer_privacy: 'Privacy & DPDP',
        footer_terms: 'Terms',
        footer_contact: 'Contact',
        footer_disclaimer: 'Independent educational platform · Not affiliated with BPSC, BSSC, or the Government of Bihar.'
      },
      hi: {
        brand_title: 'Shakti Question Bank',
        nav_practice: 'अभ्यास',
        nav_mocks: 'मॉक टेस्ट',
        nav_drills: 'स्पीड ड्रिल',
        nav_predictor: 'प्रेडिक्टर',
        nav_profile: 'अभ्यर्थी प्रोफ़ाइल',
        hero_subtitle: 'बिहार एवं प्रतियोगी परीक्षाओं की शांत, निःशुल्क अभ्यास स्थली।',
        cta_practice: 'अभ्यास शुरू करें',
        cta_mock: 'मॉक टेस्ट दें',
        gateway_heading: 'अपना परीक्षा मार्ग चुनें',
        tag_bpsc: '72वीं व 73वीं CCE मॉक टेस्ट',
        tag_bssc: 'सचिवालय सहायक अभ्यास पैक',
        tag_aedo: '6 पूर्ण 2-घंटे के प्रश्नपत्र',
        title_pyqs: 'PYQ बैंक',
        tag_pyqs: '2,800+ विषयवार विगत प्रश्न',
        title_predictor: 'प्रेडिक्टर',
        tag_predictor: '25 संभावित 2027 प्रश्न',
        footer_dedication: 'प्रत्येक विद्यार्थी के लिए सदैव निःशुल्क',
        footer_privacy: 'गोपनीयता एवं DPDP',
        footer_terms: 'शर्तें',
        footer_contact: 'संपर्क',
        footer_disclaimer: 'स्वतंत्र शैक्षणिक मंच · BPSC, BSSC या बिहार सरकार से संबद्ध नहीं।'
      }
    };

    function syncHomePageLanguage(lang) {
      const dict = HOME_I18N_DICT[lang === 'hi' ? 'hi' : 'en'];
      document.querySelectorAll('[data-home-i18n]').forEach(el => {
        const key = el.getAttribute('data-home-i18n');
        if (key && dict[key]) {
          el.textContent = dict[key];
        }
      });
    }

    function setGlobalAppLanguage(lang) {
      if (lang !== 'en' && lang !== 'hi') lang = 'en';
      ShaktiQBilingualEngine.currentLang = lang;
      document.documentElement.lang = lang;
      try {
        localStorage.setItem('shaktiq_preferred_lang', lang);
      } catch (e) {}

      document.documentElement.lang = ShaktiQBilingualEngine.currentLang;
      ShaktiQBilingualEngine.updateButtonsUI();

      if (typeof window !== 'undefined' && window.ShaktiAI && typeof window.ShaktiAI.setLanguage === 'function') {
        window.ShaktiAI.setLanguage(lang === 'hi' ? 'hi' : 'en');
      }

      // If in Mock Test Taking view: re-render question immediately
      const testWs = document.getElementById('test-taking-workspace');
      if (testWs && !testWs.classList.contains('hidden')) {
        renderCurrentQuestion();
      }

      // If in Solution Review view: re-render solution question immediately
      const solWs = document.getElementById('test-solution-workspace');
      if (solWs && !solWs.classList.contains('hidden')) {
        renderCurrentSolutionQuestion();
      }

      // If in PYQ Bank view: re-render feed
      const bankView = document.getElementById('view-bank');
      if (bankView && !bankView.classList.contains('hidden')) {
        renderQuestions();
      }

      // Update Mobile Palette & Modal Labels
      const isHi = (lang === 'hi');
      const setTxt = (id, enVal, hiVal) => {
        const el = document.getElementById(id);
        if (el) el.textContent = isHi ? hiVal : enVal;
      };
      setTxt('tt-palette-modal-title', 'Question Palette', 'प्रश्न तालिका');
      setTxt('tt-mobile-label-answered', 'Answered', 'उत्तरित');
      setTxt('tt-mobile-label-review', 'Review', 'समीक्षा');
      setTxt('tt-mobile-label-skipped', 'Skipped', 'छोड़ा गया');
      setTxt('tt-mobile-label-unvisited', 'Not Visited', 'नहीं देखा');
      setTxt('tt-mobile-palette-continue-btn', 'Continue Test', 'परीक्षा जारी रखें');
      setTxt('tt-mobile-palette-submit-btn', 'Submit Test', 'परीक्षा जमा करें');
      setTxt('desktop-print-label', 'Print / Save PDF', 'प्रिंट / पीडीएफ सहेजें');
      setTxt('mobile-more-label-print', 'Print / Save PDF', 'प्रिंट / पीडीएफ सहेजें');
      setTxt('share-modal-title', 'Share Your Mock Result', 'परीक्षा परिणाम साझा करें');
      setTxt('copy-btn-label', 'Copy Text', 'टेक्स्ट कॉपी करें');
      setTxt('share-img-label', 'Score Card', 'स्कोर कार्ड');

      // OMR bilingual labels
      setTxt('tt-omr-title', 'BPSC Virtual OMR Answer Sheet', 'बीपीएससी वर्चुअल ओएमआर उत्तर पत्रक');
      setTxt('tt-omr-subtitle', 'Darken one bubble per question (A to E). Option E indicates Safe Skip (0 deduction).', 'प्रत्येक प्रश्न के लिए एक गोला भरें (A से E)। विकल्प E सुरक्षित छोड़ें (0 अंक कटेगा)।');
      setTxt('tt-omr-label-total', 'Total Questions', 'कुल प्रश्न');
      setTxt('tt-omr-label-answered', 'Bubbled', 'भरे गए');
      setTxt('tt-omr-label-safeskip', 'Safe Skip (E)', 'सुरक्षित छोड़ें (E)');
      setTxt('tt-omr-label-blank', 'Blank', 'रिक्त');
      setTxt('tt-mobile-view-heading', 'Mode:', 'मोड:');
      setTxt('tt-mobile-omr-switch-card-btn', 'Card View', 'कार्ड व्यू');
      setTxt('tt-mobile-omr-submit-btn', 'Submit Test', 'परीक्षा जमा करें');
      document.querySelectorAll('.tt-view-card-text').forEach(el => el.textContent = isHi ? 'कार्ड व्यू' : 'Card View');
      document.querySelectorAll('.tt-view-omr-text').forEach(el => el.textContent = isHi ? 'ओएमआर शीट' : 'OMR Sheet');

      // Exam Packs Bilingual Filter Labels
      const bsscCount = (typeof CURATED_TESTS !== 'undefined' && Array.isArray(CURATED_TESTS))
        ? CURATED_TESTS.filter(t => t.category === 'BSSC').length
        : 0;
      if (bsscCount > 0) {
        setTxt('ts-filter-bssc-label', `BSSC Packs (${bsscCount})`, `बीएसएससी पैक्स (${bsscCount})`);
      } else {
        setTxt('ts-filter-bssc-label', 'BSSC Packs (Placeholder)', 'बीएसएससी पैक्स (प्रारूप)');
      }

      // Re-render Test Series cards if currently on test series view to sync bilingual labels
      const tsView = document.getElementById('view-testseries');
      if (tsView && !tsView.classList.contains('hidden') && typeof renderTestSeriesCards === 'function') {
        const activeCat = (typeof currentTestSeriesFilter !== 'undefined' && currentTestSeriesFilter) ? currentTestSeriesFilter : 'ALL';
        renderTestSeriesCards(activeCat);
      }

      // If result modal is open, re-render cutoff meter bilingual text
      const resModal = document.getElementById('tt-result-modal');
      if (resModal && !resModal.classList.contains('hidden') && typeof renderCutoffMeter === 'function') {
        const scoreEl = document.getElementById('tt-result-score');
        const totalLabel = document.getElementById('tt-result-total-label');
        const scoreVal = scoreEl ? parseFloat(scoreEl.textContent) : 0;
        let totalVal = 150;
        if (totalLabel && totalLabel.textContent.includes('/')) {
          const match = totalLabel.textContent.match(/\/\s*(\d+)/);
          if (match) totalVal = parseInt(match[1], 10);
        }
        renderCutoffMeter(scoreVal, totalVal);
      }

      const toastMsg = (lang === 'hi') 
        ? 'माध्यम हिन्दी में बदला गया (Medium set to Hindi)' 
        : 'Medium set to English';
      showToast(toastMsg, 'info');
      initIcons();
    }

// Global exports
if (typeof window !== 'undefined') {
  window.OPTION_PREFIX_REGEX = OPTION_PREFIX_REGEX;
  window.stripOptionPrefix = stripOptionPrefix;
  window.cleanQuestionStem = cleanQuestionStem;
  window.formatBilingualOption = formatBilingualOption;
  window.ShaktiQBilingualEngine = ShaktiQBilingualEngine;
  window.setGlobalAppLanguage = setGlobalAppLanguage;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OPTION_PREFIX_REGEX,
    stripOptionPrefix,
    cleanQuestionStem,
    formatBilingualOption,
    ShaktiQBilingualEngine,
    setGlobalAppLanguage
  };
}
