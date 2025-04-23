import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { TournamentService } from "src/app/services/tournament.service";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {Registration, Tournament, TournamentType} from "src/app/models/tournament.model";
import { TableModule } from "primeng/table";
import { AuthService } from "src/app/services/auth.service";
import { map, switchMap } from "rxjs";
import { Message } from "primeng/message";
import { RegistrationService } from "src/app/services/registration.service";
import {DataView} from "primeng/dataview";

@Component({
  selector: 'app-registration-overview',
  standalone: true,
  imports: [
    CommonModule,
    Card,
    Button,
    TableModule,
    RouterLink,
    Message,
    DataView
  ],
  templateUrl: './registration-overview.component.html',
  styleUrl: './registration-overview.component.scss'
})
export class RegistrationOverviewComponent implements OnInit {
  tournamentId: number | null = null;
  protected tournament: Tournament | null = null;
  protected registrations: Registration[] = [];
  isMobile: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private tournamentService: TournamentService,
    private registrationService: RegistrationService,
  ) {
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.checkViewport();

    this.route.paramMap.subscribe((params) => {
      const tournamentId = params.get('tournamentId');
      if (tournamentId) {
        this.tournamentId = +tournamentId;
        this.loadData(this.tournamentId);
      }
    });
  }

  loadData(id: number): void {
    this.tournamentService.getTournament(id).pipe(
      switchMap(tournament =>
        this.registrationService.getRegistrationsByTournament(tournament.id).pipe(
          map(registrations => ({ tournament, registrations }))
        )
      )
    ).subscribe({
      next: ({ tournament, registrations }) => {
        this.tournament = tournament;
        this.registrations = registrations;
      },
      error: (error) => {
        console.error('Error loading tournament with its registrations', error);
      },
      complete: () => {
        console.log('Tournament and its registrations successfully loaded');
      }
    });
  }

  checkViewport(): void {
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
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

  showProfile(userId: number) {
    this.router.navigate(['/profile/' + userId]);
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

      const fixedHeaders = ['Vorname', 'Nachname', 'E-Mail', 'Mobil', ...typeColumns.map(type => typeColumnLabels[type])];
      const dayHeaders = tournament.tournamentDays.map(day => day.date);
      const headers = [...fixedHeaders, ...dayHeaders, 'Bemerkung'];

      const rows = this.registrations.map(reg => {
        const { user, selectedTypes = [], selectedDays = [], notes } = reg;

        const typeFlags = typeColumns.map(type =>
          selectedTypes.includes(type) ? 'ja' : 'nein'
        );

        const fixedData = [
          user.firstName,
          user.lastName,
          user.email,
          user.mobile,
          ...typeFlags
        ];

        const selected = Array.isArray(selectedDays) ? selectedDays : [];
        const dayData = tournament.tournamentDays.map(day => {
          const match = selected.find(d => d.date === day.date);
          return match && match.time ? `ab ${match.time}` : 'nicht gemeldet';
        });

        const remarks = notes?.replace(/\n/g, ' ') || '';

        return [...fixedData, ...dayData, remarks];
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

  private escapeCsv(value: any): string {
    if (value == null) return '';
    value = value.toString().replace(/"/g, '""');
    if (value.search(/("|;|\n)/g) >= 0) value = `"${value}"`;
    return value;
  }
}
