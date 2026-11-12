// scripts/optimize_perf.js
const fs = require('fs');
const path = require('path');

const INDEX_HTML = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(INDEX_HTML, 'utf8');

// Remove unused external third-party SDKs that choke mobile main-thread (TBT)
html = html.replace(/[ \t]*<!-- Official Google Identity Services & Facebook Login SDK -->\r?\n?/g, '');
html = html.replace(/[ \t]*<script src="https:\/\/accounts\.google\.com\/gsi\/client" async defer><\/script>\r?\n?/g, '');
html = html.replace(/[ \t]*<script async defer crossorigin="anonymous" src="https:\/\/connect\.facebook\.net\/en_US\/sdk\.js"><\/script>\r?\n?/g, '');

// Add dns-prefetch for fonts.googleapis.com
if (!html.includes('<link rel="dns-prefetch" href="https://fonts.googleapis.com">')) {
  html = html.replace(
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="dns-prefetch" href="https://fonts.googleapis.com">\n  <link rel="dns-prefetch" href="https://fonts.gstatic.com">\n  <link rel="preconnect" href="https://fonts.googleapis.com">'
  );
}

fs.writeFileSync(INDEX_HTML, html, 'utf8');
console.log('Successfully optimized head scripts and font prefetching.');
