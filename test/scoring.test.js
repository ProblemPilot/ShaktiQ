/**
 * Scoring Formula Test
 * Verifies BPSC marking scheme:
 * - Correct: +1.0
 * - Wrong (A-D): -1/3 (-0.33)
 * - Option E (Safe Skip): 0
 * - Blank (Unbubbled): -1/3 (-0.33)
 * Formula: netScore = ((correct * 3 - wrong - blank) / 3).toFixed(2)
 */

function calculateBpscScore(correct, wrong, safeSkip, blank) {
  return ((correct * 3 - wrong - blank) / 3).toFixed(2);
}

function runScoringTests() {
  const cases = [
    { name: 'All 150 Correct', correct: 150, wrong: 0, safeSkip: 0, blank: 0, expected: '150.00' },
    { name: 'All 150 Wrong', correct: 0, wrong: 150, safeSkip: 0, blank: 0, expected: '-50.00' },
    { name: 'All 150 Option E (Safe Skip)', correct: 0, wrong: 0, safeSkip: 150, blank: 0, expected: '0.00' },
    { name: 'All 150 Blank', correct: 0, wrong: 0, safeSkip: 0, blank: 150, expected: '-50.00' },
    { name: '100 Correct, 30 Wrong, 10 Safe Skip, 10 Blank', correct: 100, wrong: 30, safeSkip: 10, blank: 10, expected: '86.67' },
    { name: '90 Correct, 30 Wrong, 30 Safe Skip, 0 Blank', correct: 90, wrong: 30, safeSkip: 30, blank: 0, expected: '80.00' },
    { name: '10 Correct, 20 Wrong, 100 Safe Skip, 20 Blank', correct: 10, wrong: 20, safeSkip: 100, blank: 20, expected: '-3.33' },
    { name: 'Single Correct Question', correct: 1, wrong: 0, safeSkip: 0, blank: 0, expected: '1.00' },
    { name: 'Single Wrong Question', correct: 0, wrong: 1, safeSkip: 0, blank: 0, expected: '-0.33' },
    { name: 'Single Option E Safe Skip', correct: 0, wrong: 0, safeSkip: 1, blank: 0, expected: '0.00' },
    { name: 'Single Blank Question', correct: 0, wrong: 0, safeSkip: 0, blank: 1, expected: '-0.33' }
  ];

  for (const c of cases) {
    const actual = calculateBpscScore(c.correct, c.wrong, c.safeSkip, c.blank);
    if (actual !== c.expected) {
      throw new Error(`Scoring test "${c.name}" failed! Expected ${c.expected}, got ${actual}`);
    }
  }

  console.log(`[PASS] Scoring Tests: All ${cases.length} marking calculation test cases passed.`);
  return true;
}

if (require.main === module) {
  try {
    runScoringTests();
    process.exit(0);
  } catch (err) {
    console.error(`[FAIL] Scoring Tests: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { calculateBpscScore, runScoringTests };
