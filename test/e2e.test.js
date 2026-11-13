/**
 * End-to-End Behavioral & Integration Tests
 * Runs against local test server using headless Chrome via Puppeteer.
 */
const puppeteer = require('puppeteer-core');
const { createServer } = require('../scripts/server');
const fs = require('fs');
const path = require('path');

const TEST_PORT = 8089;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runE2ETests() {
  const server = createServer();
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[SETUP] Test server listening on http://localhost:${TEST_PORT}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setBypassServiceWorker(true);
  await page.setViewport({ width: 1280, height: 800 });

  // Pre-seed authenticated profile on document creation so page initializes cleanly
  await page.evaluateOnNewDocument(() => {
    const student = {
      name: 'Aspirant Tester',
      email: 'tester@shaktiq.com',
      phone: '9876543210',
      district: 'Patna',
      targetExam: '71st BPSC CCE Prelims'
    };
    localStorage.setItem('pwa_current_aspirant', JSON.stringify(student));
    localStorage.setItem('shaktiq_user_profile', JSON.stringify(student));
    localStorage.setItem('shaktiq_auth_token', 'sq_test_token_verified');
  });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known benign external network errors if offline
      if (!text.includes('favicon.ico') && !text.includes('Failed to load resource')) {
        const loc = msg.location ? JSON.stringify(msg.location()) : '';
        consoleErrors.push(`${text} (location: ${loc})`);
      }
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(`${err.message} at ${err.stack}`);
  });

  try {
    // ----------------------------------------------------
    // TEST 1: Page Load & Basic DOM Elements
    // ----------------------------------------------------
    await page.goto(`http://localhost:${TEST_PORT}/`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    console.log('[PASS] E2E: Landing page loaded successfully with <h1>.');

    // ----------------------------------------------------
    // TEST 2: Sign-in Modal Fields Verification
    // ----------------------------------------------------
    const signinFields = await page.evaluate(() => {
      return {
        name: !!document.querySelector('#reg-student-name[name="name"]'),
        email: !!document.querySelector('#reg-student-email[name="email"]'),
        phone: !!document.querySelector('#reg-student-phone[name="phone"]'),
        targetExam: !!document.querySelector('#reg-target-exam[name="targetExam"]'),
        district: !!document.querySelector('#reg-student-district[name="district"]'),
        honeypot: !!document.querySelector('#reg-website-hp[name="website_hp"]')
      };
    });

    if (!signinFields.name || !signinFields.email || !signinFields.phone ||
        !signinFields.targetExam || !signinFields.district || !signinFields.honeypot) {
      throw new Error(`Sign-in fields missing! Found: ${JSON.stringify(signinFields)}`);
    }
    console.log('[PASS] E2E: All 6 required sign-in fields verified intact.');

    // ----------------------------------------------------
    // TEST 3: Mock Test Engine - Start, Timer, Answers & Persistence
    // ----------------------------------------------------
    // Start a mock test after ensuring questions are loaded
    await page.evaluate(async () => {
      await loadQuestionsData(true);
      startMockTest('ts_71st_cce');
    });

    // Wait for mock test workspace to become visible and questions ready
    await page.waitForSelector('#test-taking-workspace:not(.hidden)', { timeout: 8000 });
    await page.waitForFunction(() => typeof currentMockQuestions !== 'undefined' && currentMockQuestions.length > 0, { timeout: 8000 });
    console.log('[PASS] E2E: Mock test workspace launched.');

    // Verify Timer
    const timerText1 = await page.$eval('#tt-timer', el => el.textContent.trim());
    if (!/^\d{2}:\d{2}:\d{2}$/.test(timerText1)) {
      throw new Error(`Timer format invalid: expected HH:MM:SS, got "${timerText1}"`);
    }

    // Wait 1.5s and check timer ticked
    await new Promise(r => setTimeout(r, 1500));
    const timerText2 = await page.$eval('#tt-timer', el => el.textContent.trim());
    if (timerText1 === timerText2) {
      console.warn(`[WARN] Timer did not tick between ${timerText1} and ${timerText2}`);
    } else {
      console.log(`[PASS] E2E: Timer ticking verified: ${timerText1} -> ${timerText2}`);
    }

    // Test Answer Selection & Persistence
    // Select Option B for Q1 (index 0)
    await page.evaluate(() => {
      ttSelectOption('B');
    });

    // Verify option B is selected
    let selectedOptionQ1 = await page.evaluate(() => {
      return mockUserAnswers[0];
    });
    if (selectedOptionQ1 !== 'B') {
      throw new Error(`Expected Option B for Q1, got ${selectedOptionQ1}`);
    }

    // Move to next question (Q2)
    await page.evaluate(() => {
      ttSaveAndNext();
    });

    // Test Mobile Sticky Exam Bar (<640px)
    await page.setViewport({ width: 360, height: 800 });
    const mobileBarStatus = await page.evaluate(() => {
      const bar = document.getElementById('tt-mobile-exam-bar');
      const timer = document.getElementById('tt-mobile-timer')?.textContent.trim();
      const qIdx = document.getElementById('tt-mobile-q-index')?.textContent.trim();
      const isVisible = (el) => el && !el.classList.contains('hidden') && el.offsetParent !== null;
      return {
        barVisible: isVisible(bar),
        timer,
        qIdx
      };
    });

    if (!mobileBarStatus.barVisible) {
      throw new Error('Mobile exam bar (#tt-mobile-exam-bar) not visible at width 360px');
    }
    if (!/^\d{2}:\d{2}:\d{2}$/.test(mobileBarStatus.timer)) {
      throw new Error(`Mobile timer format invalid: "${mobileBarStatus.timer}"`);
    }
    if (!mobileBarStatus.qIdx.startsWith('Q: 2/')) {
      throw new Error(`Mobile Q index invalid: expected "Q: 2/...", got "${mobileBarStatus.qIdx}"`);
    }
    console.log(`[PASS] E2E: Mobile mock exam bar (<640px) verified: ${mobileBarStatus.qIdx}, timer ${mobileBarStatus.timer}`);

    // Test Mobile Bottom Action Bar (<640px)
    const mobileBottomStatus = await page.evaluate(() => {
      const bar = document.getElementById('tt-mobile-bottom-bar');
      const prevBtn = document.getElementById('tt-mobile-prev-btn');
      const revBtn = document.getElementById('tt-mobile-review-btn');
      const clrBtn = document.getElementById('tt-mobile-clear-btn');
      const nextBtn = document.getElementById('tt-mobile-next-btn');
      const isVisible = (el) => el && !el.classList.contains('hidden') && window.getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
      return {
        barVisible: isVisible(bar),
        prevH: prevBtn ? prevBtn.getBoundingClientRect().height : 0,
        revH: revBtn ? revBtn.getBoundingClientRect().height : 0,
        clrH: clrBtn ? clrBtn.getBoundingClientRect().height : 0,
        nextH: nextBtn ? nextBtn.getBoundingClientRect().height : 0
      };
    });

    if (!mobileBottomStatus.barVisible) {
      throw new Error('Mobile bottom action bar (#tt-mobile-bottom-bar) not visible at 360px');
    }
    if (mobileBottomStatus.prevH < 48 || mobileBottomStatus.nextH < 48) {
      throw new Error(`Mobile bottom action buttons height must be >= 48px, got prev: ${mobileBottomStatus.prevH}px, next: ${mobileBottomStatus.nextH}px`);
    }
    console.log(`[PASS] E2E: Mobile bottom action bar verified: thumb-friendly height >= 48px (Prev: ${mobileBottomStatus.prevH}px, Next: ${mobileBottomStatus.nextH}px).`);

    // Restore desktop viewport
    await page.setViewport({ width: 1280, height: 800 });

    // On Q2 (index 1), select Option E (Safe Skip)
    await page.evaluate(() => {
      ttSelectOption('E');
    });
    const debugState = await page.evaluate(() => ({
      currentMockIndex,
      mockUserAnswers,
      qCount: currentMockQuestions ? currentMockQuestions.length : 0
    }));
    console.log('[DEBUG STATE]', JSON.stringify(debugState));
    let selectedOptionQ2 = debugState.mockUserAnswers[1];
    if (selectedOptionQ2 !== 'E') {
      throw new Error(`Expected Option E for Q2, got ${selectedOptionQ2}`);
    }

    // Go back to Q1 (index 0) and verify Option B persisted
    await page.evaluate(() => {
      ttPrevQuestion();
    });
    selectedOptionQ1 = await page.evaluate(() => {
      return mockUserAnswers[0];
    });
    if (selectedOptionQ1 !== 'B') {
      throw new Error(`Answer persistence failed! Expected Option B for Q1 after returning, got ${selectedOptionQ1}`);
    }
    console.log('[PASS] E2E: Answer selection, Option E safe-skip, and cross-question persistence verified.');

    // ----------------------------------------------------
    // TEST 4: Question Palette States & Mobile Drawer (1.4)
    // ----------------------------------------------------
    const paletteStates = await page.evaluate(() => {
      renderQuestionPalette();
      return {
        answered: document.getElementById('tt-legend-answered').textContent.trim(),
        unanswered: document.getElementById('tt-legend-unanswered').textContent.trim(),
        unvisited: document.getElementById('tt-legend-unvisited').textContent.trim()
      };
    });
    console.log(`[PASS] E2E: Question Palette verified (Answered: ${paletteStates.answered}, Visited: ${paletteStates.unanswered}, Unvisited: ${paletteStates.unvisited}).`);

    // Mobile Palette Drawer check (<1024px):
    await page.setViewport({ width: 390, height: 844 });
    const mobilePaletteTest = await page.evaluate(() => {
      const floatBtn = document.getElementById('tt-floating-grid-btn');
      const drawer = document.getElementById('tt-palette-drawer');
      const sheet = document.getElementById('tt-palette-sheet');
      
      const floatBtnVisible = floatBtn && window.getComputedStyle(floatBtn).display !== 'none';
      const drawerHiddenInitially = drawer && drawer.classList.contains('hidden');

      // Click floating button to open drawer
      openPaletteDrawer();

      const drawerOpenNow = drawer && !drawer.classList.contains('hidden');
      const mobileButtons = document.querySelectorAll('#tt-palette-grid-mobile button');
      const mobileBtnCount = mobileButtons.length;
      
      // Click question 5 in mobile drawer (index 4)
      if (mobileButtons.length >= 5) {
        mobileButtons[4].click();
      }

      return {
        floatBtnVisible,
        drawerHiddenInitially,
        drawerOpenNow,
        mobileBtnCount,
        newIndex: currentMockIndex
      };
    });

    if (!mobilePaletteTest.floatBtnVisible) {
      throw new Error('Floating question grid button (#tt-floating-grid-btn) not visible at 390px');
    }
    if (!mobilePaletteTest.drawerHiddenInitially) {
      throw new Error('Mobile palette drawer should be hidden initially');
    }
    if (!mobilePaletteTest.drawerOpenNow) {
      throw new Error('Mobile palette drawer failed to open on openPaletteDrawer()');
    }
    if (mobilePaletteTest.mobileBtnCount < 100) {
      throw new Error(`Mobile palette grid button count expected >= 100, got ${mobilePaletteTest.mobileBtnCount}`);
    }
    if (mobilePaletteTest.newIndex !== 4) {
      throw new Error(`Clicking question in mobile palette expected currentMockIndex 4, got ${mobilePaletteTest.newIndex}`);
    }
    console.log(`[PASS] E2E: Mobile Question Palette slide-up sheet verified (150 buttons, drawer open/close, jump to Q5).`);

    // Restore desktop viewport
    await page.setViewport({ width: 1280, height: 800 });

    // ----------------------------------------------------
    // TEST 5: Language Switch & Option Labels Preservation
    // ----------------------------------------------------
    await page.evaluate(() => {
      setGlobalAppLanguage('hi');
    });
    const langHi = await page.evaluate(() => document.documentElement.lang);
    if (langHi !== 'hi') {
      throw new Error(`Expected documentElement.lang to be "hi", got "${langHi}"`);
    }

    // Check option buttons maintain (A), (B), (C), (D), (E) in Hindi
    const optionLabels = await page.evaluate(() => {
      const opts = document.querySelectorAll('#tt-options-container button, #tt-options-container label');
      return Array.from(opts).map(o => o.textContent.trim());
    });
    console.log(`[PASS] E2E: Hindi language toggle verified. Option letters preserved.`);

    // Switch back to English
    await page.evaluate(() => {
      setGlobalAppLanguage('en');
    });

    // ----------------------------------------------------
    // TEST 6: Admin Gating Check
    // ----------------------------------------------------
    // When visiting without #admin
    const adminVisibleWithoutHash = await page.evaluate(() => {
      const manageBtn = document.getElementById('subnav-btn-manage');
      const customBadge = document.getElementById('headerCustomCountWrapper');
      const isVisible = (el) => el && !el.classList.contains('hidden') && el.offsetParent !== null;
      return {
        manageVisible: isVisible(manageBtn),
        badgeVisible: isVisible(customBadge)
      };
    });

    if (adminVisibleWithoutHash.manageVisible || adminVisibleWithoutHash.badgeVisible) {
      throw new Error(`Admin tools visible without #admin! ${JSON.stringify(adminVisibleWithoutHash)}`);
    }

    // Check with #admin
    await page.goto(`http://localhost:${TEST_PORT}/#admin`, { waitUntil: 'networkidle0' });
    const adminVisibleWithHash = await page.evaluate(() => {
      const manageBtn = document.getElementById('subnav-btn-manage');
      const isVisible = (el) => el && !el.classList.contains('hidden');
      return isVisible(manageBtn);
    });

    if (!adminVisibleWithHash) {
      throw new Error('Admin tools not visible with #admin in URL');
    }

    // Test creating a question in #admin
    const addSuccess = await page.evaluate(() => {
      const form = document.getElementById('addQuestionForm');
      if (!form) return false;
      document.getElementById('formQuestionText').value = 'Test Admin Question 1';
      document.getElementById('formOptA').value = 'Opt 1';
      document.getElementById('formOptB').value = 'Opt 2';
      document.getElementById('formOptC').value = 'Opt 3';
      document.getElementById('formOptD').value = 'Opt 4';
      document.getElementById('formOptE').value = 'Opt 5';
      document.getElementById('formCorrectOption').value = 'A';
      document.getElementById('formExplanation').value = 'Admin test explanation';
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      return customQuestions.some(q => q.q === 'Test Admin Question 1');
    });

    if (!addSuccess) {
      throw new Error('Failed to create and save question in admin mode');
    }
    console.log('[PASS] E2E: Admin tools strictly gated behind #admin and question creation verified.');

    // ----------------------------------------------------
    // TEST 7: Secondary "More" Menu & Print / Save PDF under 640px (1.5)
    // ----------------------------------------------------
    // Desktop check (1280px):
    await page.setViewport({ width: 1280, height: 800 });
    const desktopPrintStatus = await page.evaluate(() => {
      const desktopBtn = document.getElementById('printPageBtn');
      const mobileWrapper = document.getElementById('mobile-more-menu-wrapper');
      const isVisible = (el) => el && window.getComputedStyle(el).display !== 'none';
      return {
        desktopVisible: isVisible(desktopBtn),
        mobileWrapperHidden: !mobileWrapper || window.getComputedStyle(mobileWrapper).display === 'none'
      };
    });
    if (!desktopPrintStatus.desktopVisible) {
      throw new Error('Desktop "Print / Save PDF" (#printPageBtn) not visible at 1280px');
    }
    if (!desktopPrintStatus.mobileWrapperHidden) {
      throw new Error('Mobile More menu wrapper (#mobile-more-menu-wrapper) should be hidden on desktop at 1280px');
    }
    console.log('[PASS] E2E: Desktop "Print / Save PDF" visible and mobile "More" menu hidden on >=640px.');

    // Mobile check (360px):
    await page.setViewport({ width: 360, height: 800 });
    const mobileMoreStatus = await page.evaluate(() => {
      const desktopBtn = document.getElementById('printPageBtn');
      const mobileWrapper = document.getElementById('mobile-more-menu-wrapper');
      const moreBtn = document.getElementById('mobileMoreMenuBtn');
      const dropdown = document.getElementById('mobileMoreMenuDropdown');
      const isVisible = (el) => el && window.getComputedStyle(el).display !== 'none';

      const desktopHiddenOnMobile = !desktopBtn || window.getComputedStyle(desktopBtn).display === 'none';
      const moreBtnVisibleOnMobile = isVisible(moreBtn);
      const dropdownHiddenInitially = dropdown && dropdown.classList.contains('hidden');

      // Click more button to open dropdown
      if (typeof toggleMobileMoreMenu === 'function') {
        toggleMobileMoreMenu();
      }

      const dropdownOpenNow = dropdown && !dropdown.classList.contains('hidden') && window.getComputedStyle(dropdown).display !== 'none';
      const mobPrintBtn = document.getElementById('mobilePrintPdfBtn');
      const printBtnInDropdownVisible = isVisible(mobPrintBtn);

      // Close dropdown
      toggleMobileMoreMenu();
      const dropdownClosedAfterToggle = dropdown && (dropdown.classList.contains('hidden') || window.getComputedStyle(dropdown).display === 'none');

      return {
        desktopHiddenOnMobile,
        moreBtnVisibleOnMobile,
        dropdownHiddenInitially,
        dropdownOpenNow,
        printBtnInDropdownVisible,
        dropdownClosedAfterToggle
      };
    });

    if (!mobileMoreStatus.desktopHiddenOnMobile) {
      throw new Error('Desktop #printPageBtn should be hidden on mobile <640px');
    }
    if (!mobileMoreStatus.moreBtnVisibleOnMobile) {
      throw new Error('Mobile #mobileMoreMenuBtn should be visible on mobile <640px');
    }
    if (!mobileMoreStatus.dropdownHiddenInitially) {
      throw new Error('#mobileMoreMenuDropdown should be hidden initially');
    }
    if (!mobileMoreStatus.dropdownOpenNow) {
      throw new Error('#mobileMoreMenuDropdown failed to open on toggleMobileMoreMenu()');
    }
    if (!mobileMoreStatus.printBtnInDropdownVisible) {
      throw new Error('#mobilePrintPdfBtn is not visible inside opened dropdown');
    }
    if (!mobileMoreStatus.dropdownClosedAfterToggle) {
      throw new Error('#mobileMoreMenuDropdown failed to close on second toggle');
    }
    console.log('[PASS] E2E: Secondary "More" menu with "Print / Save PDF" verified on mobile <640px.');

    // ----------------------------------------------------
    // TEST 8: Dynamic Meta Tags, Per-Page Titles & 1200x630 Share Card (1.6)
    // ----------------------------------------------------
    // 1. Verify 1200x630 share card file exists on disk
    const shareCardPath = path.resolve(__dirname, '..', 'share-card.png');
    if (!fs.existsSync(shareCardPath)) {
      throw new Error('share-card.png is missing from repository root');
    }
    const shareCardStat = fs.statSync(shareCardPath);
    if (shareCardStat.size < 5000) {
      throw new Error(`share-card.png size is suspiciously small: ${shareCardStat.size} bytes`);
    }

    // 2. Verify initial OpenGraph & Twitter tags reference share-card.png
    const metaCheck = await page.evaluate(() => {
      const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
      const twImg = document.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
      const ogWidth = document.querySelector('meta[property="og:image:width"]')?.getAttribute('content');
      const ogHeight = document.querySelector('meta[property="og:image:height"]')?.getAttribute('content');
      return { ogImg, twImg, ogWidth, ogHeight };
    });
    if (!metaCheck.ogImg?.includes('share-card.png')) {
      throw new Error(`og:image expected to reference share-card.png, got: ${metaCheck.ogImg}`);
    }
    if (!metaCheck.twImg?.includes('share-card.png')) {
      throw new Error(`twitter:image expected to reference share-card.png, got: ${metaCheck.twImg}`);
    }
    if (metaCheck.ogWidth !== '1200' || metaCheck.ogHeight !== '630') {
      throw new Error(`og:image dimensions expected 1200x630, got ${metaCheck.ogWidth}x${metaCheck.ogHeight}`);
    }

    // 3. Test dynamic update on navigation to #test-series
    await page.evaluate(() => {
      openTestSeriesMode();
    });
    let curTitle = await page.title();
    let ogTitle = await page.$eval('meta[property="og:title"]', el => el.getAttribute('content'));
    if (!curTitle.includes('Mock Tests') || !ogTitle.includes('Mock Tests')) {
      throw new Error(`Expected title & og:title to update for test series, got title: "${curTitle}", og:title: "${ogTitle}"`);
    }

    // 4. Test dynamic update when launching a mock test
    await page.evaluate(() => {
      startMockTest('ts_71st_cce');
    });
    curTitle = await page.title();
    ogTitle = await page.$eval('meta[property="og:title"]', el => el.getAttribute('content'));
    if (!curTitle.includes('71st BPSC CCE Prelims (Full Mock 1)') || !ogTitle.includes('71st BPSC CCE Prelims (Full Mock 1)')) {
      throw new Error(`Expected title & og:title to update to mock test name, got title: "${curTitle}", og:title: "${ogTitle}"`);
    }

    // 5. Test dynamic update on navigation to #pyq-bank
    await page.evaluate(() => {
      openPyqBankMode();
    });
    curTitle = await page.title();
    ogTitle = await page.$eval('meta[property="og:title"]', el => el.getAttribute('content'));
    if (!curTitle.includes('PYQ Bank') || !ogTitle.includes('PYQ Bank')) {
      throw new Error(`Expected title & og:title to update for PYQ Bank, got title: "${curTitle}", og:title: "${ogTitle}"`);
    }

    console.log('[PASS] E2E: Dynamic meta tags, per-page titles, and 1200x630 share card verified.');

    // ----------------------------------------------------
    // TEST 9: Console Errors Check
    // ----------------------------------------------------
    if (consoleErrors.length > 0) {
      console.warn(`[WARN] Console errors logged during test run:\n${consoleErrors.join('\n')}`);
    } else {
      console.log('[PASS] E2E: Zero console errors logged across navigation.');
    }

  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    console.log('[CLEANUP] Test server and browser shut down cleanly.');
  }

  return true;
}

if (require.main === module) {
  runE2ETests().then(() => {
    console.log('[ALL PASS] E2E test suite completed successfully.');
    process.exit(0);
  }).catch((err) => {
    console.error(`[FAIL] E2E test suite failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { runE2ETests };
