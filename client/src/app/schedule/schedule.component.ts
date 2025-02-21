import {Component, OnDestroy, OnInit} from '@angular/core';
import {ScheduleService} from "../services/schedule.service";

@Component({
    selector: 'app-schedule',
    templateUrl: './schedule.component.html',
    styleUrl: './schedule.component.scss',
    standalone: false
})
export class ScheduleComponent implements OnInit, OnDestroy {

  schedules: any[] = [];

  constructor(
    private scheduleService: ScheduleService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.scheduleService.getSchedules()
      .pipe()
      .subscribe((data) => {
        console.log(JSON.stringify(data));
        this.schedules = data;
      });
  }


  ngOnDestroy(): void {
  }
}

