import { Routes } from '@angular/router';
import { EmployeeComponent } from './employee.component';
import { DashboardemployeeComponent } from './dashboardemployee/dashboardemployee.component';
import { LogHoursComponent } from './loghours/loghours.component';
import { PersonalreportsComponent } from './personalreports/personalreports.component';
import { TasksComponent } from './tasksassigned/tasksassigned.component';

export const EMPLOYEE_ROUTES: Routes = [
    {
        path: '',
        component: EmployeeComponent,
        children: [
            { path: 'dashboard', component: DashboardemployeeComponent },
            { path: 'loghours', component: LogHoursComponent },
            { path: 'tasks', component: TasksComponent},
            { path: 'reports', component: PersonalreportsComponent },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    }
];
