import { Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { TournamentService } from "src/app/services/tournament.service";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {Registration, Tournament, TournamentType} from "src/app/models/tournament.model";
import { TableModule } from "primeng/table";
import { AuthService } from "src/app/services/auth.service";
import { catchError, map, of, switchMap } from "rxjs";
import { Message } from "primeng/message";
import { RegistrationService } from "src/app/services/registration.service";
import { UserService } from "src/app/services/user.service";
import { Checkbox } from "primeng/checkbox";

@Component({
  selector: 'app-registration-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Button,
    TableModule,
    RouterLink,
    Message,
    Checkbox
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
          const matches = selected.filter(d => d.date === day.date);
          return matches.length > 0 ? matches.map(m => m.time).join(', ') : 'nicht gemeldet';
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

  downloadMatchTemplate(): void {
    if (!this.tournament || this.registrations.length === 0) return;

    import('xlsx').then(XLSX => {
      const wb = XLSX.utils.book_new();
      const tournament = this.tournament!;

      // ── Sheet 1: Participants ───────────────────────
      const participantRows: any[][] = [
        ['Nr.', 'Name', 'Stärke'],
        ...this.registrations.map((reg, i) => [
          i + 1,
          `${reg.user.lastName}, ${reg.user.firstName}`,
          reg.user.strength ?? ''
        ])
      ];
      const wsP = XLSX.utils.aoa_to_sheet(participantRows);
      wsP['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsP, 'Teilnehmer');

      // ── Sheet per tournament day ────────────────────
      const playerRange = `Teilnehmer!$B$2:$B$${this.registrations.length + 1}`;
      const matchRows = 20;

      for (const day of tournament.tournamentDays) {
        const date = new Date(day.date);
        const sheetName = date.toLocaleDateString('de-DE', {
          weekday: 'short', day: '2-digit', month: '2-digit'
        }).replace(/,/g, '').trim().substring(0, 31);

        const times = [day.time1, day.time2, day.time3].filter(Boolean);
        const timeFormula = times.length ? `"${times.join(',')}"` : '"18:00,19:30,21:00"';

        const headers = ['Spiel', 'Typ', 'Zeit', 'Spieler 1', 'Spieler 2', 'Spieler 3', 'Spieler 4'];
        const data: any[][] = [headers];
        for (let i = 1; i <= matchRows; i++) data.push([i, '', '', '', '', '', '']);

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 28 }];

        (ws as any)['!dataValidations'] = [
          { type: 'list', sqref: `B2:B${matchRows + 1}`, formula1: '"Einzel,Doppel,Mixed"', allowBlank: true, showDropDown: false },
          { type: 'list', sqref: `C2:C${matchRows + 1}`, formula1: timeFormula,              allowBlank: true, showDropDown: false },
          { type: 'list', sqref: `D2:D${matchRows + 1}`, formula1: playerRange,               allowBlank: true, showDropDown: false },
          { type: 'list', sqref: `E2:E${matchRows + 1}`, formula1: playerRange,               allowBlank: true, showDropDown: false },
          { type: 'list', sqref: `F2:F${matchRows + 1}`, formula1: playerRange,               allowBlank: true, showDropDown: false },
          { type: 'list', sqref: `G2:G${matchRows + 1}`, formula1: playerRange,               allowBlank: true, showDropDown: false },
        ];

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      XLSX.writeFile(wb, `${tournament.name}_Spielplan.xlsx`);
    });
  }

  private escapeCsv(value: any): string {
    if (value == null) return '';
    value = value.toString().replace(/"/g, '""');
    if (value.search(/("|;|\n)/g) >= 0) value = `"${value}"`;
    return value;
  }
}
