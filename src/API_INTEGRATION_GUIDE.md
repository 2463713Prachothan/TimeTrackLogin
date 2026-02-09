/**
 * ============================================
 * TIMETRACK APPLICATION - API INTEGRATION GUIDE
 * ============================================
 * 
 * This document outlines how the TimeTrack application is structured for backend integration.
 * All hardcoded data has been removed and replaced with API calls.
 * 
 * ============================================
 * 1. API SERVICE LAYER (NEW)
 * ============================================
 * 
 * Location: src/app/core/services/api.service.ts
 * 
 * Purpose: Centralized HTTP client for all backend API calls
 * 
 * Features:
 * - All endpoints configured and ready for backend URLs
 * - Built-in error handling with fallbacks
 * - Authorization header support (Bearer token)
 * - Mock data toggle for offline development
 * 
 * Configuration:
 * 
 *   // In your app initialization or environment setup:
 *   apiService.setApiUrl('http://your-backend-url:port/api');
 *   apiService.setUseMockData(false); // Use real API
 * 
 * ============================================
 * 2. ENDPOINTS REQUIRED ON BACKEND
 * ============================================
 * 
 * All endpoints should return JSON with appropriate status codes.
 * 
 * --- USER MANAGEMENT ---
 * 
 * GET /api/users
 *   - Returns: array of User objects
 *   - Query params: ?role=Employee, ?department=Dev
 *   - Auth: Required (Bearer token)
 * 
 * GET /api/users/:id
 *   - Returns: single User object
 *   - Auth: Required
 * 
 * GET /api/users/email/:email
 *   - Returns: single User object
 *   - Auth: Required
 * 
 * POST /api/users
 *   - Body: { email, fullName, password, role, department, phone, status }
 *   - Returns: created User with id
 *   - Auth: Optional (for registration)
 * 
 * PUT /api/users/:id
 *   - Body: { partial user fields to update }
 *   - Returns: updated User object
 *   - Auth: Required
 * 
 * DELETE /api/users/:id
 *   - Returns: { success: true }
 *   - Auth: Required (Admin only)
 * 
 * --- TIME LOGS ---
 * 
 * GET /api/time-logs
 *   - Returns: array of TimeLog objects
 *   - Query params: ?employeeId=123, ?date=2024-01-15
 *   - Auth: Required
 * 
 * POST /api/time-logs
 *   - Body: { employeeId, employee, date, startTime, endTime, break, totalHours, status }
 *   - Returns: created TimeLog with id
 *   - Auth: Required
 * 
 * PUT /api/time-logs/:id
 *   - Body: { partial timeLog fields }
 *   - Returns: updated TimeLog
 *   - Auth: Required
 * 
 * --- TASKS ---
 * 
 * GET /api/tasks
 *   - Returns: array of Task objects
 *   - Query params: ?assignedTo=userId
 *   - Auth: Required
 * 
 * POST /api/tasks
 *   - Body: { title, description, assignedTo, hours, status }
 *   - Returns: created Task with id
 *   - Auth: Required
 * 
 * PUT /api/tasks/:id
 *   - Body: { partial task fields }
 *   - Returns: updated Task
 *   - Auth: Required
 * 
 * DELETE /api/tasks/:id
 *   - Returns: { success: true }
 *   - Auth: Required
 * 
 * --- REGISTRATIONS ---
 * 
 * GET /api/registrations/pending
 *   - Returns: array of pending Registration objects
 *   - Auth: Required (Admin only)
 * 
 * POST /api/registrations
 *   - Body: { email, fullName, password }
 *   - Returns: created Registration with id and status='pending'
 *   - Auth: Not required
 * 
 * POST /api/registrations/:id/approve
 *   - Body: { user data with role, department, managerId assignment }
 *   - Returns: created User object
 *   - Auth: Required (Admin only)
 * 
 * POST /api/registrations/:id/reject
 *   - Body: { reason }
 *   - Returns: { success: true }
 *   - Auth: Required (Admin only)
 * 
 * ============================================
 * 3. DATA MODEL UPDATES
 * ============================================
 * 
 * User Model:
 * {
 *   id: string (UUID or auto-increment)
 *   email: string (unique)
 *   password: string (hashed on backend)
 *   fullName: string
 *   role: 'Employee' | 'Manager' | 'Admin'
 *   department: string (nullable)
 *   phone: string (optional)
 *   joinDate: string (ISO date)
 *   status: 'Active' | 'Inactive'
 *   createdDate: Date
 *   managerId: string (for employees, FK to Manager User)
 *   assignedEmployees: string[] (for managers, array of Employee IDs)
 * }
 * 
 * TimeLog Model:
 * {
 *   id: string (UUID or auto-increment)
 *   employeeId: string (FK to User)
 *   employee: string (denormalized fullName for easy display)
 *   date: string (ISO date)
 *   startTime: string (HH:MM format)
 *   endTime: string (HH:MM format)
 *   break: number (minutes)
 *   totalHours: number (calculated on backend or sent by frontend)
 *   status: 'Pending' | 'Approved' | 'Rejected'
 *   description: string (optional)
 *   createdDate: Date
 * }
 * 
 * Task Model:
 * {
 *   id: string (UUID or auto-increment)
 *   title: string
 *   description: string
 *   assignedTo: string (FK to User)
 *   hours: number
 *   status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold'
 *   createdDate: Date
 *   updatedDate: Date
 * }
 * 
 * ============================================
 * 4. SERVICE ARCHITECTURE
 * ============================================
 * 
 * All components use these services (NO hardcoded data in components):
 * 
 * UserService:
 *   - getUsers(): Returns all users via users$ observable
 *   - getUserById(id): Looks up user by ID
 *   - addUser(user): Creates new user via API
 *   - updateUser(id, user): Updates user via API
 *   - deleteUser(id): Deletes user via API
 * 
 * TimeLogService:
 *   - getLogs(): Returns all time logs via logs$ observable
 *   - addLog(log): Creates new time log via API
 *   - updateLog(id, log): Updates time log via API
 *   - deleteLog(id): Deletes time log via API
 * 
 * ManagerDataService:
 *   - logs$: Observable of time logs (from TimeLogService → API)
 *   - tasks$: Observable of tasks (loaded from API)
 *   - addTask(task): Creates task via API
 *   - deleteTask(index): Deletes task via API
 * 
 * ============================================
 * 5. REAL-TIME SYNCHRONIZATION
 * ============================================
 * 
 * HOW CHANGES AUTOMATICALLY SYNC ACROSS ALL ROLES:
 * 
 * Scenario: Employee logs time
 * 
 * 1. Employee clicks "Save" in LogHoursComponent
 * 2. LogHoursComponent calls timeLogService.addLog(timeLog)
 * 3. TimeLogService calls apiService.createTimeLog(timeLog)
 * 4. Backend creates time log in database
 * 5. ApiService receives response and updates logsSubject BehaviorSubject
 * 6. TeamLogsComponent (Manager view) subscribes to managerDataService.logs$
 * 7. Which in turn subscribes to timeLogService.getLogs()
 * 8. Which gets fresh data from API via apiService
 * 9. Manager's dashboard AUTOMATICALLY shows the new time log
 * 10. Admin dashboard also shows it (uses same API endpoints)
 * 
 * SYNC FLOW:
 * 
 *   Component Update → Service API Call → Backend Database
 *                                              ↓
 *                     ← API Response ← Service Updates BehaviorSubject
 *                                              ↓
 *                              Other Components Get Fresh Data
 * 
 * ============================================
 * 6. IMPLEMENTATION STEPS FOR BACKEND TEAM
 * ============================================
 * 
 * Step 1: Create Database Schema
 *   - Users table with all required fields
 *   - TimeLogs table with FK to Users
 *   - Tasks table with FK to Users (assignedTo)
 *   - Registrations table for pending approvals
 * 
 * Step 2: Implement Authentication
 *   - Login endpoint: POST /api/auth/login
 *   - Return JWT token in response
 *   - Use token for all subsequent requests
 * 
 * Step 3: Implement REST Endpoints
 *   - Create all endpoints listed in section 2 above
 *   - Return proper HTTP status codes (200, 201, 400, 401, 404, 500)
 *   - Use the data models from section 3
 * 
 * Step 4: Add Validations
 *   - Email uniqueness validation
 *   - Time log hours cap (max 24 hours per day)
 *   - One manager per employee constraint
 *   - Role-based access control
 * 
 * Step 5: Test with Frontend
 *   - Update API URL in frontend config
 *   - Set useMockData to false
 *   - Test all CRUD operations
 *   - Verify real-time sync across roles
 * 
 * ============================================
 * 7. ENVIRONMENT CONFIGURATION
 * ============================================
 * 
 * Frontend Configuration (main.ts or app.config.ts):
 * 
 *   import { ApiService } from './app/core/services/api.service';
 * 
 *   export const appConfig: ApplicationConfig = {
 *     providers: [
 *       // ... other providers
 *       // Configure API service at startup
 *       {
 *         provide: APP_INITIALIZER,
 *         useFactory: (apiService: ApiService) => () => {
 *           const apiUrl = environment.apiUrl; // From environment config
 *           apiService.setApiUrl(apiUrl);
 *           apiService.setUseMockData(environment.useMockData);
 *         },
 *         deps: [ApiService],
 *         multi: true
 *       }
 *     ]
 *   };
 * 
 * ============================================
 * 8. DEBUGGING TIPS
 * ============================================
 * 
 * If data isn't showing:
 * 
 * 1. Check Browser Console for API errors
 * 2. Verify backend is running and URL is correct
 * 3. Check Network tab in DevTools for API calls
 * 4. Ensure authorization headers are sent
 * 5. Verify CORS is configured on backend
 * 6. Check if backend is returning proper JSON format
 * 
 * To enable mock data for testing without backend:
 * 
 *   apiService.setUseMockData(true);
 * 
 * ============================================
 * 9. MIGRATION PATH
 * ============================================
 * 
 * Current State: Frontend ready for API integration
 * 
 * Phase 1: Backend Setup (Week 1)
 *   - Database schema created
 *   - Authentication endpoint working
 *   - Basic CRUD endpoints implemented
 * 
 * Phase 2: Integration (Week 2)
 *   - Frontend points to backend API
 *   - All data flows through backend
 *   - Real-time sync working
 * 
 * Phase 3: Advanced Features (Week 3+)
 *   - WebSocket for live updates
 *   - Caching strategies
 *   - Performance optimization
 *   - Audit logging
 * 
 * ============================================
 * 10. IMPORTANT NOTES
 * ============================================
 * 
 * ✓ All hardcoded data removed from components
 * ✓ All services use BehaviorSubjects for reactive updates
 * ✓ API fallback to local storage for offline support
 * ✓ Error handling in place for API failures
 * ✓ Authorization headers configured
 * ✓ Real-time sync across all roles implemented
 * ✓ No localStorage duplication - single source of truth
 * ✓ Changes in one component automatically reflect everywhere
 * 
 * ============================================
 */
