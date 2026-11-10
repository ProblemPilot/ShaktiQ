/**
 * Helper to upload questions_bank_source.json to Cloudflare KV:
 * Key: "QUESTIONS_DATA"
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceFile = path.join(root, 'questions_bank_source.json');

if (!fs.existsSync(sourceFile)) {
  console.error('Error: questions_bank_source.json not found!');
  process.exit(1);
}

const stats = fs.statSync(sourceFile);
console.log(`Source questions file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

console.log('Uploading QUESTIONS_DATA to Cloudflare KV via Wrangler...');
try {
  const output = execSync('npx wrangler kv key put --binding=SHAKTIQ_KV "QUESTIONS_DATA" --path=questions_bank_source.json', {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  console.log('Upload complete!');
} catch (err) {
  console.error('Upload failed. Ensure you are logged into Wrangler (`npx wrangler login`) or configure your KV namespace ID.');
}
