import { HomeComponent } from './home/home.component';
import { adminGuard, managerGuard, employeeGuard } from './core/guards/index';
import { Routes } from '@angular/router';


export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'signup', 
        loadComponent: () => import('./home/signup/signup.component').then(m => m.SignupComponent) },
    {path: 'signin',
        loadComponent: () => import('./home/signin/signin.component').then(m => m.SigninComponent)},
    { path: 'admin/dashboard', 
        loadComponent: () => import('./roles/admin/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [adminGuard] },
    { path: 'manager', 
        loadComponent: () => import('./roles/manager/manager.component').then(m => m.ManagerComponent), canActivate: [managerGuard] },
    { path: 'employee/dashboardemployee', 
        loadComponent: () => import('./roles/employee/dashboardemployee/dashboardemployee.component').then(m => m.DashboardemployeeComponent), canActivate: [employeeGuard] },
    { path: '', redirectTo: 'signin', pathMatch: 'full' },
   
];