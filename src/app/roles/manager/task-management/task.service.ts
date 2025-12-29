import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Task {
  title: string;
  description: string;
  assignedTo: string;
  hours: number;
  status: 'Pending' | 'In Progress' | 'Completed';
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private initialTasks: Task[] = [
    { title: 'Implement User Authentication', description: 'Develop JWT system', assignedTo: 'John Smith', hours: 16, status: 'In Progress' },
    { title: 'Design Database Schema', description: 'Create tables for tracking', assignedTo: 'Emily Davis', hours: 18, status: 'Completed' }
  ];

  private tasksSubject = new BehaviorSubject<Task[]>(this.initialTasks);
  tasks$ = this.tasksSubject.asObservable();

  addTask(task: Task) {
    const current = this.tasksSubject.value;
    this.tasksSubject.next([task, ...current]);
  }

  deleteTask(index: number) {
    const current = this.tasksSubject.value;
    current.splice(index, 1);
    this.tasksSubject.next([...current]);
  }
} 
