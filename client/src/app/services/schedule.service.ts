import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from "rxjs/internal/Observable";
import {Schedule} from "../models/schedule.model";
import {map} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  constructor(private http: HttpClient) {}

  public getSchedules(): Observable<Schedule[]> {
    return this.http.get<any[]>('http://localhost:8080/api/schedules').pipe(
      map(data => data.map(schedule => this.mapToSchedule(schedule))));
  }

  private mapToSchedule(data: any): Schedule {
    return {
      id: data.id,
      tournament: data.tournament,
      date: data.date,
      games: data.games,
    };
  }
}

