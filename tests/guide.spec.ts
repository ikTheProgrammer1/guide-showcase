import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type TestTool = {
  execute: (input: Record<string, unknown>, options?: { signal: AbortSignal }) => Promise<unknown>;
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

async function callToolWithoutOptions(page: Page, name: string, input: Record<string, unknown>) {
  return page.evaluate(
    async ({ toolName, toolInput }) => {
      const tools = (window as unknown as { __guideWebMCPTools: Map<string, TestTool> }).__guideWebMCPTools;
      const tool = tools.get(toolName);
      if (!tool) throw new Error(`Missing tool: ${toolName}`);
      return tool.execute(toolInput);
    },
    { toolName: name, toolInput: input },
  );
}

const rememberedPreferencesKey = 'northstar.functional-preferences.v1';

async function expectLegacyBaseline(page: Page) {
  const app = page.locator('[data-personalized="false"]');
  await expect(app).toBeVisible();
  await expect(page.getByText('Interface personalized')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Additional patient services' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Primary care visit' })).toBeVisible();
  await expect(page.locator('[data-adaptation-region="appointment_actions"]')).toHaveAttribute('data-label-style', 'concise');
  await expect(page.locator('[data-adaptation-region="status_indicators"]')).toHaveAttribute('data-status-presentation', 'color-and-text');

  const presentation = await page.getByRole('button', { name: 'Reschedule appointment' }).evaluate((element) => ({
    fontFamily: getComputedStyle(element.closest('[data-personalized]')!).fontFamily,
    height: element.getBoundingClientRect().height,
    label: element.textContent?.trim(),
  }));
  expect(presentation.fontFamily).toContain('Tahoma');
  expect(presentation.height).toBeLessThanOrEqual(36);
  expect(presentation.label).toBe('MODIFY APPT');
}

async function approvePointerCalibration(page: Page, remember: boolean) {
  await page.getByRole('button', { name: 'Personalize interface' }).click();
  await page.getByRole('button', { name: /Calibrate pointer precision/ }).click();
  const practice = page.getByRole('button', { name: 'Practice appointment' });
  for (let attempt = 0; attempt < 6; attempt += 1) await practice.click();
  await expect(page.getByRole('heading', { name: 'Does this feel comfortable?' })).toBeVisible();
  await page.getByRole('button', { name: 'Larger' }).click();
  await page.getByRole('button', { name: 'Farther apart' }).click();
  if (remember) await page.getByRole('checkbox', { name: /Remember these preferences/ }).check();
  await page.getByRole('button', { name: /This feels comfortable/ }).click();
  await expect(page.getByRole('heading', { name: 'Reschedule your appointment' })).toBeVisible();
  await expect(page.locator('[data-personalized="true"]')).toBeVisible();
}

async function enableReadAloudManually(page: Page) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Read Guide aloud' }).click();
}

async function selectBarrier(page: Page, category: string, name: string, simulationId: string) {
  const trigger = page.getByRole('button', { name: 'Simulate a barrier' });
  await trigger.click();
  await page.getByRole('button', { name: category, exact: true }).click();
  await page.getByRole('button', { name }).click();
  await expect(page.locator(`[data-simulation="${simulationId}"]`)).toBeVisible();
  await expect(trigger).toBeFocused();
}

async function stopBarrier(page: Page) {
  await page.getByRole('button', { name: 'Stop simulation' }).click();
  await expect(page.locator('[data-simulation="none"]')).toBeVisible();
}

test('fresh browser context renders the approved dense legacy baseline', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');

  expect(await page.evaluate((key) => window.localStorage.getItem(key), rememberedPreferencesKey)).toBeNull();
  await expectLegacyBaseline(page);
});

test('approved non-persisted adaptation returns to legacy after reload', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await approvePointerCalibration(page, false);

  expect(await page.evaluate((key) => window.localStorage.getItem(key), rememberedPreferencesKey)).toBeNull();
  await page.reload();
  await expectLegacyBaseline(page);
});

test('explicitly remembered profile restores the personalized interface after reload', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await approvePointerCalibration(page, true);

  const remembered = await page.evaluate((key) => window.localStorage.getItem(key), rememberedPreferencesKey);
  expect(remembered).not.toBeNull();
  expect(JSON.parse(remembered!)).toMatchObject({
    version: 1,
    profile: {
      version: 1,
      input: { minimumTargetSize: 44, minimumControlGap: 16 },
    },
  });

  await page.reload();
  await expect(page.locator('[data-personalized="true"]')).toBeVisible();
  await expect(page.getByText('Interface personalized')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reschedule appointment' })).toContainText('Reschedule appointment');
  await expect(page.locator('[data-adaptation-region="appointment_actions"]')).toHaveCSS('--region-target-size', '44px');
  const restoredHeight = await page.getByRole('button', { name: 'Reschedule appointment' }).evaluate(
    (element) => element.getBoundingClientRect().height,
  );
  expect(restoredHeight).toBeGreaterThan(40);
});

test('Reset Demo removes persisted personalization and immediately restores legacy', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await approvePointerCalibration(page, true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Reschedule your appointment' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();

  expect(await page.evaluate((key) => window.localStorage.getItem(key), rememberedPreferencesKey)).toBeNull();
  await expectLegacyBaseline(page);
  await expect(page.locator('[data-simulation="none"]')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const resetState = await callTool(page, 'get_portal_state', {}) as {
    state: {
      appointment: { date: string; time: string };
      currentSection: string;
      personalization: { functionalProfile: unknown; componentOverrides: Record<string, unknown>; rememberPreferences: boolean };
      reschedule: { phase: string; selectedSlotId: string | null };
    };
  };
  expect(resetState.state).toMatchObject({
    appointment: { date: '2026-09-10', time: '2:30 PM' },
    currentSection: 'home',
    personalization: { functionalProfile: null, componentOverrides: {}, rememberPreferences: false },
    reschedule: { phase: 'idle', selectedSlotId: null },
  });

  await page.reload();
  await expectLegacyBaseline(page);
});

test('points to the reschedule entry point before and after composition without activating it', async ({ page }) => {
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
  await expect(page.getByRole('heading', { name: 'Review your appointment change' })).toBeVisible();
  await expect(page.locator('[data-new="true"]')).toContainText('September 14, 2026');
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
  await page.getByRole('button', { name: 'Back to times' }).click();
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

test('loads the appointments section from its direct route', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/appointments');
  await expect(page.getByRole('heading', { name: 'Upcoming appointments' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Appointments', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('supports a single-tab-stop reschedule radio group with arrow, Home, and End keys', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Appointments', exact: true }).click();
  await page.getByRole('button', { name: 'Reschedule appointment' }).click();
  await expect(page.getByRole('heading', { name: 'Reschedule your appointment' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio', { name: /Friday, September 11/ })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Close reschedule dialog' })).toBeFocused();
  await page.getByRole('heading', { name: 'Reschedule your appointment' }).focus();
  await page.keyboard.press('Tab');

  const radios = page.getByRole('radio');
  await expect(radios).toHaveCount(3);
  await expect(radios.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(radios.nth(1)).toHaveAttribute('tabindex', '-1');
  await radios.nth(0).focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('heading', { name: 'Review your appointment change' })).toBeFocused();
  await expect(page.locator('[data-new="true"]')).toContainText('September 14, 2026');

  await page.getByRole('button', { name: 'Back to times' }).click();
  await expect(page.getByRole('heading', { name: 'Reschedule your appointment' })).toBeFocused();
  const reopenedRadios = page.getByRole('radio');
  await reopenedRadios.nth(0).focus();
  await page.keyboard.press('Home');
  await expect(page.locator('[data-new="true"]')).toContainText('September 11, 2026');

  await page.getByRole('button', { name: 'Back to times' }).click();
  await expect(page.getByRole('heading', { name: 'Reschedule your appointment' })).toBeFocused();
  await page.getByRole('radio').nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-new="true"]')).toContainText('September 12, 2026');
  await page.getByRole('button', { name: 'Confirm new time' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Your new time is confirmed.' })).toBeFocused();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: 'Reschedule appointment' })).toBeFocused();
});

test('offers one bounded manual personalization entry point with region-specific controls', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');

  const trigger = page.getByRole('button', { name: 'Personalize interface' });
  await trigger.click();
  await expect(page.getByRole('heading', { name: 'Personalize the interface' })).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Interface regions' }).getByRole('button')).toHaveCount(6);
  await page.getByRole('button', { name: /Statuses/ }).click();
  await expect(page.getByRole('group', { name: 'Status presentation' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Minimum control size' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Icon, shape, and text' }).click();
  await expect(page.locator('[data-adaptation-region="status_indicators"]')).toHaveAttribute('data-status-presentation', 'icon-shape-text');

  const dialog = page.getByRole('dialog', { name: 'Personalize the interface' });
  await expect(dialog.locator('input[type="text"], textarea, [contenteditable="true"]')).toHaveCount(0);
  await expect(dialog).not.toContainText(/selector|CSS|HTML|coordinate|DOM manipulation/i);
  await page.getByRole('button', { name: 'Close interface personalization' }).click();
  await expect(trigger).toBeFocused();
});

test('supports keyboard-only local calibration and restores focus when stopped', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');

  const trigger = page.getByRole('button', { name: 'Personalize interface' });
  await trigger.click();
  await page.getByRole('button', { name: /Calibrate pointer precision/ }).click();
  const calibrationDialog = page.getByRole('dialog', { name: 'Let’s find controls that feel easier to select' });
  await expect(page.getByRole('heading', { name: 'Let’s find controls that feel easier to select' })).toBeFocused();
  await expect(calibrationDialog.getByRole('button', { name: 'Reset demo' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(calibrationDialog.getByRole('button', { name: 'Close calibration' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(calibrationDialog.getByRole('button', { name: 'Stop calibration' })).toBeFocused();

  const practice = page.getByRole('button', { name: 'Practice appointment' });
  await practice.focus();
  for (let attempt = 0; attempt < 6; attempt += 1) await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Does this feel comfortable?' })).toBeVisible();

  await page.waitForTimeout(600);
  const axe = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Does this feel comfortable?' })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('opens safe calibration when the WebMCP bridge omits execution options', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');

  const result = await callToolWithoutOptions(page, 'start_interface_calibration', {
    domain: 'pointer_precision',
    goal: 'reschedule_appointment',
  }) as { ok: boolean; phase: string; presentedVisually: boolean };

  expect(result).toMatchObject({
    ok: true,
    phase: 'target-size',
    presentedVisually: true,
  });
  await expect(page.getByRole('heading', { name: 'Let’s find controls that feel easier to select' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Practice appointment' })).toBeVisible();
});

test('has no serious accessibility violations across baseline and personalized preferences', async ({ page }, testInfo) => {
  await installWebMCP(page);
  const variants: Array<{ name: string; settings: Record<string, unknown> | null }> = [
    { name: 'baseline', settings: null },
    { name: 'simplified', settings: { density: 'simplified' } },
    { name: 'high-contrast', settings: { contrast: 'high', colorIndependentStatus: true } },
    { name: 'large-controls', settings: { controlSize: 'large' } },
    { name: '200-percent-text', settings: { textScale: 200 } },
  ];

  for (const variant of variants) {
    await page.goto('/');
    if (variant.settings) await callTool(page, 'configure_accessibility', variant.settings);
    await page.waitForTimeout(350);
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

test('composes independent regions without replacing the semantic component tree', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');

  await expect(page.locator('[data-personalized="false"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Primary care visit' })).toBeVisible();
  const appointmentControl = page.getByRole('button', { name: 'Reschedule appointment' });
  await appointmentControl.evaluate((element) => { element.dataset.treeMarker = 'preserved'; });

  const result = (await callTool(page, 'configure_accessibility', {
    controlSize: 'large',
    colorIndependentStatus: true,
  })) as { ok: boolean; accessibility: { colorIndependentStatus: boolean } };

  expect(result).toMatchObject({ ok: true, accessibility: { colorIndependentStatus: true } });
  await expect(page.locator('[data-personalized="true"]')).toBeVisible();
  await expect(page.getByText('Interface personalized')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Primary care visit' })).toBeVisible();
  await expect(appointmentControl).toHaveAttribute('data-tree-marker', 'preserved');
  await expect(page.locator('[data-adaptation-region="appointment_actions"]')).toHaveCSS('--region-target-size', '56px');
  await expect(page.locator('[data-adaptation-region="status_indicators"]')).toHaveAttribute('data-status-presentation', 'icon-shape-text');
  await expect(page.locator('[data-interface]')).toHaveCount(0);
});

test('exposes the exact deliberate simulator hierarchy with focus-safe dismissal', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');

  const trigger = page.getByRole('button', { name: 'Simulate a barrier' });
  await trigger.focus();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  const sight = page.getByRole('button', { name: 'Sight', exact: true });
  await sight.focus();
  await expect(sight).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Space');
  await expect(sight).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: 'Total color blindness' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Yellow–Blue color blindness' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Red–Green color blindness' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Far-sightedness' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tunnel vision' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sunshine' })).toBeVisible();

  await page.getByRole('button', { name: 'Read and write', exact: true }).click();
  await expect(sight).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'Dyslexia, illustrative simulation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Small vocabulary' })).toBeVisible();
  await page.getByRole('button', { name: 'Concentration', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Concentration difficulty, illustrative simulation' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();

  const results = await new AxeBuilder({ page }).include('[data-simulation-exempt="true"]').analyze();
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  expect(serious).toEqual([]);
});

test('keeps every simulation reversible and the simulator controls crisp', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  const originalCopy = await page.locator('#portal-content').textContent();
  const cases = [
    ['Sight', 'Total color blindness', 'total-color-blindness'],
    ['Sight', 'Yellow–Blue color blindness', 'yellow-blue-color-blindness'],
    ['Sight', 'Red–Green color blindness', 'red-green-color-blindness'],
    ['Sight', 'Far-sightedness', 'far-sightedness'],
    ['Sight', 'Tunnel vision', 'tunnel-vision'],
    ['Sight', 'Sunshine', 'sunshine'],
    ['Mobility', 'Parkinson’s', 'parkinsons'],
    ['Read and write', 'Dyslexia, illustrative simulation', 'dyslexia'],
    ['Read and write', 'Small vocabulary', 'small-vocabulary'],
    ['Concentration', 'Concentration difficulty, illustrative simulation', 'concentration-difficulty'],
  ] as const;

  for (const [category, name, simulationId] of cases) {
    await selectBarrier(page, category, name, simulationId);
    await expect(page.getByLabel('Active illustrative simulation')).toBeVisible();
    await expect(page.getByText('This approximates one interaction barrier for demonstration. Disability experiences vary, and simulation does not replace testing with disabled people.')).toBeVisible();
    await expect(page.locator('[data-simulation-exempt="true"]')).toHaveCSS('filter', 'none');

    if (simulationId === 'tunnel-vision') await expect(page.locator('[class*="tunnelOverlay"]')).toBeVisible();
    if (simulationId === 'sunshine') await expect(page.locator('[class*="sunshineOverlay"]')).toBeVisible();
    if (simulationId === 'dyslexia') expect(await page.locator('#portal-content').textContent()).toBe(originalCopy);
    if (simulationId === 'small-vocabulary') {
      await expect(page.getByText('unfamiliar term').first()).toBeVisible();
      await expect(page.locator('[class*="jargonOriginal"]').first()).toContainText(/MRN|PCP/);
    }

    await stopBarrier(page);
    await expect(page.locator('[class*="tunnelOverlay"], [class*="sunshineOverlay"], [class*="simulatedCursor"], [class*="missedTarget"]')).toHaveCount(0);
    await expect(page.locator('[data-simulation-surface="true"]').first()).toHaveCSS('filter', 'none');
  }
});

test('does not expose simulation state or alter WebMCP discovery', async ({ page }) => {
  await installWebMCP(page);
  await page.goto('/');
  await expect(page.getByRole('status', { name: 'WebMCP status: Guide available' })).toBeVisible();

  const namesBefore = (await toolNames(page)).sort();
  const stateBefore = await callTool(page, 'get_portal_state', {});
  await selectBarrier(page, 'Mobility', 'Parkinson’s', 'parkinsons');
  const namesDuring = (await toolNames(page)).sort();
  const stateDuring = await callTool(page, 'get_portal_state', {});

  expect(namesDuring).toEqual(namesBefore);
  expect(namesDuring).toHaveLength(11);
  expect(namesDuring.every((name) => !name.includes('simulation'))).toBe(true);
  expect(stateDuring).toEqual(stateBefore);
  expect(JSON.stringify(stateDuring)).not.toContain('parkinsons');
});

test('runs the complete Parkinson’s hero flow through calibration, human choice, Guide confirmation, and Undo', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'Fine-pointer acquisition is covered in the desktop project.');
  await installWebMCP(page);
  await page.goto('/');
  await selectBarrier(page, 'Mobility', 'Parkinson’s', 'parkinsons');
  await page.evaluate(() => { window.__guideSimulationTestElapsedMs = 495; });

  const baselineButton = page.getByRole('button', { name: 'Reschedule appointment' });
  const baselineBox = await baselineButton.boundingBox();
  expect(baselineBox).not.toBeNull();
  const baselineCenter = { x: baselineBox!.x + baselineBox!.width / 2, y: baselineBox!.y + baselineBox!.height / 2 };
  const baselineHits = await page.evaluate(({ x, y }) => {
    const actionable = 'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[role="button"]:not([aria-disabled="true"]),[role="radio"]:not([aria-disabled="true"]),[role="link"]:not([aria-disabled="true"])';
    const physical = document.elementFromPoint(x, y)?.closest(actionable);
    const displaced = document.elementFromPoint(x - 0.7661712126857743, y + 16.24802106648383)?.closest(actionable);
    return { physical: physical?.textContent?.trim(), displaced: displaced?.textContent?.trim(), same: physical === displaced };
  }, baselineCenter);
  expect(baselineHits.physical).toBe('MODIFY APPT');
  expect(baselineHits.same).toBe(false);

  await page.mouse.click(baselineCenter.x, baselineCenter.y);
  await expect(page.getByText('Missed target')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Primary care visit' })).toBeVisible();

  const started = await callTool(page, 'start_interface_calibration', {
    domain: 'pointer_precision',
    goal: 'reschedule_appointment',
  }) as { ok: boolean; localPractice: boolean; phase: string; profileApplied: boolean };
  expect(started).toMatchObject({ ok: true, localPractice: true, phase: 'target-size', profileApplied: false });
  await expect(page.getByRole('heading', { name: 'Let’s find controls that feel easier to select' })).toBeFocused();

  const practice = page.getByRole('button', { name: 'Practice appointment' });
  let practiceBox = await practice.boundingBox();
  expect(practiceBox).not.toBeNull();
  await page.mouse.click(practiceBox!.x + practiceBox!.width / 2, practiceBox!.y + practiceBox!.height - 2);
  await expect(page.getByText(/made the target 44px tall/i)).toBeVisible();
  await expect(page.getByText('Missed target')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('parkinsons-calibration-miss.png'), fullPage: true });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    practiceBox = await practice.boundingBox();
    await page.mouse.click(practiceBox!.x + practiceBox!.width / 2, practiceBox!.y + practiceBox!.height / 2);
  }
  await expect(page.getByText('Now try the spacing')).toBeVisible();

  practiceBox = await practice.boundingBox();
  await page.mouse.click(practiceBox!.x + practiceBox!.width / 2, practiceBox!.y + practiceBox!.height - 2);
  await expect(page.getByText(/moved the controls 16px apart/i)).toBeVisible();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    practiceBox = await practice.boundingBox();
    await page.mouse.click(practiceBox!.x + practiceBox!.width / 2, practiceBox!.y + practiceBox!.height / 2);
  }
  await expect(page.getByRole('heading', { name: 'Does this feel comfortable?' })).toBeFocused();
  await page.getByRole('checkbox', { name: /Remember these preferences/ }).focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: /This feels comfortable/ }).focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Reschedule your appointment' })).toBeVisible();
  const composedState = await callTool(page, 'get_portal_state', {}) as {
    state: {
      appointment: { date: string };
      reschedule: { phase: string; selectedSlotId: string | null };
      personalization: { functionalProfile: { input: { minimumTargetSize: number; minimumControlGap: number } } };
    };
  };
  expect(composedState.state).toMatchObject({
    appointment: { date: '2026-09-10' },
    reschedule: { phase: 'choosing', selectedSlotId: null },
    personalization: { functionalProfile: { input: { minimumTargetSize: 44, minimumControlGap: 16 } } },
  });
  expect(JSON.stringify(composedState)).not.toMatch(/parkinson|simulation|missDistance|coordinates|aggregates/i);
  await expect(page.locator('[data-adaptation-region="forms"]')).toHaveCSS('--region-target-size', '44px');
  await expect(page.locator('[data-adaptation-region="forms"]')).toHaveCSS('--region-control-gap', '16px');
  const firstSlotBox = await page.getByRole('radio').first().boundingBox();
  expect(firstSlotBox!.height).toBeGreaterThanOrEqual(44);

  await page.getByRole('radio', { name: /Monday, September 14/ }).click();
  await expect.poll(() => toolNames(page)).toContain('confirm_reschedule');
  await callTool(page, 'confirm_reschedule', {
    appointmentId: 'appointment_robert_2026_09_10',
    slotId: 'slot_2026_09_14_1500',
  });
  await expect(page.getByRole('heading', { name: 'Your new time is confirmed.' })).toBeVisible();
  await expect.poll(() => toolNames(page)).not.toContain('confirm_reschedule');
  await page.getByRole('button', { name: 'Undo change' }).click();
  await expect(page.getByRole('heading', { name: 'Your previous time was restored.' })).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();
  await stopBarrier(page);
});

test('keeps Guide focus-safe and substitutes static effects for reduced motion', async ({ page }) => {
  await installWebMCP(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await selectBarrier(page, 'Concentration', 'Concentration difficulty, illustrative simulation', 'concentration-difficulty');
  await expect(page.locator('[class*="unifiedStatusCard"]').nth(1)).toHaveCSS('animation-name', 'none');
  await stopBarrier(page);

  await page.getByRole('button', { name: 'Personalize interface' }).click();
  await page.getByRole('button', { name: /Calibrate pointer precision/ }).click();
  const reducedTransition = await page.getByRole('button', { name: 'Practice appointment' }).evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).transitionDuration),
  );
  expect(reducedTransition).toBeLessThanOrEqual(0.001);
  await page.getByRole('button', { name: 'Stop calibration' }).click();

  await selectBarrier(page, 'Sight', 'Tunnel vision', 'tunnel-vision');
  await page.getByRole('button', { name: 'Reset demo' }).focus();
  const before = await page.evaluate(() => document.activeElement?.textContent?.trim());
  await callTool(page, 'guide_to', { target: 'upcoming_appointment', message: 'The appointment is here.' });
  const after = await page.evaluate(() => document.activeElement?.textContent?.trim());
  expect(after).toBe(before);
  await expect(page.locator('[class*="agentLayer"]')).toHaveCSS('filter', 'none');
  await expect(page.locator('[class*="agentLayer"]')).toHaveCSS('pointer-events', 'none');
});

test('keeps simulator controls usable at 200% text and supports touch activation', async ({ page }, testInfo) => {
  await installWebMCP(page);
  await page.goto('/');
  await callTool(page, 'configure_accessibility', { textScale: 200 });
  await page.locator('[class*="agentPointer"]').waitFor({ state: 'detached', timeout: 8_000 });

  const tapOrClick = async (locator: ReturnType<Page['getByRole']>) => {
    if (testInfo.project.name === 'mobile-chromium') {
      await locator.scrollIntoViewIfNeeded();
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
    } else {
      await locator.click();
    }
  };

  await tapOrClick(page.getByRole('button', { name: 'Simulate a barrier' }));
  await expect(page.getByRole('button', { name: 'Simulate a barrier' })).toHaveAttribute('aria-expanded', 'true');
  await tapOrClick(page.getByRole('button', { name: 'Mobility', exact: true }));
  await tapOrClick(page.getByRole('button', { name: 'Parkinson’s' }));
  await expect(page.locator('[data-simulation="parkinsons"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stop simulation' })).toBeVisible();

  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBe(dimensions.viewport);
  await tapOrClick(page.getByRole('button', { name: 'Stop simulation' }));
  await expect(page.locator('[data-simulation="none"]')).toBeVisible();

  await tapOrClick(page.getByRole('button', { name: 'Personalize interface' }));
  await tapOrClick(page.getByRole('button', { name: /Calibrate pointer precision/ }));
  await expect(page.getByRole('button', { name: 'Practice appointment' })).toBeVisible();
  const calibrationDimensions = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
  expect(calibrationDimensions.content).toBe(calibrationDimensions.viewport);
  await expect(page.getByRole('button', { name: 'Stop calibration' })).toBeVisible();
});
