import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Player } from "../models/player.model";
import { Observable } from "rxjs/internal/Observable";
import {catchError, map, of} from "rxjs";
import {Registration} from "src/app/models/tournament.model";

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private apiUrl = 'http://localhost:8080/api/players';

  constructor(private http: HttpClient) {}

  getPlayer(id: number): Observable<Player> {
    return this.http.get<any>(this.apiUrl + "/" + id)
      .pipe(
        catchError(this.handleError<Player>('getPlayer'))
      );
  }

  updatePlayer(id: number, profileData: any): Observable<Player> {
    return this.http.put<any>(this.apiUrl + "/" + id, profileData)
      .pipe(
        catchError(this.handleError<Player>('updatePlayer'))
      );
  }

  public getPlayers(): Observable<Player[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(data => data.map(player => this.mapToPlayer(player))))
  }

  // -- UTIL --

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
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
