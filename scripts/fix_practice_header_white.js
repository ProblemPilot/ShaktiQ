// scripts/fix_practice_header_white.js
const fs = require('fs');
const path = require('path');

const INDEX_HTML = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(INDEX_HTML, 'utf8');

// 1. Update Logo in page-bpsc-pyq-view header to use logo-white
const oldLogo = `<picture><source srcset="/logo.webp" type="image/webp"><img src="/logo.png" width="144" height="48" loading="lazy" decoding="async" alt="ShaktiQ Logo" class="h-10 sm:h-12 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;"></picture>`;
const newLogo = `<picture><source srcset="/logo-white.webp" type="image/webp"><img src="/logo-white.png" width="144" height="48" loading="lazy" decoding="async" alt="ShaktiQ Logo" class="h-10 sm:h-12 w-auto object-contain shrink-0 logo-white" style="flex-shrink: 0 !important;"></picture>`;

if (html.includes(oldLogo)) {
  html = html.replace(oldLogo, newLogo);
  console.log('✅ Replaced header logo with white logo.');
} else {
  console.warn('⚠️ Could not find exact oldLogo string.');
}

// 2. Make the unvisible subtitle text white
const oldSubtitle = `<p class="text-[11px] text-[#3B493F] mt-0.5 font-medium">Attempt-First Active Recall: Select an option to test yourself</p>`;
const newSubtitle = `<p class="text-[11px] text-white mt-0.5 font-medium">Attempt-First Active Recall: Select an option to test yourself</p>`;

if (html.includes(oldSubtitle)) {
  html = html.replace(oldSubtitle, newSubtitle);
  console.log('✅ Made subtitle text white.');
} else {
  console.warn('⚠️ Could not find exact oldSubtitle string.');
}

// 3. Make vertical divider crisp white
const oldDivider = `<div class="h-6 w-px bg-[#DCE6DF] hidden sm:block"></div>\r\n\r\n            <div class="flex items-center gap-3">\r\n              ${newLogo}\r\n              <div class="hidden sm:block pl-3 border-l border-[#DCE6DF]">`;
// Let's do targeted replacements for the dividers around the logo
html = html.replace(
  '<div class="h-6 w-px bg-[#DCE6DF] hidden sm:block"></div>',
  '<div class="h-6 w-px bg-white/25 hidden sm:block"></div>'
);
html = html.replace(
  '<div class="hidden sm:block pl-3 border-l border-[#DCE6DF]">',
  '<div class="hidden sm:block pl-3 border-l border-white/25">'
);
console.log('✅ Updated header vertical dividers to white/25.');

// 4. Update + Add Question button to be a distinct white button with dark green text
const oldAddBtn = `<button type="button" id="quickAddQuestionBtn" class="bg-[#10402D] hover:bg-[#17593F] text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer">`;
const newAddBtn = `<button type="button" id="quickAddQuestionBtn" class="bg-white hover:bg-[#EBF3E6] text-[#10402D] font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-sm border border-white/80 transition flex items-center gap-1.5 cursor-pointer">`;

if (html.includes(oldAddBtn)) {
  html = html.replace(oldAddBtn, newAddBtn);
  console.log('✅ Made + Add Question button a clean white pill.');
}

// 5. Update header row divider to white/15
html = html.replace(
  '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E5ECE6] pt-2.5 pb-2">',
  '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/15 pt-2.5 pb-2">'
);
console.log('✅ Updated header horizontal divider to white/15.');

// 6. Update qbNav sign in button to white when not logged in
html = html.replace(
  `qbNav.innerHTML = \`<button type="button" onclick="openAspirantRegModal('Sign in to track your test scores and bookmarks.')" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0A3826] hover:bg-[#145239] shadow-sm transition-all cursor-pointer"><i data-lucide="user" class="w-3.5 h-3.5 text-[#FCE27B]"></i><span>Sign In</span></button>\`;`,
  `qbNav.innerHTML = \`<button type="button" onclick="openAspirantRegModal('Sign in to track your test scores and bookmarks.')" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#10402D] bg-white hover:bg-[#EBF3E6] border border-white/80 shadow-sm transition-all cursor-pointer"><i data-lucide="user" class="w-3.5 h-3.5 text-[#10402D]"></i><span>Sign In</span></button>\`;`
);
console.log('✅ Updated qbNav sign in button to white.');

// 7. Add defensive CSS in <style> to guarantee all sub-text in #page-bpsc-pyq-view > header is white
const headerWhiteCss = `
  /* Practice Mode Dark Header - White Text & Logo Guarantee */
  html.light #page-bpsc-pyq-view > header .text-\\[\\#3B493F\\],
  html.light #page-bpsc-pyq-view > header p.text-\\[\\#3B493F\\],
  #page-bpsc-pyq-view > header p.text-\\[\\#3B493F\\] {
    color: #FFFFFF !important;
  }
`;
if (!html.includes('Practice Mode Dark Header - White Text & Logo Guarantee')) {
  html = html.replace('</style>', headerWhiteCss + '\n  </style>');
  console.log('✅ Added defensive CSS rule ensuring header subtitle text is white.');
}

fs.writeFileSync(INDEX_HTML, html, 'utf8');
console.log('Done!');
