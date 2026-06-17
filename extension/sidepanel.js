// Therabee EHR Sync - side panel logic
//
// View flow:
//   login -> ehr-onboarding (if no default_ehr) -> list -> detail -> result
//
// Auth: Appwrite email/password session (cookie) -> short-lived JWT ->
// Bearer token for the Therabee backend API.

// ---------------- Configuration ----------------
const CONFIG = {
  APPWRITE_ENDPOINT: 'https://sfo.cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: '6a32c57f003397a90bca',
  BACKEND_URL: 'http://localhost:8000',
};

const EHR_URLS = {
  therapynotes: 'https://www.therapynotes.com/app/',
  simplepractice: 'https://secure.simplepractice.com/',
  janeapp: 'https://jane.app/',
};

const EHR_HOST_RE = {
  therapynotes: /https:\/\/[^/]*therapynotes\.com\//,
  simplepractice: /https:\/\/[^/]*simplepractice\.com\//,
  janeapp: /https:\/\/[^/]*jane\.app\//,
};

const EHR_LABELS = {
  therapynotes: 'TherapyNotes',
  simplepractice: 'SimplePractice',
  janeapp: 'Jane App',
};

// ---------------- State ----------------
let jwt = null;
let userEmail = null;
let clients = [];
let sessions = [];
let currentSession = null;
let currentSections = null;
let selectedSessionId = null;
let pageSupported = false;
let userSettings = null;
let viewStack = [];

// ---------------- DOM helpers ----------------
const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove('hidden');
const hide = (id) => $(id).classList.add('hidden');

const VIEWS = ['view-login', 'view-ehr-onboarding', 'view-list', 'view-detail', 'view-result'];

function showView(name, { push = true } = {}) {
  VIEWS.forEach(hide);
  show(name);
  const back = $('btn-back');
  if (name === 'view-detail' || name === 'view-result') back.classList.remove('hidden');
  else back.classList.add('hidden');
  if (push) viewStack.push(name);
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
  clients = []; sessions = []; currentSession = null; currentSections = null;
  selectedSessionId = null; userSettings = null;
  await chrome.storage.local.remove(['userEmail']);
  viewStack = [];
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

function ehrFromTab(url) {
  if (!url) return null;
  for (const [key, re] of Object.entries(EHR_HOST_RE)) {
    if (re.test(url)) return key;
  }
  return null;
}

async function checkPage() {
  const statusEl = $('page-status');
  const dotEl = $('page-status-dot');
  if (!statusEl || !dotEl) return;
  const tab = await getActiveTab();
  const ehr = $('select-ehr')?.value || userSettings?.default_ehr || 'therapynotes';

  if (!tab?.url) {
    pageSupported = false;
    statusEl.textContent = 'No active tab';
    statusEl.className = 'status-text bad';
    dotEl.className = 'dot bad';
    return;
  }

  const tabEhr = ehrFromTab(tab.url);
  if (!tabEhr) {
    pageSupported = false;
    statusEl.textContent = `Open your ${EHR_LABELS[ehr] || 'EHR'} note page to enable sync`;
    statusEl.className = 'status-text bad';
    dotEl.className = 'dot bad';
    return;
  }

  if (tabEhr !== 'therapynotes') {
    pageSupported = false;
    statusEl.textContent = `Sync for ${EHR_LABELS[tabEhr]} coming soon`;
    statusEl.className = 'status-text';
    dotEl.className = 'dot warn';
    return;
  }

  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_PAGE' });
    pageSupported = Boolean(result?.supported);
    statusEl.textContent = pageSupported
      ? `Note page detected (${result.fieldsFound} fields)`
      : 'EHR open, but no note fields detected';
    statusEl.className = pageSupported ? 'status-text ok' : 'status-text bad';
    dotEl.className = pageSupported ? 'dot ok' : 'dot bad';
  } catch (e) {
    pageSupported = false;
    statusEl.textContent = 'EHR open — reload the page to enable sync';
    statusEl.className = 'status-text bad';
    dotEl.className = 'dot bad';
  }
}

function hasContent(sections) {
  return sections && Object.values(sections).some(v => v && String(v).trim());
}

// ---------------- Data loading ----------------
async function loadSettings() {
  try {
    userSettings = await api('/api/v1/settings/');
    if (userSettings?.default_ehr) {
      const sel = $('select-ehr');
      if (sel) sel.value = userSettings.default_ehr;
    }
  } catch (e) {
    userSettings = null;
  }
}

async function saveEhrSetting(value) {
  if (!value) return;
  try {
    userSettings = await api('/api/v1/settings/', {
      method: 'PUT',
      body: JSON.stringify({ default_ehr: value, last_used_ehr: value }),
    });
  } catch (e) {
    /* best effort */
  }
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

// ---------------- Detail view rendering ----------------
function showDetail(session) {
  currentSession = session;
  currentSections = session.note_content || null;
  setError('detail-error', null);

  const client = clients.find(c => c.id === session.client_id);
  const clientName = client?.name || 'Client';
  const clientType = client?.client_type || 'individual';

  const sessDate = session.session_date ? new Date(session.session_date) : null;
  const dateLabel = sessDate ? sessDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const timeLabel = sessDate ? sessDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';

  $('detail-title').textContent = `Progress with ${clientName}`;
  $('detail-subtitle').textContent = [dateLabel, timeLabel].filter(Boolean).join(' · ');
  $('detail-client-name').textContent = clientName;
  $('detail-client-type').textContent = clientType.replace(/_/g, ' ');
  $('detail-date').textContent = dateLabel;
  $('detail-format').textContent = (session.note_format || 'Note').toUpperCase();

  const container = $('preview-sections');
  if (hasContent(currentSections)) {
    container.innerHTML = Object.entries(currentSections).map(([name, text]) => `
      <div class="preview-section">
        <b>${escapeHtml(name)}</b>
        <p>${escapeHtml(text || '(empty)')}</p>
      </div>
    `).join('');
  } else {
    container.innerHTML = '<p class="muted small">This session has no saved note content yet.</p>';
  }

  $('btn-insert').disabled = !hasContent(currentSections);
  showView('view-detail');
  checkPage();
}

// ---------------- Sync ----------------
async function transfer() {
  const btn = $('btn-insert');
  btn.disabled = true;
  btn.innerHTML = 'Inserting…';
  setError('detail-error', null);

  let overall = 'failed';
  let resultData = null;
  let errorMessage = null;

  try {
    const tab = await getActiveTab();
    const tabEhr = ehrFromTab(tab?.url);
    if (tabEhr !== 'therapynotes') {
      throw new Error('Open a TherapyNotes note page first, then try again.');
    }
    resultData = await chrome.tabs.sendMessage(tab.id, { type: 'TRANSFER', sections: currentSections });
    overall = resultData?.overall || 'failed';
  } catch (e) {
    overall = 'failed';
    errorMessage = String(e?.message || e);
  }

  showResult(overall, resultData, errorMessage);
  btn.disabled = false;
  btn.innerHTML = '<span class="sparkle">✦</span> Insert to EHR';
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
  try {
    await refreshJwt();
    const stored = await chrome.storage.local.get(['userEmail']);
    userEmail = stored.userEmail || '';
    await loadSettings();
    if (!userSettings?.default_ehr) {
      enterEhrOnboarding();
    } else {
      await enterList();
    }
  } catch (e) {
    viewStack = [];
    showView('view-login');
  }
}

function enterEhrOnboarding() {
  viewStack = [];
  showView('view-ehr-onboarding');
}

async function enterList() {
  $('user-email').textContent = userEmail || 'Signed in';
  viewStack = [];
  showView('view-list');
  await loadClients().catch(e => setError('list-error', e.message));
  // checkPage is only meaningful in the detail view, but run it once so
  // any future status indicator works.
  checkPage();
}

// --- Back button ---
$('btn-back').addEventListener('click', () => {
  // Pop the current view; go to whichever is most recent before it.
  viewStack.pop();
  const prev = viewStack[viewStack.length - 1];
  if (prev === 'view-list') {
    viewStack.pop();
    enterList();
    return;
  }
  if (prev === 'view-detail' && currentSession) {
    viewStack.pop();
    showDetail(currentSession);
    return;
  }
  enterList();
});

// --- Login ---
$('btn-login').addEventListener('click', async () => {
  const btn = $('btn-login');
  setError('login-error', null);
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    await login($('login-email').value.trim(), $('login-password').value);
    await loadSettings();
    if (!userSettings?.default_ehr) {
      enterEhrOnboarding();
    } else {
      await enterList();
    }
  } catch (e) {
    setError('login-error', e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
});

// --- EHR onboarding ---
$('onboarding-ehr').addEventListener('change', (e) => {
  $('btn-onboarding-proceed').disabled = !e.target.value;
});

$('btn-onboarding-proceed').addEventListener('click', async () => {
  const value = $('onboarding-ehr').value;
  if (!value) return;
  await saveEhrSetting(value);
  await enterList();
});

$('btn-onboarding-skip').addEventListener('click', async () => {
  await enterList();
});

// --- List view ---
$('btn-logout').addEventListener('click', logout);

$('select-ehr').addEventListener('change', async (e) => {
  await saveEhrSetting(e.target.value);
  checkPage();
});

$('btn-open-ehr').addEventListener('click', () => {
  const url = EHR_URLS[$('select-ehr').value];
  if (url) chrome.tabs.create({ url });
});

$('select-client').addEventListener('change', async (e) => {
  const clientId = e.target.value || null;
  selectedSessionId = null;
  setError('list-error', null);
  if (clientId) {
    try { await loadSessions(clientId); }
    catch (err) { setError('list-error', err.message); }
  } else {
    $('select-session').disabled = true;
    $('select-session').innerHTML = '<option value="">Select a client first</option>';
  }
});

$('select-session').addEventListener('change', (e) => {
  selectedSessionId = e.target.value || null;
  if (!selectedSessionId) return;
  const session = sessions.find(s => s.id === selectedSessionId);
  if (session) showDetail(session);
});

// --- Detail view ---
$('btn-insert').addEventListener('click', transfer);

// --- Result view ---
$('btn-done').addEventListener('click', () => {
  if (currentSession) {
    showDetail(currentSession);
  } else {
    enterList();
  }
});

// --- Tab changes: re-check page status when on detail view ---
chrome.tabs.onActivated.addListener(() => {
  if (!$('view-detail').classList.contains('hidden')) checkPage();
});
chrome.tabs.onUpdated.addListener((_, info) => {
  if (info.status === 'complete' && !$('view-detail').classList.contains('hidden')) checkPage();
});

init();
