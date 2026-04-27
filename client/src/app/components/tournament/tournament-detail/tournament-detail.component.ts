import { Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { TournamentService } from 'src/app/services/tournament.service';
import { RegistrationService } from 'src/app/services/registration.service';
import { AuthService } from 'src/app/services/auth.service';
import { Tournament, TournamentType } from 'src/app/models/tournament.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [CommonModule, Card, Button],
  templateUrl: './tournament-detail.component.html',
  styleUrl: './tournament-detail.component.scss'
})
export class TournamentDetailComponent implements OnInit {
  tournament: Tournament | null = null;
  isRegistered = false;
  isAdmin = false;
  isMobile = false;
  private tournamentId!: number;
  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tournamentService: TournamentService,
    private registrationService: RegistrationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/tournament']); return; }
    this.tournamentId = +id;
    this.loadData();
  }

  loadData(): void {
    this.tournamentService.getTournament(this.tournamentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (t) => {
          this.tournament = t;
          const user = this.authService.getUser();
          if (user) {
            this.registrationService.getRegistrationByTournamentAndUser(this.tournamentId, user.id)
              .pipe(catchError(() => of(null)))
              .subscribe(reg => this.isRegistered = !!reg);
          }
        },
        error: () => this.router.navigate(['/tournament'])
      });
  }

  typeLabel(type: TournamentType): string {
    switch (type) {
      case TournamentType.SINGLE: return 'Einzel';
      case TournamentType.DOUBLE: return 'Doppel';
      case TournamentType.MIXED: return 'Mixed';
    }
  }

  onRegister(): void {
    this.router.navigate([`/tournament/${this.tournamentId}/register`]);
  }

  onShowRegistrations(): void {
    this.router.navigate([`/tournament/${this.tournamentId}/registrations`]);
  }

  onEdit(): void {
    this.router.navigate([`/tournament/edit/${this.tournamentId}`]);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
  }

  goBack(): void {
    this.router.navigate(['/tournament']);
  }
}
