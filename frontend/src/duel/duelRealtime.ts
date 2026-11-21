import { getDuelRealtimeTicket } from '@/api/duelApi';
import { apiClient } from '@/config/axios';
import type { DuelNotification } from '@/model';

export type DuelConnectionState = 'connecting' | 'open' | 'retrying' | 'closed';

/** Use the same origin/base path as axios, including an external backend or HTTPS proxy. */
export function duelWebSocketUrl(path: string, ticket: string): string {
  const base = new URL(apiClient.defaults.baseURL ?? '/api', window.location.href);
  if (!['http:', 'https:'].includes(base.protocol) || base.search || base.hash) throw new Error('Invalid Duel API base URL');
  base.pathname = `${base.pathname.replace(/\/$/, '')}/`;
  const url = new URL(path, base);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) throw new Error('Invalid Duel socket path');
  url.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('ticket', ticket);
  return url.href;
}

/** Transport only. The consumer must resync queue/profile/match on every open and own polling/queue leases. */
export function connectDuelRealtime(options: {
  onNotification: (notification: DuelNotification) => void;
  onState?: (state: DuelConnectionState) => void;
  onOpen?: () => void;
  signal?: AbortSignal;
}): { close: () => void } {
  let stopped = false;
  let socket: WebSocket | null = null;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let attempts = 0;
  let generation = 0;
  let lastReceived = 0;
  const requests = new AbortController();
  const revisions = new Map<string, { revision: number; types: Set<string> }>();

  function clearHeartbeat() {
    clearInterval(heartbeat);
    heartbeat = undefined;
  }

  function schedule() {
    if (stopped) return;
    options.onState?.('retrying');
    clearTimeout(retry);
    const delay = Math.min(10_000, 500 * 2 ** Math.min(attempts++, 5)) * (0.75 + Math.random() * 0.5);
    retry = setTimeout(() => { void open(); }, delay);
  }

  function ping() {
    if (socket?.readyState !== WebSocket.OPEN) return;
    if (Date.now() - lastReceived > 45_000) socket.close();
    else socket.send('ping');
  }

  async function open() {
    if (stopped) return;
    const current = ++generation;
    options.onState?.('connecting');
    try {
      const credential = await getDuelRealtimeTicket(requests.signal);
      if (stopped || current !== generation) return;
      const peer = new WebSocket(duelWebSocketUrl(credential.webSocketPath, credential.ticket));
      socket = peer;
      peer.onopen = () => {
        if (stopped || current !== generation) { peer.close(); return; }
        attempts = 0;
        lastReceived = Date.now();
        revisions.clear();
        clearHeartbeat();
        heartbeat = setInterval(ping, 20_000);
        options.onState?.('open');
        options.onOpen?.();
      };
      peer.onmessage = (event: MessageEvent<unknown>) => {
        if (stopped || current !== generation) return;
        const notification = parseNotification(event.data);
        if (!notification) { peer.close(1008, 'Invalid notification'); return; }
        lastReceived = Date.now();
        if (notification.type === 'PONG') return;
        if (notification.matchId && notification.revision !== null) {
          const known = revisions.get(notification.matchId);
          if (known && (notification.revision < known.revision
            || (notification.revision === known.revision && known.types.has(notification.type)))) return;
          const types = known?.revision === notification.revision ? known.types : new Set<string>();
          types.add(notification.type);
          if (revisions.size > 100) revisions.clear();
          revisions.set(notification.matchId, { revision: notification.revision, types });
        }
        options.onNotification(notification);
      };
      peer.onclose = () => {
        if (stopped || current !== generation) return;
        socket = null;
        clearHeartbeat();
        schedule();
      };
      // Browsers follow failed handshakes/transport errors with close; never log credential-bearing URLs.
      peer.onerror = () => {};
    } catch {
      if (!stopped && current === generation) schedule();
    }
  }

  function visible() {
    if (document.visibilityState === 'visible') ping();
  }

  function close() {
    if (stopped) return;
    stopped = true;
    generation++;
    requests.abort();
    clearTimeout(retry);
    clearHeartbeat();
    document.removeEventListener('visibilitychange', visible);
    window.removeEventListener('focus', visible);
    options.signal?.removeEventListener('abort', close);
    socket?.close();
    socket = null;
    options.onState?.('closed');
  }

  if (options.signal?.aborted) close();
  else {
    options.signal?.addEventListener('abort', close, { once: true });
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('focus', visible);
    void open();
  }
  return { close };
}

function parseNotification(value: unknown): DuelNotification | null {
  if (typeof value !== 'string') return null;
  try {
    const data: unknown = JSON.parse(value);
    if (!data || typeof data !== 'object') return null;
    const entry = data as Record<string, unknown>;
    const uuid = (id: unknown) => id === null || (typeof id === 'string'
      && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
    if (!['QUEUE_CHANGED', 'MATCH_FOUND', 'MATCH_CHANGED', 'RATING_CHANGED', 'PONG'].includes(String(entry.type))
      || !uuid(entry.matchId) || !uuid(entry.entryId)
      || !(entry.revision === null || (Number.isSafeInteger(entry.revision) && Number(entry.revision) >= 0))
      || typeof entry.serverNow !== 'string' || !Number.isFinite(Date.parse(entry.serverNow))) return null;
    return entry as unknown as DuelNotification;
  } catch { return null; }
}
