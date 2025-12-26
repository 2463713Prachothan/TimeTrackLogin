import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './roles/auth/home/home.component';
import { NgModule } from '@angular/core';
import { SignupComponent } from './roles/auth/home/signup/signup.component';
import { SigninComponent } from './roles/auth/home/signin/signin.component';

export const routes: Routes = [
    { path: '',component:HomeComponent},
    { path:'signup', component:SignupComponent},
    {path:'signin', component:SigninComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRoutingModule{}
