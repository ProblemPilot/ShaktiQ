const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('AUTH_BACKEND_ORIGIN')) {
  content = content.replace(
    'function getAspirantAuthToken()',
    "const AUTH_BACKEND_ORIGIN = 'https://shaktiq-auth-gate.shaktiq-portal.workers.dev';\n\n    function getAspirantAuthToken()"
  );

  content = content.replace(
    "fetch('/api/register-token'",
    "fetch(AUTH_BACKEND_ORIGIN + '/api/register-token'"
  );

  content = content.replace(
    "fetch('/questions.json?v='",
    "fetch(AUTH_BACKEND_ORIGIN + '/questions.json?v='"
  );

  fs.writeFileSync(p, content, 'utf8');
  console.log('Successfully switched to live Cloudflare Worker backend origin in index.html');
} else {
  console.log('AUTH_BACKEND_ORIGIN already configured in index.html');
}
