const path = require('path');
const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const https = require('https');
const { getStatus: getOllamaStatus, chat: ollamaChat } = require(path.join(__dirname, '..', 'core', 'ollama'));
const { planLocalCommand } = require(path.join(__dirname, '..', 'core', 'agent'));
const { runLocalCommand } = require(path.join(__dirname, '..', 'core', 'agent-runtime'));
const { validateToolRequest } = require(path.join(__dirname, '..', 'core', 'policy'));
const { executeTool } = require(path.join(__dirname, '..', 'core', 'tools'));
const computerInput = require(path.join(__dirname, '..', 'core', 'computer-input'));
const { createMemoryStore } = require(path.join(__dirname, '..', 'core', 'memory'));
const { createScreenCapture } = require(path.join(__dirname, '..', 'core', 'screen'));
const { createVisionAnalyzer } = require(path.join(__dirname, '..', 'core', 'vision'));
const { createVisionRuntime } = require(path.join(__dirname, '..', 'core', 'vision-runtime'));

let mainWindow, companionWindow, tray;
let companionState = { state: 'idle', text: 'KRITAM IS READY' };
const appRoot = path.join(__dirname, '..');
const dataRoot = path.join(appRoot, '.kritam-data');
app.setPath('userData', dataRoot);
app.setPath('sessionData', path.join(dataRoot, 'session'));
const memory = createMemoryStore(path.join(app.getPath('userData'), 'memory.json'));

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
function setCompanionState(state = 'idle', text) {
  const allowed = ['idle', 'listening', 'thinking', 'speaking', 'happy'];
  companionState = { state: allowed.includes(state) ? state : 'idle', text: text || undefined };
  if (companionWindow && !companionWindow.isDestroyed()) companionWindow.webContents.send('companion:state', companionState);
  return companionState;
}
function createMainWindow() {
  mainWindow = new BrowserWindow({ width: 1180, height: 760, minWidth: 850, minHeight: 600, show: false, backgroundColor: '#121214', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true } });
  mainWindow.loadFile(path.join(appRoot, 'index.html'));
  mainWindow.once('ready-to-show', () => { mainWindow.show(); mainWindow.focus(); });
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => console.error(`KRITAM failed to load UI: ${errorCode} ${errorDescription}`));
  mainWindow.on('close', (event) => { if (!app.isQuitting) { event.preventDefault(); mainWindow.hide(); } });
}
function createCompanionWindow() {
  companionWindow = new BrowserWindow({ width: 330, height: 460, minWidth: 330, maxWidth: 330, minHeight: 460, maxHeight: 460, show: false, frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, resizable: false, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true } });
  companionWindow.setAlwaysOnTop(true, 'floating'); companionWindow.loadFile(path.join(__dirname, 'companion.html'));
  companionWindow.on('close', (event) => { if (!app.isQuitting) { event.preventDefault(); companionWindow.hide(); } });
  companionWindow.once('ready-to-show', () => companionWindow.showInactive());
  companionWindow.webContents.on('did-finish-load', () => setCompanionState(companionState.state, companionState.text));
}
function showCompanion() { companionWindow?.showInactive(); setCompanionState(companionState.state, companionState.text); companionWindow?.webContents.send('daily-briefing-request'); }
function createTray() {
  const icon = nativeImage.createFromPath(path.join(appRoot, 'assets', 'kritam-avatar.png')).resize({ width: 32, height: 32 });
  tray = new Tray(icon); tray.setToolTip('KRITAM — ready when you are');
  tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Talk to KRITAM', click: () => { mainWindow.show(); mainWindow.focus(); } }, { label: 'Show companion', click: showCompanion }, { type: 'separator' }, { label: 'Quit KRITAM', click: () => { app.isQuitting = true; app.quit(); } }]));
  tray.on('click', showCompanion);
}
app.whenReady().then(() => { createMainWindow(); createCompanionWindow(); createTray(); });
app.on('window-all-closed', (event) => event.preventDefault());
app.on('activate', () => mainWindow?.show());
ipcMain.handle('news:get', fetchHeadlines);
ipcMain.handle('companion:show', showCompanion);
ipcMain.handle('companion:set-state', (_event, state, text) => setCompanionState(state, text));
ipcMain.handle('agent:plan', (_event, text) => planLocalCommand(text));
ipcMain.handle('agent:run-local', async (_event, text) => runLocalCommand(text));
ipcMain.handle('ollama:status', () => getOllamaStatus());
ipcMain.handle('ollama:chat', async (_event, messages, options) => { if (!Array.isArray(messages) || messages.length === 0) throw new Error('A conversation is required.'); return ollamaChat(messages, options || {}); });

const screenCapture = createScreenCapture((options) => mainWindow.capturePage(options), path.join(app.getPath('userData'), 'screenshots'));
const vision = createVisionRuntime({ capture: () => screenCapture.capture(), analyzeImage: (filePath, prompt) => createVisionAnalyzer().analyzeImage(filePath, prompt) });

ipcMain.handle('tool:execute', async (_event, request) => {
  const validated = validateToolRequest(request);
  let result;
  if (validated.tool === 'capture_screen') result = await screenCapture.capture();
  else if (validated.tool === 'analyze_screen') result = await vision.analyzeScreen(validated.arguments.prompt);
  else if (validated.tool === 'mouse_click') result = await computerInput.click(validated.arguments);
  else if (validated.tool === 'type_text') result = await computerInput.typeText(validated.arguments);
  else result = await executeTool(validated);
  console.log(`[KRITAM TOOL] ${validated.tool}`);
  return { ...result, tool: validated.tool };
});
ipcMain.handle('app:open-url', async (_event, url) => executeTool({ tool: 'open_url', arguments: { url } }));
ipcMain.handle('login:set-enabled', (_event, enabled) => { app.setLoginItemSettings({ openAtLogin: Boolean(enabled), path: process.execPath }); return app.getLoginItemSettings().openAtLogin; });
ipcMain.handle('memory:get-recent', (_event, conversationId = 'default', limit = 50) => memory.getRecentMessages(conversationId, limit));
ipcMain.handle('memory:add-message', (_event, payload) => memory.addMessage(payload));
ipcMain.handle('memory:get-preferences', () => memory.getPreferences());
ipcMain.handle('memory:set-preference', (_event, key, value) => memory.setPreference(key, value));
ipcMain.handle('memory:clear', () => memory.clearAll());
ipcMain.handle('screen:capture', async () => screenCapture.capture());
ipcMain.handle('screen:analyze', async (_event, prompt) => vision.analyzeScreen(prompt));
