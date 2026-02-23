# Backend Prompt for Productivity API Implementation

## Request to Backend Developer

Please implement the `/api/Productivity` endpoint in your C# backend that returns productivity metrics for the currently authenticated employee.

---

## Endpoint Specification

**Endpoint**: `GET /api/Productivity`

**Authentication**: Required (Bearer Token)

**Base URL**: `https://localhost:7172`

**Full URL**: `https://localhost:7172/api/Productivity`

---

## Expected Response Format (JSON)

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
  "dailyHours": [4.0, 5.0, 3.0, 4.5, 4.0, 2.5, 1.5],
  "taskDistribution": {
    "completed": 9,
    "inProgress": 2,
    "pending": 1
  }
}
```

---

## Field Descriptions

| Field | Type | Description |
|---|---|---|
| totalHoursLogged | decimal | Total hours logged in the last 7 days |
| taskCompletionRate | int | Percentage of tasks completed (0-100) |
| efficiencyScore | int | Efficiency score based on task completion and hours (0-100) |
| completedTasks | int | Number of completed tasks |
| totalTasks | int | Total number of assigned tasks |
| inProgressTasks | int | Number of tasks currently in progress |
| pendingTasks | int | Number of pending tasks |
| weeklyAverage | decimal | Average hours logged per day (last 7 days) |
| dailyHours | array[decimal] | Array of 7 values representing hours logged each day (last 7 days) |
| taskDistribution | object | Distribution of tasks by status |

---

## Calculation Logic

### totalHoursLogged
- Sum all hours from TimeLog entries for the current user for the last 7 days
- Formula: `SUM(TimeLogs.TotalHours) WHERE CreatedDate >= DateTime.Now.AddDays(-7)`

### taskCompletionRate
- Percentage of completed tasks out of total assigned tasks
- Formula: `(CompletedTasks / TotalTasks) * 100`
- Return 0 if TotalTasks is 0

### efficiencyScore
- Percentage of completed + in-progress tasks out of total
- Formula: `((CompletedTasks + InProgressTasks) / TotalTasks) * 100`
- Return 0 if TotalTasks is 0

### completedTasks / totalTasks / inProgressTasks / pendingTasks
- Count of tasks by status for current user
- Status values: "Pending", "In Progress", "Completed"

### weeklyAverage
- Average hours per day for last 7 days
- Formula: `TotalHoursLogged / DaysWithLogs`
- Only count days that have at least 1 hour logged

### dailyHours
- Array of 7 values representing each of the last 7 days
- Order: [Day6Ago, Day5Ago, Day4Ago, Day3Ago, Day2Ago, Yesterday, Today]
- For each day, sum all hours logged that day
- If no logs for a day, value is 0.0

### taskDistribution
- Object with counts of tasks by status:
  - completed: count of tasks with status "Completed"
  - inProgress: count of tasks with status "In Progress"
  - pending: count of tasks with status "Pending"

---

## Data Sources

You'll need to query:

1. **TimeLogs Table**
   - Fields: UserId, TotalHours, CreatedDate
   - Filter by current user's ID

2. **Tasks Table**
   - Fields: AssignedTo, Status, Id
   - Filter by current user

3. **Current User**
   - Extract from JWT token or session
   - Use this to filter personal data

---

## HTTP Response Codes

| Code | Meaning |
|---|---|
| 200 | Success - return JSON response |
| 401 | Unauthorized - user not authenticated |
| 403 | Forbidden - user lacks permission |
| 500 | Server error - return error details |

---

## Error Handling

If there's an error calculating metrics, return:

```json
{
  "error": "Error message describing what went wrong",
  "statusCode": 500
}
```

Or return default zeros if no data found:

```json
{
  "totalHoursLogged": 0.0,
  "taskCompletionRate": 0,
  "efficiencyScore": 0,
  "completedTasks": 0,
  "totalTasks": 0,
  "inProgressTasks": 0,
  "pendingTasks": 0,
  "weeklyAverage": 0.0,
  "dailyHours": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  "taskDistribution": {
    "completed": 0,
    "inProgress": 0,
    "pending": 0
  }
}
```

---

## Implementation Checklist

- [ ] Create ProductivityController.cs (or add to existing controller)
- [ ] Implement GET /api/Productivity method
- [ ] Add [Authorize] attribute to require authentication
- [ ] Query TimeLogs for last 7 days
- [ ] Query Tasks for current user
- [ ] Calculate all metrics
- [ ] Handle edge cases (no data, division by zero)
- [ ] Return proper HTTP status codes
- [ ] Test with Postman or similar tool
- [ ] Verify response format matches JSON specification

---

## Optional: Alternative Endpoint

If you also need to get productivity for a specific employee (for managers):

**Endpoint**: `GET /api/Productivity/{employeeId}`

**Response**: Same format as above, but for the specified employee

---

## Testing Notes

After implementation, test with:

```
GET https://localhost:7172/api/Productivity
Authorization: Bearer {valid_jwt_token}
```

Expected Response:
- Status: 200 OK
- Body: JSON matching the format above with actual calculated values

---

## Frontend Consumption

The frontend PersonalreportsComponent will automatically:
1. Call this endpoint when Productivity tab is clicked
2. Parse the JSON response
3. Display metrics in the UI
4. Update charts with the data
5. Show insights based on the values

No frontend changes needed once this endpoint is implemented.
