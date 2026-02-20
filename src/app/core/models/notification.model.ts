export interface Notification {
  notificationId: number;
  userId: number;
  type: NotificationType;
  message: string;
  status: NotificationStatus;
  createdDate: Date;
  readDate?: Date;
}

export enum NotificationType {
  LogReminder = 'LogReminder',
  TaskDeadline = 'TaskDeadline',
  TaskAssigned = 'TaskAssigned',
  TaskCompleted = 'TaskCompleted'
}

export enum NotificationStatus {
  Unread = 'Unread',
  Read = 'Read'
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}