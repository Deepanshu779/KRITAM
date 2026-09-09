const { planNaturalCommand } = require('./natural-intent-v2');
const { executeTool } = require('./tools');

const SEARCH_PLATFORMS = Object.freeze([
  { platform: 'google', build: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { platform: 'youtube', build: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
  { platform: 'amazon', build: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}` },
  { platform: 'flipkart', build: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}` },
  { platform: 'myntra', build: (q) => `https://www.myntra.com/${encodeURIComponent(q).replace(/%20/g, '-')}` }
]);

function buildSearchUrls(query) {
  return SEARCH_PLATFORMS.map(({ platform, build }) => ({ platform, url: build(query) }));
}

async function executeNaturalCommand(text) {
  const plan = planNaturalCommand(text);
  if (!plan) return { matched: false };
  const action = plan.action || {};

  if (action.action === 'find_and_open_content') {
    const query = `${action.contentType || 'video'} ${action.query || ''}`.trim();
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const result = await executeTool({ tool: 'open_url', arguments: { url } });
    return { matched: true, executed: true, intent: plan.intent, beneficiary: plan.beneficiary, action: action.action, url, result };
  }

  if (action.action === 'search_web') {
    const urls = buildSearchUrls(action.query || action.category || 'search');
    const first = urls[0];
    const result = await executeTool({ tool: 'open_url', arguments: { url: first.url } });
    return { matched: true, executed: true, intent: plan.intent, beneficiary: plan.beneficiary, action: action.action, query: action.query, category: action.category, platforms: urls, result };
  }

  if (action.action === 'open_target' && action.target) {
    const result = await executeTool({ tool: 'open_app', arguments: { app: action.target } }).catch(() => executeTool({ tool: 'open_url', arguments: { url: action.target } }));
    return { matched: true, executed: true, intent: plan.intent, beneficiary: plan.beneficiary, action: action.action, result };
  }

  return { matched: true, executed: false, intent: plan.intent, beneficiary: plan.beneficiary, action };
}

module.exports = { SEARCH_PLATFORMS, buildSearchUrls, executeNaturalCommand };
