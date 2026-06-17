import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { parse } from 'cookie';
import type { WebSocket } from 'ws';
import { MarketDataStore } from '../market/market.service';
import { WalletService } from '../wallet/wallet.service';
import { ACCESS_TOKEN_COOKIE } from '../common/constants/cookies';
import { JwtPayload } from '../auth/jwt.strategy';
import type { WsSubscribeMessage, WsMessage } from '@exchange/shared';

interface ClientMeta {
  userId?: string;
  subscriptions: Set<string>;
}

@Injectable()
@WebSocketGateway({ path: '/ws' })
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private clients = new Map<WebSocket, ClientMeta>();
  private heartbeatInterval?: ReturnType<typeof setInterval>;
  private marketInterval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly jwtService: JwtService,
    private readonly marketStore: MarketDataStore,
    private readonly walletService: WalletService,
  ) {}

  onModuleInit() {
    this.heartbeatInterval = setInterval(() => {
      this.server.clients.forEach((client) => {
        if ((client as WebSocket & { isAlive?: boolean }).isAlive === false) {
          client.terminate();
          return;
        }
        (client as WebSocket & { isAlive?: boolean }).isAlive = false;
        client.ping();
      });
    }, 30000);

    this.marketInterval = setInterval(() => {
      for (const ticker of this.marketStore.getAllTickers()) {
        this.broadcast(`ticker.${ticker.symbol}`, {
          type: 'ticker.update',
          channel: `ticker.${ticker.symbol}`,
          payload: ticker,
          timestamp: Date.now(),
        } as WsMessage);
        const book = this.marketStore.getOrderBook(ticker.symbol);
        if (book) {
          this.broadcast(`depth.${ticker.symbol}`, {
            type: 'depth.update',
            channel: `depth.${ticker.symbol}`,
            payload: book,
            timestamp: Date.now(),
          } as WsMessage);
        }
      }
    }, 2000);
  }

  handleConnection(client: WebSocket, ...args: unknown[]) {
    const req = args[0] as { headers?: { cookie?: string } };
    (client as WebSocket & { isAlive?: boolean }).isAlive = true;
    client.on('pong', () => {
      (client as WebSocket & { isAlive?: boolean }).isAlive = true;
    });

    const meta: ClientMeta = { subscriptions: new Set() };
    const cookies = req?.headers?.cookie ? parse(req.headers.cookie) : {};
    const token = cookies[ACCESS_TOKEN_COOKIE];

    if (token) {
      try {
        const payload = this.jwtService.verify<JwtPayload>(token, {
          secret: process.env.JWT_SECRET || 'dev-secret',
        });
        meta.userId = payload.sub;
      } catch {
        // unauthenticated - public channels only
      }
    }

    this.clients.set(client, meta);
    this.send(client, {
      type: 'connected',
      channel: 'system',
      payload: { message: 'Connected' },
      timestamp: Date.now(),
    } as WsMessage);
  }

  handleDisconnect(client: WebSocket) {
    this.clients.delete(client);
  }

  @SubscribeMessage('message')
  handleMessage(@ConnectedSocket() client: WebSocket, @MessageBody() data: WsSubscribeMessage) {
    const meta = this.clients.get(client);
    if (!meta) return;

    const channel = data.channel;
    const isPrivate = channel.startsWith('user.');

    if (isPrivate && !meta.userId) {
      this.send(client, {
        type: 'error',
        channel: 'system',
        payload: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: Date.now(),
      } as WsMessage);
      return;
    }

    if (data.action === 'subscribe') {
      meta.subscriptions.add(channel);
    } else {
      meta.subscriptions.delete(channel);
    }
  }

  broadcast(channel: string, message: WsMessage) {
    this.server.clients.forEach((client) => {
      const meta = this.clients.get(client);
      if (meta?.subscriptions.has(channel)) {
        this.send(client, message);
      }
    });
  }

  pushOrderUpdate(userId: string, order: unknown) {
    this.server.clients.forEach((client) => {
      const meta = this.clients.get(client);
      if (meta?.userId === userId && meta.subscriptions.has('user.orders')) {
        this.send(client, {
          type: 'order.update',
          channel: 'user.orders',
          payload: order,
          timestamp: Date.now(),
        } as WsMessage);
      }
    });
  }

  async pushBalanceUpdate(userId: string) {
    const balances = await this.walletService.getBalances(userId);
    this.server.clients.forEach((client) => {
      const meta = this.clients.get(client);
      if (meta?.userId === userId && meta.subscriptions.has('user.balances')) {
        this.send(client, {
          type: 'balance.update',
          channel: 'user.balances',
          payload: balances,
          timestamp: Date.now(),
        } as WsMessage);
      }
    });
  }

  private send(client: WebSocket, message: WsMessage) {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}
