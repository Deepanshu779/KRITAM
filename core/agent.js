const WEBSITE_ALIASES = Object.freeze({
  google: 'https://www.google.com',
  youtube: 'https://www.youtube.com',
  github: 'https://github.com',
});

const APP_ALIASES = Object.freeze({
  calculator: 'calculator',
  calc: 'calculator',
  notepad: 'notepad',
  explorer: 'explorer',
  'file explorer': 'explorer',
});

const FOLDER_ALIASES = Object.freeze({
  desktop: 'Desktop',
  documents: 'Documents',
  downloads: 'Downloads',
});

function makeTool(tool, arguments_, description, label) {
  return { tool, arguments: arguments_, description, label };
}

function planLocalCommand(text) {
  const q = String(text || '').trim().toLowerCase();
  if (!q) return null;

  const stateApp = Object.keys(APP_ALIASES).find((name) => new RegExp(`\\b(?:is|check if|check whether)\\s+(?:the\\s+)?${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s+(?:open|running)\\b`, 'i').test(q));
  if (stateApp) return makeTool('app_state', { app: APP_ALIASES[stateApp] }, `Check whether ${APP_ALIASES[stateApp]} is running.`, `Check ${APP_ALIASES[stateApp]} status`);

  if (/\\b(analyze|analyse|describe|what(?:'s| is))\\b.*\\b(screen|display)\\b/.test(q) || /\\bwhat(?:'s| is) on my screen\\b/.test(q)) {
    return makeTool('analyze_screen', {}, 'Analyze the current KRITAM screen locally with a vision-capable Ollama model.', 'Analyze my screen');
  }
  if (/\\b(take|capture)\\s+(a\\s+)?screenshot\\b/.test(q) || /^screenshot$/.test(q) || /\\bcapture (the )?screen\\b/.test(q)) {
    return makeTool('capture_screen', {}, 'Capture the current KRITAM window after explicit permission.', 'Capture my screen');
  }

  const website = Object.keys(WEBSITE_ALIASES).find((name) => new RegExp(`\\b(?:open|go to|visit)\\s+(?:the\\s+)?${name}\\b`, 'i').test(q));
  if (website) return makeTool('open_url', { url: WEBSITE_ALIASES[website] }, `Open ${website} in your default browser.`, `Open ${website}`);

  const app = Object.keys(APP_ALIASES).find((name) => new RegExp(`\\b(?:open|launch|start)\\s+(?:the\\s+)?${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i').test(q));
  if (app) return makeTool('open_app', { app: APP_ALIASES[app] }, `Launch ${APP_ALIASES[app]}.`, `Open ${APP_ALIASES[app]}`);

  const folder = Object.keys(FOLDER_ALIASES).find((name) => new RegExp(`\\b(?:open|show|go to)\\s+(?:my\\s+|the\\s+)?${name}\\b`, 'i').test(q));
  if (folder) {
    const display = FOLDER_ALIASES[folder];
    return makeTool('open_path', { path: display }, `Open your ${display} folder.`, `Open ${display}`);
  }
  if (/\\b(system info|system information|pc specs|computer specs)\\b/.test(q)) return makeTool('system_info', {}, 'Read basic local computer information.', 'Show system information');
  if (/\\b(what time is it|current time|tell me the time)\\b/.test(q)) return makeTool('get_time', {}, 'Read the local system time.', 'Get current time');
  return null;
}

module.exports = { planLocalCommand };
