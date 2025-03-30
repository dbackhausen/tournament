import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from "../models/user.model";
import { Observable } from "rxjs/internal/Observable";
import { catchError, of } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl + '/api/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError<User[]>('getUsers', []))
      );
  }

  getUser(id: number): Observable<User> {
    return this.http.get<any>(this.apiUrl + "/" + id)
      .pipe(
        catchError(this.handleError<User>('getUser'))
      );
  }

  updateUser(user: User): Observable<User> {
    return this.http.put<any>(this.apiUrl + "/" + user.id, user)
      .pipe(
        catchError(this.handleError<User>('updateUser'))
      );
  }

  deleteUser(id: number) {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url)
      .pipe(
        catchError(this.handleError<void>('deleteUser'))
      );
  }

  // -- UTIL --

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
