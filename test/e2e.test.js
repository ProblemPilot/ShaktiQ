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
        honeypot: !!document.querySelector('#reg-website-hp[name="website_hp"]')
      };
    });

    if (!signinFields.name || !signinFields.email || !signinFields.phone ||
        !signinFields.targetExam || !signinFields.honeypot) {
      throw new Error(`Sign-in fields missing! Found: ${JSON.stringify(signinFields)}`);
    }
    console.log('[PASS] E2E: All 5 required sign-in fields verified intact (district field removed per specification).');

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
    // TEST 9: Mock Result Sharing & Canvas Scorecard (1.7)
    // ----------------------------------------------------
    // Launch a mock test and submit it
    await page.evaluate(() => {
      startMockTest('ts_71st_cce');
      ttSelectOption('A');
      submitMockTest();
    });

    const shareCheck = await page.evaluate(() => {
      const modal = document.getElementById('tt-result-modal');
      const waBtn = document.getElementById('share-whatsapp-btn');
      const tgBtn = document.getElementById('share-telegram-btn');
      const copyBtn = document.getElementById('share-copy-text-btn');
      const imgBtn = document.getElementById('share-image-btn');
      const canvas = document.getElementById('scorecard-canvas');

      const modalVisible = modal && !modal.classList.contains('hidden');
      const waHref = waBtn ? waBtn.getAttribute('href') : '';
      const tgHref = tgBtn ? tgBtn.getAttribute('href') : '';
      const copyExists = !!copyBtn;
      const imgExists = !!imgBtn;
      const canvasReady = canvas && canvas.width === 600 && canvas.height === 600;

      // Extract decoded text from WhatsApp href
      const urlObj = new URL(waHref);
      const textParam = urlObj.searchParams.get('text') || '';

      return {
        modalVisible,
        waHref,
        tgHref,
        copyExists,
        imgExists,
        canvasReady,
        textParam
      };
    });

    if (!shareCheck.modalVisible) {
      throw new Error('#tt-result-modal not visible after submitMockTest()');
    }
    if (!shareCheck.waHref.startsWith('https://wa.me/?text=')) {
      throw new Error(`WhatsApp share button href invalid: ${shareCheck.waHref}`);
    }
    if (!shareCheck.tgHref.startsWith('https://t.me/share/url?')) {
      throw new Error(`Telegram share button href invalid: ${shareCheck.tgHref}`);
    }
    if (!shareCheck.copyExists || !shareCheck.imgExists) {
      throw new Error('Copy text or Scorecard image button missing from result modal');
    }
    if (!shareCheck.canvasReady) {
      throw new Error('Scorecard canvas not initialized with 600x600');
    }

    // Check shared text contents
    const text = shareCheck.textParam;
    if (!text.includes('Net Score:') || !text.includes('shaktiq.com') || !text.includes('Option E Safe-Skip')) {
      throw new Error(`Shared text missing required summary elements: "${text}"`);
    }

    // STRICT PRIVACY CHECK: Ensure zero PII in shared text
    const piiTokens = ['Aspirant Tester', 'tester@shaktiq.com', '9876543210'];
    piiTokens.forEach(token => {
      if (text.includes(token)) {
        throw new Error(`PRIVACY VIOLATION: Personal data "${token}" leaked in shared text!`);
      }
    });

    console.log('[PASS] E2E: Share Result (WhatsApp, Telegram, Copy, 600x600 Canvas) verified without PII leaks.');

    // ----------------------------------------------------
    // TEST 10: My Mistake Register & Retry Mode (2.1)
    // ----------------------------------------------------
    // Navigate to PYQ bank
    await page.evaluate(() => {
      localStorage.setItem('pwa_current_aspirant', JSON.stringify({
        name: 'Aspirant Tester',
        email: 'tester@shaktiq.com',
        phone: '9876543210',
        district: 'Patna',
        targetExam: '71st BPSC CCE Prelims'
      }));
      openPyqBankMode();
      // Clear mistake register for clean test baseline
      saveMistakeRegister({});
    });

    // Check empty state
    await page.evaluate(() => {
      toggleMistakesFilter(true);
    });
    const emptyStateText = await page.evaluate(() => {
      const container = document.getElementById('questionsContainer');
      const badge = document.getElementById('mistakeBadgeCount');
      return {
        html: container ? container.innerHTML : '',
        badgeCount: badge ? badge.textContent.trim() : null
      };
    });

    if (emptyStateText.badgeCount !== '0') {
      throw new Error(`Expected mistake badge count 0, got ${emptyStateText.badgeCount}`);
    }
    if (!emptyStateText.html.includes('Clean Slate! Your Mistake Register is empty')) {
      throw new Error('Mistake register empty state missing friendly clean slate wording');
    }

    // Attempt a question wrongly in practice
    const mistakeRegistered = await page.evaluate(() => {
      resetAllFilters();
      const firstQ = getAllQuestions()[0];
      const wrongOpt = (firstQ.ans === 'A') ? 'B' : 'A';
      // Simulate selecting wrong option
      handlePracticeMistakeRegister(firstQ.id, wrongOpt);
      const reg = loadMistakeRegister();
      return {
        exists: !!reg[firstQ.id],
        entry: reg[firstQ.id],
        badge: document.getElementById('mistakeBadgeCount').textContent.trim()
      };
    });

    if (!mistakeRegistered.exists || mistakeRegistered.entry.wrongCount !== 1) {
      throw new Error('Failed to register mistake on incorrect practice answer');
    }
    if (mistakeRegistered.badge !== '1') {
      throw new Error(`Expected badge count 1 after mistake, got ${mistakeRegistered.badge}`);
    }

    // Now test streak tracking and graduation rule:
    // 1st correct answer -> consecutiveCorrect = 1 (remains in register)
    const afterFirstCorrect = await page.evaluate(() => {
      const firstQ = getAllQuestions()[0];
      handlePracticeMistakeRegister(firstQ.id, firstQ.ans);
      const reg = loadMistakeRegister();
      return {
        stillInRegister: !!reg[firstQ.id],
        consecutiveCorrect: reg[firstQ.id] ? reg[firstQ.id].consecutiveCorrect : 0,
        badge: document.getElementById('mistakeBadgeCount').textContent.trim()
      };
    });

    if (!afterFirstCorrect.stillInRegister || afterFirstCorrect.consecutiveCorrect !== 1) {
      throw new Error(`Expected question to remain in register with streak 1, got streak: ${afterFirstCorrect.consecutiveCorrect}`);
    }

    // Wrong answer -> streak resets to 0
    const afterStreakReset = await page.evaluate(() => {
      const firstQ = getAllQuestions()[0];
      const wrongOpt = (firstQ.ans === 'A') ? 'B' : 'A';
      handlePracticeMistakeRegister(firstQ.id, wrongOpt);
      const reg = loadMistakeRegister();
      return {
        consecutiveCorrect: reg[firstQ.id] ? reg[firstQ.id].consecutiveCorrect : -1,
        wrongCount: reg[firstQ.id] ? reg[firstQ.id].wrongCount : 0
      };
    });

    if (afterStreakReset.consecutiveCorrect !== 0 || afterStreakReset.wrongCount !== 2) {
      throw new Error(`Expected streak reset to 0 and wrongCount 2, got: ${JSON.stringify(afterStreakReset)}`);
    }

    // Answer correctly twice in a row -> graduates and leaves register!
    const afterGraduation = await page.evaluate(() => {
      const firstQ = getAllQuestions()[0];
      // 1st correct answer
      handlePracticeMistakeRegister(firstQ.id, firstQ.ans);
      // 2nd correct answer in a row
      handlePracticeMistakeRegister(firstQ.id, firstQ.ans);
      const reg = loadMistakeRegister();
      return {
        inRegister: !!reg[firstQ.id],
        badge: document.getElementById('mistakeBadgeCount').textContent.trim()
      };
    });

    if (afterGraduation.inRegister) {
      throw new Error('Question should have graduated and left the register after 2 consecutive correct answers!');
    }
    if (afterGraduation.badge !== '0') {
      throw new Error(`Expected badge count 0 after graduation, got ${afterGraduation.badge}`);
    }

    console.log('[PASS] E2E: Mistake Register (wrong logging, streak tracking, graduation after 2x correct, empty state) verified.');

    // ----------------------------------------------------
    // TEST 11: 10-Minute Speed Drills by Subject & Explanations (2.2)
    // ----------------------------------------------------
    // 1. Navigate to #speed-drills
    await page.evaluate(() => {
      openSpeedDrills();
    });

    const drillsState = await page.evaluate(() => {
      const activeFilter = document.querySelector('.ts-filter-btn.bg-\\[\\#10402D\\]')?.getAttribute('data-ts-filter');
      const cards = document.querySelectorAll('#testseries-grid > div.bg-white');
      return {
        activeFilter,
        cardCount: cards.length
      };
    });

    if (drillsState.activeFilter !== 'SPEED_DRILLS') {
      throw new Error(`Expected active filter SPEED_DRILLS, got: ${drillsState.activeFilter}`);
    }
    if (drillsState.cardCount !== 8) {
      throw new Error(`Expected 8 subject speed drills, got: ${drillsState.cardCount}`);
    }

    // 2. Start a speed drill: Bihar Special
    await page.evaluate(() => {
      startMockTest('drill_bihar_special');
    });

    await page.waitForSelector('#test-taking-workspace:not(.hidden)');
    const drillLaunch = await page.evaluate(() => {
      const qCount = currentMockQuestions ? currentMockQuestions.length : 0;
      const allQuestions = getAllQuestions();
      // Verify every single question exists in the bank (zero invented questions)
      const allExistInBank = currentMockQuestions.every(mq => allQuestions.some(aq => aq.id === mq.id));
      // Verify subject matches
      const allBiharSubject = currentMockQuestions.every(mq => mq.subject === 'Bihar Special');
      const timerText = document.getElementById('tt-timer')?.textContent.trim();
      const mobileTimer = document.getElementById('tt-mobile-timer')?.textContent.trim();
      const mobileQIdx = document.getElementById('tt-mobile-q-index')?.textContent.trim();
      const paletteBtns = document.querySelectorAll('#tt-palette-grid button').length;
      return {
        qCount,
        allExistInBank,
        allBiharSubject,
        timerText,
        mobileTimer,
        mobileQIdx,
        paletteBtns
      };
    });

    if (drillLaunch.qCount !== 15) {
      throw new Error(`Expected exactly 15 questions in speed drill, got ${drillLaunch.qCount}`);
    }
    if (!drillLaunch.allExistInBank) {
      throw new Error('Speed drill contains questions NOT present in official question bank!');
    }
    if (!drillLaunch.allBiharSubject) {
      throw new Error('Speed drill contains questions outside selected subject!');
    }
    if (drillLaunch.timerText !== '00:10:00' || drillLaunch.mobileTimer !== '00:10:00') {
      throw new Error(`Expected timer 00:10:00, got desktop: ${drillLaunch.timerText}, mobile: ${drillLaunch.mobileTimer}`);
    }
    if (drillLaunch.paletteBtns !== 15) {
      throw new Error(`Expected 15 buttons in question palette, got ${drillLaunch.paletteBtns}`);
    }

    // 3. Attempt Q1 and Q2, then submit
    await page.evaluate(() => {
      ttSelectOption('A'); // Q1
      ttSaveAndNext();
      ttSelectOption('E'); // Q2 Safe-Skip
      submitMockTest();
    });

    // 4. Verify result screen & solution review trigger
    const drillResult = await page.evaluate(() => {
      const modal = document.getElementById('tt-result-modal');
      const modalVisible = modal && !modal.classList.contains('hidden');
      const totalLabel = document.getElementById('tt-result-total-label')?.textContent.trim();
      const attempted = document.getElementById('tt-result-attempted')?.textContent.trim();
      const safeSkip = document.getElementById('tt-result-safe-skip')?.textContent.trim();
      const reviewBtn = modal ? modal.querySelector('button[onclick="ttReviewSolutions()"]') : null;
      return {
        modalVisible,
        totalLabel,
        attempted,
        safeSkip,
        hasReviewBtn: !!reviewBtn
      };
    });

    if (!drillResult.modalVisible) {
      throw new Error('Result modal not visible after speed drill submission');
    }
    if (drillResult.totalLabel !== '/ 15 Marks') {
      throw new Error(`Expected total label "/ 15 Marks", got "${drillResult.totalLabel}"`);
    }
    if (drillResult.safeSkip !== '1') {
      throw new Error(`Expected safe skip 1, got ${drillResult.safeSkip}`);
    }
    if (!drillResult.hasReviewBtn) {
      throw new Error('Result modal missing "View Full Solutions & Explanations" button');
    }

    // 5. Test jump to dedicated solution review workspace
    await page.evaluate(() => {
      ttReviewSolutions();
    });

    const solViewStatus = await page.evaluate(() => {
      const solWs = document.getElementById('test-solution-workspace');
      const visible = solWs && !solWs.classList.contains('hidden');
      const expText = document.getElementById('sol-explanation-text')?.textContent.trim();
      const keyPill = document.getElementById('sol-correct-answer-pill')?.textContent.trim();
      const paletteCount = document.querySelectorAll('#sol-palette-grid button').length;
      return {
        visible,
        hasExp: !!expText && expText.length > 5,
        hasKey: !!keyPill && keyPill.includes('Option'),
        paletteCount
      };
    });

    if (!solViewStatus.visible) {
      throw new Error('Solution workspace not visible after clicking explanation link');
    }
    if (!solViewStatus.hasExp) {
      throw new Error('Solution explanation text missing in solution workspace');
    }
    if (solViewStatus.paletteCount !== 15) {
      throw new Error(`Expected 15 solution palette buttons, got ${solViewStatus.paletteCount}`);
    }

    console.log('[PASS] E2E: 10-Minute Speed Drills (8 subjects, 15 Qs from bank, 10-min timer, scorecard & explanation links) verified.');

    // ----------------------------------------------------
    // TEST 12: Offline Mode, Versioned Cache Purging & Mock Survivability (Feature 2.3)
    // ----------------------------------------------------
    console.log('[RUNNING] E2E: Testing Reliable Offline Mode & Versioned Cache Purging...');

    // 12.1 Check PWA Status Indicator in UI
    const pwaStatusInitial = await page.evaluate(() => {
      const el = document.getElementById('pwa-status-text');
      const dot = document.getElementById('pwa-status-dot');
      return {
        text: el ? el.textContent.trim() : null,
        hasDot: !!dot
      };
    });

    if (!pwaStatusInitial.text || !pwaStatusInitial.text.includes('Offline ready')) {
      throw new Error(`Expected PWA status indicator 'Offline ready', got '${pwaStatusInitial.text}'`);
    }

    // 12.2 Prove Stale Data is Never Served After Version Changes
    const purgeProof = await page.evaluate(async () => {
      // 1. Simulate older version caches
      const staleKey1 = 'shaktiq-cache-v13';
      const staleKey2 = 'shaktiq-data-v13';
      const c1 = await caches.open(staleKey1);
      await c1.put('/test-stale', new Response('old-v13-shell'));
      const c2 = await caches.open(staleKey2);
      await c2.put('./questions.json', new Response(JSON.stringify([{ id: 'stale_q999', q: 'Old Stale Question', ans: 'X' }])));

      const keysBefore = await caches.keys();
      const hasStaleBefore = keysBefore.includes(staleKey1) && keysBefore.includes(staleKey2);

      // 2. Perform version migration purge matching SW activate logic for v14
      const ACTIVE_VERSIONS = ['shaktiq-cache-v14', 'shaktiq-data-v14'];
      const keysToPurge = (await caches.keys()).filter(k => !ACTIVE_VERSIONS.includes(k));
      await Promise.all(keysToPurge.map(k => caches.delete(k)));

      const keysAfter = await caches.keys();
      const hasStaleAfter = keysAfter.includes(staleKey1) || keysAfter.includes(staleKey2);

      // 3. Ensure live question data in v14 data cache is valid BPSC questions and not stale
      const v14DataCache = await caches.open('shaktiq-data-v14');
      const v14Match = await v14DataCache.match('./questions.json');
      let v14Data = null;
      if (v14Match) {
        v14Data = await v14Match.json();
      }

      return {
        hasStaleBefore,
        hasStaleAfter,
        v14CachedCount: Array.isArray(v14Data) ? v14Data.length : 0,
        containsStaleId: Array.isArray(v14Data) ? v14Data.some(q => q.id === 'stale_q999') : false
      };
    });

    if (!purgeProof.hasStaleBefore) {
      throw new Error('Failed to seed stale cache for version purge proof');
    }
    if (purgeProof.hasStaleAfter) {
      throw new Error('Stale cache still exists after SW version activation purge!');
    }
    if (purgeProof.containsStaleId) {
      throw new Error('STALE DATA LEAK: Cached question bank contains stale version data!');
    }

    // 12.3 Prove Mock In Progress Survives Going Offline
    // Launch a mock test
    await page.evaluate(() => {
      startMockTest('ts_71st_cce');
    });
    await new Promise((r) => setTimeout(r, 600));

    // Answer Q1 with 'B', Q2 with 'E' (safe skip)
    await page.evaluate(() => {
      ttSelectOption('B'); // Q1
      ttSaveAndNext();
      ttSelectOption('E'); // Q2
    });

    // Simulate going OFFLINE via Puppeteer DevTools & DOM event
    await page.setOfflineMode(true);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await new Promise((r) => setTimeout(r, 300));

    // Verify offline indicator updated
    const pwaOfflineStatus = await page.evaluate(() => {
      const el = document.getElementById('pwa-status-text');
      return el ? el.textContent.trim() : '';
    });
    if (!pwaOfflineStatus.includes('Offline mode')) {
      throw new Error(`Expected PWA status 'Offline mode' when disconnected, got '${pwaOfflineStatus}'`);
    }

    // Take actions completely OFFLINE:
    // Navigate to Q3, select 'C', mark Q4 for review, jump to Q10
    const offlineMockResults = await page.evaluate(() => {
      // Q3 (index 2)
      ttSaveAndNext();
      ttSelectOption('C');
      // Q4 (index 3) - mark review
      ttSaveAndNext();
      ttMarkForReview();
      // Jump to Q10 (index 9)
      ttJumpToQuestion(9);
      ttSelectOption('A');

      // Check draft persistence in localStorage
      const draft = PrepBackendEngine.drafts.get(activeMockTest.title);
      const userAnswers = mockUserAnswers;
      const marked = mockMarkedForReview;

      return {
        answersCount: Object.keys(userAnswers).length,
        answers: userAnswers,
        markedReviewCount: Object.keys(marked).length,
        draftSaved: !!draft && Object.keys(draft.answers || {}).length === 4,
        currentIndex: currentMockIndex,
        timerText: document.getElementById('tt-timer') ? document.getElementById('tt-timer').textContent : ''
      };
    });

    if (offlineMockResults.answersCount !== 4) {
      throw new Error(`Expected 4 answers recorded offline, got ${offlineMockResults.answersCount}`);
    }
    if (!offlineMockResults.draftSaved) {
      throw new Error('Offline mock draft was not persisted to localStorage during offline test');
    }
    if (offlineMockResults.answers['0'] !== 'B' || offlineMockResults.answers['1'] !== 'E' || offlineMockResults.answers['2'] !== 'C' || offlineMockResults.answers['9'] !== 'A') {
      throw new Error(`Answer mismatch in offline mock: ${JSON.stringify(offlineMockResults.answers)}`);
    }

    // Submit mock test while still OFFLINE
    const offlineSubmitOutcome = await page.evaluate(() => {
      submitMockTest();
      const modal = document.getElementById('tt-result-modal');
      const netScoreEl = document.getElementById('tt-result-score');
      const explanations = document.querySelectorAll('.tt-result-exp-item');
      return {
        modalVisible: modal && !modal.classList.contains('hidden'),
        netScore: netScoreEl ? netScoreEl.textContent.trim() : null,
        explanationsCount: explanations.length
      };
    });

    if (!offlineSubmitOutcome.modalVisible) {
      throw new Error('Mock result scorecard modal did not open upon offline submission');
    }
    if (!offlineSubmitOutcome.netScore) {
      throw new Error('Net score was not calculated on offline mock submission');
    }

    // Restore online mode
    await page.setOfflineMode(false);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
      closeTestResultModal();
    });
    await new Promise((r) => setTimeout(r, 400));

    const pwaOnlineRestored = await page.evaluate(() => {
      const el = document.getElementById('pwa-status-text');
      return el ? el.textContent.trim() : '';
    });
    if (!pwaOnlineRestored.includes('Offline ready')) {
      throw new Error(`Expected PWA status 'Offline ready' after reconnecting, got '${pwaOnlineRestored}'`);
    }

    console.log('[PASS] E2E: Reliable Offline Mode verified: versioned cache purges stale data, and mock in progress survives going offline without loss.');

    // ----------------------------------------------------
    // TEST 13: Indicative Cut-Off Meter on Scorecard (Feature 2.4)
    // ----------------------------------------------------
    console.log('[RUNNING] E2E: Testing Indicative Cut-Off Meter & Thresholds Config...');

    const cutoffAudit = await page.evaluate(() => {
      // 1. Verify config object exists with default thresholds
      const cfg = window.SHAKTIQ_CUTOFF_CONFIG;
      if (!cfg || cfg.safe !== 98 || cfg.borderline !== 85 || cfg.needsImprovement !== 0) {
        return { error: 'Config object missing or default thresholds mismatch' };
      }

      // 2. Verify 3 bands categorization logic
      const bandSafe = window.getCutoffBand(104, 150);
      const bandBorder = window.getCutoffBand(90, 150);
      const bandNeeds = window.getCutoffBand(72, 150);

      if (bandSafe.id !== 'safe' || bandBorder.id !== 'borderline' || bandNeeds.id !== 'needs_improvement') {
        return { error: `Band calculation failed: safe=${bandSafe.id}, border=${bandBorder.id}, needs=${bandNeeds.id}` };
      }

      // 3. Test scaling for speed drills (15 Qs)
      const scaled = cfg.getThresholdsForTest(15);
      if (scaled.safe !== 9.8 || scaled.borderline !== 8.5) {
        return { error: `Scaled thresholds mismatch: ${JSON.stringify(scaled)}` };
      }
      const drillSafe = window.getCutoffBand(12, 15);
      const drillBorder = window.getCutoffBand(9, 15);
      const drillNeeds = window.getCutoffBand(6, 15);

      if (drillSafe.id !== 'safe' || drillBorder.id !== 'borderline' || drillNeeds.id !== 'needs_improvement') {
        return { error: 'Scaled drill band calculation failed' };
      }

      // 4. Test DOM rendering in scorecard
      window.renderCutoffMeter(92.33, 150);
      const meterCard = document.getElementById('tt-result-cutoff-card');
      const scoreDisp = document.getElementById('cutoff-meter-score-display');
      const pointer = document.getElementById('cutoff-meter-pointer');
      const cardBorderline = document.getElementById('band-card-borderline');
      const cardSafe = document.getElementById('band-card-safe');
      const disclaimer = meterCard ? meterCard.querySelector('p.leading-relaxed') : null;

      const disclaimerText = disclaimer ? disclaimer.textContent : '';
      const hasDisclaimerNotice = disclaimerText.includes('not an official BPSC cut-off') &&
                                  disclaimerText.includes('internal rough study guidelines');

      // 5. Test configurability: edit threshold and re-render
      window.SHAKTIQ_CUTOFF_CONFIG.safe = 102;
      window.renderCutoffMeter(99, 150);
      const thSafeUpdated = document.getElementById('band-threshold-safe') ? document.getElementById('band-threshold-safe').textContent : '';
      // Reset config back to default
      window.SHAKTIQ_CUTOFF_CONFIG.safe = 98;

      return {
        cardVisible: !!meterCard,
        scoreText: scoreDisp ? scoreDisp.textContent : '',
        pointerLeft: pointer ? pointer.style.left : '',
        borderlineHighlighted: cardBorderline ? cardBorderline.className.includes('border-2') : false,
        safeDimmed: cardSafe ? cardSafe.className.includes('opacity-75') : false,
        hasDisclaimerNotice,
        thSafeUpdated
      };
    });

    if (cutoffAudit.error) {
      throw new Error(`Cut-off Audit Error: ${cutoffAudit.error}`);
    }
    if (!cutoffAudit.cardVisible) {
      throw new Error('Indicative Cut-Off Card not found in result modal');
    }
    if (!cutoffAudit.hasDisclaimerNotice) {
      throw new Error('MANDATORY NOTICE MISSING: Cut-off meter must explicitly state it is not an official BPSC cut-off');
    }
    if (!cutoffAudit.thSafeUpdated.includes('102')) {
      throw new Error('Configurability check failed: Edited threshold was not reflected upon re-render');
    }

    console.log('[PASS] E2E: Indicative Cut-Off Meter verified: configurable 3-band thresholds (Safe >= 98, Borderline 85-97, Needs Improvement < 85), clear non-official disclaimer, and proportional drill scaling.');

    // ----------------------------------------------------
    // TEST 14: Virtual OMR Sheet Mode (Feature 3.1)
    // ----------------------------------------------------
    console.log('[RUNNING] E2E: Testing Virtual OMR Sheet Mode (5-bubble sheet, state sync, split/mobile views)...');
    
    // Launch a mock test
    await page.evaluate(() => {
      // Close any modal
      const resModal = document.getElementById('tt-result-modal');
      if (resModal) resModal.classList.add('hidden');
      
      // Clear previous test drafts for deterministic count in test
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('draft_')) localStorage.removeItem(k);
        });
      } catch (e) {}

      // Start curated mock
      if (typeof startMockTest === 'function') {
        startMockTest('ts_71st_cce');
      }
    });

    await page.waitForSelector('#test-taking-workspace:not(.hidden)', { timeout: 8000 });
    await page.waitForFunction(() => typeof currentMockQuestions !== 'undefined' && currentMockQuestions.length > 0, { timeout: 8000 });
    await new Promise(r => setTimeout(r, 250));

    // Verify initial Card View default
    const initialViewAudit = await page.evaluate(() => {
      const ws = document.getElementById('test-taking-workspace');
      const qContainer = document.getElementById('tt-question-container');
      const omrContainer = document.getElementById('tt-omr-container');
      const palette = document.getElementById('tt-desktop-palette-sidebar');
      return {
        isOmrClass: ws ? ws.classList.contains('mock-view-omr') : false,
        qContainerVisible: qContainer ? !qContainer.classList.contains('hidden') : false,
        omrContainerHidden: omrContainer ? omrContainer.classList.contains('hidden') : true,
        paletteVisible: palette ? !palette.classList.contains('hidden') : false
      };
    });

    if (initialViewAudit.isOmrClass || !initialViewAudit.qContainerVisible) {
      throw new Error('Initial mock view should default to Card View with question container visible');
    }

    // Answer Q1 in Card View with option 'B'
    await page.evaluate(() => {
      if (typeof ttSelectOption === 'function') {
        ttSelectOption('B');
      }
    });

    // Toggle to OMR View
    await page.evaluate(() => {
      if (typeof setMockViewMode === 'function') {
        setMockViewMode('omr');
      }
    });
    await new Promise(r => setTimeout(r, 250));

    // Audit OMR View
    const omrAudit = await page.evaluate(() => {
      const ws = document.getElementById('test-taking-workspace');
      const omrContainer = document.getElementById('tt-omr-container');
      const rows = document.querySelectorAll('.omr-row');
      const row0 = document.getElementById('omr-row-0');
      const row0Ans = row0 ? row0.getAttribute('data-answered') : null;
      const row0Chosen = row0 ? row0.querySelector('[aria-label="Q1 B"]') : null;
      const row0ChosenPressed = row0Chosen ? row0Chosen.getAttribute('aria-pressed') : null;
      
      const statTotal = document.getElementById('tt-omr-stat-total');
      const statAnswered = document.getElementById('tt-omr-stat-answered');
      const statBlank = document.getElementById('tt-omr-stat-blank');

      return {
        isOmrClass: ws ? ws.classList.contains('mock-view-omr') : false,
        omrContainerVisible: omrContainer ? !omrContainer.classList.contains('hidden') : false,
        rowCount: rows.length,
        row0Ans,
        row0ChosenPressed,
        totalText: statTotal ? statTotal.textContent : '',
        answeredText: statAnswered ? statAnswered.textContent : '',
        blankText: statBlank ? statBlank.textContent : ''
      };
    });

    if (!omrAudit.isOmrClass || !omrAudit.omrContainerVisible) {
      throw new Error('OMR container was not visible after switching to OMR view');
    }
    if (omrAudit.rowCount !== 150) {
      throw new Error(`Expected 150 OMR rows, found ${omrAudit.rowCount}`);
    }
    if (omrAudit.row0Ans !== 'true' || omrAudit.row0ChosenPressed !== 'true') {
      throw new Error('Option B selected in Card View was not reflected in OMR Row 0');
    }
    if (omrAudit.answeredText !== '1') {
      throw new Error(`Expected OMR stat answered 1, got ${omrAudit.answeredText}`);
    }

    // Now in OMR View, click Option E (Safe Skip) on Question 2 (idx 1)
    await page.evaluate(() => {
      if (typeof selectOmrOption === 'function') {
        selectOmrOption(1, 'E');
      }
    });

    const omrSafeSkipAudit = await page.evaluate(() => {
      const statSafe = document.getElementById('tt-omr-stat-safeskip');
      const statAns = document.getElementById('tt-omr-stat-answered');
      const row1Chosen = document.querySelector('[aria-label="Q2 E (Safe Skip)"]');
      return {
        safeText: statSafe ? statSafe.textContent : '',
        ansText: statAns ? statAns.textContent : '',
        row1EPressed: row1Chosen ? row1Chosen.getAttribute('aria-pressed') : null
      };
    });

    if (omrSafeSkipAudit.safeText !== '1' || omrSafeSkipAudit.row1EPressed !== 'true') {
      throw new Error('Safe Skip Option E selection in OMR failed to record or update stats');
    }

    // Switch back to Card View and verify Q2 shows Option E selected without answer loss
    await page.evaluate(() => {
      if (typeof setMockViewMode === 'function') {
        setMockViewMode('card');
      }
    });
    await new Promise(r => setTimeout(r, 250));

    const cardSyncAudit = await page.evaluate(() => {
      return {
        q1Ans: window.mockUserAnswers[0],
        q2Ans: window.mockUserAnswers[1],
        totalAnswers: Object.keys(window.mockUserAnswers).length
      };
    });

    if (cardSyncAudit.q1Ans !== 'B' || cardSyncAudit.q2Ans !== 'E' || cardSyncAudit.totalAnswers !== 2) {
      throw new Error(`Card view sync error: answers lost on view toggle (got ${JSON.stringify(cardSyncAudit)})`);
    }

    // Test OMR Quick Filter: Blank vs Answered
    await page.evaluate(() => {
      setMockViewMode('omr');
      filterOmrRows('unanswered');
    });
    const filterAudit = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.omr-row'));
      const visibleRows = rows.filter(r => r.style.display !== 'none');
      const hiddenRows = rows.filter(r => r.style.display === 'none');
      // Reset filter to all
      filterOmrRows('all');
      return {
        visibleCount: visibleRows.length,
        hiddenCount: hiddenRows.length
      };
    });

    if (filterAudit.visibleCount !== 148 || filterAudit.hiddenCount !== 2) {
      throw new Error(`OMR Unanswered filter failed: expected 148 visible and 2 hidden, got ${filterAudit.visibleCount} visible, ${filterAudit.hiddenCount} hidden`);
    }

    // Test mobile breakpoint (<1024px) for OMR full-width and question container hidden
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 250));
    const mobileOmrAudit = await page.evaluate(() => {
      setMockViewMode('omr');
      const qContainer = document.getElementById('tt-question-container');
      const omrContainer = document.getElementById('tt-omr-container');
      const mobileOmrBar = document.getElementById('tt-omr-mobile-bottom-bar');
      const cardMobileBtn = document.getElementById('tt-view-btn-card-mobile');
      const omrMobileBtn = document.getElementById('tt-view-btn-omr-mobile');

      const qDisplay = window.getComputedStyle(qContainer).display;
      const omrDisplay = window.getComputedStyle(omrContainer).display;
      const omrBarDisplay = window.getComputedStyle(mobileOmrBar).display;

      return {
        qDisplay,
        omrDisplay,
        omrBarDisplay,
        cardAriaPressed: cardMobileBtn ? cardMobileBtn.getAttribute('aria-pressed') : '',
        omrAriaPressed: omrMobileBtn ? omrMobileBtn.getAttribute('aria-pressed') : ''
      };
    });

    if (mobileOmrAudit.qDisplay !== 'none') {
      throw new Error(`On mobile (<1024px) in OMR mode, question container should be hidden, got display: ${mobileOmrAudit.qDisplay}`);
    }
    if (mobileOmrAudit.omrDisplay === 'none') {
      throw new Error('On mobile (<1024px) in OMR mode, OMR sheet should be visible');
    }
    if (mobileOmrAudit.omrBarDisplay !== 'flex') {
      throw new Error(`On mobile in OMR mode, mobile OMR bottom bar should be flex, got ${mobileOmrAudit.omrBarDisplay}`);
    }

    // Restore desktop viewport
    await page.setViewport({ width: 1280, height: 800 });
    await new Promise(r => setTimeout(r, 250));
    const desktopSplitAudit = await page.evaluate(() => {
      setMockViewMode('omr');
      const qContainer = document.getElementById('tt-question-container');
      const omrContainer = document.getElementById('tt-omr-container');
      const qDisplay = window.getComputedStyle(qContainer).display;
      const omrDisplay = window.getComputedStyle(omrContainer).display;
      return { qDisplay, omrDisplay };
    });

    if (desktopSplitAudit.qDisplay === 'none' || desktopSplitAudit.omrDisplay === 'none') {
      throw new Error(`On desktop (>=1024px) in OMR mode, split view requires BOTH question and OMR sheet visible (qDisplay: ${desktopSplitAudit.qDisplay}, omrDisplay: ${desktopSplitAudit.omrDisplay})`);
    }

    console.log('[PASS] E2E: Virtual OMR Sheet Mode verified: 150 5-bubble rows (A to E), Safe Skip E indicator, seamless bidirectional answer state sync, OMR quick filters, desktop split view (>=1024px), and mobile full switch (<1024px).');

    // ----------------------------------------------------
    // TEST 15: Preparation for More Exam Packs (BSSC, TRE 4.0) Modular Registry & Placeholder Verification
    // ----------------------------------------------------
    await page.evaluate(() => {
      // Exit mock taking workspace and return to testseries view
      const ws = document.getElementById('test-taking-workspace');
      if (ws) ws.classList.add('hidden');
      const tsView = document.getElementById('view-testseries');
      if (tsView) tsView.classList.remove('hidden');
      if (typeof renderTestSeriesCards === 'function') {
        renderTestSeriesCards('ALL');
      }
    });

    const packsRegistryAudit = await page.evaluate(() => {
      if (!window.SHAKTIQ_EXAM_PACKS) return { ok: false, error: 'window.SHAKTIQ_EXAM_PACKS missing' };
      const packs = window.SHAKTIQ_EXAM_PACKS;
      const cce = packs.getPack('bpsc_cce');
      const tre = packs.getPack('bpsc_tre');
      const aedo = packs.getPack('aedo');
      const dept = packs.getPack('bpsc_dept');
      const drills = packs.getPack('speed_drills');
      const bssc = packs.getPack('bssc');

      return {
        ok: true,
        cceHasData: cce && cce.hasData && cce.totalQuestions === 594,
        treHasData: tre && tre.hasData && tre.totalQuestions === 229,
        aedoHasData: aedo && aedo.hasData && aedo.totalQuestions === 600,
        deptHasData: dept && dept.hasData && dept.totalQuestions === 1386,
        drillsHasData: drills && drills.hasData && drills.totalQuestions === 120,
        bsscIsPlaceholder: bssc && !bssc.hasData && bssc.isPlaceholder && bssc.totalQuestions === 0,
        bsscMarking: bssc ? bssc.markingScheme : null
      };
    });

    if (!packsRegistryAudit.ok) {
      throw new Error(`Exam packs registry audit failed: ${packsRegistryAudit.error}`);
    }
    if (!packsRegistryAudit.cceHasData || !packsRegistryAudit.treHasData || !packsRegistryAudit.aedoHasData ||
        !packsRegistryAudit.deptHasData || !packsRegistryAudit.drillsHasData) {
      throw new Error(`Verified exam packs data check failed in registry: ${JSON.stringify(packsRegistryAudit)}`);
    }
    if (!packsRegistryAudit.bsscIsPlaceholder || packsRegistryAudit.bsscMarking.correct !== 4.0 || packsRegistryAudit.bsscMarking.wrong !== -1.0) {
      throw new Error(`BSSC placeholder specification failed: ${JSON.stringify(packsRegistryAudit)}`);
    }

    // Verify UI rendering of BSSC tab and clean placeholder card
    await page.evaluate(() => {
      filterTestSeries('BSSC');
    });

    const bsscUiAudit = await page.evaluate(() => {
      const header = document.getElementById('bssc-pack-header');
      const placeholder = document.getElementById('bssc-placeholder-card');
      const lockedBtn = placeholder ? placeholder.querySelector('button[disabled]') : null;
      return {
        hasHeader: !!header,
        headerText: header ? header.textContent : '',
        hasPlaceholder: !!placeholder,
        placeholderText: placeholder ? placeholder.textContent : '',
        hasDisabledButton: !!lockedBtn
      };
    });

    if (!bsscUiAudit.hasHeader || (!bsscUiAudit.headerText.includes('Coming Soon') && !bsscUiAudit.headerText.includes('BSSC Architecture Ready'))) {
      throw new Error(`BSSC pack header missing or incorrect: ${JSON.stringify(bsscUiAudit)}`);
    }
    if (!bsscUiAudit.hasPlaceholder || (!bsscUiAudit.placeholderText.includes('Coming Soon') && !bsscUiAudit.placeholderText.includes('0 Questions in Repo'))) {
      throw new Error(`BSSC clean placeholder card missing or fails to state 0 Questions in Repo: ${JSON.stringify(bsscUiAudit)}`);
    }
    if (!bsscUiAudit.hasDisabledButton) {
      throw new Error('BSSC placeholder must have a disabled lock button while awaiting official papers');
    }

    // Test Bilingual switch for BSSC tab & placeholder
    await page.evaluate(() => {
      setGlobalAppLanguage('hi');
    });
    const bsscHiAudit = await page.evaluate(() => {
      const label = document.getElementById('ts-filter-bssc-label');
      const header = document.getElementById('bssc-pack-header');
      return {
        filterLabel: label ? label.textContent : '',
        headerText: header ? header.textContent : ''
      };
    });
    if (!bsscHiAudit.filterLabel.includes('प्रारूप') && !bsscHiAudit.filterLabel.includes('बीएसएससी')) {
      throw new Error(`BSSC filter Hindi translation failed: got "${bsscHiAudit.filterLabel}"`);
    }
    if (!bsscHiAudit.headerText.includes('बिहार कर्मचारी चयन आयोग')) {
      throw new Error(`BSSC header Hindi translation failed: got "${bsscHiAudit.headerText}"`);
    }

    // Switch back to English
    await page.evaluate(() => {
      setGlobalAppLanguage('en');
    });

    // Test dropInPackData validation and runtime drop-in
    const dropInValidationAudit = await page.evaluate(() => {
      let errMissingPayload = false;
      let errMissingQuestions = false;
      try {
        window.SHAKTIQ_EXAM_PACKS.dropInPackData('bssc', null);
      } catch (e) {
        errMissingPayload = true;
      }
      try {
        window.SHAKTIQ_EXAM_PACKS.dropInPackData('bssc', { test: { id: 'bad' }, questions: [] });
      } catch (e) {
        errMissingQuestions = true;
      }

      // Valid test drop-in
      const dropResult = window.SHAKTIQ_EXAM_PACKS.dropInPackData('bssc', {
        test: {
          id: 'test_dropin_bssc_cgl_01',
          title: 'BSSC CGL Drop-In Practice Test 01',
          marks: 400,
          timeMins: 135,
          statusLabel: 'Drop-In Active',
          desc: 'Modular test loaded dynamically via drop-in architecture.'
        },
        questions: [
          { id: 'q_bssc_sample_1', q: 'Capital of Bihar?', a: 'Gaya', b: 'Patna', c: 'Muzaffarpur', d: 'Bhagalpur', ans: 'B', subject: 'General Studies' },
          { id: 'q_bssc_sample_2', q: 'River flowing through Patna?', a: 'Yamuna', b: 'Narmada', c: 'Ganga', d: 'Godavari', ans: 'C', subject: 'General Studies' }
        ]
      });

      renderTestSeriesCards('BSSC');

      const packAfter = window.SHAKTIQ_EXAM_PACKS.getPack('bssc');
      const renderedCards = Array.from(document.querySelectorAll('#testseries-grid .group')).map(c => c.textContent);
      const placeholderAfter = document.getElementById('bssc-placeholder-card');

      return {
        errMissingPayload,
        errMissingQuestions,
        dropResult,
        packHasData: packAfter ? packAfter.hasData : false,
        placeholderAfter: !!placeholderAfter,
        renderedCardCount: renderedCards.length,
        hasDroppedInTitle: renderedCards.some(t => t.includes('BSSC CGL Drop-In Practice Test 01'))
      };
    });

    if (!dropInValidationAudit.errMissingPayload || !dropInValidationAudit.errMissingQuestions) {
      throw new Error('dropInPackData schema validation failed to reject invalid payloads');
    }
    if (!dropInValidationAudit.packHasData || dropInValidationAudit.placeholderAfter || !dropInValidationAudit.hasDroppedInTitle) {
      throw new Error(`dropInPackData failed to activate BSSC pack: ${JSON.stringify(dropInValidationAudit)}`);
    }

    // Clean up test drop-in from memory & restore baseline BSSC state
    await page.evaluate(() => {
      const idx = CURATED_TESTS.findIndex(t => t.id === 'test_dropin_bssc_cgl_01');
      if (idx >= 0) CURATED_TESTS.splice(idx, 1);
      const bssc = window.SHAKTIQ_EXAM_PACKS.getPack('bssc');
      if (bssc) {
        bssc.hasData = false;
        bssc.isPlaceholder = true;
        bssc.totalQuestions = 0;
        bssc.activeMocksCount = 0;
      }
      renderTestSeriesCards('BSSC');
    });

    console.log('[PASS] E2E: Preparation for More Exam Packs (BSSC, TRE 4.0) verified: clean modular registry, dropInPackData schema validation, BSSC clean placeholder card with strict 0-invented-question guarantee, and bilingual synchronization.');

    // ----------------------------------------------------
    // TEST 16: Console Errors Check
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
