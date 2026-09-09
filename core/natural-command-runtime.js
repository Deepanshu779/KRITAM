const { planNaturalCommand } = require('./natural-intent');
const { executeTool } = require('./tools');

const SEARCH_HOSTS = Object.freeze({
  youtube: 'https://www.youtube.com/results?search_query=',
  google: 'https://www.google.com/search?q=',
  wikipedia: 'https://www.google.com/search?q=site%3Awikipedia.org+',
});

function buildContentUrl(query, contentType) {
  const text = `${contentType || ''} ${query || ''}`.trim();
  return `${SEARCH_HOSTS.youtube}${encodeURIComponent(text)}`;
}

async function executeNaturalCommand(text) {
  const plan = planNaturalCommand(text);
  if (!plan) return { matched: false };
  const action = plan.action || {};
  if (action.action === 'find_and_open_content') {
    const url = buildContentUrl(action.query, action.contentType);
    const result = await executeTool({ tool: 'open_url', arguments: { url } });
    return { matched: true, executed: true, intent: plan.intent, beneficiary: plan.beneficiary, action: action.action, url, result };
  }
  if (action.action === 'open_target' && action.target) {
    const result = await executeTool({ tool: 'open_app', arguments: { app: action.target } }).catch(async () => executeTool({ tool: 'open_url', arguments: { url: action.target } }));
    return { matched: true, executed: true, intent: plan.intent, beneficiary: plan.beneficiary, action: action.action, result };
  }
  return { matched: true, executed: false, intent: plan.intent, beneficiary: plan.beneficiary, action };
}

module.exports = { SEARCH_HOSTS, buildContentUrl, executeNaturalCommand };
