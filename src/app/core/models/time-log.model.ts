// ============================
// TimeLog Models
// ============================

export interface CreateTimeLogDto {
  date: string;              // ISO 8601: "2026-02-21T00:00:00Z"
  startTime: string;         // "09:00:00" (HH:mm:ss format)
  endTime: string | null;    // "17:30:00" or null for ongoing session
  breakDuration: number;     // Integer (minutes)
  totalHours: number;        // Decimal (hours)
  activity?: string;         // Optional activity description
}

export interface TimeLogResponseDto {
  logId: string;
  userId: string;
  userName?: string;
  date: string;
  startTime: string;
  endTime: string | null;
  breakDuration: number;
  totalHours: number;
  activity?: string;
}

export interface TeamTimeLogDto {
  logId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string | null;
  breakDuration: number;
  totalHours: number;
  activity?: string;
  status: string;          // "In Progress" | "Completed"
}

// Legacy interface for backward compatibility (will be removed)
export interface TeamTimeLog {
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string | null;
  breakDuration: string;
  totalHours: number;
}

// ============================
// User Models
// ============================

export interface UserDto {
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  managerId?: string | null;
  managerName?: string | null;
  assignedEmployeeIds: string[];
}

export interface TeamMemberDto {
  userId: string;
  name: string;
  email: string;
}

export interface DashboardStatsDto {
  totalTeamMembers: number;
  activeTasks: number;
  totalTeamHoursToday: number;
}

export interface LoginResponseDto {
  userId: string;
  token: string;
  email: string;
  role: string;
  fullName: string;
}

// ============================
// Common Response Wrapper
// ============================

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
  errors?: string[];
}

// Legacy interfaces for backward compatibility
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

