const WEBSITE_ALIASES = Object.freeze({ google: 'https://www.google.com', youtube: 'https://www.youtube.com', github: 'https://github.com' });
const APP_ALIASES = Object.freeze({ calculator: 'calculator', calc: 'calculator', notepad: 'notepad', explorer: 'explorer', 'file explorer': 'explorer', chrome: 'chrome', edge: 'edge' });
const FOLDER_ALIASES = Object.freeze({ desktop: 'Desktop', documents: 'Documents', downloads: 'Downloads' });
const KEY_ALIASES = Object.freeze({ control: 'CTRL', ctrl: 'CTRL', alt: 'ALT', shift: 'SHIFT', windows: 'WIN', win: 'WIN', enter: 'ENTER', tab: 'TAB', escape: 'ESC', esc: 'ESC', backspace: 'BACKSPACE', delete: 'DELETE', up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', home: 'HOME', end: 'END', space: 'SPACE' });
const COMMAND_WORDS = Object.freeze({
  open: ['open', 'launch', 'start', 'khol', 'kholo', 'khol do', 'खोल', 'खोलो'],
  show: ['show', 'dikha', 'dikhao', 'दिखा', 'दिखाओ'],
  go: ['go to', 'visit', 'jao', 'जाओ'],
});
function makeTool(tool, arguments_, description, label) { return { tool, arguments: arguments_, description, label }; }
function hasAny(text, words) { return words.some((word) => text.includes(word)); }
function parseShortcut(text) {
  const match = String(text || '').trim().match(/^(?:press|hit|use|dabao|दबाओ)\s+(.+)$/i);
  if (!match) return null;
  const parts = match[1].split(/\s*(?:\+|and|aur)\s*/i).map((part) => part.trim().toLowerCase()).filter(Boolean);
  if (parts.length < 1 || parts.length > 6) return null;
  const keys = parts.map((part) => KEY_ALIASES[part] || part.toUpperCase());
  const valid = keys.every((key) => /^(CTRL|ALT|SHIFT|WIN|ENTER|TAB|ESC|BACKSPACE|DELETE|UP|DOWN|LEFT|RIGHT|HOME|END|PAGEUP|PAGEDOWN|SPACE|F(?:[1-9]|1[0-2])|[A-Z0-9])$/.test(key));
  if (!valid || (keys.length > 1 && !keys.slice(0, -1).every((key) => ['CTRL','ALT','SHIFT','WIN'].includes(key)))) return null;
  return makeTool('keyboard_shortcut', { keys }, `Press ${keys.join(' + ')}.`, `Press ${keys.join(' + ')}`);
}
function planLocalCommand(text) {
  const q = String(text || '').trim().toLowerCase();
  if (!q) return null;
  const shortcut = parseShortcut(text);
  if (shortcut) return shortcut;
  const stateApp = Object.keys(APP_ALIASES).find((name) => new RegExp(`\\b(?:is|check if|check whether)\\s+(?:the\\s+)?${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s+(?:open|running)\\b`, 'i').test(q));
  if (stateApp) return makeTool('app_state', { app: APP_ALIASES[stateApp] }, `Check whether ${APP_ALIASES[stateApp]} is running.`, `Check ${APP_ALIASES[stateApp]} status`);
  if (/\\b(analyze|analyse|describe|what(?:'s| is)|kya|kya hai|बताओ|दिख रहा)\\b.*\\b(screen|display|scree[nm]|स्क्रीन)\\b/.test(q) || /\\bwhat(?:'s| is) on my screen\\b/.test(q)) return makeTool('analyze_screen', {}, 'Analyze the current KRITAM screen locally with a vision-capable Ollama model.', 'Analyze my screen');
  if (/\\b(take|capture|le|lo)\\s+(a\\s+)?(screenshot|screen shot)\\b/.test(q) || /^screenshot$/.test(q) || /\\bcapture (the )?screen\\b/.test(q)) return makeTool('capture_screen', {}, 'Capture the current KRITAM window after explicit permission.', 'Capture my screen');
  const website = Object.keys(WEBSITE_ALIASES).find((name) => new RegExp(`(?:\\b(?:open|go to|visit|khol|kholo|jao|जाओ|खोलो)\\b).*\\b${name}\\b`, 'i').test(q));
  if (website) return makeTool('open_url', { url: WEBSITE_ALIASES[website] }, `Open ${website} in your default browser.`, `Open ${website}`);
  const app = Object.keys(APP_ALIASES).find((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
    return new RegExp(`(?:\\b(?:open|launch|start|khol|kholo|khol do)\\b).*\\b${escaped}\\b|\\b(?:${escaped})\\s+(?:khol|kholo)\\b`, 'i').test(q);
  });
  if (app) return makeTool('open_app', { app: APP_ALIASES[app] }, `Launch ${APP_ALIASES[app]}.`, `Open ${APP_ALIASES[app]}`);
  const folder = Object.keys(FOLDER_ALIASES).find((name) => new RegExp(`(?:\\b(?:open|show|go to|khol|kholo|dikha|dikhao)\\b).*\\b${name}\\b`, 'i').test(q));
  if (folder) { const display = FOLDER_ALIASES[folder]; return makeTool('open_path', { path: display }, `Open your ${display} folder.`, `Open ${display}`); }
  if (/\\b(system info|system information|pc specs|computer specs|system ki info|pc ki info|system batao|कंप्यूटर की जानकारी)\\b/.test(q)) return makeTool('system_info', {}, 'Read basic local computer information.', 'Show system information');
  if (/\\b(what time is it|current time|tell me the time|time kya hai|kitne baje|समय क्या है|कितने बजे)\\b/.test(q)) return makeTool('get_time', {}, 'Read the local system time.', 'Get current time');
  return null;
}
module.exports = { planLocalCommand, parseShortcut, KEY_ALIASES, COMMAND_WORDS, hasAny };
