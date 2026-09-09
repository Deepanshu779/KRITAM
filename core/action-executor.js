const { validateToolRequest } = require('./policy');
const { executeTool } = require('./tools');
const { click, typeText } = require('./computer-input');
const { createActionRecord, verifyResult, getVerificationPlan } = require('./action-verifier');

function createActionExecutor({ execute = executeTool } = {}) {
  async function run(request) {
    const validated = validateToolRequest(request);
    const record = createActionRecord(validated);
    const result = validated.tool === 'mouse_click'
      ? await click(validated.arguments)
      : validated.tool === 'type_text'
        ? await typeText(validated.arguments)
        : await execute(validated);

    return {
      record: verifyResult(record, result),
      verificationPlan: getVerificationPlan(validated.tool),
    };
  }

  return { run };
}

module.exports = { createActionExecutor };
