# Productivity API Connection - Complete Setup

## Overview
The frontend PersonalreportsComponent is now fully connected to the Productivity API endpoint at `https://localhost:7172/api/Productivity`.

## Connection Flow

```
PersonalreportsComponent
    ↓
TaskService.getProductivity()
    ↓
ApiService.getProductivity()
    ↓
HTTP GET /api/Productivity
    ↓ (via proxy)
https://localhost:7172/api/Productivity
```

## How It Works

### 1. Frontend Call Path
**File**: `src/app/roles/employee/personalreports/personalreports.component.ts`

When the Productivity tab loads:
- Component calls `this.taskService.getProductivity()`
- TaskService wraps it and calls `this.apiService.getProductivity()`
- ApiService makes HTTP GET request to `/api/Productivity`

### 2. Service Layer
**TaskService** (`src/app/core/services/task.service.ts`):
```typescript
getProductivity(): Observable<any> {
  return this.apiService.getProductivity().pipe(
    tap((response: any) => {
      console.log('✅ TaskService.getProductivity - Response:', response);
    })
  );
}
```

### 3. API Service
**ApiService** (`src/app/core/services/api.service.ts`):
```typescript
getProductivity(): Observable<any> {
  const url = `${this.apiUrl}/Productivity`;  // /api/Productivity
  return this.http.get<any>(url, { headers: this.getHeaders() })
    .pipe(
      tap(response => console.log('✅ API Response:', response)),
      catchError(err => {
        console.error('❌ API Error:', err);
        throw err;
      })
    );
}
```

### 4. Proxy Configuration
**File**: `proxy.conf.json`
```json
{
  "/api": {
    "target": "https://localhost:7172",
    "secure": false,
    "changeOrigin": true
  }
}
```

All `/api` requests are automatically routed to `https://localhost:7172`

## Expected API Response Format

The backend should return the following JSON structure:

```json
{
  "totalHoursLogged": 24.5,
  "taskCompletionRate": 75,
  "efficiencyScore": 80,
  "completedTasks": 9,
  "totalTasks": 12,
  "inProgressTasks": 2,
  "pendingTasks": 1,
  "weeklyAverage": 3.5,
  "dailyHours": [4, 5, 3, 4.5, 4, 2.5, 1.5],
  "taskDistribution": {
    "completed": 9,
    "inProgress": 2,
    "pending": 1
  }
}
```

## Data Mapping in Component

The response data is mapped to component properties:

| API Response Field | Component Property | Type | Display |
|---|---|---|---|
| totalHoursLogged | totalHoursLogged | number | "0.0 hrs" |
| taskCompletionRate | taskCompletionRate | number | "0%" |
| efficiencyScore | efficiencyScore | number | "0%" |
| completedTasks | completedTasks | number | "0 of 0 tasks" |
| totalTasks | totalTasks | number | Used in calculation |
| inProgressTasks | inProgressTasks | number | "0 task(s)" |
| pendingTasks | pendingTasks | number | "0 task(s)" |
| weeklyAverage | weeklyAverage | number | "0 hours per day" |
| dailyHours | lastSevenDaysHours | array | Bar chart data |
| taskDistribution | taskStatusData | object | Pie chart data |

## Fallback Mechanism

If the `/api/Productivity` endpoint fails or returns empty data:
1. Component logs warning with error details
2. Falls back to `loadProductivityDataFallback(currentUser)`
3. Calculates metrics locally from:
   - TimeLogService (hours logged)
   - TaskService (task completion rates)

## Console Logs for Debugging

When running, check the browser console (F12) for these logs:

**Success Flow**:
```
📊 PersonalreportsComponent.loadProductivityData - Starting to load...
📡 ApiService.getProductivity - Making GET request to: /api/Productivity
✅ PersonalreportsComponent - API productivity data loaded successfully
📊 PersonalreportsComponent.applyProductivityData - Raw API response
📊 Productivity data fully applied and ready for display
```

**Error Flow**:
```
📊 PersonalreportsComponent.loadProductivityData - Starting to load...
📡 ApiService.getProductivity - Making GET request to: /api/Productivity
❌ ApiService.getProductivity - Error fetching productivity data
⚠️ PersonalreportsComponent - Productivity API failed, falling back
```

## Testing the Connection

1. **Open DevTools** (F12 in browser)
2. **Go to Network tab**
3. **Click Productivity tab** in the application
4. **Look for** the GET request to `/api/Productivity`
5. **Check response**:
   - Status 200 = Success
   - Status 401/403 = Authentication issue
   - Status 404 = Endpoint not found
   - Status 500 = Server error

## Backend Requirements

For the API to work, your backend needs:

**Controller**: `ProductivityController.cs`
```
GET /api/Productivity - Get current user's productivity data
```

**Response Format**: JSON matching the structure above

**Authentication**: 
- Must respect the Bearer token in Authorization header
- Token retrieved from localStorage in frontend

## Authentication Verification

The ApiService automatically includes authentication:

```typescript
private getHeaders(): HttpHeaders {
  let headers = new HttpHeaders({'Content-Type': 'application/json'});
  
  // Get token from multiple sources
  let token = localStorage.getItem('token');
  if (!token) {
    const userSession = localStorage.getItem('user_session');
    if (userSession) {
      const user = JSON.parse(userSession);
      token = user.token || user.accessToken || user.jwtToken;
    }
  }
  
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  
  return headers;
}
```

## Troubleshooting

### Issue: API returns 404
**Solution**: Backend endpoint `/api/Productivity` doesn't exist. Create it in your ProductivityController.

### Issue: API returns 401/403
**Solution**: Authentication token not being sent or is invalid. Check:
- localStorage has 'token' or 'user_session'
- Token is still valid (not expired)

### Issue: CORS error
**Solution**: Proxy not working. Verify proxy.conf.json is configured and ng serve is running with `--proxy-config proxy.conf.json`

### Issue: Shows 0.0 hrs but no console error
**Solution**: API is returning empty response or null values. Ensure backend calculates metrics correctly.

## Running the Application

```bash
# Terminal 1 - Start Angular with proxy
ng serve --proxy-config proxy.conf.json

# Terminal 2 - Ensure backend is running
# Backend should be running on https://localhost:7172
```

## Summary

✅ Frontend: PersonalreportsComponent is ready to display productivity data
✅ Service Layer: TaskService and ApiService are configured
✅ API Routing: Proxy configured to route to backend
✅ Auth: Bearer token automatically included

Now the backend needs to implement the `/api/Productivity` endpoint to return the productivity metrics in the expected JSON format.
