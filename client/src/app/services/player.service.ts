import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Player } from "../models/player.model";
import { Observable } from "rxjs/internal/Observable";
import { map } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private apiUrl = 'http://localhost:8080/api/players';

  constructor(private http: HttpClient) {}

  getPlayer(id: string): Observable<Player> {
    return this.http.get<any>(this.apiUrl + "/" + id);
  }

  updatePlayer(id: string, profileData: any): Observable<Player> {
    return this.http.put<any>(this.apiUrl + "/" + id, profileData);
  }

  public getPlayers(): Observable<Player[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(data => data.map(player => this.mapToPlayer(player))))
  }

  private mapToPlayer(data: any): Player {
    return {
      id: data.id,
      gender: data.gender,
      lastname: data.lastname,
      firstname: data.firstname,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      performanceClass: data.performanceClass
    };
  }
}
