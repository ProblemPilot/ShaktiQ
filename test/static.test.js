/**
 * Static Checks Test
 * Verifies:
 * - Exactly one <h1> tag
 * - Title and meta description present
 * - Valid JSON-LD structured data
 * - No broken internal hash anchors
 */
const fs = require('fs');
const path = require('path');

function runStaticChecks() {
  const htmlPath = path.resolve(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // 1. Check <h1> count
  const h1Matches = html.match(/<h1[\s>]/gi) || [];
  if (h1Matches.length !== 1) {
    throw new Error(`Expected exactly 1 <h1> tag, but found ${h1Matches.length}`);
  }

  // 2. Check <title>
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    throw new Error('Missing or empty <title> tag');
  }

  // 3. Check <meta name="description">
  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!metaDescMatch || !metaDescMatch[1].trim()) {
    throw new Error('Missing or empty <meta name="description"> tag');
  }

  // 4. Check JSON-LD validity
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match;
  let jsonLdCount = 0;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    jsonLdCount++;
    const jsonStr = match[1].trim();
    try {
      JSON.parse(jsonStr);
    } catch (e) {
      throw new Error(`Invalid JSON-LD block #${jsonLdCount}: ${e.message}`);
    }
  }
  if (jsonLdCount === 0) {
    throw new Error('No JSON-LD structured data found in index.html');
  }

  // 5. Check internal anchor targets
  // Collect all ids in the document
  const idRegex = /\sid=["']([^"']+)["']/gi;
  const existingIds = new Set();
  while ((match = idRegex.exec(html)) !== null) {
    existingIds.add(match[1]);
  }

  // Collect all internal hash links <a href="#...">
  const hrefHashRegex = /<a\s+[^>]*href=["']#([^"']*)["']/gi;
  const knownRouteHashes = new Set([
    '', 'top', 'test-series', 'speed-drills', 'pyq-bank', 'practice-bpsc-pyq',
    'mistakes', 'analytics', 'admin', 'manage', 'exams', 'practice'
  ]);

  const brokenAnchors = [];
  while ((match = hrefHashRegex.exec(html)) !== null) {
    const anchor = match[1];
    if (!knownRouteHashes.has(anchor) && !existingIds.has(anchor)) {
      brokenAnchors.push(anchor);
    }
  }

  if (brokenAnchors.length > 0) {
    throw new Error(`Found broken internal anchors: ${brokenAnchors.join(', ')}`);
  }

  console.log(`[PASS] Static Checks: 1 <h1> verified, title & meta present, ${jsonLdCount} JSON-LD blocks valid, 0 broken anchors.`);
  return true;
}

if (require.main === module) {
  try {
    runStaticChecks();
    process.exit(0);
  } catch (err) {
    console.error(`[FAIL] Static Checks: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { runStaticChecks };
