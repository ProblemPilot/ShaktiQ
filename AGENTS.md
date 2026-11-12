# ShaktiQ Architecture & Implementation Guide (AGENTS.md)

## 1. Repository Architecture & Component Overview

### Key Files
- `index.html` (~10,167 lines): The primary Single Page Application (SPA) containing HTML structure, Tailwind CSS styling classes, Lucide icons, and integrated JavaScript engines (Auth, PYQ Bank, Mock Test Engine, Analytics, Bilingual Engine, Admin Form).
- `questions_bank_source.json` (2.54 MB): The authoritative question bank containing exactly 2,809 validated BPSC/Bihar exam questions. SHA-256 hash: `10232aecc15e8ca0838a07cd486afd36e394999ff3ea537b2702b0fe1194e17a`.
- `questions.json` (165 B): The public decoy file in the repo containing a 401 Unauthorized payload to prevent unauthenticated scraping.
- `worker.js` (5.57 KB): Cloudflare Worker proxying question requests with token authentication and rate-limiting (15 requests/hour).
- `sw.js` (3.41 KB): Service Worker managing offline caching (`shaktiq-cache-v13`).
- `manifest.json`: Web App Manifest for PWA installation.

### How Components Work Together
1. **App Initialization**: On page load, `index.html` registers `sw.js` for asset caching and initializes Lucide icons and navigation.
2. **Authentication Flow**: Access to the PYQ bank and mock tests requires an aspirant profile. The aspirant registers via `openAspirantRegModal()` (`aspirant-reg-form`), which saves local profile data and calls the Cloudflare Worker `/api/register-token` endpoint to acquire a Bearer session token (`shaktiq_auth_token`).
3. **Data Loading**: `loadQuestionsData()` fetches questions using the session token from the worker backend or local cache, hydrating `INITIAL_QUESTIONS`.
4. **Mock Test Engine**:
   - `CURATED_TESTS` lists 22 full-length mocks (150-question BPSC CCE mocks, 100-question AEDO/Teacher mocks).
   - `startMockTest(testId)` initializes `currentMockQuestions`, resets `mockUserAnswers` and `mockMarkedForReview`, and starts the countdown timer (`mockTimeRemaining` = 7200s for 120 mins).
   - Active question navigation is managed via `currentMockIndex`, `ttPrevQuestion()`, `ttSaveAndNext()`, and direct palette clicks `ttJumpToQuestion(idx)`.
5. **Marking & Scoring Scheme**:
   - Strict adherence to BPSC marking scheme:
     - **Correct**: +1.0
     - **Wrong (A–D)**: -1/3 penalty (-0.33)
     - **Option E (Safe Skip)**: 0 deduction (Safe Skip)
     - **Blank (Unbubbled)**: -1/3 penalty (-0.33) under current BPSC negative marking rules
     - **Net Score**: `((correct * 3 - wrong - blank) / 3).toFixed(2)`
6. **Bilingual Engine**:
   - `ShaktiQBilingualEngine` translates question stems, options, and explanations into Hindi while preserving option labeling `(A)`, `(B)`, `(C)`, `(D)`, `(E)`.
   - Option E in Hindi standardizes to "अनुत्तरित प्रश्न (सुरक्षित छोड़ें • 0 अंक कटेगा)" or "उपर्युक्त में से कोई नहीं / उपर्युक्त में से एक से अधिक".
   - Translations are stored in `localStorage` under `shaktiq_hi_translations_v2`.
7. **Question Palette**:
   - Palette indicators: Answered (Dark green `#10402D`), Review (Yellow `#FCE27B`), Not Answered / Visited (Soft green `#EBF3E6`), Not Visited (Gray `#F8FAF7`).
   - Current question highlighted with focus ring.
8. **Storage**:
   - `localStorage`: User session (`shaktiq_auth_token`, `shaktiq_user_profile`, `pwa_all_aspirants`), language preference (`shaktiq_preferred_lang`), translation cache, and daily practice streak (`abhyas_daily_stats`).
   - `IndexedDB` (`shaktiq_practice_db`): Detailed question attempt history and analytics.

---

## 2. Step-by-Step Build Plan

### Safety Net (Step 1)
- Automated verification script `test/verify.js` executed via `npm run verify`.
- Covers scoring formula (+1, -1/3, 0, -1/3), timer persistence, palette state transitions, language toggle with Latin option prefixes, answer persistence, sign-in form integrity, `#admin` route gating, data checksums, console error checks, and accessibility/static audits.

### Phase 1: Polish and Clean
- **1.1 Admin Tools Gating**: Hide "Manage / + Add Question" button and "Custom Added: N" badge from default student view; display only when URL hash is `#admin`.
- **1.2 Mobile Exam Sticky Bar (<640px)**: Slim 40px sticky bar displaying countdown timer, `Q: n/150`, and Option E Safe-Skip indicator. Timer remains persistent across re-renders.
- **1.3 Mobile Bottom Action Bar**: Sticky thumb-friendly bottom bar ([Prev] [Review] [Clear] [Next]) >=48px tall, safe-area aware.
- **1.4 Mobile Off-Canvas Question Palette**: Slide-up drawer opened via floating "Question Grid" button on mobile, leaving desktop layout intact.
- **1.5 Mobile "Print / Save PDF" Overflow**: Reposition "Print / Save PDF" under a secondary "More" dropdown on viewports <640px.
- **1.6 Dynamic SEO & OpenGraph**: Per-page dynamic titles, meta descriptions, and OG tags updated on route navigation; generate 1200x630 share image with brand assets.
- **1.7 Share Result Modal**: WhatsApp, Telegram, and Copy Text sharing buttons with net score, correct, wrong, safe-skip, blank, and exam title. HTML5 canvas scorecard generator compatible with Web Share API without PII.

### Phase 2: Retention
- **2.1 My Mistake Register**: Persistent storage for wrong answers with "Only my incorrect questions" filter and retry mode. Questions graduate after 2 consecutive correct answers.
- **2.2 10-Minute Speed Drills**: 15-question subject drills dynamically drawn from existing question bank questions with timer and explanation links.
- **2.3 Reliable Offline PWA**: Cache question data in CacheStorage / IndexedDB. Add update check, offline readiness pill, and resilience for in-progress tests.
- **2.4 Indicative Cut-Off Meter**: Configurable 3-band cut-off meter (Safe >= 98, Borderline 85-97, Needs improvement < 85) with explicit non-official disclaimer.

### Phase 3: Scale and Moat
- **3.1 Virtual OMR Sheet Mode**: Split view / toggleable 5-bubble OMR sheet (A-E) synced with question card state.
- **3.2 Modularization**: Incrementally factor CSS and JS modules out of monolithic `index.html` without changing visual rendering or behavior.
- **3.3 Exam Pack Infrastructure**: Extensible schema and UI slots for BSSC, TRE 4.0, strictly referencing genuine repo data.

---

## 3. How to Run and Verify

### Running the Site Locally
```bash
npm run serve
# Launches local dev server on http://localhost:8080 serving index.html and questions
```

### Running the Verification Safety Net
```bash
npm run verify
# Runs automated unit tests, data checksums, static audits, and accessibility checks
# Exits with code 0 on complete pass
```
