// Therabee EHR Sync - side panel logic
//
// Auth: Appwrite email/password session (cookie) -> short-lived JWT ->
// Bearer token for the Therabee backend API.
//
// New model: each session carries its own note (note_format + note_content,
// where note_content is { sectionName: text }). No separate notes endpoint.

// ---------------- Configuration ----------------
const CONFIG = {
  APPWRITE_ENDPOINT: 'https://sfo.cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: '6a32c57f003397a90bca',
  // Switch to 'http://localhost:8000' for local development
  BACKEND_URL: 'https://therapisthelper-backend.onrender.com',
};

// EHR note-taking entry points (opened in a new tab on request).
const EHR_URLS = {
  therapynotes: 'https://www.therapynotes.com/app/',
  simplepractice: 'https://secure.simplepractice.com/',
  janeapp: 'https://jane.app/',
};

// ---------------- State ----------------
let jwt = null;
let userEmail = null;
let clients = [];
let sessions = [];
let currentSession = null;   // full session object
let currentSections = null;  // { sectionName: text }
let selectedSessionId = null;
let pageSupported = false;

// ---------------- DOM helpers ----------------
const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove('hidden');
const hide = (id) => $(id).classList.add('hidden');

function showView(name) {
  ['view-login', 'view-main', 'view-result'].forEach(hide);
  show(name);
}

function setError(id, message) {
  const el = $(id);
  if (message) { el.textContent = message; el.classList.remove('hidden'); }
  else { el.classList.add('hidden'); }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

// ---------------- Appwrite auth ----------------
async function appwriteFetch(path, options = {}) {
  return fetch(`${CONFIG.APPWRITE_ENDPOINT}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
      ...(options.headers || {}),
    },
  });
}

async function login(email, password) {
  const res = await appwriteFetch('/account/sessions/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Sign in failed');
  }
  await refreshJwt();
  userEmail = email;
  await chrome.storage.local.set({ userEmail: email });
}

async function refreshJwt() {
  const res = await appwriteFetch('/account/jwt', { method: 'POST' });
  if (!res.ok) throw new Error('Session expired - please sign in again');
  const data = await res.json();
  jwt = data.jwt;
  return jwt;
}

async function logout() {
  try { await appwriteFetch('/account/sessions/current', { method: 'DELETE' }); }
  catch (e) { /* best effort */ }
  jwt = null; userEmail = null;
  await chrome.storage.local.remove(['userEmail']);
  showView('view-login');
}

// ---------------- Backend API ----------------
async function api(path, options = {}, retried = false) {
  const res = await fetch(`${CONFIG.BACKEND_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}`, ...(options.headers || {}) },
  });
  if (res.status === 401 && !retried) {
    await refreshJwt();
    return api(path, options, true);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---------------- Page detection ----------------
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function checkPage() {
  const statusEl = $('page-status');
  const tab = await getActiveTab();
  if (!tab?.url || !/https:\/\/[^/]*therapynotes\.com\//.test(tab.url)) {
    pageSupported = false;
    statusEl.textContent = 'Open your EHR note page to enable sync';
    statusEl.className = 'page-status bad';
    updateTransferButton();
    return;
  }
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_PAGE' });
    pageSupported = Boolean(result?.supported);
    statusEl.textContent = pageSupported
      ? `Note page detected (${result.fieldsFound} fields)`
      : 'EHR open, but no note fields detected here';
    statusEl.className = pageSupported ? 'page-status ok' : 'page-status bad';
  } catch (e) {
    pageSupported = false;
    statusEl.textContent = 'EHR open - reload the page to enable sync';
    statusEl.className = 'page-status bad';
  }
  updateTransferButton();
}

function hasContent(sections) {
  return sections && Object.values(sections).some(v => v && String(v).trim());
}

function updateTransferButton() {
  $('btn-transfer').disabled = !(pageSupported && hasContent(currentSections));
}

// ---------------- Data loading ----------------
async function loadSettings() {
  try {
    const settings = await api('/api/v1/settings/');
    if (settings?.default_ehr) $('select-ehr').value = settings.default_ehr;
  } catch (e) { /* defaults are fine */ }
}

async function loadClients() {
  const select = $('select-client');
  clients = await api('/api/v1/clients/');
  select.innerHTML = '<option value="">Select a client…</option>' +
    clients.map(c => `<option value="${c.id}">${escapeHtml(c.name || 'Unnamed')}</option>`).join('');
}

async function loadSessions(clientId) {
  const select = $('select-session');
  select.disabled = true;
  select.innerHTML = '<option value="">Loading sessions…</option>';
  sessions = await api(`/api/v1/sessions/client/${clientId}?limit=50`);
  if (!sessions.length) {
    select.innerHTML = '<option value="">No sessions for this client</option>';
    return;
  }
  select.innerHTML = '<option value="">Select a session…</option>' +
    sessions.map(s => {
      const date = s.session_date ? new Date(s.session_date).toLocaleDateString() : 'Unknown date';
      const fmt = (s.note_format || 'note').toUpperCase();
      return `<option value="${s.id}">${date} — ${escapeHtml(fmt)}</option>`;
    }).join('');
  select.disabled = false;
}

function selectSession(sessionId) {
  currentSession = sessions.find(s => s.id === sessionId) || null;
  currentSections = currentSession?.note_content || null;
  setError('main-error', null);
  if (!hasContent(currentSections)) {
    hide('note-preview');
    setError('main-error', 'This session has no saved note content yet.');
    currentSections = null;
  } else {
    renderPreview(currentSections);
  }
  updateTransferButton();
}

function renderPreview(sections) {
  const container = $('preview-sections');
  container.innerHTML = Object.entries(sections).map(([name, text]) => `
    <div class="preview-section">
      <b>${escapeHtml(name)}</b>
      <p>${escapeHtml(text || '(empty)')}</p>
    </div>
  `).join('');
  show('note-preview');
}

// ---------------- Sync ----------------
async function transfer() {
  const btn = $('btn-transfer');
  btn.disabled = true;
  btn.textContent = 'Syncing…';
  setError('main-error', null);

  let overall = 'failed';
  let resultData = null;
  let errorMessage = null;

  try {
    const tab = await getActiveTab();
    resultData = await chrome.tabs.sendMessage(tab.id, { type: 'TRANSFER', sections: currentSections });
    overall = resultData?.overall || 'failed';
  } catch (e) {
    overall = 'failed';
    errorMessage = String(e?.message || e);
  }

  showResult(overall, resultData, errorMessage);
  btn.disabled = false;
  btn.textContent = 'Sync to EHR';
}

function showResult(overall, data, errorMessage) {
  const icons = { success: '✅', partial_success: '⚠️', failed: '❌', field_not_found: '🔍' };
  const titles = {
    success: 'Sync successful', partial_success: 'Partial sync', failed: 'Sync failed',
    field_not_found: 'Fields not found',
  };
  const details = {
    success: 'All sections were inserted and validated. Review them before saving in your EHR.',
    partial_success: 'Some sections were inserted. Fill the remaining ones manually.',
    failed: errorMessage || 'Nothing was synced. Make sure you are on an open EHR note page.',
    field_not_found: 'The note fields could not be confidently matched, so nothing was inserted.',
  };

  $('result-icon').textContent = icons[overall] || '❌';
  $('result-title').textContent = titles[overall] || 'Sync failed';
  $('result-detail').textContent = details[overall] || '';

  const list = $('result-fields');
  list.innerHTML = '';
  if (data?.results) {
    const statusLabel = {
      success: ['Inserted', 'status-success'],
      field_not_found: ['No field', 'status-bad'],
      validation_failed: ['Failed', 'status-bad'],
      error: ['Error', 'status-bad'],
      skipped_empty: ['Empty', 'status-skip'],
    };
    for (const [section, r] of Object.entries(data.results)) {
      const [label, cls] = statusLabel[r.status] || [r.status, 'status-skip'];
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHtml(section)}</span><span class="${cls}">${label}</span>`;
      list.appendChild(li);
    }
  }
  showView('view-result');
}

// ---------------- Init & events ----------------
async function init() {
  checkPage();
  try {
    await refreshJwt();
    const stored = await chrome.storage.local.get(['userEmail']);
    userEmail = stored.userEmail || '';
    await enterMain();
  } catch (e) {
    showView('view-login');
  }
}

async function enterMain() {
  $('user-email').textContent = userEmail || 'Signed in';
  showView('view-main');
  await Promise.all([loadSettings(), loadClients().catch(e => setError('main-error', e.message))]);
}

$('btn-login').addEventListener('click', async () => {
  const btn = $('btn-login');
  setError('login-error', null);
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    await login($('login-email').value.trim(), $('login-password').value);
    await enterMain();
  } catch (e) {
    setError('login-error', e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
});

$('btn-logout').addEventListener('click', logout);

$('select-ehr').addEventListener('change', async (e) => {
  const value = e.target.value;
  try {
    await api('/api/v1/settings/', {
      method: 'PUT',
      body: JSON.stringify({ default_ehr: value, last_used_ehr: value }),
    });
  } catch (err) { /* best effort */ }
});

$('btn-open-ehr').addEventListener('click', () => {
  const url = EHR_URLS[$('select-ehr').value];
  if (url) chrome.tabs.create({ url });
});

$('select-client').addEventListener('change', async (e) => {
  const clientId = e.target.value || null;
  selectedSessionId = null;
  currentSession = null;
  currentSections = null;
  hide('note-preview');
  updateTransferButton();
  if (clientId) {
    try { await loadSessions(clientId); }
    catch (err) { setError('main-error', err.message); }
  } else {
    $('select-session').disabled = true;
    $('select-session').innerHTML = '<option value="">Select a client first</option>';
  }
});

$('select-session').addEventListener('change', (e) => {
  selectedSessionId = e.target.value || null;
  if (selectedSessionId) selectSession(selectedSessionId);
  else { currentSections = null; hide('note-preview'); updateTransferButton(); }
});

$('btn-transfer').addEventListener('click', transfer);
$('btn-done').addEventListener('click', () => showView('view-main'));

init();
