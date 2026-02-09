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
        loadChildren: () => import('./roles/admin/admin.routes').then(m => m.ADMIN_ROUTES), canActivate: [adminGuard] },
    { path: 'manager', 
        loadChildren: () => import('./roles/manager/manager.routes').then(m => m.MANAGER_ROUTES), canActivate: [managerGuard] },
    { path: 'employee', 
        loadChildren: () => import('./roles/employee/employee.routes').then(m => m.EMPLOYEE_ROUTES), canActivate: [employeeGuard] },
    { path: 'unauthorized', component: UnauthorizedComponent },
    { path: '404', component: NotFoundComponent },
    { path: '**', redirectTo: '/404' }
];
