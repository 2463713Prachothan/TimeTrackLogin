// ============================
// Break Tracking Models
// ============================

export interface CreateBreakDto {
  timeLogId: string;
  activity: string;
  startTime: string;  // HH:mm:ss format (e.g., "10:30:00")
}

export interface EndBreakDto {
  endTime: string;  // HH:mm:ss format (e.g., "10:50:00")
}

export interface BreakResponseDto {
  breakId: string;
  timeLogId: string;
  activity: string;
  startTime: string;      // HH:mm:ss format from API
  endTime: string | null; // HH:mm:ss format or null if active
  duration: number | null; // Minutes (calculated by backend)
  createdAt: string;      // ISO 8601 date string
}

// UI Display Model (with formatted times)
export interface BreakDisplayModel {
  breakId: string;
  activity: string;
  startTime: string;    // Formatted as "10:30 AM"
  endTime: string;      // Formatted as "10:50 AM" or "--:-- --"
  duration: string;     // Formatted as "20m" or "--"
}
