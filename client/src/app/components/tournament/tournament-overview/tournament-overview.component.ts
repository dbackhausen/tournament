import { Component, HostListener, OnInit } from '@angular/core';
import { TournamentService } from "../../../services/tournament.service";
import { CommonModule } from "@angular/common";
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DataView } from 'primeng/dataview';
import { Router, RouterLink} from "@angular/router";
import { Card } from "primeng/card";
import {AuthService} from "src/app/services/auth.service";

@Component({
  selector: 'app-tournament',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    DataView,
    RouterLink,
    Card
  ],
  templateUrl: './tournament-overview.component.html',
  styleUrl: './tournament-overview.component.scss'
})
export class TournamentOverviewComponent implements OnInit {
  tournaments: any[] = [];
  isMobile: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private tournamentService: TournamentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    console.log(this.isAdmin);
    this.checkViewport();
    this.loadData();
  }

  loadData(): void {
    this.tournamentService.getTournaments().subscribe({
      next: (data) => {
        const today = new Date();
        if (this.isAdmin) {
          this.tournaments = data;
        } else {
          this.tournaments = data.filter(tournament => new Date(tournament.endDate) >= today);
        }
      },
        error: (error) => {
        console.error('Error loading tournaments');
      },
        complete: () => {
        console.log('Tournaments successfully loaded')
      }
    });
  }

  onRegister(id: number) {
    this.router.navigate([`/tournament/register/${id}`])
  }

  onShowRegistrations(id: number) {
    this.router.navigate([`/tournament/registrations/${id}`])
  }

  editTournament(id: number) {
    this.router.navigate([`/tournament/edit/${id}`])
  }

  deleteTournament(id: number) {
    if (confirm('Möchten Sie dieses Turnier wirklich löschen?')) {
      this.tournamentService.deleteTournament(id).subscribe({
        next: () => {
          alert('Turnier erfolgreich gelöscht.');
          this.loadData();
        },
        error: (error) => {
          alert(error.message);
        }
      });
    }
  }

  checkViewport(): void {
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkViewport();
  }
}
