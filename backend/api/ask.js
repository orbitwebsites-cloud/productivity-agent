'use strict';

// POST /api/ask — the Premium AI answer endpoint.
// Auth: Supabase access token (Bearer). Requires an active subscription.
// Body: { question: string, summary: string }  (summary = tiny local activity digest,
// built on the user's machine — never screenshots, never raw logs).

const { env, send, readJson, bearerToken, getUser, getSubscription, isPremium } = require('../lib/util');

const SYSTEM_PROMPT = `You are Pesto, a warm, upbeat little desktop buddy who helps people
understand how they spend their time and gently keeps them accountable.
You are given a compact summary of the user's tracked activity and their question.
Answer conversationally in 2-6 short sentences. Be specific — cite apps, window titles
and durations from the data. If the data doesn't cover the question, say so honestly.
Never invent activity that isn't in the data. Match the user's energy; light emoji are fine.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });

  let user;
  try {
    user = await getUser(bearerToken(req));
  } catch (e) {
    return send(res, 500, { error: 'auth check failed' });
  }
  if (!user) return send(res, 401, { error: 'Sign in to use AI answers.' });

  const sub = await getSubscription(user.id).catch(() => null);
  if (!isPremium(sub)) {
    return send(res, 402, { error: 'Premium subscription required.', code: 'premium_required' });
  }

  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { error: 'invalid JSON' }); }
  const question = String(body.question || '').slice(0, 2000);
  const summary = String(body.summary || '').slice(0, 12000);
  if (!question) return send(res, 400, { error: 'question is required' });

  // Any OpenAI-compatible /chat/completions endpoint — defaults to Cerebras's free tier
  // (1M tokens/day, the best free daily cap available; free tier caps context at 8K tokens,
  // which is why summary/question are kept short above). Swap providers (Groq, Gemini,
  // OpenRouter, Together, ...) by changing env vars only.
  const baseUrl = env('LLM_BASE_URL', 'https://api.cerebras.ai/v1').replace(/\/$/, '');
  const r = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('LLM_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env('LLM_MODEL', 'llama-3.3-70b'),
      max_tokens: 600,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Activity data:\n${summary || '(no activity data provided)'}\n\nUser question: ${question}`
        }
      ]
    })
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    console.error('llm error', r.status, detail.slice(0, 500));
    return send(res, 502, { error: 'AI is unavailable right now — try again in a minute.' });
  }
  const data = await r.json();
  const answer = String((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
  return send(res, 200, { answer });
};
