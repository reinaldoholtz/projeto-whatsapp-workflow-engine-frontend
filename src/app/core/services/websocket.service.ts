import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subject, Observable, filter, map } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { environment } from '@env/environment';
import { AuthService } from '@core/auth/auth.service';

export interface WebSocketMessage {
  type: string;
  payload: any;
  conversationId?: number;
  timestamp?: string;
}

export interface NewConversationNotification {
  conversationId: number;
  tenantId: number;
  attendanceGroupId: number;
  contactName: string;
  phoneNumber: string;
  messagePreview: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {

  private authService = inject(AuthService);

  private client: Client | null = null;

  private messages$ = new Subject<WebSocketMessage>();

  private subscriptions = new Map<string, StompSubscription>();

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(): void {
    if (this.client?.active) {
      return;
    }

    const token = this.authService.getAccessToken();

    if (!token) {
      console.warn('[WebSocket] No access token available');
      return;
    }

    const wsUrl =
      environment.wsUrl ||
      environment.apiUrl.replace(/^http/, 'ws');

    this.client = new Client({
      brokerURL: environment.wsUrl,

      connectHeaders: {
        Authorization: `Bearer ${token}`
      },

      reconnectDelay: 5000,
      
      onConnect: () => {     
        this.reconnectAttempts = 0;
        this.resubscribe();
      },

      onStompError: (frame) => {
        console.error(
          '[WebSocket] STOMP error:',
          frame.headers['message'],
          frame.body
        );
      },

      onWebSocketClose: () => {
        console.log('[WebSocket] WebSocket disconnected');
      },

      onWebSocketError: (event) => {
        console.error('[WebSocket] WebSocket error:', event);
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.subscriptions.clear();
  }

  subscribeToAttendanceGroup(
    tenantId: number,
    attendanceGroupId: number
  ): void {

    const destination =
      `/topic/tenant/${tenantId}/attendance-group/${attendanceGroupId}`;

    if (this.subscriptions.has(destination)) {
      return;
    }

    if (!this.client?.connected) {
      console.warn(
        '[WebSocket] Cannot subscribe, client not connected:',
        destination
      );
      return;
    }

    const subscription = this.client.subscribe(
      destination,
      (message: IMessage) => {

        try {
          const notification =
            JSON.parse(message.body);

          this.messages$.next({
            type: 'NEW_CONVERSATION',
            payload: notification,
            conversationId: notification.conversationId,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error(
            '[WebSocket] Failed to parse message:',
            error
          );
        }
      }
    );

    this.subscriptions.set(destination, subscription);

    console.log(
      '[WebSocket] Subscribed:',
      destination
    );
  }

  unsubscribeFromAttendanceGroup(
    tenantId: number,
    attendanceGroupId: number
  ): void {

    const destination =
      `/topic/tenant/${tenantId}/attendance-group/${attendanceGroupId}`;

    const subscription =
      this.subscriptions.get(destination);

    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);

      console.log(
        '[WebSocket] Unsubscribed:',
        destination
      );
    }
  }

  onMessage(type: string): Observable<any> {
    return this.messages$.pipe(
      filter(message => message.type === type),
      map(message => message.payload)
    );
  }

  onNewConversation(): Observable<NewConversationNotification> {
    return this.onMessage('NEW_CONVERSATION');
  }

  onConversationMessage(
    conversationId: number
  ): Observable<any> {

    return this.messages$.pipe(
      filter(
        message =>
          message.conversationId === conversationId
      ),
      map(message => message.payload)
    );
  }

  sendTypingStarted(
    conversationId: number
  ): void {
    this.send({
      type: 'typing_started',
      conversationId
    });
  }

  sendTypingStopped(
    conversationId: number
  ): void {
    this.send({
      type: 'typing_stopped',
      conversationId
    });
  }

  send(message: any): void {

    if (!this.client?.connected) {
      console.warn(
        '[WebSocket] Cannot send, client not connected'
      );
      return;
    }

    this.client.publish({
      destination: '/app/message',
      body: JSON.stringify(message)
    });
  }

  private resubscribe(): void {

    const destinations =
      Array.from(this.subscriptions.keys());

    this.subscriptions.clear();

    for (const destination of destinations) {

      const match = destination.match(
        /^\/topic\/tenant\/(\d+)\/attendance-group\/(\d+)$/
      );

      if (match) {
        this.subscribeToAttendanceGroup(
          Number(match[1]),
          Number(match[2])
        );
      }
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
