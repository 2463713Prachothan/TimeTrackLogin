// ============================
// Task Models - Complete Backend Integration
// ============================

export interface CreateTaskDto {
  title: string;                // Required, max 200 chars
  description: string;          // Required, max 1000 chars
  assignedToUserId: string;     // Required GUID
  projectId?: string;           // Optional GUID
  estimatedHours: number;       // Required, 0.1 to 999.99
  priority: 'Low' | 'Medium' | 'High';  // Required
  dueDate?: string;             // Optional ISO 8601 date
}

export interface TaskResponseDto {
  taskId: string;
  title: string;
  description: string;
  assignedToUserId: string;
  assignedToUserName: string;
  createdByUserId: string;
  createdByUserName: string;
  projectId?: string;
  estimatedHours: number;
  actualHours?: number;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Approved';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  createdDate: string;
  startedDate?: string;
  completedDate?: string;
  isApproved: boolean;
  approvedDate?: string;
  approvedByUserId?: string;
  approvedByUserName?: string;
  isOverdue: boolean;
  daysUntilDue?: number;
  canStart: boolean;
  canComplete: boolean;
  canApprove: boolean;
  isRejected?: boolean;
  rejectionReason?: string;
}

export interface ManagerStatsDto {
  totalTasks: number;
  activeTasks: number;
  pendingApproval: number;
  approvedTasks: number;
  overdueTasks: number;
  teamMemberCount: number;
  completionRate: number;
}

export interface EmployeeStatsDto {
  totalAssignedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  approvedTasks: number;
  rejectedTasks: number;
  totalHoursLogged: number;
}

export interface TaskTimeLogDto {
  timeLogId: string;
  taskId: string;
  hoursSpent: number;
  date: string;
  workDescription: string;
  employeeId: string;
  employeeName: string;
  loggedDate: string;
}

export interface LogTaskTimeDto {
  taskId: string;           // Required GUID
  hoursSpent: number;       // Required, 0.1 to 24
  date: string;             // Required ISO 8601 date
  workDescription: string;  // Required, max 500 chars
}

export interface RejectTaskRequest {
  reason: string;  // Required, rejection reason/feedback
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
  errors?: string[] | null;
}
