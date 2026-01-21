import { Injectable, signal } from '@angular/core';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    duration?: number; // ms to auto-dismiss
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    notifications = signal<Notification[]>([]);
    private notificationIdCounter = 0;

    constructor() { }

    /**
     * Show a success notification
     */
    success(message: string, duration: number = 3000) {
        this.addNotification('success', message, duration);
    }

    /**
     * Show an error notification
     */
    error(message: string, duration: number = 4000) {
        this.addNotification('error', message, duration);
    }

    /**
     * Show a warning notification
     */
    warning(message: string, duration: number = 4000) {
        this.addNotification('warning', message, duration);
    }

    /**
     * Show an info notification
     */
    info(message: string, duration: number = 3000) {
        this.addNotification('info', message, duration);
    }

    /**
     * Private method to add notification to signal and auto-dismiss
     */
    private addNotification(type: 'success' | 'error' | 'warning' | 'info', message: string, duration: number) {
        const notification: Notification = {
            id: `notif_${this.notificationIdCounter++}`,
            type,
            message,
            timestamp: new Date(),
            duration
        };

        const currentNotifications = this.notifications();
        this.notifications.set([...currentNotifications, notification]);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }
    }

    /**
     * Remove notification by ID
     */
    removeNotification(id: string) {
        const current = this.notifications();
        this.notifications.set(current.filter(n => n.id !== id));
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications.set([]);
    }
}
