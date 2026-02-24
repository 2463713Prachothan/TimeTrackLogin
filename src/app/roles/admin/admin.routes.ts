import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { ManageusersComponent } from './manageusers/manageusers.component';
import { GeneratereportsComponent } from './generatereports/generatereports.component';
import { ApproveRegistrationsComponent } from './approve-registrations/approve-registrations.component';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        component: AdminComponent,
        children: [
            { path: 'users', component: ManageusersComponent },
            { path: 'approvals', component: ApproveRegistrationsComponent },
            { path: 'reports', component: GeneratereportsComponent },
            { path: '', redirectTo: 'users', pathMatch: 'full' }
        ]
    }
];
