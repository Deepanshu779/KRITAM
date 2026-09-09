const RISK_LEVELS = Object.freeze({ LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 });

const TOOL_POLICIES = Object.freeze({
  open_url: { risk: RISK_LEVELS.LOW, approval: 'session' },
  open_app: { risk: RISK_LEVELS.MEDIUM, approval: 'session' },
  open_path: { risk: RISK_LEVELS.MEDIUM, approval: 'session' },
  system_info: { risk: RISK_LEVELS.LOW, approval: 'none' },
  get_time: { risk: RISK_LEVELS.LOW, approval: 'none' },
  capture_screen: { risk: RISK_LEVELS.HIGH, approval: 'always' },
  analyze_screen: { risk: RISK_LEVELS.HIGH, approval: 'always' },
  mouse_click: { risk: RISK_LEVELS.HIGH, approval: 'always' },
  type_text: { risk: RISK_LEVELS.HIGH, approval: 'always' },
});

function getPolicy(tool) {
  return TOOL_POLICIES[tool] || { risk: RISK_LEVELS.CRITICAL, approval: 'always' };
}

function validateToolRequest(request) {
  if (!request || typeof request !== 'object') throw new Error('Invalid tool request.');
  if (typeof request.tool !== 'string' || !TOOL_POLICIES[request.tool]) throw new Error('Tool is not allowed.');
  if (request.arguments !== undefined && (request.arguments === null || typeof request.arguments !== 'object')) {
    throw new Error('Tool arguments must be an object.');
  }
  return { tool: request.tool, arguments: request.arguments || {}, policy: getPolicy(request.tool) };
}

module.exports = { RISK_LEVELS, TOOL_POLICIES, getPolicy, validateToolRequest };
