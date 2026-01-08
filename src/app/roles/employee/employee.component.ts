import { Component } from '@angular/core';
import { DashboardemployeeComponent } from "./dashboardemployee/dashboardemployee.component";
import { TasksComponent } from "./tasksassigned/tasksassigned.component";

@Component({
  selector: 'app-employee',
  imports: [DashboardemployeeComponent, TasksComponent],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.css'
})
export class EmployeeComponent {

}
