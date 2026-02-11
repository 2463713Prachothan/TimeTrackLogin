import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface User {
    id?: string;
    email: string;
    password?: string;
    fullName: string;
    role: 'Employee' | 'Manager' | 'Admin';
    department?: string;
    phone?: string;
    joinDate?: string;
    status?: 'Active' | 'Inactive';
    createdDate?: Date;
    managerId?: string;  // For employees: their assigned manager
    assignedEmployees?: string[];  // For managers: list of employee IDs
}

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private platformId = inject(PLATFORM_ID);
    private apiService = inject(ApiService);

    private usersSubject = new BehaviorSubject<User[]>([]);
    users$ = this.usersSubject.asObservable();

    // Track current user changes
    currentUserChanged = signal<User | null>(null);

    constructor() {
        this.loadUsers();
    }

    /**
     * Load users from API, with fallback to storage
     */
    private loadUsers(): void {
        this.apiService.getUsers().subscribe({
            next: (response: any) => {
                // Handle different response formats from backend
                let users: any[] = [];
                
                if (Array.isArray(response)) {
                    users = response;
                } else if (response && Array.isArray(response.$values)) {
                    // Handle .NET serialization format
                    users = response.$values;
                } else if (response && Array.isArray(response.data)) {
                    users = response.data;
                } else if (response && Array.isArray(response.result)) {
                    users = response.result;
                }
                
                console.log('✅ UserService - Loaded users from API:', users.length);
                
                if (users && users.length > 0) {
                    // Map backend user format to frontend format
                    const mappedUsers: User[] = users.map((u: any) => ({
                        id: u.userId?.toString() || u.id?.toString() || `user_${Date.now()}`,
                        email: u.email,
                        fullName: u.name || u.fullName || u.email,
                        role: u.role as 'Employee' | 'Manager' | 'Admin',
                        department: u.department,
                        status: (u.isActive === false ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
                        phone: u.phone,
                        joinDate: u.joinDate || u.createdAt
                    }));
                    this.usersSubject.next(mappedUsers);
                    this.saveUsersToStorage(mappedUsers);
                } else {
                    // Fallback to stored users
                    this.loadUsersFromStorage();
                }
            },
            error: () => {
                // API failed, use stored data
                this.loadUsersFromStorage();
            }
        });
    }

    /**
     * Refresh users from API (public method to trigger refresh)
     */
    refreshUsers(): void {
        console.log('🔄 UserService - Refreshing users from API...');
        this.loadUsers();
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
     * Add a new user (creates via API)
     */
    addUser(user: User) {
        user.id = user.id || `user_${Date.now()}`;
        user.createdDate = new Date();
        user.status = user.status || 'Active';
        const currentUsers = this.usersSubject.value;
        
        // Check if user with same email already exists
        const emailLower = user.email.toLowerCase();
        const existingUserIndex = currentUsers.findIndex(u => u.email.toLowerCase() === emailLower);
        
        if (existingUserIndex === -1) {
            // Call API to create user
            this.apiService.createUser(user).subscribe({
                next: (newUser) => {
                    const newUsers = [...currentUsers, newUser];
                    this.usersSubject.next(newUsers);
                    this.saveUsersToStorage(newUsers);
                },
                error: (err) => {
                    console.error('Error creating user:', err);
                    // Fallback: add to local storage anyway
                    const newUsers = [...currentUsers, user];
                    this.usersSubject.next(newUsers);
                    this.saveUsersToStorage(newUsers);
                }
            });
        } else {
            // User already exists, update instead
            console.warn(`User with email ${user.email} already exists. Updating existing user.`);
            this.updateUser(currentUsers[existingUserIndex].id!, user);
        }
    }

    /**
     * Update an existing user (updates via API)
     */
    updateUser(id: string, updatedUser: Partial<User>) {
        const currentUsers = this.usersSubject.value;
        const index = currentUsers.findIndex(user => user.id === id);
        if (index !== -1) {
            const updated = { ...currentUsers[index], ...updatedUser };
            
            // Call API to update user
            this.apiService.updateUser(id, updated).subscribe({
                next: (result) => {
                    currentUsers[index] = result;
                    this.usersSubject.next([...currentUsers]);
                    this.saveUsersToStorage(currentUsers);
                    this.currentUserChanged.set(currentUsers[index]);
                },
                error: (err) => {
                    console.error('Error updating user:', err);
                    // Fallback: update locally anyway
                    currentUsers[index] = updated;
                    this.usersSubject.next([...currentUsers]);
                    this.saveUsersToStorage(currentUsers);
                    this.currentUserChanged.set(currentUsers[index]);
                }
            });
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
     * Backend endpoint: PATCH /api/User/{userId}/deactivate
     */
    deactivateUser(id: string) {
        this.apiService.deactivateUser(id).subscribe({
            next: () => {
                console.log('✅ UserService - User deactivated:', id);
                // Update local state
                this.updateUser(id, { status: 'Inactive' });
            },
            error: (err) => {
                console.error('❌ UserService - Error deactivating user:', err);
                // Fallback: update locally anyway
                this.updateUser(id, { status: 'Inactive' });
            }
        });
    }

    /**
     * Activate a user (set status to Active)
     * Backend endpoint: PATCH /api/User/{userId}/activate
     */
    activateUser(id: string) {
        this.apiService.activateUser(id).subscribe({
            next: () => {
                console.log('✅ UserService - User activated:', id);
                // Update local state
                this.updateUser(id, { status: 'Active' });
            },
            error: (err) => {
                console.error('❌ UserService - Error activating user:', err);
                // Fallback: update locally anyway
                this.updateUser(id, { status: 'Active' });
            }
        });
    }

    /**
     * Search users by name (fullName)
     */
    searchUsersByName(name: string): User[] {
        const searchTerm = name.toLowerCase();
        return this.usersSubject.value.filter(user =>
            user.fullName.toLowerCase().includes(searchTerm)
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
            // Deduplicate before saving
            const deduplicatedUsers = this.deduplicateUsers(users);
            localStorage.setItem('users', JSON.stringify(deduplicatedUsers));
        }
    }

    /**
     * Load users from localStorage if they exist
     */
    private loadUsersFromStorage() {
        if (isPlatformBrowser(this.platformId)) {
            const savedUsers = localStorage.getItem('users');
            if (savedUsers) {
                try {
                    let users = JSON.parse(savedUsers);
                    // Migrate old format (firstName/lastName) to new format (fullName)
                    users = this.migrateUsersToFullName(users);
                    // Deduplicate users by email (keep first occurrence)
                    users = this.deduplicateUsers(users);
                    // Filter out old dummy data emails
                    const dummyEmails = [
                        'akash@gmail.com',
                        'chandana@gmail.com',
                        'prachothan@gmail.com',
                        'gopi@gmail.com',
                        'umesh@gmail.com',
                        'john.doe@example.com',
                        'jane.doe@example.com',
                        'test@test.com'
                    ];
                    users = users.filter((u: User) => !dummyEmails.includes(u.email?.toLowerCase()));
                    this.usersSubject.next(users);
                    console.log('✅ UserService.loadUsersFromStorage - Loaded', users.length, 'users from localStorage:', users.map((u: User) => ({ fullName: u.fullName, email: u.email, hasPassword: !!u.password })));
                    // Save migrated data back to storage
                    this.saveUsersToStorage(users);
                } catch (e) {
                    console.error('Error loading users from storage', e);
                    // Start with empty array
                    this.usersSubject.next([]);
                }
            } else {
                // No saved data, start with empty array
                console.log('ℹ️ UserService.loadUsersFromStorage - No saved users, starting fresh');
                this.usersSubject.next([]);
            }
        } else {
            // Server-side rendering, start with empty array
            this.usersSubject.next([]);
        }
    }

    /**
     * Migrate users from old format (firstName/lastName) to new format (fullName)
     */
    private migrateUsersToFullName(users: User[]): User[] {
        return users.map(user => {
            // If user already has fullName, keep it
            if (user.fullName) {
                return user;
            }
            // If user has firstName/lastName, combine them
            if ((user as any).firstName || (user as any).lastName) {
                const firstName = (user as any).firstName || '';
                const lastName = (user as any).lastName || '';
                return {
                    ...user,
                    fullName: `${firstName} ${lastName}`.trim() || user.email
                };
            }
            // Fallback to email if no name data
            return {
                ...user,
                fullName: user.fullName || user.email
            };
        });
    }

    /**
     * Remove duplicate users by email
     */
    private deduplicateUsers(users: User[]): User[] {
        const seen = new Map<string, User>();
        users.forEach(user => {
            const emailKey = user.email.toLowerCase();
            if (!seen.has(emailKey)) {
                seen.set(emailKey, user);
            }
        });
        return Array.from(seen.values());
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

    /**
     * Check if a user has an active timer session
     * Status should be "Active" if they have a running timer
     */
    hasActiveTimerSession(userId: string): boolean {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        
        try {
            const timerSession = localStorage.getItem('timerSession');
            const userSession = localStorage.getItem('user_session');
            
            // If there's a timer session and it belongs to this user, they're active
            if (timerSession && userSession) {
                const user = JSON.parse(userSession);
                return user.id === userId;
            }
        } catch (error) {
            console.error('Error checking active timer session:', error);
        }
        
        return false;
    }

    /**
     * Get computed status for a user (Active if timer running, otherwise stored status)
     */
    getComputedStatus(user: User): 'Active' | 'Inactive' {
        // If user has an active timer session, they're Active
        if (this.hasActiveTimerSession(user.id || '')) {
            return 'Active';
        }
        // Otherwise return their stored status
        return user.status || 'Inactive';
    }
}
