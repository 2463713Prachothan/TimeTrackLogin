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
  teamMembers: string[] = []; // Dynamic list of names

  newTask = {
    title: '',
    description: '',
    assignedTo: '', // We will set a default in ngOnInit
    hours: 8,
    status: 'Pending'
  };

  constructor(private dataService: ManagerDataService) {}

  ngOnInit() {
    // 1. Get Tasks
    this.dataService.tasks$.subscribe((data: any[]) => {
      this.tasks = data;
    });

    // 2. Get Members dynamically from logs
    this.dataService.logs$.subscribe((logs: any[]) => {
      // Create a unique list of names from the logs
      this.teamMembers = [...new Set(logs.map(log => log.employee))];
      
      // Set default assignment to the first person found if empty
      if (this.teamMembers.length > 0 && !this.newTask.assignedTo) {
        this.newTask.assignedTo = this.teamMembers[0];
      }
    });
  }

  addTask() {
    if (this.newTask.title.trim()) {
      this.dataService.addTask({ ...this.newTask });
      this.showModal = false;
      this.resetForm();
    }
  }

  deleteTask(index: number) {
    if (confirm('Are you sure?')) {
      this.dataService.deleteTask(index);
    }
  }

  getCount(status: string) {
    return this.tasks.filter(t => t.status === status).length;
  }

  get pendingTasks() {
  return this.tasks.filter(t => t.status === 'Pending');
}

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