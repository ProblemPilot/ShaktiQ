// scripts/update_html_images.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');

let html = fs.readFileSync(INDEX_HTML, 'utf8');

// 1. Add image preloads to <head>
const preloads = `
  <!-- Critical Image Preloads for Instant Mobile LCP -->
  <link rel="preload" as="image" href="/logo.webp" type="image/webp" fetchpriority="high">
  <link rel="preload" as="image" href="/hero-museum.webp" type="image/webp" fetchpriority="high">
`;

if (!html.includes('Critical Image Preloads')) {
  html = html.replace('<!-- Google Fonts -->', preloads + '\n  <!-- Google Fonts -->');
}

// 2. Main Navbar Logo
html = html.replace(
  '<img src="/logo.png" alt="ShaktiQ Logo" class="brand-logo-img object-contain group-hover:scale-[1.02] transition-transform duration-200 shrink-0" style="flex-shrink: 0 !important;">',
  '<picture class="shrink-0"><source srcset="/logo.webp" type="image/webp"><img src="/logo.png" alt="ShaktiQ Logo" width="186" height="62" fetchpriority="high" decoding="async" class="brand-logo-img object-contain group-hover:scale-[1.02] transition-transform duration-200 shrink-0" style="flex-shrink: 0 !important;"></picture>'
);

// 3. Hero Museum Image
html = html.replace(
  '<img id="hero-main-museum-img" src="/hero-museum.png" fetchpriority="high" decoding="async" alt="या देवी सर्वभूतेषु विद्यारूपेण संस्थिता नमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः • Bihar Museum &amp; Rising Sun" class="w-full h-auto object-contain rounded-2xl">',
  '<picture><source srcset="/hero-museum.webp" type="image/webp"><img id="hero-main-museum-img" src="/hero-museum.png" width="900" height="530" fetchpriority="high" decoding="async" alt="या देवी सर्वभूतेषु विद्यारूपेण संस्थिता नमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः • Bihar Museum &amp; Rising Sun" class="w-full h-auto object-contain rounded-2xl"></picture>'
);

// 4. Bodhi tree image
html = html.replace(
  '<img src="/bodhi-tree.png" alt="BPSC Bodhi Tree" class="w-12 h-12 object-contain shrink-0">',
  '<picture><source srcset="/bodhi-tree.webp" type="image/webp"><img src="/bodhi-tree.png" width="48" height="48" loading="lazy" decoding="async" alt="BPSC Bodhi Tree" class="w-12 h-12 object-contain shrink-0"></picture>'
);

// 5. Sign In Modal Logo
html = html.replace(
  '<img src="/logo.png" alt="ShaktiQ Logo" class="h-12 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">',
  '<picture><source srcset="/logo.webp" type="image/webp"><img src="/logo.png" width="192" height="48" loading="lazy" decoding="async" alt="ShaktiQ Logo" class="h-12 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;"></picture>'
);

// 6. Legal Modal Logo
html = html.replace(
  '<img src="/logo.png" alt="ShaktiQ Logo" class="h-10 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">',
  '<picture><source srcset="/logo.webp" type="image/webp"><img src="/logo.png" width="160" height="40" loading="lazy" decoding="async" alt="ShaktiQ Logo" class="h-10 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;"></picture>'
);

// 7. Mobile Drawer Logo
html = html.replace(
  '<img src="/logo.png" alt="ShaktiQ Logo" class="h-11 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">',
  '<picture><source srcset="/logo.webp" type="image/webp"><img src="/logo.png" width="176" height="44" loading="lazy" decoding="async" alt="ShaktiQ Logo" class="h-11 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;"></picture>'
);

// 8. Footer Brand Logo
html = html.replace(
  '<img src="/logo.png" alt="ShaktiQ Logo" class="h-12 sm:h-14 w-auto object-contain group-hover:scale-[1.02] transition-transform duration-200 shrink-0" style="flex-shrink: 0 !important;">',
  '<picture><source srcset="/logo.webp" type="image/webp"><img src="/logo.png" width="168" height="56" loading="lazy" decoding="async" alt="ShaktiQ Logo" class="h-12 sm:h-14 w-auto object-contain group-hover:scale-[1.02] transition-transform duration-200 shrink-0" style="flex-shrink: 0 !important;"></picture>'
);

// 9. Footer Copyright Logo
html = html.replace(
  '<img src="/logo.png" alt="ShaktiQ Logo" class="h-8 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">',
  '<picture><source srcset="/logo.webp" type="image/webp"><img src="/logo.png" width="96" height="32" loading="lazy" decoding="async" alt="ShaktiQ Logo" class="h-8 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;"></picture>'
);

// 10. Footer YT Logo
html = html.replace(
  '<img src="/yt-logo.png" alt="Prep with Ankit" class="h-8 sm:h-9 w-auto object-contain rounded-md group-hover:scale-105 transition-transform duration-200 shrink-0">',
  '<picture><source srcset="/yt-logo.webp" type="image/webp"><img src="/yt-logo.png" width="36" height="36" loading="lazy" decoding="async" alt="Prep with Ankit" class="h-8 sm:h-9 w-auto object-contain rounded-md group-hover:scale-105 transition-transform duration-200 shrink-0"></picture>'
);

// 11. Question Bank Sticky Header Logo
html = html.replace(
  '<img src="/logo.png" alt="ShaktiQ Logo" class="h-10 sm:h-12 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">',
  '<picture><source srcset="/logo.webp" type="image/webp"><img src="/logo.png" width="144" height="48" loading="lazy" decoding="async" alt="ShaktiQ Logo" class="h-10 sm:h-12 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;"></picture>'
);

// 12. Question Bank Footer Logo
html = html.replace(
  '<img src="/logo.png" alt="ShaktiQ Logo" class="h-8 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">',
  '<picture><source srcset="/logo.webp" type="image/webp"><img src="/logo.png" width="96" height="32" loading="lazy" decoding="async" alt="ShaktiQ Logo" class="h-8 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;"></picture>'
);

// 13. Question Bank Footer YT Logo
html = html.replace(
  '<img src="/yt-logo.png" alt="Prep with Ankit" class="h-6 sm:h-7 w-auto object-contain rounded-md group-hover:scale-105 transition-transform duration-200 shrink-0">',
  '<picture><source srcset="/yt-logo.webp" type="image/webp"><img src="/yt-logo.png" width="28" height="28" loading="lazy" decoding="async" alt="Prep with Ankit" class="h-6 sm:h-7 w-auto object-contain rounded-md group-hover:scale-105 transition-transform duration-200 shrink-0"></picture>'
);

fs.writeFileSync(INDEX_HTML, html, 'utf8');
console.log('Successfully updated index.html with optimized WebP pictures and explicit dimensions.');
