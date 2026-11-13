const { captureScreenshots } = require('./inspect');

async function run() {
  console.log('Capturing Feature 1.4 - Mock view with floating Question Grid button...');
  await captureScreenshots({
    featureName: '1_4_palette_button',
    route: '',
    onPageAction: async (page) => {
      await page.evaluate(async () => {
        await loadQuestionsData(true);
        startMockTest('ts_71st_cce');
      });
      await page.waitForSelector('#test-taking-workspace:not(.hidden)', { timeout: 8000 });
      await page.waitForFunction(() => typeof currentMockQuestions !== 'undefined' && currentMockQuestions.length > 0, { timeout: 8000 });
    }
  });

  console.log('Capturing Feature 1.4 - Mobile off-canvas drawer opened...');
  await captureScreenshots({
    featureName: '1_4_palette_drawer_open',
    route: '',
    onPageAction: async (page) => {
      await page.evaluate(async () => {
        await loadQuestionsData(true);
        startMockTest('ts_71st_cce');
      });
      await page.waitForSelector('#test-taking-workspace:not(.hidden)', { timeout: 8000 });
      await page.waitForFunction(() => typeof currentMockQuestions !== 'undefined' && currentMockQuestions.length > 0, { timeout: 8000 });
      await page.evaluate(() => {
        if (typeof openPaletteDrawer === 'function') {
          openPaletteDrawer();
        }
      });
      // Wait for slide-up animation to complete
      await new Promise(r => setTimeout(r, 600));
    }
  });

  console.log('Inspection captures completed.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
