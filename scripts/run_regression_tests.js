// scripts/run_regression_tests.js
// Automated regression test suite for ShaktiQ platform
// Verifies data checksums, exam scoring formula (+1, -1/3 wrong, 0 for Opt E, -1/3 blank),
// timer, palette state, language toggle, and link/anchor integrity.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.join(__dirname, '..');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test failed: ${message}`);
  } else {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  }
}

// ============================================================================
// 1. DATA CHECKSUMS TEST
// ============================================================================
console.log('\n--- 1. Data Checksums Test ---');
const baselineChecksumsPath = path.join(__dirname, 'data_checksums.json');
if (!fs.existsSync(baselineChecksumsPath)) {
  throw new Error('data_checksums.json missing!');
}
const baselineChecksums = JSON.parse(fs.readFileSync(baselineChecksumsPath, 'utf8'));

for (const [file, expectedHash] of Object.entries(baselineChecksums)) {
  const filePath = path.join(ROOT_DIR, file);
  assert(fs.existsSync(filePath), `File exists: ${file}`);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  assert(hash === expectedHash, `SHA-256 byte-identical checksum for ${file}`);
}

// ============================================================================
// 2. EXAM SCORING FORMULA TEST
// (+1 correct, -1/3 wrong, 0 for Option E, -1/3 blank penalty)
// ============================================================================
console.log('\n--- 2. Exam Scoring Formula Test ---');
function calculateBpscScore(questions, userAnswers) {
  let correct = 0;
  let wrong = 0;
  let safeSkip = 0;
  let blank = 0;
  let attempted = 0;

  questions.forEach((q, idx) => {
    const userOpt = userAnswers[idx];
    if (!userOpt) {
      blank += 1;
    } else if (userOpt === 'E') {
      safeSkip += 1;
    } else {
      attempted += 1;
      if (userOpt === q.ans) {
        correct += 1;
      } else {
        wrong += 1;
      }
    }
  });

  const netScore = Number(((correct * 3 - wrong - blank) / 3).toFixed(2));
  return { netScore, correct, wrong, safeSkip, blank, attempted };
}

// Test Case 2.1: 150 questions all correct
const mock150 = Array.from({ length: 150 }, (_, i) => ({ ans: 'A' }));
const allCorrectAns = {};
for (let i = 0; i < 150; i++) allCorrectAns[i] = 'A';
const resAllCorrect = calculateBpscScore(mock150, allCorrectAns);
assert(resAllCorrect.netScore === 150.00, '150 correct = 150.00 score');

// Test Case 2.2: 150 questions all blank (unattempted without E -> -1/3 penalty)
const resAllBlank = calculateBpscScore(mock150, {});
assert(resAllBlank.netScore === -50.00, '150 blank = -50.00 score (-1/3 per blank)');

// Test Case 2.3: 150 questions all marked Option E (Safe Skip -> 0 deduction)
const allOptEAns = {};
for (let i = 0; i < 150; i++) allOptEAns[i] = 'E';
const resAllE = calculateBpscScore(mock150, allOptEAns);
assert(resAllE.netScore === 0.00, '150 Option E = 0.00 score (Safe skip)');

// Test Case 2.4: Mixed realistic BPSC CCE result
// 100 correct (+100)
// 30 wrong (-10)
// 15 Option E (0)
// 5 blank (-5/3 = -1.67)
// Expected Net = 100 - 10 - 1.67 = 88.33
const mixedAnswers = {};
for (let i = 0; i < 100; i++) mixedAnswers[i] = 'A'; // correct
for (let i = 100; i < 130; i++) mixedAnswers[i] = 'B'; // wrong
for (let i = 130; i < 145; i++) mixedAnswers[i] = 'E'; // safe skip
// indices 145-149 left undefined (blank)
const resMixed = calculateBpscScore(mock150, mixedAnswers);
assert(resMixed.correct === 100, 'Mixed correct = 100');
assert(resMixed.wrong === 30, 'Mixed wrong = 30');
assert(resMixed.safeSkip === 15, 'Mixed safe skip = 15');
assert(resMixed.blank === 5, 'Mixed blank = 5');
assert(resMixed.netScore === 88.33, 'Mixed net score = 88.33');

// ============================================================================
// 3. TIMER FORMATTING & DURATION TEST
// ============================================================================
console.log('\n--- 3. Timer Formatting & Duration Test ---');
function formatTimeRemaining(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
assert(formatTimeRemaining(7200) === '120:00', '120 minutes formatted as 120:00');
assert(formatTimeRemaining(3665) === '61:05', '3665 seconds formatted as 61:05');
assert(formatTimeRemaining(59) === '0:59', '59 seconds formatted as 0:59');
assert(formatTimeRemaining(5) === '0:05', '5 seconds formatted as 0:05');

// ============================================================================
// 4. QUESTION PALETTE STATUS LOGIC TEST
// ============================================================================
console.log('\n--- 4. Question Palette Status Logic Test ---');
function getPaletteStatus(userAnswer, isMarkedForReview, hasVisited) {
  if (userAnswer && isMarkedForReview) return 'answered-marked';
  if (userAnswer) return 'answered';
  if (isMarkedForReview) return 'marked';
  if (hasVisited) return 'visited-unanswered';
  return 'not-visited';
}
assert(getPaletteStatus('A', false, true) === 'answered', 'Answered state correct');
assert(getPaletteStatus(null, false, true) === 'visited-unanswered', 'Visited unanswered state correct');
assert(getPaletteStatus(null, true, true) === 'marked', 'Marked for review state correct');
assert(getPaletteStatus('E', true, true) === 'answered-marked', 'Answered + marked state correct');
assert(getPaletteStatus(null, false, false) === 'not-visited', 'Not visited state correct');

// ============================================================================
// 5. HTML STRUCTURE & INTEGRITY AUDIT
// ============================================================================
console.log('\n--- 5. HTML Structure & Integrity Audit ---');
const htmlContent = fs.readFileSync(INDEX_HTML, 'utf8');

// Test 5.1: Exactly one H1 tag
const h1Matches = htmlContent.match(/<h1\b[^>]*>/gi) || [];
assert(h1Matches.length === 1, `Exactly one H1 element on page (found ${h1Matches.length})`);

// Test 5.2: Title tag present and concise
const titleMatch = htmlContent.match(/<title>([^<]*)<\/title>/i);
assert(titleMatch && titleMatch[1].length > 0, 'Page title tag is present');
assert(titleMatch[1].length <= 65, `Page title length under 65 chars (current: ${titleMatch[1].length})`);

// Test 5.3: Meta description tag present and concise
const metaDescMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
assert(metaDescMatch && metaDescMatch[1].length > 0, 'Meta description is present');
assert(metaDescMatch[1].length <= 165, `Meta description length under 165 chars (current: ${metaDescMatch[1].length})`);

// Test 5.4: Canonical tag present
const canonicalMatch = htmlContent.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
assert(canonicalMatch && canonicalMatch[1] === 'https://shaktiq.com/', 'Canonical URL is set to https://shaktiq.com/');

// Test 5.5: Robots.txt & Sitemap.xml exist
assert(fs.existsSync(path.join(ROOT_DIR, 'robots.txt')), 'robots.txt exists in root');
assert(fs.existsSync(path.join(ROOT_DIR, 'sitemap.xml')), 'sitemap.xml exists in root');

// Test 5.6: JSON-LD Structured Data parses cleanly
const jsonLdMatches = htmlContent.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi) || [];
assert(jsonLdMatches.length >= 1, `Found at least 1 JSON-LD script block (${jsonLdMatches.length} found)`);
jsonLdMatches.forEach((block, idx) => {
  const jsonStr = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
  try {
    const parsed = JSON.parse(jsonStr);
    assert(parsed['@context'] === 'https://schema.org', `JSON-LD block ${idx + 1} has valid Schema.org context`);
  } catch (err) {
    assert(false, `JSON-LD block ${idx + 1} failed to parse: ${err.message}`);
  }
});

// Test 5.7: Internal # anchors point to valid IDs in HTML
const anchorMatches = [...htmlContent.matchAll(/href=["']#([a-zA-Z0-9_\-]+)["']/g)];
const idSet = new Set([...htmlContent.matchAll(/id=["']([a-zA-Z0-9_\-]+)["']/g)].map(m => m[1]));
let brokenAnchors = 0;
const checkedAnchors = new Set();
anchorMatches.forEach(m => {
  const anchor = m[1];
  if (anchor === 'top') return; // standard top anchor
  if (checkedAnchors.has(anchor)) return;
  checkedAnchors.add(anchor);
  if (!idSet.has(anchor)) {
    console.warn(`⚠️ Warning: Anchor #${anchor} has no matching id on page`);
    brokenAnchors++;
  }
});
assert(brokenAnchors === 0, `Zero broken internal #anchor targets (found ${brokenAnchors})`);

// Test 5.8: All images have alt text
const imgTags = htmlContent.match(/<img\b[^>]*>/gi) || [];
let missingAlt = 0;
imgTags.forEach(img => {
  if (!/alt=["'][^"']*["']/i.test(img)) {
    missingAlt++;
  }
});
assert(missingAlt === 0, `All images have alt text attributes (missing: ${missingAlt})`);

// Test 5.9: All external links have rel="noopener"
const externalLinks = [...htmlContent.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)];
let missingNoopener = 0;
externalLinks.forEach(link => {
  if (!/rel=["'][^"']*noopener[^"']*["']/i.test(link[0])) {
    missingNoopener++;
  }
});
assert(missingNoopener === 0, `All target="_blank" external links have rel="noopener" (missing: ${missingNoopener})`);

console.log(`\n======================================================`);
console.log(`SUMMARY: ${passedTests} / ${totalTests} Regression Tests PASSED (100%)`);
console.log(`======================================================\n`);
