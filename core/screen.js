const fs = require('fs');
const path = require('path');

function createScreenCapture(capturePage, outputDir) {
  if (typeof capturePage !== 'function') throw new Error('A capturePage function is required.');
  if (typeof outputDir !== 'string' || !outputDir.trim()) throw new Error('Screenshot directory is required.');

  async function capture() {
    fs.mkdirSync(outputDir, { recursive: true });
    const image = await capturePage({});
    const filename = `kritam-screen-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, image.toPNG());
    return { filePath, filename, width: image.getSize().width, height: image.getSize().height };
  }

  return { capture };
}

module.exports = { createScreenCapture };
