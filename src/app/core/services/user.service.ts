import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
    id?: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: 'Employee' | 'Manager' | 'Admin';
    department?: string;
    phone?: string;
    joinDate?: string;
    status?: 'Active' | 'Inactive';
    createdDate?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private platformId = inject(PLATFORM_ID);

    private initialUsers: User[] = [
        {
            id: '1',
            email: 'akash@gmail.com',
            firstName: 'Akash',
            lastName: 'Kumar',
            role: 'Employee',
            department: 'Development',
            phone: '9876543210',
            joinDate: '2023-01-15',
            status: 'Active'
        },
        {
            id: '2',
            email: 'chandana@gmail.com',
            firstName: 'Chandana',
            lastName: 'Sharma',
            role: 'Employee',
            department: 'QA',
            phone: '9876543211',
            joinDate: '2023-03-10',
            status: 'Active'
        },
        {
            id: '3',
            email: 'prachothan@gmail.com',
            firstName: 'Prachothan',
            lastName: 'Reddy',
            role: 'Employee',
            department: 'Development',
            phone: '9876543212',
            joinDate: '2023-02-20',
            status: 'Active'
        },
        {
            id: '4',
            email: 'umesh@gmail.com',
            firstName: 'Umesh',
            lastName: 'Singh',
            role: 'Manager',
            department: 'Development',
            phone: '9876543213',
            joinDate: '2022-06-15',
            status: 'Active'
        },
        {
            id: '5',
            email: 'gopi@gmail.com',
            firstName: 'Gopi',
            lastName: 'Krishna',
            role: 'Employee',
            department: 'Support',
            phone: '9876543214',
            joinDate: '2023-04-01',
            status: 'Active'
        }
    ];

    private usersSubject = new BehaviorSubject<User[]>(this.initialUsers);
    users$ = this.usersSubject.asObservable();

    // Track current user changes
    currentUserChanged = signal<User | null>(null);

    constructor() {
        this.loadUsersFromStorage();
    }

    /**
     * Get all users
     */
    getUsers(): Observable<User[]> {
        return this.users$;
    }

    /**
     * Get user by ID
     */
    getUserById(id: string): User | undefined {
        return this.usersSubject.value.find(user => user.id === id);
    }

    /**
     * Get user by email
     */
    getUserByEmail(email: string): User | undefined {
        return this.usersSubject.value.find(user => user.email.toLowerCase() === email.toLowerCase());
    }

    /**
     * Get users by role
     */
    getUsersByRole(role: string): User[] {
        return this.usersSubject.value.filter(user => user.role === role);
    }

    /**
     * Get users by department
     */
    getUsersByDepartment(department: string): User[] {
        return this.usersSubject.value.filter(user => user.department === department);
    }

    /**
     * Get active users
     */
    getActiveUsers(): User[] {
        return this.usersSubject.value.filter(user => user.status === 'Active');
    }

    /**
     * Add a new user
     */
    addUser(user: User) {
        user.id = user.id || `user_${Date.now()}`;
        user.createdDate = new Date();
        user.status = user.status || 'Active';
        const currentUsers = this.usersSubject.value;
        const newUsers = [...currentUsers, user];
        this.usersSubject.next(newUsers);
        this.saveUsersToStorage(newUsers);
    }

    /**
     * Update an existing user
     */
    updateUser(id: string, updatedUser: Partial<User>) {
        const currentUsers = this.usersSubject.value;
        const index = currentUsers.findIndex(user => user.id === id);
        if (index !== -1) {
            currentUsers[index] = { ...currentUsers[index], ...updatedUser };
            this.usersSubject.next([...currentUsers]);
            this.saveUsersToStorage(currentUsers);
            this.currentUserChanged.set(currentUsers[index]);
        }
    }

    /**
     * Delete a user
     */
    deleteUser(id: string) {
        const currentUsers = this.usersSubject.value;
        const newUsers = currentUsers.filter(user => user.id !== id);
        this.usersSubject.next(newUsers);
        this.saveUsersToStorage(newUsers);
    }

    /**
     * Deactivate a user (set status to Inactive)
     */
    deactivateUser(id: string) {
        this.updateUser(id, { status: 'Inactive' });
    }

    /**
     * Activate a user (set status to Active)
     */
    activateUser(id: string) {
        this.updateUser(id, { status: 'Active' });
    }

    /**
     * Search users by name (firstName or lastName)
     */
    searchUsersByName(name: string): User[] {
        const searchTerm = name.toLowerCase();
        return this.usersSubject.value.filter(user =>
            user.firstName.toLowerCase().includes(searchTerm) ||
            user.lastName.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Get user count by role
     */
    getUserCountByRole(role: string): number {
        return this.usersSubject.value.filter(user => user.role === role).length;
    }

    /**
     * Get user count by department
     */
    getUserCountByDepartment(department: string): number {
        return this.usersSubject.value.filter(user => user.department === department).length;
    }

    /**
     * Save users to localStorage
     */
    private saveUsersToStorage(users: User[]) {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    /**
     * Load users from localStorage if they exist, otherwise use initial data
     */
    private loadUsersFromStorage() {
        if (isPlatformBrowser(this.platformId)) {
            const savedUsers = localStorage.getItem('users');
            if (savedUsers) {
                try {
                    this.usersSubject.next(JSON.parse(savedUsers));
                } catch (e) {
                    console.error('Error loading users from storage', e);
                }
            }
        }
    }

    /**
     * Check if email already exists
     */
    emailExists(email: string): boolean {
        return this.usersSubject.value.some(user => user.email.toLowerCase() === email.toLowerCase());
    }

    /**
     * Get department list
     */
    getDepartments(): string[] {
        const departments = new Set(this.usersSubject.value.map(user => user.department).filter(Boolean) as string[]);
        return Array.from(departments);
    }
}
