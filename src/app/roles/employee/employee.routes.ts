import { Routes } from '@angular/router';
import { employeeGuard } from '../../core/guards/index';
export const EMPLOYEE_ROUTES: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('./dashboardemployee/dashboardemployee.component')
            .then(m => m.DashboardemployeeComponent), // Changed from EmployeeDashboardComponent
        canActivate: [employeeGuard]
    },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];