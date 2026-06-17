import { OrderSide, OrderType } from './enums.js';

export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface PlaceOrderDto {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price?: string;
  quantity: string;
}

export interface CancelOrderDto {
  orderId: string;
}

export interface OrderQueryDto {
  status?: string;
  symbol?: string;
  limit?: number;
  offset?: number;
}

export interface KlineQueryDto {
  interval: string;
  limit?: number;
}

export interface DepthQueryDto {
  limit?: number;
}

export interface AuthMeResponse {
  user: {
    id: string;
    email: string;
  };
}

export interface MessageResponse {
  message: string;
}
