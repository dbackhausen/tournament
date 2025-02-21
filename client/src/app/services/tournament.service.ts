import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Tournament } from "../models/tournament.model";
import { Observable } from "rxjs/internal/Observable";
import { map } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class TournamentService {
  private apiUrl = 'http://localhost:8080/tournaments';

  constructor(private http: HttpClient) {}

  public getTournaments(): Observable<Tournament[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(dataArray => dataArray.map(data => new Tournament(data))))
  }

  public createTournament(tournament: Tournament): Observable<Tournament> {
    const headers = new HttpHeaders({'Content-Type': 'application/json'});
    return this.http.post<Tournament>(this.apiUrl, tournament, {headers});
  }
}
