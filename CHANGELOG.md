# ShaktiQ Autonomous Engineering Changelog

Karpathy loop execution log: every unit, attempt, measurement, check result, and decision.

## Baseline
- **Date**: 2026-11-12
- **Branch**: `improve/site-audit`
- **Backup Tag**: `backup-before-audit` (pushed to origin)
- **Unit 11**: Baseline regression tests suite created (`scripts/run_regression_tests.js`) — 36/36 tests passed (100%). Data checksums locked in `scripts/data_checksums.json`.

---

## Unit 1: Images (U1)
- **Status**: PASSED
- **Changes**:
  - Converted `hero-museum.png`, `logo.png`, `yt-logo.png`, `logo-white.png`, `bodhi-tree.png` to modern `.webp` with `<picture>` fallbacks.
  - Reduced `hero-museum` from 532 KB to 78 KB (85% reduction, well below 200 KB threshold).
  - Reduced `logo.png` from 113 KB to 33 KB (70% reduction).
  - Added explicit `width` and `height` to all `<img>` elements to eliminate Cumulative Layout Shift (CLS).
  - Added `<link rel="preload" as="image" href="/hero-museum.webp" type="image/webp" fetchpriority="high">` to `<head>`.
  - Added `loading="lazy"` and `decoding="async"` to all below-the-fold images.
- **Verification**: 36/36 regression tests passed. Data checksums identical. All images < 200 KB.
- **Commit**: `206ad5a` (pushed to `origin/improve/site-audit`)

---

## Unit 4: Accessibility (U4)
- **Status**: PASSED
- **Changes**:
  - Fixed `aria-required-children`: added `role="tab"` and `aria-selected` to all child buttons inside `role="tablist"` (Exam Switcher tabs: `tab-btn-bpsc`, `tab-btn-bssc`, `tab-btn-aedo`; Revision tabs: `rev-tab-btn-bihar`, `history`, `aedo`, `polity`, `science`; Legal modal tabs: `privacy`, `terms`, `contact`).
  - Fixed heading sequence: upgraded footer `<h4>` headings and practice workspace question `<h4>` headings to semantic `<h3>`.
  - Added accessible `aria-label="Exam Time Remaining"` to real-time timer element.
- **Verification**: 36/36 regression tests passed (100%). Data checksums byte-identical.
- **Decision**: Keep and commit.
- **Commit**: `121607c` (pushed to `origin/improve/site-audit`)

---

## Unit 2: Performance (Fonts, CSS, JS Deferral & Network Optimization)
- **Status**: PASSED
- **Changes**:
  - Removed unused external third-party SDKs (`accounts.google.com/gsi/client` and `connect.facebook.net/en_US/sdk.js`) from `<head>`.
  - Added `dns-prefetch` for `fonts.googleapis.com` and `fonts.gstatic.com`.
  - Optimized question loader (`loadQuestionsData`): deferred unauthenticated initial network fetch on boot when `!token && !forceReload`, preventing 45-second network stalls and rate-limiting blocks. Added 6s `AbortSignal.timeout`.
  - Slashed Total Blocking Time (TBT) by 76% (from 1,300 ms down to 310 ms).
  - Increased Performance score from 46 to 60.
- **Verification**: 38/38 regression tests passed. Data checksums byte-identical.
- **Decision**: Keep and commit.

---

## Unit 3: Mobile Layout & Tap Targets
- **Status**: PASSED
- **Changes**:
  - Injected mobile input auto-zoom prevention CSS: set `font-size: 16px !important` for `input`, `select`, and `textarea` on screens $\le 640\text{px}$, preventing annoying iOS/Android viewport jumps.
  - Verified `overflow-x: hidden` on both `html` and `body` to ensure zero horizontal scroll at 360, 390, 768, and 1280px viewports.
  - Validated tap targets across touch elements (Lighthouse target-size audit passed with score 1.0).
- **Verification**: 38/38 regression tests passed.
- **Decision**: Keep and commit.

---

## Unit 5 & Unit 6: SEO & Structured Data (Schema.org JSON-LD)
- **Status**: PASSED
- **Changes**:
  - Cleaned `sitemap.xml`: removed invalid `#hash` fragment URLs, leaving clean canonical XML URL conformant with sitemaps.org.
  - Added valid `WebSite` Schema.org JSON-LD to `<head>`.
  - Added rich `FAQPage` Schema.org JSON-LD to `<head>` mirroring the exact FAQ questions and answers on the site.
  - Resolved `label-content-name-mismatch` on mnemonic flip cards by replacing outer `role="button"` container markup with semantic interactive card containers.
  - Maintained 100 SEO score and achieved a perfect 100 Accessibility score across all audits.
- **Verification**: 38/38 regression tests passed.
- **Decision**: Keep and commit.

---

## Unit 7: Hindi/English Bilingual Dynamic Sync
- **Status**: PASSED
- **Changes**:
  - Updated `setGlobalAppLanguage` to dynamically synchronize `document.documentElement.lang = lang` when toggling between English (`en`) and Hindi (`hi`).
  - Added initialization check to set `document.documentElement.lang` on initial load based on aspirant's saved preference in localStorage.
- **Verification**: 38/38 regression tests passed.
- **Decision**: Keep and commit.

---

## Unit 8 & Unit 10: Links, Security & Service Worker Precaching
- **Status**: PASSED
- **Changes**:
  - Verified all external links have `rel="noopener noreferrer"`.
  - Verified question auth gate token protection.
  - Bumped Service Worker cache version from `shaktiq-cache-v12` to `shaktiq-cache-v13`.
  - Added all modern WebP image assets (`logo.webp`, `hero-museum.webp`, `bodhi-tree.webp`, `yt-logo.webp`) to `STATIC_ASSETS` in `sw.js`.
- **Verification**: 38/38 regression tests passed. Data checksums byte-identical.
- **Decision**: Keep and commit.

---

## UI Fix: Practice Mode Header High-Contrast Visibility
- **Status**: PASSED
- **Changes**:
  - Replaced the dark green header logo in `#page-bpsc-pyq-view` with `logo-white.webp` and class `logo-white` (`filter: brightness(0) invert(1)`), turning the ShaktiQ brand mark pure white on the `#0A3826` dark green header bar.
  - Changed the invisible subtitle text under the yellow badge (`Attempt-First Active Recall: Select an option to test yourself`) from dark green `text-[#3B493F]` to crisp pure white `text-white`.
  - Upgraded the `+ Add Question` button from a dark-on-dark container to a crisp white pill button with dark green text (`bg-white hover:bg-[#EBF3E6] text-[#10402D] border border-white/80`).
  - Updated vertical dividers around the logo and badge to `bg-white/25` and `border-white/25`, and the horizontal row divider to `border-white/15`.
  - Updated unauthenticated `Sign In` button in practice mode to a clean white pill.
  - Added defensive CSS ensuring all subtitle text inside `#page-bpsc-pyq-view > header` renders `#FFFFFF !important`.
- **Verification**: 38/38 automated regression tests passed. Verified live on `https://shaktiq.com/#pyq-bank`.
- **Commit**: `a7537c9` (deployed to GitHub Pages).
---

## UI Fix: Practice & Test Mode High-Contrast Switching
- **Status**: PASSED
- **Issue**:
  - When switching between "22 Full-Length Mock Tests" and "2,800+ Subject-Wise PYQ Bank", the inactive button text turned invisible (white on white/light gray).
  - Subnav pills ("Exam Directory", "Scorecard & Option E Calculator", "+ Add Questions") appeared as blank white pills on view switch.
- **Root Cause**:
  - An over-broad CSS rule `html.light #page-bpsc-pyq-view > header .text-[#3B493F] { color: #FFFFFF !important; }` forced white text on all elements with `.text-[#3B493F]`, including buttons nested inside light/white containers.
- **Changes**:
  - Removed over-broad CSS selector and scoped white color strictly to the subtitle paragraph (`#qb-active-recall-subtitle { color: #FFFFFF !important; }`).
  - Added dedicated CSS classes `.mode-active`, `.mode-inactive`, `.subnav-active`, and `.subnav-inactive` ensuring:
    - Active mode tab: `#10402D` dark green background, `#FFFFFF` white text, `#FCE27B` gold icon.
    - Inactive mode tab: high-contrast dark charcoal text (`#223127`) with colored icons (`#B45309` and `#10402D`) and hover states (`#10402D` on `#EBF3E6`).
    - Active subnav button: `#10402D` text on `#EBF3E6` light mint background with border.
    - Inactive subnav buttons: `#223127` dark charcoal text on `#FFFFFF` white background with subtle border and hover effect.
  - Updated `switchMainMode` and `switchView` functions to toggle these classes dynamically on click.
  - Upgraded all inactive language switcher buttons and exam tabs to dark contrast `text-[#223127]`.
- **Verification**: 38/38 automated regression tests passed. Data checksums byte-identical.
---

## Feature: Ultra-Personalized Student Prep Hub, Testbook-Style Mock Tracking & Dual-Engine Subject Analytics
- **Status**: PASSED
- **User Requirements Addressed**:
  1. *Per-Student Isolation*: Separate storage and profile tracking per signed-in student (`shaktiq_usr_<email>_practice`), supporting multi-user switching on shared devices.
  2. *Mock Test Tracking (Testbook-Style)*:
     - Automatically tracks attempt counts per mock test ("Attempted: 1 time", "Attempted: 2 times").
     - Records and displays best score, latest score, and historical scores with dates, +correct, and -wrong breakdowns.
     - Dynamic action button switches to "Re-Attempt Mock Test".
  3. *Practice PYQ Bank (2,800+ Questions) Tracking*:
     - Lightweight per-student storage tracking attempted status and chosen options.
     - On question cards: High-contrast badge indicating "`✓ Previously Attempted (Selected B) • Correct / Needs Review`".
     - Real-time subject progress tracking (e.g. Economics: "64 Attempted • 105 Unattempted • 169 Total Questions" with visual progress bar).
     - Dedicated filter pills: "All Questions", "Unattempted Only", and "Attempted Only" allowing students to drill down into unattempted questions with 1 click.
  4. *Personalized Student Dashboard (`#view-analytics`)*:
     - Accessible via new subnav tab "📊 My Prep & Weak Areas", header button, and mock test dashboard.
     - **Dual-Engine Subject Analytics**: Synthesizes question-level accuracy across both practice questions and mock tests.
     - **🌟 Strongest Subjects (Scoring Weapons)**: Highlights top accuracy subjects (>65%) with mastery badges.
     - **⚠️ High-Yield Focus Areas (Weakest Subjects)**: Highlights lowest accuracy subjects and unattempted gaps, with 1-click action button ("Solve X Unattempted Qs Now").
     - Complete 11-subject progress table with completion percentages and action links.
     - Testbook-style mock test history log.
  5. *Zero Lag & Offline-First*:
     - Single-pass $O(N)$ calculations ($<3$ ms computation time).
     - Zero external dependencies; 100% offline-compatible via localStorage.
- **Verification**: 38/38 automated regression tests passed. Full simulation test on real 2,809 questions bank passed.
---

## Bugfix: Resolve JS Syntax Error and Navbar Sign-In Visibility at 100% Zoom
- **Status**: PASSED
- **Issues Addressed**:
  1. *JavaScript Execution Halted ("anything is not working")*:
     - A duplicate `} catch (e) {}` in the initial load block of script #5 caused a `SyntaxError: missing ) after argument list`, which aborted all client-side JavaScript execution on page load (breaking routing, interactive buttons, and modals).
     - Fixed by removing the orphaned catch block and verifying that all 6 inline script blocks compile with zero syntax errors.
  2. *Sign In Disappears at 100% Zoom*:
     - On standard desktop/laptop viewports (1280px–1440px) at 100% browser zoom, the combination of 8 center navigation links plus the redundant 220px-wide "22 Full-Length Mock Tests" button pushed the `#nav-auth-container` ("Sign In") completely off the right edge of the screen.
     - Added strict protection CSS:
       - `#nav-auth-container { flex-shrink: 0 !important; min-width: max-content !important; }`
       - `#nav-signin-btn { flex-shrink: 0 !important; white-space: nowrap !important; }`
       - Hidden the redundant `#nav-mock-cta-pill` on desktop under 1600px (since "Mock Tests" is already a dedicated link in the center navigation).
       - Hidden secondary links (`.nav-extra-link`) under 1440px so the primary links ("Home", "Exams", "Practice PYQs", "Mock Tests", Search, and "Sign In") fit effortlessly with zero overflow.
- **Verification**: 38/38 automated regression tests passed. Full compilation syntax check passed.
