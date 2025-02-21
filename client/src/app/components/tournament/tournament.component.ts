import { Component, OnDestroy, OnInit } from '@angular/core';
import { TournamentService } from "../../services/tournament.service";

@Component({
  selector: 'app-tournament',
  standalone: true,
  templateUrl: './tournament.component.html',
  styleUrl: './tournament.component.scss'
})
export class TournamentComponent implements OnInit {
  tournaments: any[] = [];

  constructor(
    private tournamentService: TournamentService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.tournamentService.getTournaments().subscribe({
      next: (data) => {
        console.log(JSON.stringify(data));
      },
        error: (error) => {
        console.error('Error loading profile');
      },
        complete: () => {
        console.log('Profile successfully loaded')
      }
    });
  }
}
