import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subject, Observable, filter, map } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '@core/auth/auth.service';

export interface WebSocketMessage {
  type: string;
  payload: any;
  conversationId?: number;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private authService = inject(AuthService);
  private ws: WebSocket | null = null;
  private messages$ = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: any = null;

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    const wsUrl = environment.wsUrl || environment.apiUrl.replace('http', 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log('[WebSocket] Connected');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.messages$.next(message);
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(type: string): Observable<any> {
    return this.messages$.pipe(
      filter(msg => msg.type === type),
      map(msg => msg.payload)
    );
  }

  onConversationMessage(conversationId: number): Observable<any> {
    return this.messages$.pipe(
      filter(msg => msg.conversationId === conversationId),
      map(msg => msg.payload)
    );
  }

  sendTypingStarted(conversationId: number): void {
    this.send({ type: 'typing_started', conversationId });
  }

  sendTypingStopped(conversationId: number): void {
    this.send({ type: 'typing_stopped', conversationId });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      console.log(`[WebSocket] Reconnecting (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
