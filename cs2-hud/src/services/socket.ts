import { io, type Socket } from 'socket.io-client';

/**
 * Connection to Lexogrine HUD Manager.
 *
 * LHM serves the HUD and exposes a socket.io server on its own port
 * (default 1349). When LHM loads a HUD it appends `?port=` to the URL;
 * we honour that, then fall back to the current origin's port, then 1349.
 */
export const resolveLHMAddress = (): string => {
  const params = new URLSearchParams(window.location.search);
  const port = params.get('port') ?? (window.location.port || '1349');
  const host = window.location.hostname || 'localhost';
  return `${window.location.protocol === 'https:' ? 'https' : 'http'}://${host}:${port}`;
};

export const lhmAddress = resolveLHMAddress();

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(lhmAddress, {
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 8000,
    });
    // LHM reloads HUDs it manages when the user hits "refresh HUDs".
    socket.on('refreshHUD', () => window.location.reload());
  }
  return socket;
};
