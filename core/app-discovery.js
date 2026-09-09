const os = require('os');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const CACHE_TTL_MS = 60_000;
let cache = { expiresAt: 0, apps: [] };

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\.(exe|lnk|appref-ms)$/i, '').replace(/\s+/g, ' ');
}

function uniqueApps(apps) {
  const seen = new Set();
  return apps.filter((app) => {
    const key = normalize(app.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function runPowerShell(script) {
  return new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true, timeout: 8000 }, (error, stdout) => {
      if (error) return resolve('');
      resolve(String(stdout || ''));
    });
  });
}

async function discoverWindowsApps() {
  if (process.platform !== 'win32') return [];
  if (Date.now() < cache.expiresAt) return cache.apps.slice();

  const apps = [];
  const startMenuRoots = [
    path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    path.join(process.env.ProgramData || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
  ].filter(Boolean);

  for (const root of startMenuRoots) {
    if (!fs.existsSync(root)) continue;
    const output = await runPowerShell(`Get-ChildItem -LiteralPath '${root.replace(/'/g, "''")}' -Recurse -File -Include *.lnk,*.exe,*.appref-ms -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName + '|' + $_.BaseName }`);
    for (const line of output.split(/\r?\n/).filter(Boolean)) {
      const [file, name] = line.split('|');
      if (file && name) apps.push({ name, path: file });
    }
  }

  cache = { expiresAt: Date.now() + CACHE_TTL_MS, apps: uniqueApps(apps) };
  return cache.apps.slice();
}

async function findInstalledApp(query) {
  const requested = normalize(query);
  if (!requested) return null;
  const apps = await discoverWindowsApps();
  const exact = apps.find((app) => normalize(app.name) === requested);
  if (exact) return exact;
  const partial = apps.find((app) => normalize(app.name).includes(requested) || requested.includes(normalize(app.name)));
  return partial || null;
}

module.exports = { discoverWindowsApps, findInstalledApp, normalize };
