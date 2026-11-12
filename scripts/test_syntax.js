const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
console.log(`Found ${scripts.length} script tags`);

scripts.forEach((s, idx) => {
  if (s[0].includes('application/ld+json') || !s[1].trim()) return;
  try {
    new Function(s[1]);
    console.log(`✅ Script #${idx + 1} (${s[1].length} chars) compiled successfully`);
  } catch (err) {
    console.error(`❌ Script #${idx + 1} SYNTAX ERROR:`, err.message);
    process.exit(1);
  }
});
console.log('🎉 All inline JavaScript scripts compile with ZERO syntax errors!');
