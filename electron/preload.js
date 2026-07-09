'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Bridge for BOTH windows (orb + panel). Each window loads this preload;
// exposing all methods to both is harmless.
contextBridge.exposeInMainWorld('buddy', {
  // ---- orb (the little clickable icon) ----
  orbToggle: () => ipcRenderer.invoke('orb:toggle'),
  dragStart: (x, y) => ipcRenderer.send('orb:dragStart', { x, y }),
  dragMove: (x, y) => ipcRenderer.send('orb:dragMove', { x, y }),

  // ---- panel (the glance-card chat) ----
  ask: (question) => ipcRenderer.invoke('buddy:ask', question),
  today: () => ipcRenderer.invoke('buddy:today'),
  getConfig: () => ipcRenderer.invoke('buddy:getConfig'),
  status: () => ipcRenderer.invoke('buddy:status'),
  savePursuits: (pursuits) => ipcRenderer.invoke('buddy:savePursuits', pursuits),
  saveTiers: (tiers) => ipcRenderer.invoke('buddy:saveTiers', tiers),
  saveAgentSettings: (settings) => ipcRenderer.invoke('buddy:saveAgentSettings', settings),
  testAgent: (settings) => ipcRenderer.invoke('buddy:testAgent', settings),
  installSetup: () => ipcRenderer.invoke('buddy:installSetup'),
  declineSetup: () => ipcRenderer.invoke('buddy:declineSetup'),
  openSetupHelp: (errorText) => ipcRenderer.invoke('buddy:openSetupHelp', errorText),
  recentApps: () => ipcRenderer.invoke('buddy:recentApps'),
  scanApps: () => ipcRenderer.invoke('buddy:scanApps'),
  openApp: () => ipcRenderer.invoke('buddy:openApp'),
  openSite: () => ipcRenderer.invoke('buddy:openSite'),
  setMode: (mode) => ipcRenderer.invoke('buddy:setMode', mode),
  saveAccountability: (settings) => ipcRenderer.invoke('buddy:saveAccountability', settings),
  saveJarvis: (settings) => ipcRenderer.invoke('buddy:saveJarvis', settings),
  runAction: (actionId) => ipcRenderer.invoke('buddy:runAction', actionId),
  jarvisWhatsappStatus: () => ipcRenderer.invoke('buddy:jarvisWhatsappStatus'),
  jarvisWhatsappSet: (settings) => ipcRenderer.invoke('buddy:jarvisWhatsappSet', settings),
  onJarvisWhatsappEvent: (cb) => {
    const handler = (_e, evt) => cb(evt);
    ipcRenderer.on('jarvis:whatsappEvent', handler);
    return () => ipcRenderer.removeListener('jarvis:whatsappEvent', handler);
  },
  onPrefillPrompt: (cb) => {
    const handler = (_e, text) => cb(text);
    ipcRenderer.on('buddy:prefillPrompt', handler);
    return () => ipcRenderer.removeListener('buddy:prefillPrompt', handler);
  },
  autofillStatus: () => ipcRenderer.invoke('buddy:autofillStatus'),
  autofillSet: (settings) => ipcRenderer.invoke('buddy:autofillSet', settings),
  autofillTrigger: () => ipcRenderer.invoke('buddy:autofillTrigger'),
  wardenHide: () => ipcRenderer.invoke('warden:hide'),
  wardenCancel: () => ipcRenderer.invoke('warden:cancel'),
  premiumStatus: () => ipcRenderer.invoke('premium:status'),
  premiumSignIn: (email, password) => ipcRenderer.invoke('premium:signIn', { email, password }),
  premiumSignUp: (email, password) => ipcRenderer.invoke('premium:signUp', { email, password }),
  premiumSignOut: () => ipcRenderer.invoke('premium:signOut'),
  premiumUpgrade: () => ipcRenderer.invoke('premium:upgrade'),
  hidePanel: () => ipcRenderer.invoke('panel:hide'),
  quit: () => ipcRenderer.invoke('buddy:quit')
});
