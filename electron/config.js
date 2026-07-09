'use strict';

const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// Settings live in the OS-standard userData dir so they survive app updates.
const CONFIG_PATH = path.join(app.getPath('userData'), 'screenbuddy-config.json');

const DEFAULTS = {
  // How often (ms) we sample the active window. Each sample is credited this much time.
  trackIntervalMs: 5000,

  // Master switch — tracking can be paused without quitting.
  trackingEnabled: true,

  setup: {
    status: 'pending',
    lastError: '',
    completedAt: null,
    supportUrl: 'https://support.orbitboyzz.me/'
  },

  // The user's "Life Pursuits" — what THEY define as their work/goals.
  // A window counts toward a pursuit if its app or title matches any keyword.
  // (Keywords are matched case-insensitively as substrings.)
  pursuits: [
    { name: 'Tech Job', emoji: '💻', keywords: ['code', 'visual studio', 'github', 'terminal', 'iterm', 'localhost', 'stack overflow', 'docs'] },
    { name: 'Learn to Cook', emoji: '🍳', keywords: ['recipe', 'cooking', 'allrecipes', 'serious eats', 'knife skills'] },
    { name: 'Fitness', emoji: '🏋️', keywords: ['workout', 'strava', 'fitness', 'meal plan'] }
  ],

  // Titles/apps that are treated as distractions (never productive, no pursuit).
  distractions: ['youtube', 'netflix', 'tiktok', 'instagram', 'twitter', 'x.com', 'reddit', 'twitch', 'discord'],

  // Per-app privacy tier. 'full' = titles + (later) screenshots, 'private' = metadata only,
  // 'off' = ignored entirely. Unknown apps default to 'private' (privacy-by-default).
  // For v1 (metadata-only) 'full' and 'private' behave the same; the tier gates future screenshots.
  privacyTiers: {},
  defaultTier: 'private',

  // Accountability intensity. words-only for v1: chill | nudge | drill. (warden = later)
  mode: 'nudge',

  accountability: {
    distractionLimitMin: 15,
    focusDriftLimitMin: 15,
    cooldownMin: 5,
    wardenSeconds: 10
  },

  jarvis: {
    activePursuit: '',
    activeUntil: null,
    restoreWindowLimit: 3
  },

  // Opt-in remote control over WhatsApp (see electron/jarvis-whatsapp.js). Off by
  // default — uses an unofficial WhatsApp Web client, which is a real account-ban risk
  // the user has to knowingly accept in Settings before pairing.
  jarvisWhatsapp: {
    enabled: false,
    projectDir: ''
  },

  // Opt-in local bridge (127.0.0.1:8643, see electron/autofill-bridge.js) that lets
  // the ScreenBuddy Jarvis browser extension (extension/) fill web forms from this
  // saved profile. Off by default. The extension only ever fills + highlights fields
  // for review — it never submits a form on its own.
  autofill: {
    enabled: false,
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      discord: '',
      ign: '',
      age: '',
      school: '',
      address: ''
    }
  },

  // Premium - hosted AI. Sign in (Supabase) + subscription (Stripe) unlock
  // natural-language answers from our backend. Only tiny text summaries are
  // ever sent; the anon key below is publishable by design.
  premium: {
    backendUrl: 'https://screenbuddy-backend.vercel.app',
    supabaseUrl: 'https://bmqhokhibnjdiwvycfxw.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcWhva2hpYm5qZGl3dnljZnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NDM2ODksImV4cCI6MjA5OTExOTY4OX0.J7JQM2YyQIk5O9e6H2a4MPUUSwFgR9u8L7ELdo06kUs',
    session: null
  },

  // Which AI layer phrases chat answers. Hermes is installed during first-run
  // setup. Deterministic local summaries are always the fallback, so the widget
  // still answers basic activity questions when the helper is offline.
  provider: 'hermes',
  hermes: {
    baseUrl: 'http://127.0.0.1:8642/v1',
    apiKey: 'change-me-local-dev',
    model: 'hermes-agent',
    sessionKey: 'screenbuddy-pesto'
  },
  ollama: {
    baseUrl: 'http://127.0.0.1:11434',
    model: 'llama3.2'
  },
  openaiCompat: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini'
  }
};

function deepMerge(base, override) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const key of Object.keys(override || {})) {
    const bv = base ? base[key] : undefined;
    const ov = override[key];
    if (ov && typeof ov === 'object' && !Array.isArray(ov) && bv && typeof bv === 'object') {
      out[key] = deepMerge(bv, ov);
    } else {
      out[key] = ov;
    }
  }
  return out;
}

function loadConfig() {
  try {
    return deepMerge(DEFAULTS, JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')));
  } catch {
    return { ...DEFAULTS };
  }
}

function saveConfig(patch) {
  const next = deepMerge(loadConfig(), patch);
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

module.exports = { loadConfig, saveConfig, DEFAULTS, CONFIG_PATH };
