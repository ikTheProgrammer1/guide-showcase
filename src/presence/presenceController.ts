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

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function wait(ms: number, signal?: AbortSignal) {
  if (reducedMotion()) return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', cancel);
      resolve(true);
    }, ms);
    const cancel = () => {
      window.clearTimeout(timer);
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

function pointerPosition(target: SemanticTarget) {
  const rect = getTargetRect(target);
  if (!rect) return null;
  const x = Math.min(Math.max(rect.right - Math.min(rect.width * 0.16, 28), 28), window.innerWidth - 28);
  const y = Math.min(Math.max(rect.top + Math.min(rect.height * 0.42, 32), 28), window.innerHeight - 28);
  return { x, y };
}

function speak(message: string) {
  const { readAloud } = usePortalStore.getState().accessibility;
  if (!readAloud || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.92;
  utterance.pitch = 1.03;
  window.speechSynthesis.speak(utterance);
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

async function performGuideAction(options: GuideActionOptions): Promise<GuideActionResult> {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }

  const store = usePortalStore.getState();
  const startVersion = store.interactionVersion;
  const operationId = store.agentPresence.operationId + 1;

  if (options.actionTiming === 'before-presence' && options.action) {
    const targetElement = await findVisibleTarget(options.target);
    if (!targetElement) return { ok: false, code: 'target_not_visible' };

    const ready = await wait(120, options.signal);
    if (!ready) return { ok: false, code: 'cancelled' };
    if (usePortalStore.getState().interactionVersion !== startVersion) {
      return { ok: false, code: 'interrupted_by_user' };
    }

    const accepted = await options.action();
    if (accepted === false) return { ok: false, code: 'action_rejected' };

    await wait(reducedMotion() ? 0 : 620);
    if (usePortalStore.getState().interactionVersion !== startVersion) {
      return { ok: false, code: 'interrupted_by_user' };
    }
    const updatedTarget = await findVisibleTarget(options.target);
    if (!updatedTarget) return { ok: false, code: 'target_not_visible' };
    updatedTarget.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
    store.setAgentPresence({
      visible: true,
      target: options.target,
      message: options.message,
      status: 'highlighting',
      operationId,
      position: pointerPosition(options.target),
    });
    speak(options.message);
    store.setAgentPresence({ status: 'complete' });
    hidePresenceLater(operationId);
    return { ok: true };
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
    return { ok: false, code: 'target_not_visible' };
  }

  targetElement.scrollIntoView({
    behavior: reducedMotion() ? 'auto' : 'smooth',
    block: 'center',
    inline: 'nearest',
  });
  const positioned = await wait(90, options.signal);
  if (!positioned) return { ok: false, code: 'cancelled' };

  const position = pointerPosition(options.target);
  store.setAgentPresence({ status: 'moving', position });
  const moved = await wait(520, options.signal);
  if (!moved) {
    store.setAgentPresence({ visible: false, status: 'hidden' });
    return { ok: false, code: 'cancelled' };
  }

  if (usePortalStore.getState().interactionVersion !== startVersion) {
    store.setAgentPresence({ visible: false, status: 'hidden' });
    return { ok: false, code: 'interrupted_by_user' };
  }

  store.setAgentPresence({ status: options.beforeActionStatus ?? 'highlighting' });
  speak(options.message);
  const highlighted = await wait(300, options.signal);
  if (!highlighted) return { ok: false, code: 'cancelled' };

  if (options.action) {
    if (usePortalStore.getState().interactionVersion !== startVersion) {
      store.setAgentPresence({ visible: false, status: 'hidden' });
      return { ok: false, code: 'interrupted_by_user' };
    }
    store.setAgentPresence({ status: 'acting' });
    const accepted = await options.action();
    if (accepted === false) {
      store.setAgentPresence({ status: 'highlighting' });
      hidePresenceLater(operationId);
      return { ok: false, code: 'action_rejected' };
    }

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

  store.setAgentPresence({ status: 'complete' });
  hidePresenceLater(operationId);
  return { ok: true };
}

export function runGuideAction(options: GuideActionOptions): Promise<GuideActionResult> {
  const generation = cancellationGeneration;
  const run = sequence.then(() =>
    generation === cancellationGeneration
      ? performGuideAction(options)
      : ({ ok: false, code: 'cancelled' } satisfies GuideActionResult),
  );
  sequence = run.catch(() => undefined);
  return run;
}

export function cancelGuidePresence() {
  cancellationGeneration += 1;
  if (hideTimer !== null) window.clearTimeout(hideTimer);
  hideTimer = null;
  window.speechSynthesis?.cancel();
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
