import { usePortalStore } from '../state/portalStore';
import type { AgentStatus, SemanticTarget } from '../types';
import { getTargetElement, getTargetRect } from './targetRegistry';

export type GuideActionCode =
  | 'cancelled'
  | 'interrupted_by_user'
  | 'target_not_visible'
  | 'action_rejected';

export interface GuideActionResult {
  ok: boolean;
  code?: GuideActionCode;
  presentedVisually: boolean;
  spokenByPage: boolean;
}

interface GuideActionOptions {
  target: SemanticTarget;
  message: string;
  signal?: AbortSignal;
  beforeActionStatus?: AgentStatus;
  actionTiming?: 'after-presence' | 'before-presence';
  action?: () => boolean | void | Promise<boolean | void>;
}

let sequence: Promise<unknown> = Promise.resolve();
let hideTimer: number | null = null;
let cancellationGeneration = 0;
let settleActiveSpeech: ((spoken: boolean) => void) | null = null;

export const GUIDE_SPEECH_TIMEOUT_MS = 25_000;

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function wait(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) return Promise.resolve(false);
  if (reducedMotion()) return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', cancel);
      resolve(true);
    }, ms);
    const cancel = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      resolve(false);
    };
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

async function findVisibleTarget(target: SemanticTarget) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const element = getTargetElement(target);
    if (element) return element;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  return null;
}

async function afterPaint() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function pointerPosition(target: SemanticTarget) {
  const rect = getTargetRect(target);
  if (!rect) return null;
  const x = Math.min(Math.max(rect.right - Math.min(rect.width * 0.16, 28), 28), window.innerWidth - 28);
  const y = Math.min(Math.max(rect.top + Math.min(rect.height * 0.42, 32), 28), window.innerHeight - 28);
  return { x, y };
}

function cancelGuideSpeech() {
  window.speechSynthesis?.cancel();
  settleActiveSpeech?.(false);
  settleActiveSpeech = null;
}

export function speakGuideMessage(message: string, signal?: AbortSignal): Promise<boolean> {
  const { readAloud } = usePortalStore.getState().accessibility;
  if (
    !readAloud ||
    typeof window.speechSynthesis?.speak !== 'function' ||
    typeof window.SpeechSynthesisUtterance !== 'function'
  ) {
    return Promise.resolve(false);
  }

  cancelGuideSpeech();
  if (signal?.aborted) return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.92;
    utterance.pitch = 1.03;
    let settled = false;

    const finish = (spoken: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
      utterance.onend = null;
      utterance.onerror = null;
      if (settleActiveSpeech === finish) settleActiveSpeech = null;
      resolve(spoken);
    };
    const abort = () => {
      window.speechSynthesis.cancel();
      finish(false);
    };
    const timeout = window.setTimeout(() => {
      window.speechSynthesis.cancel();
      finish(false);
    }, GUIDE_SPEECH_TIMEOUT_MS);

    settleActiveSpeech = finish;
    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(false);
    signal?.addEventListener('abort', abort, { once: true });
    window.speechSynthesis.speak(utterance);
  });
}

function hidePresenceLater(operationId: number) {
  if (hideTimer !== null) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    const store = usePortalStore.getState();
    if (store.agentPresence.operationId !== operationId) return;
    store.setAgentPresence({
      visible: false,
      status: 'hidden',
      target: null,
      message: null,
      position: null,
    });
  }, reducedMotion() ? 1600 : 3600);
}

function failedGuideAction(code: GuideActionCode): GuideActionResult {
  return { ok: false, code, presentedVisually: false, spokenByPage: false };
}

function sequenceCancelled(generation: number, signal?: AbortSignal) {
  return generation !== cancellationGeneration || signal?.aborted === true;
}

async function performGuideAction(
  options: GuideActionOptions,
  generation: number,
): Promise<GuideActionResult> {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }

  const store = usePortalStore.getState();
  const startNavigationRevision = store.navigationRevision;
  const operationId = store.agentPresence.operationId + 1;

  if (options.actionTiming === 'before-presence' && options.action) {
    const targetElement = await findVisibleTarget(options.target);
    if (!targetElement) return failedGuideAction('target_not_visible');

    const ready = await wait(120, options.signal);
    if (!ready || sequenceCancelled(generation, options.signal)) {
      return failedGuideAction('cancelled');
    }
    if (usePortalStore.getState().navigationRevision !== startNavigationRevision) {
      return failedGuideAction('interrupted_by_user');
    }

    const accepted = await options.action();
    if (accepted === false) return failedGuideAction('action_rejected');

    const settled = await wait(reducedMotion() ? 0 : 620, options.signal);
    if (!settled || sequenceCancelled(generation, options.signal)) {
      return { ok: true, presentedVisually: false, spokenByPage: false };
    }
    if (usePortalStore.getState().navigationRevision !== startNavigationRevision) {
      return { ok: true, presentedVisually: false, spokenByPage: false };
    }
    const updatedTarget = await findVisibleTarget(options.target);
    if (!updatedTarget) return { ok: true, presentedVisually: false, spokenByPage: false };
    updatedTarget.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
    store.setAgentPresence({
      visible: true,
      target: options.target,
      message: options.message,
      status: 'highlighting',
      operationId,
      position: pointerPosition(options.target),
    });
    await afterPaint();
    const spokenByPage = await speakGuideMessage(options.message, options.signal);
    store.setAgentPresence({ status: 'complete' });
    hidePresenceLater(operationId);
    return { ok: true, presentedVisually: true, spokenByPage };
  }

  store.setAgentPresence({
    visible: true,
    target: options.target,
    message: options.message,
    status: 'appearing',
    operationId,
  });

  const targetElement = await findVisibleTarget(options.target);
  if (!targetElement) {
    store.setAgentPresence({ visible: false, status: 'hidden', target: null, message: null });
    return failedGuideAction('target_not_visible');
  }

  targetElement.scrollIntoView({
    behavior: reducedMotion() ? 'auto' : 'smooth',
    block: 'center',
    inline: 'nearest',
  });
  const positioned = await wait(90, options.signal);
  if (!positioned || sequenceCancelled(generation, options.signal)) {
    store.setAgentPresence({ visible: false, status: 'hidden' });
    return failedGuideAction('cancelled');
  }
  if (usePortalStore.getState().navigationRevision !== startNavigationRevision) {
    store.setAgentPresence({ visible: false, status: 'hidden' });
    return failedGuideAction('interrupted_by_user');
  }

  const position = pointerPosition(options.target);
  store.setAgentPresence({ status: 'moving', position });
  const moved = await wait(520, options.signal);
  if (!moved || sequenceCancelled(generation, options.signal)) {
    store.setAgentPresence({ visible: false, status: 'hidden' });
    return failedGuideAction('cancelled');
  }

  if (usePortalStore.getState().navigationRevision !== startNavigationRevision) {
    store.setAgentPresence({ visible: false, status: 'hidden' });
    return failedGuideAction('interrupted_by_user');
  }

  const currentTarget = await findVisibleTarget(options.target);
  if (!currentTarget) {
    store.setAgentPresence({ visible: false, status: 'hidden' });
    return failedGuideAction('target_not_visible');
  }
  currentTarget.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
  store.setAgentPresence({ position: pointerPosition(options.target) });
  store.setAgentPresence({ status: options.beforeActionStatus ?? 'highlighting' });
  await afterPaint();
  if (sequenceCancelled(generation, options.signal)) {
    store.setAgentPresence({ visible: false, status: 'hidden' });
    return failedGuideAction('cancelled');
  }
  const speech = speakGuideMessage(options.message, options.signal);
  const highlighted = await wait(300, options.signal);
  if (!highlighted || sequenceCancelled(generation, options.signal)) {
    cancelGuideSpeech();
    store.setAgentPresence({ visible: false, status: 'hidden' });
    return failedGuideAction('cancelled');
  }

  let actionCommitted = false;
  if (options.action) {
    if (usePortalStore.getState().navigationRevision !== startNavigationRevision) {
      cancelGuideSpeech();
      store.setAgentPresence({ visible: false, status: 'hidden' });
      return failedGuideAction('interrupted_by_user');
    }
    store.setAgentPresence({ status: 'acting' });
    const accepted = await options.action();
    if (accepted === false) {
      cancelGuideSpeech();
      store.setAgentPresence({ status: 'highlighting' });
      hidePresenceLater(operationId);
      return failedGuideAction('action_rejected');
    }
    actionCommitted = true;

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const updatedTarget = getTargetElement(options.target);
    if (updatedTarget) {
      updatedTarget.scrollIntoView({
        behavior: reducedMotion() ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest',
      });
      store.setAgentPresence({ position: pointerPosition(options.target) });
    }
  }

  const spokenByPage = await speech;
  if (sequenceCancelled(generation, options.signal) && !actionCommitted) {
    store.setAgentPresence({ visible: false, status: 'hidden' });
    return failedGuideAction('cancelled');
  }
  if (
    !actionCommitted &&
    usePortalStore.getState().navigationRevision !== startNavigationRevision
  ) {
    store.setAgentPresence({ visible: false, status: 'hidden' });
    return failedGuideAction('interrupted_by_user');
  }
  store.setAgentPresence({ status: 'complete' });
  hidePresenceLater(operationId);
  return { ok: true, presentedVisually: true, spokenByPage };
}

export function runGuideAction(options: GuideActionOptions): Promise<GuideActionResult> {
  const generation = cancellationGeneration;
  const run = sequence.then(() =>
    generation === cancellationGeneration
      ? performGuideAction(options, generation)
      : failedGuideAction('cancelled'),
  );
  sequence = run.catch(() => undefined);
  return run;
}

export function cancelGuidePresence() {
  cancellationGeneration += 1;
  if (hideTimer !== null) window.clearTimeout(hideTimer);
  hideTimer = null;
  cancelGuideSpeech();
  const store = usePortalStore.getState();
  store.setAgentPresence({
    visible: false,
    status: 'hidden',
    target: null,
    message: null,
    position: null,
    operationId: store.agentPresence.operationId + 1,
  });
}

export function refreshGuidePosition() {
  const store = usePortalStore.getState();
  const target = store.agentPresence.target;
  if (!store.agentPresence.visible || !target) return;
  store.setAgentPresence({ position: pointerPosition(target) });
}
