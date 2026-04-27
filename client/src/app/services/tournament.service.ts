import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs/internal/Observable";
import { Tournament} from "../models/tournament.model";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class TournamentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getTournaments(): Observable<Tournament[]> {
    const url = `${this.apiUrl}/tournaments`;
    return this.http.get<Tournament[]>(url);
  }

  getTournament(id: number): Observable<Tournament> {
    const url = `${this.apiUrl}/tournaments/${id}`;
    return this.http.get<Tournament>(url);
  }

  addTournament(tournament: Tournament): Observable<Tournament> {
    const url = `${this.apiUrl}/tournaments`;
    return this.http.post<Tournament>(url, tournament);
  }

  updateTournament(id: number, tournament: Tournament): Observable<Tournament> {
    const url = `${this.apiUrl}/tournaments/${id}`;
    return this.http.put<Tournament>(url, tournament);
  }

  deleteTournament(id: number): Observable<void> {
    const url = `${this.apiUrl}/tournaments/${id}`;
    return this.http.delete<void>(url);
  }
}
