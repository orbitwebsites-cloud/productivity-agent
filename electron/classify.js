'use strict';

const { classifyByKnowledge } = require('./appknowledge');

// Classify an activity sample using: (1) the user's own Life Pursuits (their ground
// truth), (2) any user-added distractions, (3) a built-in knowledge base of ~150
// common apps so nothing has to be tagged by hand, (4) Other.

function classify(appName, title, config) {
  const hay = `${appName || ''} ${title || ''}`.toLowerCase();

  // 1) The user's declared pursuits win — a Minecraft streamer's "Minecraft" beats
  //    the built-in "Minecraft = gaming".
  for (const p of config.pursuits || []) {
    for (const kw of p.keywords || []) {
      if (kw && hay.includes(kw.toLowerCase())) {
        return { category: p.name, productive: true, pursuit: p.name };
      }
    }
  }

  // 2) User-added distractions.
  for (const d of config.distractions || []) {
    if (d && hay.includes(d.toLowerCase())) {
      return { category: 'Distraction', productive: false, pursuit: null };
    }
  }

  // 3) Built-in knowledge base — auto-categorize common apps (Development,
  //    Communication, Design, Browsing, Entertainment, …) with no user setup.
  const kb = classifyByKnowledge(hay);
  if (kb) return { category: kb.category, productive: kb.productive, pursuit: null };

  // 4) Genuinely unknown.
  return { category: 'Other', productive: false, pursuit: null };
}

module.exports = { classify };
