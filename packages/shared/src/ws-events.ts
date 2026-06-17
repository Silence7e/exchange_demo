import type { Ticker, OrderBook, Balance, Order } from './types.js';

export type WsEventType =
  | 'connected'
  | 'error'
  | 'ticker.update'
  | 'depth.update'
  | 'trade.update'
  | 'order.update'
  | 'balance.update';

export interface WsEvent<T extends WsEventType, P> {
  type: T;
  channel: string;
  payload: P;
  timestamp: number;
}

export type TickerUpdateEvent = WsEvent<'ticker.update', Ticker>;
export type DepthUpdateEvent = WsEvent<'depth.update', OrderBook>;
export type TradeUpdateEvent = WsEvent<'trade.update', { symbol: string; price: string; quantity: string; side: string }>;
export type OrderUpdateEvent = WsEvent<'order.update', Order>;
export type BalanceUpdateEvent = WsEvent<'balance.update', Balance[]>;

export type WsMessage =
  | WsEvent<'connected', { message: string }>
  | WsEvent<'error', { code: string; message: string }>
  | TickerUpdateEvent
  | DepthUpdateEvent
  | TradeUpdateEvent
  | OrderUpdateEvent
  | BalanceUpdateEvent;

export interface WsSubscribeMessage {
  action: 'subscribe' | 'unsubscribe';
  channel: string;
}
