import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: true }, namespace: '/alerts' })
export class AlertsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  private count = 0;

  handleConnection(client: Socket) {
    client.emit('alert_count', { count: this.count });
  }

  broadcastCount(count: number) {
    this.count = count;
    this.server.emit('alert_count', { count });
  }
}
