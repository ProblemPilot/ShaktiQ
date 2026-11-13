const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function generateShareCard() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

  // Read logo-white as base64
  const logoPath = path.resolve(__dirname, '..', 'logo-white.png');
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      background: radial-gradient(circle at 85% 20%, #17593F 0%, #10402D 45%, #0B2B1E 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 80px;
      position: relative;
    }
    /* Subtle decorative background watermark rings */
    .deco-ring-1 {
      position: absolute;
      right: -80px;
      top: -80px;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      border: 2px solid rgba(252, 226, 123, 0.12);
      pointer-events: none;
    }
    .deco-ring-2 {
      position: absolute;
      right: -160px;
      top: -160px;
      width: 660px;
      height: 660px;
      border-radius: 50%;
      border: 1px dashed rgba(255, 255, 255, 0.08);
      pointer-events: none;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }
    .logo {
      height: 70px;
      width: auto;
      object-fit: contain;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(252, 226, 123, 0.15);
      border: 1px solid rgba(252, 226, 123, 0.4);
      color: #FCE27B;
      padding: 8px 18px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #FCE27B;
    }
    .content {
      z-index: 10;
      max-width: 900px;
    }
    .title {
      font-size: 52px;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      margin-bottom: 16px;
    }
    .title span {
      color: #FCE27B;
    }
    .subtitle {
      font-size: 24px;
      color: #DCE6DF;
      line-height: 1.4;
      font-weight: 500;
      margin-bottom: 28px;
    }
    .pills {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .pill {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #FFFFFF;
      padding: 10px 20px;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pill strong {
      color: #FCE27B;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 24px;
      z-index: 10;
      font-size: 16px;
      color: #A3B8AA;
      font-weight: 600;
    }
    .url {
      color: #FFFFFF;
      font-weight: 800;
      letter-spacing: 0.02em;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="deco-ring-1"></div>
  <div class="deco-ring-2"></div>

  <div class="header">
    <img src="${logoDataUri}" alt="ShaktiQ Logo" class="logo">
    <div class="badge">
      <span class="badge-dot"></span>
      <span>BPSC Prelims 2025–2026</span>
    </div>
  </div>

  <div class="content">
    <h1 class="title">Decode Bihar's Toughest Exams — <span>All in One Place.</span></h1>
    <p class="subtitle">Official BPSC pattern practice, authenticated answer keys, and intelligent active recall simulations.</p>
    
    <div class="pills">
      <div class="pill">📚 <strong>2,800+</strong> PYQ Bank</div>
      <div class="pill">⏱️ <strong>22</strong> Full Mocks</div>
      <div class="pill">🛡️ <strong>Option E</strong> Safe-Skip Rules</div>
      <div class="pill">🇮🇳 <strong>English &amp; हिन्दी</strong></div>
    </div>
  </div>

  <div class="footer">
    <span class="url">shaktiq.com</span>
    <span>Attempt-First Active Recall System</span>
    <span>Patna, Bihar</span>
  </div>
</body>
</html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  const outPath = path.resolve(__dirname, '..', 'share-card.png');
  await page.screenshot({ path: outPath, type: 'png' });
  await browser.close();

  console.log(`[SHARE-CARD] Successfully generated 1200x630 share card at: ${outPath}`);
}

generateShareCard().catch(err => {
  console.error('Failed to generate share card:', err);
  process.exit(1);
});
