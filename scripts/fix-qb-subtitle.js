const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'border-white/25',
  'border-[#DCE6DF]'
);
content = content.replace(
  'bg-[#FCE27B] text-[#111C15]',
  'bg-[#EBF3E6] text-[#10402D] border border-[#C6DEC0]'
);
content = content.replace(
  'text-[11px] text-white/90 mt-0.5" style="color: #EBF3E6 !important;',
  'text-[11px] text-[#3B493F] mt-0.5 font-medium'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed Question bank header styling.');
