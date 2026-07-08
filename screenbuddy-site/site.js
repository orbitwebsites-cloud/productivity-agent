'use strict';

const downloads = {
  win32: '/downloads/ScreenBuddy-0.1.0-beta-win-x64.exe',
  darwin: '/downloads/ScreenBuddy-0.1.0-beta-win-x64.exe'
};

const platform = navigator.userAgentData?.platform || navigator.platform || '';
const link = document.getElementById('downloadLink');
if (/mac/i.test(platform)) {
  link.textContent = 'Download for Mac';
  link.href = downloads.darwin;
} else {
  link.textContent = 'Download for Windows';
  link.href = downloads.win32;
}

if (location.hostname.startsWith('support.')) {
  location.replace('/support.html' + location.search);
}
