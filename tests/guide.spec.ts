import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type TestTool = {
  execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
  name: string;
};

async function installWebMCP(page: Page) {
  await page.addInitScript(() => {
    const tools = new Map<string, unknown>();
    const modelContext = {
      registerTool: async (tool: { name: string }, options?: { signal?: AbortSignal }) => {
        tools.set(tool.name, tool);
        options?.signal?.addEventListener('abort', () => tools.delete(tool.name), { once: true });
      },
      getTools: async () => [...tools.values()],
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };
    Object.defineProperty(document, 'modelContext', { configurable: true, value: modelContext });
    Object.defineProperty(window, '__guideWebMCPTools', { configurable: true, value: tools });
  });
}

async function toolNames(page: Page) {
  return page.evaluate(() => [
    ...(window as unknown as { __guideWebMCPTools: Map<string, TestTool> }).__guideWebMCPTools.keys(),
  ]);
}

async function callTool(page: Page, name: string, input: Record<string, unknown>) {
  return page.evaluate(
    async ({ toolName, toolInput }) => {
      const tools = (window as unknown as { __guideWebMCPTools: Map<string, TestTool> }).__guideWebMCPTools;
      const tool = tools.get(toolName);
      if (!tool) throw new Error(`Missing tool: ${toolName}`);
      return tool.execute(toolInput, { signal: new AbortController().signal });
    },
    { toolName: name, toolInput: input },
  );
}

test('discovers semantic tools and adds workflow tools dynamically', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await expect(page.getByRole('status', { name: 'WebMCP status: Guide connected' })).toBeVisible();

  expect(await toolNames(page)).toContain('get_portal_state');
  expect(await toolNames(page)).not.toContain('select_reschedule_slot');

  await callTool(page, 'get_reschedule_options', { appointmentId: 'appointment_robert_2026_09_10' });
  await expect(page.getByRole('heading', { name: 'Reschedule your appointment' })).toBeVisible();
  await expect.poll(() => toolNames(page)).toContain('select_reschedule_slot');

  await callTool(page, 'select_reschedule_slot', {
    appointmentId: 'appointment_robert_2026_09_10',
    slotId: 'slot_2026_09_14_1500',
  });
  await expect(page.getByRole('radio', { name: /Monday, September 14/ })).toBeChecked();
  await expect.poll(() => toolNames(page)).toContain('confirm_reschedule');
});

test('keeps a human override as the authoritative shared state', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await callTool(page, 'configure_accessibility', { textScale: 175 });
  await page.getByRole('button', { name: '150%' }).click();

  const result = (await callTool(page, 'get_portal_state', {})) as {
    state: { accessibility: { textScale: number }; recentHumanOverrides: Array<{ value: number }> };
  };
  expect(result.state.accessibility.textScale).toBe(150);
  expect(result.state.recentHumanOverrides.at(-1)?.value).toBe(150);
});

test('rejects a stale agent confirmation and commits the human selection only', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await callTool(page, 'get_reschedule_options', { appointmentId: 'appointment_robert_2026_09_10' });
  await callTool(page, 'select_reschedule_slot', {
    appointmentId: 'appointment_robert_2026_09_10',
    slotId: 'slot_2026_09_12_1130',
  });
  await page.getByRole('radio', { name: /Monday, September 14/ }).click();

  const stale = (await callTool(page, 'confirm_reschedule', {
    appointmentId: 'appointment_robert_2026_09_10',
    slotId: 'slot_2026_09_12_1130',
  })) as { ok: boolean; error: { code: string } };
  expect(stale).toMatchObject({ ok: false, error: { code: 'selection_changed' } });

  const committed = (await callTool(page, 'confirm_reschedule', {
    appointmentId: 'appointment_robert_2026_09_10',
    slotId: 'slot_2026_09_14_1500',
  })) as { ok: boolean; committed: boolean };
  expect(committed).toMatchObject({ ok: true, committed: true });
  await expect(page.getByRole('heading', { name: 'Your new time is confirmed.' })).toBeVisible();
});

test('shows an honest fallback without WebMCP', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Portal preview mode.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Appointments', exact: true })).toBeEnabled();
});

test('has no serious accessibility violations in adapted mode', async ({ page }, testInfo) => {
  await installWebMCP(page);
  await page.goto('/');
  await callTool(page, 'configure_accessibility', {
    textScale: 200,
    contrast: 'high',
    density: 'simplified',
    controlSize: 'large',
    spacing: 'increased',
  });

  await expect(page.getByRole('heading', { name: /Everything important/ })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBe(dimensions.viewport);
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('guide-adapted.png'), fullPage: true });
});
