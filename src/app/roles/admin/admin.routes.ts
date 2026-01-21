import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { ManageusersComponent } from './manageusers/manageusers.component';
import { GeneratereportsComponent } from './generatereports/generatereports.component';
import { SystemConfigComponent } from './system-config/system-config.component';

export const ADMIN_ROUTES: Routes = [
    {
        path: 'admin',
        component: AdminComponent,
        children: [
            { path: 'users', component: ManageusersComponent },
            { path: 'reports', component: GeneratereportsComponent },
            { path: 'system', component: SystemConfigComponent },
            { path: '', redirectTo: 'users', pathMatch: 'full' }
        ]
    }
];
