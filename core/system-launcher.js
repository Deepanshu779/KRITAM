const os = require('os');
const { execFile } = require('child_process');

function normalizeAppName(name) {
  const value = String(name || '').trim().replace(/\s+/g, ' ');
  if (!value || value.length > 120) throw new Error('Please provide a valid application name.');
  return value;
}

function exec(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { windowsHide: true, timeout: 10000, ...options }, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve({ stdout: String(stdout || ''), stderr: String(stderr || '') });
    });
  });
}

async function launchInstalledApp(name) {
  const requested = normalizeAppName(name);
  if (process.platform !== 'win32') throw new Error('Opening arbitrary installed applications is currently supported on Windows only.');

  // First prefer commands exposed on PATH. No shell is used.
  try {
    const located = await exec('where.exe', [requested]);
    const executable = located.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
    if (executable) {
      await exec(executable, []);
      return { success: true, app: requested, source: 'PATH', resolved: executable };
    }
  } catch (_) {}

  // Then query Windows Start-menu registrations. The query is passed through
  // an environment variable, so user input is never interpolated into code.
  const script = "$q=$env:KRITAM_APP_QUERY; $apps=Get-StartApps | Where-Object { $_.Name -like ('*' + $q + '*') } | Select-Object -First 1; if($apps){$apps.AppID}else{exit 2}";
  try {
    const result = await exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], {
      env: { ...process.env, KRITAM_APP_QUERY: requested },
    });
    const appId = result.stdout.trim();
    if (!appId) throw new Error('not found');
    await exec('explorer.exe', [`shell:AppsFolder\\${appId}`]);
    return { success: true, app: requested, source: 'Start menu', appId };
  } catch (_) {
    throw new Error(`I couldn't find '${requested}' on this PC. Please check the app name or install it first.`);
  }
}

module.exports = { normalizeAppName, launchInstalledApp };
