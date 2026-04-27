import { Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TournamentService } from "../../../services/tournament.service";
import { CommonModule } from "@angular/common";
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DataView } from 'primeng/dataview';
import { Router, RouterLink} from "@angular/router";
import { Card } from "primeng/card";
import { AuthService } from "src/app/services/auth.service";
import { Message } from "primeng/message";
import { Tournament } from "src/app/models/tournament.model";
import { TooltipModule } from 'primeng/tooltip';
import { RegistrationService } from "src/app/services/registration.service";
import { catchError, forkJoin, of } from "rxjs";

@Component({
  selector: 'app-tournament',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    DataView,
    RouterLink,
    Card,
    Message,
    TooltipModule
  ],
  templateUrl: './tournament-overview.component.html',
  styleUrl: './tournament-overview.component.scss'
})
export class TournamentOverviewComponent implements OnInit {
  tournaments: Tournament[] = [];
  registeredTournamentIds = new Set<number>();
  isMobile: boolean = false;
  isAdmin: boolean = false;
  private destroyRef = inject(DestroyRef);

  constructor(
    private tournamentService: TournamentService,
    private registrationService: RegistrationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.checkViewport();
    this.loadData();
  }

  loadData(): void {
    const user = this.authService.getUser();
    const registrations$ = user
      ? this.registrationService.getRegistrationsByUser(user.id).pipe(catchError(() => of([])))
      : of([]);

    forkJoin({
      tournaments: this.tournamentService.getTournaments(),
      registrations: registrations$
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ tournaments, registrations }) => {
        const today = new Date();
        this.tournaments = this.isAdmin
          ? tournaments
          : tournaments.filter(t => new Date(t.endDate) >= today);
        this.registeredTournamentIds = new Set((registrations as any[]).map(r => r.tournament.id));
      },
      error: () => console.error('Error loading tournaments')
    });
  }

  isRegistered(tournamentId: number): boolean {
    return this.registeredTournamentIds.has(tournamentId);
  }

  goToDetail(id: number): void {
    this.router.navigate([`/tournament/${id}`]);
  }

  onRegister(id: number) {
    this.router.navigate([`/tournament/${id}/register`])
  }

  onShowRegistrations(id: number) {
    this.router.navigate([`/tournament/${id}/registrations`])
  }

  editTournament(id: number) {
    this.router.navigate([`/tournament/edit/${id}`])
  }

  deleteTournament(id: number) {
    if (confirm('Möchten Sie dieses Turnier wirklich löschen?')) {
      this.tournamentService.deleteTournament(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
