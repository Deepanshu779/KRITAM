const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createScreenCapture } = require('./screen');

test('screen capture writes an image through the supplied capture function', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kritam-screen-'));
  const fakeImage = {
    toPNG: () => Buffer.from('fake-png'),
    getSize: () => ({ width: 1280, height: 720 }),
  };
  const capture = createScreenCapture(async () => fakeImage, dir);
  const result = await capture.capture();
  assert.equal(result.width, 1280);
  assert.equal(result.height, 720);
  assert.equal(fs.readFileSync(result.filePath, 'utf8'), 'fake-png');
  fs.rmSync(dir, { recursive: true, force: true });
});
