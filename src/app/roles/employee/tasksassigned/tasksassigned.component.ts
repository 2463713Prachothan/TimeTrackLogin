import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for ngClass/ngStyle in older versions

@Component({
  selector: 'app-tasksassigned',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasksassigned.component.html',
  styleUrls: ['./tasksassigned.component.css']
})
export class TasksComponent {
  activeTab: string = 'My Tasks';

  // Stats Data
  stats = [
    { label: 'Pending', value: '1 tasks', icon: 'fa-regular fa-circle', class: 'icon-gray' },
    { label: 'In Progress', value: '1 tasks', icon: 'fa-regular fa-clock', class: 'icon-blue' },
    { label: 'Completed', value: '1 tasks', icon: 'fa-regular fa-circle-check', class: 'icon-green' }
  ];

  // Task List with "Not Yet Started" added
  taskList = [
    {
      name: 'Implement User Authentication Module',
      status: 'In Progress',
      currentHours: 13.5,
      totalHours: 16,
      progress: 84,
      icon: 'fa-regular fa-clock',
      statusClass: 'badge-role manager',
      iconClass: 'icon-blue'
    },
    {
      name: 'Design Database Schema',
      status: 'Completed',
      currentHours: 5.5,
      totalHours: 8,
      progress: 100,
      icon: 'fa-regular fa-circle-check',
      statusClass: 'status-active', // Green theme
      iconClass: 'icon-green'
    },
    {
      name: 'Code Review - Time Logging Module',
      status: 'Not Yet Started', // Added "Not Started" state
      currentHours: 0.0,
      totalHours: 4,
      progress: 0,
      icon: 'fa-solid fa-play', // Icon for not started
      statusClass: 'badge-role employee',
      iconClass: 'icon-gray'
    }
  ];
}