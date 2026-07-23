import { Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { TournamentService } from "src/app/services/tournament.service";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {Registration, Tournament, TournamentType} from "src/app/models/tournament.model";
import { AuthService } from "src/app/services/auth.service";
import { catchError, map, of, switchMap } from "rxjs";
import { Message } from "primeng/message";
import { RegistrationService } from "src/app/services/registration.service";
import { UserService } from "src/app/services/user.service";
import { Checkbox } from "primeng/checkbox";
import { TableModule } from "primeng/table";
import { Select } from "primeng/select";

@Component({
  selector: 'app-registration-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Button,
    RouterLink,
    Message,
    Checkbox,
    TableModule,
    Select
  ],
  templateUrl: './registration-overview.component.html',
  styleUrl: './registration-overview.component.scss'
})
export class RegistrationOverviewComponent implements OnInit {
  tournamentId: number | null = null;
  protected tournament: Tournament | null = null;
  protected registrations: Registration[] = [];
  isAdmin: boolean = false;
  isMobile: boolean = false;
  isDesktop: boolean = false;
  currentUserId: number | null = null;
  private destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private tournamentService: TournamentService,
    private registrationService: RegistrationService,
    private userService: UserService,
  ) {
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.currentUserId = this.authService.getUser()?.id ?? null;
    this.checkViewport();

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tournamentId = params.get('tournamentId');
      if (tournamentId) {
        this.tournamentId = +tournamentId;
        this.loadData(this.tournamentId);
      }
    });
  }

  loadData(id: number): void {
    this.tournamentService.getTournament(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(tournament =>
        this.registrationService.getRegistrationsByTournament(tournament.id).pipe(
          catchError(() => of([])),
          map(registrations => ({ tournament, registrations }))
        )
      )
    ).subscribe({
      next: ({ tournament, registrations }) => {
        this.tournament = tournament;
        this.registrations = (registrations as Registration[]).sort((a, b) =>
          a.user.lastName.localeCompare(b.user.lastName, 'de')
        );
      },
      error: (error) => {
        console.error('Error loading tournament', error);
      }
    });
  }

  checkViewport(): void {
    this.isMobile = window.matchMedia('(max-width: 600px)').matches;
    this.isDesktop = window.matchMedia('(min-width: 1367px)').matches;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkViewport();
  }

  editRegistration(registrationId: number) {
    this.router.navigate([`/tournament/${this.tournamentId}/registration/edit/${registrationId}`]);
  }

  deleteRegistration(registrationId: number) {
    if (confirm('Möchten Sie diese Registrierung wirklich löschen?')) {
      if (registrationId > 0) {
        this.registrationService.deleteRegistration(registrationId).subscribe({
          next: () => {
            alert('Registrierung erfolgreich gelöscht.');
            if (this.tournamentId != null) {
              this.loadData(this.tournamentId);
            }
          },
          error: (error) => {
            alert(error.message);
          }
        });
      }
    }
  }

  togglePayed(registration: Registration) {
    this.registrationService.updatePayed(registration.id, !registration.payed).subscribe({
      next: (updated) => {
        registration.payed = updated.payed;
      },
      error: (error) => {
        console.error('Error updating payed status', error);
      }
    });
  }

  get teamOptions(): { label: string; value: string }[] {
    return (this.tournament?.teams ?? []).map(team => ({ label: team, value: team }));
  }

  onTeamChange(registration: Registration, team: string | null): void {
    this.registrationService.updateTeam(registration.id, team).subscribe({
      next: (updated) => {
        registration.team = updated.team;
      },
      error: (error) => {
        console.error('Error updating team', error);
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

  showProfile(userId: number) {
    this.router.navigate(['/profile/' + userId]);
  }

  showParticipationOverview() {
    this.router.navigate([`/tournament/${this.tournamentId}/participation-overview`]);
  }

  downloadRegistrationsAsCSV() {
    if (this.tournament) {
      const tournament = this.tournament;

      const typeColumns: TournamentType[] = [
        TournamentType.SINGLE,
        TournamentType.DOUBLE,
        TournamentType.MIXED
      ];

      const typeColumnLabels: Record<TournamentType, string> = {
        [TournamentType.SINGLE]: 'Einzel',
        [TournamentType.DOUBLE]: 'Doppel',
        [TournamentType.MIXED]: 'Mixed'
      };

      const timeSlots = tournament.tournamentDays.flatMap(day =>
        [day.time1, day.time2, day.time3]
          .filter((time): time is string => !!time)
          .map(time => ({ date: day.date, time }))
      );

      const fixedHeaders = ['Benutzer-ID', 'Vorname', 'Nachname', 'E-Mail', 'Mobil', 'Stärke', ...typeColumns.map(type => typeColumnLabels[type])];
      const timeSlotHeaders = timeSlots.map(slot => `${this.formatDate(slot.date)} ${slot.time}`);
      const headers = [...fixedHeaders, ...timeSlotHeaders, 'Team', 'Bezahlt', 'Bemerkung'];

      const rows = this.registrations.map(reg => {
        const { user, selectedTypes = [], selectedDays = [], notes, team, payed } = reg;

        const typeFlags = typeColumns.map(type =>
          selectedTypes.includes(type) ? 'ja' : 'nein'
        );

        const fixedData = [
          user.id,
          user.firstName,
          user.lastName,
          user.email,
          user.mobile,
          user.strength ?? '',
          ...typeFlags
        ];

        const selected = Array.isArray(selectedDays) ? selectedDays : [];
        const timeSlotData = timeSlots.map(slot => {
          const isSelected = selected.some(d => d.date === slot.date && d.time.substring(0, 5) === slot.time);
          return isSelected ? 'ja' : 'nein';
        });

        const remarks = notes?.replace(/\n/g, ' ') || '';

        return [...fixedData, ...timeSlotData, team ?? '', payed ? 'ja' : 'nein', remarks];
      });

      const csvContent = [headers, ...rows]
        .map(e => e.map(this.escapeCsv).join(';'))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = tournament.name + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  private formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${day}.${month}.${year}`;
  }

  private escapeCsv(value: any): string {
    if (value == null) return '';
    value = value.toString().replace(/"/g, '""');
    if (value.search(/("|;|\n)/g) >= 0) value = `"${value}"`;
    return value;
  }
}
