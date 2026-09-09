const { spawn } = require('child_process');

const WINDOWS_CULTURES = Object.freeze({
  en: 'en-IN',
  hinglish: 'en-IN',
  hi: 'hi-IN',
  pa: 'pa-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  ur: 'ur-IN',
});

function listenWindows({ language = 'en', timeoutSeconds = 12 } = {}) {
  if (process.platform !== 'win32') {
    return Promise.reject(new Error('Native Windows speech is only available on Windows.'));
  }

  const culture = WINDOWS_CULTURES[language] || 'en-IN';
  const timeout = Math.max(4, Math.min(30, Number(timeoutSeconds) || 12));
  const script = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$culture = [Globalization.CultureInfo]::GetCultureInfo($env:KRITAM_SPEECH_CULTURE)
$infos = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers()
$info = $infos | Where-Object { $_.Culture.Name -ieq $culture.Name } | Select-Object -First 1
if (-not $info) { $info = $infos | Where-Object { $_.Culture.TwoLetterISOLanguageName -ieq $culture.TwoLetterISOLanguageName } | Select-Object -First 1 }
if (-not $info) { $info = $infos | Where-Object { $_.Culture.TwoLetterISOLanguageName -ieq 'en' } | Select-Object -First 1 }
if (-not $info) { throw 'No compatible Windows speech recognizer is installed.' }
$recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine($info)
$recognizer.SetInputToDefaultAudioDevice()
$recognizer.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
$result = $recognizer.Recognize([TimeSpan]::FromSeconds($env:KRITAM_SPEECH_TIMEOUT))
if ($result) { [Console]::Out.Write($result.Text) }
$recognizer.Dispose()
`;

  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], {
      windowsHide: true,
      env: { ...process.env, KRITAM_SPEECH_CULTURE: culture, KRITAM_SPEECH_TIMEOUT: String(timeout) },
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (error) => finish(reject, new Error(`Windows speech could not start: ${error.message}`)));
    child.on('close', (code) => {
      const text = stdout.trim();
      if (code === 0 && text) return finish(resolve, { text, language: culture });
      finish(reject, new Error(stderr.trim() || 'I could not hear a clear phrase. Please try again.'));
    });
  });
}

module.exports = { listenWindows, WINDOWS_CULTURES };
