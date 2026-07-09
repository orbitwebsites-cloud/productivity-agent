'use strict';

const api = typeof browser !== 'undefined' ? browser : chrome;

document.getElementById('fillBtn').addEventListener('click', async () => {
  const btn = document.getElementById('fillBtn');
  const status = document.getElementById('status');
  btn.disabled = true;
  status.textContent = 'Fetching your profile…';
  try {
    const res = await fetch('http://127.0.0.1:8643/profile');
    if (!res.ok) throw new Error(`bridge returned ${res.status}`);
    const profile = await res.json();
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    const reply = await api.tabs.sendMessage(tab.id, { type: 'autofill', profile });
    status.textContent = reply && reply.count
      ? `Filled ${reply.count} field(s). Review before submitting.`
      : "Didn't find any fields to fill on this page.";
  } catch {
    status.textContent = 'Could not reach ScreenBuddy — make sure the app is running with the browser bridge enabled in Settings.';
  } finally {
    btn.disabled = false;
  }
});
