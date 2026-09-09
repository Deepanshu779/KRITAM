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

function makeTool(tool, arguments_, description, label) {
  return { tool, arguments: arguments_, description, label };
}

function planLocalCommand(text) {
  const q = String(text || '').trim().toLowerCase();
  if (!q) return null;

  const website = Object.keys(WEBSITE_ALIASES).find((name) => new RegExp(`\\b(?:open|go to|visit)\\s+(?:the\\s+)?${name}\\b`, 'i').test(q));
  if (website) return makeTool('open_url', { url: WEBSITE_ALIASES[website] }, `Open ${website} in your default browser.`, `Open ${website}`);

  const app = Object.keys(APP_ALIASES).find((name) => new RegExp(`\\b(?:open|launch|start)\\s+(?:the\\s+)?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(q));
  if (app) return makeTool('open_app', { app: APP_ALIASES[app] }, `Launch ${APP_ALIASES[app]}.`, `Open ${APP_ALIASES[app]}`);

  if (/\b(system info|system information|pc specs|computer specs)\b/.test(q)) {
    return makeTool('system_info', {}, 'Read basic local computer information.', 'Show system information');
  }

  if (/\b(what time is it|current time|tell me the time)\b/.test(q)) {
    return makeTool('get_time', {}, 'Read the local system time.', 'Get current time');
  }

  return null;
}

module.exports = { planLocalCommand };
