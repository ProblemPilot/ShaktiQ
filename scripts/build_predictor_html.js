// scripts/build_predictor_html.js
// Builds a self-contained, standalone interactive web viewer (predictor.html)
// that opens directly in any browser (file:// or localhost) without CORS issues.

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'tiered_sets', 'predicted_2027_tier_100.json');
const questions = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BPSC 2027 AI Exam Predictor — High-Yield Target Paper</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #151d2f;
      --border: #24324f;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.15);
      --success: #10b981;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --badge-bg: #1e293b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 24px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }
    .badge-pill {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: var(--accent-glow);
      color: var(--accent);
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 12px;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 15px;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 24px;
      justify-content: space-between;
      align-items: center;
      background: var(--card-bg);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    .filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    button.filter-btn {
      background: var(--badge-bg);
      color: var(--text-muted);
      border: 1px solid var(--border);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    button.filter-btn:hover, button.filter-btn.active {
      background: var(--accent);
      color: #000;
      border-color: var(--accent);
      font-weight: 600;
    }
    .controls {
      display: flex;
      gap: 10px;
    }
    .btn-toggle {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-toggle:hover { opacity: 0.9; }
    .question-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 20px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .question-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .q-number {
      font-weight: 800;
      font-size: 16px;
      color: var(--accent);
    }
    .badges {
      display: flex;
      gap: 6px;
    }
    .badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-sub { background: #334155; color: #cbd5e1; }
    .badge-fmt { background: #1e3a8a; color: #93c5fd; }
    .q-text {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 18px;
      white-space: pre-line;
      line-height: 1.65;
    }
    .options-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 18px;
    }
    .option-item {
      background: var(--badge-bg);
      border: 1px solid var(--border);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14.5px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .option-item:hover {
      background: #25334d;
      border-color: #475569;
    }
    .option-item.correct {
      background: rgba(16, 185, 129, 0.15);
      border-color: var(--success);
      color: #6ee7b7;
      font-weight: 600;
    }
    .explanation-box {
      background: #0f172a;
      border-left: 4px solid var(--accent);
      padding: 16px;
      border-radius: 0 8px 8px 0;
      font-size: 14px;
      margin-top: 14px;
      display: none;
    }
    .explanation-box.show { display: block; }
    .exp-title {
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 6px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .rationale-box {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #334155;
      font-size: 13px;
      color: #cbd5e1;
    }
    .rationale-tag {
      color: #f59e0b;
      font-weight: 700;
    }
    .count-indicator {
      font-size: 13px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div style="margin-bottom: 16px;"><a href="/" aria-label="ShaktiQ Home"><img src="/logo-white.png" alt="ShaktiQ Logo" style="height: 52px; width: auto; object-fit: contain;"></a></div>
      <div class="badge-pill">71st / 72nd BPSC CCE Target Predictor</div>
      <h1>Predicted 2027 Exam Paper</h1>
      <p class="subtitle">100% Unseen, original questions engineered from BPSC's 2023–2026 statistical examination DNA</p>
    </header>

    <div class="toolbar">
      <div class="filters" id="subjectFilters">
        <button class="filter-btn active" data-sub="ALL">All Subjects</button>
        <button class="filter-btn" data-sub="History">History</button>
        <button class="filter-btn" data-sub="Polity">Polity</button>
        <button class="filter-btn" data-sub="Biology">Biology</button>
        <button class="filter-btn" data-sub="Physics">Physics</button>
        <button class="filter-btn" data-sub="Chemistry">Chemistry</button>
        <button class="filter-btn" data-sub="Geography">Geography</button>
        <button class="filter-btn" data-sub="Economics">Economics</button>
        <button class="filter-btn" data-sub="Reasoning">Aptitude</button>
      </div>
      <div class="controls">
        <button class="btn-toggle" id="toggleAnswersBtn">Show All Explanations</button>
      </div>
    </div>

    <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
      <span class="count-indicator" id="showingCount">Showing 25 questions</span>
    </div>

    <div id="questionsContainer"></div>
  </div>

  <script>
    const questionsData = ${JSON.stringify(questions, null, 2)};
    let activeSubject = 'ALL';
    let showAllExplanations = false;

    const container = document.getElementById('questionsContainer');
    const showingCount = document.getElementById('showingCount');
    const toggleBtn = document.getElementById('toggleAnswersBtn');
    const filterButtons = document.querySelectorAll('.filter-btn');

    function renderQuestions() {
      container.innerHTML = '';
      const filtered = questionsData.filter(q => {
        if (activeSubject === 'ALL') return true;
        if (activeSubject === 'Reasoning') return q.subject === 'Reasoning' || q.subject === 'Mathematics';
        return q.subject === activeSubject;
      });

      showingCount.textContent = \`Showing \${filtered.length} predicted questions\`;

      filtered.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'question-card';

        const meta = document.createElement('div');
        meta.className = 'card-meta';
        meta.innerHTML = \`
          <span class="q-number">\${q.qno} &bull; \${q.subject}</span>
          <div class="badges">
            <span class="badge badge-sub">\${q.subtopic}</span>
            <span class="badge badge-fmt">\${q._formatType || 'MCQ'}</span>
          </div>
        \`;

        const qText = document.createElement('div');
        qText.className = 'q-text';
        qText.textContent = q.q;

        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid';

        q.options.forEach(opt => {
          const optDiv = document.createElement('div');
          optDiv.className = 'option-item';
          optDiv.textContent = opt;

          const optLetter = opt.trim().charAt(1);
          if (showAllExplanations && optLetter === q.ans) {
            optDiv.classList.add('correct');
          }

          optDiv.addEventListener('click', () => {
            optDiv.classList.toggle('correct');
            expBox.classList.toggle('show');
          });

          optionsGrid.appendChild(optDiv);
        });

        const expBox = document.createElement('div');
        expBox.className = 'explanation-box' + (showAllExplanations ? ' show' : '');
        expBox.innerHTML = \`
          <div class="exp-title">Official Answer: \${q.ansText}</div>
          <p>\${q.exp}</p>
          <div class="rationale-box">
            <span class="rationale-tag">Prediction Rationale:</span> \${q.predictionRationale || 'Calibrated from 2023-2026 PYQ recurrence.'}
          </div>
        \`;

        card.appendChild(meta);
        card.appendChild(qText);
        card.appendChild(optionsGrid);
        card.appendChild(expBox);
        container.appendChild(card);
      });
    }

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSubject = btn.dataset.sub;
        renderQuestions();
      });
    });

    toggleBtn.addEventListener('click', () => {
      showAllExplanations = !showAllExplanations;
      toggleBtn.textContent = showAllExplanations ? 'Hide Explanations' : 'Show All Explanations';
      renderQuestions();
    });

    renderQuestions();
  </script>
</body>
</html>`;

const outputPath = path.join(__dirname, '..', 'predictor.html');
fs.writeFileSync(outputPath, htmlContent, 'utf8');
console.log(`Successfully generated predictor viewer at: ${outputPath}`);
