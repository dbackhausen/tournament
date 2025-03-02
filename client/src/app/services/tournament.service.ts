import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from "rxjs/internal/Observable";
import {Registration, Tournament} from "../models/tournament.model";
import { catchError, of } from "rxjs";
import {Player} from "src/app/models/player.model";

@Injectable({
  providedIn: 'root',
})
export class TournamentService {
  private apiUrl = 'http://localhost:8080/api/tournaments'; // Basis-URL des Backends

  constructor(private http: HttpClient) { }

  getTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError<Tournament[]>('getTournaments', []))
      );
  }

  getTournament(id: number): Observable<Tournament> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Tournament>(url)
      .pipe(
        catchError(this.handleError<Tournament>(`getTournament id=${id}`))
      );
  }

  addTournament(tournament: Tournament): Observable<Tournament> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.post<Tournament>(this.apiUrl, tournament, httpOptions)
      .pipe(
        catchError(this.handleError<Tournament>('addTournament'))
      );
  }

  updateTournament(id: number, tournament: Tournament): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.put(url, tournament, httpOptions)
      .pipe(
        catchError(this.handleError<any>('updateTournament'))
      );
  }

  deleteTournament(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url)
      .pipe(
        catchError(this.handleError<void>('deleteTournament'))
      );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  registerPlayerForTournament(tournamentId: number, registration: Registration) {
    const url = `${this.apiUrl}/${tournamentId}/register`;
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.post<Registration>(url, registration, httpOptions)
      .pipe(
        catchError(this.handleError<Registration>('register'))
      );
  }

  getRegistrations(tournamentId: number | null): Observable<Registration[]> {
    const url = `${this.apiUrl}/${tournamentId}/registrations`;
    return this.http.get<Registration[]>(url)
      .pipe(
        catchError(this.handleError<Registration[]>('getRegistrations', []))
      );
  }
}
