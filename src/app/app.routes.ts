import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AdminComponent } from './roles/admin/admin.component';
import { adminGuard, managerGuard, employeeGuard } from './core/guards/index';
import { ManageusersComponent } from './roles/admin/manageusers/manageusers.component';
import { GeneratereportsComponent } from './roles/admin/generatereports/generatereports.component';
import { SystemConfigComponent } from './roles/admin/system-config/system-config.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'signup', loadComponent: () => import('./home/signup/signup.component').then(m => m.SignupComponent) },
    {
        path: 'signin',
        loadComponent: () => import('./home/signin/signin.component').then(m => m.SigninComponent)
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
// import { ManageusersComponent } from './roles/admin/manageusers/manageusers.component';
// import { SystemConfigComponent } from './roles/admin/system-config/system-config.component';
// import { GeneratereportsComponent } from './roles/admin/generatereports/generatereports.component';
// import { AdminComponent } from './roles/admin/admin.component';


// Admin becomes a parent route

