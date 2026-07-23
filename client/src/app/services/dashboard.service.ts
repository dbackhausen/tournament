import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from "rxjs/internal/Observable";
import { environment } from "../../environments/environment";

export interface DashboardMessage {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMessage(): Observable<DashboardMessage> {
    const url = `${this.apiUrl}/dashboard/message`;
    return this.http.get<DashboardMessage>(url);
  }

  updateMessage(message: string): Observable<DashboardMessage> {
    const url = `${this.apiUrl}/dashboard/message`;
    return this.http.put<DashboardMessage>(url, { message });
  }
}
