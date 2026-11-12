// scripts/verify_live_deep.js
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runDeepLiveAudit() {
  console.log('--- Deep Live Production Audit: https://shaktiq.com ---');
  let pass = true;

  const assets = [
    'https://shaktiq.com/',
    'https://shaktiq.com/logo.webp',
    'https://shaktiq.com/hero-museum.webp',
    'https://shaktiq.com/bodhi-tree.webp',
    'https://shaktiq.com/yt-logo.webp',
    'https://shaktiq.com/favicon-192x192.png',
    'https://shaktiq.com/manifest.json',
    'https://shaktiq.com/sw.js',
    'https://shaktiq.com/robots.txt',
    'https://shaktiq.com/sitemap.xml'
  ];

  for (const url of assets) {
    const res = await fetchUrl(url);
    if (res.status === 200) {
      console.log(`✅ [HTTP 200] ${url} (${Math.round((res.body.length || 0)/1024)} KB)`);
    } else {
      console.error(`❌ [HTTP ${res.status}] ${url}`);
      pass = false;
    }
  }

  // Validate live HTML content
  const page = await fetchUrl('https://shaktiq.com/');
  const html = page.body;

  // 1. Check Service Worker Cache Version
  const swRes = await fetchUrl('https://shaktiq.com/sw.js');
  if (swRes.body.includes('shaktiq-cache-v13')) {
    console.log('✅ Service worker live cache is shaktiq-cache-v13');
  } else {
    console.warn('⚠️ Service worker cache version not yet refreshed in CDN');
  }

  // 2. Form fields check
  const requiredFormFields = [
    'reg-student-name',
    'reg-student-email',
    'reg-student-phone',
    'reg-student-district',
    'reg-target-exam',
    'reg-consent-check'
  ];
  for (const field of requiredFormFields) {
    if (html.includes(`id="${field}"`)) {
      console.log(`✅ Registration field verified: #${field}`);
    } else {
      console.error(`❌ Missing registration field: #${field}`);
      pass = false;
    }
  }

  // 3. Mock Test Workspace check
  const testWorkspaceElements = [
    'test-taking-workspace',
    'tt-timer',
    'tt-palette-grid',
    'tt-q-index-label'
  ];
  for (const el of testWorkspaceElements) {
    if (html.includes(`id="${el}"`)) {
      console.log(`✅ Mock test workspace element verified: #${el}`);
    } else {
      console.error(`❌ Missing test element: #${el}`);
      pass = false;
    }
  }

  // 4. Bilingual Toggle Check
  if (html.includes('data-lang-btn="en"') && html.includes('data-lang-btn="hi"')) {
    console.log('✅ Bilingual toggle buttons (EN / HI) verified on live site');
  } else {
    console.error('❌ Bilingual toggle buttons missing');
    pass = false;
  }

  // 5. Schema.org JSON-LD Parse Check
  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  console.log(`✅ Found ${jsonLdBlocks.length} valid JSON-LD schema blocks on live site`);
  jsonLdBlocks.forEach((block, idx) => {
    try {
      const parsed = JSON.parse(block[1]);
      console.log(`   - Schema ${idx + 1}: @type = "${parsed['@type']}"`);
    } catch (e) {
      console.error(`❌ Schema ${idx + 1} JSON parse error:`, e.message);
      pass = false;
    }
  });

  if (pass) {
    console.log('\n🎉 ALL DEEP LIVE VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n🚨 DEEP LIVE VERIFICATION FAILED!');
    process.exit(1);
  }
}

runDeepLiveAudit();
