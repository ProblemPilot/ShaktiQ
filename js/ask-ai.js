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
    lastSubmitAt: 0
  };

  try {
    const savedLang = localStorage.getItem(STORAGE_LANG_KEY);
    if (savedLang && ['en', 'hinglish', 'hi'].includes(savedLang)) {
      state.language = savedLang;
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
            <button type="button" id="shakti-ai-clear-btn" class="shakti-ai-icon-btn" title="Clear conversation" aria-label="Clear conversation">Clear</button>
            <button type="button" id="shakti-ai-close-btn" class="shakti-ai-icon-btn" title="Close Shakti AI" aria-label="Close Shakti AI">${createIconSvg('close')}</button>
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

    renderMessages();
    renderContextBar();
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
    if (now - state.lastSubmitAt < 450) return;
    state.lastSubmitAt = now;

    buildDrawerDom();

    state.messages.push({ role: 'user', text: cleanText });

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      state.messages.push({
        role: 'assistant',
        isError: true,
        text: 'You appear to be offline right now. Your PYQ Bank and saved notes work offline; reconnect briefly to ask Shakti AI.'
      });
      renderMessages();
      return;
    }

    setLoading(true);

    try {
      const historyPayload = state.messages
        .slice(0, -1)
        .filter((m) => !m.isError)
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          language: state.language,
          context: state.context,
          history: historyPayload
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.answer) {
        throw new Error(data.error || 'Could not get an answer right now. Please try again.');
      }

      state.messages.push({ role: 'assistant', text: data.answer });
    } catch (err) {
      state.messages.push({
        role: 'assistant',
        isError: true,
        text: (err && err.message) ? err.message : 'Unable to reach Shakti AI right now. Please try again shortly.'
      });
    } finally {
      setLoading(false);
    }
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
    sendMessage
  };
})();
