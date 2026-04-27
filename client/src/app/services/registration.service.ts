import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs/internal/Observable";
import { Registration } from "../models/tournament.model";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  addRegistration(registration: Registration) {
    const url = `${this.apiUrl}/registrations`;
    return this.http.post<Registration>(url, registration);
  }

  getRegistration(registrationId: number) {
    const url = `${this.apiUrl}/registrations/${registrationId}`;
    return this.http.get<Registration>(url);
  }

  getRegistrationsByTournament(tournamentId: number): Observable<Registration[]> {
    const url = `${this.apiUrl}/registrations/find/by-tournament?tournamentId=${tournamentId}`;
    return this.http.get<Registration[]>(url);
  }

  getRegistrationsByUser(userId: number): Observable<Registration[]> {
    const url = `${this.apiUrl}/registrations/find/by-user?userId=${userId}`;
    return this.http.get<Registration[]>(url);
  }

  getRegistrationByTournamentAndUser(tournamentId: number, userId: number): Observable<Registration | null> {
    const url = `${this.apiUrl}/registrations/find/by-tournament-and-user?tournamentId=${tournamentId}&userId=${userId}`;
    return this.http.get<Registration>(url);
  }

  updateRegistration(registration: Registration) {
    const url = `${this.apiUrl}/registrations`;
    return this.http.put<Registration>(url, registration);
  }

  updatePayed(registrationId: number, payed: boolean) {
    const url = `${this.apiUrl}/registrations/${registrationId}/payed`;
    return this.http.patch<Registration>(url, { payed });
  }

  deleteRegistration(registrationId: number) {
    const url = `${this.apiUrl}/registrations/${registrationId}`;
    return this.http.delete<Registration>(url);
  }
}
