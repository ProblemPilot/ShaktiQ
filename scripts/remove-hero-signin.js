// scripts/remove-hero-signin.js
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// 1. Remove the Hero sign-in pill
const heroPillRegex = /\s*<div class="inline-flex items-center gap-2 px-3 py-1\.5 rounded-xl bg-\[#EBF3E6\] border border-\[#C6DEC0\] text-xs text-\[#10402D\] font-semibold mb-7">\s*<i data-lucide="shield-check" class="w-4 h-4 text-\[#10402D\]"><\/i>\s*<span>Sign in free with your name, email &amp; mobile to unlock all tests &amp; questions\.<\/span>\s*<\/div>/;

if (heroPillRegex.test(content)) {
  content = content.replace(heroPillRegex, '');
  console.log('Successfully removed hero sign-in pill.');
} else {
  console.log('Hero pill pattern not found by regex, trying string match...');
  const searchStr = `<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EBF3E6] border border-[#C6DEC0] text-xs text-[#10402D] font-semibold mb-7">
              <i data-lucide="shield-check" class="w-4 h-4 text-[#10402D]"></i>
              <span>Sign in free with your name, email &amp; mobile to unlock all tests &amp; questions.</span>
            </div>`;
  if (content.includes(searchStr)) {
    content = content.replace(searchStr, '');
    console.log('Successfully removed hero sign-in pill via exact string match.');
  } else {
    console.log('Warning: could not find exact match for hero pill.');
  }
}

// 2. Adjust margin of hero description paragraph from mb-3 to mb-8
content = content.replace(
  'max-w-xl mb-3 font-normal',
  'max-w-xl mb-8 font-normal'
);

// 3. Clean up other aggressive "sign in with name, email and mobile" mentions on the page
content = content.replace(
  '<h3 class="font-display font-extrabold text-lg text-[#111C15]">Free Sign-In Practice Workspace</h3>',
  '<h3 class="font-display font-extrabold text-lg text-[#111C15]">Free Practice Workspace</h3>'
);

content = content.replace(
  'ShaktiQ brings 22 full-length timed mock tests on BPSC pattern, 2,800+ previous year questions based on published answer keys, detailed solutions &amp; explanations, and rapid revision tools into one clean workspace. Sign in free with your name, email and mobile number to unlock access.',
  'ShaktiQ brings 22 full-length timed mock tests on BPSC pattern, 2,800+ previous year questions based on published answer keys, detailed solutions &amp; explanations, and rapid revision tools into one clean workspace. All 22 mock tests and subject modules are available to practice free.'
);

content = content.replace(
  '<p class="text-xs sm:text-sm text-[#223127]">Sign in free with your name, email and mobile number to unlock the question bank and mock tests.</p>',
  '<p class="text-xs sm:text-sm text-[#223127]">Select any subject or mock test to start practicing instantly with solutions and performance tracking.</p>'
);

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Completed index.html updates.');
