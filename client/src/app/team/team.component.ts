import {Component, OnDestroy, OnInit} from '@angular/core';
import {TeamService} from "../services/team.service";

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss'
})
export class TeamComponent implements OnInit, OnDestroy {

  teams: any[] = [];

  constructor(
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.teamService.getTeams()
      .pipe()
      .subscribe((data) => {
        console.log(JSON.stringify(data));
        this.teams = data;
      });
  }


  ngOnDestroy(): void {
  }
}
