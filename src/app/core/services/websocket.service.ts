import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

// WebSocketService removed
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
