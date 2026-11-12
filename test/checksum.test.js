/**
 * Checksum & Data Integrity Test
 * Verifies that questions data is 100% frozen, intact, and matches baseline hash.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASELINE_HASH = '10232aecc15e8ca0838a07cd486afd36e394999ff3ea537b2702b0fe1194e17a';
const EXPECTED_COUNT = 2809;

function runChecksumTest() {
  const filePath = path.resolve(__dirname, '..', 'questions_bank_source.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Authoritative question file questions_bank_source.json not found at ${filePath}`);
  }

  const raw = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(raw).digest('hex');

  if (hash !== BASELINE_HASH) {
    throw new Error(`Data checksum mismatch! Expected ${BASELINE_HASH}, got ${hash}. Questions data MUST NOT be modified.`);
  }

  const questions = JSON.parse(raw.toString('utf8'));
  if (!Array.isArray(questions)) {
    throw new Error('questions_bank_source.json is not a valid JSON array');
  }

  if (questions.length !== EXPECTED_COUNT) {
    throw new Error(`Expected exactly ${EXPECTED_COUNT} questions, but found ${questions.length}`);
  }

  // Validate schema of each question
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.id || !q.exam || !q.subject || !q.q || !q.ans) {
      throw new Error(`Question at index ${i} is missing mandatory fields: ${JSON.stringify(q)}`);
    }
  }

  console.log(`[PASS] Checksum Test: Exactly ${EXPECTED_COUNT} questions verified with SHA-256 ${hash}`);
  return true;
}

if (require.main === module) {
  try {
    runChecksumTest();
    process.exit(0);
  } catch (err) {
    console.error(`[FAIL] Checksum Test: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { runChecksumTest, BASELINE_HASH, EXPECTED_COUNT };
