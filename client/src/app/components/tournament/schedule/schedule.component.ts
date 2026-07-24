import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputText } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { TournamentService } from 'src/app/services/tournament.service';
import { MatchService } from 'src/app/services/match.service';
import { Tournament } from 'src/app/models/tournament.model';
import { Match, createEmptyMatch } from 'src/app/models/match.model';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, Card, Button, TableModule, InputText, DatePicker, Select],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss'
})
export class ScheduleComponent implements OnInit {
  tournamentId!: number;
  tournament: Tournament | null = null;
  matches: Match[] = [];
  isEditing = false;
  courtOptions: number[] = Array.from({ length: 10 }, (_, i) => i + 1);
  modeOptions = [
    { label: 'Einzel', value: 'single' },
    { label: 'Doppel', value: 'double' },
    { label: 'Mixed', value: 'mixed' }
  ];
  statusOptions = [
    { label: 'geplant', value: 'planned' },
    { label: 'abgeschlossen', value: 'complete' }
  ];
  private originalMatches: Match[] = [];
  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tournamentService: TournamentService,
    private matchService: MatchService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('tournamentId');
    if (!id) {
      this.router.navigate(['/tournament']);
      return;
    }
    this.tournamentId = +id;

    this.tournamentService.getTournament(this.tournamentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tournament => this.tournament = tournament);

    this.loadMatches();
  }

  loadMatches(): void {
    this.matchService.getMatches(this.tournamentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(matches => this.matches = matches);
  }

  onEdit(): void {
    this.originalMatches = this.matches.map(m => ({ ...m }));
    this.isEditing = true;
  }

  onCancel(): void {
    this.matches = this.originalMatches.map(m => ({ ...m }));
    this.isEditing = false;
  }

  onSave(): void {
    const removedIds = this.originalMatches
      .map(m => m.id)
      .filter((id): id is number => id !== null && !this.matches.some(m => m.id === id));

    const deletions: Observable<unknown>[] = removedIds.map(id => this.matchService.deleteMatch(this.tournamentId, id));
    const upserts: Observable<unknown>[] = this.matches.map(match =>
      match.id
        ? this.matchService.updateMatch(this.tournamentId, match.id, match)
        : this.matchService.createMatch(this.tournamentId, match)
    );

    const requests = [...deletions, ...upserts];
    (requests.length ? forkJoin(requests) : of([]))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isEditing = false;
          this.loadMatches();
        },
        error: (error) => {
          console.error('Error saving schedule', error);
          alert('Der Spielplan konnte nicht gespeichert werden.');
        }
      });
  }

  addMatch(): void {
    this.matches.push(createEmptyMatch());
  }

  removeMatch(match: Match): void {
    const index = this.matches.indexOf(match);
    if (index > -1) this.matches.splice(index, 1);
  }

  downloadSchedule(): void {
    this.matchService.exportSchedule(this.tournamentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Spielplan_${this.tournament?.name ?? this.tournamentId}.xlsx`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: (error) => console.error('Error downloading schedule', error)
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.matchService.importSchedule(this.tournamentId, file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (matches) => {
          this.matches = matches;
          alert('Spielplan erfolgreich hochgeladen.');
        },
        error: (error) => {
          console.error('Error uploading schedule', error);
          alert('Der Spielplan konnte nicht hochgeladen werden.');
        }
      });

    input.value = '';
  }

  goBack(): void {
    this.router.navigate([`/tournament/${this.tournamentId}`]);
  }

  get teamOptions(): string[] {
    return this.tournament?.teams ?? [];
  }

  modeLabel(value: string | null): string {
    return this.modeOptions.find(o => o.value === value)?.label ?? value ?? '';
  }

  statusLabel(value: string | null): string {
    return this.statusOptions.find(o => o.value === value)?.label ?? value ?? '';
  }
}
