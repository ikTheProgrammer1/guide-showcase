import { useEffect, useState } from 'react';
import { usePortalStore } from '../state/portalStore';
import {
  createConfirmTool,
  createSelectSlotTool,
  createStaticTools,
} from './toolDefinitions';

export type WebMCPStatus = 'registering' | 'ready' | 'unavailable' | 'error';

function registerGroup(tools: WebMCP.ModelContextTool[], onError: () => void) {
  const modelContext = document.modelContext;
  if (!modelContext) return null;
  const controller = new AbortController();
  void Promise.all(
    tools.map((tool) => modelContext.registerTool(tool, { signal: controller.signal })),
  ).catch((error: unknown) => {
    console.error('Guide could not register WebMCP tools.', error);
    onError();
  });
  return controller;
}

export function useWebMCPTools() {
  const [status, setStatus] = useState<WebMCPStatus>(() =>
    document.modelContext ? 'registering' : 'unavailable',
  );
  const chooserOpen = usePortalStore((state) => state.reschedule.dialogOpen);
  const hasSelection = usePortalStore((state) => Boolean(state.reschedule.selectedSlotId));

  useEffect(() => {
    if (!document.modelContext) return;
    const controller = new AbortController();
    void Promise.all(
      createStaticTools().map((tool) =>
        document.modelContext!.registerTool(tool, { signal: controller.signal }),
      ),
    )
      .then(() => setStatus('ready'))
      .catch((error: unknown) => {
        console.error('Guide could not initialize WebMCP.', error);
        setStatus('error');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!chooserOpen || !document.modelContext) return;
    const controller = registerGroup([createSelectSlotTool()], () => setStatus('error'));
    return () => controller?.abort();
  }, [chooserOpen]);

  useEffect(() => {
    if (!chooserOpen || !hasSelection || !document.modelContext) return;
    const controller = registerGroup([createConfirmTool()], () => setStatus('error'));
    return () => controller?.abort();
  }, [chooserOpen, hasSelection]);

  return status;
}
