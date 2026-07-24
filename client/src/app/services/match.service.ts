import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/operators';
import { Match } from '../models/match.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMatches(tournamentId: number): Observable<Match[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tournaments/${tournamentId}/matches`)
      .pipe(map(matches => matches.map(m => this.fromApi(m))));
  }

  createMatch(tournamentId: number, match: Match): Observable<Match> {
    return this.http.post<any>(`${this.apiUrl}/tournaments/${tournamentId}/matches`, this.toApi(match))
      .pipe(map(m => this.fromApi(m)));
  }

  updateMatch(tournamentId: number, matchId: number, match: Match): Observable<Match> {
    return this.http.put<any>(`${this.apiUrl}/tournaments/${tournamentId}/matches/${matchId}`, this.toApi(match))
      .pipe(map(m => this.fromApi(m)));
  }

  deleteMatch(tournamentId: number, matchId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tournaments/${tournamentId}/matches/${matchId}`);
  }

  exportSchedule(tournamentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/tournaments/${tournamentId}/matches/export`, { responseType: 'blob' });
  }

  importSchedule(tournamentId: number, file: File): Observable<Match[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any[]>(`${this.apiUrl}/tournaments/${tournamentId}/matches/import`, formData)
      .pipe(map(matches => matches.map(m => this.fromApi(m))));
  }

  // The backend transports date/time as "yyyy-MM-dd"/"HH:mm" strings, but the
  // UI (p-datepicker) needs real Date objects - convert at the service boundary.
  private fromApi(match: any): Match {
    return {
      ...match,
      date: match.date ? this.parseDate(match.date) : null,
      time: match.time ? this.parseTime(match.time) : null
    };
  }

  private toApi(match: Match): any {
    return {
      ...match,
      date: match.date ? this.formatDate(match.date) : null,
      time: match.time ? this.formatTime(match.time) : null
    };
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private parseTime(value: string): Date {
    const [hours, minutes] = value.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
