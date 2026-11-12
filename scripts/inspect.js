/**
 * Visual Inspector Script for Human-Eye Loop
 * Takes screenshots across 5 viewports in both English and Hindi.
 * Viewports:
 * - 360x800 (cheap Android)
 * - 390x844 (standard iPhone)
 * - 412x915 (Pixel)
 * - 768x1024 (tablet)
 * - 1280x800 (desktop)
 */
const puppeteer = require('puppeteer-core');
const { createServer } = require('./server');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORTS = [
  { name: 'android-360x800', width: 360, height: 800 },
  { name: 'iphone-390x844', width: 390, height: 844 },
  { name: 'pixel-412x915', width: 412, height: 915 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'desktop-1280x800', width: 1280, height: 800 }
];

async function captureScreenshots(options = {}) {
  const {
    featureName = 'inspection',
    route = '',
    onPageAction = null,
    outDir = path.resolve(__dirname, '..', 'screenshots', featureName)
  } = options;

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const server = createServer();
  const port = 8100 + Math.floor(Math.random() * 100);
  await new Promise((r) => server.listen(port, r));

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const capturedFiles = [];

  try {
    for (const lang of ['en', 'hi']) {
      for (const vp of VIEWPORTS) {
        const page = await browser.newPage();
        await page.setBypassServiceWorker(true);
        await page.setViewport({ width: vp.width, height: vp.height });

        // Seed authenticated profile
        await page.evaluateOnNewDocument((langPref) => {
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
          localStorage.setItem('shaktiq_preferred_lang', langPref);
        }, lang);

        const targetUrl = `http://localhost:${port}/${route}`;
        await page.goto(targetUrl, { waitUntil: 'networkidle0' });

        // Ensure language is set in page
        await page.evaluate(async (langPref) => {
          if (typeof setGlobalAppLanguage === 'function') {
            setGlobalAppLanguage(langPref);
          }
          if (typeof loadQuestionsData === 'function') {
            await loadQuestionsData(true);
          }
        }, lang);

        if (typeof onPageAction === 'function') {
          await onPageAction(page);
        }

        // Small wait for rendering and transitions to settle
        await new Promise(r => setTimeout(r, 400));

        const fileName = `${featureName}_${lang}_${vp.name}.png`;
        const filePath = path.join(outDir, fileName);
        await page.screenshot({ path: filePath, fullPage: false });
        capturedFiles.push(filePath);
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }

  console.log(`[INSPECTION] Captured ${capturedFiles.length} screenshots in ${outDir}`);
  return capturedFiles;
}

if (require.main === module) {
  const feature = process.argv[2] || 'general';
  captureScreenshots({ featureName: feature }).then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('Inspection capture failed:', err);
    process.exit(1);
  });
}

module.exports = { captureScreenshots, VIEWPORTS };
