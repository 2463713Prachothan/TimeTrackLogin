import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Task {
    id?: string;
    title: string;
    description: string;
    assignedTo: string;
    dueDate?: string;
    priority: 'Low' | 'Medium' | 'High';
    hours: number;
    status: 'Pending' | 'In Progress' | 'Completed';
    createdDate?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class TaskService {

    private initialTasks: Task[] = [
        {
            id: '1',
            title: 'API Integration',
            description: 'Connect frontend to login service',
            assignedTo: 'Akash',
            priority: 'High',
            hours: 12,
            status: 'In Progress',
            dueDate: '2026-01-25'
        },
        {
            id: '2',
            title: 'UI Refinement',
            description: 'Adjust table padding and font sizes',
            assignedTo: 'Chandana',
            priority: 'Medium',
            hours: 4,
            status: 'Completed',
            dueDate: '2026-01-20'
        },
        {
            id: '3',
            title: 'Database Design',
            description: 'Create SQL schema for time tracking',
            assignedTo: 'Prachothan',
            priority: 'High',
            hours: 20,
            status: 'Pending',
            dueDate: '2026-01-28'
        },
        {
            id: '4',
            title: 'Unit Testing',
            description: 'Write tests for manager dashboard',
            assignedTo: 'Umesh',
            priority: 'Medium',
            hours: 8,
            status: 'In Progress',
            dueDate: '2026-01-23'
        }
    ];

    private tasksSubject = new BehaviorSubject<Task[]>(this.initialTasks);
    tasks$ = this.tasksSubject.asObservable();

    constructor() { }

    /**
     * Get all tasks
     */
    getTasks(): Observable<Task[]> {
        return this.tasks$;
    }

    /**
     * Get task by ID
     */
    getTaskById(id: string): Task | undefined {
        return this.tasksSubject.value.find(task => task.id === id);
    }

    /**
     * Get tasks by status
     */
    getTasksByStatus(status: string): Task[] {
        return this.tasksSubject.value.filter(task => task.status === status);
    }

    /**
     * Get tasks assigned to a specific employee
     */
    getTasksByAssignee(assignedTo: string): Task[] {
        return this.tasksSubject.value.filter(task => task.assignedTo.toLowerCase() === assignedTo.toLowerCase());
    }

    /**
     * Add a new task
     */
    addTask(task: Task) {
        task.id = task.id || `task_${Date.now()}`;
        task.createdDate = new Date();
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next([task, ...currentTasks]);
    }

    /**
     * Update an existing task
     */
    updateTask(id: string, updatedTask: Partial<Task>) {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex(task => task.id === id);
        if (index !== -1) {
            currentTasks[index] = { ...currentTasks[index], ...updatedTask };
            this.tasksSubject.next([...currentTasks]);
        }
    }

    /**
     * Delete a task by ID
     */
    deleteTask(id: string) {
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next(currentTasks.filter(task => task.id !== id));
    }

    /**
     * Update task status
     */
    updateTaskStatus(id: string, status: 'Pending' | 'In Progress' | 'Completed') {
        this.updateTask(id, { status });
    }

    /**
     * Get tasks count by status
     */
    getTaskCountByStatus(status: string): number {
        return this.tasksSubject.value.filter(task => task.status === status).length;
    }
}
