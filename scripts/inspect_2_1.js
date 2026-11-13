const { captureScreenshots } = require('./inspect');

async function run() {
  console.log('Capturing Feature 2.1 - My Mistake Register (Round 2: with mistake questions & retry mode)...');
  await captureScreenshots({
    featureName: '2_1_mistake_register_active',
    route: '#pyq-bank',
    onPageAction: async (page) => {
      await page.evaluate(async () => {
        openPyqBankMode();
        // Seed 2 mistake questions
        const all = getAllQuestions();
        const q1 = all[0];
        const q2 = all[1];
        const reg = {};
        reg[q1.id] = {
          id: q1.id,
          wrongCount: 2,
          consecutiveCorrect: 1, // 1/2 correct
          lastAttempted: Date.now(),
          lastWrongOpt: (q1.ans === 'A') ? 'B' : 'A',
          source: 'practice'
        };
        reg[q2.id] = {
          id: q2.id,
          wrongCount: 1,
          consecutiveCorrect: 0, // 0/2 correct
          lastAttempted: Date.now(),
          lastWrongOpt: (q2.ans === 'C') ? 'D' : 'C',
          source: 'mock'
        };
        saveMistakeRegister(reg);
        toggleMistakesFilter(true);
        toggleMistakeRetryMode(true);
        renderQuestions();

        const banner = document.getElementById('mistakeRegisterBanner');
        if (banner) {
          banner.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      });
      await page.waitForSelector('#mistakeRegisterBanner', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 600));
    }
  });

  console.log('Capturing Feature 2.1 - My Mistake Register (Round 2: clean slate empty state)...');
  await captureScreenshots({
    featureName: '2_1_mistake_register_empty',
    route: '#pyq-bank',
    onPageAction: async (page) => {
      await page.evaluate(async () => {
        openPyqBankMode();
        saveMistakeRegister({});
        toggleMistakesFilter(true);
        renderQuestions();

        const container = document.getElementById('questionsContainer');
        if (container) {
          container.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      });
      await new Promise(r => setTimeout(r, 600));
    }
  });

  console.log('Inspection captures completed for Feature 2.1 (Round 2).');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
