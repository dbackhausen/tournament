import { Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TournamentService } from 'src/app/services/tournament.service';
import { RegistrationService } from 'src/app/services/registration.service';
import { AuthService } from 'src/app/services/auth.service';
import { Tournament, TournamentDay, TournamentType } from 'src/app/models/tournament.model';
import { catchError, of } from 'rxjs';

interface WeekGroup {
  label: string;
  days: TournamentDay[];
}

@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [CommonModule, Card, Button, Tabs, TabList, Tab, TabPanels, TabPanel],
  templateUrl: './tournament-detail.component.html',
  styleUrl: './tournament-detail.component.scss'
})
export class TournamentDetailComponent implements OnInit {
  tournament: Tournament | null = null;
  isRegistered = false;
  isAdmin = false;
  isMobile = false;
  activeWeek = 0;
  weekGroups: WeekGroup[] = [];
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
          this.weekGroups = this.buildWeekGroups(t);
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

  get isDeadlinePassed(): boolean {
    if (!this.tournament?.deadline) return false;
    return new Date() > new Date(this.tournament.deadline);
  }

  private buildWeekGroups(t: Tournament): WeekGroup[] {
    if (!t.tournamentDays?.length) return [];

    const groups = new Map<number, TournamentDay[]>();
    t.tournamentDays.forEach(day => {
      const key = this.isoYearWeek(new Date(day.date));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(day);
    });

    const sorted = [...groups.entries()].sort((a, b) => a[0] - b[0]);
    return sorted.map((entry, i) => ({ label: `Woche ${i + 1}`, days: entry[1] }));
  }

  private isoYearWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return d.getUTCFullYear() * 100 + week;
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
