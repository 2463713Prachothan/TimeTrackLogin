import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';

@Component({
    selector: 'app-notification',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="notification-container">
      <div *ngFor="let notification of notifications()" 
           [ngClass]="'notification notification-' + notification.type"
           [@slideIn]>
        <div class="notification-content">
          <span class="notification-icon">{{ getIcon(notification.type) }}</span>
          <span class="notification-message">{{ notification.message }}</span>
        </div>
        <button class="notification-close" (click)="close(notification.id)">
          ✕
        </button>
      </div>
    </div>
  `,
    styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .notification {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      min-width: 300px;
    }

    .notification-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .notification-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .notification-message {
      color: inherit;
      word-wrap: break-word;
    }

    .notification-close {
      background: none;
      border: none;
      color: inherit;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      margin-left: 12px;
      opacity: 0.7;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }

    .notification-close:hover {
      opacity: 1;
    }

    /* Success - Green */
    .notification-success {
      background-color: #d4edda;
      color: #155724;
      border-left: 4px solid #28a745;
    }

    /* Error - Red */
    .notification-error {
      background-color: #f8d7da;
      color: #721c24;
      border-left: 4px solid #dc3545;
    }

    /* Warning - Orange */
    .notification-warning {
      background-color: #fff3cd;
      color: #856404;
      border-left: 4px solid #ffc107;
    }

    /* Info - Blue */
    .notification-info {
      background-color: #d1ecf1;
      color: #0c5460;
      border-left: 4px solid #17a2b8;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 600px) {
      .notification-container {
        left: 10px;
        right: 10px;
        max-width: none;
      }

      .notification {
        min-width: auto;
      }
    }
  `]
})
export class NotificationComponent {
    private notificationService = inject(NotificationService);

    notifications = this.notificationService.notifications;

    getIcon(type: string): string {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ℹ';
            default:
                return '•';
        }
    }

    close(id: string): void {
        this.notificationService.removeNotification(id);
    }
}
