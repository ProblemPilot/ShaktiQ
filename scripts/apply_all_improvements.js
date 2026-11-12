// scripts/apply_all_improvements.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');
const SITEMAP_XML = path.join(ROOT_DIR, 'sitemap.xml');

// 1. Fix sitemap.xml to be 100% compliant with sitemaps.org (no hash fragments)
const cleanSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://shaktiq.com/</loc>
    <lastmod>2026-11-12</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
fs.writeFileSync(SITEMAP_XML, cleanSitemap, 'utf8');
console.log('✅ sitemap.xml updated with canonical URLs only.');

// 2. Update index.html
let html = fs.readFileSync(INDEX_HTML, 'utf8');

// A. Fix flip-card accessible labels (WCAG 2.5.3 Label in Name)
html = html.replace(
  'aria-label="Constitution 25 Parts Mnemonic Card"',
  'aria-label="25 Parts of Indian Constitution Mnemonic Card"'
);
html = html.replace(
  'aria-label="Vitamin B Complex Mnemonic Card"',
  'aria-label="Vitamin B Family (B1 to B12) Mnemonic Card"'
);
html = html.replace(
  'aria-label="Tropic of Cancer States Mnemonic Card"',
  'aria-label="Tropic of Cancer (8 States) Mnemonic Card"'
);
html = html.replace(
  'aria-label="7 Fundamental Quantities Mnemonic Card"',
  'aria-label="7 Fundamental SI Quantities Mnemonic Card"'
);
console.log('✅ Flip-card accessible labels updated for WCAG 2.5.3.');

// B. Mobile font-size 16px to prevent auto-zoom on mobile inputs
const mobileInputCss = `
  /* Mobile Input Auto-Zoom Prevention (iOS & Android) */
  @media (max-width: 640px) {
    input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="password"],
    select,
    textarea {
      font-size: 16px !important;
    }
  }
`;
if (!html.includes('Mobile Input Auto-Zoom Prevention')) {
  html = html.replace('</style>', mobileInputCss + '\n  </style>');
  console.log('✅ Mobile input 16px font-size CSS injected.');
}

// C. Add WebSite and FAQPage Schema.org JSON-LD
const richSchemas = `
  <!-- Structured Data: WebSite Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ShaktiQ",
    "url": "https://shaktiq.com/",
    "description": "Practice 2800+ BPSC PYQs based on published answer keys, 22 full-length tests on BPSC pattern, rapid revision sheets, and exam mnemonics"
  }
  </script>

  <!-- Structured Data: FAQPage Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does the platform work and can I save my test scores?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "This exam preparation portal runs directly in your browser. You can practice all 2,800+ PYQs based on published answer keys, take all 22 full-length timed tests on BPSC pattern (including 2-hour AEDO and BPSC CCE papers), and sign in free with your aspirant profile to save your test attempts and track your progress."
        }
      },
      {
        "@type": "Question",
        "name": "Which competitive exams are covered on this platform?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The platform focuses on Bihar State and national competitive recruitment: BPSC Decoded (72nd & 73rd CCE Prelims, ASO, Special Teacher), BSSC CGL 4 Decoded (Secretariat Assistant & Planning Assistant), and AEDO Decoded (Assistant Executive Development Officer, Panchayati Raj)."
        }
      },
      {
        "@type": "Question",
        "name": "Can I add my own questions or export the question bank for offline study?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Inside the Question Bank workspace, you can add your own custom questions, bulk-paste question sets, print any filtered question set to PDF, or export the database to CSV/JSON for offline revision."
        }
      }
    ]
  }
  </script>
`;

if (!html.includes('"@type": "FAQPage"')) {
  html = html.replace('</head>', richSchemas + '\n</head>');
  console.log('✅ WebSite & FAQPage JSON-LD added to <head>.');
}

// D. Update setGlobalAppLanguage to keep document.documentElement.lang synchronized
if (!html.includes("document.documentElement.lang = lang;")) {
  html = html.replace(
    'ShaktiQBilingualEngine.currentLang = lang;',
    'ShaktiQBilingualEngine.currentLang = lang;\n      document.documentElement.lang = lang;'
  );
  console.log('✅ document.documentElement.lang synchronization added to setGlobalAppLanguage.');
}

// Ensure initial lang on load
if (!html.includes("document.documentElement.lang = ShaktiQBilingualEngine.currentLang;")) {
  html = html.replace(
    'ShaktiQBilingualEngine.updateButtonsUI();',
    'document.documentElement.lang = ShaktiQBilingualEngine.currentLang;\n      ShaktiQBilingualEngine.updateButtonsUI();'
  );
  console.log('✅ Initial document.documentElement.lang sync on boot added.');
}

fs.writeFileSync(INDEX_HTML, html, 'utf8');
console.log('All improvements written to index.html successfully.');
