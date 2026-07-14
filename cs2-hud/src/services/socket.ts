import { io, Socket } from 'socket.io-client';
import { CSGOGSI } from 'csgogsi';
import type { CSGORaw, RawKill, RawHurt } from 'csgogsi';
import { SOCKET_ADDRESS } from './api';
import { actions } from './actions';

/**
 * Single shared GSI parser instance. Every hook and the stats tracker
 * subscribe to this instead of the raw socket, so the whole HUD shares one
 * digest pass per game tick.
 */
export const GSI = new CSGOGSI();
GSI.regulationMR = 12; // CS2 MR12
GSI.overtimeMR = 3;

export type ConfigListener = (values: Record<string, unknown>) => void;
export type MatchListener = () => void;

let socket: Socket | null = null;
const configListeners = new Set<ConfigListener>();
const matchListeners = new Set<MatchListener>();

/** Connect to the LHM socket exactly once (idempotent under HMR/StrictMode). */
export function connectSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_ADDRESS, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    // Tells LHM the HUD is alive so it starts streaming GSI + config.
    socket?.emit('started');
    socket?.emit('registerReader');
  });

  socket.on('update', (data: CSGORaw) => {
    try {
      GSI.digest(data);
    } catch (e) {
      // A single malformed GSI frame must never take the overlay down mid-broadcast.
      console.error('GSI digest error', e);
    }
  });

  // Kill / hurt events forwarded by LHM from the game event pipeline.
  socket.on('mirv', (data: RawKill | RawHurt, eventType?: string) => {
    try {
      GSI.digestMIRV(data, eventType);
    } catch (e) {
      console.error('MIRV digest error', e);
    }
  });

  socket.on('hud_config', (data: Record<string, unknown>) => {
    configListeners.forEach(fn => fn(data ?? {}));
  });

  // Keybinds configured in hud.json and buttons in the LHM action panel
  // both arrive here as plain action identifiers.
  socket.on('hud_action', (payload: { action?: string; data?: string } | string) => {
    const name = typeof payload === 'string' ? payload : (payload?.action ?? payload?.data);
    if (name) actions.dispatch(name);
  });
  socket.on('keybindAction', (action: string) => {
    if (action) actions.dispatch(action);
  });

  socket.on('match', () => {
    matchListeners.forEach(fn => fn());
  });

  socket.on('refreshHUD', () => {
    window.location.reload();
  });

  return socket;
}

export function onHudConfig(fn: ConfigListener): () => void {
  configListeners.add(fn);
  return () => configListeners.delete(fn);
}

export function onMatchUpdate(fn: MatchListener): () => void {
  matchListeners.add(fn);
  return () => matchListeners.delete(fn);
}
