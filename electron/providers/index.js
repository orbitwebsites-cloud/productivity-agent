'use strict';

const ollama = require('./ollama');
const openaiCompat = require('./openai-compat');
const hermes = require('./hermes');
const { classifySystemPrompt, CHAT_SYSTEM_PROMPT } = require('./prompts');

// Route a chat call to whichever provider the user selected in config.
async function callProvider(config, { system, user, imageBase64 }) {
  if (config.provider === 'hermes') {
    const c = config.hermes;
    if (!c.apiKey) throw new Error('No Hermes API key set. Open Settings.');
    return hermes.chat({
      baseUrl: c.baseUrl,
      apiKey: c.apiKey,
      model: c.model,
      sessionKey: c.sessionKey,
      system,
      user,
      imageBase64
    });
  }
  if (config.provider === 'openai-compat') {
    const c = config.openaiCompat;
    if (!c.apiKey) throw new Error('No API key set for the cloud provider. Open Settings.');
    return openaiCompat.chat({
      baseUrl: c.baseUrl, apiKey: c.apiKey, model: c.model, system, user, imageBase64
    });
  }
  // default: local ollama
  const c = config.ollama;
  return ollama.chat({ baseUrl: c.baseUrl, model: c.model, system, user, imageBase64 });
}

// Classify one screenshot into structured activity. Tolerant JSON parsing since
// small local models sometimes wrap output in prose or code fences.
async function classifyScreenshot(config, imageBase64) {
  const system = classifySystemPrompt(config.productiveCategories);
  const raw = await callProvider(config, {
    system,
    user: 'Classify this screenshot. Respond with only the JSON object.',
    imageBase64
  });
  return parseClassification(raw, config.productiveCategories);
}

function parseClassification(raw, productiveCategories) {
  let obj = null;
  try {
    obj = JSON.parse(raw);
  } catch {
    const match = raw && raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { obj = JSON.parse(match[0]); } catch { /* fall through */ }
    }
  }
  if (!obj || typeof obj !== 'object') {
    return { category: 'Other', productive: false, app_guess: '', description: 'Unclassified frame.' };
  }
  const category = String(obj.category || 'Other').slice(0, 40);
  // Trust the model's productive flag, but re-derive from category as a fallback.
  const productive = typeof obj.productive === 'boolean'
    ? obj.productive
    : productiveCategories.map((s) => s.toLowerCase()).includes(category.toLowerCase());
  return {
    category,
    productive: !!productive,
    app_guess: String(obj.app_guess || '').slice(0, 60),
    description: String(obj.description || '').slice(0, 240)
  };
}

// Answer a natural-language question given a compact activity summary.
async function answerQuestion(config, question, summaryText) {
  if (config.provider === 'backend') {
    // Hosted Premium — requires sign-in + active subscription; the backend
    // holds the LLM key. Throws when signed out, which answers.js catches
    // and falls back to the deterministic local answer.
    return require('../premium').ask(question, summaryText);
  }
  const user = `Activity data:\n${summaryText}\n\nUser question: ${question}`;
  return callProvider(config, { system: CHAT_SYSTEM_PROMPT, user });
}

async function testProvider(config) {
  if (config.provider === 'backend') {
    const s = await require('../premium').status();
    if (!s.signedIn) throw new Error('Not signed in.');
    return { ok: true, provider: 'backend', premium: !!s.premium };
  }
  if (config.provider === 'hermes') {
    const c = config.hermes;
    await hermes.health({ baseUrl: c.baseUrl, apiKey: c.apiKey });
    return { ok: true, provider: 'hermes' };
  }

  const text = await callProvider(config, {
    system: 'Reply with only: ok',
    user: 'health check'
  });
  return { ok: true, provider: config.provider || 'ollama', text };
}

module.exports = { callProvider, classifyScreenshot, answerQuestion, parseClassification, testProvider };
