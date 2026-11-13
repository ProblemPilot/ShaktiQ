const { captureScreenshots } = require('./inspect');

async function run() {
  console.log('Capturing Feature 1.7 - Result Modal with Share Actions across 5 viewports (Round 1)...');
  await captureScreenshots({
    featureName: '1_7_share_result_modal',
    route: '',
    onPageAction: async (page) => {
      await page.evaluate(async () => {
        await loadQuestionsData(true);
        startMockTest('ts_71st_cce');
        ttSelectOption('B');
        submitMockTest();
      });
      await page.waitForSelector('#tt-result-modal:not(.hidden)', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 600));
    }
  });

  console.log('Inspection captures completed for Feature 1.7.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
