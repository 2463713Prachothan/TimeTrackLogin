import { HomeComponent } from './home/home.component';
import { adminGuard, managerGuard, employeeGuard } from './core/guards/index';
import { Routes } from '@angular/router';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';


export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'signup', 
        loadComponent: () => import('./home/signup/signup.component').then(m => m.SignupComponent) },
    {path: 'signin',
        loadComponent: () => import('./home/signin/signin.component').then(m => m.SigninComponent)},
    { path: 'admin', 
        loadComponent: () => import('./roles/admin/admin.component').then(m => m.AdminComponent), canActivate: [adminGuard] },
    { path: 'manager', 
        loadComponent: () => import('./roles/manager/manager.component').then(m => m.ManagerComponent), canActivate: [managerGuard] },
    { path: 'employee/dashboardemployee', 
        loadComponent: () => import('./roles/employee/dashboardemployee/dashboardemployee.component').then(m => m.DashboardemployeeComponent), canActivate: [employeeGuard] },
    { path: 'unauthorized', component: UnauthorizedComponent },
    { path: '404', component: NotFoundComponent },
    { path: '**', redirectTo: '/404' }
];
