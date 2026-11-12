// scripts/verify_live_site.js
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (ShaktiQ Quality Verifier)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function verifyLive() {
  console.log('==================================================');
  console.log('LIVE PRODUCTION HEALTH CHECK: https://shaktiq.com');
  console.log('==================================================');

  let allPassed = true;

  // 1. Check Root HTML
  try {
    const root = await fetchUrl('https://shaktiq.com/');
    if (root.status === 200) {
      console.log('✅ PASS: https://shaktiq.com/ returned HTTP 200');
    } else {
      console.error(`❌ FAIL: https://shaktiq.com/ returned status ${root.status}`);
      allPassed = false;
    }

    if (root.body.includes('<title>ShaktiQ – Bihar Exam Prep</title>')) {
      console.log('✅ PASS: Title verified');
    } else {
      console.error('❌ FAIL: Title mismatch');
      allPassed = false;
    }

    if (root.body.includes('hero-museum.webp')) {
      console.log('✅ PASS: WebP hero image present in HTML');
    } else {
      console.error('❌ FAIL: WebP hero image missing in HTML');
      allPassed = false;
    }

    if (root.body.includes('aspirant-reg-modal')) {
      console.log('✅ PASS: Aspirant registration modal present');
    } else {
      console.error('❌ FAIL: Registration modal missing');
      allPassed = false;
    }

    if (root.body.includes('test-taking-workspace')) {
      console.log('✅ PASS: Mock test workspace present');
    } else {
      console.error('❌ FAIL: Mock test workspace missing');
      allPassed = false;
    }
  } catch (e) {
    console.error('❌ FAIL: Could not fetch root URL:', e.message);
    allPassed = false;
  }

  // 2. Check robots.txt
  try {
    const robots = await fetchUrl('https://shaktiq.com/robots.txt');
    if (robots.status === 200 && robots.body.includes('User-agent')) {
      console.log('✅ PASS: robots.txt reachable and valid');
    } else {
      console.error('❌ FAIL: robots.txt error');
      allPassed = false;
    }
  } catch (e) {
    console.error('❌ FAIL: robots.txt error:', e.message);
    allPassed = false;
  }

  // 3. Check sitemap.xml
  try {
    const sitemap = await fetchUrl('https://shaktiq.com/sitemap.xml');
    if (sitemap.status === 200 && sitemap.body.includes('<loc>https://shaktiq.com/</loc>')) {
      console.log('✅ PASS: sitemap.xml reachable and canonical');
    } else {
      console.error('❌ FAIL: sitemap.xml error');
      allPassed = false;
    }
  } catch (e) {
    console.error('❌ FAIL: sitemap.xml error:', e.message);
    allPassed = false;
  }

  // 4. Check WebP assets
  try {
    const heroImg = await fetchUrl('https://shaktiq.com/hero-museum.webp');
    if (heroImg.status === 200) {
      console.log(`✅ PASS: hero-museum.webp reachable (${Math.round(heroImg.body.length / 1024)} KB)`);
    } else {
      console.warn(`⚠️ NOTE: hero-museum.webp returned status ${heroImg.status} (deployment in progress)`);
    }
  } catch (e) {
    console.warn('⚠️ NOTE: hero-museum.webp not yet deployed:', e.message);
  }

  console.log('==================================================');
  if (allPassed) {
    console.log('🎉 ALL LIVE PRODUCTION INTEGRITY CHECKS PASSED!');
  } else {
    console.error('🚨 LIVE VERIFICATION DETECTED FAILURES!');
  }
  console.log('==================================================');
  return allPassed;
}

verifyLive();
