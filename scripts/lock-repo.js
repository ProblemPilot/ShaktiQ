/**
 * Script to replace questions.json with the secure decoy payload
 * so public GitHub Pages never exposes the full question bank.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceFile = path.join(root, 'questions_bank_source.json');
const decoyFile = path.join(root, 'questions_decoy.json');
const targetFile = path.join(root, 'questions.json');

if (!fs.existsSync(sourceFile)) {
  console.error('Error: questions_bank_source.json does not exist. Aborting to prevent data loss.');
  process.exit(1);
}

const decoyContent = fs.readFileSync(decoyFile, 'utf8');
fs.writeFileSync(targetFile, decoyContent, 'utf8');
console.log('Successfully replaced questions.json with unauthorized decoy.');
console.log('Original question bank is safely preserved in questions_bank_source.json (ignored by git).');
