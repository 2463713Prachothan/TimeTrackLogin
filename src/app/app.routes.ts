import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './roles/auth/home/home.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { managerGuard } from './core/guards/manager.guard';
import { employeeGuard } from './core/guards/employee.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'signup', loadComponent: () => import('./roles/auth/home/signup/signup.component').then(m => m.SignupComponent) },
    {
        path: 'signin',
        loadComponent: () => import('./roles/auth/home/signin/signin.component').then(m => m.SigninComponent)
    },
    { path: 'admin/dashboard', loadComponent: () => import('./roles/admin/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [adminGuard] },

    { path: 'manager', loadComponent: () => import('./roles/manager/manager.component').then(m => m.ManagerComponent), canActivate: [managerGuard] },
    { path: 'employee/dashboardemployee', loadComponent: () => import('./roles/employee/dashboardemployee/dashboardemployee.component').then(m => m.DashboardemployeeComponent), canActivate: [employeeGuard] },
    { path: '', redirectTo: 'signin', pathMatch: 'full' },
    {
        path: 'admin',
        component: AdminComponent,
        canActivate: [adminGuard],
        children: [
            { path: 'users', component: ManageusersComponent },
            { path: 'organization', component: GeneratereportsComponent },
            { path: 'system', component: SystemConfigComponent },
            { path: '', redirectTo: 'users', pathMatch: 'full' } // Default to users tab
        ]
    },
];

// // @NgModule({
// //     imports: [RouterModule.forRoot(routes)],
// //     exports: [RouterModule]
// // })

// // export class AppRoutingModule{}


// Import the components you use for the tabs
import { ManageusersComponent } from './roles/admin/manageusers/manageusers.component';
import { SystemConfigComponent } from './roles/admin/system-config/system-config.component';
import { GeneratereportsComponent } from './roles/admin/generatereports/generatereports.component';
import { AdminComponent } from './roles/admin/admin.component';


// Admin becomes a parent route

