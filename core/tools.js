const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { shell } = require('electron');
const { getApplicationState } = require('./app-state');

const WINDOWS_APPS = Object.freeze({
  calculator: { file: 'calc.exe', label: 'Calculator' },
  notepad: { file: 'notepad.exe', label: 'Notepad' },
  explorer: { file: 'explorer.exe', label: 'File Explorer' },
});

function runAllowedApp(appName) {
  const key = String(appName || '').trim().toLowerCase();
  const app = WINDOWS_APPS[key];
  if (!app) throw new Error(`KRITAM does not allow launching '${appName}'.`);
  return new Promise((resolve, reject) => {
    execFile(app.file, [], { windowsHide: true }, (error) => {
      if (error) return reject(new Error(`Could not launch ${app.label}.`));
      resolve({ success: true, app: app.label });
    });
  });
}

async function openPath(target) {
  const requested = String(target || '').trim();
  if (!requested) throw new Error('A path is required.');
  const allowedRoots = [os.homedir(), path.join(os.homedir(), 'Desktop'), path.join(os.homedir(), 'Documents'), path.join(os.homedir(), 'Downloads')];
  const normalized = path.resolve(requested);
  const allowed = allowedRoots.some((root) => normalized === root || normalized.startsWith(`${root}${path.sep}`));
  if (!allowed) throw new Error('For safety, KRITAM can only open paths inside your home, Desktop, Documents, or Downloads folders.');
  const error = await shell.openPath(normalized);
  if (error) throw new Error(error);
  return { success: true, path: normalized };
}

const tools = {
  async open_url({ url }) {
    const value = String(url || '').trim();
    let parsed;
    try { parsed = new URL(value); } catch (_) { throw new Error('Only valid HTTPS URLs are allowed.'); }
    if (parsed.protocol !== 'https:') throw new Error('Only HTTPS websites are allowed.');
    const error = await shell.openExternal(parsed.toString());
    if (error) throw new Error(error);
    return { success: true, url: parsed.toString() };
  },
  async open_app({ app }) { return runAllowedApp(app); },
  async open_path({ path: target }) { return openPath(target); },
  async app_state({ app }) { return getApplicationState(app); },
  async system_info() {
    return { success: true, platform: process.platform, release: os.release(), arch: os.arch(), cpuCount: os.cpus().length, memoryGB: Math.round(os.totalmem() / 1024 / 1024 / 1024) };
  },
  async get_time() { return { success: true, iso: new Date().toISOString(), local: new Date().toLocaleString() }; },
};

async function executeTool(request) {
  const fn = tools[request.tool];
  if (!fn) throw new Error('Tool implementation not found.');
  return fn(request.arguments || {});
}

module.exports = { executeTool };
