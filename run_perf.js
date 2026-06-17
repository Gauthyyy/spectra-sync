const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(`file://${path.resolve(__dirname, 'test_perf.html')}`);

  await page.waitForSelector('#result', { timeout: 10000 });
  const resultText = await page.$eval('#result', el => el.innerText);
  console.log(resultText);

  await browser.close();
})();
