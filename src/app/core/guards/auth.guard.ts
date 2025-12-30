import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  // Check if a user is logged in
  if (isPlatformBrowser(platformId)) {
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  if (isLoggedIn === 'true') {
    return true; // Allow access to the dashboard
  }
 else {
    // If not logged in, show alert and go to signin
    alert('Access Denied. Please Login first!');
    router.navigate(['/signin']); 
    return false; // Block the direct URL access
  }
}return false;

};