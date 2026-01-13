import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';



export const managerGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser();

    if (user && user.role === 'Manager') {
        return true;
    }

    if (!user) {
       
        router.navigate(['/signin']);
    } else {
       
        router.navigate(['/employee/dashboardemployee']);
    }
    return false;
};
