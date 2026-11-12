// scripts/fix-logo-zoom.js
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// 1. Add bulletproof CSS for brand logo and responsive navbar
const logoCss = `
/* ========================================================= */
/* BULLETPROOF BRAND LOGO & ZOOM-STABLE RESPONSIVE NAVBAR     */
/* Prevents logo shrinking or disappearing at ANY zoom level */
/* ========================================================= */
.brand-logo-link {
  display: flex !important;
  align-items: center !important;
  flex-shrink: 0 !important;
  min-width: 140px !important;
  height: 100% !important;
  z-index: 20;
}
.brand-logo-img {
  height: 48px !important;
  width: auto !important;
  max-height: 54px !important;
  object-fit: contain !important;
  flex-shrink: 0 !important;
  display: block !important;
  transition: transform 0.2s ease;
}
@media (min-width: 640px) {
  .brand-logo-link {
    min-width: 165px !important;
  }
  .brand-logo-img {
    height: 56px !important;
    max-height: 60px !important;
  }
}
@media (min-width: 1024px) {
  .brand-logo-link {
    min-width: 185px !important;
  }
  .brand-logo-img {
    height: 62px !important;
    max-height: 66px !important;
  }
}

/* Secondary navigation links hide gracefully on intermediate screens (768px - 1279px) */
/* so that the header never overflows and never squashes the brand logo */
@media (max-width: 1279px) {
  .nav-extra-link {
    display: none !important;
  }
  #nav-mock-cta-pill {
    display: none !important;
  }
}
`;

if (!content.includes('BULLETPROOF BRAND LOGO')) {
  // Insert right after <style>
  content = content.replace('<style>', '<style>\n' + logoCss);
  console.log('Added bulletproof logo CSS.');
}

// 2. Fix the Main Portal Navbar Brand Logo Link
const oldLogoLink = `<a href="#top" class="flex items-center group  py-1">
        <img src="/logo.png" alt="ShaktiQ Logo" class="h-10 sm:h-12 w-auto object-contain group-hover:scale-[1.02] transition-transform duration-200 shrink-0">
      </a>`;

const newLogoLink = `<a href="#top" class="brand-logo-link group py-1 shrink-0" style="flex-shrink: 0 !important;" aria-label="ShaktiQ Home">
        <img src="/logo.png" alt="ShaktiQ Logo" class="brand-logo-img object-contain group-hover:scale-[1.02] transition-transform duration-200 shrink-0" style="flex-shrink: 0 !important;">
      </a>`;

if (content.includes(oldLogoLink)) {
  content = content.replace(oldLogoLink, newLogoLink);
  console.log('Updated main navbar brand logo link.');
} else {
  // Try pattern match
  content = content.replace(
    /<a href="#top" class="flex items-center group\s+py-1">[\s\S]*?<img src="\/logo\.png" alt="ShaktiQ Logo" class="h-10 sm:h-12[^>]*>[\s\S]*?<\/a>/,
    newLogoLink
  );
  console.log('Updated main navbar brand logo link via regex.');
}

// 3. Mark secondary links in Center Nav with .nav-extra-link so they collapse cleanly on 768px-1279px
content = content.replace(
  '<a href="#revision-sheets" class="px-3 py-1.5 text-sm font-semibold text-[#223127] hover:text-[#10402D] rounded-lg transition-colors">Revision Sheets</a>',
  '<a href="#revision-sheets" class="nav-extra-link px-3 py-1.5 text-sm font-semibold text-[#223127] hover:text-[#10402D] rounded-lg transition-colors">Revision Sheets</a>'
);
content = content.replace(
  '<a href="#mnemonics" class="px-3 py-1.5 text-sm font-semibold text-[#223127] hover:text-[#10402D] rounded-lg transition-colors">Mnemonics</a>',
  '<a href="#mnemonics" class="nav-extra-link px-3 py-1.5 text-sm font-semibold text-[#223127] hover:text-[#10402D] rounded-lg transition-colors">Mnemonics</a>'
);
content = content.replace(
  '<a href="#daily-abhyas" class="px-3 py-1.5 text-sm font-semibold text-[#223127] hover:text-[#10402D] rounded-lg transition-colors">Daily Abhyas</a>',
  '<a href="#daily-abhyas" class="nav-extra-link px-3 py-1.5 text-sm font-semibold text-[#223127] hover:text-[#10402D] rounded-lg transition-colors">Daily Abhyas</a>'
);
content = content.replace(
  '<a href="#about" class="px-3 py-1.5 text-sm font-semibold text-[#223127] hover:text-[#10402D] rounded-lg transition-colors">About</a>',
  '<a href="#about" class="nav-extra-link px-3 py-1.5 text-sm font-semibold text-[#223127] hover:text-[#10402D] rounded-lg transition-colors">About</a>'
);

// 4. Update Right Action CTAs container to hidden md:flex (was hidden sm:flex) to prevent collision with mobile controls
content = content.replace(
  '<div class="hidden sm:flex items-center gap-2.5 shrink-0">',
  '<div class="hidden md:flex items-center gap-2.5 shrink-0" style="flex-shrink: 0 !important;">'
);

// Add id="nav-mock-cta-pill" to "22 Full-Length Mock Tests" button so it hides gracefully under 1280px
content = content.replace(
  '<button type="button" onclick="openTestSeriesMode()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#10402D] bg-[#EBF3E6] hover:bg-[#DCE9D5] border border-[#C6DEC0] transition-all shrink-0 cursor-pointer">',
  '<button id="nav-mock-cta-pill" type="button" onclick="openTestSeriesMode()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#10402D] bg-[#EBF3E6] hover:bg-[#DCE9D5] border border-[#C6DEC0] transition-all shrink-0 cursor-pointer">'
);

// 5. Fix Question Bank Sticky Header Logo (Fix white-on-white vanishing bug)
const oldQbHeaderLogo = `<div class="flex items-center gap-3">
              <img src="/logo-white.png" alt="ShaktiQ Logo" class="h-9 sm:h-10 w-auto object-contain shrink-0" style="filter: brightness(0) invert(1) !important; -webkit-filter: brightness(0) invert(1) !important;">
              <div class="hidden sm:block pl-3 border-l border-white/25">
                <span class="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FCE27B] text-[#111C15]">2,800+ PYQs &amp; 22 Mock Tests</span>
                <p class="text-[11px] text-white/90 mt-0.5" style="color: #EBF3E6 !important;">Attempt-First Active Recall: Select an option to test yourself</p>
              </div>
            </div>`;

const newQbHeaderLogo = `<div class="flex items-center gap-3 shrink-0" style="flex-shrink: 0 !important;">
              <img src="/logo.png" alt="ShaktiQ Logo" class="h-10 sm:h-12 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">
              <div class="hidden sm:block pl-3 border-l border-[#DCE6DF]">
                <span class="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBF3E6] text-[#10402D] border border-[#C6DEC0]">2,800+ PYQs &amp; 22 Mock Tests</span>
                <p class="text-[11px] text-[#526056] mt-0.5">Attempt-First Active Recall: Select an option to test yourself</p>
              </div>
            </div>`;

if (content.includes(oldQbHeaderLogo)) {
  content = content.replace(oldQbHeaderLogo, newQbHeaderLogo);
  console.log('Fixed Question Bank sticky header logo (eliminated white-on-white bug).');
} else {
  // Regex replacement for flexibility
  content = content.replace(
    /<img src="\/logo-white\.png"[^>]*style="filter:\s*brightness\(0\)\s*invert\(1\)[^>]*>/,
    `<img src="/logo.png" alt="ShaktiQ Logo" class="h-10 sm:h-12 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">`
  );
  console.log('Fixed Question Bank logo via regex.');
}

// 6. Fix Footer Brand Logo (Increase size from h-10/11 to h-12/14)
content = content.replace(
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-10 sm:h-11 w-auto object-contain group-hover:scale-[1.02] transition-transform duration-200 shrink-0">`,
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-12 sm:h-14 w-auto object-contain group-hover:scale-[1.02] transition-transform duration-200 shrink-0" style="flex-shrink: 0 !important;">`
);

// 7. Fix Footer Copyright Strip Logo (Increase size from h-6 to h-8)
content = content.replace(
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-6 w-auto object-contain">`,
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-8 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">`
);

// 8. Fix Question Bank Footer Logo (Increase size from h-6 to h-8)
content = content.replace(
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-6 w-auto object-contain">`,
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-8 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">`
);

// 9. Fix Mobile Menu Drawer Logo (Increase size from h-9 to h-11)
content = content.replace(
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-9 w-auto object-contain shrink-0">`,
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-11 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">`
);

// 10. Fix Sign In Modal Header Logo (Increase size from h-9 to h-12)
content = content.replace(
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-9 w-auto object-contain">`,
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-12 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">`
);

// 11. Fix Legal Modal Header Logo (Increase size from h-8 to h-10)
content = content.replace(
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-8 w-auto object-contain">`,
  `<img src="/logo.png" alt="ShaktiQ Logo" class="h-10 w-auto object-contain shrink-0" style="flex-shrink: 0 !important;">`
);

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Successfully applied all logo size and zoom stability fixes to index.html.');
