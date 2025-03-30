import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import { Observable } from "rxjs/internal/Observable";
import { Registration } from "../models/tournament.model";
import { catchError, of } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private apiUrl = environment.apiUrl + '/registrations'; // Basis-URL des Backends

  constructor(private http: HttpClient) { }

  addRegistration(registration: Registration) {
    const url = `${this.apiUrl}`;
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.post<Registration>(url, registration, httpOptions)
      .pipe(
        catchError(this.handleError<Registration>('register'))
      );
  }

  getRegistration(registrationId: number){
    const url = `${this.apiUrl}/${registrationId}`;
    return this.http.get<Registration>(url)
      .pipe(
        catchError(this.handleError<Registration>(`getRegistration registrationId=${registrationId}`))
      );
  }

  getRegistrationsByTournament(tournamentId: number): Observable<Registration[]> {
    const url = `${this.apiUrl}/find/by-tournament?tournamentId=${tournamentId}`;
    return this.http.get<Registration[]>(url)
      .pipe(
        catchError(this.handleError<Registration[]>(`getRegistrationsByTournament tournamentId=${tournamentId}`, []))
      );
  }

  getRegistrationsByUser(userId: number){
    const url = `${this.apiUrl}/find/by-user?userId=${userId}`;
    return this.http.get<Registration>(url)
      .pipe(
        catchError(this.handleError<Registration>(`getRegistrationsByUser userId=${userId}`))
      );
  }

  getRegistrationByTournamentAndUser(tournamentId: number, userId: number): Observable<Registration | null> {
    const url = `${this.apiUrl}/find/by-tournament-and-user?tournamentId=${tournamentId}&userId=${userId}`;
    return this.http.get<Registration>(url).pipe(
      catchError(this.handleError<Registration>(`getRegistrationByTournamentAndUser tournamentId=${tournamentId} userId=${userId}`))
    );
  }

  updateRegistration(registration: Registration) {
    const url = `${this.apiUrl}`;
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.put<Registration>(url, registration, httpOptions)
      .pipe(
        catchError(this.handleError<Registration>('updateRegistration'))
      );
  }

  deleteRegistration(registrationId: number) {
    const url = `${this.apiUrl}/${registrationId}`;
    return this.http.delete<Registration>(url)
      .pipe(
        catchError(this.handleError<Registration>('getUserRegistration'))
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
