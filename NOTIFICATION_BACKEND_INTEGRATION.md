# Real-Time Notification System - Backend Integration Guide

## Overview
The notification system has been implemented with the following architecture:
- **Frontend**: Angular with Socket.io for real-time communication
- **State Management**: RxJS BehaviorSubjects for reactive state
- **Real-Time Events**: WebSocket listeners for TASK_ASSIGNED and TASK_COMPLETED
- **Persistent State**: Notifications marked with `isCleared` flag to preserve state across sessions

---

## Frontend Architecture

### 1. WebSocket Service (`websocket.service.ts`)
Handles real-time communication with the backend via Socket.io.

**Key Features:**
- Auto-reconnection with exponential backoff (1s to 5s delay)
- Supports both WebSocket and polling transports
- Emits events through RxJS observables
- Room-based filtering for user-specific notifications

**Key Methods:**
- `joinRoom(roomId)`: Join a user-specific notification room
- `leaveRoom(roomId)`: Leave a room
- `on(eventName)`: Listen to specific socket events
- `emit(eventName, data)`: Emit events to server
- `disconnect()`: Graceful disconnect

**Events Listened:**
- `TASK_ASSIGNED`: New task assigned to employee
- `TASK_COMPLETED`: Task marked as completed
- `NOTIFICATION_UPDATE`: Any notification update

### 2. Notification API Service (`notification-api.service.ts`)
Manages API calls and state management for notifications.

**Notification Interface:**
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'task-assigned' | 'task-submitted' | 'task-approved' | 'task-rejected' | 'info';
  message: string;
  isRead: boolean;
  isCleared: boolean;        // NEW: Tracks if user cleared the notification
  createdAt: Date;
}
```

**Key Methods:**
- `loadNotifications()`: Fetch all non-cleared notifications (GET /api/Notification)
- `markAsRead(id)`: Mark single notification as read (PATCH /api/Notification/{id}/read)
- `markAllAsRead()`: Mark all as read (PATCH /api/Notification/read-all)
- `clearAllNotifications()`: Mark all as cleared (PATCH /api/Notification/clear-all)
- `addRealtimeNotification(notification)`: Add WebSocket notification to local state
- `getCurrentNotifications()`: Get current state without API call

### 3. Notification Component (`notification.component.ts`)
Handles UI logic and real-time updates.

**Key Logic:**
1. **Real-Time Detection**: Compares previous vs current unread count to detect new notifications
2. **Toast Display**: Shows aggregated toast with "+ X more" subtitle
3. **Optimistic Updates**: UI updates immediately before API response
4. **State Persistence**: Uses BehaviorSubjects that never close, so new notifications appear even after "Clear All"

**Component Properties:**
- `showToast`: Control toast visibility
- `toastNotification`: Currently displayed toast notification
- `toastAggregationCount`: Number of additional notifications
- `previousUnreadCount`: Tracks count changes for new notification detection

---

## Backend Requirements

### Required API Endpoints

#### 1. GET /api/Notification
**Purpose**: Fetch all non-cleared notifications for current user

**Query Parameters**: (Optional)
- `userId`: Filter by specific user
- `isRead`: Filter by read status
- `type`: Filter by notification type

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-123",
      "userId": "user-456",
      "type": "task-assigned",
      "message": "New task: Complete Dashboard",
      "isRead": false,
      "isCleared": false,
      "createdAt": "2025-02-25T10:30:00Z"
    }
  ]
}
```

**Note**: MUST filter out notifications where `isCleared = true`

---

#### 2. PATCH /api/Notification/{id}/read
**Purpose**: Mark a single notification as read

**Request Body**: `{}`

**Response**:
```json
{
  "success": true,
  "data": true
}
```

**Backend Logic**:
- Update `isRead = true` for the notification
- Do NOT change `isCleared` status

---

#### 3. PATCH /api/Notification/read-all
**Purpose**: Mark all non-cleared notifications as read

**Request Body**: `{}`

**Response**:
```json
{
  "success": true,
  "data": true
}
```

**Backend Logic**:
- Update all notifications where `isCleared = false` to `isRead = true`
- Only affect current user's notifications
- Preserve `isCleared` status

---

#### 4. PATCH /api/Notification/clear-all
**Purpose**: Mark all notifications as cleared (hidden from user view)

**Request Body**: `{}`

**Response**:
```json
{
  "success": true,
  "data": true
}
```

**Backend Logic**:
- Update all notifications where `userId = current_user` to `isCleared = true`
- This DOES NOT delete notifications, only hides them
- Future queries to GET /api/Notification should NOT return these

**Critical**: When a new notification arrives AFTER clear-all:
- Set `isCleared = false` for the new notification
- The frontend will detect it via WebSocket and display it immediately

---

#### 5. POST /api/Notification
**Purpose**: Create a new notification (called by manager or system)

**Request Body**:
```json
{
  "userId": "user-456",
  "type": "task-assigned",
  "message": "You have been assigned: Complete Dashboard"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "notif-123",
    "userId": "user-456",
    "type": "task-assigned",
    "message": "You have been assigned: Complete Dashboard",
    "isRead": false,
    "isCleared": false,
    "createdAt": "2025-02-25T10:30:00Z"
  }
}
```

**Backend Logic**:
- Always create with `isRead = false`
- Always create with `isCleared = false`
- Generate unique ID

---

### WebSocket Events

#### 1. TASK_ASSIGNED (Server → Client)
**When**: Manager assigns a task to an employee

**Emit to Room**: `notifications-{employeeUserId}`

**Payload**:
```json
{
  "id": "notif-123",
  "userId": "employee-456",
  "type": "task-assigned",
  "message": "New task: Complete Dashboard",
  "createdAt": "2025-02-25T10:30:00Z"
}
```

**Frontend Behavior**:
1. Receive via WebSocket
2. Add to local state via `addRealtimeNotification()`
3. Detect new notification (unread count increased)
4. Display toast with title and message
5. Show aggregation count if multiple notifications received within 1 second

---

#### 2. TASK_COMPLETED (Server → Client)
**When**: Employee completes a task

**Emit to Room**: `notifications-{managerUserId}`

**Payload**:
```json
{
  "id": "notif-124",
  "userId": "manager-789",
  "type": "task-completed",
  "message": "Task completed: Complete Dashboard by John Doe",
  "createdAt": "2025-02-25T10:35:00Z"
}
```

**Frontend Behavior**: Same as TASK_ASSIGNED

---

#### 3. JOIN_ROOM (Client → Server)
**When**: User logs in or component initializes

**Client Emit**:
```json
{
  "roomId": "notifications-user-456"
}
```

**Server Logic**:
- Add user's socket to the specified room
- Only send notifications for that user to this room

---

#### 4. LEAVE_ROOM (Client → Server)
**When**: User logs out or component destroys

**Client Emit**:
```json
{
  "roomId": "notifications-user-456"
}
```

---

## State Management Flow

### Scenario 1: New Task Assigned (Real-Time)
```
Manager creates task
    ↓
Backend creates Notification (isRead=false, isCleared=false)
    ↓
Backend emits TASK_ASSIGNED via WebSocket to employee's room
    ↓
Frontend receives via WebSocket listener
    ↓
Frontend calls addRealtimeNotification()
    ↓
Frontend detects unread count increased
    ↓
Frontend displays toast with notification
    ↓
Employee can dismiss toast (doesn't affect unread count)
    ↓
Employee clicks to read or mark all as read
    ↓
Frontend PATCH /read, Backend sets isRead=true
```

### Scenario 2: Clear All Then New Notification
```
Employee clicks "Clear All"
    ↓
Frontend optimistically clears notifications list
    ↓
Frontend PATCH /clear-all, Backend sets isCleared=true for all
    ↓
Notification tray is now empty
    ↓
[LATER] Manager assigns new task
    ↓
Backend creates new Notification (isRead=false, isCleared=false)
    ↓
Backend emits TASK_ASSIGNED to employee
    ↓
Frontend receives and adds to state
    ↓
Frontend displays fresh toast
    ↓
✓ New notification appears despite previous clear
```

### Scenario 3: Mark All As Read
```
Employee has 5 unread notifications
    ↓
Employee clicks "Mark All as Read"
    ↓
Frontend optimistically marks all as read
    ↓
Frontend PATCH /read-all, Backend sets isRead=true for all (where isCleared=false)
    ↓
Notification list visually updates (no unread indicators)
    ↓
Badge count becomes 0
```

---

## Frontend Integration Points

### 1. Task Creation (Manager's Component)
When manager creates/assigns a task, call:
```typescript
this.notificationApiService.createNotification({
  userId: employeeId,
  type: 'task-assigned',
  message: `New task assigned: ${taskTitle}`
});
```

Then emit WebSocket event:
```typescript
this.webSocketService.emit('TASK_ASSIGNED', {
  id: notificationId,
  userId: employeeId,
  type: 'task-assigned',
  message: `New task assigned: ${taskTitle}`,
  createdAt: new Date()
});
```

### 2. Task Completion (Employee's Component)
When employee marks task complete:
```typescript
this.taskService.completeTask(taskId).subscribe(() => {
  this.notificationApiService.createNotification({
    userId: managerId,
    type: 'task-completed',
    message: `Task completed: ${taskTitle} by ${employeeName}`
  });
  
  this.webSocketService.emit('TASK_COMPLETED', {
    id: notificationId,
    userId: managerId,
    type: 'task-completed',
    message: `Task completed: ${taskTitle} by ${employeeName}`,
    createdAt: new Date()
  });
});
```

---

## Configuration

### Socket.io Server URL
**File**: `websocket.service.ts` Line 19
```typescript
private socketUrl = 'http://localhost:3000'; // Update with your backend URL
```

**Update this to your production backend URL**.

---

## Testing Checklist

- [ ] Backend receives GET /api/Notification and filters `isCleared = false`
- [ ] Backend PATCH /read-all updates all notifications to `isRead = true`
- [ ] Backend PATCH /clear-all updates all to `isCleared = true`
- [ ] Backend PATCH /clear-all returns cleared notifications in subsequent GETs? → NO, should be filtered out
- [ ] WebSocket TASK_ASSIGNED received by frontend
- [ ] Toast displays on new notification
- [ ] Toast auto-dismisses after 5 seconds
- [ ] Aggregation shows "+ X more" when 2+ notifications within 1s
- [ ] After Clear All, new notification still appears
- [ ] Unread badge count is accurate
- [ ] Mark All as Read updates backend and clears list
- [ ] Refresh page loads non-cleared, non-read notifications

---

## Performance Considerations

1. **Debouncing**: Component debounces unread count changes (100ms) to aggregate rapid notifications
2. **Optimistic Updates**: UI updates immediately, reducing perceived latency
3. **No Full Reloads**: Individual notification reads don't reload all notifications
4. **BehaviorSubject**: State management prevents unnecessary re-renders

---

## Security Considerations

1. **User Isolation**: Always check `userId` matches authenticated user before returning notifications
2. **Room-Based Filtering**: Only send notifications to specific user's room
3. **API Authorization**: Backend must verify user can only access their own notifications
4. **WebSocket Auth**: Implement Socket.io authentication middleware to prevent unauthorized room access

