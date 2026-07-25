import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { TableModule } from "primeng/table";
import { Message } from "primeng/message";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, map, of, switchMap } from "rxjs";
import { Registration, Tournament, TournamentDay, TournamentType } from "src/app/models/tournament.model";
import { TournamentService } from "src/app/services/tournament.service";
import { RegistrationService } from "src/app/services/registration.service";

interface ParticipationRow {
  lastName: string;
  firstName: string;
  single: boolean;
  double: boolean;
  mixed: boolean;
  dayTimes: string[];
}

@Component({
  selector: 'app-participation-overview',
  standalone: true,
  imports: [
    CommonModule,
    Card,
    Button,
    TableModule,
    Message
  ],
  templateUrl: './participation-overview.component.html',
  styleUrl: './participation-overview.component.scss'
})
export class ParticipationOverviewComponent implements OnInit {
  tournamentId: number | null = null;
  tournament: Tournament | null = null;
  rows: ParticipationRow[] = [];
  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tournamentService: TournamentService,
    private registrationService: RegistrationService
  ) {}

  ngOnInit(): void {
    const tournamentId = this.route.snapshot.paramMap.get('tournamentId');
    if (tournamentId) {
      this.tournamentId = +tournamentId;
      this.loadData(this.tournamentId);
    } else {
      this.router.navigate(['/tournament']);
    }
  }

  loadData(tournamentId: number): void {
    this.tournamentService.getTournament(tournamentId).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(tournament =>
        this.registrationService.getRegistrationsByTournament(tournamentId).pipe(
          catchError(() => of([])),
          map(registrations => ({ tournament, registrations }))
        )
      )
    ).subscribe({
      next: ({ tournament, registrations }) => {
        this.tournament = tournament;
        this.rows = this.buildRows(tournament, registrations as Registration[]);
      },
      error: (error) => {
        console.error('Error loading participation overview', error);
      }
    });
  }

  private buildRows(tournament: Tournament, registrations: Registration[]): ParticipationRow[] {
    return registrations
      .map(registration => {
        const selectedTypes = registration.selectedTypes ?? [];
        const selectedDays = registration.selectedDays ?? [];

        const dayTimes = tournament.tournamentDays.map(day => {
          const matches = selectedDays.filter(d => d.date === day.date);
          return matches.length > 0
            ? matches.map(m => m.time.substring(0, 5)).join(', ')
            : 'n/a';
        });

        return {
          lastName: registration.user.lastName,
          firstName: registration.user.firstName,
          single: selectedTypes.includes(TournamentType.SINGLE),
          double: selectedTypes.includes(TournamentType.DOUBLE),
          mixed: selectedTypes.includes(TournamentType.MIXED),
          dayTimes
        };
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'de'));
  }

  get dayHeaders(): TournamentDay[] {
    return this.tournament?.tournamentDays ?? [];
  }

  goBack(): void {
    if (this.tournamentId) {
      this.router.navigate([`/tournament/${this.tournamentId}`]);
    } else {
      this.router.navigate(['/tournament']);
    }
  }

  showRegistrations(): void {
    if (this.tournamentId) {
      this.router.navigate([`/tournament/${this.tournamentId}/registrations`]);
    }
  }
}
