// scripts/fix_perf_and_card_a11y.js
const fs = require('fs');
const path = require('path');

const INDEX_HTML = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(INDEX_HTML, 'utf8');

// 1. Remove role="button" and aria-label from flip-cards to fix label-content-name-mismatch
html = html.replace(
  '<div class="flip-card perspective-1000 cursor-pointer h-96 group" tabindex="0" role="button" aria-label="25 Parts of Indian Constitution Mnemonic Card">',
  '<div class="flip-card perspective-1000 cursor-pointer h-96 group" tabindex="0">'
);
html = html.replace(
  '<div class="flip-card perspective-1000 cursor-pointer h-96 group" tabindex="0" role="button" aria-label="Vitamin B Family (B1 to B12) Mnemonic Card">',
  '<div class="flip-card perspective-1000 cursor-pointer h-96 group" tabindex="0">'
);
html = html.replace(
  '<div class="flip-card perspective-1000 cursor-pointer h-96 group" tabindex="0" role="button" aria-label="Tropic of Cancer (8 States) Mnemonic Card">',
  '<div class="flip-card perspective-1000 cursor-pointer h-96 group" tabindex="0">'
);
html = html.replace(
  '<div class="flip-card perspective-1000 cursor-pointer h-96 group" tabindex="0" role="button" aria-label="7 Fundamental SI Quantities Mnemonic Card">',
  '<div class="flip-card perspective-1000 cursor-pointer h-96 group" tabindex="0">'
);
console.log('✅ Cleaned up flip-card roles and labels.');

// 2. Defer unauthenticated questions fetch on initial page load
const oldLoadFn = `    function loadQuestionsData(forceReload) {
      if (!forceReload && questionsLoadPromise) return questionsLoadPromise;

      const token = getAspirantAuthToken();
      const fetchHeaders = {};
      if (token) {
        fetchHeaders['Authorization'] = 'Bearer ' + token;
      }

      questionsLoadPromise = fetch(AUTH_BACKEND_ORIGIN + '/questions.json?v=' + Date.now(), {
        cache: 'no-store',
        headers: fetchHeaders
      })`;

const newLoadFn = `    function loadQuestionsData(forceReload) {
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

      questionsLoadPromise = fetch(AUTH_BACKEND_ORIGIN + '/questions.json?v=' + Date.now(), fetchOptions)`;

// Normalize newlines to match
if (html.includes(oldLoadFn)) {
  html = html.replace(oldLoadFn, newLoadFn);
  console.log('✅ Updated loadQuestionsData to avoid initial unauthenticated network stall.');
} else {
  // Try with \r\n
  const oldLoadFnCRLF = oldLoadFn.replace(/\n/g, '\r\n');
  const newLoadFnCRLF = newLoadFn.replace(/\n/g, '\r\n');
  if (html.includes(oldLoadFnCRLF)) {
    html = html.replace(oldLoadFnCRLF, newLoadFnCRLF);
    console.log('✅ Updated loadQuestionsData (CRLF) to avoid initial unauthenticated network stall.');
  } else {
    console.warn('⚠️ Could not match oldLoadFn exactly.');
  }
}

fs.writeFileSync(INDEX_HTML, html, 'utf8');
console.log('Finished updating index.html.');
