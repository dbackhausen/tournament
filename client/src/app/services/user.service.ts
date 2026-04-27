import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from "../models/user.model";
import { Observable } from "rxjs/internal/Observable";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    const url = `${this.apiUrl}/users`;
    return this.http.get<User[]>(url);
  }

  getUser(id: number): Observable<User> {
    const url = `${this.apiUrl}/users/${id}`;
    return this.http.get<User>(url);
  }

  updateUser(user: User): Observable<User> {
    const url = `${this.apiUrl}/users/${user.id}`;
    return this.http.put<User>(url, user);
  }

  deleteUser(id: number) {
    const url = `${this.apiUrl}/users/${id}`;
    return this.http.delete<void>(url);
  }

  uploadProfileImage(id: number, file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>(`${this.apiUrl}/users/${id}/profile-image`, formData);
  }

  getProfileImageUrl(id: number): string {
    return `${this.apiUrl}/users/${id}/profile-image`;
  }
}
