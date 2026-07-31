import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { Registration, Tournament } from 'src/app/models/tournament.model';
import { TournamentService } from 'src/app/services/tournament.service';
import { RegistrationService } from 'src/app/services/registration.service';
import { UserService } from 'src/app/services/user.service';

interface TeamGroup {
  name: string;
  members: { userId: number; lastName: string; firstName: string }[];
}

@Component({
  selector: 'app-team-overview',
  standalone: true,
  imports: [CommonModule, Card, Button, Message],
  templateUrl: './team-overview.component.html',
  styleUrl: './team-overview.component.scss'
})
export class TeamOverviewComponent implements OnInit {
  tournamentId: number | null = null;
  tournament: Tournament | null = null;
  teamGroups: TeamGroup[] = [];
  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tournamentService: TournamentService,
    private registrationService: RegistrationService,
    private userService: UserService
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
          map(registrations => ({ tournament, registrations: registrations as Registration[] }))
        )
      )
    ).subscribe({
      next: ({ tournament, registrations }) => {
        this.tournament = tournament;
        this.teamGroups = (tournament.teams ?? []).map(name => ({
          name,
          members: registrations
            .filter(registration => registration.team === name)
            .map(registration => ({
              userId: registration.user.id,
              lastName: registration.user.lastName,
              firstName: registration.user.firstName
            }))
            .sort((a, b) => a.lastName.localeCompare(b.lastName, 'de'))
        }));
      },
      error: (error) => {
        console.error('Error loading team overview', error);
      }
    });
  }

  getProfileImageUrl(userId: number): string {
    return this.userService.getProfileImageUrl(userId);
  }

  hideImage(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  goBack(): void {
    if (this.tournamentId) {
      this.router.navigate([`/tournament/${this.tournamentId}`]);
    } else {
      this.router.navigate(['/tournament']);
    }
  }
}
