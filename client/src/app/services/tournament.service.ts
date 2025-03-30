import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from "rxjs/internal/Observable";
import { Tournament} from "../models/tournament.model";
import { catchError, of } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class TournamentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getTournaments(): Observable<Tournament[]> {
    const url = `${this.apiUrl}/tournaments`;
    return this.http.get<Tournament[]>(url)
      .pipe(
        catchError(this.handleError<Tournament[]>('getTournaments', []))
      );
  }

  getTournament(id: number): Observable<Tournament> {
    const url = `${this.apiUrl}/tournaments/${id}`;
    return this.http.get<Tournament>(url)
      .pipe(
        catchError(this.handleError<Tournament>(`getTournament id=${id}`))
      );
  }

  addTournament(tournament: Tournament): Observable<Tournament> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    const url = `${this.apiUrl}/tournaments`;
    return this.http.post<Tournament>(url, tournament, httpOptions)
      .pipe(
        catchError(this.handleError<Tournament>('addTournament'))
      );
  }

  updateTournament(id: number, tournament: Tournament): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    const url = `${this.apiUrl}/tournaments/${id}`;
    return this.http.put(url, tournament, httpOptions)
      .pipe(
        catchError(this.handleError<any>('updateTournament'))
      );
  }

  deleteTournament(id: number): Observable<void> {
    const url = `${this.apiUrl}/tournaments/${id}`;
    return this.http.delete<void>(url)
      .pipe(
        catchError(this.handleError<void>('deleteTournament'))
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
