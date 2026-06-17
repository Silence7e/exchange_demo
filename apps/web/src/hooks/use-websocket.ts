'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWsStore } from '@/stores/ws-store';
import { useMarketStore } from '@/stores/market-store';
import type { WsMessage, WsSubscribeMessage } from '@exchange/shared';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/ws';

export const useWebSocket = (channels: string[]) => {
  const wsRef = useRef<WebSocket | null>(null);
  const channelsRef = useRef(channels);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { setStatus, setSubscriptions } = useWsStore();
  const { setTicker, setOrderBook } = useMarketStore();

  channelsRef.current = channels;

  const subscribe = useCallback((ws: WebSocket, chs: string[]) => {
    for (const channel of chs) {
      const msg: WsSubscribeMessage = { action: 'subscribe', channel };
      ws.send(JSON.stringify(msg));
    }
    setSubscriptions(chs);
  }, [setSubscriptions]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      subscribe(ws, channelsRef.current);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as WsMessage;
      if (msg.type === 'ticker.update') {
        setTicker(msg.payload.symbol, msg.payload);
      }
      if (msg.type === 'depth.update') {
        setOrderBook(msg.payload.symbol, msg.payload);
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [setStatus, subscribe, setTicker, setOrderBook]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      subscribe(ws, channels);
    }
  }, [channels.join(','), subscribe]);
};
