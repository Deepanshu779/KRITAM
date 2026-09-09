const { execFile } = require('child_process');

const APP_PROCESSES = Object.freeze({
  calculator: ['CalculatorApp.exe', 'calc.exe'],
  notepad: ['notepad.exe'],
  explorer: ['explorer.exe'],
});

function parseTasklistCsv(output) {
  return String(output || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const fields = [];
    const regex = /"([^"]*)"/g;
    let match;
    while ((match = regex.exec(line))) fields.push(match[1]);
    return { imageName: fields[0] || '', pid: fields[1] || '' };
  });
}

function isProcessRunning(processNames, output) {
  const wanted = new Set(processNames.map((name) => name.toLowerCase()));
  return parseTasklistCsv(output).some((row) => wanted.has(row.imageName.toLowerCase()));
}

function getApplicationState(appName) {
  if (process.platform !== 'win32') throw new Error('Application state detection is currently supported on Windows only.');
  const key = String(appName || '').trim().toLowerCase();
  const processNames = APP_PROCESSES[key];
  if (!processNames) throw new Error(`KRITAM does not monitor application '${appName}'.`);
  return new Promise((resolve, reject) => {
    execFile('tasklist.exe', ['/FO', 'CSV', '/NH'], { windowsHide: true, timeout: 5000 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr.trim() || 'Could not read Windows application state.'));
      resolve({ success: true, app: key, running: isProcessRunning(processNames, stdout), processes: processNames });
    });
  });
}

module.exports = { APP_PROCESSES, parseTasklistCsv, isProcessRunning, getApplicationState };
