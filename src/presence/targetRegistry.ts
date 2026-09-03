import { useCallback } from 'react';
import type { SemanticTarget } from '../types';

const targetElements = new Map<SemanticTarget, HTMLElement>();

export function registerTarget(target: SemanticTarget, element: HTMLElement | null) {
  if (element) {
    element.dataset.semanticTarget = target;
    targetElements.set(target, element);
    return;
  }
  targetElements.delete(target);
}

export function getTargetElement(target: SemanticTarget) {
  return targetElements.get(target) ?? null;
}

export function getTargetRect(target: SemanticTarget) {
  return getTargetElement(target)?.getBoundingClientRect() ?? null;
}

export function useSemanticTarget<T extends HTMLElement>(target: SemanticTarget) {
  return useCallback(
    (element: T | null) => {
      registerTarget(target, element);
    },
    [target],
  );
}

export function clearTargetRegistry() {
  targetElements.clear();
}
