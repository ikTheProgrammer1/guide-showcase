import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.GUIDE_SCREENSHOT_URL ?? 'http://127.0.0.1:5173';
const outputDirectory = new URL('../docs/screenshots/', import.meta.url);

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

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

await page.evaluate(async () => {
  const tools = window.__guideScreenshotTools;
  const tool = tools.get('configure_accessibility');
  await tool.execute(
    {
      textScale: 150,
      contrast: 'high',
      density: 'simplified',
      controlSize: 'large',
      spacing: 'increased',
      colorIndependentStatus: true,
      emphasizeInteractive: true,
    },
    { signal: new AbortController().signal },
  );
});
await page.locator('[class*="agentPointer"]').waitFor({ state: 'detached', timeout: 7000 });
await page.screenshot({ path: new URL('guide-adapted.png', outputDirectory).pathname });

await page.evaluate(async () => {
  const tools = window.__guideScreenshotTools;
  const tool = tools.get('guide_to');
  await tool.execute(
    {
      target: 'upcoming_appointment',
      message: 'Your next appointment is here. I can help you review it without changing anything.',
    },
    { signal: new AbortController().signal },
  );
});
await page.waitForTimeout(700);
await page.screenshot({ path: new URL('guide-presence.png', outputDirectory).pathname });

await browser.close();
