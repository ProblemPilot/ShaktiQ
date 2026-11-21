/**
 * Shakti AI — Minimalist Study Assistant Drawer
 * Shared across index.html and predictor.html
 * Strictly adheres to ShaktiQ Forest Green (#10402D) & Soft Sage (#F8FAF7 / #EBF3E6) palette.
 */
(function () {
  'use strict';

  const AI_ENDPOINT = (typeof window !== 'undefined' && window.SHAKTIQ_AI_ENDPOINT)
    ? window.SHAKTIQ_AI_ENDPOINT
    : '/api/ask-ai';

  const STORAGE_LANG_KEY = 'shaktiq_ai_lang_v1';
  const STORAGE_API_KEY = 'shaktiq_gemini_api_key';

  const STARTER_CHIPS = [
    'Give me a memory trick for this',
    'Explain why the other options are wrong',
    'Summarize key Bihar exam facts on this topic'
  ];

  const state = {
    isOpen: false,
    isLoading: false,
    language: 'en',
    context: null,
    messages: [],
    lastSubmitAt: 0,
    apiKey: '',
    showKeyPanel: false
  };

  try {
    const savedLang = localStorage.getItem(STORAGE_LANG_KEY);
    if (savedLang && ['en', 'hinglish', 'hi'].includes(savedLang)) {
      state.language = savedLang;
    }
  } catch (_) {}

  try {
    const savedKey = localStorage.getItem(STORAGE_API_KEY);
    if (savedKey && typeof savedKey === 'string') {
      state.apiKey = savedKey.trim();
    }
  } catch (_) {}

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatAiMarkdown(raw) {
    const safe = escapeHtml(raw || '');
    const lines = safe.split(/\r?\n/);
    let html = '';
    let inList = false;

    const formatInline = (text) =>
      text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        return;
      }

      if (/^[-*•]\s+/.test(line)) {
        if (!inList) {
          html += '<ul class="shakti-ai-list">';
          inList = true;
        }
        html += '<li>' + formatInline(line.replace(/^[-*•]\s+/, '')) + '</li>';
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += '<p>' + formatInline(line) + '</p>';
      }
    });

    if (inList) html += '</ul>';
    return html || '<p>' + formatInline(safe) + '</p>';
  }

  function isGreeting(text) {
    const norm = String(text || '').trim().toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, '');
    const singleWords = [
      'hi', 'hello', 'hey', 'namaste', 'namaskar', 'pranam', 'pranaam', 'kya kar sakte ho',
      'who are you', 'help', 'start', 'intro', 'kya hai', 'namaskaar', 'good morning', 'good evening',
      'नमस्ते', 'प्रणाम', 'नमस्कार', 'हेलो', 'हाय', 'मदद', 'तुम कौन हो', 'आप कौन हैं'
    ];
    if (singleWords.includes(norm)) return true;
    return /^(hi+|hello+|hey+|namaste+|namaskar+|pranam+|नमस्ते|प्रणाम|नमस्कार)(\s|$)/i.test(norm) ||
      norm === 'who are you' || norm === 'what can you do' || norm === 'help';
  }

  const GREETING_REPLIES = {
    en: [
      '**Hello! I am Shakti AI**, your dedicated study companion for BPSC, BSSC, and Bihar competitive examinations.',
      '',
      '**How I can assist your preparation:**',
      '- **Instant PYQ Breakdown:** Click **Ask AI** under any question card in the Question Bank or Mock Test review to receive the verified official explanation, distractor elimination, and exam memory hook.',
      '- **Concept & Topic Doubts:** Ask me about any Bihar syllabus topic — 1857 Revolt in Bihar, Article 356, Bihar soil and river systems, budget allocations, or general science.',
      '- **Bilingual Learning:** Toggle effortlessly between **English**, **Hinglish**, and **हिन्दी** anytime using the tabs above.',
      '',
      'What topic or question would you like to explore right now?'
    ].join('\n'),

    hinglish: [
      '**Namaste! Main hoon Shakti AI**, aapka Bihar competitive examinations (BPSC, BSSC, TRE) ka dedicated study companion.',
      '',
      '**Main aapki preparation mein aise help kar sakta hoon:**',
      '- **PYQ Deep Breakdown:** Kisi bhi question card ke neeche **Ask AI** click karein — aapko official explanation, option elimination logic, aur exam memory trick turant mil jayegi.',
      '- **Concept & Doubts:** BPSC / BSSC ka koi bhi topic poochiye — jaise Veer Kunwar Singh 1858, Article 356, Bihar rivers & geography, ya science formulas.',
      '- **Medium Selection:** Upar diye gaye tabs se kabhi bhi **English**, **Hinglish**, ya **हिन्दी** switch kar sakte hain.',
      '',
      'Aap abhi kaun sa topic ya question practice karna chahte hain?'
    ].join('\n'),

    hi: [
      '**नमस्ते! मैं हूँ Shakti AI**, बिहार प्रतियोगी परीक्षाओं (BPSC, BSSC, TRE) के लिए आपका समर्पित अध्ययन साथी।',
      '',
      '**मैं आपकी तैयारी में इस प्रकार सहायता कर सकता हूँ:**',
      '- **PYQ का संपूर्ण विश्लेषण:** प्रश्न बैंक या मॉक टेस्ट के किसी भी प्रश्न कार्ड पर **Ask AI** क्लिक करें — आपको आधिकारिक व्याख्या, गलत विकल्पों का खंडन (Elimination Logic) और Memory Hook तुरंत मिलेगा।',
      '- **अवधारणा एवं संदेह समाधान:** BPSC/BSSC का कोई भी विषय पूछें — जैसे 1857 की क्रांति में बिहार की भूमिका, अनुच्छेद 356, बिहार का भूगोल या विज्ञान के नियम।',
      '- **माध्यम का चयन:** ऊपर दिए गए विकल्पों से आप कभी भी **English**, **Hinglish**, या **हिन्दी** चुन सकते हैं।',
      '',
      'आज आप किस प्रश्न या विषय का अभ्यास करना चाहते हैं?'
    ].join('\n')
  };

  function extractOptionLetter(str) {
    const m = String(str || '').trim().match(/^\(?([A-Ea-e])[\)\.\s]/);
    return m ? m[1].toUpperCase() : '';
  }

  function extractAnswerLetter(str) {
    const m = String(str || '').trim().match(/([A-Ea-e])/);
    return m ? m[1].toUpperCase() : '';
  }

  function formatContextExplanation(ctx, language) {
    const isHi = language === 'hi';
    const isHing = language === 'hinglish';
    const parts = [];

    if (ctx.subject || ctx.exam) {
      parts.push(`**${[ctx.subject, ctx.exam].filter(Boolean).join(' · ')}**`);
      parts.push('');
    }

    if (ctx.correctAnswer) {
      const ansLabel = isHi ? '**आधिकारिक सही उत्तर:** ' : '**Official Answer:** ';
      const ansVal = ctx.correctAnswer.startsWith('Option') ? ctx.correctAnswer : 'Option ' + ctx.correctAnswer;
      parts.push(`${ansLabel}${ansVal}`);
      parts.push('');
    }

    const coreHeading = isHi ? '**मुख्य अवधारणा (Core Concept):**' : '**Core Concept:**';
    parts.push(coreHeading);
    if (ctx.explanation && ctx.explanation.trim()) {
      parts.push(ctx.explanation.trim());
    } else {
      parts.push(isHi
        ? 'यह प्रश्न BPSC/BSSC के आधिकारिक पाठ्यक्रम और मानक NCERT संदर्भ पर आधारित है।'
        : 'This question tests core factual concepts per the official Bihar examination syllabus and NCERT reference texts.');
    }
    parts.push('');

    if (Array.isArray(ctx.options) && ctx.options.length > 0) {
      const optHeading = isHi ? '**विकल्प विश्लेषण (Option Analysis):**' : '**Option Breakdown:**';
      parts.push(optHeading);
      const ansLetter = extractAnswerLetter(ctx.correctAnswer);
      ctx.options.forEach((opt) => {
        const optStr = String(opt).trim();
        const optLetter = extractOptionLetter(optStr);
        const isCorrect = Boolean(optLetter && ansLetter && optLetter === ansLetter);
        if (isCorrect) {
          parts.push(`- **${optStr}** — ${isHi ? 'यह आधिकारिक रूप से सही उत्तर है।' : 'Verified correct choice per official BPSC answer key.'}`);
        } else {
          parts.push(`- ${optStr} — ${isHi ? 'यह विकल्प सही नहीं है।' : 'Incorrect distractor.'}`);
        }
      });
      parts.push('');
    }

    const hookHeading = isHi ? '**परीक्षा स्मृति सूत्र (Exam Memory Hook):**' : '**Quick Exam Memory Hook:**';
    parts.push(hookHeading);
    const defaultHook = isHi
      ? `स्मरण रखें: ${ctx.subject || 'इस विषय'} में BPSC सीधे तथ्यात्मक प्रावधानों और उन्मूलन विधि (Elimination Method) का परीक्षण करता है। इस मुख्य बिंदु को परीक्षा कक्ष के लिए कंठस्थ रखें।`
      : isHing
        ? `Revision Tip: ${ctx.subject || 'Is subject'} mein BPSC direct factual key points test karta hai. Is point ko exam hall ke liye commit kar lijiye.`
        : `Revision Tip: For ${ctx.subject || 'this topic'}, BPSC tests precise factual provisions and direct elimination. Commit this official key point to memory for the exam hall.`;
    parts.push(defaultHook);

    return parts.join('\n');
  }

  function buildClientSystemInstruction(language) {
    const langRule = language === 'hi'
      ? 'Respond ONLY in clear, scholarly, natural Hindi (Devanagari script). Keep official English exam terms, Acts, Articles, and option letters (A, B, C, D, E) in brackets where helpful.'
      : language === 'hinglish'
        ? 'Respond in authentic, conversational Hinglish — write the explanation sentences primarily in natural Roman-script Hindi (e.g., "23 April 1858 ko Veer Kunwar Singh ne Captain Le Grand ko haraya tha, isliye Bihar mein Vijayotsav manaya jata hai") while keeping official exam terms, Acts, and option letters in English. Use strictly Latin/Roman alphabet only (never mix Devanagari letters inside Roman words).'
        : 'Respond in clear, calm, scholarly English suitable for serious Bihar competitive exam aspirants.';

    return [
      'You are Shakti AI, the calm, focused study companion on ShaktiQ (shaktiq.com) for Bihar competitive exams (BPSC CCE, BSSC CGL 4, AEDO, TRE, and Bihar Special GS).',
      langRule,
      'Keep every explanation accurate to NCERT, standard reference texts, and published BPSC/BSSC answer keys. Never invent facts; if a date or provision is uncertain, state that honestly.',
      'Keep tone humble, encouraging, scholarly, and free of filler, hype, or emojis.',
      'Structure your reply cleanly using these exact markdown headings when answering a question or concept:',
      '**Core Concept:** One crisp line summarizing the exact fact or principle.',
      '**Option Breakdown / Why Others Fail:** Concise bullet points explaining the correct choice and why distractors or common exam traps fail (or key dimensions if it is a general topic).',
      '**Quick Exam Memory Hook:** One memorable, high-yield recall line or mnemonic for the exam hall.',
      'Keep total length concise (around 120–220 words) so students can revise effortlessly on mobile.'
    ].join('\n');
  }

  function buildClientUserPrompt(message, context, history) {
    const parts = [];
    if (context && typeof context === 'object') {
      const ctxLines = [];
      if (context.exam) ctxLines.push(`Exam: ${String(context.exam).slice(0, 140)}`);
      if (context.subject) ctxLines.push(`Subject: ${String(context.subject).slice(0, 100)}`);
      if (context.question) ctxLines.push(`Question:\n${String(context.question).slice(0, 2000)}`);
      if (Array.isArray(context.options) && context.options.length > 0) {
        ctxLines.push(`Options:\n${context.options.slice(0, 6).map((o) => String(o).slice(0, 300)).join('\n')}`);
      }
      if (context.correctAnswer) ctxLines.push(`Official Answer: ${String(context.correctAnswer).slice(0, 240)}`);
      if (context.explanation) ctxLines.push(`Official Explanation: ${String(context.explanation).slice(0, 1500)}`);
      if (ctxLines.length > 0) {
        parts.push('--- ACTIVE QUESTION CONTEXT ---\n' + ctxLines.join('\n') + '\n--- END CONTEXT ---');
      }
    }

    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-6).map((turn) => {
        const role = turn && turn.role === 'assistant' ? 'Tutor' : 'Student';
        const text = turn && turn.text ? String(turn.text).slice(0, 700) : '';
        return text ? `${role}: ${text}` : '';
      }).filter(Boolean);
      if (recent.length > 0) {
        parts.push('Recent conversation:\n' + recent.join('\n'));
      }
    }

    parts.push(`Student question: ${String(message).trim().slice(0, 1200)}`);
    return parts.join('\n\n');
  }

  async function callDirectGemini(apiKey, message, language, context, history) {
    const systemInstruction = buildClientSystemInstruction(language);
    const userPrompt = buildClientUserPrompt(message, context, history);

    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let lastError = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 800
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (answer && answer.trim()) {
            return answer.trim();
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${res.status}`;
          lastError = new Error(errMsg);
          if (res.status === 400 && errMsg.includes('API_KEY_INVALID')) {
            throw new Error('Your Google Gemini API Key appears to be invalid. Please check your key from Google AI Studio.');
          }
          if (res.status === 403) {
            throw new Error('Your Google Gemini API Key does not have permission. Please check your key permissions.');
          }
        }
      } catch (err) {
        if (err.message && (err.message.includes('invalid') || err.message.includes('permission'))) {
          throw err;
        }
        lastError = err;
      }
    }

    throw lastError || new Error('Could not reach Google Gemini API.');
  }

  function injectStylesIfNeeded() {
    if (document.getElementById('shakti-ai-inline-styles')) return;
    const style = document.createElement('style');
    style.id = 'shakti-ai-inline-styles';
    style.textContent = `
      .shakti-ai-fab {
        position: fixed;
        right: 1.25rem;
        bottom: 1.25rem;
        z-index: 65;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.05rem;
        border-radius: 9999px;
        background: #10402D;
        color: #FFFFFF;
        border: 1px solid #C6DEC0;
        font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.01em;
        box-shadow: 0 8px 24px -6px rgba(16, 64, 45, 0.28);
        cursor: pointer;
        transition: transform 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
        min-height: 44px;
      }
      .shakti-ai-fab:hover {
        background: #17593F;
        transform: translateY(-2px);
        box-shadow: 0 12px 28px -6px rgba(16, 64, 45, 0.34);
      }
      .shakti-ai-fab:focus-visible {
        outline: 3px solid #10402D;
        outline-offset: 2px;
        box-shadow: 0 0 0 4px rgba(252, 226, 123, 0.8);
      }
      .shakti-ai-fab.shakti-ai-fab-hidden {
        opacity: 0;
        pointer-events: none;
        transform: translateY(10px);
      }
      @media (max-width: 1023px) {
        body.shakti-exam-active .shakti-ai-fab {
          opacity: 0;
          pointer-events: none;
        }
        .shakti-ai-fab {
          right: 1rem;
          bottom: max(1rem, env(safe-area-inset-bottom, 0px));
          padding: 0.65rem 0.95rem;
        }
      }

      .shakti-ai-backdrop {
        position: fixed;
        inset: 0;
        z-index: 90;
        background: rgba(17, 28, 21, 0.34);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      .shakti-ai-backdrop.open {
        opacity: 1;
        pointer-events: auto;
      }

      .shakti-ai-drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 440px;
        z-index: 95;
        background: #F8FAF7;
        color: #111C15;
        border-left: 1px solid #DCE6DF;
        box-shadow: -16px 0 40px -12px rgba(16, 64, 45, 0.18);
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
        font-family: "Plus Jakarta Sans", "Noto Sans Devanagari", system-ui, -apple-system, sans-serif;
      }
      .shakti-ai-drawer.open {
        transform: translateX(0);
      }

      @media (max-width: 639.98px) {
        .shakti-ai-drawer {
          top: auto;
          left: 0;
          right: 0;
          bottom: 0;
          max-width: 100%;
          height: 86vh;
          max-height: 86vh;
          border-left: none;
          border-top: 1px solid #DCE6DF;
          border-radius: 1.25rem 1.25rem 0 0;
          transform: translateY(100%);
          box-shadow: 0 -14px 36px -8px rgba(16, 64, 45, 0.2);
        }
        .shakti-ai-drawer.open {
          transform: translateY(0);
        }
      }

      .shakti-ai-header {
        background: #FFFFFF;
        border-bottom: 1px solid #DCE6DF;
        padding: 0.9rem 1rem 0.75rem;
        flex-shrink: 0;
      }
      .shakti-ai-header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .shakti-ai-brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        min-width: 0;
      }
      .shakti-ai-mark {
        width: 2rem;
        height: 2rem;
        border-radius: 0.65rem;
        background: #EBF3E6;
        border: 1px solid #C6DEC0;
        color: #10402D;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .shakti-ai-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #111C15;
        line-height: 1.2;
      }
      .shakti-ai-subtitle {
        font-size: 0.72rem;
        color: #526056;
        margin-top: 0.1rem;
      }
      .shakti-ai-header-actions {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        flex-shrink: 0;
      }
      .shakti-ai-icon-btn {
        min-width: 36px;
        min-height: 36px;
        padding: 0 0.55rem;
        border-radius: 0.6rem;
        border: 1px solid #DCE6DF;
        background: #FFFFFF;
        color: #223127;
        font-size: 0.72rem;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }
      .shakti-ai-icon-btn:hover {
        background: #EBF3E6;
        border-color: #C6DEC0;
        color: #10402D;
      }
      .shakti-ai-icon-btn.active-key {
        border-color: #10402D;
        background: #EBF3E6;
        color: #10402D;
      }

      /* Slide-down Key Panel */
      .shakti-ai-key-panel {
        background: #FFFFFF;
        border-bottom: 1px solid #DCE6DF;
        padding: 0.75rem 1rem;
        flex-shrink: 0;
        animation: shaktiAiSlideDown 0.2s ease-out;
      }
      @keyframes shaktiAiSlideDown {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .shakti-ai-key-panel-inner {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .shakti-ai-key-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.76rem;
        font-weight: 800;
        color: #111C15;
      }
      .shakti-ai-key-badge {
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.15rem 0.45rem;
        border-radius: 9999px;
        background: #EBF3E6;
        color: #10402D;
      }
      .shakti-ai-key-badge.active {
        background: #10402D;
        color: #FCE27B;
      }
      .shakti-ai-key-hint {
        font-size: 0.7rem;
        color: #526056;
        line-height: 1.4;
        margin: 0;
      }
      .shakti-ai-key-hint a {
        color: #10402D;
        font-weight: 700;
        text-decoration: underline;
      }
      .shakti-ai-key-input-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin-top: 0.2rem;
      }
      .shakti-ai-key-input {
        flex: 1 1 auto;
        min-height: 34px;
        padding: 0.35rem 0.6rem;
        border-radius: 0.5rem;
        border: 1px solid #DCE6DF;
        background: #F8FAF7;
        font-size: 0.75rem;
        font-family: inherit;
        color: #111C15;
      }
      .shakti-ai-key-input:focus {
        outline: none;
        border-color: #10402D;
        background: #FFFFFF;
      }
      .shakti-ai-key-action-btn {
        min-height: 34px;
        padding: 0 0.75rem;
        border-radius: 0.5rem;
        border: none;
        background: #10402D;
        color: #FFFFFF;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .shakti-ai-key-action-btn:hover {
        background: #17593F;
      }
      .shakti-ai-key-action-btn.secondary {
        background: #FFF5F5;
        border: 1px solid #FECACA;
        color: #991B1B;
      }
      .shakti-ai-key-action-btn.secondary:hover {
        background: #FEE2E2;
      }
      .shakti-ai-key-feedback {
        font-size: 0.68rem;
        font-weight: 600;
        margin-top: 0.2rem;
      }
      .shakti-ai-key-feedback.success {
        color: #10402D;
      }
      .shakti-ai-key-feedback.error {
        color: #991B1B;
      }

      /* Inline key prompt card inside chat when general doubt is asked without keys */
      .shakti-ai-key-card {
        background: #FFFFFF;
        border: 1px solid #C6DEC0;
        border-radius: 0.95rem;
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .shakti-ai-key-card-title {
        font-size: 0.82rem;
        font-weight: 800;
        color: #10402D;
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      .shakti-ai-key-card-desc {
        font-size: 0.76rem;
        color: #36443A;
        line-height: 1.5;
        margin: 0;
      }
      .shakti-ai-key-card-desc a {
        color: #10402D;
        font-weight: 700;
        text-decoration: underline;
      }
      .shakti-ai-key-card-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .shakti-ai-lang-bar {
        margin-top: 0.65rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .shakti-ai-lang-label {
        font-size: 0.7rem;
        font-weight: 700;
        color: #526056;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .shakti-ai-lang-tabs {
        display: inline-flex;
        padding: 0.2rem;
        border-radius: 0.65rem;
        background: #F8FAF7;
        border: 1px solid #DCE6DF;
        gap: 0.15rem;
      }
      .shakti-ai-lang-tab {
        border: none;
        background: transparent;
        color: #223127;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.32rem 0.6rem;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
      }
      .shakti-ai-lang-tab[aria-selected="true"] {
        background: #10402D;
        color: #FFFFFF;
      }

      .shakti-ai-context {
        margin: 0.75rem 1rem 0;
        padding: 0.7rem 0.8rem;
        border-radius: 0.85rem;
        background: #ECF6E7;
        border: 1px solid #C6DEC0;
        font-size: 0.75rem;
        color: #1E2D23;
        flex-shrink: 0;
      }
      .shakti-ai-context-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.3rem;
      }
      .shakti-ai-context-tag {
        font-size: 0.68rem;
        font-weight: 800;
        color: #10402D;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      .shakti-ai-context-clear {
        border: none;
        background: transparent;
        color: #526056;
        font-size: 0.7rem;
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
      }
      .shakti-ai-context-q {
        margin: 0;
        color: #111C15;
        font-weight: 600;
        line-height: 1.45;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .shakti-ai-body {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        scroll-behavior: smooth;
      }

      .shakti-ai-welcome {
        background: #FFFFFF;
        border: 1px solid #DCE6DF;
        border-radius: 1rem;
        padding: 1rem;
      }
      .shakti-ai-welcome-title {
        font-size: 0.9rem;
        font-weight: 800;
        color: #111C15;
        margin-bottom: 0.3rem;
      }
      .shakti-ai-welcome-desc {
        font-size: 0.8rem;
        color: #526056;
        line-height: 1.55;
        margin-bottom: 0.85rem;
      }
      .shakti-ai-chips {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }
      .shakti-ai-chip {
        text-align: left;
        background: #F8FAF7;
        border: 1px solid #DCE6DF;
        color: #1E2D23;
        padding: 0.6rem 0.8rem;
        border-radius: 0.75rem;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        min-height: 40px;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }
      .shakti-ai-chip:hover {
        background: #EBF3E6;
        border-color: #10402D;
        color: #10402D;
      }

      .shakti-ai-msg {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        max-width: 94%;
      }
      .shakti-ai-msg.user {
        align-self: flex-end;
      }
      .shakti-ai-msg.assistant {
        align-self: flex-start;
        max-width: 100%;
      }
      .shakti-ai-bubble {
        padding: 0.75rem 0.9rem;
        border-radius: 0.95rem;
        font-size: 0.84rem;
        line-height: 1.62;
        word-break: break-word;
      }
      .shakti-ai-msg.user .shakti-ai-bubble {
        background: #10402D;
        color: #FFFFFF;
        border-bottom-right-radius: 0.25rem;
      }
      .shakti-ai-msg.assistant .shakti-ai-bubble {
        background: #FFFFFF;
        color: #111C15;
        border: 1px solid #DCE6DF;
        border-bottom-left-radius: 0.25rem;
      }
      .shakti-ai-msg.assistant.error .shakti-ai-bubble {
        background: #FFF5F5;
        border-color: #FECACA;
        color: #991B1B;
      }
      .shakti-ai-bubble p {
        margin: 0 0 0.5rem 0;
      }
      .shakti-ai-bubble p:last-child {
        margin-bottom: 0;
      }
      .shakti-ai-bubble strong {
        color: #10402D;
        font-weight: 700;
      }
      .shakti-ai-msg.user .shakti-ai-bubble strong {
        color: #FCE27B;
      }
      .shakti-ai-list {
        margin: 0.25rem 0 0.55rem 1.1rem;
        padding: 0;
        list-style: disc;
      }
      .shakti-ai-list li {
        margin-bottom: 0.3rem;
      }
      .shakti-ai-msg-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0 0.15rem;
      }
      .shakti-ai-copy-btn {
        border: 1px solid #DCE6DF;
        background: #FFFFFF;
        color: #36443A;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.2rem 0.55rem;
        border-radius: 0.45rem;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
      }
      .shakti-ai-copy-btn:hover {
        background: #EBF3E6;
        color: #10402D;
      }

      .shakti-ai-typing {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.65rem 0.85rem;
        border-radius: 0.9rem;
        background: #FFFFFF;
        border: 1px solid #DCE6DF;
        color: #526056;
        font-size: 0.78rem;
        font-weight: 600;
        align-self: flex-start;
      }
      .shakti-ai-dots {
        display: inline-flex;
        gap: 3px;
      }
      .shakti-ai-dots span {
        width: 5px;
        height: 5px;
        border-radius: 9999px;
        background: #10402D;
        opacity: 0.35;
        animation: shaktiAiBounce 1.1s infinite ease-in-out;
      }
      .shakti-ai-dots span:nth-child(2) { animation-delay: 0.18s; }
      .shakti-ai-dots span:nth-child(3) { animation-delay: 0.36s; }
      @keyframes shaktiAiBounce {
        0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
        40% { opacity: 1; transform: translateY(-2px); }
      }

      .shakti-ai-footer {
        background: #FFFFFF;
        border-top: 1px solid #DCE6DF;
        padding: 0.75rem 0.9rem max(0.75rem, env(safe-area-inset-bottom, 0px));
        flex-shrink: 0;
      }
      .shakti-ai-form {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
      }
      .shakti-ai-input {
        flex: 1 1 auto;
        min-height: 44px;
        max-height: 120px;
        resize: none;
        padding: 0.65rem 0.85rem;
        border-radius: 0.8rem;
        border: 1px solid #DCE6DF;
        background: #F8FAF7;
        color: #111C15;
        font-family: inherit;
        font-size: 0.875rem;
        line-height: 1.45;
      }
      @media (max-width: 640px) {
        .shakti-ai-input {
          font-size: 16px !important;
        }
      }
      .shakti-ai-input:focus {
        outline: none;
        border-color: #10402D;
        background: #FFFFFF;
      }
      .shakti-ai-send-btn {
        min-width: 44px;
        height: 44px;
        padding: 0 0.95rem;
        border-radius: 0.8rem;
        border: none;
        background: #10402D;
        color: #FFFFFF;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        flex-shrink: 0;
        transition: background-color 0.15s ease, opacity 0.15s ease;
      }
      .shakti-ai-send-btn:hover:not(:disabled) {
        background: #17593F;
      }
      .shakti-ai-send-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .shakti-ai-note {
        margin-top: 0.45rem;
        font-size: 0.68rem;
        color: #526056;
        text-align: center;
      }

      /* Subtle contextual "Explain with AI" button shared across PYQ, Solution Review & Predictor */
      .shakti-explain-ai-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.72rem;
        border-radius: 0.65rem;
        background: #FFFFFF;
        color: #10402D;
        border: 1px solid #C6DEC0;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        min-height: 32px;
      }
      .shakti-explain-ai-btn:hover {
        background: #10402D;
        color: #FFFFFF;
        border-color: #10402D;
      }
      .shakti-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
    document.head.appendChild(style);
  }

  function createIconSvg(type) {
    if (type === 'spark') {
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z"/></svg>';
    }
    if (type === 'close') {
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    }
    if (type === 'send') {
      return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
    }
    if (type === 'key') {
      return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 2l-2 2m-1-1l-3 3m-1-1l-2 2m-2-2l-2 2a7 7 0 102 2l8-8z"/></svg>';
    }
    return '';
  }

  let els = {};

  function buildDrawerDom() {
    if (document.getElementById('shakti-ai-drawer')) return;
    injectStylesIfNeeded();

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'shakti-ai-fab';
    fab.className = 'shakti-ai-fab no-print';
    fab.setAttribute('aria-label', 'Open Shakti AI Study Assistant');
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = createIconSvg('spark') + '<span>Ask AI</span>';

    const backdrop = document.createElement('div');
    backdrop.id = 'shakti-ai-backdrop';
    backdrop.className = 'shakti-ai-backdrop no-print';
    backdrop.setAttribute('aria-hidden', 'true');

    const drawer = document.createElement('aside');
    drawer.id = 'shakti-ai-drawer';
    drawer.className = 'shakti-ai-drawer no-print';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'shakti-ai-drawer-title');
    drawer.setAttribute('aria-hidden', 'true');

    drawer.innerHTML = `
      <div class="shakti-ai-header">
        <div class="shakti-ai-header-top">
          <div class="shakti-ai-brand">
            <span class="shakti-ai-mark">${createIconSvg('spark')}</span>
            <div>
              <h2 id="shakti-ai-drawer-title" class="shakti-ai-title">Shakti AI</h2>
              <p class="shakti-ai-subtitle">Bihar Exam Study Companion</p>
            </div>
          </div>
          <div class="shakti-ai-header-actions">
            <button type="button" id="shakti-ai-key-btn" class="shakti-ai-icon-btn" title="Configure Google Gemini API Key" aria-label="Configure Google Gemini API Key">
              ${createIconSvg('key')}
              <span id="shakti-ai-key-btn-text">Key</span>
            </button>
            <button type="button" id="shakti-ai-clear-btn" class="shakti-ai-icon-btn" title="Clear conversation" aria-label="Clear conversation">Clear</button>
            <button type="button" id="shakti-ai-close-btn" class="shakti-ai-icon-btn" title="Close Shakti AI" aria-label="Close Shakti AI">${createIconSvg('close')}</button>
          </div>
        </div>

        <div id="shakti-ai-key-panel" class="shakti-ai-key-panel" hidden>
          <div class="shakti-ai-key-panel-inner">
            <div class="shakti-ai-key-title">
              <span>Google Gemini API Key</span>
              <span class="shakti-ai-key-badge" id="shakti-ai-key-status">Optional</span>
            </div>
            <p class="shakti-ai-key-hint">
              Get a free API key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>. Saved privately in your browser.
            </p>
            <div class="shakti-ai-key-input-row">
              <input type="password" id="shakti-ai-key-input" class="shakti-ai-key-input" placeholder="Paste Gemini key (AIzaSy...)" autocomplete="off" spellcheck="false" />
              <button type="button" id="shakti-ai-key-save-btn" class="shakti-ai-key-action-btn">Save</button>
              <button type="button" id="shakti-ai-key-clear-btn" class="shakti-ai-key-action-btn secondary" hidden>Remove</button>
            </div>
            <div id="shakti-ai-key-feedback" class="shakti-ai-key-feedback" hidden></div>
          </div>
        </div>

        <div class="shakti-ai-lang-bar">
          <span class="shakti-ai-lang-label">Reply Language</span>
          <div class="shakti-ai-lang-tabs" role="tablist" aria-label="AI explanation language">
            <button type="button" class="shakti-ai-lang-tab" role="tab" data-ai-lang="en" aria-selected="${state.language === 'en' ? 'true' : 'false'}">English</button>
            <button type="button" class="shakti-ai-lang-tab" role="tab" data-ai-lang="hinglish" aria-selected="${state.language === 'hinglish' ? 'true' : 'false'}">Hinglish</button>
            <button type="button" class="shakti-ai-lang-tab" role="tab" data-ai-lang="hi" aria-selected="${state.language === 'hi' ? 'true' : 'false'}">हिन्दी</button>
          </div>
        </div>
      </div>

      <div id="shakti-ai-context-bar" class="shakti-ai-context" hidden>
        <div class="shakti-ai-context-top">
          <span id="shakti-ai-context-meta" class="shakti-ai-context-tag">Active Question Context</span>
          <button type="button" id="shakti-ai-context-clear" class="shakti-ai-context-clear">Remove</button>
        </div>
        <p id="shakti-ai-context-text" class="shakti-ai-context-q"></p>
      </div>

      <div id="shakti-ai-messages" class="shakti-ai-body" role="log" aria-live="polite" aria-relevant="additions"></div>

      <div class="shakti-ai-footer">
        <form id="shakti-ai-form" class="shakti-ai-form" novalidate>
          <label for="shakti-ai-input" class="shakti-sr-only">Ask a Bihar exam question or concept</label>
          <textarea id="shakti-ai-input" class="shakti-ai-input" rows="1" maxlength="1200" placeholder="Ask a Bihar exam doubt or concept..."></textarea>
          <button type="submit" id="shakti-ai-send-btn" class="shakti-ai-send-btn" aria-label="Send question to Shakti AI">
            ${createIconSvg('send')}
            <span>Ask</span>
          </button>
        </form>
        <p class="shakti-ai-note">Always cross-check dates &amp; keys with official notifications.</p>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    els = {
      fab,
      backdrop,
      drawer,
      keyBtn: drawer.querySelector('#shakti-ai-key-btn'),
      keyBtnText: drawer.querySelector('#shakti-ai-key-btn-text'),
      keyPanel: drawer.querySelector('#shakti-ai-key-panel'),
      keyStatus: drawer.querySelector('#shakti-ai-key-status'),
      keyInput: drawer.querySelector('#shakti-ai-key-input'),
      keySaveBtn: drawer.querySelector('#shakti-ai-key-save-btn'),
      keyClearBtn: drawer.querySelector('#shakti-ai-key-clear-btn'),
      keyFeedback: drawer.querySelector('#shakti-ai-key-feedback'),
      clearBtn: drawer.querySelector('#shakti-ai-clear-btn'),
      closeBtn: drawer.querySelector('#shakti-ai-close-btn'),
      langTabs: Array.from(drawer.querySelectorAll('.shakti-ai-lang-tab')),
      contextBar: drawer.querySelector('#shakti-ai-context-bar'),
      contextMeta: drawer.querySelector('#shakti-ai-context-meta'),
      contextText: drawer.querySelector('#shakti-ai-context-text'),
      contextClear: drawer.querySelector('#shakti-ai-context-clear'),
      messages: drawer.querySelector('#shakti-ai-messages'),
      form: drawer.querySelector('#shakti-ai-form'),
      input: drawer.querySelector('#shakti-ai-input'),
      sendBtn: drawer.querySelector('#shakti-ai-send-btn')
    };

    fab.addEventListener('click', () => openDrawer());
    backdrop.addEventListener('click', () => closeDrawer());
    els.closeBtn.addEventListener('click', () => closeDrawer());
    els.clearBtn.addEventListener('click', () => clearChat());

    els.keyBtn.addEventListener('click', () => {
      toggleKeyPanel();
    });

    els.keySaveBtn.addEventListener('click', () => {
      const val = (els.keyInput.value || '').trim();
      if (!val) {
        showKeyFeedback('Please paste a valid Gemini API key.', 'error');
        return;
      }
      saveApiKey(val);
      showKeyFeedback('Key saved securely in browser!', 'success');
      setTimeout(() => {
        if (state.showKeyPanel) toggleKeyPanel(false);
      }, 1200);
    });

    els.keyClearBtn.addEventListener('click', () => {
      removeApiKey();
      showKeyFeedback('API key removed.', 'success');
      setTimeout(() => {
        if (state.showKeyPanel) toggleKeyPanel(false);
      }, 1000);
    });

    els.contextClear.addEventListener('click', () => {
      state.context = null;
      renderContextBar();
    });

    els.langTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        setLanguage(tab.getAttribute('data-ai-lang'));
      });
    });

    els.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (els.input.value || '').trim();
      if (!val) return;
      els.input.value = '';
      autoResizeInput();
      sendMessage(val);
    });

    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const val = (els.input.value || '').trim();
        if (val && !state.isLoading) {
          els.input.value = '';
          autoResizeInput();
          sendMessage(val);
        }
      }
    });

    els.input.addEventListener('input', autoResizeInput);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeDrawer();
      }
    });

    // Keep FAB clear of mobile mock-exam bottom bar
    const syncExamBarCollision = () => {
      const activeTest = document.getElementById('test-taking-workspace');
      const isExamLive = activeTest && !activeTest.classList.contains('hidden');
      document.body.classList.toggle('shakti-exam-active', Boolean(isExamLive));
    };
    const activeTestEl = document.getElementById('test-taking-workspace');
    if (activeTestEl && typeof MutationObserver !== 'undefined') {
      const obs = new MutationObserver(syncExamBarCollision);
      obs.observe(activeTestEl, { attributes: true, attributeFilter: ['class'] });
      syncExamBarCollision();
    }

    updateKeyUi();
    renderMessages();
    renderContextBar();
  }

  function toggleKeyPanel(forceState) {
    if (!els.keyPanel) return;
    state.showKeyPanel = typeof forceState === 'boolean' ? forceState : !state.showKeyPanel;
    els.keyPanel.hidden = !state.showKeyPanel;
    if (els.keyFeedback) els.keyFeedback.hidden = true;
    if (state.showKeyPanel && els.keyInput) {
      els.keyInput.focus();
    }
  }

  function showKeyFeedback(text, type) {
    if (!els.keyFeedback) return;
    els.keyFeedback.hidden = false;
    els.keyFeedback.className = 'shakti-ai-key-feedback ' + type;
    els.keyFeedback.textContent = text;
  }

  function saveApiKey(key) {
    const cleanKey = String(key || '').trim();
    if (!cleanKey) return;
    state.apiKey = cleanKey;
    try { localStorage.setItem(STORAGE_API_KEY, cleanKey); } catch (_) {}
    updateKeyUi();
  }

  function removeApiKey() {
    state.apiKey = '';
    try { localStorage.removeItem(STORAGE_API_KEY); } catch (_) {}
    updateKeyUi();
  }

  function updateKeyUi() {
    if (!els.keyBtn) return;
    const hasKey = Boolean(state.apiKey);
    if (els.keyBtnText) {
      els.keyBtnText.textContent = hasKey ? 'Key ✓' : 'Key';
    }
    if (els.keyBtn) {
      els.keyBtn.classList.toggle('active-key', hasKey);
    }
    if (els.keyStatus) {
      els.keyStatus.textContent = hasKey ? 'Configured ✓' : 'Optional';
      els.keyStatus.classList.toggle('active', hasKey);
    }
    if (els.keyInput) {
      els.keyInput.value = hasKey ? state.apiKey : '';
    }
    if (els.keyClearBtn) {
      els.keyClearBtn.hidden = !hasKey;
    }
  }

  function autoResizeInput() {
    if (!els.input) return;
    els.input.style.height = 'auto';
    els.input.style.height = Math.min(els.input.scrollHeight, 120) + 'px';
  }

  function renderContextBar() {
    if (!els.contextBar) return;
    if (!state.context || !state.context.question) {
      els.contextBar.hidden = true;
      return;
    }
    const metaParts = [state.context.subject, state.context.exam].filter(Boolean);
    els.contextMeta.textContent = metaParts.length > 0 ? metaParts.join(' · ') : 'Loaded Question Context';
    els.contextText.textContent = state.context.question;
    els.contextBar.hidden = false;
  }

  function renderMessages() {
    if (!els.messages) return;
    els.messages.innerHTML = '';

    if (state.messages.length === 0) {
      const welcome = document.createElement('div');
      welcome.className = 'shakti-ai-welcome';
      welcome.innerHTML = `
        <div class="shakti-ai-welcome-title">Focused Bihar Exam Guidance</div>
        <p class="shakti-ai-welcome-desc">
          Ask about any BPSC, BSSC CGL 4, or AEDO question, Bihar Special fact, or option elimination logic. Answers stay structured: <strong>Core Concept</strong> &rarr; <strong>Option Breakdown</strong> &rarr; <strong>Memory Hook</strong>.
        </p>
        <div class="shakti-ai-chips" id="shakti-ai-starter-chips"></div>
      `;
      const chipsWrap = welcome.querySelector('#shakti-ai-starter-chips');
      STARTER_CHIPS.forEach((chipText) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'shakti-ai-chip';
        btn.textContent = chipText;
        btn.addEventListener('click', () => {
          if (!state.isLoading) sendMessage(chipText);
        });
        chipsWrap.appendChild(btn);
      });
      els.messages.appendChild(welcome);
    }

    state.messages.forEach((msg) => {
      const wrap = document.createElement('div');
      wrap.className = 'shakti-ai-msg ' + msg.role + (msg.isError ? ' error' : '');

      if (msg.isKeyPrompt) {
        const card = document.createElement('div');
        card.className = 'shakti-ai-key-card';
        card.innerHTML = `
          <div class="shakti-ai-key-card-title">
            <span>🔑</span>
            <span>Connect Free Google Gemini AI</span>
          </div>
          <p class="shakti-ai-key-card-desc">
            To explore custom open-ended questions directly with Google AI, enter your free Google Gemini API key. Get one free from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>. Saved privately in your browser.
          </p>
          <div class="shakti-ai-key-card-row">
            <input type="password" class="shakti-ai-key-input shakti-ai-card-key-input" placeholder="Paste free Gemini key (AIzaSy...)" autocomplete="off" />
            <button type="button" class="shakti-ai-key-action-btn shakti-ai-card-save-btn">Save &amp; Continue</button>
          </div>
          <div class="shakti-ai-key-feedback" hidden></div>
        `;
        const cardInput = card.querySelector('.shakti-ai-card-key-input');
        const cardSaveBtn = card.querySelector('.shakti-ai-card-save-btn');
        const cardFeedback = card.querySelector('.shakti-ai-key-feedback');

        cardSaveBtn.addEventListener('click', () => {
          const val = (cardInput.value || '').trim();
          if (!val) {
            cardFeedback.hidden = false;
            cardFeedback.className = 'shakti-ai-key-feedback error';
            cardFeedback.textContent = 'Please enter an API key.';
            return;
          }
          saveApiKey(val);
          cardFeedback.hidden = false;
          cardFeedback.className = 'shakti-ai-key-feedback success';
          cardFeedback.textContent = 'Key saved! Answering your question...';
          setTimeout(() => {
            if (msg.retryText) {
              sendMessage(msg.retryText);
            }
          }, 600);
        });

        wrap.appendChild(card);
      } else {
        const bubble = document.createElement('div');
        bubble.className = 'shakti-ai-bubble';
        if (msg.role === 'assistant') {
          bubble.innerHTML = formatAiMarkdown(msg.text);
        } else {
          bubble.textContent = msg.text;
        }
        wrap.appendChild(bubble);

        if (msg.role === 'assistant' && !msg.isError) {
          const meta = document.createElement('div');
          meta.className = 'shakti-ai-msg-meta';
          const copyBtn = document.createElement('button');
          copyBtn.type = 'button';
          copyBtn.className = 'shakti-ai-copy-btn';
          copyBtn.textContent = 'Copy explanation';
          copyBtn.addEventListener('click', () => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(msg.text).then(() => {
                copyBtn.textContent = 'Copied';
                setTimeout(() => { copyBtn.textContent = 'Copy explanation'; }, 1600);
              }).catch(() => {});
            }
          });
          meta.appendChild(copyBtn);
          wrap.appendChild(meta);
        }
      }

      els.messages.appendChild(wrap);
    });

    if (state.isLoading) {
      const typing = document.createElement('div');
      typing.className = 'shakti-ai-typing';
      typing.id = 'shakti-ai-typing';
      typing.innerHTML = '<span>Shakti AI is preparing a clear explanation</span><span class="shakti-ai-dots"><span></span><span></span><span></span></span>';
      els.messages.appendChild(typing);
    }

    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function setLoading(loading) {
    state.isLoading = loading;
    if (els.sendBtn) els.sendBtn.disabled = loading;
    if (els.input) els.input.disabled = loading;
    renderMessages();
  }

  function setLanguage(lang) {
    if (!['en', 'hinglish', 'hi'].includes(lang)) return;
    state.language = lang;
    try { localStorage.setItem(STORAGE_LANG_KEY, lang); } catch (_) {}
    if (els.langTabs) {
      els.langTabs.forEach((tab) => {
        tab.setAttribute('aria-selected', tab.getAttribute('data-ai-lang') === lang ? 'true' : 'false');
      });
    }
  }

  function openDrawer() {
    buildDrawerDom();
    state.isOpen = true;
    els.backdrop.classList.add('open');
    els.backdrop.setAttribute('aria-hidden', 'false');
    els.drawer.classList.add('open');
    els.drawer.setAttribute('aria-hidden', 'false');
    els.fab.classList.add('shakti-ai-fab-hidden');
    els.fab.setAttribute('aria-expanded', 'true');
    setTimeout(() => {
      if (els.input && !state.isLoading) els.input.focus();
    }, 220);
  }

  function closeDrawer() {
    if (!els.drawer) return;
    state.isOpen = false;
    els.backdrop.classList.remove('open');
    els.backdrop.setAttribute('aria-hidden', 'true');
    els.drawer.classList.remove('open');
    els.drawer.setAttribute('aria-hidden', 'true');
    els.fab.classList.remove('shakti-ai-fab-hidden');
    els.fab.setAttribute('aria-expanded', 'false');
    els.fab.focus();
  }

  function clearChat() {
    if (state.isLoading) return;
    state.messages = [];
    renderMessages();
  }

  async function sendMessage(text) {
    const cleanText = String(text || '').trim();
    if (!cleanText || state.isLoading) return;

    const now = Date.now();
    if (now - state.lastSubmitAt < 400) return;
    state.lastSubmitAt = now;

    buildDrawerDom();

    state.messages.push({ role: 'user', text: cleanText });

    // 1. Instant offline check
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (state.context && state.context.question) {
        const explanation = formatContextExplanation(state.context, state.language);
        state.messages.push({ role: 'assistant', text: explanation });
      } else if (isGreeting(cleanText)) {
        const reply = GREETING_REPLIES[state.language] || GREETING_REPLIES.en;
        state.messages.push({ role: 'assistant', text: reply });
      } else {
        state.messages.push({
          role: 'assistant',
          isError: true,
          text: 'You appear to be offline right now. Your PYQ Bank and saved notes work offline; reconnect briefly to ask Shakti AI.'
        });
      }
      renderMessages();
      return;
    }

    // 2. Instant Greetings: Immediate, zero latency, 100% reliable
    if (isGreeting(cleanText)) {
      const reply = GREETING_REPLIES[state.language] || GREETING_REPLIES.en;
      state.messages.push({ role: 'assistant', text: reply });
      renderMessages();
      return;
    }

    setLoading(true);

    let answerObtained = false;
    let answerText = '';

    // 3. Try Backend / Cloudflare Worker / Server endpoint first
    try {
      const historyPayload = state.messages
        .slice(0, -1)
        .filter((m) => !m.isError && !m.isKeyPrompt)
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

      const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          language: state.language,
          context: state.context,
          history: historyPayload
        }),
        signal: controller ? controller.signal : undefined
      }).catch(() => null);

      if (timeoutId) clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.answer) {
          answerText = data.answer;
          answerObtained = true;
        }
      }
    } catch (_) {}

    // 4. Try Direct Client Gemini API if key is saved
    if (!answerObtained && state.apiKey) {
      try {
        const historyPayload = state.messages
          .slice(0, -1)
          .filter((m) => !m.isError && !m.isKeyPrompt)
          .slice(-6);
        const directAnswer = await callDirectGemini(state.apiKey, cleanText, state.language, state.context, historyPayload);
        if (directAnswer) {
          answerText = directAnswer;
          answerObtained = true;
        }
      } catch (geminiErr) {
        if (geminiErr.message && (geminiErr.message.includes('API Key') || geminiErr.message.includes('permission'))) {
          state.messages.push({
            role: 'assistant',
            isError: true,
            text: geminiErr.message
          });
          setLoading(false);
          return;
        }
      }
    }

    // 5. Active Question Context Fallback (Official verified explanation)
    if (!answerObtained && state.context && state.context.question) {
      answerText = formatContextExplanation(state.context, state.language);
      answerObtained = true;
    }

    // 6. If answer obtained, display it!
    if (answerObtained && answerText) {
      state.messages.push({ role: 'assistant', text: answerText });
      setLoading(false);
      return;
    }

    // 7. Unhandled open query without API key: Show helpful key connection card
    setLoading(false);
    state.messages.push({
      role: 'assistant',
      isKeyPrompt: true,
      retryText: cleanText
    });
    renderMessages();
  }

  function explainQuestion(ctx, autoPrompt) {
    buildDrawerDom();
    state.context = {
      question: ctx && ctx.question ? String(ctx.question).trim() : '',
      options: ctx && Array.isArray(ctx.options) ? ctx.options : [],
      correctAnswer: ctx && ctx.correctAnswer ? String(ctx.correctAnswer).trim() : '',
      explanation: ctx && ctx.explanation ? String(ctx.explanation).trim() : '',
      subject: ctx && ctx.subject ? String(ctx.subject).trim() : '',
      exam: ctx && ctx.exam ? String(ctx.exam).trim() : ''
    };
    renderContextBar();
    openDrawer();

    const promptText = autoPrompt || 'Explain this question clearly, why the other options are wrong, and give a quick Bihar exam memory hook.';
    if (!state.isLoading) {
      sendMessage(promptText);
    }
  }

  function init() {
    buildDrawerDom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ShaktiAI = {
    open: openDrawer,
    close: closeDrawer,
    explainQuestion,
    setLanguage,
    clearChat,
    sendMessage,
    saveApiKey,
    removeApiKey
  };
})();
