import { useEffect } from 'react';
import { engine, type EngineEvents } from '@/services/engine';

/** Subscribe a callback to an engine event for the component's lifetime. */
export const useEngineEvent = <K extends keyof EngineEvents>(
  event: K,
  handler: (payload: EngineEvents[K]) => void,
): void => {
  useEffect(() => engine.on(event, handler), [event, handler]);
};
