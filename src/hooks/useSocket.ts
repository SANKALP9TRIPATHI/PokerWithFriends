'use client';

// ============================================================
// Vasu-Juari Poker — Socket.IO Client Hook
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from '@/lib/types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let globalSocket: TypedSocket | null = null;

function getSocketUrl(): string {
  if (typeof window === 'undefined') return '';
  
  // In production, the Socket.IO server runs on the same port as Next.js
  if (process.env.NODE_ENV === 'production') {
    return ''; // Empty string tells socket.io to connect to the current host:port
  }
  
  // In development, Next.js is on 3000 and Socket.IO is on 3001
  const host = window.location.hostname;
  return `http://${host}:3001`;
}

function getSocket(): TypedSocket {
  if (!globalSocket) {
    globalSocket = io(getSocketUrl(), {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  }
  return globalSocket;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (socket.connected) {
      setStatus('connected');
    }

    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onReconnectAttempt = () => setStatus('reconnecting');
    const onReconnect = () => setStatus('connected');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onReconnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect', onReconnect);
    };
  }, []);

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      socketRef.current?.emit(event, ...args);
    },
    []
  );

  const on = useCallback(
    <E extends keyof ServerToClientEvents>(
      event: E,
      handler: ServerToClientEvents[E]
    ) => {
      const s = socketRef.current as any;
      s?.on(event, handler);
      return () => {
        s?.off(event, handler);
      };
    },
    []
  );

  return {
    socket: socketRef.current,
    status,
    emit,
    on,
    id: socketRef.current?.id,
  };
}
