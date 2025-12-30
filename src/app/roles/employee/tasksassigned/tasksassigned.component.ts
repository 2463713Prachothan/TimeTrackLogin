import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tasks-assigned', // This MUST match the tag in your HTML
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasksassigned.component.html',
  styleUrls: ['./tasksassigned.component.css']
})
export class TasksComponent {
  // This allows the parent to pass [tasks]="detailedTasks()"
  @Input() tasks: any[] = [];
}