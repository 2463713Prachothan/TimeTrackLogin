import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './roles/auth/home/home.component';
import { NgModule } from '@angular/core';
import { SignupComponent } from './roles/auth/home/signup/signup.component';
import { SigninComponent } from './roles/auth/home/signin/signin.component';
import { DashboardComponent } from './roles/admin/dashboard/dashboard.component';
import { DashboardemployeeComponent } from './roles/employee/dashboardemployee/dashboardemployee.component';
import { ManagerComponent } from './roles/manager/manager.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '',component:HomeComponent},
    { path:'signup', component:SignupComponent},
    { path:'signin', component:SigninComponent},
    { path: 'admin/dashboard', component: DashboardComponent, canActivate: [authGuard] }, 
    { path: 'manager', component:ManagerComponent, canActivate: [authGuard]},
  { path: 'employee/dashboardemployee', component: DashboardemployeeComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'signin', pathMatch: 'full' }
];

// @NgModule({
//     imports: [RouterModule.forRoot(routes)],
//     exports: [RouterModule]
// })

// export class AppRoutingModule{}
