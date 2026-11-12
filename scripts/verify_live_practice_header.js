// scripts/verify_live_practice_header.js
const https = require('https');

https.get('https://shaktiq.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log('--- LIVE PRACTICE MODE HEADER VERIFICATION ---');
    console.log('1. Contains logo-white.webp:', html.includes('logo-white.webp'));
    console.log('2. Contains logo-white class:', html.includes('logo-white'));
    console.log('3. Contains white active recall text:', html.includes('text-white mt-0.5 font-medium">Attempt-First Active Recall'));
    console.log('4. Contains white + Add Question button:', html.includes('id="quickAddQuestionBtn" class="bg-white'));
    console.log('5. Contains defensive CSS rule:', html.includes('Practice Mode Dark Header - White Text & Logo Guarantee'));
  });
});
