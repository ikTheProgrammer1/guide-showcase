import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type TestTool = {
  execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
  name: string;
};

type SpeechOutcome = 'end' | 'error' | 'pending' | 'unsupported';

async function installSpeechMock(page: Page, outcome: SpeechOutcome) {
  await page.addInitScript((speechOutcome) => {
    const state = {
      cancelCount: 0,
      speakCount: 0,
      highlightVisibleAtSpeak: false,
      messages: [] as string[],
    };
    Object.defineProperty(window, '__guideSpeechTest', { configurable: true, value: state });

    if (speechOutcome === 'unsupported') {
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: undefined });
      return;
    }

    class TestUtterance {
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      rate = 1;
      pitch = 1;

      constructor(public text: string) {}
    }

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: TestUtterance,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel: () => {
          state.cancelCount += 1;
        },
        speak: (utterance: TestUtterance) => {
          state.speakCount += 1;
          state.messages.push(utterance.text);
          state.highlightVisibleAtSpeak = Boolean(document.querySelector('[class*="targetHighlight"]'));
          if (speechOutcome === 'end') window.setTimeout(() => utterance.onend?.(), 80);
          if (speechOutcome === 'error') window.setTimeout(() => utterance.onerror?.(), 80);
        },
      },
    });
  }, outcome);
}

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

async function enableReadAloudManually(page: Page) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Read Guide aloud' }).click();
}

test('points to the reschedule entry point from both home layouts without activating it', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await expect(page.locator('[data-semantic-target="reschedule_button"]')).toBeVisible();

  const legacy = (await callTool(page, 'guide_to', {
    target: 'reschedule_button',
    message: 'The appointment change control is here.',
  })) as { ok: boolean; presentedVisually: boolean };
  expect(legacy).toMatchObject({ ok: true, presentedVisually: true });
  expect((await callTool(page, 'get_portal_state', {}) as { state: { currentSection: string; reschedule: { dialogOpen: boolean } } }).state)
    .toMatchObject({ currentSection: 'home', reschedule: { dialogOpen: false } });

  await callTool(page, 'configure_accessibility', { density: 'simplified' });
  const adapted = (await callTool(page, 'guide_to', {
    target: 'reschedule_button',
    message: 'The appointment change control is here.',
  })) as { ok: boolean; presentedVisually: boolean };
  expect(adapted).toMatchObject({ ok: true, presentedVisually: true });
  expect((await callTool(page, 'get_portal_state', {}) as { state: { currentSection: string; reschedule: { dialogOpen: boolean } } }).state)
    .toMatchObject({ currentSection: 'home', reschedule: { dialogOpen: false } });
});

test('keeps slot selection static and removes dynamic confirmation immediately after commit', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await expect(page.getByRole('status', { name: 'WebMCP status: Guide available' })).toBeVisible();

  expect(await toolNames(page)).toContain('get_portal_state');
  expect(await toolNames(page)).toContain('select_reschedule_slot');
  expect(await toolNames(page)).not.toContain('confirm_reschedule');

  const closed = (await callTool(page, 'select_reschedule_slot', {
    appointmentId: 'appointment_robert_2026_09_10',
    slotId: 'slot_2026_09_14_1500',
  })) as { ok: boolean; error: { code: string; message: string } };
  expect(closed).toMatchObject({
    ok: false,
    error: {
      code: 'chooser_closed',
      message: 'Open the reschedule workflow before selecting a time.',
    },
  });

  await callTool(page, 'open_reschedule', { appointmentId: 'appointment_robert_2026_09_10' });
  await expect(page.getByRole('heading', { name: 'Reschedule your appointment' })).toBeVisible();

  await callTool(page, 'select_reschedule_slot', {
    appointmentId: 'appointment_robert_2026_09_10',
    slotId: 'slot_2026_09_14_1500',
  });
  await expect(page.getByRole('radio', { name: /Monday, September 14/ })).toBeChecked();
  await expect.poll(() => toolNames(page)).toContain('confirm_reschedule');

  await callTool(page, 'confirm_reschedule', {
    appointmentId: 'appointment_robert_2026_09_10',
    slotId: 'slot_2026_09_14_1500',
  });
  await expect(page.getByRole('heading', { name: 'Your new time is confirmed.' })).toBeVisible();
  await expect.poll(() => toolNames(page)).not.toContain('confirm_reschedule');
});

test('keeps a human override as the authoritative shared state', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await callTool(page, 'configure_accessibility', { textScale: 175 });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: '150%' }).click();

  const result = (await callTool(page, 'get_portal_state', {})) as {
    state: { accessibility: { textScale: number }; recentHumanOverrides: Array<{ value: number }> };
  };
  expect(result.state.accessibility.textScale).toBe(150);
  expect(result.state.recentHumanOverrides.at(-1)?.value).toBe(150);
});

test('returns a complete composed accessibility result and waits for visible speech', async ({ page }) => {
  await installSpeechMock(page, 'end');
  await installWebMCP(page);
  await page.goto('/');

  const result = (await callTool(page, 'configure_accessibility', {
    textScale: 175,
    density: 'simplified',
    readAloud: true,
  })) as {
    ok: boolean;
    changed: string[];
    previousAccessibility: { textScale: number; contrast: string };
    accessibility: { textScale: number; contrast: string; density: string; readAloud: boolean };
    interfaceMode: string;
    uiRevision: number;
    presentedVisually: boolean;
    spokenByPage: boolean;
  };

  expect(result).toMatchObject({
    ok: true,
    changed: ['textScale', 'density', 'readAloud'],
    previousAccessibility: { textScale: 100, contrast: 'standard' },
    accessibility: {
      textScale: 175,
      contrast: 'standard',
      density: 'simplified',
      readAloud: true,
    },
    interfaceMode: 'adapted',
    presentedVisually: true,
    spokenByPage: true,
  });
  expect(result.uiRevision).toBeGreaterThan(0);

  const speech = await page.evaluate(() => (
    window as unknown as {
      __guideSpeechTest: { speakCount: number; highlightVisibleAtSpeak: boolean };
    }
  ).__guideSpeechTest);
  expect(speech).toMatchObject({ speakCount: 1, highlightVisibleAtSpeak: true });

  const noOp = (await callTool(page, 'configure_accessibility', { textScale: 175 })) as {
    changed: string[];
    uiRevision: number;
    accessibility: { contrast: string; density: string };
  };
  expect(noOp).toMatchObject({
    changed: [],
    uiRevision: result.uiRevision,
    accessibility: { contrast: 'standard', density: 'simplified' },
  });
});

test('keeps appointment selection valid across accessibility reflow', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await callTool(page, 'open_reschedule', { appointmentId: 'appointment_robert_2026_09_10' });
  await page.getByRole('radio', { name: /Monday, September 14/ }).click();

  const selected = (await callTool(page, 'get_portal_state', {})) as {
    state: { rescheduleRevision: number };
  };
  await callTool(page, 'configure_accessibility', { textScale: 125, density: 'simplified' });
  const adapted = (await callTool(page, 'get_portal_state', {})) as {
    state: { rescheduleRevision: number; reschedule: { selectedSlotId: string | null } };
  };

  expect(adapted.state.rescheduleRevision).toBe(selected.state.rescheduleRevision);
  expect(adapted.state.reschedule.selectedSlotId).toBe('slot_2026_09_14_1500');
  await expect.poll(() => toolNames(page)).toContain('confirm_reschedule');

  const committed = (await callTool(page, 'confirm_reschedule', {
    appointmentId: 'appointment_robert_2026_09_10',
    slotId: 'slot_2026_09_14_1500',
  })) as { ok: boolean; committed: boolean };
  expect(committed).toMatchObject({ ok: true, committed: true });
});

test('points without moving keyboard focus', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Reset demo' }).focus();

  const before = await page.evaluate(() => document.activeElement?.textContent?.trim());
  const result = (await callTool(page, 'guide_to', {
    target: 'appointments_navigation',
    message: 'Appointments are available here.',
  })) as { ok: boolean; activated: boolean; presentedVisually: boolean; spokenByPage: boolean };
  const after = await page.evaluate(() => document.activeElement?.textContent?.trim());

  expect(result).toMatchObject({
    ok: true,
    activated: false,
    presentedVisually: true,
    spokenByPage: false,
  });
  expect(after).toBe(before);
});

test('interrupts pointing when the person navigates but not for accessibility reflow', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');

  const interrupted = await page.evaluate(async () => {
    const tools = (window as unknown as { __guideWebMCPTools: Map<string, TestTool> }).__guideWebMCPTools;
    const execution = tools.get('guide_to')!.execute(
      { target: 'upcoming_appointment', message: 'Your appointment is here.' },
      { signal: new AbortController().signal },
    );
    window.setTimeout(() => {
      const billing = [...document.querySelectorAll<HTMLButtonElement>('button')]
        .find((button) => button.textContent?.trim() === 'Billing');
      billing?.click();
    }, 100);
    return execution;
  }) as { ok: boolean; error: { code: string } };

  expect(interrupted).toMatchObject({ ok: false, error: { code: 'interrupted_by_user' } });
  const state = (await callTool(page, 'get_portal_state', {})) as {
    state: { currentSection: string };
  };
  expect(state.state.currentSection).toBe('billing');
});

test('reports speech errors as a signal without failing the visual action', async ({ page }) => {
  await installSpeechMock(page, 'error');
  await installWebMCP(page);
  await page.goto('/');
  await enableReadAloudManually(page);

  const result = (await callTool(page, 'guide_to', {
    target: 'appointments_navigation',
    message: 'Appointments are available here.',
  })) as { ok: boolean; spokenByPage: boolean };

  expect(result).toMatchObject({ ok: true, spokenByPage: false });
});

test('cancels active webpage speech when tool execution is aborted', async ({ page }) => {
  await installSpeechMock(page, 'pending');
  await installWebMCP(page);
  await page.goto('/');
  await enableReadAloudManually(page);

  const result = await page.evaluate(async () => {
    const tools = (window as unknown as { __guideWebMCPTools: Map<string, TestTool> }).__guideWebMCPTools;
    const speech = (window as unknown as {
      __guideSpeechTest: { speakCount: number; cancelCount: number };
    }).__guideSpeechTest;
    const controller = new AbortController();
    const execution = tools.get('guide_to')!.execute(
      { target: 'appointments_navigation', message: 'This speech will be cancelled.' },
      { signal: controller.signal },
    );
    while (speech.speakCount === 0) await new Promise((resolve) => window.setTimeout(resolve, 10));
    controller.abort();
    const toolResult = await execution;
    return { toolResult, cancelCount: speech.cancelCount };
  }) as { toolResult: { ok: boolean; error: { code: string } }; cancelCount: number };

  expect(result.toolResult).toMatchObject({ ok: false, error: { code: 'cancelled' } });
  expect(result.cancelCount).toBeGreaterThanOrEqual(2);
});

test('falls back cleanly when webpage speech is unsupported', async ({ page }) => {
  await installSpeechMock(page, 'unsupported');
  await installWebMCP(page);
  await page.goto('/');
  await enableReadAloudManually(page);

  const result = (await callTool(page, 'guide_to', {
    target: 'appointments_navigation',
    message: 'This remains visible.',
  })) as { ok: boolean; presentedVisually: boolean; spokenByPage: boolean };

  expect(result).toMatchObject({ ok: true, presentedVisually: true, spokenByPage: false });
});

test('rejects a stale agent confirmation and commits the human selection only', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await callTool(page, 'open_reschedule', { appointmentId: 'appointment_robert_2026_09_10' });
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

test('supports a single-tab-stop reschedule radio group with arrow, Home, and End keys', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Appointments', exact: true }).click();
  await page.getByRole('button', { name: 'Reschedule appointment' }).click();

  const radios = page.getByRole('radio');
  await expect(radios).toHaveCount(3);
  await expect(radios.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(radios.nth(1)).toHaveAttribute('tabindex', '-1');
  await radios.nth(0).focus();
  await page.keyboard.press('End');
  await expect(radios.nth(2)).toBeFocused();
  await expect(radios.nth(2)).toBeChecked();
  await expect(radios.nth(2)).toHaveAttribute('tabindex', '0');

  await page.keyboard.press('Home');
  await expect(radios.nth(0)).toBeFocused();
  await expect(radios.nth(0)).toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(radios.nth(1)).toBeFocused();
  await expect(radios.nth(1)).toBeChecked();
});

test('has no serious accessibility violations across legacy and adapted preferences', async ({ page }, testInfo) => {
  await installWebMCP(page);
  const variants: Array<{ name: string; settings: Record<string, unknown> | null }> = [
    { name: 'legacy', settings: null },
    { name: 'simplified', settings: { density: 'simplified' } },
    { name: 'high-contrast', settings: { contrast: 'high', colorIndependentStatus: true } },
    { name: 'large-controls', settings: { controlSize: 'large' } },
    { name: '200-percent-text', settings: { textScale: 200 } },
  ];

  for (const variant of variants) {
    await page.goto('/');
    if (variant.settings) await callTool(page, 'configure_accessibility', variant.settings);
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content, `${variant.name} should not overflow horizontally`).toBe(dimensions.viewport);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    expect(serious, `${variant.name}: ${JSON.stringify(serious, null, 2)}`).toEqual([]);
  }

  await page.goto('/');
  await callTool(page, 'configure_accessibility', {
    textScale: 175,
    contrast: 'high',
    density: 'simplified',
    controlSize: 'large',
    spacing: 'increased',
    colorIndependentStatus: true,
  });
  await page.screenshot({ path: testInfo.outputPath('guide-adapted.png'), fullPage: true });
});

test('visibly transforms the same Northstar portal from legacy density to adapted clarity', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');

  await expect(page.locator('[data-interface="legacy"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'PATIENT SUMMARY' })).toBeVisible();
  await expect(page.getByText('PAYMENT DUE', { exact: true })).toBeVisible();

  const result = (await callTool(page, 'configure_accessibility', {
    textScale: 175,
    contrast: 'high',
    density: 'simplified',
    controlSize: 'large',
    spacing: 'increased',
    colorIndependentStatus: true,
    emphasizeInteractive: true,
  })) as { ok: boolean; accessibility: { colorIndependentStatus: boolean } };

  expect(result).toMatchObject({ ok: true, accessibility: { colorIndependentStatus: true } });
  await expect(page.locator('[data-interface="adapted"]')).toBeVisible();
  await expect(page.getByText('Interface adapted')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Good afternoon, Robert.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'PATIENT SUMMARY' })).toHaveCount(0);
});
