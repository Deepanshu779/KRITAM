const { execFile } = require('child_process');

const LIMITS = Object.freeze({
  minX: 0,
  minY: 0,
  maxX: 10000,
  maxY: 10000,
  maxTextLength: 2000,
});

function validatePoint(x, y) {
  const point = { x: Number(x), y: Number(y) };
  if (!Number.isInteger(point.x) || !Number.isInteger(point.y)) {
    throw new Error('Mouse coordinates must be integers.');
  }
  if (point.x < LIMITS.minX || point.x > LIMITS.maxX || point.y < LIMITS.minY || point.y > LIMITS.maxY) {
    throw new Error("Mouse coordinates are outside KRITAM's safe bounds.");
  }
  return point;
}

function validateText(text) {
  const value = String(text ?? '');
  if (!value.trim()) throw new Error('Text is required.');
  if (value.length > LIMITS.maxTextLength) throw new Error('Text is too long for a single controlled input action.');
  if (/\0/.test(value)) throw new Error('Invalid text input.');
  return value;
}

function escapeSendKeys(text) {
  return String(text).replace(/[+^%~(){}]/g, (character) => `{${character}}`);
}

function runPowerShell(script) {
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, timeout: 10000 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr.trim() || 'Windows input action failed.'));
      resolve(stdout.trim());
    });
  });
}

async function click({ x, y, button = 'left' }) {
  if (process.platform !== 'win32') throw new Error('Controlled mouse input is currently supported on Windows only.');
  const point = validatePoint(x, y);
  const selectedButton = String(button).toLowerCase();
  if (!['left', 'right'].includes(selectedButton)) throw new Error('Only left and right mouse clicks are allowed.');
  const flag = selectedButton === 'left' ? '0x0002,0x0004' : '0x0008,0x0010';
  const script = `Add-Type @'\nusing System;\nusing System.Runtime.InteropServices;\npublic static class KRITAMInput {\n[DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);\n[DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags,uint dx,uint dy,uint dwData,UIntPtr dwExtraInfo);\n}\n'@; [KRITAMInput]::SetCursorPos(${point.x},${point.y}) | Out-Null; [KRITAMInput]::mouse_event(${flag.split(',')[0]},0,0,0,[UIntPtr]::Zero); [KRITAMInput]::mouse_event(${flag.split(',')[1]},0,0,0,[UIntPtr]::Zero)`;
  await runPowerShell(script);
  return { success: true, action: 'click', ...point, button: selectedButton };
}

async function typeText({ text }) {
  if (process.platform !== 'win32') throw new Error('Controlled keyboard input is currently supported on Windows only.');
  const value = validateText(text);
  const escaped = escapeSendKeys(value);
  const encoded = Buffer.from(escaped, 'utf8').toString('base64');
  const script = `$value=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encoded}')); Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait($value)`;
  await runPowerShell(script);
  return { success: true, action: 'type_text', length: value.length };
}

module.exports = { LIMITS, validatePoint, validateText, escapeSendKeys, click, typeText };
