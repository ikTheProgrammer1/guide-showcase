import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePortalStore } from '../state/portalStore';
import { GUIDE_SPEECH_TIMEOUT_MS, speakGuideMessage } from './presenceController';

class MockUtterance {
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  rate = 1;
  pitch = 1;

  constructor(public text: string) {}
}

describe('Guide speech presentation', () => {
  let currentUtterance: MockUtterance | null;
  const cancel = vi.fn();
  const speak = vi.fn((utterance: MockUtterance) => {
    currentUtterance = utterance;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    currentUtterance = null;
    cancel.mockClear();
    speak.mockClear();
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
    vi.stubGlobal('speechSynthesis', { cancel, speak });
    usePortalStore.getState().resetDemo();
    usePortalStore.getState().setAccessibility({ readAloud: true }, 'you');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('waits for the utterance to end and cancels prior Guide speech first', async () => {
    const result = speakGuideMessage('Appointment controls are here.');

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(currentUtterance?.text).toBe('Appointment controls are here.');
    currentUtterance?.onend?.();

    await expect(result).resolves.toBe(true);
  });

  it('settles previous speech as false before beginning another message', async () => {
    const first = speakGuideMessage('First message');
    const second = speakGuideMessage('Second message');

    await expect(first).resolves.toBe(false);
    expect(cancel).toHaveBeenCalledTimes(2);
    currentUtterance?.onend?.();
    await expect(second).resolves.toBe(true);
  });

  it('cancels and resolves false after the 25 second timeout', async () => {
    const result = speakGuideMessage('A message that never finishes.');
    await vi.advanceTimersByTimeAsync(GUIDE_SPEECH_TIMEOUT_MS);

    await expect(result).resolves.toBe(false);
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it('cancels and resolves false when execution is aborted', async () => {
    const controller = new AbortController();
    const result = speakGuideMessage('A cancelled message.', controller.signal);
    controller.abort();

    await expect(result).resolves.toBe(false);
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it('resolves false on synthesis errors or when read-aloud is disabled', async () => {
    const failed = speakGuideMessage('A failed message.');
    currentUtterance?.onerror?.();
    await expect(failed).resolves.toBe(false);

    usePortalStore.getState().setAccessibility({ readAloud: false }, 'you');
    await expect(speakGuideMessage('A disabled message.')).resolves.toBe(false);
  });
});
