import { Injectable, signal, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Task {
    id?: string;
    taskId?: string;  // Auto-generated task ID (e.g., TASK-001)
    title: string;
    description: string;
    assignedTo: string;  // Single employee assignment
    dueDate?: string;
    priority: 'Low' | 'Medium' | 'High';
    hours: number;
    status: 'Pending' | 'In Progress' | 'Completed';
    createdDate?: Date;
    assignedDate?: Date;
}

export interface TaskSubmission {
    id?: string;
    taskId: string;  // Reference to Task.id
    taskTitle: string;
    submittedBy: string;  // Employee name
    submittedDate: Date;
    completionStatus: 'Completed' | 'In Progress' | 'Not Started';
    hoursSpent: number;
    comments: string;
    attachments?: string[];  // File names or URLs
    approvalStatus: 'Pending' | 'Approved' | 'Rejected' | 'Need Changes';
    approvedBy?: string;  // Manager name
    approvalDate?: Date;
    approvalComments?: string;
    reassignDate?: string;  // If re-assigned to different date
    priority: 'Low' | 'Medium' | 'High';
}

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiService = inject(ApiService);

    private tasksSubject = new BehaviorSubject<Task[]>([]);
    tasks$ = this.tasksSubject.asObservable();

    constructor() {
        // Load stored tasks synchronously first
        const storedTasks = this.loadTasksFromStorage();
        if (storedTasks.length > 0) {
            console.log('Loaded tasks from localStorage:', storedTasks.length);
            this.tasksSubject.next(storedTasks);
        }
        
        // Then try to fetch from API asynchronously
        this.loadTasks();
    }

    /**
     * Load tasks from localStorage
     */
    private loadTasksFromStorage(): Task[] {
        if (typeof window !== 'undefined' && window.localStorage) {
            const stored = localStorage.getItem('tasks');
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    console.error('Error parsing tasks from localStorage:', e);
                    return [];
                }
            }
        }
        return [];
    }

    /**
     * Save tasks to localStorage
     */
    private saveTasksToStorage(tasks: Task[]): void {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                localStorage.setItem('tasks', JSON.stringify(tasks));
                console.log('Tasks saved to localStorage:', tasks.length);
            } catch (e) {
                console.error('Error saving tasks to localStorage:', e);
            }
        }
    }

    /**
     * Load tasks from API or fallback to localStorage
     */
    private loadTasks(): void {
        // Try to load from localStorage first for better UX
        const storedTasks = this.loadTasksFromStorage();
        if (storedTasks.length > 0) {
            console.log('Loaded tasks from localStorage:', storedTasks.length);
            this.tasksSubject.next(storedTasks);
        } else {
            // Start with empty array
            console.log('No tasks found, starting with empty array');
            this.tasksSubject.next([]);
        }

        // Try to fetch from API and update (only if API has data)
        this.apiService.getTasks().subscribe({
            next: (tasks: any[]) => {
                if (tasks && tasks.length > 0) {
                    // Only update if API returned data
                    this.tasksSubject.next(tasks);
                    this.saveTasksToStorage(tasks);
                } else {
                    // API returned empty, keep current data
                    console.log('API returned no tasks, keeping existing data');
                }
            },
            error: (err) => {
                // API failed, keep localStorage/initial data
                console.log('Failed to load tasks from API:', err);
            }
        });
    }

    /**
     * Get all tasks
     */
    getTasks(): Observable<Task[]> {
        return this.tasks$;
    }

    /**
     * Refresh tasks by reloading from API/storage
     */
    refreshTasks(): void {
        console.log('🔄 TaskService.refreshTasks - Reloading tasks from storage/API');
        this.loadTasks();
    }

    /**
     * Get tasks assigned to the current user (employee)
     * Calls GET /api/Task/my-tasks
     */
    getMyTasks(): Observable<any[]> {
        console.log('📡 TaskService.getMyTasks - Fetching tasks assigned to current user');
        return this.apiService.getMyTasks();
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
     * Get tasks assigned to a specific employee (supports both full names and short names)
     */
    getTasksByAssignee(assignedTo: string): Task[] {
        return this.tasksSubject.value.filter(task => {
            // Match exact full name (case-insensitive)
            if (task.assignedTo.toLowerCase() === assignedTo.toLowerCase()) {
                return true;
            }
            // Also match by first name for backward compatibility
            const firstName = assignedTo.split(' ')[0].toLowerCase();
            return task.assignedTo.toLowerCase().startsWith(firstName);
        });
    }

    /**
     * Add a new task
     */
    addTask(task: Task) {
        // Generate task ID if not present
        if (!task.id) {
            task.id = `task_${Date.now()}`;
        }
        // Generate human-readable task ID (e.g., TASK-001)
        if (!task.taskId) {
            const taskNumber = this.tasksSubject.value.length + 1;
            task.taskId = `TASK-${String(taskNumber).padStart(3, '0')}`;
        }
        task.createdDate = new Date();
        task.assignedDate = new Date();

        console.log('TaskService.addTask - Creating task:', task);

        this.apiService.createTask(task).subscribe({
            next: (newTask: any) => {
                console.log('TaskService.addTask - API response:', newTask);
                const currentTasks = this.tasksSubject.value;
                const updatedTasks = [newTask, ...currentTasks];
                console.log('TaskService.addTask - Updated tasks:', updatedTasks);
                this.tasksSubject.next(updatedTasks);
                this.saveTasksToStorage(updatedTasks);
                console.log('TaskService.addTask - Saved to localStorage');
            },
            error: (err) => {
                console.error('TaskService.addTask - API error:', err);
                // Fallback: Create task locally and save to localStorage
                const currentTasks = this.tasksSubject.value;
                const updatedTasks = [task, ...currentTasks];
                console.log('TaskService.addTask - Using fallback, updated tasks:', updatedTasks);
                this.tasksSubject.next(updatedTasks);
                this.saveTasksToStorage(updatedTasks);
            }
        });
    }

    /**
     * Update an existing task
     */
    updateTask(id: string, updatedTask: Partial<Task>) {
        this.apiService.updateTask(id, updatedTask).subscribe({
            next: (response: any) => {
                const currentTasks = this.tasksSubject.value;
                const index = currentTasks.findIndex(task => task.id === id);
                if (index !== -1) {
                    const newTasks = [...currentTasks];
                    newTasks[index] = { ...newTasks[index], ...updatedTask };
                    this.tasksSubject.next(newTasks);
                    this.saveTasksToStorage(newTasks);
                }
            },
            error: () => {
                // Fallback: Update locally
                const currentTasks = this.tasksSubject.value;
                const index = currentTasks.findIndex(task => task.id === id);
                if (index !== -1) {
                    const newTasks = [...currentTasks];
                    newTasks[index] = { ...newTasks[index], ...updatedTask };
                    this.tasksSubject.next(newTasks);
                    this.saveTasksToStorage(newTasks);
                }
            }
        });
    }

    /**
     * Delete a task by ID
     */
    deleteTask(id: string) {
        this.apiService.deleteTask(id).subscribe({
            next: () => {
                const currentTasks = this.tasksSubject.value;
                const updatedTasks = currentTasks.filter(task => task.id !== id);
                this.tasksSubject.next(updatedTasks);
                this.saveTasksToStorage(updatedTasks);
            },
            error: () => {
                // Fallback: Delete locally
                const currentTasks = this.tasksSubject.value;
                const updatedTasks = currentTasks.filter(task => task.id !== id);
                this.tasksSubject.next(updatedTasks);
                this.saveTasksToStorage(updatedTasks);
            }
        });
    }

    /**
     * Update task status
     */
    updateTaskStatus(id: string, status: 'Pending' | 'In Progress' | 'Completed') {
        console.log('TaskService.updateTaskStatus - Updating task', id, 'to status:', status);
        this.updateTask(id, { status });
    }

    /**
     * Update a task by numeric ID (returns Observable)
     * Calls PUT /api/Task/{id}
     */
    updateTaskById(id: any, taskData: any): Observable<any> {
        // Guard against undefined/null
        if (id === undefined || id === null) {
            console.error('TaskService.updateTaskById - ID is undefined or null');
            return new Observable(observer => {
                observer.error({ error: { message: 'Task ID is missing' } });
            });
        }
        
        const taskId = String(id);
        console.log('TaskService.updateTaskById - Updating task', taskId, 'with data:', taskData);
        return this.apiService.updateTask(taskId, taskData);
    }

    /**
     * Delete a task by numeric ID (returns Observable)
     * Calls DELETE /api/Task/{id}
     */
    deleteTaskById(id: any): Observable<any> {
        // Guard against undefined/null
        if (id === undefined || id === null) {
            console.error('TaskService.deleteTaskById - ID is undefined or null');
            return new Observable(observer => {
                observer.error({ error: { message: 'Task ID is missing' } });
            });
        }
        
        const taskId = String(id);
        console.log('TaskService.deleteTaskById - Deleting task', taskId);
        return this.apiService.deleteTask(taskId);
    }

    /**
     * Get tasks count by status
     */
    getTaskCountByStatus(status: string): number {
        return this.tasksSubject.value.filter(task => task.status === status).length;
    }
}
