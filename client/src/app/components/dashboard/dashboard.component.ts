import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from "src/app/services/auth.service";
import { DashboardService } from "src/app/services/dashboard.service";
import { RegistrationService } from "src/app/services/registration.service";
import { MatchService } from "src/app/services/match.service";
import { Match } from "src/app/models/match.model";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { Textarea } from "primeng/textarea";

interface TournamentSchedule {
  tournamentId: number;
  tournamentName: string;
  recentMatches: Match[];
  upcomingMatches: Match[];
}

interface ParsedResult {
  player1Scores: number[];
  player2Scores: number[];
  setWinners: ('A' | 'B' | null)[];
  winner: 'A' | 'B' | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    Card,
    Button,
    Textarea,
    FormsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  username: string = '';
  message: string = '';
  editedMessage: string = '';
  isAdmin: boolean = false;
  isEditing: boolean = false;
  schedules: TournamentSchedule[] = [];
  private modeOptions = [
    { label: 'Einzel', value: 'single' },
    { label: 'Doppel', value: 'double' },
    { label: 'Mixed', value: 'mixed' }
  ];
  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private registrationService: RegistrationService,
    private matchService: MatchService
  ) {}

  ngOnInit() {
    const user = this.authService.getUser();
    if (user) {
      this.username = user.firstName;
      this.loadSchedules(user.id);
    }
    this.isAdmin = this.authService.isAdmin();

    this.dashboardService.getMessage().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.message = data.message;
      },
      error: (error) => {
        console.error('Error loading dashboard message', error);
      }
    });
  }

  private loadSchedules(userId: number): void {
    this.registrationService.getRegistrationsByUser(userId).pipe(
      catchError(() => of([])),
      switchMap(registrations => {
        const tournaments = new Map<number, string>();
        registrations.forEach(r => tournaments.set(r.tournament.id, r.tournament.name));

        const entries = Array.from(tournaments.entries());
        if (entries.length === 0) return of([]);

        return forkJoin(entries.map(([tournamentId, tournamentName]) =>
          this.matchService.getMatches(tournamentId).pipe(
            catchError(() => of([])),
            map(matches => ({ tournamentId, tournamentName, matches }))
          )
        ));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(results => {
      const now = new Date();

      this.schedules = results
        .filter(r => r.matches.length > 0)
        .map(r => {
          const withDateTime = r.matches
            .map(match => ({ match, dateTime: this.combineDateTime(match.date, match.time) }))
            .filter((x): x is { match: Match; dateTime: Date } => x.dateTime !== null);

          const recentMatches = withDateTime
            .filter(x => x.dateTime <= now)
            .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime())
            .slice(0, 10)
            .map(x => x.match);

          const upcomingMatches = withDateTime
            .filter(x => x.dateTime > now)
            .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
            .slice(0, 10)
            .map(x => x.match);

          return {
            tournamentId: r.tournamentId,
            tournamentName: r.tournamentName,
            recentMatches,
            upcomingMatches
          };
        })
        .filter(s => s.recentMatches.length > 0 || s.upcomingMatches.length > 0);
    });
  }

  private combineDateTime(date: Date | null, time: Date | null): Date | null {
    if (!date) return null;
    const combined = new Date(date);
    if (time) {
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    }
    return combined;
  }

  formatPlayers(player1: string | null, player2: string | null): string {
    const players = [player1, player2].filter((p): p is string => !!p);
    return players.length ? players.join(', ') : '–';
  }

  modeLabel(value: string | null): string {
    return this.modeOptions.find(o => o.value === value)?.label ?? value ?? '';
  }

  // Scans the free-text result (e.g. "6:1, 6:4" or "6-1 and 6-4") for set-score
  // pairs, regardless of the separators used, so the sets can be rendered as
  // aligned columns next to each player's name.
  parseResult(result: string | null): ParsedResult | null {
    if (!result) return null;

    const setPattern = /(\d+)\s*[:\-]\s*(\d+)/g;
    const player1Scores: number[] = [];
    const player2Scores: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = setPattern.exec(result)) !== null) {
      player1Scores.push(Number(match[1]));
      player2Scores.push(Number(match[2]));
    }

    if (player1Scores.length === 0) return null;

    const setWinners: ('A' | 'B' | null)[] = [];
    let player1Sets = 0;
    let player2Sets = 0;
    for (let i = 0; i < player1Scores.length; i++) {
      if (player1Scores[i] > player2Scores[i]) {
        player1Sets++;
        setWinners.push('A');
      } else if (player2Scores[i] > player1Scores[i]) {
        player2Sets++;
        setWinners.push('B');
      } else {
        setWinners.push(null);
      }
    }

    const winner = player1Sets > player2Sets ? 'A' : player2Sets > player1Sets ? 'B' : null;

    return { player1Scores, player2Scores, setWinners, winner };
  }

  onEdit(): void {
    this.editedMessage = this.message;
    this.isEditing = true;
  }

  onCancel(): void {
    this.isEditing = false;
  }

  onSave(): void {
    this.dashboardService.updateMessage(this.editedMessage).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.message = data.message;
        this.isEditing = false;
      },
      error: (error) => {
        alert(error.error?.message ?? 'Die Nachricht konnte nicht gespeichert werden.');
      }
    });
  }
}
