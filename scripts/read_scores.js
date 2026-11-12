// scripts/read_scores.js
const fs = require('fs');
const file = process.argv[2] || 'scripts/audit-u2.json';

if (!fs.existsSync(file)) {
  console.log(`File not found: ${file}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const categories = data.categories;
const audits = data.audits;

console.log('==================================================');
console.log(`LIGHTHOUSE RESULTS: ${file}`);
console.log('==================================================');
console.log(`Performance:    ${Math.round(categories.performance.score * 100)}`);
console.log(`Accessibility:  ${Math.round(categories.accessibility.score * 100)}`);
console.log(`Best Practices: ${Math.round(categories['best-practices'].score * 100)}`);
console.log(`SEO:            ${Math.round(categories.seo.score * 100)}`);
console.log('--------------------------------------------------');
console.log(`FCP:  ${audits['first-contentful-paint'].displayValue}`);
console.log(`LCP:  ${audits['largest-contentful-paint'].displayValue}`);
console.log(`TBT:  ${audits['total-blocking-time'].displayValue}`);
console.log(`CLS:  ${audits['cumulative-layout-shift'].displayValue}`);
console.log(`SI:   ${audits['speed-index'].displayValue}`);
console.log('==================================================');

// Print any failing accessibility audits
const a11yFails = Object.values(audits).filter(a => a.id && categories.accessibility.auditRefs.some(r => r.id === a.id) && a.score !== null && a.score < 1);
if (a11yFails.length > 0) {
  console.log('\nFailing Accessibility Audits:');
  a11yFails.forEach(f => console.log(` - [${f.id}] ${f.title}: ${f.displayValue || ''}`));
} else {
  console.log('\nAll Accessibility Audits PASSED (100%)!');
}

// Print top performance opportunities
const perfOpps = Object.values(audits).filter(a => a.details && a.details.type === 'opportunity' && a.details.overallSavingsMs > 100);
if (perfOpps.length > 0) {
  console.log('\nTop Performance Opportunities:');
  perfOpps.forEach(o => console.log(` - ${o.title}: saves ~${Math.round(o.details.overallSavingsMs)}ms`));
}
