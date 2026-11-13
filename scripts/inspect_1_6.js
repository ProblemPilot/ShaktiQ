const { captureScreenshots } = require('./inspect');

async function run() {
  console.log('Capturing Feature 1.6 - Landing Page with Dynamic Meta across 5 viewports (Round 1)...');
  await captureScreenshots({
    featureName: '1_6_meta_landing',
    route: '',
    onPageAction: async (page) => {
      await page.waitForSelector('h1', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 400));
    }
  });

  console.log('Capturing Feature 1.6 - Test Series with Dynamic Meta across 5 viewports (Round 1)...');
  await captureScreenshots({
    featureName: '1_6_meta_testseries',
    route: '#test-series',
    onPageAction: async (page) => {
      await page.evaluate(async () => {
        await loadQuestionsData(true);
        openTestSeriesMode();
      });
      await page.waitForSelector('#view-testseries:not(.hidden)', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 400));
    }
  });

  console.log('Inspection captures completed for Feature 1.6.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
