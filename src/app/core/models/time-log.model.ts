export interface TeamTimeLog {
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  breakDuration: string;
  totalHours: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface DashboardStats {
  teamCount: number;
  hoursToday: number;
  activeTasks: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  totalHours: number;
  department?: string;
  status?: string;
}
