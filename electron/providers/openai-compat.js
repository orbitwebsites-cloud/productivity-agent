'use strict';

// OpenAI-compatible provider. Works with OpenRouter, Cerebras, Groq, OpenAI,
// LM Studio, together.ai — anything exposing POST /chat/completions.

async function chat({ baseUrl, apiKey, model, system, user, imageBase64 }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });

  // Multimodal content array when an image is present, plain string otherwise.
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

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, stream: false })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Provider error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

module.exports = { chat };
