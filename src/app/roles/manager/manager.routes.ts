import { Routes } from '@angular/router';
import { ManagerComponent } from './manager.component';
import { TaskManagementComponent } from './task-management/task-management.component';
import { TeamLogsComponent } from './team-logs/team-logs.component';
import { TeamAnalyticsComponent } from './team-analytics/team-analytics.component';

export const MANAGER_ROUTES: Routes = [
    {
        path: 'manager',
        component: ManagerComponent,
        children: [
            { path: 'task-management', component: TaskManagementComponent },
            { path: 'team-logs', component: TeamLogsComponent },
            { path: 'team-analytics', component: TeamAnalyticsComponent },
            { path: '', redirectTo: 'team-logs', pathMatch: 'full' }
        ]
    }
];
