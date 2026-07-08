'use strict';

// Hermes Agent API server. It exposes an OpenAI-compatible endpoint when the
// user runs `hermes gateway` with API_SERVER_ENABLED=true.

async function chat({ baseUrl, apiKey, model, system, user, imageBase64, sessionKey }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });

  let content;
  if (imageBase64) {
    content = [
      { type: 'text', text: user || '' },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
    ];
  } else {
    content = user || '';
  }
  messages.push({ role: 'user', content });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };
  if (sessionKey) headers['X-Hermes-Session-Key'] = sessionKey;

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages, stream: false })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Hermes error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function health({ baseUrl, apiKey }) {
  const headers = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const root = baseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '');
  const res = await fetch(`${root}/health`, { headers });
  if (!res.ok) throw new Error(`Hermes health error ${res.status}`);
  return res.json();
}

module.exports = { chat, health };
