function createVisionRuntime({ capture, analyzeImage }) {
  if (typeof capture !== 'function' || typeof analyzeImage !== 'function') {
    throw new Error('Vision runtime requires capture and analyzeImage functions.');
  }

  async function analyzeScreen(prompt) {
    const screenshot = await capture();
    try {
      const analysis = await analyzeImage(screenshot.filePath, prompt);
      return {
        type: 'screen-analysis',
        text: analysis.text,
        model: analysis.model,
        width: screenshot.width,
        height: screenshot.height,
      };
    } finally {
      // Keep the screenshot available for the current request only.
      // Cleanup failures are intentionally ignored so the model result is not lost.
      try { require('fs').unlinkSync(screenshot.filePath); } catch (_) {}
    }
  }

  return { analyzeScreen };
}

module.exports = { createVisionRuntime };
