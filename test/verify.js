/**
 * Master Verification Safety Net (npm run verify)
 * Runs all validation suites and exits with code 0 ONLY if all pass.
 */
const { runChecksumTest } = require('./checksum.test');
const { runScoringTests } = require('./scoring.test');
const { runStaticChecks } = require('./static.test');
const { runAccessibilityTests } = require('./accessibility.test');
const { runE2ETests } = require('./e2e.test');

async function main() {
  console.log('====================================================');
  console.log('  SHAKTIQ MASTER VERIFICATION SAFETY NET (SUITE)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function step(name, fn) {
    process.stdout.write(`[RUNNING] ${name} ... `);
    try {
      await fn();
      console.log(`✓ PASSED`);
      passed++;
    } catch (err) {
      console.log(`✗ FAILED: ${err.message}`);
      failed++;
      throw err;
    }
  }

  try {
    await step('1. Question Bank Data Checksums & Schema', async () => {
      runChecksumTest();
    });

    await step('2. BPSC Marking Scheme & Scoring Rules', async () => {
      runScoringTests();
    });

    await step('3. Static Audits (H1, Meta, JSON-LD, Anchors)', async () => {
      runStaticChecks();
    });

    await step('4. Accessibility, Labels & WCAG AAA Contrast', async () => {
      runAccessibilityTests();
    });

    await step('5. Headless E2E (Timer, Palette, Auth, Language, Console)', async () => {
      await runE2ETests();
    });

    console.log('\n====================================================');
    console.log(`  VERIFICATION COMPLETE: ${passed} PASSED, 0 FAILED`);
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n====================================================');
    console.error(`  VERIFICATION FAILED: ${failed} SUITE(S) FAILED`);
    console.error('====================================================\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
