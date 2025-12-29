import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.css']
})
export class TaskManagementComponent {
  showModal = false;

  // Initial Task List
  tasks = [
    { title: 'Implement User Authentication', description: 'Develop JWT-based system for role management', assignedTo: 'John Smith', hours: 16, status: 'In Progress' },
    { title: 'Design Database Schema', description: 'Create and document database schema for time tracking', assignedTo: 'John Smith', hours: 18, status: 'Completed' }
  ];

  // Object for the "New Task" form
  newTask = {
    title: '',
    description: '',
    assignedTo: 'John Smith',
    hours: 8,
    status: 'Pending'
  };
taskList: any;

  // Logic to add task
  addTask() {
    if (this.newTask.title) {
      this.tasks.unshift({ ...this.newTask }); // Add to beginning of list
      this.showModal = false; // Close popup
      this.resetForm();
    }
  }

  // Logic to delete task
  deleteTask(index: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasks.splice(index, 1);
    }
  }

  // Logic to count tasks for status cards
  getCount(status: string) {
    return this.tasks.filter(t => t.status === status).length;
  }

  resetForm() {
    this.newTask = { title: '', description: '', assignedTo: 'John Smith', hours: 8, status: 'Pending' };
  }
}