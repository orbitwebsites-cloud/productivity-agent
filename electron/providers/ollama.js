'use strict';

// Fully-local provider. Talks to an Ollama server running on the user's machine.
// Vision models: llama3.2-vision, llava, qwen2.5vl, etc.

async function chat({ baseUrl, model, system, user, imageBase64 }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });

  const userMsg = { role: 'user', content: user || '' };
  // Ollama takes images as an array of raw base64 strings (no data: prefix).
  if (imageBase64) userMsg.images = [imageBase64];
  messages.push(userMsg);

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data?.message?.content ?? '';
}

module.exports = { chat };
