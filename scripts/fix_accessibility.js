// scripts/fix_accessibility.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');

let html = fs.readFileSync(INDEX_HTML, 'utf8');

// 1. Fix aria-required-children in Exam Switcher tablist
html = html.replace(
  '<button type="button" id="tab-btn-bpsc" class="practice-tab-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#10402D] text-white shadow-sm cursor-pointer" data-exam="bpsc">',
  '<button type="button" id="tab-btn-bpsc" role="tab" aria-selected="true" class="practice-tab-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#10402D] text-white shadow-sm cursor-pointer" data-exam="bpsc">'
);
html = html.replace(
  '<button type="button" id="tab-btn-bssc" class="practice-tab-btn px-4 py-2 rounded-xl text-xs font-bold transition-all text-[#3B493F] hover:text-[#111C15] cursor-pointer" data-exam="bssc">',
  '<button type="button" id="tab-btn-bssc" role="tab" aria-selected="false" class="practice-tab-btn px-4 py-2 rounded-xl text-xs font-bold transition-all text-[#3B493F] hover:text-[#111C15] cursor-pointer" data-exam="bssc">'
);
html = html.replace(
  '<button type="button" id="tab-btn-aedo" class="practice-tab-btn px-4 py-2 rounded-xl text-xs font-bold transition-all text-[#3B493F] hover:text-[#111C15] cursor-pointer" data-exam="aedo">',
  '<button type="button" id="tab-btn-aedo" role="tab" aria-selected="false" class="practice-tab-btn px-4 py-2 rounded-xl text-xs font-bold transition-all text-[#3B493F] hover:text-[#111C15] cursor-pointer" data-exam="aedo">'
);

// 2. Fix aria-required-children in Revision Tabs tablist
const revTabs = [
  { id: 'rev-tab-btn-bihar', sel: 'true' },
  { id: 'rev-tab-btn-history', sel: 'false' },
  { id: 'rev-tab-btn-aedo', sel: 'false' },
  { id: 'rev-tab-btn-polity', sel: 'false' },
  { id: 'rev-tab-btn-science', sel: 'false' },
  { id: 'rev-tab-btn-schemes', sel: 'false' }
];

revTabs.forEach(t => {
  const target = `id="${t.id}"`;
  const replacement = `id="${t.id}" role="tab" aria-selected="${t.sel}"`;
  if (!html.includes(replacement)) {
    html = html.replace(target, replacement);
  }
});

// Also fix legal modal tabs role="tablist" if any
html = html.replace(
  'id="legal-tab-btn-privacy"',
  'id="legal-tab-btn-privacy" role="tab" aria-selected="true"'
);
html = html.replace(
  'id="legal-tab-btn-terms"',
  'id="legal-tab-btn-terms" role="tab" aria-selected="false"'
);
html = html.replace(
  'id="legal-tab-btn-contact"',
  'id="legal-tab-btn-contact" role="tab" aria-selected="false"'
);

// 3. Fix heading order: change footer <h4> to <h3>
html = html.replace(
  '<h4 class="font-display font-bold text-sm text-[#111C15] uppercase tracking-wider mb-4">Exam Tracks</h4>',
  '<h3 class="font-display font-bold text-sm text-[#111C15] uppercase tracking-wider mb-4">Exam Tracks</h3>'
);
html = html.replace(
  '<h4 class="font-display font-bold text-sm text-[#111C15] uppercase tracking-wider mb-4">Study Tools</h4>',
  '<h3 class="font-display font-bold text-sm text-[#111C15] uppercase tracking-wider mb-4">Study Tools</h3>'
);

// Fix practice workspace question <h4> to <h3>
html = html.replace(
  '<h4 class="font-display font-bold text-lg sm:text-xl text-[#111C15] mb-4">\n            During the 1857 Revolt in Bihar, which British commander was defeated by Veer Kunwar Singh near Jagdishpur on 23rd April 1858?\n          </h4>',
  '<h3 class="font-display font-bold text-lg sm:text-xl text-[#111C15] mb-4">\n            During the 1857 Revolt in Bihar, which British commander was defeated by Veer Kunwar Singh near Jagdishpur on 23rd April 1858?\n          </h3>'
);
html = html.replace(
  '<h4 class="font-display font-bold text-lg sm:text-xl text-[#111C15] mb-4">\n            Which optical phenomenon is primarily responsible for the twinkling of stars observed from Earth\'s surface?\n          </h4>',
  '<h3 class="font-display font-bold text-lg sm:text-xl text-[#111C15] mb-4">\n            Which optical phenomenon is primarily responsible for the twinkling of stars observed from Earth\'s surface?\n          </h3>'
);
html = html.replace(
  '<h4 class="font-display font-bold text-lg sm:text-xl text-[#111C15] mb-4">\n            Under the Bihar Panchayati Raj Act, 2006, what percentage of reservation was granted to women across all three tiers of Panchayats?\n          </h4>',
  '<h3 class="font-display font-bold text-lg sm:text-xl text-[#111C15] mb-4">\n            Under the Bihar Panchayati Raj Act, 2006, what percentage of reservation was granted to women across all three tiers of Panchayats?\n          </h3>'
);

// Fix Quick Links <h4> to <h3>
html = html.replace(
  '<h4 class="font-display font-bold text-base text-[#111C15] mb-3.5">\n                Quick Links\n              </h4>',
  '<h3 class="font-display font-bold text-base text-[#111C15] mb-3.5">\n                Quick Links\n              </h3>'
);

// 4. Timer accessibility
html = html.replace(
  'id="tt-timer-display" class="font-mono text-base sm:text-lg font-extrabold text-[#10402D]"',
  'id="tt-timer-display" class="font-mono text-base sm:text-lg font-extrabold text-[#10402D]" aria-label="Exam Time Remaining"'
);

// Clean up any repeated role/aria in legal tabs
html = html.replace(
  'id="legal-tab-btn-privacy" role="tab" aria-selected="true" role="tab" aria-selected="true" role="tab" aria-selected="true"',
  'id="legal-tab-btn-privacy" role="tab" aria-selected="true"'
);
html = html.replace(
  'id="legal-tab-btn-terms" role="tab" aria-selected="false" role="tab" aria-selected="false" role="tab" aria-selected="false"',
  'id="legal-tab-btn-terms" role="tab" aria-selected="false"'
);
html = html.replace(
  'id="legal-tab-btn-contact" role="tab" aria-selected="false" role="tab" aria-selected="false" role="tab" aria-selected="false"',
  'id="legal-tab-btn-contact" role="tab" aria-selected="false"'
);

html = html.replace(/role="tab" aria-selected="true" role="tab" aria-selected="true"/g, 'role="tab" aria-selected="true"');
html = html.replace(/role="tab" aria-selected="false" role="tab" aria-selected="false"/g, 'role="tab" aria-selected="false"');

fs.writeFileSync(INDEX_HTML, html, 'utf8');
console.log('Successfully applied Accessibility (U4) fixes to index.html.');
