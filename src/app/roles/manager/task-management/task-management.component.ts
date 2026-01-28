import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerDataService } from '../../../core/services/manager-data.service';

@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.css']
})
export class TaskManagementComponent implements OnInit {
  showModal = false;
  tasks: any[] = [];
  teamMembers: string[] = [];

  newTask = {
    title: '',
    description: '',
    assignedTo: '',
    hours: 8,
    status: 'Pending'
  };

  constructor(private dataService: ManagerDataService) {}

  ngOnInit() {
    // Load tasks data
    this.dataService.tasks$.subscribe((data: any[]) => {
      this.tasks = data;
    });

    // Load team members from logs
    this.dataService.logs$.subscribe((logs: any[]) => {
      this.teamMembers = [...new Set(logs.map(log => log.employee))];

      // Set default assignee
      if (this.teamMembers.length > 0 && !this.newTask.assignedTo) {
        this.newTask.assignedTo = this.teamMembers[0];
      }
    });
  }

  // Add new task
  addTask() {
    if (this.newTask.title.trim()) {
      this.dataService.addTask({ ...this.newTask });
      this.showModal = false;
      this.resetForm();
    }
  }

  // Delete task with confirmation
  deleteTask(index: number) {
    if (confirm('Are you sure?')) {
      this.dataService.deleteTask(index);
    }
  }

  // Count tasks by status
  getCount(status: string) {
    return this.tasks.filter(t => t.status === status).length;
  }

  // Get pending tasks
  get pendingTasks() {
    return this.tasks.filter(t => t.status === 'Pending');
  }

  // Reset form to default values
  resetForm() {
    this.newTask = {
      title: '',
      description: '',
      assignedTo: this.teamMembers[0] || '',
      hours: 8,
      status: 'Pending'
    };
  }
}