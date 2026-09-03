import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.GUIDE_SCREENSHOT_URL ?? 'http://127.0.0.1:5173';
const outputDirectory = new URL('../docs/screenshots/', import.meta.url);

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const tremorOffset = { x: -0.7661712126857743, y: 16.24802106648383 };
const actionableSelector = 'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[role="button"]:not([aria-disabled="true"]),[role="radio"]:not([aria-disabled="true"]),[role="link"]:not([aria-disabled="true"])';

async function clickHitTestPoint(locator, shouldResolveToSameControl) {
  const point = await locator.evaluate((target, options) => {
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const candidates = [];

    for (let inset = 1; inset < Math.max(2, Math.floor(rect.height)); inset += 1) {
      candidates.push({ x: centerX, y: rect.bottom - inset });
    }
    for (let y = Math.ceil(rect.top + 1); y < Math.floor(rect.bottom - 1); y += 2) {
      for (let x = Math.ceil(rect.left + 1); x < Math.floor(rect.right - 1); x += 3) {
        candidates.push({ x, y });
      }
    }

    return candidates.find(({ x, y }) => {
      const physical = document.elementFromPoint(x, y)?.closest(options.actionableSelector);
      const displaced = document
        .elementFromPoint(x + options.tremorOffset.x, y + options.tremorOffset.y)
        ?.closest(options.actionableSelector);
      return physical === target && (physical === displaced) === options.shouldResolveToSameControl;
    }) ?? null;
  }, { actionableSelector, tremorOffset, shouldResolveToSameControl });

  if (!point) {
    throw new Error(`Could not find an honest ${shouldResolveToSameControl ? 'success' : 'miss'} point for the calibration target.`);
  }
  await page.mouse.click(point.x, point.y);
}

await page.addInitScript(() => {
  const tools = new Map();
  Object.defineProperty(document, 'modelContext', {
    configurable: true,
    value: {
      registerTool: async (tool, options) => {
        tools.set(tool.name, tool);
        options?.signal?.addEventListener('abort', () => tools.delete(tool.name), { once: true });
      },
      getTools: async () => [...tools.values()],
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
  Object.defineProperty(window, '__guideScreenshotTools', { configurable: true, value: tools });
});

await page.goto(baseUrl);
await page.getByRole('status', { name: 'WebMCP status: Guide available' }).waitFor();
await page.waitForTimeout(500);
await page.screenshot({ path: new URL('guide-home.png', outputDirectory).pathname });

await page.getByRole('button', { name: 'Simulate a barrier' }).click();
await page.getByRole('button', { name: 'Mobility', exact: true }).click();
await page.getByRole('button', { name: 'Parkinson’s' }).click();
await page.evaluate(() => { window.__guideSimulationTestElapsedMs = 495; });
const legacyButton = page.getByRole('button', { name: 'Reschedule appointment' });
const legacyBox = await legacyButton.boundingBox();
if (!legacyBox) throw new Error('Could not measure the legacy appointment control.');
await page.mouse.move(legacyBox.x + legacyBox.width / 2, legacyBox.y + legacyBox.height / 2);
await page.mouse.click(legacyBox.x + legacyBox.width / 2, legacyBox.y + legacyBox.height / 2);
await page.getByText('Missed target').waitFor();
await page.screenshot({ path: new URL('guide-parkinsons.png', outputDirectory).pathname });

await page.evaluate(async () => {
  const tools = window.__guideScreenshotTools;
  const tool = tools.get('start_interface_calibration');
  await tool.execute(
    {
      domain: 'pointer_precision',
      goal: 'reschedule_appointment',
    },
    { signal: new AbortController().signal },
  );
});
await page.waitForTimeout(500);

const practice = page.getByRole('button', { name: 'Practice appointment' });
await clickHitTestPoint(practice, false);
await page.getByText(/made the target 44px tall/i).waitFor();
await page.waitForTimeout(100);
await page.screenshot({ path: new URL('guide-calibration.png', outputDirectory).pathname });

for (let attempt = 0; attempt < 3; attempt += 1) {
  await clickHitTestPoint(practice, true);
}
await page.getByText('Now try the spacing').waitFor();

await clickHitTestPoint(practice, false);
await page.getByText(/moved the controls 16px apart/i).waitFor();
for (let attempt = 0; attempt < 3; attempt += 1) {
  await clickHitTestPoint(practice, true);
}

await page.getByRole('heading', { name: 'Does this feel comfortable?' }).waitFor();
await page.waitForTimeout(900);
await page.screenshot({ path: new URL('guide-calibration-result.png', outputDirectory).pathname });

const approve = page.getByRole('button', { name: /This feels comfortable/ });
await approve.focus();
await approve.dispatchEvent('click', { detail: 0 });
await page.getByRole('heading', { name: 'Reschedule your appointment' }).waitFor();
await page.waitForTimeout(700);
await page.screenshot({ path: new URL('guide-adapted.png', outputDirectory).pathname });

const selectedTime = page.getByRole('radio', { name: /Monday, September 14/ });
await selectedTime.focus();
await page.keyboard.press('Enter');
await page.evaluate(async () => {
  const tools = window.__guideScreenshotTools;
  const tool = tools.get('guide_to');
  await tool.execute(
    {
      target: 'confirm_reschedule_button',
      message: 'Your selected time is ready for review. I will not confirm it until you ask.',
    },
    { signal: new AbortController().signal },
  );
});
await page.waitForTimeout(700);
await page.screenshot({ path: new URL('guide-presence.png', outputDirectory).pathname });

await browser.close();
