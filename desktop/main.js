const path = require('path');
// Electron was installed in the isolated runtime folder to avoid a locked root package.
// Put it first in this module's lookup path so `require('electron')` receives Electron's API.
module.paths.unshift(path.join(__dirname, '..', 'runtime', 'node_modules'));
const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, shell } = require('electron');
const https = require('https');

let mainWindow, companionWindow, tray;
const appRoot = path.join(__dirname, '..');
// Keep Chromium's cache inside KRITAM rather than a potentially restricted system cache.
const dataRoot = path.join(appRoot, '.kritam-data');
app.setPath('userData', dataRoot);
app.setPath('sessionData', path.join(dataRoot, 'session'));

function fetchHeadlines() {
  return new Promise((resolve) => {
    const request = https.get('https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en', { headers: { 'User-Agent': 'KRITAM/0.1' } }, (response) => {
      let body = ''; response.on('data', (chunk) => body += chunk);
      response.on('end', () => {
        const titles = [...body.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/g)].slice(0, 4).map((item) => item[1]);
        resolve(titles.length ? titles : ['I could not retrieve live headlines right now.']);
      });
    });
    request.setTimeout(7000, () => request.destroy());
    request.on('error', () => resolve(['You appear to be offline. I can still help with local tasks.']));
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({ width: 1180, height: 760, minWidth: 850, minHeight: 600, show: false, backgroundColor: '#121214', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true } });
  mainWindow.loadFile(path.join(appRoot, 'index.html'));
  mainWindow.on('close', (event) => { if (!app.isQuitting) { event.preventDefault(); mainWindow.hide(); } });
}
function createCompanionWindow() {
  companionWindow = new BrowserWindow({ width: 330, height: 460, minWidth: 330, maxWidth: 330, minHeight: 460, maxHeight: 460, show: false, frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, resizable: false, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true } });
  companionWindow.setAlwaysOnTop(true, 'floating'); companionWindow.loadFile(path.join(__dirname, 'companion.html'));
  companionWindow.on('close', (event) => { if (!app.isQuitting) { event.preventDefault(); companionWindow.hide(); } });
  companionWindow.once('ready-to-show', () => companionWindow.showInactive());
}
function showCompanion() { companionWindow?.showInactive(); companionWindow?.webContents.send('daily-briefing-request'); }
function createTray() {
  const icon = nativeImage.createFromPath(path.join(appRoot, 'assets', 'kritam-avatar.png')).resize({ width: 32, height: 32 });
  tray = new Tray(icon); tray.setToolTip('KRITAM — ready when you are');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Talk to KRITAM', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { label: 'Show companion', click: showCompanion },
    { type: 'separator' }, { label: 'Quit KRITAM', click: () => { app.isQuitting = true; app.quit(); } }
  ])); tray.on('click', showCompanion);
}
app.whenReady().then(() => { createMainWindow(); createCompanionWindow(); createTray(); });
app.on('window-all-closed', (event) => event.preventDefault());
app.on('activate', () => mainWindow?.show());
ipcMain.handle('news:get', fetchHeadlines);
ipcMain.handle('companion:show', showCompanion);
ipcMain.handle('app:open-url', async (_event, url) => { const approved = /^https:\/\/(www\.)?(youtube\.com|google\.com|github\.com)/.test(url); if (!approved) throw new Error('This website is not on the approved list.'); await shell.openExternal(url); });
ipcMain.handle('login:set-enabled', (_event, enabled) => { app.setLoginItemSettings({ openAtLogin: Boolean(enabled), path: process.execPath }); return app.getLoginItemSettings().openAtLogin; });
