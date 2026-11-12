const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'build_predictor_html.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = '    <header>\n      <div class="badge-pill">';
const replacement = '    <header>\n      <div style="margin-bottom: 16px;"><a href="/" aria-label="ShaktiQ Home"><img src="/logo-white.png" alt="ShaktiQ Logo" style="height: 52px; width: auto; object-fit: contain;"></a></div>\n      <div class="badge-pill">';

if (content.includes('    <header>')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated build_predictor_html.js');
  // Rebuild predictor.html
  require('./build_predictor_html.js');
}
