const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add CSS Protection
const cssSnippet = `/* Anti-Scraping & Copy Protection */
.no-copy,
#page-bpsc-pyq-view,
#active-test-view,
#test-review-modal,
#modalQuestionContent,
.question-card,
.pyq-card,
.practice-option-btn,
.ans-box,
.exam-question-item,
[data-qid] {
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
}

#security-watermark-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background-repeat: repeat;
  background-size: 340px 200px;
}
`;

if (!content.includes('Anti-Scraping & Copy Protection')) {
  content = content.replace(
    '/* Tailwind Standalone CSS - Precompiled for Ultra-Fast Village Mobile Loading */',
    cssSnippet + '\n/* Tailwind Standalone CSS - Precompiled for Ultra-Fast Village Mobile Loading */'
  );
}

// 2. Remove Export Full JSON & Export CSV Buttons
const oldExportMarker = '<!-- Export / Import Backup -->';
if (content.includes(oldExportMarker)) {
  const startIdx = content.indexOf(oldExportMarker);
  const endMarker = '<!-- ========================================== -->\r\n    <!-- VIEW 5: PRACTICE SCORECARD';
  const endIdx = content.indexOf(endMarker);
  if (startIdx !== -1 && endIdx !== -1) {
    const secureNotice = `<!-- Database Protection Notice -->
          <div class="bg-white rounded-2xl shadow-sm border border-[#DCE6DF] p-5 space-y-2">
            <h3 class="text-base font-extrabold text-[#111C15]">Database Integrity &amp; Protection</h3>
            <p class="text-xs text-[#3B493F]">The ShaktiQ Question Bank (2,800+ PYQs &amp; 22 Mock Tests) is protected. Bulk data export and scraping are restricted.</p>
          </div>
        </div>
      </div>
    </section>

    `;
    content = content.slice(0, startIdx) + secureNotice + content.slice(endIdx);
  }
}

// 3. Remove Export JS Click Handlers
content = content.replace(
  /document\.getElementById\("exportJsonBtn"\)\.addEventListener\("click"[\s\S]*?showToast\("Downloaded Excel-compatible CSV file!"\);\s*\}\);/,
  'const expJson = document.getElementById("exportJsonBtn"); if (expJson) expJson.onclick = () => showToast("Export disabled.", "error");'
);

// 4. Add JS Anti-Scraping & Dynamic Watermark
const jsProtection = `
    // ==========================================
    // ANTI-SCRAPING & CONTENT PROTECTION SUITE
    // ==========================================
    (function initContentProtection() {
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

      // 4. Dynamic Anti-Leak Session Watermark
      function updateSessionWatermark() {
        const user = (typeof getCurrentAspirant === 'function') ? getCurrentAspirant() : null;
        let overlay = document.getElementById('security-watermark-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'security-watermark-overlay';
          document.body.appendChild(overlay);
        }
        if (user && user.name) {
          const phoneTag = user.phone ? ('***' + user.phone.slice(-4)) : user.email;
          const watermarkText = (user.name + ' • ' + phoneTag + ' • ShaktiQ Session').replace(/"/g, "'");
          const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200"><text x="20" y="100" fill="%230A3826" font-size="12" font-family="monospace" font-weight="bold" opacity="0.08" transform="rotate(-25 180 100)">' + watermarkText + '</text></svg>';
          overlay.style.backgroundImage = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
          overlay.classList.remove('hidden');
        } else {
          overlay.classList.add('hidden');
        }
      }

      window.addEventListener('load', updateSessionWatermark);
      document.addEventListener('DOMContentLoaded', updateSessionWatermark);
    })();
`;

if (!content.includes('ANTI-SCRAPING & CONTENT PROTECTION SUITE')) {
  const scriptEnd = '  </script>\r\n\r\n  </body>\r\n</html>';
  if (content.includes(scriptEnd)) {
    content = content.replace(scriptEnd, jsProtection + '\n' + scriptEnd);
  } else {
    content = content.replace('  </script>\n\n  </body>\n</html>', jsProtection + '\n  </script>\n\n  </body>\n</html>');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully applied all anti-copy and anti-scraping protections to index.html');
