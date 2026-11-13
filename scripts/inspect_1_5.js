const { captureScreenshots } = require('./inspect');

async function run() {
  console.log('Capturing Feature 1.5 - Question Bank header (closed state)...');
  await captureScreenshots({
    featureName: '1_5_more_menu_closed',
    route: '#pyq-bank',
    onPageAction: async (page) => {
      await page.evaluate(async () => {
        await loadQuestionsData(true);
        openPyqBankMode();
      });
      await page.waitForSelector('#qb-sticky-header:not(.hidden)', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 400));
    }
  });

  console.log('Capturing Feature 1.5 - Mobile Secondary "More" menu opened...');
  await captureScreenshots({
    featureName: '1_5_more_menu_opened',
    route: '#pyq-bank',
    onPageAction: async (page) => {
      await page.evaluate(async () => {
        await loadQuestionsData(true);
        openPyqBankMode();
        // If on mobile, open more menu
        const moreBtn = document.getElementById('mobileMoreMenuBtn');
        if (moreBtn && window.getComputedStyle(moreBtn).display !== 'none') {
          if (typeof toggleMobileMoreMenu === 'function') {
            toggleMobileMoreMenu();
          }
        }
      });
      await new Promise(r => setTimeout(r, 400));
    }
  });

  console.log('Inspection captures completed for Feature 1.5.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
