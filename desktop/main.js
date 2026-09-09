const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, desktopCapturer, screen } = require('electron');
const https = require('https');
const { getStatus: getOllamaStatus, chat: ollamaChat } = require(path.join(__dirname, '..', 'core', 'ollama'));
const { planLocalCommand } = require(path.join(__dirname, '..', 'core', 'agent'));
const { planTask } = require(path.join(__dirname, '..', 'core', 'task-planner'));
const { planConversationalMessage } = require(path.join(__dirname, '..', 'core', 'conversation-agent'));
const { runLocalCommand } = require(path.join(__dirname, '..', 'core', 'agent-runtime'));
const { validateToolRequest } = require(path.join(__dirname, '..', 'core', 'policy'));
const { executeTool } = require(path.join(__dirname, '..', 'core', 'tools'));
const computerInput = require(path.join(__dirname, '..', 'core', 'computer-input'));
const keyboard = require(path.join(__dirname, '..', 'core', 'keyboard'));
const { createMemoryStore } = require(path.join(__dirname, '..', 'core', 'memory'));
const { createAuditLog } = require(path.join(__dirname, '..', 'core', 'audit-log'));
const { createTaskHistory } = require(path.join(__dirname, '..', 'core', 'task-history'));
const { createScreenCapture } = require(path.join(__dirname, '..', 'core', 'screen'));
const { createVisionAnalyzer } = require(path.join(__dirname, '..', 'core', 'vision'));
const { createVisionRuntime } = require(path.join(__dirname, '..', 'core', 'vision-runtime'));
const { buildTargetPrompt, parseVisionTargets, selectTarget } = require(path.join(__dirname, '..', 'core', 'screen-targets'));
const { buildVerificationPrompt, normalizeVerification } = require(path.join(__dirname, '..', 'core', 'semantic-verification'));
const { createActionRecord, verifyResult, applyScreenVerification } = require(path.join(__dirname, '..', 'core', 'action-verifier'));

let mainWindow, companionWindow, tray;
let companionState = { state: 'idle', text: 'KRITAM IS READY' };
let conversationState = null;
const appRoot = path.join(__dirname, '..');
const dataRoot = path.join(appRoot, '.kritam-data');
app.setPath('userData', dataRoot);
app.setPath('sessionData', path.join(dataRoot, 'session'));
const memory = createMemoryStore(path.join(app.getPath('userData'), 'memory.json'));
const audit = createAuditLog(path.join(app.getPath('userData'), 'audit.jsonl'));
const taskHistory = createTaskHistory(path.join(app.getPath('userData'), 'task-history.json'));

audit.record('app.started', { version: app.getVersion(), platform: process.platform });

function fetchHeadlines() {
  return new Promise((resolve) => {
    const request = https.get('https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en', { headers: { 'User-Agent': 'KRITAM/0.1' } }, (response) => {
      let body = '';
      response.on('data', (chunk) => body += chunk);
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
  mainWindow.webContents.on('did-fail-load', (_event, code, desc) => console.error(`KRITAM failed to load UI: ${code} ${desc}`));
  mainWindow.on('close', (event) => { if (!app.isQuitting) { event.preventDefault(); mainWindow.hide(); } });
}

function createCompanionWindow() {
  companionWindow = new BrowserWindow({ width: 330, height: 460, minWidth: 330, maxWidth: 330, minHeight: 460, maxHeight: 460, show: false, frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, resizable: false, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true } });
  companionWindow.setAlwaysOnTop(true, 'floating');
  companionWindow.loadFile(path.join(__dirname, 'companion.html'));
  companionWindow.on('close', (event) => { if (!app.isQuitting) { event.preventDefault(); companionWindow.hide(); } });
  companionWindow.once('ready-to-show', () => companionWindow.showInactive());
  companionWindow.webContents.on('did-finish-load', () => setCompanionState(companionState.state, companionState.text));
}

function showCompanion() {
  companionWindow?.showInactive();
  setCompanionState(companionState.state, companionState.text);
  companionWindow?.webContents.send('daily-briefing-request');
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(appRoot, 'assets', 'kritam-avatar.png')).resize({ width: 32, height: 32 });
  tray = new Tray(icon);
  tray.setToolTip('KRITAM — ready when you are');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Talk to KRITAM', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { label: 'Show companion', click: showCompanion },
    { type: 'separator' },
    { label: 'Quit KRITAM', click: () => { app.isQuitting = true; app.quit(); } },
  ]));
  tray.on('click', showCompanion);
}

app.whenReady().then(() => { createMainWindow(); createCompanionWindow(); createTray(); audit.record('app.ready'); });
app.on('before-quit', () => audit.record('app.stopping'));
app.on('window-all-closed', (event) => event.preventDefault());
app.on('activate', () => mainWindow?.show());

ipcMain.handle('news:get', fetchHeadlines);
ipcMain.handle('companion:show', showCompanion);
ipcMain.handle('companion:set-state', (_event, state, text) => setCompanionState(state, text));
ipcMain.handle('agent:plan', (_event, text) => planLocalCommand(text));
ipcMain.handle('task:plan', (_event, text) => {
  const plan = planTask(text);
  audit.record('task.planned', { steps: plan?.steps?.length || 0 });
  return plan;
});
ipcMain.handle('conversation:plan', (_event, text) => {
  const result = planConversationalMessage(text, conversationState);
  if (!result) return null;
  conversationState = result.state;
  audit.record('conversation.planned', { intent: result.intent, needsDetails: result.needsDetails, searchPlatforms: result.platforms.length });
  return result;
});
ipcMain.handle('conversation:clear', () => { conversationState = null; return true; });
ipcMain.handle('agent:run-local', async (_event, text) => {
  try {
    const result = await runLocalCommand(text);
    audit.record(result?.matched ? 'agent.local.executed' : 'agent.local.unmatched', { tool: result?.request?.tool || null, executed: Boolean(result?.executed) });
    if (result?.executed) taskHistory.record({ action: text, tool: result.request?.tool, status: 'completed', detail: 'Local command executed.' });
    return result;
  } catch (error) {
    audit.record('agent.local.blocked', { error: error.message || 'unknown error' });
    taskHistory.record({ action: text, status: 'blocked', detail: error.message || 'Local command blocked.' });
    throw error;
  }
});
ipcMain.handle('ollama:status', () => getOllamaStatus());
ipcMain.handle('ollama:chat', async (_event, messages, options) => {
  if (!Array.isArray(messages) || !messages.length) throw new Error('A conversation is required.');
  return ollamaChat(messages, options || {});
});

const screenCapture = createScreenCapture((options) => mainWindow.capturePage(options), path.join(app.getPath('userData'), 'screenshots'));
const vision = createVisionRuntime({ capture: () => screenCapture.capture(), analyzeImage: (filePath, prompt) => createVisionAnalyzer().analyzeImage(filePath, prompt) });

async function captureDesktopScreen() {
  if (process.platform !== 'win32') throw new Error('Desktop-wide capture is currently supported on Windows only.');
  const display = screen.getPrimaryDisplay();
  const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: display.size.width, height: display.size.height } });
  if (!sources.length || sources[0].thumbnail.isEmpty()) throw new Error('No desktop screen was available for capture.');
  const image = sources[0].thumbnail;
  const size = image.getSize();
  return { image, width: size.width, height: size.height, display };
}

async function captureDesktopFile() {
  const desktop = await captureDesktopScreen();
  const tempDir = path.join(app.getPath('userData'), 'screenshots');
  fs.mkdirSync(tempDir, { recursive: true });
  const filePath = path.join(tempDir, `kritam-desktop-${Date.now()}.png`);
  const png = desktop.image.toPNG();
  fs.writeFileSync(filePath, png);
  const fingerprint = crypto.createHash('sha256').update(png).digest('hex');
  return { ...desktop, filePath, fingerprint };
}

async function findDesktopTargets(instruction) {
  const validated = validateToolRequest({ tool: 'screen_targets', arguments: { instruction } });
  if (validated.policy.approval !== 'always') throw new Error('Screen target detection must require explicit approval.');
  audit.record('screen.targets.requested', { instruction });
  const desktop = await captureDesktopFile();
  try {
    const analysis = await createVisionAnalyzer().analyzeImage(desktop.filePath, buildTargetPrompt(instruction));
    const targets = parseVisionTargets(analysis.text);
    return { type: 'screen-targets', width: desktop.width, height: desktop.height, display: desktop.display.bounds, fingerprint: desktop.fingerprint, targets, selection: selectTarget(targets, instruction), model: analysis.model };
  } finally { try { fs.unlinkSync(desktop.filePath); } catch (_) {} }
}

function mapTargetToDisplay(target, imageWidth, imageHeight, bounds) {
  const x = Number(target?.x), y = Number(target?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || imageWidth <= 0 || imageHeight <= 0) throw new Error('Invalid screen target coordinates.');
  return { x: Math.round(bounds.x + (Math.max(0, Math.min(imageWidth, x)) / imageWidth) * bounds.width), y: Math.round(bounds.y + (Math.max(0, Math.min(imageHeight, y)) / imageHeight) * bounds.height) };
}

async function captureSemanticVerification(beforePath, afterPath, instruction, targetLabel) {
  const fallback = { success: false, confidence: 0, reason: 'Semantic verification was inconclusive.', evidence: '' };
  try {
    const before = fs.readFileSync(beforePath).toString('base64');
    const after = fs.readFileSync(afterPath).toString('base64');
    const prompt = buildVerificationPrompt(instruction, targetLabel);
    const analyzer = createVisionAnalyzer();
    const result = await ollamaChat([{ role: 'user', content: `${prompt}\nCompare image 1 (before) with image 2 (after).`, images: [before, after] }], { model: analyzer.defaultModel || undefined, num_predict: 256, temperature: 0.1 });
    return normalizeVerification(result.message);
  } catch (error) {
    return { ...fallback, reason: `Semantic verification unavailable: ${error.message || 'vision analysis failed.'}`.slice(0, 500) };
  }
}

async function clickDesktopTarget(target, imageWidth, imageHeight, instruction, expectedFingerprint) {
  if (!target || target.actionable === false) throw new Error('The selected target is not actionable.');
  if (!Number.isFinite(Number(target.confidence)) || Number(target.confidence) < 0.75) throw new Error('KRITAM will not click a low-confidence screen target.');
  const point = mapTargetToDisplay(target, imageWidth, imageHeight, screen.getPrimaryDisplay().bounds);
  const request = validateToolRequest({ tool: 'mouse_click', arguments: point });
  const record = createActionRecord(request);
  audit.record('screen.click.requested', { label: target.label, confidence: target.confidence });
  const before = await captureDesktopFile();
  try {
    if (expectedFingerprint && before.fingerprint !== expectedFingerprint) throw new Error('The desktop changed since the target was found. Please rescan the screen before clicking.');
    const result = await computerInput.click(request.arguments);
    const confirmed = verifyResult(record, result);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const after = await captureDesktopFile();
    try {
      const changed = before.fingerprint !== after.fingerprint;
      const semantic = await captureSemanticVerification(before.filePath, after.filePath, instruction, target.label);
      const semanticConfirmed = semantic.success === true && Number(semantic.confidence) >= 0.82;
      audit.record('screen.click.completed', { label: target.label, changed, semanticConfirmed, confidence: semantic.confidence });
      taskHistory.record({ action: instruction, tool: 'mouse_click', status: semanticConfirmed || changed ? 'completed' : 'uncertain', detail: `Clicked ${target.label}.` });
      return { ...confirmed, instruction, target: { ...target, ...point }, verification: applyScreenVerification(confirmed, { changed: semanticConfirmed, confidence: semanticConfirmed ? semantic.confidence : changed ? 0.75 : 0, note: semanticConfirmed ? semantic.reason : changed ? 'Desktop changed, but semantic verification did not confidently confirm the requested outcome.' : semantic.reason }), semanticVerification: { ...semantic, success: semanticConfirmed } };
    } finally { try { fs.unlinkSync(after.filePath); } catch (_) {} }
  } catch (error) {
    audit.record('screen.click.failed', { label: target.label, error: error.message || 'unknown error' });
    throw error;
  } finally { try { fs.unlinkSync(before.filePath); } catch (_) {} }
}

ipcMain.handle('tool:execute', async (_event, request) => {
  const validated = validateToolRequest(request);
  audit.record('tool.validated', { tool: validated.tool, risk: validated.policy.risk, approval: validated.policy.approval });
  try {
    let result;
    if (validated.tool === 'capture_screen') result = await screenCapture.capture();
    else if (validated.tool === 'analyze_screen') result = await vision.analyzeScreen(validated.arguments.prompt);
    else if (validated.tool === 'screen_targets') result = await findDesktopTargets(validated.arguments.instruction);
    else if (validated.tool === 'mouse_click') result = await computerInput.click(validated.arguments);
    else if (validated.tool === 'type_text') result = await computerInput.typeText(validated.arguments);
    else if (validated.tool === 'keyboard_shortcut') result = await keyboard.pressShortcut(validated.arguments);
    else result = await executeTool(validated);
    audit.record('tool.executed', { tool: validated.tool, risk: validated.policy.risk });
    taskHistory.record({ action: validated.tool, tool: validated.tool, status: 'completed', detail: 'Validated tool execution completed.' });
    return { ...result, tool: validated.tool };
  } catch (error) {
    audit.record('tool.failed', { tool: validated.tool, error: error.message || 'unknown error' });
    taskHistory.record({ action: validated.tool, tool: validated.tool, status: 'failed', detail: error.message || 'Tool execution failed.' });
    throw error;
  }
});

ipcMain.handle('keyboard:shortcut', async (_event, keys) => {
  const request = validateToolRequest({ tool: 'keyboard_shortcut', arguments: { keys } });
  audit.record('keyboard.shortcut.requested', { keys: request.arguments.keys });
  return keyboard.pressShortcut(request.arguments);
});
ipcMain.handle('screen:targets', async (_event, instruction) => findDesktopTargets(instruction));
ipcMain.handle('screen:select-target', async (_event, targets, instruction) => selectTarget(targets, instruction));
ipcMain.handle('screen:click-target', async (_event, target, imageWidth, imageHeight, instruction, expectedFingerprint) => clickDesktopTarget(target, imageWidth, imageHeight, instruction, expectedFingerprint));
ipcMain.handle('app:open-url', async (_event, url) => {
  const result = await executeTool({ tool: 'open_url', arguments: { url } });
  audit.record('app.open-url', { url });
  return result;
});
ipcMain.handle('login:set-enabled', (_event, enabled) => { app.setLoginItemSettings({ openAtLogin: Boolean(enabled), path: process.execPath }); return app.getLoginItemSettings().openAtLogin; });
ipcMain.handle('memory:get-recent', (_event, id = 'default', limit = 50) => memory.getRecentMessages(id, limit));
ipcMain.handle('memory:add-message', (_event, payload) => memory.addMessage(payload));
ipcMain.handle('memory:get-preferences', () => memory.getPreferences());
ipcMain.handle('memory:set-preference', (_event, key, value) => memory.setPreference(key, value));
ipcMain.handle('memory:clear', () => memory.clearAll());
ipcMain.handle('audit:get-recent', (_event, limit = 50) => audit.recent(limit));
ipcMain.handle('audit:clear', () => { audit.clear(); audit.record('audit.cleared'); return true; });
ipcMain.handle('task-history:get-recent', (_event, limit = 50) => taskHistory.recent(limit));
ipcMain.handle('task-history:clear', () => { taskHistory.clear(); audit.record('task-history.cleared'); return true; });
ipcMain.handle('screen:capture', async () => screenCapture.capture());
ipcMain.handle('screen:analyze', async (_event, prompt) => vision.analyzeScreen(prompt));
