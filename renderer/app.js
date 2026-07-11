'use strict';

// Desktop app window: Life Pursuits + Privacy Tiers editors. Scrollable, resizable.

let lastKwField = null;
let setupReady = false;
let progressTimer = null;
let progressValue = 0;
let lastSetupError = '';

// ---------- first-run setup ----------
const setupGate = document.getElementById('setupGate');
const setupTheme = document.getElementById('setupTheme');
const setupWelcome = document.getElementById('setupWelcome');
const setupSad = document.getElementById('setupSad');
const setupAccount = document.getElementById('setupAccount');
const shell = document.querySelector('.shell');
const openHelpBtn = document.getElementById('openSetupHelp');

function setProgress(value, label) {
  progressValue = Math.max(0, Math.min(100, value));
  document.getElementById('setupProgress').hidden = false;
  document.getElementById('progressFill').style.width = `${progressValue}%`;
  document.getElementById('progressPct').textContent = `${Math.round(progressValue)}%`;
  if (label) document.getElementById('progressLabel').textContent = label;
}

function stopProgress() {
  if (progressTimer) clearInterval(progressTimer);
  progressTimer = null;
}

function resetProgress() {
  stopProgress();
  progressValue = 0;
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('progressPct').textContent = '0%';
  document.getElementById('progressLabel').textContent = 'Getting ready';
  document.getElementById('setupProgress').hidden = true;
}

function startInstallProgress() {
  stopProgress();
  setProgress(4, 'Getting ready');
  const startedAt = Date.now();
  progressTimer = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    let target;
    let label;
    if (elapsed < 2500) {
      target = 12 + (elapsed / 2500) * 48;
      label = 'Scanning your PC for apps';
    } else if (elapsed < 6000) {
      target = 60 + ((elapsed - 2500) / 3500) * 30;
      label = 'Building your Life Pursuits';
    } else {
      target = 90 + Math.min(7, Math.log1p((elapsed - 6000) / 2000) * 3);
      label = 'Finishing setup';
    }
    const eased = progressValue + (target - progressValue) * 0.22;
    setProgress(Math.min(eased, 97), label);
  }, 180);
}

async function finishProgress() {
  stopProgress();
  setProgress(100, 'Ready');
  await new Promise((resolve) => setTimeout(resolve, 450));
}

function applySetupState(cfg) {
  const status = cfg.setup?.status || 'pending';
  const setupDone = status === 'ready';
  // Shown once, before anything else, so the user never lives with a default
  // theme they didn't pick. Takes priority over every other onboarding step.
  const needsThemePrompt = !cfg.onboarding?.themeChosen;
  const needsAccountPrompt = setupDone && !cfg.onboarding?.accountPromptDone;
  setupReady = setupDone && !needsAccountPrompt && !needsThemePrompt;

  setupGate.hidden = setupReady;
  shell.hidden = !setupReady;
  setupTheme.hidden = !needsThemePrompt;
  setupAccount.hidden = needsThemePrompt || !needsAccountPrompt;
  setupWelcome.hidden = needsThemePrompt || needsAccountPrompt || status === 'declined';
  setupSad.hidden = needsThemePrompt || status !== 'declined';
  const msg = document.getElementById('setupMsg');
  if (status === 'failed' && cfg.setup?.lastError) {
    lastSetupError = cfg.setup.lastError;
    msg.textContent = "I couldn't finish setup. You can try again or open help with the error already filled in.";
    openHelpBtn.hidden = false;
  } else if (status === 'installing') {
    msg.textContent = 'Setting up — scanning your apps. Takes a few seconds.';
    openHelpBtn.hidden = true;
  } else {
    msg.textContent = '';
    openHelpBtn.hidden = true;
    if (status !== 'installing') resetProgress();
  }
}

async function refreshSetup() {
  const cfg = await window.buddy.getConfig();
  applySetupState(cfg);
  updateThemeToggleLabel(cfg.theme);
  if (setupReady) {
    await loadPursuits();
  }
}

async function installSetup() {
  const installBtn = document.getElementById('installSetup');
  const declineBtn = document.getElementById('declineSetup');
  const msg = document.getElementById('setupMsg');
  installBtn.disabled = true;
  declineBtn.disabled = true;
  openHelpBtn.hidden = true;
  msg.textContent = 'Scanning your PC for apps and building your Life Pursuits — a few seconds.';
  startInstallProgress();
  try {
    const cfg = await window.buddy.installSetup();
    await finishProgress();
    applySetupState(cfg);
    await loadPursuits();
  } catch (err) {
    resetProgress();
    installBtn.disabled = false;
    declineBtn.disabled = false;
    lastSetupError = err.message || String(err);
    openHelpBtn.hidden = false;
    msg.textContent = "I couldn't finish setup. Try again, or open help and the error will already be filled in.";
  }
}

async function declineSetup() {
  resetProgress();
  const cfg = await window.buddy.declineSetup();
  applySetupState(cfg);
}

document.getElementById('installSetup').addEventListener('click', installSetup);
document.getElementById('declineSetup').addEventListener('click', declineSetup);
openHelpBtn.addEventListener('click', () => window.buddy.openSetupHelp(lastSetupError));
document.getElementById('retrySetup').addEventListener('click', async () => {
  setupWelcome.hidden = false;
  setupSad.hidden = true;
});

// ---------- onboarding: theme picker (first screen) ----------
async function chooseTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const cfg = await window.buddy.setTheme(theme);
  updateThemeToggleLabel(cfg.theme);
  applySetupState(cfg);
}
document.getElementById('pickThemeLight').addEventListener('click', () => chooseTheme('light'));
document.getElementById('pickThemeDark').addEventListener('click', () => chooseTheme('dark'));

// ---------- Settings: change theme later ----------
function updateThemeToggleLabel(theme) {
  document.getElementById('themeToggleLabel').textContent = theme === 'dark' ? 'Midnight' : 'Daylight';
}
document.getElementById('themeToggle').addEventListener('click', async () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  await chooseTheme(next);
});

// ---------- onboarding: skippable account prompt (after setup finishes) ----------
async function finishOnboarding() {
  const cfg = await window.buddy.completeOnboarding();
  applySetupState(cfg);
  await loadPursuits();
}

async function onbAuth(kind) {
  const email = document.getElementById('onbEmail').value.trim();
  const password = document.getElementById('onbPass').value;
  const msg = document.getElementById('onbMsg');
  if (!email || !password) { msg.textContent = 'Enter your email and a password.'; return; }
  msg.textContent = kind === 'signup' ? 'Creating your account…' : 'Signing in…';
  try {
    const s = kind === 'signup'
      ? await window.buddy.premiumSignUp(email, password)
      : await window.buddy.premiumSignIn(email, password);
    if (s.needsEmailConfirm) {
      msg.textContent = `Almost there — check ${s.email} for a confirmation link, then sign in from the Premium page later.`;
      return;
    }
    await finishOnboarding();
  } catch (err) {
    msg.textContent = `Hmm: ${err.message || err}`;
  }
}

document.getElementById('onbSignUp').addEventListener('click', () => onbAuth('signup'));
document.getElementById('onbSignIn').addEventListener('click', () => onbAuth('signin'));
document.getElementById('onbGoogle').addEventListener('click', async () => {
  const msg = document.getElementById('onbMsg');
  const btn = document.getElementById('onbGoogle');
  btn.disabled = true;
  msg.textContent = 'Opening Google sign-in in your browser…';
  try {
    await window.buddy.premiumSignInGoogle();
    await finishOnboarding();
  } catch (err) {
    msg.textContent = `Google sign-in failed: ${err.message || err}`;
  } finally {
    btn.disabled = false;
  }
});
document.getElementById('onbSkip').addEventListener('click', () => finishOnboarding());

// ---------- nav ----------
document.querySelectorAll('.navitem').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.navitem').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    const page = b.dataset.page;
    document.querySelectorAll('.page').forEach((p) => { p.classList.remove('active'); p.hidden = true; });
    const target = document.getElementById('page-' + page);
    if (target) { target.hidden = false; requestAnimationFrame(() => target.classList.add('active')); }
    if (page === 'privacy') loadPrivacy();
    if (page === 'jarvis') { loadJarvis(); loadJarvisWa(); loadBrowserControl(); loadAutofill(); }
    if (page === 'premium') loadPremium();
  });
});

// ---------- Life Pursuits ----------
const pursuitList = document.getElementById('pursuitList');

function pursuitRow(p) {
  const row = document.createElement('div');
  row.className = 'prow-edit';
  const nameVal = (p.emoji ? p.emoji + ' ' : '') + (p.name || '');
  row.innerHTML = `
    <div class="top">
      <input class="name" value="${escapeHtml(nameVal)}" placeholder="Pursuit name (e.g. 🍳 Learn to Cook)" />
      <button class="del" title="Remove">🗑</button>
    </div>
    <input class="kw" value="${escapeHtml((p.keywords || []).join(', '))}" placeholder="keywords, comma separated (e.g. code, github, claude)" />`;
  row.querySelector('.del').addEventListener('click', () => row.remove());
  const kw = row.querySelector('.kw');
  kw.addEventListener('focus', () => { lastKwField = kw; });
  pursuitList.appendChild(row);
}

async function loadPursuits() {
  pursuitList.innerHTML = '';
  const cfg = await window.buddy.getConfig();
  (cfg.pursuits || []).forEach(pursuitRow);
  if (!(cfg.pursuits || []).length) pursuitRow({ name: '', keywords: [] });

  const host = document.getElementById('recentApps');
  const apps = await window.buddy.recentApps();
  if (apps && apps.length) {
    host.innerHTML = '';
    apps.forEach((a) => {
      const el = document.createElement('span');
      el.className = 'app';
      el.innerHTML = `${escapeHtml(a.app)}<span class="t">${a.label}</span>`;
      el.addEventListener('click', () => {
        const field = lastKwField || pursuitList.querySelector('.kw');
        if (!field) return;
        const cur = field.value.trim();
        field.value = cur ? `${cur}, ${a.app}` : a.app;
        field.focus();
      });
      host.appendChild(el);
    });
  }
}

function splitName(raw) {
  const s = (raw || '').trim();
  const m = s.match(/^(\p{Emoji}️?)\s*(.*)$/u);
  return m ? { emoji: m[1], name: m[2].trim() } : { emoji: '', name: s };
}

async function savePursuits() {
  const pursuits = [...pursuitList.querySelectorAll('.prow-edit')].map((r) => {
    const { emoji, name } = splitName(r.querySelector('.name').value);
    const keywords = r.querySelector('.kw').value.split(',').map((k) => k.trim()).filter(Boolean);
    return { name, emoji, keywords };
  }).filter((p) => p.name);
  await window.buddy.savePursuits(pursuits);
  flash('saveMsg', 'Saved ✅ Pesto will sort new time into these.');
}

document.getElementById('visitSite').addEventListener('click', () => window.buddy.openSite());
document.getElementById('addPursuit').addEventListener('click', () => pursuitRow({ name: '', keywords: [] }));
document.getElementById('savePursuits').addEventListener('click', savePursuits);

// Scan my PC — enumerate installed apps, auto-build pursuits from the knowledge base.
document.getElementById('scanApps').addEventListener('click', async () => {
  const btn = document.getElementById('scanApps');
  const msg = document.getElementById('scanMsg');
  btn.disabled = true;
  msg.textContent = 'Scanning your apps…';
  try {
    const r = await window.buddy.scanApps();
    const cats = (r.categories || []).map((c) => `${c.emoji} ${c.name}`).join(', ');
    msg.textContent = `Scanned ${r.appsScanned} apps · recognized ${r.recognized} · built ${(r.categories || []).length} pursuits${cats ? ' (' + cats + ')' : ''}`;
    await loadPursuits();
  } catch (e) {
    msg.textContent = "Couldn't scan just now.";
  } finally {
    btn.disabled = false;
  }
});

// ---------- Privacy Tiers ----------
async function loadPrivacy() {
  const host = document.getElementById('tierList');
  const cfg = await window.buddy.getConfig();
  const tiers = cfg.privacyTiers || {};
  const apps = (await window.buddy.recentApps()) || [];
  // union of recently-seen apps and any already-configured apps
  const names = [...new Set([...apps.map((a) => a.app), ...Object.keys(tiers)])];
  if (!names.length) { host.innerHTML = '<div class="empty" style="color:var(--faint);font-size:12px">No apps seen yet.</div>'; return; }
  host.innerHTML = '';
  names.forEach((appName) => {
    const cur = tiers[appName] || cfg.defaultTier || 'private';
    const row = document.createElement('div');
    row.className = 'tierrow';
    row.dataset.app = appName;
    row.innerHTML = `<div class="app">${escapeHtml(appName)}</div>
      <div class="seg">
        ${['full', 'private', 'off'].map((t) =>
          `<button data-t="${t}" class="${t === cur ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}
      </div>`;
    row.querySelectorAll('.seg button').forEach((btn) => {
      btn.addEventListener('click', () => {
        row.querySelectorAll('.seg button').forEach((x) => x.classList.remove('on'));
        btn.classList.add('on');
      });
    });
    host.appendChild(row);
  });
}

async function saveTiers() {
  const tiers = {};
  document.querySelectorAll('.tierrow').forEach((row) => {
    const on = row.querySelector('.seg button.on');
    if (on) tiers[row.dataset.app] = on.dataset.t;
  });
  await window.buddy.saveTiers(tiers);
  flash('tierMsg', 'Saved ✅');
}
document.getElementById('saveTiers').addEventListener('click', saveTiers);

// ---------- Jarvis Mode ----------
async function loadJarvis() {
  const cfg = await window.buddy.getConfig();
  const pursuitSelect = document.getElementById('activePursuit');
  const active = cfg.jarvis?.activePursuit || '';
  pursuitSelect.innerHTML = '<option value="">No active pursuit</option>' +
    (cfg.pursuits || []).map((p) => {
      const name = p.name || '';
      return `<option value="${escapeHtml(name)}" ${name === active ? 'selected' : ''}>${escapeHtml(name)}</option>`;
    }).join('');
  document.getElementById('jarvisMode').value = cfg.mode || 'nudge';
  document.getElementById('focusDriftLimit').value = cfg.accountability?.focusDriftLimitMin ?? cfg.accountability?.distractionLimitMin ?? 15;
  document.getElementById('wardenSeconds').value = cfg.accountability?.wardenSeconds ?? 10;
}

async function saveJarvis(clearGoal = false) {
  const activePursuit = clearGoal ? '' : document.getElementById('activePursuit').value;
  const settings = {
    mode: document.getElementById('jarvisMode').value,
    jarvis: {
      activePursuit,
      activeUntil: null
    },
    accountability: {
      focusDriftLimitMin: Math.max(1, Number(document.getElementById('focusDriftLimit').value || 15)),
      wardenSeconds: Math.max(3, Number(document.getElementById('wardenSeconds').value || 10))
    }
  };
  await window.buddy.saveJarvis(settings);
  flash('jarvisMsg', clearGoal ? 'Active pursuit cleared.' : 'Jarvis mode saved.');
  await loadJarvis();
}

document.getElementById('saveJarvis').addEventListener('click', () => saveJarvis(false));
document.getElementById('clearJarvisGoal').addEventListener('click', () => saveJarvis(true));

// ---------- Jarvis Mode: WhatsApp Remote (beta) ----------
function renderJarvisWaStatus(s) {
  const statusEl = document.getElementById('jarvisWaStatus');
  const qrEl = document.getElementById('jarvisWaQr');
  if (!s || (!s.running && !s.hasQr)) {
    statusEl.textContent = 'Status: off';
    qrEl.hidden = true;
    return;
  }
  if (s.ready) {
    statusEl.textContent = 'Status: connected ✅';
    qrEl.hidden = true;
  } else if (s.hasQr) {
    statusEl.textContent = 'Status: scan this with WhatsApp > Linked devices';
  } else {
    statusEl.textContent = 'Status: starting…';
    qrEl.hidden = true;
  }
}

async function loadJarvisWa() {
  const cfg = await window.buddy.getConfig();
  document.getElementById('jarvisWaEnabled').checked = !!cfg.jarvisWhatsapp?.enabled;
  document.getElementById('jarvisWaProjectDir').value = cfg.jarvisWhatsapp?.projectDir || '';
  const s = await window.buddy.jarvisWhatsappStatus();
  renderJarvisWaStatus(s);
}

async function saveJarvisWa() {
  const settings = {
    enabled: document.getElementById('jarvisWaEnabled').checked,
    projectDir: document.getElementById('jarvisWaProjectDir').value.trim()
  };
  const btn = document.getElementById('saveJarvisWa');
  btn.disabled = true;
  try {
    const result = await window.buddy.jarvisWhatsappSet(settings);
    renderJarvisWaStatus(result.status);
    flash('jarvisWaMsg', settings.enabled ? 'Starting… scan the QR below.' : 'Turned off.');
  } catch (err) {
    flash('jarvisWaMsg', `Error: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}
document.getElementById('saveJarvisWa').addEventListener('click', saveJarvisWa);

window.buddy.onJarvisWhatsappEvent((evt) => {
  const qrEl = document.getElementById('jarvisWaQr');
  if (evt.type === 'qr' && evt.dataUrl) {
    qrEl.src = evt.dataUrl;
    qrEl.hidden = false;
  }
  window.buddy.jarvisWhatsappStatus().then(renderJarvisWaStatus);
});

// ---------- Jarvis Mode: Browser Control (beta) ----------
let bcStatusTimer = null;

function renderBrowserControl(status) {
  const on = !!status.control;
  document.getElementById('browserControlEnabled').checked = on;
  document.getElementById('bcConnect').hidden = !on;
  document.getElementById('bcTaskWrap').hidden = !on;

  const dot = document.getElementById('bcDot');
  const label = document.getElementById('bcStatus');
  if (!on) {
    dot.className = 'status-dot off';
    label.textContent = 'Off';
  } else if (status.connected) {
    dot.className = 'status-dot on';
    label.textContent = 'Connected — a browser window is linked and ready.';
  } else {
    dot.className = 'status-dot wait';
    label.textContent = 'On, waiting for your browser extension to connect…';
  }
}

async function loadBrowserControl() {
  try {
    renderBrowserControl(await window.buddy.browserControlStatus());
  } catch { /* panel may not be ready */ }
}

// While control is on but not yet connected, poll so the dot flips to green
// the moment the user loads the extension — no manual refresh needed.
function scheduleBrowserControlPoll() {
  if (bcStatusTimer) clearInterval(bcStatusTimer);
  bcStatusTimer = setInterval(async () => {
    const onJarvis = !document.getElementById('page-jarvis').hidden;
    const enabled = document.getElementById('browserControlEnabled').checked;
    if (!onJarvis || !enabled) return;
    try { renderBrowserControl(await window.buddy.browserControlStatus()); } catch { /* ignore */ }
  }, 3000);
}

document.getElementById('browserControlEnabled').addEventListener('change', async (e) => {
  try {
    const { status } = await window.buddy.browserControlSet({ control: e.target.checked });
    renderBrowserControl(status);
    flash('browserControlMsg', e.target.checked
      ? 'Browser control on. Connect your browser below.'
      : 'Browser control off.');
  } catch (err) {
    flash('browserControlMsg', `Error: ${err.message}`);
  }
});

document.getElementById('openExtFolder').addEventListener('click', async () => {
  try {
    const res = await window.buddy.openExtensionFolder();
    document.getElementById('extFolderMsg').textContent = res.ok
      ? 'Opened. Load it as an unpacked extension.'
      : `Couldn't open the folder: ${res.error || 'unknown'} (${res.dir})`;
  } catch (err) {
    document.getElementById('extFolderMsg').textContent = `Error: ${err.message}`;
  }
});

async function runBrowserTask() {
  const input = document.getElementById('bcTaskInput');
  const btn = document.getElementById('bcRunTask');
  const out = document.getElementById('bcTaskResult');
  const instruction = input.value.trim();
  if (!instruction) return;
  btn.disabled = true;
  out.hidden = false;
  out.textContent = 'Working on it…';
  try {
    const res = await window.buddy.browserTask(instruction);
    out.textContent = res?.text || 'Done.';
  } catch (err) {
    out.textContent = `Error: ${err.message}`;
  } finally {
    btn.disabled = false;
  }
}
document.getElementById('bcRunTask').addEventListener('click', runBrowserTask);
document.getElementById('bcTaskInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runBrowserTask();
});
scheduleBrowserControlPoll();

// ---------- Jarvis Mode: Browser Autofill (beta) ----------
const AUTOFILL_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'discord', 'ign', 'age', 'school', 'address'];
const autofillInputId = (key) => `af${key[0].toUpperCase()}${key.slice(1)}`;

async function loadAutofill() {
  const cfg = await window.buddy.getConfig();
  document.getElementById('autofillEnabled').checked = !!cfg.autofill?.enabled;
  const profile = cfg.autofill?.profile || {};
  AUTOFILL_FIELDS.forEach((key) => {
    const el = document.getElementById(autofillInputId(key));
    if (el) el.value = profile[key] || '';
  });
}

async function saveAutofill() {
  const profile = {};
  AUTOFILL_FIELDS.forEach((key) => {
    const el = document.getElementById(autofillInputId(key));
    if (el) profile[key] = el.value.trim();
  });
  const settings = { enabled: document.getElementById('autofillEnabled').checked, profile };
  try {
    await window.buddy.autofillSet(settings);
    flash('autofillMsg', settings.enabled ? 'Saved. Bridge is running.' : 'Saved. Bridge is off.');
  } catch (err) {
    flash('autofillMsg', `Error: ${err.message}`);
  }
}
document.getElementById('saveAutofill').addEventListener('click', saveAutofill);

document.getElementById('testAutofill').addEventListener('click', async () => {
  const result = await window.buddy.autofillTrigger();
  flash('autofillMsg', result?.text || 'Done.');
});

// ---------- Premium ----------
function renderPremium(s) {
  const signedOut = document.getElementById('premSignedOut');
  const signedIn = document.getElementById('premSignedIn');
  signedOut.hidden = !!s.signedIn;
  signedIn.hidden = !s.signedIn;
  if (!s.signedIn) return;
  document.getElementById('premEmail').textContent = s.email || '';
  const badge = document.getElementById('premBadge');
  badge.textContent = s.premium ? '✨ Premium' : 'Free';
  badge.className = `prem-badge ${s.premium ? 'premium' : 'free'}`;
  document.getElementById('premPlans').hidden = !!s.premium;
  document.getElementById('premHint').textContent = s.premium
    ? 'AI answers are on — ask Pesto anything in the widget (Alt+Space).'
    : s.error
      ? `Signed in, but I couldn't reach the Premium server: ${s.error}`
      : 'Pick a plan to start your 7-day free trial. Payment opens in your browser.';
}

async function loadPremium() {
  try {
    renderPremium(await window.buddy.premiumStatus());
  } catch {
    renderPremium({ signedIn: false });
  }
}

async function premAuth(kind) {
  const email = document.getElementById('premEmailIn').value.trim();
  const password = document.getElementById('premPassIn').value;
  const msg = document.getElementById('premMsg');
  if (!email || !password) { msg.textContent = 'Enter your email and a password.'; return; }
  msg.textContent = kind === 'signup' ? 'Creating your account…' : 'Signing in…';
  try {
    const s = kind === 'signup'
      ? await window.buddy.premiumSignUp(email, password)
      : await window.buddy.premiumSignIn(email, password);
    if (s.needsEmailConfirm) {
      msg.textContent = `Almost there — check ${s.email} for a confirmation link, then sign in.`;
      return;
    }
    msg.textContent = '';
    renderPremium(s);
  } catch (err) {
    msg.textContent = `Hmm: ${err.message || err}`;
  }
}

document.getElementById('premSignIn').addEventListener('click', () => premAuth('signin'));
document.getElementById('premSignUp').addEventListener('click', () => premAuth('signup'));
document.getElementById('premPassIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') premAuth('signin'); });
document.getElementById('premSignInGoogle').addEventListener('click', async () => {
  const msg = document.getElementById('premMsg');
  const btn = document.getElementById('premSignInGoogle');
  btn.disabled = true;
  msg.textContent = 'Opening Google sign-in in your browser…';
  try {
    renderPremium(await window.buddy.premiumSignInGoogle());
    msg.textContent = '';
  } catch (err) {
    msg.textContent = `Google sign-in failed: ${err.message || err}`;
  } finally {
    btn.disabled = false;
  }
});
document.getElementById('premSignOutBtn').addEventListener('click', async () => {
  renderPremium(await window.buddy.premiumSignOut());
});
document.getElementById('premRefresh').addEventListener('click', loadPremium);

async function startCheckout(plan) {
  const msg = document.getElementById('premMsg');
  msg.textContent = 'Opening checkout in your browser…';
  try {
    const r = await window.buddy.premiumUpgrade(plan);
    msg.textContent = r.alreadyPremium
      ? "You're already Premium! 🎉"
      : 'Finish in the browser, then hit “Refresh status”. No charge until your 7-day trial ends.';
    if (r.alreadyPremium) loadPremium();
  } catch (err) {
    msg.textContent = `Couldn't start checkout: ${err.message || err}`;
  }
}
document.getElementById('premUpgradeMonthly').addEventListener('click', () => startCheckout('monthly'));
document.getElementById('premUpgradeAnnual').addEventListener('click', () => startCheckout('annual'));

// ---------- helpers ----------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function flash(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 4000);
}

refreshSetup();
