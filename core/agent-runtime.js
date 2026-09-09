const { planLocalCommand } = require('./agent');
const { validateToolRequest } = require('./policy');
const { executeTool } = require('./tools');

async function runLocalCommand(text) {
  const request = planLocalCommand(text);
  if (!request) return { matched: false };

  const validated = validateToolRequest(request);
  // Read-only tools are safe to execute immediately. Mutating/launching tools
  // are returned for the UI permission gate.
  if (validated.policy.approval === 'none') {
    const result = await executeTool(validated);
    return { matched: true, executed: true, request: validated, result };
  }

  return { matched: true, executed: false, request: validated };
}

module.exports = { runLocalCommand };
