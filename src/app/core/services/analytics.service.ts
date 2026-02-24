import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  ApiResponse,
  TeamSummaryDto,
  TeamHoursTrendDto,
  TeamMemberPerformanceDto,
  TaskCompletionBreakdownDto
} from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = '/api/Analytics';

  constructor(private http: HttpClient) {}

  /**
   * Get HTTP headers with authorization token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('Analytics API Error:', error);
    throw error;
  }

  /**
   * Get team summary for dashboard cards
   * GET /api/Analytics/team-summary
   */
  getTeamSummary(startDate?: string, endDate?: string): Observable<ApiResponse<TeamSummaryDto>> {
    let url = `${this.apiUrl}/team-summary`;
    const params: string[] = [];
    
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    
    if (params.length > 0) url += '?' + params.join('&');

    console.log('📊 AnalyticsService.getTeamSummary - Fetching:', url);

    return this.http.get<ApiResponse<TeamSummaryDto>>(url, { 
      headers: this.getHeaders() 
    }).pipe(
      tap((response) => {
        console.log('✅ Team summary loaded:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get team hours trend for line chart
   * GET /api/Analytics/team-hours-trend
   */
  getTeamHoursTrend(
    startDate: string, 
    endDate: string, 
    groupBy: 'day' | 'week' = 'day'
  ): Observable<ApiResponse<TeamHoursTrendDto>> {
    const url = `${this.apiUrl}/team-hours-trend?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&groupBy=${groupBy}`;

    console.log('📊 AnalyticsService.getTeamHoursTrend - Fetching:', url);

    return this.http.get<ApiResponse<TeamHoursTrendDto>>(url, { 
      headers: this.getHeaders() 
    }).pipe(
      tap((response) => {
        console.log('✅ Team hours trend loaded:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get team member performance for table
   * GET /api/Analytics/team-member-performance
   */
  getTeamMemberPerformance(startDate?: string, endDate?: string): Observable<ApiResponse<TeamMemberPerformanceDto>> {
    let url = `${this.apiUrl}/team-member-performance`;
    const params: string[] = [];
    
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    
    if (params.length > 0) url += '?' + params.join('&');

    console.log('📊 AnalyticsService.getTeamMemberPerformance - Fetching:', url);

    return this.http.get<ApiResponse<TeamMemberPerformanceDto>>(url, { 
      headers: this.getHeaders() 
    }).pipe(
      tap((response) => {
        console.log('✅ Team member performance loaded:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get task completion breakdown for doughnut chart
   * GET /api/Analytics/task-completion-breakdown
   */
  getTaskCompletionBreakdown(startDate?: string, endDate?: string): Observable<ApiResponse<TaskCompletionBreakdownDto>> {
    let url = `${this.apiUrl}/task-completion-breakdown`;
    const params: string[] = [];
    
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    
    if (params.length > 0) url += '?' + params.join('&');

    console.log('📊 AnalyticsService.getTaskCompletionBreakdown - Fetching:', url);

    return this.http.get<ApiResponse<TaskCompletionBreakdownDto>>(url, { 
      headers: this.getHeaders() 
    }).pipe(
      tap((response) => {
        console.log('✅ Task completion breakdown loaded:', response);
      }),
      catchError(this.handleError)
    );
  }
}
