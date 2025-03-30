import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { UserRegistration } from "src/app/models/user-registration.model";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  register(user: UserRegistration): Observable<any> {
    const url = `${this.apiUrl}/auth/register`;
    return this.http.post(url, user);
  }

  login(credentials: { email: any; password: any }): Observable<any> {
    const url = `${this.apiUrl}/auth/login`;
    return this.http.post(url, credentials).pipe(
      tap((response: any) => {
        console.log(response);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.isLoggedInSubject.next(true);
      })
    )
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login'])
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getRoles(): string[] {
    return this.getUser()?.roles || [];
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn() {
    return this.isLoggedIn$;
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  isAdmin() {
    const user = this.getUser();
    return user?.roles.includes('ADMIN');
  }
}
