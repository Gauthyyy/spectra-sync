const express = require('express');

let server;
let browser;
let page;
let port;
let puppeteer;

beforeAll(async () => {
  puppeteer = (await import('puppeteer')).default;
  const app = express();
  app.use(express.static(__dirname));

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });

  browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
  if (server) {
    server.close();
  }
});

beforeEach(async () => {
  page = await browser.newPage();
  // Listen for console logs in the page for debugging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto(`http://localhost:${port}/index.html`);
});

afterEach(async () => {
  if (page) {
    await page.close();
  }
});

describe('SpectraSync Application', () => {
  test('Initial state of UI', async () => {
    const startDisabled = await page.$eval('#startButton', el => el.disabled);
    const stopDisabled = await page.$eval('#stopButton', el => el.disabled);
    const statusText = await page.$eval('#statusText', el => el.textContent);

    expect(startDisabled).toBe(false);
    expect(stopDisabled).toBe(true);
    expect(statusText).toBe('Click Start to grant microphone access and begin visualization.');
  });

  test('Clicking start enables listening mode and starts processing', async () => {
    await page.click('#startButton');

    // Wait for the UI to update to the "running" state
    await page.waitForFunction(() => {
      return document.getElementById('startButton').disabled === true;
    });

    const startDisabled = await page.$eval('#startButton', el => el.disabled);
    const stopDisabled = await page.$eval('#stopButton', el => el.disabled);
    const statusText = await page.$eval('#statusText', el => el.textContent);

    expect(startDisabled).toBe(true);
    expect(stopDisabled).toBe(false);
    expect(statusText).toBe('Listening... move your voice or play audio into the mic.');
  });

  test('Clicking stop resets UI state', async () => {
    await page.click('#startButton');

    // Wait for start to complete
    await page.waitForFunction(() => {
      return document.getElementById('startButton').disabled === true;
    });

    // Now click stop
    await page.click('#stopButton');

    // Wait for the UI to update to the "stopped" state
    await page.waitForFunction(() => {
      return document.getElementById('startButton').disabled === false;
    });

    const startDisabled = await page.$eval('#startButton', el => el.disabled);
    const stopDisabled = await page.$eval('#stopButton', el => el.disabled);
    const statusText = await page.$eval('#statusText', el => el.textContent);

    expect(startDisabled).toBe(false);
    expect(stopDisabled).toBe(true);
    expect(statusText).toBe('Click Start to grant microphone access and begin visualization.');
  });

  test('Changing FFT size works without errors', async () => {
    await page.click('#startButton');

    // Wait for start to complete
    await page.waitForFunction(() => {
      return document.getElementById('startButton').disabled === true;
    });

    // Change FFT Size to 512
    await page.select('#fftSizeSelect', '512');

    // Check that it successfully changed and we are still running
    const fftValue = await page.$eval('#fftSizeSelect', el => el.value);
    expect(fftValue).toBe('512');

    const startDisabled = await page.$eval('#startButton', el => el.disabled);
    expect(startDisabled).toBe(true);

    // Ensure no unhandled errors were thrown (Puppeteer will fail the test if page crashes)
  });
});
