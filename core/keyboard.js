const { execFile } = require('child_process');

const MODIFIERS = Object.freeze(['CTRL', 'ALT', 'SHIFT', 'WIN']);
const SPECIAL_KEYS = Object.freeze(['ENTER', 'TAB', 'ESC', 'BACKSPACE', 'DELETE', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN', 'SPACE']);
const MAX_KEYS = 6;

function normalizeKey(key) {
  const value = String(key ?? '').trim().toUpperCase();
  if (!value) throw new Error('A keyboard key is required.');
  if (MODIFIERS.includes(value) || SPECIAL_KEYS.includes(value)) return value;
  if (/^F(?:[1-9]|1[0-2])$/.test(value)) return value;
  if (/^[A-Z0-9]$/.test(value)) return value;
  throw new Error(`Unsupported keyboard key '${key}'.`);
}

function normalizeShortcut(keys) {
  if (!Array.isArray(keys) || !keys.length || keys.length > MAX_KEYS) throw new Error(`A shortcut must contain 1-${MAX_KEYS} keys.`);
  const normalized = keys.map(normalizeKey);
  const modifierCount = normalized.filter((key) => MODIFIERS.includes(key)).length;
  if (modifierCount !== normalized.length - 1 && normalized.length > 1) throw new Error('Shortcuts must contain modifiers followed by exactly one main key.');
  if (new Set(normalized).size !== normalized.length) throw new Error('Shortcut keys must be unique.');
  return normalized;
}

function keyCode(key) {
  if (/^[A-Z0-9]$/.test(key)) return key.charCodeAt(0);
  if (/^F(?:[1-9]|1[0-2])$/.test(key)) return 0x70 + Number(key.slice(1)) - 1;
  return { ENTER:13, TAB:9, ESC:27, BACKSPACE:8, DELETE:46, UP:38, DOWN:40, LEFT:37, RIGHT:39, HOME:36, END:35, PAGEUP:33, PAGEDOWN:34, SPACE:32, CTRL:162, ALT:164, SHIFT:160, WIN:91 }[key];
}

function powershellShortcut(keys) {
  const normalized = normalizeShortcut(keys);
  const codes = normalized.map(keyCode);
  return `Add-Type @'\nusing System; using System.Runtime.InteropServices;\npublic static class KRITAMKeyboard { [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo); }\n'@; ${codes.map((code) => `[KRITAMKeyboard]::keybd_event(${code},0,0,[UIntPtr]::Zero)`).join('; ')}; ${codes.slice().reverse().map((code) => `[KRITAMKeyboard]::keybd_event(${code},0,2,[UIntPtr]::Zero)`).join('; ')}`;
}

function runPowerShell(script) {
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, timeout: 10000 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr.trim() || 'Windows keyboard action failed.'));
      resolve(stdout.trim());
    });
  });
}

async function pressShortcut({ keys }) {
  if (process.platform !== 'win32') throw new Error('Controlled keyboard shortcuts are currently supported on Windows only.');
  const normalized = normalizeShortcut(keys);
  await runPowerShell(powershellShortcut(normalized));
  return { success: true, action: 'keyboard_shortcut', keys: normalized };
}

module.exports = { MODIFIERS, SPECIAL_KEYS, MAX_KEYS, normalizeKey, normalizeShortcut, keyCode, powershellShortcut, pressShortcut };
