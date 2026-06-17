// Therabee EHR Sync - content script
//
// Generic note-field matcher. Works with any note format: it receives a
// { sectionName: text } object and tries to place each section into the most
// likely field on the page, using confidence-based scoring. Never fills a
// field whose identity is uncertain.

(() => {
  const CONFIDENCE_THRESHOLD = 4;
  const STOPWORDS = new Set(['and', 'of', 'the', 'a', 'to', 'with', '&']);

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

  function associatedText(el) {
    const parts = [
      el.getAttribute('aria-label'), el.getAttribute('placeholder'),
      el.getAttribute('name'), el.id, el.getAttribute('data-field'),
    ];
    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) parts.push(label.textContent);
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

  function scoreField(el, section) {
    const sectionNorm = normalize(section);
    const kws = keywords(section);
    const texts = associatedText(el);
    const haystack = texts.join(' | ');
    let score = 0;

    if (texts.includes(sectionNorm)) score += 8;          // exact label match
    else if (haystack.includes(sectionNorm)) score += 6;  // contains full phrase

    const matched = kws.filter(k => haystack.includes(k)).length;
    if (kws.length && matched === kws.length) score += 4;
    else score += matched * 2;

    return score;
  }

  function matchFields(sectionNames) {
    const candidates = getCandidates();
    const mapping = {};
    const used = new Set();
    for (const section of sectionNames) {
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

  function setFieldValue(el, value) {
    if (el.isContentEditable) {
      el.focus(); el.textContent = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.blur();
      return;
    }
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    el.focus(); setter.call(el, value);
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

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'CHECK_PAGE') sendResponse(checkPage());
    else if (message?.type === 'TRANSFER') sendResponse(transfer(message.sections || {}));
    return false;
  });
})();
</content>
