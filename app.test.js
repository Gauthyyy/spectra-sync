const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const http = require('http');

describe('SpectraSync App Tests', () => {
  let app;
  let server;
  let browser;
  let page;

  before(async () => {
    // Start Express server
    app = express();
    app.use(express.static(path.join(__dirname)));
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    // Launch Puppeteer
    browser = await puppeteer.launch({
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
    page = await browser.newPage();

    // Catch console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('PAGE ERROR:', msg.text());
      }
    });
    page.on('pageerror', err => {
      console.error('PAGE EXCEPTION:', err.toString());
    });

    await page.goto(`http://localhost:${port}`);
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  });

  it('should initialize with correct default UI state', async () => {
    const startDisabled = await page.$eval('#startButton', el => el.disabled);
    const stopDisabled = await page.$eval('#stopButton', el => el.disabled);
    const statusText = await page.$eval('#statusText', el => el.textContent);

    assert.strictEqual(startDisabled, false, 'Start button should be enabled initially');
    assert.strictEqual(stopDisabled, true, 'Stop button should be disabled initially');
    assert.match(statusText, /Click Start/);
  });

  it('should handle Start button click and update UI', async () => {
    await page.click('#startButton');

    // Wait for the UI to update
    await page.waitForFunction(() => {
      return document.getElementById('startButton').disabled === true;
    });

    const startDisabled = await page.$eval('#startButton', el => el.disabled);
    const stopDisabled = await page.$eval('#stopButton', el => el.disabled);
    const statusText = await page.$eval('#statusText', el => el.textContent);

    assert.strictEqual(startDisabled, true, 'Start button should be disabled after starting');
    assert.strictEqual(stopDisabled, false, 'Stop button should be enabled after starting');
    assert.match(statusText, /Listening/);
  });

  it('should handle FFT size change without crashing', async () => {
    await page.select('#fftSizeSelect', '512');
    // Wait a bit to let the change handler run
    await new Promise(r => setTimeout(r, 100));

    // Ensure the stop button is still enabled (meaning we didn't crash and stop)
    const stopDisabled = await page.$eval('#stopButton', el => el.disabled);
    assert.strictEqual(stopDisabled, false);
  });

  it('should update dB meter', async () => {
    // Wait for dB meter to change from initial -100 dBFS
    await page.waitForFunction(() => {
      const dbText = document.getElementById('dbValue').textContent;
      return dbText !== '-100.0 dBFS';
    }, { timeout: 5000 });

    const dbText = await page.$eval('#dbValue', el => el.textContent);
    assert.notStrictEqual(dbText, '-100.0 dBFS', 'dB meter should update');
  });

  it('should handle Stop button click and revert UI', async () => {
    await page.click('#stopButton');

    await page.waitForFunction(() => {
      return document.getElementById('startButton').disabled === false;
    });

    const startDisabled = await page.$eval('#startButton', el => el.disabled);
    const stopDisabled = await page.$eval('#stopButton', el => el.disabled);
    const statusText = await page.$eval('#statusText', el => el.textContent);

    assert.strictEqual(startDisabled, false, 'Start button should be enabled after stopping');
    assert.strictEqual(stopDisabled, true, 'Stop button should be disabled after stopping');
    assert.match(statusText, /Click Start/);
  });
});
