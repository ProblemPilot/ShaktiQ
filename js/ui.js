/**
 * ShaktiQ User Interface & Interactive Components
 * Modular Architecture (Feature 3.2)
 * Manages Lucide icons, Dark/Light Theme, Menus, Accordions, Revision Tabs, Daily Abhyas & Modals
 */

function initIcons() {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }

    // Global Dark / Light Theme Toggle
    function toggleGlobalTheme() {
      const html = document.documentElement;
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        html.classList.add('light');
        try { localStorage.setItem('theme', 'light'); } catch(e){}
      } else {
        html.classList.remove('light');
        html.classList.add('dark');
        try { localStorage.setItem('theme', 'dark'); } catch(e){}
      }
      initIcons();
    }

    function setupThemeToggle() {
      const html = document.documentElement;
      const themeBtn = document.getElementById('theme-toggle-btn');
      const themeMobileBtn = document.getElementById('theme-toggle-mobile');

      if (themeBtn) themeBtn.addEventListener('click', toggleGlobalTheme);
      if (themeMobileBtn) themeMobileBtn.addEventListener('click', toggleGlobalTheme);

      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
          html.classList.remove('dark');
          html.classList.add('light');
        }
      } catch(e){}
    }

    // Portal Dropdown & Mobile Menu
    function setupDecodedDropdown() {
      const dropdownBtn = document.getElementById('decoded-dropdown-btn');
      const dropdownMenu = document.getElementById('decoded-dropdown-menu');
      const chevron = document.getElementById('decoded-dropdown-chevron');
      const container = document.getElementById('decoded-dropdown-container');

      if (!dropdownBtn || !dropdownMenu) return;

      function toggleDropdown(show) {
        const isHidden = dropdownMenu.classList.contains('hidden');
        const shouldShow = show !== undefined ? show : isHidden;

        if (shouldShow) {
          dropdownMenu.classList.remove('hidden');
          setTimeout(() => {
            dropdownMenu.classList.remove('opacity-0', 'scale-95');
            dropdownMenu.classList.add('opacity-100', 'scale-100');
          }, 10);
          dropdownBtn.setAttribute('aria-expanded', 'true');
          if (chevron) chevron.classList.add('rotate-180');
        } else {
          dropdownMenu.classList.remove('opacity-100', 'scale-100');
          dropdownMenu.classList.add('opacity-0', 'scale-95');
          dropdownBtn.setAttribute('aria-expanded', 'false');
          if (chevron) chevron.classList.remove('rotate-180');
          setTimeout(() => {
            dropdownMenu.classList.add('hidden');
          }, 150);
        }
      }

      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
      });

      dropdownMenu.querySelectorAll('a, button').forEach(link => {
        link.addEventListener('click', () => {
          toggleDropdown(false);
        });
      });

      document.addEventListener('click', (e) => {
        if (container && !container.contains(e.target)) {
          toggleDropdown(false);
        }
      });
    }

    function setupMobileMenu() {
      const mobileBtn = document.getElementById('mobile-menu-btn');
      const drawer = document.getElementById('mobile-menu-drawer');
      const openIcon = document.getElementById('mobile-menu-open-icon');
      const closeIcon = document.getElementById('mobile-menu-close-icon');

      if (!mobileBtn || !drawer) return;

      mobileBtn.addEventListener('click', () => {
        const isClosed = drawer.classList.contains('hidden');
        if (isClosed) {
          drawer.classList.remove('hidden');
          if (openIcon) openIcon.classList.add('hidden');
          if (closeIcon) closeIcon.classList.remove('hidden');
        } else {
          drawer.classList.add('hidden');
          if (openIcon) openIcon.classList.remove('hidden');
          if (closeIcon) closeIcon.classList.add('hidden');
        }
      });

      drawer.querySelectorAll('a, button').forEach(link => {
        link.addEventListener('click', () => {
          drawer.classList.add('hidden');
          if (openIcon) openIcon.classList.remove('hidden');
          if (closeIcon) closeIcon.classList.add('hidden');
        });
      });
    }

    function setupFlipCards() {
      const flipCards = document.querySelectorAll('.flip-card');
      flipCards.forEach(card => {
        card.addEventListener('click', () => {
          card.classList.toggle('flipped');
        });
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.classList.toggle('flipped');
          }
        });
      });
    }

    function setupVideoFilters() {
      const filterBtns = document.querySelectorAll('.video-filter-btn');
      const videoCards = document.querySelectorAll('.video-card');

      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.getAttribute('data-filter');

          filterBtns.forEach(b => {
            b.classList.remove('bg-brand-amber', 'text-white', 'shadow-md', 'shadow-amber-600/30');
            b.classList.add('bg-obsidian-800', 'text-slate-300', 'border', 'border-white/5');
          });
          btn.classList.remove('bg-obsidian-800', 'text-slate-300', 'border', 'border-white/5');
          btn.classList.add('bg-brand-amber', 'text-white', 'shadow-md', 'shadow-amber-600/30');

          videoCards.forEach(card => {
            const category = card.getAttribute('data-category');
            if (filter === 'all' || category === filter) {
              card.classList.remove('hidden');
              card.style.opacity = '0';
              setTimeout(() => { card.style.opacity = '1'; }, 20);
            } else {
              card.classList.add('hidden');
            }
          });
        });
      });
    }

    function setupFaq() {
      const triggers = document.querySelectorAll('.faq-trigger');
      triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
          const item = trigger.closest('.faq-item');
          const content = item.querySelector('.faq-content');
          const chevron = trigger.querySelector('.faq-chevron');

          const isHidden = content.classList.contains('hidden');
          if (isHidden) {
            content.classList.remove('hidden');
            if (chevron) chevron.classList.add('rotate-180');
          } else {
            content.classList.add('hidden');
            if (chevron) chevron.classList.remove('rotate-180');
          }
        });
      });
    }

    // Global Seamless Page View Navigation
    function prefersReducedMotion() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function safeScrollToTop() {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }

    function openBpscQuestionBank() {
      const portal = document.getElementById('page-portal-view');
      const qb = document.getElementById('page-bpsc-pyq-view');
      if (portal && qb) {
        portal.classList.add('hidden');
        qb.classList.remove('hidden');
        switchMainMode('pyq');
        safeScrollToTop();
        initIcons();
        try { history.pushState(null, null, '#practice-bpsc-pyq'); } catch(e){}
      }
    }

    function updatePageMeta(meta) {
      if (!meta) return;
      if (meta.title) {
        document.title = meta.title;
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', meta.title);
        const twTitle = document.querySelector('meta[name="twitter:title"]');
        if (twTitle) twTitle.setAttribute('content', meta.title);
      }
      if (meta.description) {
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute('content', meta.description);
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', meta.description);
        const twDesc = document.querySelector('meta[name="twitter:description"]');
        if (twDesc) twDesc.setAttribute('content', meta.description);
      }
      if (meta.url) {
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', meta.url);
        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', meta.url);
        const twUrl = document.querySelector('meta[name="twitter:url"]');
        if (twUrl) twUrl.setAttribute('content', meta.url);
      }
      if (meta.image) {
        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg) ogImg.setAttribute('content', meta.image);
        const twImg = document.querySelector('meta[name="twitter:image"]');
        if (twImg) twImg.setAttribute('content', meta.image);
      }
    }

    function openPortalView() {
      const portal = document.getElementById('page-portal-view');
      const qb = document.getElementById('page-bpsc-pyq-view');
      const qbHeader = document.getElementById('qb-sticky-header');
      if (qbHeader) qbHeader.classList.remove('mock-hide-header-mobile');
      if (portal && qb) {
        qb.classList.add('hidden');
        portal.classList.remove('hidden');
        safeScrollToTop();
        initIcons();
        try { history.pushState(null, null, '#'); } catch(e){}
      }
      updatePageMeta({
        title: "ShaktiQ – Bihar Exam Prep | Decode Bihar's Toughest Exams",
        description: "Practice 2800+ BPSC PYQs based on published answer keys, 22 full-length tests on BPSC pattern, rapid revision sheets, and exam mnemonics",
        url: "https://shaktiq.com/",
        image: "https://shaktiq.com/share-card.png"
      });
    }

    function toggleMobileMoreMenu(e) {
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }
      const menu = document.getElementById('mobileMoreMenuDropdown');
      const btn = document.getElementById('mobileMoreMenuBtn');
      if (!menu) return;
      const isHidden = menu.classList.contains('hidden');
      if (isHidden) {
        menu.classList.remove('hidden');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      } else {
        menu.classList.add('hidden');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    }

    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('mobile-more-menu-wrapper');
      const menu = document.getElementById('mobileMoreMenuDropdown');
      const btn = document.getElementById('mobileMoreMenuBtn');
      if (wrapper && menu && !wrapper.contains(e.target)) {
        menu.classList.add('hidden');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });

    window.addEventListener('popstate', () => {
      if (window.location.hash === '#test-series') {
        openTestSeriesMode();
      } else if (window.location.hash === '#speed-drills') {
        openSpeedDrills();
      } else if (window.location.hash === '#mistakes') {
        openPyqBankMode();
        if (typeof toggleMistakesFilter === 'function') toggleMistakesFilter(true);
      } else if (window.location.hash === '#pyq-bank' || window.location.hash === '#practice-bpsc-pyq') {
        openPyqBankMode();
      } else if ((window.location.hash || '').toLowerCase().includes('#admin')) {
        openPyqBankMode();
        switchView('manage');
      } else {
        openPortalView();
      }
      if (typeof updateAdminUI === 'function') updateAdminUI();
    });

    window.addEventListener('hashchange', () => {
      if (typeof updateAdminUI === 'function') updateAdminUI();
      if ((window.location.hash || '').toLowerCase().includes('#admin')) {
        openPyqBankMode();
        switchView('manage');
      } else if (window.location.hash === '#mistakes') {
        openPyqBankMode();
        if (typeof toggleMistakesFilter === 'function') toggleMistakesFilter(true);
      } else if (window.location.hash === '#speed-drills') {
        openSpeedDrills();
      }
    });

    // Security-Hardened Toast Notification Function (Escapes message via textContent — Zero HTML Injection)
    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const cleanMsg = String(message ?? '');
      // Prevent duplicate identical toasts from stacking
      const existing = container.querySelectorAll('.shaktiq-toast-item');
      for (let i = 0; i < existing.length; i++) {
        if (existing[i].getAttribute('data-msg') === cleanMsg) return;
      }

      const toast = document.createElement('div');
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.setAttribute('data-msg', cleanMsg);
      toast.className = 'shaktiq-toast-item pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#10402D] border border-[#17593F] text-xs text-white font-semibold shadow-xl transition-all duration-300 transform translate-y-3 opacity-0';
      
      const iconWrap = document.createElement('span');
      iconWrap.className = 'shrink-0 flex items-center';
      if (type === 'success') {
        iconWrap.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0"></i>';
      } else if (type === 'error') {
        iconWrap.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 text-rose-400 shrink-0"></i>';
      } else {
        iconWrap.innerHTML = '<i data-lucide="info" class="w-4 h-4 text-emerald-400 shrink-0"></i>';
      }

      const msgSpan = document.createElement('span');
      // SECURITY: Use textContent so user-entered names or strings can NEVER inject HTML/XSS
      msgSpan.textContent = String(message ?? '');

      toast.appendChild(iconWrap);
      toast.appendChild(msgSpan);
      container.appendChild(toast);
      initIcons();

      setTimeout(() => {
        toast.classList.remove('translate-y-3', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      }, 10);

      setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-3', 'opacity-0');
        setTimeout(() => {
          if (container.contains(toast)) container.removeChild(toast);
        }, 300);
      }, 4000);
    }

function switchRevisionTab(tabKey) {
      const tabs = ['bihar', 'history', 'aedo', 'polity', 'science'];
      tabs.forEach(k => {
        const btn = document.getElementById('rev-tab-btn-' + k);
        const panel = document.getElementById('rev-panel-' + k);
        if (btn) {
          if (k === tabKey) {
            btn.className = 'rev-tab-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#10402D] text-white shadow-sm transition cursor-pointer';
          } else {
            btn.className = 'rev-tab-btn px-4 py-2 rounded-xl text-xs font-bold bg-white border border-[#DCE6DF] text-[#223127] hover:bg-[#EBF3E6] transition cursor-pointer';
          }
        }
        if (panel) {
          if (k === tabKey) panel.classList.remove('hidden');
          else panel.classList.add('hidden');
        }
      });
    }

    function jumpToSubjectPractice(subjectName) {
      openPyqBankMode();
      setTimeout(() => {
        const pill = document.querySelector(`[data-subject="${subjectName}"]`);
        if (pill) pill.click();
      }, 200);
    }

    // Daily Abhyas Goal & Progress Tracker (Genuine 24-Hour Cycle with Midnight Reset)
    let abhyasDailyGoal = parseInt(localStorage.getItem('shaktiq_daily_goal') || '50', 10);
    function getAbhyasSolvedCount() {
      try {
        const prefix = getStudentStoragePrefix();
        const tsMap = JSON.parse(localStorage.getItem(prefix + '_timestamps') || '{}');
        const now = Date.now();
        // Calculate midnight (00:00:00) of current local calendar day
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTodayMs = startOfToday.getTime();

        const allMap = {};
        getAllQuestions().forEach(q => { allMap[q.id] = q; });

        const recordedKeys = Object.keys(tsMap);
        if (recordedKeys.length > 0) {
          // Count unique questions solved today (since midnight local time)
          return recordedKeys.filter(qid => allMap[qid] && !isMainsDescriptiveQuestion(allMap[qid]) && tsMap[qid] >= startOfTodayMs).length;
        }

        // Seamless migration: If student practiced questions in this session before timestamps existed,
        // seed their current session's attempts with today's timestamp so progress is preserved
        const attemptsObj = JSON.parse(localStorage.getItem(prefix + '_practice') || localStorage.getItem('bpsc_practice_attempts_v1') || '{}');
        const qids = Object.keys(attemptsObj).filter(qid => allMap[qid] && !isMainsDescriptiveQuestion(allMap[qid]));
        if (qids.length > 0 && !localStorage.getItem(prefix + '_timestamps_seeded')) {
          const seededMap = {};
          qids.forEach(qid => { seededMap[qid] = now; });
          try {
            localStorage.setItem(prefix + '_timestamps', JSON.stringify(seededMap));
            localStorage.setItem(prefix + '_timestamps_seeded', 'true');
          } catch (e) {}
          return qids.length;
        }

        return 0;
      } catch (e) {
        return 0;
      }
    }

    function updateAbhyasUI() {
      const solved = getAbhyasSolvedCount();
      const solvedEl = document.getElementById('abhyas-solved-today');
      const targetEl = document.getElementById('abhyas-daily-target-label');
      const barEl = document.getElementById('abhyas-progress-bar');
      const msgEl = document.getElementById('abhyas-status-msg');

      if (solvedEl) solvedEl.textContent = solved;
      if (targetEl) targetEl.textContent = abhyasDailyGoal;
      const pct = Math.min(100, Math.round((solved / abhyasDailyGoal) * 100));
      if (barEl) barEl.style.width = pct + '%';

      [25, 50, 100].forEach(g => {
        const b = document.getElementById('goal-btn-' + g);
        if (b) {
          b.className = (g === abhyasDailyGoal)
            ? 'px-3 py-1.5 rounded-xl text-xs font-bold bg-[#10402D] text-white cursor-pointer'
            : 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#DCE6DF] text-[#223127] cursor-pointer';
        }
      });

      if (msgEl) {
        if (solved === 0) {
          msgEl.textContent = 'Today\'s 24-hr study cycle is active. Solve questions in the PYQ Bank or Mock Tests to fill today\'s bar!';
        } else if (solved >= abhyasDailyGoal) {
          msgEl.textContent = `🎉 Incredible! You reached 100% of today's ${abhyasDailyGoal}-question goal (${solved} solved today)! Resets at midnight.`;
        } else {
          msgEl.textContent = `Today: ${solved} solved (${pct}%). Only ${abhyasDailyGoal - solved} more questions to complete today's target! Resets at midnight.`;
        }
      }
    }

    function setAbhyasGoal(goal) {
      abhyasDailyGoal = goal;
      try { localStorage.setItem('shaktiq_daily_goal', String(goal)); } catch (e) {}
      updateAbhyasUI();
      showToast(`Daily Abhyas goal set to ${goal} questions`, 'success');
    }

    function initShaktiQExtras() {
      updateAbhyasUI();
    }

window.openLegalPolicyModal = openLegalModal;
    function openLegalModal(tab = 'privacy') {
      const modal = document.getElementById('legal-policy-modal');
      if (modal) {
        modal.classList.remove('hidden');
        switchLegalTab(tab);
        initIcons();
      }
    }

    function closeLegalModal() {
      const modal = document.getElementById('legal-policy-modal');
      if (modal) modal.classList.add('hidden');
    }

    function switchLegalTab(tab) {
      ['privacy', 'terms', 'contact'].forEach(t => {
        const btn = document.getElementById('legal-tab-btn-' + t);
        const panel = document.getElementById('legal-panel-' + t);
        if (btn) {
          btn.className = (t === tab)
            ? 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#10402D] text-white cursor-pointer'
            : 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F8FAF7] text-[#223127] border border-[#DCE6DF] cursor-pointer';
        }
        if (panel) {
          if (t === tab) panel.classList.remove('hidden');
          else panel.classList.add('hidden');
        }
      });
    }

// Global exports for browser and node test runners
if (typeof window !== 'undefined') {
  window.initIcons = initIcons;
  window.toggleGlobalTheme = toggleGlobalTheme;
  window.setupThemeToggle = setupThemeToggle;
  window.setupDecodedDropdown = setupDecodedDropdown;
    window.setupMobileMenu = setupMobileMenu;
  window.setupFlipCards = setupFlipCards;
  window.setupVideoFilters = setupVideoFilters;
  window.setupFaq = setupFaq;
  window.prefersReducedMotion = prefersReducedMotion;
  window.safeScrollToTop = safeScrollToTop;
  window.openBpscQuestionBank = openBpscQuestionBank;
  window.updatePageMeta = updatePageMeta;
  window.openPortalView = openPortalView;
  window.toggleMobileMoreMenu = toggleMobileMoreMenu;
  window.showToast = showToast;
  window.switchRevisionTab = switchRevisionTab;
  window.jumpToSubjectPractice = jumpToSubjectPractice;
  window.getAbhyasSolvedCount = getAbhyasSolvedCount;
  window.updateAbhyasUI = updateAbhyasUI;
  window.setAbhyasGoal = setAbhyasGoal;
  window.initShaktiQExtras = initShaktiQExtras;
  window.openLegalModal = openLegalModal;
  window.closeLegalModal = closeLegalModal;
  window.switchLegalTab = switchLegalTab;
  window.openLegalPolicyModal = openLegalModal;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initIcons,
    toggleGlobalTheme,
    setupThemeToggle,
    setupDecodedDropdown,
        setupMobileMenu,
    setupFlipCards,
    setupVideoFilters,
    setupFaq,
    prefersReducedMotion,
    safeScrollToTop,
    openBpscQuestionBank,
    updatePageMeta,
    openPortalView,
    toggleMobileMoreMenu,
    showToast,
    switchRevisionTab,
    jumpToSubjectPractice,
    getAbhyasSolvedCount,
    updateAbhyasUI,
    setAbhyasGoal,
    initShaktiQExtras,
    openLegalModal,
    closeLegalModal,
    switchLegalTab
  };
}
