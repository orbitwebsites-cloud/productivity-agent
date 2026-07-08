'use strict';

// Built-in app knowledge base. So users (especially devs with a ton of apps) never
// have to hand-tag anything — Pesto recognizes common apps out of the box and sorts
// time into sensible categories automatically. User pursuits still override this.
//
// Order matters: entertainment/gaming/music are checked BEFORE browsers, so
// "MrBeast - Google Chrome" is Entertainment, not generic Browsing.

const CATEGORIES = [
  { category: 'Entertainment', emoji: '🎬', productive: false, distraction: true, patterns: [
    'youtube', 'netflix', 'hulu', 'disney', ' hbo', 'hbo max', 'primevideo', 'prime video', 'twitch',
    'tiktok', 'instagram', 'facebook', 'reddit', '9gag', 'imgur', 'pinterest', 'snapchat',
    'vimeo', 'crunchyroll', 'dailymotion'
  ] },
  { category: 'Gaming', emoji: '🎮', productive: false, distraction: true, patterns: [
    'steam', 'epic games', 'epicgames', 'riot', 'league of legends', 'valorant', 'minecraft',
    'roblox', 'battle.net', 'battlenet', 'ea app', 'gog galaxy', 'ubisoft connect', 'xbox',
    'playstation'
  ] },
  { category: 'Music', emoji: '🎵', productive: false, distraction: false, patterns: [
    'spotify', 'apple music', 'itunes', 'soundcloud', 'tidal', 'deezer', 'youtube music'
  ] },
  { category: 'Development', emoji: '💻', productive: true, patterns: [
    'visual studio code', 'vscode', 'cursor', 'sublime text', 'atom', 'webstorm', 'pycharm',
    'intellij', 'phpstorm', 'clion', 'goland', 'rider', 'datagrip', 'rubymine', 'android studio',
    'xcode', 'eclipse', 'netbeans', 'neovim', 'nvim', 'emacs', 'windows terminal', 'powershell',
    'iterm', 'cmder', 'conemu', 'warp', 'ghostty', 'alacritty', 'kitty', 'tabby',
    'github desktop', 'gitkraken', 'sourcetree', 'tower', 'git ', 'docker', 'postman', 'insomnia',
    'tableplus', 'dbeaver', 'pgadmin', 'mongodb compass', 'jupyter', 'anaconda', 'ngrok',
    'stack overflow', 'localhost', 'visual studio', 'code.exe'
  ] },
  { category: 'Design', emoji: '🎨', productive: true, patterns: [
    'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'indesign', 'after effects',
    'premiere pro', 'lightroom', 'canva', 'blender', 'framer', 'zeplin', 'affinity', 'procreate',
    'davinci resolve'
  ] },
  { category: 'Communication', emoji: '💬', productive: true, patterns: [
    'slack', 'discord', 'microsoft teams', ' teams', 'zoom', 'google meet', 'webex', 'skype',
    'telegram', 'whatsapp', 'signal', 'outlook', 'thunderbird', 'mailspring', 'spark', 'gmail'
  ] },
  { category: 'Docs & Notes', emoji: '📝', productive: true, patterns: [
    'notion', 'obsidian', 'microsoft word', 'winword', 'excel', 'powerpoint', 'onenote',
    'confluence', 'coda', 'craft', 'logseq', 'roam', 'evernote', 'acrobat', 'google docs',
    'google sheets', 'google slides'
  ] },
  { category: 'Project & Work', emoji: '📋', productive: true, patterns: [
    'jira', 'linear', 'asana', 'trello', 'monday.com', 'clickup', 'shortcut', 'basecamp', 'airtable'
  ] },
  { category: 'AI Tools', emoji: '🤖', productive: true, patterns: [
    'chatgpt', 'claude', 'copilot', 'perplexity', 'ollama', 'lm studio', 'gemini'
  ] },
  { category: 'Browsing', emoji: '🌐', productive: false, patterns: [
    'google chrome', 'chrome', 'firefox', 'microsoft edge', 'msedge', ' edge', 'safari', ' arc',
    'brave', 'opera', 'vivaldi', 'chromium'
  ] }
];

// Returns { category, productive } or null. `hay` should be lowercase (app + title).
function classifyByKnowledge(hay) {
  const h = ` ${hay || ''} `;
  for (const c of CATEGORIES) {
    for (const p of c.patterns) {
      if (h.includes(p)) {
        return { category: c.category, productive: c.productive, distraction: !!c.distraction, emoji: c.emoji, pattern: p.trim() };
      }
    }
  }
  return null;
}

function categoryForApp(appName) {
  return classifyByKnowledge(String(appName || '').toLowerCase());
}

module.exports = { CATEGORIES, classifyByKnowledge, categoryForApp };
