import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from "rxjs/internal/Observable";
import { map } from "rxjs";
import {Team} from "../models/team.model";

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  constructor(private http: HttpClient) {}

  public getTeams(): Observable<Team[]> {
    return this.http.get<any[]>('http://localhost:8080/api/teams').pipe(
      map(data => data.map(team => this.mapToTeam(team))))
  }

  private mapToTeam(data: any): Team {
    return {
      id: data.id,
      name: data.name,
      players: data.players
    };
  }
}
