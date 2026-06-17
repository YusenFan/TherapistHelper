// Therabee EHR Sync - content script
//
// Generic note-field matcher. Works with any note format: it receives a
// { sectionName: text } object and tries to place each section into the most
// likely field on the page, using confidence-based scoring. Never fills a
// field whose identity is uncertain.

// Guard against double-injection when the side panel re-injects this script
// via chrome.scripting.executeScript after an extension reload.
if (window.__therabeeSyncLoaded) {
  // Already loaded; skip.
} else {
  window.__therabeeSyncLoaded = true;
(() => {
  const CONFIDENCE_THRESHOLD = 4;
  const STOPWORDS = new Set(['and', 'of', 'the', 'a', 'to', 'with', '&']);

  // Section names that EHRs use as exact field labels. When the Therabee note
  // section has one of these names, prefer an exact label match over the
  // fuzzy scorer — TherapyNotes labels these consistently and an exact match
  // is far more reliable than the keyword heuristic.
  const KNOWN_SECTION_LABELS = new Set([
    'subjective', 'objective', 'assessment', 'plan',
    'data',
    'behavior', 'intervention', 'response',
    'goal', 'problem', 'situation', 'evaluation',
  ]);

  function normalize(text) {
    return (text || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function keywords(section) {
    return normalize(section).split(' ').filter(w => w.length > 2 && !STOPWORDS.has(w));
  }

  function visible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 30 && rect.height > 10;
  }

  function getCandidates() {
    return Array.from(document.querySelectorAll(
      'textarea, input[type="text"], [contenteditable="true"], [contenteditable=""]'
    )).filter(el => visible(el) && !el.disabled && !el.readOnly);
  }

  function isFillableEl(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'TEXTAREA') return !el.disabled && !el.readOnly;
    if (tag === 'INPUT' && /^(text|search|email|url|tel|)$/i.test(el.type || '')) {
      return !el.disabled && !el.readOnly;
    }
    if (el.isContentEditable) return true;
    return false;
  }

  // Descend into a wrapper (rich-editor scaffolding) to find the editable
  // element. TherapyNotes' `<h2 for="RichTextbox_13000">` may point at a
  // hidden textarea whose visible counterpart is a sibling/child contenteditable.
  function resolveFillableInside(host) {
    if (!host) return null;
    if (isFillableEl(host) && visible(host)) return host;
    const direct = host.querySelector('textarea, input, [contenteditable="true"], [contenteditable=""]');
    if (direct && isFillableEl(direct) && visible(direct)) return direct;
    // Hidden textareas sometimes shadow a visible editor sibling.
    if (host.tagName === 'TEXTAREA') {
      let scope = host.parentElement;
      for (let i = 0; i < 4 && scope; i++, scope = scope.parentElement) {
        const sibling = scope.querySelector('[contenteditable="true"], [contenteditable=""]');
        if (sibling && visible(sibling)) return sibling;
      }
      return host; // fall back to the hidden textarea itself
    }
    return null;
  }

  // Build a {normalizedLabelText -> fillableElement} map directly from
  // `[for]` attributes. This bypasses heuristic scoring for EHRs that
  // properly associate label→field (TherapyNotes, most ASP.NET forms, etc).
  function buildLabelMap() {
    const map = new Map();
    document.querySelectorAll('[for]').forEach(labelEl => {
      const id = labelEl.getAttribute('for');
      if (!id) return;
      const labelText = normalize(labelEl.textContent);
      if (!labelText) return;
      const target = document.getElementById(id);
      const field = resolveFillableInside(target);
      if (!field) return;
      // First label wins (TherapyNotes uses one label per field).
      if (!map.has(labelText)) map.set(labelText, field);
    });
    return map;
  }

  function associatedText(el) {
    const parts = [
      el.getAttribute('aria-label'), el.getAttribute('placeholder'),
      el.getAttribute('name'), el.id, el.getAttribute('data-field'),
    ];
    if (el.id) {
      // TherapyNotes (and others) put `for="<id>"` on non-<label> elements
      // like <h2 for="RichTextbox_13000">. Resolve those too, not just <label>.
      document.querySelectorAll(`[for="${CSS.escape(el.id)}"]`).forEach(host => {
        parts.push(host.textContent);
      });
    }
    if (el.labels && el.labels.length) Array.from(el.labels).forEach(l => parts.push(l.textContent));

    let node = el.parentElement, depth = 0;
    while (node && depth < 4) {
      const heading = node.querySelector(':scope > label, :scope > legend, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > span.label, :scope > div.label');
      if (heading && heading.textContent && heading.textContent.length < 80) parts.push(heading.textContent);
      const sib = node.previousElementSibling;
      if (sib && sib.textContent && sib.textContent.length < 80) parts.push(sib.textContent);
      node = node.parentElement; depth++;
    }
    return parts.filter(Boolean).map(normalize);
  }

  function escapeRegex(s) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  function scoreField(el, section) {
    const sectionNorm = normalize(section);
    const kws = keywords(section);
    const texts = associatedText(el);
    const haystack = texts.join(' | ');
    let score = 0;

    // Word-boundary match so "plan" doesn't match "plant" or "explanation".
    const phraseRe = new RegExp(`\\b${escapeRegex(sectionNorm)}\\b`);
    if (texts.includes(sectionNorm)) score += 8;                 // exact label
    else if (texts.some(t => t.startsWith(sectionNorm + ' '))) score += 7; // "Subjective ..."
    else if (phraseRe.test(haystack)) score += 6;                // contains as a whole word

    const matched = kws.filter(k => new RegExp(`\\b${escapeRegex(k)}\\b`).test(haystack)).length;
    if (kws.length && matched === kws.length) score += 4;
    else score += matched * 2;

    return score;
  }

  function findExactLabelField(section, candidates, used) {
    const target = normalize(section);
    if (!target) return null;
    // Prefer exact label; otherwise prefer the shortest label that BEGINS with
    // the section name (e.g. "Subjective" → "Subjective Report and Symptom
    // Description"). Shortest-prefix-wins keeps "Plan" from grabbing
    // "Plan / Next Session Goals" when a cleaner "Plan" label is also present.
    let exact = null;
    let prefix = null;
    let prefixLabelLen = Infinity;
    for (const el of candidates) {
      if (used.has(el)) continue;
      const texts = associatedText(el);
      for (const t of texts) {
        if (t === target) { exact = el; break; }
        if (t.startsWith(target + ' ') && t.length < prefixLabelLen) {
          prefix = el; prefixLabelLen = t.length;
        }
      }
      if (exact) break;
    }
    return exact || prefix;
  }

  function matchFields(sectionNames) {
    const candidates = getCandidates();
    const labelMap = buildLabelMap();
    const mapping = {};
    const used = new Set();

    // Pass 0: direct [for]→field resolution. Match each section name to a
    // label by exact text or shortest "starts-with" prefix. This is the
    // deterministic path — when labels exist, scoring shouldn't override.
    for (const section of sectionNames) {
      const target = normalize(section);
      if (!target) continue;
      let bestLabel = null, bestLen = Infinity;
      for (const [label, field] of labelMap.entries()) {
        if (used.has(field)) continue;
        const isExact = label === target;
        const isPrefix = label.startsWith(target + ' ');
        if (!isExact && !isPrefix) continue;
        if (isExact) { bestLabel = label; break; }
        if (label.length < bestLen) { bestLabel = label; bestLen = label.length; }
      }
      if (bestLabel) {
        const field = labelMap.get(bestLabel);
        mapping[section] = field;
        used.add(field);
      }
    }

    // Pass 1: exact-label match for well-known section names against any
    // candidate (covers labels with no `for` attribute, e.g. wrapper-only).
    for (const section of sectionNames) {
      if (mapping[section]) continue;
      if (!KNOWN_SECTION_LABELS.has(normalize(section))) continue;
      const el = findExactLabelField(section, candidates, used);
      if (el) { mapping[section] = el; used.add(el); }
    }

    // Pass 2: fuzzy scoring for everything still unmapped.
    for (const section of sectionNames) {
      if (mapping[section]) continue;
      let best = null, bestScore = 0;
      for (const el of candidates) {
        if (used.has(el)) continue;
        const s = scoreField(el, section);
        if (s > bestScore) { bestScore = s; best = el; }
      }
      if (best && bestScore >= CONFIDENCE_THRESHOLD) {
        mapping[section] = best;
        used.add(best);
      }
    }
    return mapping;
  }

  // Simulate a real user paste so rich-text editors (TherapyNotes, TinyMCE,
  // Quill, Draft.js, etc.) accept the value. Plain `.textContent = ...` is
  // ignored by editors that listen for input/beforeinput/paste events.
  function setFieldValue(el, value) {
    el.focus();
    el.scrollIntoView({ block: 'center', behavior: 'instant' });

    if (el.isContentEditable) {
      // Select everything currently in the editor so insertText replaces it.
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      let inserted = false;
      try {
        // execCommand fires the same input events as a user paste, which is
        // what rich editors listen for. Deprecated in spec but still the most
        // compatible way to drive contenteditable editors.
        inserted = document.execCommand('insertText', false, value);
      } catch { inserted = false; }

      if (!inserted) {
        // Last-resort fallback: dispatch a synthetic beforeinput, then set
        // textContent. Some editors honor the beforeinput event.
        try {
          el.dispatchEvent(new InputEvent('beforeinput', {
            bubbles: true, cancelable: true, inputType: 'insertFromPaste', data: value,
          }));
        } catch { /* InputEvent unsupported, ignore */ }
        el.textContent = value;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: value }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      el.blur();
      return;
    }

    // textarea / text input: use the React-aware native setter so frameworks
    // pick up the new value. Then fire input + change to match a real edit.
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
  }

  function readFieldValue(el) {
    return el.isContentEditable ? el.textContent : el.value;
  }

  function checkPage() {
    const found = getCandidates().length;
    return { supported: found >= 1, fieldsFound: found, url: location.href };
  }

  // Extract patient name + session date from a TherapyNotes note page so the
  // side panel can auto-pick the matching Therabee client + session.
  function detectContext() {
    const stripChrome = (s) => (s || '')
      .replace(/\s*[-|·–]\s*TherapyNotes.*$/i, '')
      .replace(/\s*\(.*?\)\s*$/, '')
      .trim();

    const nameCandidates = [
      document.querySelector('[data-patient-name]')?.textContent,
      document.querySelector('.patient-name')?.textContent,
      document.querySelector('header h1')?.textContent,
      document.querySelector('h1')?.textContent,
      stripChrome(document.title),
    ];
    let patientName = null;
    for (const raw of nameCandidates) {
      const t = (raw || '').trim();
      if (t && t.length < 80 && /[a-z]/i.test(t) && !/^therapy ?notes$/i.test(t)) {
        patientName = t; break;
      }
    }

    const dateRegex = /\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(20\d{2})\b/;
    const dateHosts = document.querySelectorAll(
      'h1, h2, h3, h4, .date, .session-date, [data-session-date], time'
    );
    let sessionDate = null;
    for (const h of dateHosts) {
      const text = (h.getAttribute?.('datetime') || h.textContent || '').trim();
      const m = text.match(dateRegex);
      if (m) { sessionDate = m[0]; break; }
    }

    return { patientName, sessionDate, url: location.href };
  }

  function transfer(sections) {
    const names = Object.keys(sections || {});
    const mapping = matchFields(names);
    const results = {};
    let filled = 0, requested = 0;

    for (const section of names) {
      const content = sections[section];
      if (!content || !String(content).trim()) { results[section] = { status: 'skipped_empty' }; continue; }
      requested++;
      const el = mapping[section];
      if (!el) { results[section] = { status: 'field_not_found' }; continue; }
      try {
        setFieldValue(el, content);
        const after = readFieldValue(el) || '';
        if (after.includes(String(content).slice(0, Math.min(30, content.length)))) {
          results[section] = { status: 'success' }; filled++;
        } else {
          results[section] = { status: 'validation_failed' };
        }
      } catch (e) {
        results[section] = { status: 'error', message: String(e) };
      }
    }

    let overall;
    if (requested === 0) overall = 'failed';
    else if (filled === requested) overall = 'success';
    else if (filled > 0) overall = 'partial_success';
    else if (Object.values(results).some(r => r.status === 'field_not_found')) overall = 'field_not_found';
    else overall = 'failed';

    return { overall, results, filled, requested };
  }

  // ---------- Click-to-target pick mode ----------
  // The side panel can put the page into "pick mode" so the next field the
  // user clicks receives a specific section's content. This is the manual
  // fallback when the auto-matcher cannot confidently place a section.
  let pickState = null;
  let pickOverlay = null;

  function isFillable(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'TEXTAREA') return true;
    if (tag === 'INPUT' && /text|search|email|url|tel/i.test(el.type || 'text')) return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function showPickBanner(section) {
    if (pickOverlay) pickOverlay.remove();
    pickOverlay = document.createElement('div');
    pickOverlay.textContent = `Click the field to insert "${section}" (Esc to cancel)`;
    Object.assign(pickOverlay.style, {
      position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)',
      background: '#5b1a3a', color: '#fff', padding: '8px 14px',
      borderRadius: '8px', font: '13px -apple-system, sans-serif',
      zIndex: 2147483647, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', pointerEvents: 'none',
    });
    document.body.appendChild(pickOverlay);
  }

  function clearPickMode() {
    if (!pickState) return;
    document.removeEventListener('click', onPickClick, true);
    document.removeEventListener('keydown', onPickKey, true);
    document.body.style.cursor = '';
    if (pickOverlay) { pickOverlay.remove(); pickOverlay = null; }
    pickState = null;
  }

  function onPickKey(e) {
    if (e.key === 'Escape') {
      const s = pickState?.section;
      clearPickMode();
      chrome.runtime.sendMessage({ type: 'PICK_DONE', section: s, status: 'cancelled' });
    }
  }

  function onPickClick(e) {
    const el = e.target.closest('textarea, input, [contenteditable="true"], [contenteditable=""]');
    if (!isFillable(el)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const { section, content } = pickState;
    let status = 'success';
    try {
      setFieldValue(el, content);
      const after = readFieldValue(el) || '';
      if (!after.includes(String(content).slice(0, Math.min(30, content.length)))) {
        status = 'validation_failed';
      }
    } catch {
      status = 'error';
    }
    clearPickMode();
    chrome.runtime.sendMessage({ type: 'PICK_DONE', section, status });
  }

  function startPickMode(section, content) {
    clearPickMode();
    pickState = { section, content };
    document.addEventListener('click', onPickClick, true);
    document.addEventListener('keydown', onPickKey, true);
    document.body.style.cursor = 'crosshair';
    showPickBanner(section);
    return { ok: true };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'CHECK_PAGE') sendResponse(checkPage());
    else if (message?.type === 'DETECT_CONTEXT') sendResponse(detectContext());
    else if (message?.type === 'TRANSFER') sendResponse(transfer(message.sections || {}));
    else if (message?.type === 'PICK_START') sendResponse(startPickMode(message.section, message.content));
    else if (message?.type === 'PICK_CANCEL') { clearPickMode(); sendResponse({ ok: true }); }
    return false;
  });
})();
}
