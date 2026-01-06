import { Component } from '@angular/core';
import { DashboardComponent } from "./dashboardemployee/dashboardemployee.component";

@Component({
  selector: 'app-employee',
  imports: [DashboardComponent],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.css'
})
export class EmployeeComponent {

}
