'use strict';

const providers = require('./providers');

// General browser-task agent: "go to X and do Y" over WhatsApp/desktop. Drives the
// active tab through a short snapshot -> decide -> act loop via the bridge
// (autofill-bridge.js) and the extension (extension/{background,content}.js).
//
// Safety boundary (non-negotiable, enforced in extension/content.js's agentAct, not
// just here — defense in depth): it will never click a submit/buy/pay/subscribe/
// delete/confirm-order action. The content script blocks those regardless of what
// the model decides; this loop just reports the block back to the user instead of
// working around it. Local engine only — see providers.rawChat's comment for why
// the premium backend doesn't support this.

const MAX_STEPS = 6;

const SYSTEM_PROMPT = `You are Pesto's browser-task agent. You're given the user's instruction,
the current page's URL/title, and a numbered list of visible interactive elements on the page.
Decide the ONE next action to make progress. Respond with ONLY a compact JSON object, no markdown,
no prose, in exactly one of these shapes:
{"action":"click","index":<number>,"why":"<short reason>"}
{"action":"type","index":<number>,"text":"<text to type>","why":"<short reason>"}
{"action":"navigate","url":"<absolute url>","why":"<short reason>"}
{"action":"done","summary":"<what you found/did, for the user>"}
Rules:
- Pick "done" as soon as the instruction is satisfied or you're just reporting back information.
- Never pick an element whose text is about submitting, paying, buying, subscribing, confirming
  an order, or deleting something — you are not allowed to complete those, so don't try; if that's
  the only way forward, say so in "done" and tell the user to do that step themselves.
- If you're not sure an element matches, prefer "done" with an honest summary over guessing.`;

function buildUserPrompt(instruction, page, history) {
  const elementsText = (page.elements || [])
    .map((e) => `[${e.index}] <${e.tag}${e.type ? ` type=${e.type}` : ''}> "${e.text}"${e.href ? ` href=${e.href}` : ''}`)
    .join('\n');
  const historyText = history.length
    ? `\n\nSteps taken so far:\n${history.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
    : '';
  return `Instruction: ${instruction}\n\nCurrent page: ${page.title} (${page.url})\n\nVisible elements:\n${elementsText || '(none found)'}${historyText}`;
}

function parseDecision(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw && raw.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch { /* fall through */ } }
  }
  return null;
}

// deps: { config, snapshot: () => Promise<page>, act: (action) => Promise<result> }
async function runTask(instruction, { config, snapshot, act }) {
  const history = [];
  for (let step = 0; step < MAX_STEPS; step++) {
    let page;
    try {
      page = await snapshot();
    } catch (err) {
      return `Couldn't read the page: ${err.message}`;
    }
    if (page.error) return `Couldn't read the page: ${page.error}`;

    let raw;
    try {
      raw = await providers.rawChat(config, {
        system: SYSTEM_PROMPT,
        user: buildUserPrompt(instruction, page, history)
      });
    } catch (err) {
      return `Couldn't reach the AI engine: ${err.message}`;
    }

    const decision = parseDecision(raw);
    if (!decision || !decision.action) {
      return `Got a response I couldn't parse, stopping here. Raw: ${String(raw).slice(0, 200)}`;
    }
    if (decision.action === 'done') return decision.summary || 'Done.';

    // The AI-facing schema uses "action" as the verb field (matches the prompt's
    // JSON shapes above); the extension's executor (extension/content.js's
    // agentAct) uses "type" — translate here so each side can evolve independently.
    let result;
    try {
      result = await act({ type: decision.action, index: decision.index, text: decision.text, url: decision.url });
    } catch (err) {
      return `Stopped: ${err.message}`;
    }

    if (result && result.blocked) {
      return result.error || "Stopped — that step needs you to do it yourself (payment/submit/delete-type action).";
    }
    if (!result || result.ok === false) {
      history.push(`${decision.action} on [${decision.index}] failed: ${(result && result.error) || 'unknown error'}`);
      continue;
    }
    history.push(`${decision.action}${decision.index !== undefined ? ` [${decision.index}]` : ''}${decision.why ? ` — ${decision.why}` : ''}`);
  }
  return `Stopped after ${MAX_STEPS} steps without finishing. Here's what I tried:\n${history.join('\n')}`;
}

module.exports = { runTask };
