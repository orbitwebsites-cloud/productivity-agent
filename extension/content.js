'use strict';

// ScreenBuddy Jarvis Autofill — content script.
// Fills matched fields from the user's saved profile and highlights them for
// review. Never calls form.submit() or clicks a submit/next button — the human
// always does that last step themselves. This boundary is deliberate, not a
// missing feature: see electron/jarvis-whatsapp.js's header comment.

const FIELD_PATTERNS = {
  firstName: /\b(first\s*name|given\s*name|fname)\b/i,
  lastName: /\b(last\s*name|surname|family\s*name|lname)\b/i,
  fullName: /\b(full\s*name|your\s*name|^name$)\b/i,
  email: /\b(e-?mail)\b/i,
  phone: /\b(phone|mobile|cell)\b/i,
  discord: /\bdiscord\b/i,
  ign: /\b(in[- ]?game\s*name|ign|minecraft\s*(name|username)|username)\b/i,
  age: /\bage\b/i,
  school: /\b(school|university|college)\b/i,
  address: /\b(address|street)\b/i,
  city: /\bcity\b/i,
  zip: /\b(zip|postal)\b/i
};

function labelTextFor(field) {
  const parts = [];
  if (field.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    if (lbl) parts.push(lbl.textContent || '');
  }
  const parentLabel = field.closest('label');
  if (parentLabel) parts.push(parentLabel.textContent || '');
  parts.push(field.getAttribute('placeholder') || '');
  parts.push(field.getAttribute('aria-label') || '');
  parts.push(field.name || '');
  parts.push(field.id || '');
  parts.push(field.getAttribute('autocomplete') || '');
  return parts.join(' ');
}

function matchKey(field) {
  const hay = labelTextFor(field);
  for (const [key, re] of Object.entries(FIELD_PATTERNS)) {
    if (re.test(hay)) return key;
  }
  return null;
}

function profileValue(profile, key) {
  if (profile[key]) return profile[key];
  if (key === 'firstName' && profile.name) return String(profile.name).split(' ')[0];
  if (key === 'lastName' && profile.name) return String(profile.name).split(' ').slice(1).join(' ');
  if (key === 'fullName' && profile.name) return profile.name;
  return '';
}

// React/Vue-controlled inputs ignore a plain `.value =` assignment because it
// bypasses their tracked setter — go through the native prototype setter so the
// framework's change listener actually fires.
function setNativeValue(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function showBanner(count) {
  if (document.getElementById('__screenbuddy_autofill_banner')) return;
  const banner = document.createElement('div');
  banner.id = '__screenbuddy_autofill_banner';
  banner.textContent = count
    ? `Pesto filled ${count} field${count > 1 ? 's' : ''} from your saved profile — review before you submit.`
    : "Pesto didn't recognize any fields on this page to fill.";
  Object.assign(banner.style, {
    position: 'fixed', top: '0', left: '0', right: '0', zIndex: '2147483647',
    background: '#fff4e0', color: '#5b3a00', font: '13px/1.4 system-ui, sans-serif',
    padding: '8px 14px', textAlign: 'center', borderBottom: '2px solid #f0b429',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
  });
  document.documentElement.appendChild(banner);
  setTimeout(() => banner.remove(), 12000);
}

function fillForm(profile) {
  const fields = document.querySelectorAll('input, textarea');
  let count = 0;
  fields.forEach((field) => {
    const type = (field.getAttribute('type') || 'text').toLowerCase();
    if (['password', 'hidden', 'submit', 'button', 'checkbox', 'radio', 'file'].includes(type)) return;
    const key = matchKey(field);
    if (!key) return;
    const value = profileValue(profile || {}, key);
    if (!value) return;
    setNativeValue(field, value);
    field.style.outline = '2px solid #f0b429';
    field.style.outlineOffset = '1px';
    count += 1;
  });
  showBanner(count);
  return count;
}

const api = typeof browser !== 'undefined' ? browser : chrome;

api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'autofill') {
    const count = fillForm(msg.profile || {});
    sendResponse({ ok: true, count });
  }
  return true;
});
