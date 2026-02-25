import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface SocketEvent {
  type: 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'NOTIFICATION_UPDATE' | string;
  data: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private socketUrl = 'http://localhost:3000'; // Update with your backend URL
  private isConnected$ = new BehaviorSubject<boolean>(false);
  private socketEvent$ = new Subject<SocketEvent>();
  
  public connected$ = this.isConnected$.asObservable();
  public onEvent$ = this.socketEvent$.asObservable();

  constructor() {
    this.initializeSocket();
  }

  /**
   * Initialize WebSocket connection
   */
  private initializeSocket(): void {
    try {
      this.socket = io(this.socketUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
        autoConnect: true
      });

      this.setupListeners();
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Setup Socket.io event listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.isConnected$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected$.next(false);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
    });

    // Custom event listeners
    this.socket.on('TASK_ASSIGNED', (data: any) => {
      this.emitEvent({
        type: 'TASK_ASSIGNED',
        data: data,
        timestamp: new Date()
      });
    });

    this.socket.on('TASK_COMPLETED', (data: any) => {
      this.emitEvent({
        type: 'TASK_COMPLETED',
        data: data,
        timestamp: new Date()
      });
    });

    this.socket.on('NOTIFICATION_UPDATE', (data: any) => {
      this.emitEvent({
        type: 'NOTIFICATION_UPDATE',
        data: data,
        timestamp: new Date()
      });
    });
  }

  /**
   * Emit a socket event through the observable stream
   */
  private emitEvent(event: SocketEvent): void {
    this.socketEvent$.next(event);
  }

  /**
   * Listen to a specific socket event
   */
  public on(eventName: string): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not initialized');
        return;
      }

      this.socket.on(eventName, (data: any) => {
        observer.next(data);
      });

      return () => {
        this.socket?.off(eventName);
      };
    });
  }

  /**
   * Emit a socket event to the server
   */
  public emit(eventName: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', eventName);
    }
  }

  /**
   * Join a room (for filtering notifications by user)
   */
  public joinRoom(roomId: string): void {
    this.emit('JOIN_ROOM', { roomId });
  }

  /**
   * Leave a room
   */
  public leaveRoom(roomId: string): void {
    this.emit('LEAVE_ROOM', { roomId });
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.socketEvent$.complete();
    this.isConnected$.complete();
  }
}
