const puppeteer = require('puppeteer-core');
const { createServer } = require('./server');
const fs = require('fs');
const path = require('path');

const PORT = 8096;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../screenshots/feature-3-3');

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1280x800', width: 1280, height: 800 }
];

async function runInspection(round = 1) {
  const roundDir = path.join(OUTPUT_DIR, `round-${round}`);
  if (!fs.existsSync(roundDir)) {
    fs.mkdirSync(roundDir, { recursive: true });
  }

  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[INSPECT 3.3] Test server listening on http://localhost:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const defects = [];

  try {
    const page = await browser.newPage();

    // Authenticate user before loading
    await page.goto(`http://localhost:${PORT}/#top`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const student = {
        name: 'Visual Reviewer',
        email: 'reviewer@shaktiq.com',
        phone: '9876543210',
        district: 'Patna',
        targetYear: '2026',
        medium: 'English'
      };
      localStorage.setItem('shaktiq_user_profile', JSON.stringify(student));
      localStorage.setItem('pwa_current_aspirant', JSON.stringify(student));
      localStorage.setItem('shaktiq_auth_token', 'sq_test_token_verified');
    });

    // Reload with auth intact
    await page.goto(`http://localhost:${PORT}/#top`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Navigate to Test Series view and activate BSSC tab
    await page.evaluate(() => {
      openTestSeriesMode();
      filterTestSeries('BSSC');
    });
    await new Promise(r => setTimeout(r, 400));

    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise(r => setTimeout(r, 300));

      // Test English View
      await page.evaluate(() => setGlobalAppLanguage('en'));
      await new Promise(r => setTimeout(r, 200));

      const enShotPath = path.join(roundDir, `bssc_placeholder_${vp.name}_en.png`);
      await page.screenshot({ path: enShotPath, fullPage: false });

      // Check visual layout metrics for English
      const enMetrics = await page.evaluate((vpWidth) => {
        const header = document.getElementById('bssc-pack-header');
        const card = document.getElementById('bssc-placeholder-card');
        const bodyScroll = document.body.scrollWidth;

        return {
          hasHeader: !!header,
          hasCard: !!card,
          hasOverflow: bodyScroll > vpWidth + 5,
          headerVisible: header ? header.offsetHeight > 0 : false,
          cardVisible: card ? card.offsetHeight > 0 : false
        };
      }, vp.width);

      if (!enMetrics.hasHeader || !enMetrics.headerVisible) {
        defects.push(`[${vp.name} EN] BSSC header not visible`);
      }
      if (!enMetrics.hasCard || !enMetrics.cardVisible) {
        defects.push(`[${vp.name} EN] BSSC placeholder card not visible`);
      }
      if (enMetrics.hasOverflow) {
        defects.push(`[${vp.name} EN] Horizontal overflow detected (body: ${enMetrics.bodyScroll} > ${vp.width})`);
      }

      // Test Hindi View
      await page.evaluate(() => setGlobalAppLanguage('hi'));
      await new Promise(r => setTimeout(r, 200));

      const hiShotPath = path.join(roundDir, `bssc_placeholder_${vp.name}_hi.png`);
      await page.screenshot({ path: hiShotPath, fullPage: false });

      // Check visual layout metrics for Hindi
      const hiMetrics = await page.evaluate((vpWidth) => {
        const header = document.getElementById('bssc-pack-header');
        const card = document.getElementById('bssc-placeholder-card');
        const bodyScroll = document.body.scrollWidth;

        return {
          hasHeader: !!header,
          hasCard: !!card,
          hasOverflow: bodyScroll > vpWidth + 5,
          headerVisible: header ? header.offsetHeight > 0 : false,
          cardVisible: card ? card.offsetHeight > 0 : false
        };
      }, vp.width);

      if (!hiMetrics.hasHeader || !hiMetrics.headerVisible) {
        defects.push(`[${vp.name} HI] BSSC header not visible in Hindi`);
      }
      if (!hiMetrics.hasCard || !hiMetrics.cardVisible) {
        defects.push(`[${vp.name} HI] BSSC placeholder card not visible in Hindi`);
      }
      if (hiMetrics.hasOverflow) {
        defects.push(`[${vp.name} HI] Horizontal overflow detected in Hindi`);
      }

      console.log(`[INSPECT 3.3] Round ${round}: Captured ${vp.name} EN & HI.`);
    }

  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    console.log(`[INSPECT 3.3] Round ${round} complete.`);
  }

  return defects;
}

async function runTwoRounds() {
  console.log('=== FEATURE 3.3: PREPARATION FOR MORE EXAM PACKS INSPECTION ===');
  console.log('Starting Round 1 visual inspection...');
  const round1Defects = await runInspection(1);
  if (round1Defects.length > 0) {
    console.error('[DEFECTS ROUND 1]', round1Defects);
    process.exit(1);
  }
  console.log('[PASS] Round 1: Zero defects found across all 5 viewports in EN & HI.');

  console.log('\nStarting Round 2 visual inspection (consistency verification)...');
  const round2Defects = await runInspection(2);
  if (round2Defects.length > 0) {
    console.error('[DEFECTS ROUND 2]', round2Defects);
    process.exit(1);
  }
  console.log('[PASS] Round 2: Zero defects found across all 5 viewports in EN & HI.');
  console.log('[SUCCESS] 2 consecutive clean inspection rounds verified.');
}

if (require.main === module) {
  runTwoRounds().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  });
}
