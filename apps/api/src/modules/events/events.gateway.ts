import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from WebSocket: ${client.id}`);
  }

  @SubscribeMessage('join-tenant')
  handleJoinTenant(client: Socket, tenantId: string) {
    client.join(`tenant-${tenantId}`);
    return { status: 'joined', room: `tenant-${tenantId}` };
  }

  broadcastSaleCompleted(tenantId: string, saleData: any) {
    this.server.to(`tenant-${tenantId}`).emit('sale-completed', saleData);
  }

  broadcastLowStock(tenantId: string, alertData: any) {
    this.server.to(`tenant-${tenantId}`).emit('low-stock-alert', alertData);
  }
}
