import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './roles/auth/home/home.component';
import { NgModule } from '@angular/core';
//import { SignupComponent } from './roles/auth/home/signup/signup.component';
//import { SigninComponent } from './roles/auth/home/signin/signin.component';
//import { AdminDashboardComponent } from './roles/admin/dashboard/dashboard.component';
import { DashboardemployeeComponent } from './roles/employee/dashboardemployee/dashboardemployee.component';
import { ManagerComponent } from './roles/manager/manager.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '',component:HomeComponent},
    { path:'signup', loadComponent: () => import('./roles/auth/home/signup/signup.component').then(m => m.SignupComponent)},
    { path:'signin',
      loadComponent: () => import('./roles/auth/home/signin/signin.component')
      .then(m => m.SigninComponent)},
    { path: 'admin/dashboard', loadComponent: () => import('./roles/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent), canActivate: [authGuard] }, 
    { path: 'manager', loadComponent: () => import('./roles/manager/manager.component').then(m => m.ManagerComponent), canActivate: [authGuard]},
  { path: 'employee/dashboardemployee', loadComponent: () => import('./roles/employee/dashboardemployee/dashboardemployee.component').then(m => m.DashboardemployeeComponent), canActivate: [authGuard] },
  { path: '', redirectTo: 'signin', pathMatch: 'full' }
];

// @NgModule({
//     imports: [RouterModule.forRoot(routes)],
//     exports: [RouterModule]
// })

// export class AppRoutingModule{}
