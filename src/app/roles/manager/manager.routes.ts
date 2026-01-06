import { Routes } from '@angular/router';
import { managerGuard } from '../../core/services/guards/manager.guard';

export const MANAGER_ROUTES: Routes = [
    {
        path: 'task-management',
        loadComponent: () => import('./task-management/task-management.component')
            .then(m => m.TaskManagementComponent),
        canActivate: [managerGuard]
    },
    {
        path: 'team-logs',
        loadComponent: () => import('./team-logs/team-logs.component')
            .then(m => m.TeamLogsComponent),
        canActivate: [managerGuard]
    },
    {
        path: 'team-analytics',
        loadComponent: () => import('./team-analytics/team-analytics.component')
            .then(m => m.TeamAnalyticsComponent),
        canActivate: [managerGuard]
    },
    { path: '', redirectTo: 'task-management', pathMatch: 'full' }
];
