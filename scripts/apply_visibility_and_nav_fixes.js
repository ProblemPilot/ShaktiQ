// scripts/apply_visibility_and_nav_fixes.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');

// 1. Permanently disable #nav-mock-cta-pill so Sign In is ALWAYS visible at 90%, 100%, and all zoom levels
const oldNavMockCss = `/* Hide redundant 22 Mock Tests pill on desktop navigation unless on ultra-wide screens (1600px+) */
#nav-mock-cta-pill {
  display: none !important;
}
@media (min-width: 1600px) {
  #nav-mock-cta-pill {
    display: inline-flex !important;
  }
}

/* Under 1440px (standard laptops & 100% zoom with Windows scaling), hide secondary links so Sign In is prominently displayed */
@media (max-width: 1440px) {
  .nav-extra-link {
    display: none !important;
  }
}`;

const newNavMockCss = `/* Permanently hide redundant mock CTA pill in desktop navbar to guarantee zero navbar overflow at all zoom levels (90%, 100%, 125%) */
#nav-mock-cta-pill {
  display: none !important;
}

/* On medium/intermediate screens (< 1280px or when zoomed in), hide secondary links to guarantee Sign In never overflows */
@media (max-width: 1280px) {
  .nav-extra-link {
    display: none !important;
  }
}`;

if (html.includes(oldNavMockCss)) {
  html = html.replace(oldNavMockCss, newNavMockCss);
  console.log('✅ Updated navbar responsive CSS: permanently hid #nav-mock-cta-pill and set 1280px breakpoint for extra links.');
} else {
  console.warn('⚠️ Could not find exact oldNavMockCss block.');
}

// 2. High Contrast Workspace Mode Switcher & Subnav CSS
const oldWorkspaceCss = `  /* Workspace Mode Switcher - High Contrast Guarantee */
  #workspace-mode-btn-testseries.mode-active,
  #workspace-mode-btn-pyq.mode-active {
    background-color: #10402D !important;
    color: #FFFFFF !important;
  }
  #workspace-mode-btn-testseries.mode-active svg,
  #workspace-mode-btn-pyq.mode-active svg {
    color: #FCE27B !important;
  }
  #workspace-mode-btn-testseries.mode-inactive,
  #workspace-mode-btn-pyq.mode-inactive {
    background-color: transparent !important;
    color: #223127 !important;
  }
  #workspace-mode-btn-testseries.mode-inactive svg {
    color: #B45309 !important;
  }
  #workspace-mode-btn-pyq.mode-inactive svg {
    color: #10402D !important;
  }
  #workspace-mode-btn-testseries.mode-inactive:hover,
  #workspace-mode-btn-pyq.mode-inactive:hover {
    color: #10402D !important;
    background-color: #EBF3E6 !important;
  }

  /* Subnav Buttons - High Contrast Guarantee */
  .subnav-btn.subnav-active {
    background-color: #EBF3E6 !important;
    color: #10402D !important;
    border-color: #C6DEC0 !important;
  }
  .subnav-btn.subnav-inactive {
    background-color: #FFFFFF !important;
    color: #223127 !important;
    border-color: #DCE6DF !important;
  }
  .subnav-btn.subnav-inactive:hover {
    background-color: #F8FAF7 !important;
    color: #10402D !important;
  }`;

const newWorkspaceCss = `  /* Workspace Mode Switcher - High Contrast Guarantee */
  #workspace-mode-btn-testseries.mode-active,
  #workspace-mode-btn-pyq.mode-active {
    background-color: #10402D !important;
    color: #FFFFFF !important;
    border: 1px solid #10402D !important;
  }
  #workspace-mode-btn-testseries.mode-active svg,
  #workspace-mode-btn-pyq.mode-active svg,
  #workspace-mode-btn-testseries.mode-active i,
  #workspace-mode-btn-pyq.mode-active i {
    color: #FCE27B !important;
  }
  #workspace-mode-btn-testseries.mode-inactive,
  #workspace-mode-btn-pyq.mode-inactive {
    background-color: #FFFFFF !important;
    color: #10402D !important;
    border: 1px solid #DCE6DF !important;
  }
  #workspace-mode-btn-testseries.mode-inactive svg,
  #workspace-mode-btn-pyq.mode-inactive svg,
  #workspace-mode-btn-testseries.mode-inactive i,
  #workspace-mode-btn-pyq.mode-inactive i {
    color: #10402D !important;
  }
  #workspace-mode-btn-testseries.mode-inactive:hover,
  #workspace-mode-btn-pyq.mode-inactive:hover {
    color: #10402D !important;
    background-color: #EBF3E6 !important;
    border-color: #C6DEC0 !important;
  }

  /* Subnav Buttons - High Contrast Guarantee */
  .subnav-btn.subnav-active {
    background-color: #EBF3E6 !important;
    color: #10402D !important;
    border: 1px solid #C6DEC0 !important;
    font-weight: 700 !important;
  }
  .subnav-btn.subnav-active svg,
  .subnav-btn.subnav-active i {
    color: #10402D !important;
  }
  .subnav-btn.subnav-inactive {
    background-color: #FFFFFF !important;
    color: #111C15 !important;
    border: 1px solid #DCE6DF !important;
    font-weight: 600 !important;
  }
  .subnav-btn.subnav-inactive svg,
  .subnav-btn.subnav-inactive i {
    color: #526056 !important;
  }
  .subnav-btn.subnav-inactive:hover {
    background-color: #F8FAF7 !important;
    color: #10402D !important;
    border-color: #C6DEC0 !important;
  }
  .subnav-btn.subnav-inactive:hover svg,
  .subnav-btn.subnav-inactive:hover i {
    color: #10402D !important;
  }`;

if (html.includes(oldWorkspaceCss)) {
  html = html.replace(oldWorkspaceCss, newWorkspaceCss);
  console.log('✅ Updated mode switcher and subnav CSS for crisp high contrast.');
} else {
  console.warn('⚠️ Could not find exact oldWorkspaceCss block.');
}

// 3. Update switchView function to preserve inline-flex layout and update mode buttons
const oldSubnavSwitchView = `      // Update pyq-subnav active button styling
      const subnavMap = {
        'bank': 'subnav-btn-bank',
        'analytics': 'subnav-btn-analytics',
        'exams': 'subnav-btn-exams',
        'practice': 'subnav-btn-practice',
        'manage': 'subnav-btn-manage'
      };
      Object.keys(subnavMap).forEach(key => {
        const btn = document.getElementById(subnavMap[key]);
        if (btn) {
          if (key === viewName) {
            btn.className = 'subnav-btn subnav-active px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#10402D] bg-[#EBF3E6] border border-[#C6DEC0] cursor-pointer shadow-2xs';
          } else {
            btn.className = 'subnav-btn subnav-inactive px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#223127] hover:text-[#10402D] bg-white border border-[#DCE6DF] hover:bg-[#F8FAF7] cursor-pointer shadow-2xs';
          }
        }
      });`;

const newSubnavSwitchView = `      // Update pyq-subnav active button styling
      const subnavMap = {
        'bank': 'subnav-btn-bank',
        'analytics': 'subnav-btn-analytics',
        'exams': 'subnav-btn-exams',
        'practice': 'subnav-btn-practice',
        'manage': 'subnav-btn-manage'
      };
      Object.keys(subnavMap).forEach(key => {
        const btn = document.getElementById(subnavMap[key]);
        if (btn) {
          if (key === viewName) {
            btn.className = 'subnav-btn subnav-active px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#10402D] bg-[#EBF3E6] border border-[#C6DEC0] cursor-pointer shadow-2xs inline-flex items-center gap-1.5';
          } else {
            btn.className = 'subnav-btn subnav-inactive px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#111C15] hover:text-[#10402D] bg-white border border-[#DCE6DF] hover:bg-[#F8FAF7] cursor-pointer shadow-2xs inline-flex items-center gap-1.5';
          }
        }
      });

      // Synchronize workspace mode buttons with viewName
      const btnTS = document.getElementById('workspace-mode-btn-testseries');
      const btnPYQ = document.getElementById('workspace-mode-btn-pyq');
      if (viewName === 'testseries') {
        if (btnTS) btnTS.className = 'mode-active flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-[#10402D] text-white border border-[#10402D] shadow-sm cursor-pointer';
        if (btnPYQ) btnPYQ.className = 'mode-inactive flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-[#10402D] bg-white hover:bg-[#EBF3E6] border border-[#DCE6DF] cursor-pointer';
      } else {
        if (btnTS) btnTS.className = 'mode-inactive flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-[#10402D] bg-white hover:bg-[#EBF3E6] border border-[#DCE6DF] cursor-pointer';
        if (btnPYQ) btnPYQ.className = 'mode-active flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-[#10402D] text-white border border-[#10402D] shadow-sm cursor-pointer';
      }`;

if (html.includes(oldSubnavSwitchView)) {
  html = html.replace(oldSubnavSwitchView, newSubnavSwitchView);
  console.log('✅ Updated switchView to synchronize mode buttons and preserve inline-flex layout.');
} else {
  console.warn('⚠️ Could not find exact oldSubnavSwitchView block.');
}

// 4. Update switchMainMode so that pyqSubNav stays visible and mode buttons have crisp styling
const oldSwitchMainMode = `    function switchMainMode(mode) {
      currentAppMode = mode;
      const btnTS = document.getElementById('workspace-mode-btn-testseries');
      const btnPYQ = document.getElementById('workspace-mode-btn-pyq');
      const pyqSubNav = document.getElementById('pyq-subnav');

      if (mode === 'testseries') {
        if (btnTS) {
          btnTS.className = 'mode-active flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-[#10402D] text-white shadow-sm cursor-pointer';
        }
        if (btnPYQ) {
          btnPYQ.className = 'mode-inactive flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-[#223127] hover:text-[#10402D] hover:bg-[#F6F7F2] cursor-pointer';
        }
        if (pyqSubNav) pyqSubNav.classList.add('hidden');
        switchView('testseries');
      } else {
        if (btnTS) {
          btnTS.className = 'mode-inactive flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-[#223127] hover:text-[#10402D] hover:bg-[#F6F7F2] cursor-pointer';
        }
        if (btnPYQ) {
          btnPYQ.className = 'mode-active flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-[#10402D] text-white shadow-sm cursor-pointer';
        }
        if (pyqSubNav) pyqSubNav.classList.remove('hidden');
        switchView('bank');
      }
      initIcons();
    }`;

const newSwitchMainMode = `    function switchMainMode(mode) {
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
    }`;

if (html.includes(oldSwitchMainMode)) {
  html = html.replace(oldSwitchMainMode, newSwitchMainMode);
  console.log('✅ Updated switchMainMode: pyqSubNav stays accessible across modes, mode buttons have high contrast.');
} else {
  console.warn('⚠️ Could not find exact oldSwitchMainMode block.');
}

// 5. Update initial HTML for pyq-subnav to remove initial hidden class so subnav is immediately visible
html = html.replace(
  '<div id="pyq-subnav" class="hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar">',
  '<div id="pyq-subnav" class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">'
);
console.log('✅ Removed initial hidden class from pyq-subnav.');

fs.writeFileSync(file, html, 'utf8');
console.log('Done applying updates to index.html!');
