const http = require('http');

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.KRITAM_OLLAMA_MODEL || 'llama3.2:3b';
const DEFAULT_CHAT_TIMEOUT = 300000;

function requestJson(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, process.env.KRITAM_OLLAMA_URL || DEFAULT_BASE_URL);
    const body = options.body ? JSON.stringify(options.body) : null;
    const request = http.request(url, {
      method: options.method || 'GET',
      headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {},
      timeout: options.timeout || 8000,
    }, (response) => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        let parsed = {};
        try { parsed = data ? JSON.parse(data) : {}; } catch (_) {}
        if (response.statusCode >= 200 && response.statusCode < 300) return resolve(parsed);
        reject(new Error(parsed.error || `Ollama returned HTTP ${response.statusCode}`));
      });
    });
    request.on('timeout', () => request.destroy(new Error('Ollama request timed out.')));
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

async function getStatus() {
  try {
    const data = await requestJson('/api/tags', { timeout: 2500 });
    const models = Array.isArray(data.models) ? data.models.map((model) => model.name).filter(Boolean) : [];
    return { available: true, models, selectedModel: process.env.KRITAM_OLLAMA_MODEL || models[0] || DEFAULT_MODEL };
  } catch (error) {
    return { available: false, models: [], selectedModel: DEFAULT_MODEL, error: error.message };
  }
}

async function chat(messages, options = {}) {
  const model = options.model || process.env.KRITAM_OLLAMA_MODEL || DEFAULT_MODEL;
  const timeout = options.timeout || DEFAULT_CHAT_TIMEOUT;
  const data = await requestJson('/api/chat', {
    method: 'POST',
    timeout,
    body: {
      model,
      messages,
      stream: false,
      keep_alive: options.keep_alive || '10m',
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.num_predict || 256,
      },
    },
  });
  return { model, message: data.message?.content || '', done: data.done !== false };
}

module.exports = { getStatus, chat, DEFAULT_MODEL };
