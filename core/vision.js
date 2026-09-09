const fs = require('fs');
const path = require('path');
const { chat, DEFAULT_MODEL } = require('./ollama');

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function createVisionAnalyzer(options = {}) {
  const chatFn = options.chatFn || chat;
  const defaultModel = options.model || DEFAULT_MODEL;

  async function analyzeImage(filePath, prompt = 'Describe what is visible on this screen. Identify the main apps, text, buttons, and actionable UI elements. Do not invent details.') {
    if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('Image path is required.');
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) throw new Error('Screenshot file was not found.');
    const stats = fs.statSync(resolved);
    if (!stats.isFile()) throw new Error('Screenshot path is not a file.');
    if (stats.size <= 0 || stats.size > MAX_IMAGE_BYTES) throw new Error('Screenshot size is outside the safe limit.');

    const image = fs.readFileSync(resolved).toString('base64');
    const result = await chatFn([
      {
        role: 'user',
        content: String(prompt).trim().slice(0, 4000),
        images: [image],
      },
    ], { model: defaultModel, num_predict: 512, temperature: 0.2 });

    return {
      model: result.model,
      text: result.message,
    };
  }

  return { analyzeImage };
}

module.exports = { createVisionAnalyzer, MAX_IMAGE_BYTES };
