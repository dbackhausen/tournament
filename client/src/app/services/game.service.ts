import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from "rxjs/internal/Observable";
import { map } from "rxjs";
import {Game} from "../models/game.model";

@Injectable({
  providedIn: 'root',
})
export class GameService {
  constructor(private http: HttpClient) {}

  public getGames(): Observable<Game[]> {
    return this.http.get<any[]>('http://localhost:8080/api/games').pipe(
      map(data => data.map(game => this.mapToGame(game))))
  }

  private mapToGame(data: any): Game {
    console.log(data.type)
    return {
      id: data.id,
      type: data.type,
      date: data.date,
      tournament: data.tournament,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      results: data.results
    };
  }
}
