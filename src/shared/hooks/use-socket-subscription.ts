'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useOrchestrationStore } from '@/shared/store/orchestration-store';
import {
  ORCHESTRATION_EVENT_CHANNEL,
  type OrchestrationEvent,
} from '@/shared/api/orchestration-events';

const SOCKET_URL = (
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_API_ORIGIN ??
  'http://localhost:4000'
).replace(/\/+$/, '');
const POLL_INTERVAL_MS = 30_000;
const RECONNECT_WAIT_MS = 10_000;

interface UseSocketSubscriptionOptions {
  projectId?: string | null;
  initialStatus?: string;
  initialCurrentNode?: string;
  initialRunId?: string;
  onStateChange?: (state: { status: string; currentNode: string }) => void;
  fallbackPollFn?: () => Promise<{ status: string; currentNode: string; runId?: string } | null>;
}

export function useSocketSubscription(options: UseSocketSubscriptionOptions) {
  const {
    projectId,
    initialStatus,
    initialCurrentNode,
    initialRunId,
    onStateChange,
    fallbackPollFn,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingRef = useRef(false);

  const setConnectionStatus = useOrchestrationStore((s) => s.setConnectionStatus);
  const setOrchestrationState = useOrchestrationStore((s) => s.setOrchestrationState);
  const applyEvent = useOrchestrationStore((s) => s.applyEvent);
  const reset = useOrchestrationStore((s) => s.reset);

  // Stable refs to avoid infinite re-render loops when callbacks change
  const fallbackPollRef = useRef(fallbackPollFn);
  fallbackPollRef.current = fallbackPollFn;
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const startPolling = useCallback(() => {
    if (!fallbackPollRef.current || isPollingRef.current) return;
    isPollingRef.current = true;

    const poll = async () => {
      try {
        const result = await fallbackPollRef.current!();
        if (result) {
          setOrchestrationState({
            status: result.status,
            currentNode: result.currentNode,
            nodeStatus: 'running',
            runId: result.runId ?? '',
            error: null,
          });
          onStateChangeRef.current?.(result);
        }
      } catch {
        // polling error — will retry on next interval
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
  }, [setOrchestrationState]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  useEffect(() => {
    if (!projectId) {
      reset();
      return;
    }

    if (initialStatus) {
      setOrchestrationState({
        status: initialStatus,
        currentNode: initialCurrentNode ?? 'unknown',
        nodeStatus: 'running',
        runId: initialRunId ?? '',
        error: null,
      });
    }

    setConnectionStatus('connecting');

    const socket = io(`${SOCKET_URL}/devflow`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      stopPolling();
      socket.emit('subscribe', { projectId });
    });

    // Phase 4 — WebSocket-first cutover: the typed `orchestration:event` channel
    // is the single source of truth. The store reducer (applyEvent) fans each
    // event into run status, per-node runtime, agent streams, and the activity
    // log. Legacy `orchestration:state` / `agent:stream` events are ignored.
    socket.on(ORCHESTRATION_EVENT_CHANNEL, (event: OrchestrationEvent) => {
      applyEvent(event);
      if (event.type === 'run.status') {
        onStateChangeRef.current?.({ status: event.status, currentNode: event.currentNode });
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      reconnectTimerRef.current = setTimeout(() => {
        startPolling();
      }, RECONNECT_WAIT_MS);
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
      reconnectTimerRef.current = setTimeout(() => {
        startPolling();
      }, RECONNECT_WAIT_MS);
    });

    return () => {
      socket.emit('unsubscribe', { projectId });
      socket.disconnect();
      socketRef.current = null;
      setConnectionStatus('disconnected');
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      stopPolling();
    };
  }, [projectId, initialStatus, initialCurrentNode, initialRunId, setConnectionStatus, setOrchestrationState, applyEvent, reset, stopPolling, startPolling]);

  const resync = useCallback(() => {
    const socket = socketRef.current;
    const state = useOrchestrationStore.getState().orchestrationState;
    if (socket?.connected && projectId && state) {
      socket.emit('resync', {
        projectId,
        status: state.status,
        currentNode: state.currentNode,
        runId: state.runId,
      });
    }
  }, [projectId]);

  return { resync };
}
