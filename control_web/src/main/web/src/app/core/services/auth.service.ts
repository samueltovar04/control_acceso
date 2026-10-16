import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface UserAuth {
  token: string;
  username: string;
  role: 'ADMIN' | 'EMPLEADO' | 'CLIENTE' | 'RECEPCION' | 'SUPER_ADMIN' | string;
  clienteId?: number;
  sedeId?: number;
  sede?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/v1';
  private currentUserSubject = new BehaviorSubject<UserAuth | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getUserFromStorage(): UserAuth | null {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  }

  public get currentUserValue(): UserAuth | null {
    return this.currentUserSubject.value;
  }

  login(credentials: { username: string; password: string }): Observable<UserAuth> {
    return this.http.post<UserAuth>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  hasRole(role: string): boolean {
    return this.currentUserValue?.role === role;
  }
}
