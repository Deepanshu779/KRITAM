const SCREEN_COMMANDS = Object.freeze([
  'take a screenshot',
  'take screenshot',
  'capture the screen',
  'capture screen',
  'screenshot',
]);

function isScreenCaptureRequest(text) {
  const q = String(text || '').trim().toLowerCase();
  return SCREEN_COMMANDS.some((command) => q === command || q.startsWith(`${command} `));
}

module.exports = { SCREEN_COMMANDS, isScreenCaptureRequest };
