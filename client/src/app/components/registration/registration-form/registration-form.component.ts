import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  FormsModule, FormControl
} from '@angular/forms';
import { CommonModule } from "@angular/common";
import { TournamentService } from "src/app/services/tournament.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { FloatLabel } from "primeng/floatlabel";
import { Textarea } from "primeng/textarea";
import { Checkbox } from "primeng/checkbox";
import { Registration, Tournament, TournamentDay, TournamentType } from "src/app/models/tournament.model";
import { Select } from "primeng/select";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { atLeastOneDaySelectedValidator } from "src/app/validator/at-least-one-day-selected.validator";
import { atLeastOneTypeSelectedValidator } from "src/app/validator/at-least-one-type-selected.validator";
import { AuthService } from "src/app/services/auth.service";
import { map, of, switchMap } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { User } from "src/app/models/user.model";
import { RegistrationService } from "src/app/services/registration.service";

@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    Card,
    Button,
    FloatLabel,
    Textarea,
    Checkbox,
    FormsModule,
    Select,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel
  ],
  templateUrl: './registration-form.component.html',
  styleUrl: './registration-form.component.scss'
})
export class RegistrationFormComponent implements OnInit {
  registerForm: FormGroup;
  tournamentId: number | null = null;
  tournament: Tournament | null = null;
  user: User | null = null;
  registration: Registration | null = null;
  activeWeek = 0;
  weekIndexGroups: { label: string; dayIndices: number[] }[] = [];
  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: AuthService,
    private tournamentService: TournamentService,
    private registrationService: RegistrationService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      selectableDays: this.fb.array([], [atLeastOneDaySelectedValidator]),
      selectableTypes: this.fb.array([], atLeastOneTypeSelectedValidator),
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const url = this.route.snapshot.url.map(segment => segment.path).join('/');
      const tournamentId = params.get('tournamentId');

      if (tournamentId) {
        this.tournamentId = +tournamentId;

        if (url.includes('registration/edit')) {
          const registrationId = params.get('registrationId');
          if (registrationId) {
            this.registrationService.getRegistration(Number(registrationId)).pipe(
              takeUntilDestroyed(this.destroyRef)
            ).subscribe({
              next: (data) => {
                this.registration = data;
                this.tournament = data.tournament;
                this.user = data.user;

                if (this.tournament?.tournamentDays?.length > 0) {
                  this.tournament.tournamentDays.forEach(day => this.addDayGroup(day));
                }
                if (this.tournament?.tournamentTypes?.length > 0) {
                  this.tournament.tournamentTypes.forEach(type => this.addTypeGroup(type));
                }

                this.restoreRegistrationData();
                this.applyDeadlineRestrictions();
                this.weekIndexGroups = this.buildWeekIndexGroups(this.tournament!);
              },
              error: (error) => {
                console.error('Error loading registration', error);
              }
            });
          }
        } else {
          this.user = this.authService.getUser();
          this.loadData(this.tournamentId);
        }
      } else {
        this.router.navigate([`/tournament`])
      }
    });
  }

  loadData(tournamentId: number) {
    if (this.user) {
      this.registrationService.getRegistrationByTournamentAndUser(tournamentId, this.user.id).pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null)),
        tap(registration => console.log(registration ? 'Existing registration found' : 'No existing registration found')),
        switchMap(registration => {
          if (registration) {
            return of({ registration, tournament: registration.tournament });
          }
          return this.tournamentService.getTournament(tournamentId).pipe(
            map(tournament => ({ registration: null, tournament }))
          );
        })
      ).subscribe({
        next: (result) => {
          this.registration = result.registration;
          this.tournament = result.tournament;

          if (this.tournament?.tournamentDays?.length > 0) {
            this.tournament.tournamentDays.forEach(day => this.addDayGroup(day));
          }

          if (this.tournament?.tournamentTypes?.length > 0) {
            this.tournament.tournamentTypes.forEach(type => this.addTypeGroup(type));
          }

          if (this.registration) {
            this.restoreRegistrationData();
          }

          this.applyDeadlineRestrictions();
          this.weekIndexGroups = this.buildWeekIndexGroups(this.tournament!);
        },
        error: (err) => {
          console.error('Error loading data:', err);
        }
      });
    }
  }

  private restoreRegistrationData() {
    console.log(this.registration);

    if (this.registration) {
      // 1. Restore selected days
      const daysArray = this.registerForm.get('selectableDays') as FormArray;
      const selectedDays = this.registration.selectedDays;

      // Group selected times by date for quick lookup
      const selectedByDate = new Map<string, string[]>();
      selectedDays.forEach(d => {
        const times = selectedByDate.get(d.date) || [];
        times.push(d.time.substring(0, 5)); // normalise to HH:mm
        selectedByDate.set(d.date, times);
      });

      daysArray.controls.forEach(dayGroup => {
        const date = dayGroup.get('date')?.value;
        const checkedTimes = selectedByDate.get(date) || [];
        const timesArray = dayGroup.get('times') as FormArray;
        timesArray.controls.forEach(timeGroup => {
          const time = timeGroup.get('time')?.value;
          timeGroup.get('selected')?.setValue(checkedTimes.includes(time));
        });
      });

      // 2. Restore selected game types
      const typesArray = this.registerForm.get('selectableTypes') as FormArray;
      const selectedTypes = this.registration.selectedTypes;

      typesArray.controls.forEach(typeGroup => {
        const type = typeGroup.get('type')?.value;
        const isSelected = selectedTypes.includes(type.toUpperCase());
        typeGroup.get('selected')?.setValue(isSelected);
      });

      // 3. Optional: restore any notes
      if (this.registration.notes) {
        this.registerForm.get('notes')?.setValue(this.registration.notes);
      }
    }
  }

  private buildWeekIndexGroups(t: Tournament): { label: string; dayIndices: number[] }[] {
    if (!t.tournamentDays?.length) return [];

    const groups = new Map<number, number[]>();
    t.tournamentDays.forEach((day, index) => {
      const key = this.isoYearWeek(new Date(day.date));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(index);
    });

    const sorted = [...groups.entries()].sort((a, b) => a[0] - b[0]);
    return sorted.map((entry, i) => ({ label: `Woche ${i + 1}`, dayIndices: entry[1] }));
  }

  private isoYearWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return d.getUTCFullYear() * 100 + week;
  }

  get isDeadlinePassed(): boolean {
    if (!this.tournament?.deadline) return false;
    return new Date() > new Date(this.tournament.deadline);
  }

  private applyDeadlineRestrictions(): void {
    if (this.isDeadlinePassed && this.registration) {
      this.selectableTypes.controls.forEach(ctrl => ctrl.disable());
    }
  }

  onSubmit() {
    if (this.user && this.user &&  this.tournamentId && this.tournament && this.registerForm.valid) {
      const formData = this.registerForm.getRawValue();

      const registration: Registration = {
        id: this.registration?.id ?? this.tournamentId,
        tournament: this.tournament,
        user: this.user,
        selectedDays: formData.selectableDays.flatMap((day: any) =>
          (day.times || [])
            .filter((t: any) => t.selected)
            .map((t: any) => ({ date: day.date, time: t.time }))
        ),
        selectedTypes: formData.selectableTypes
          .filter((type: { selected: any; }) => type.selected)
          .map((type: { type: any; }) => type.type),
        notes: formData.notes,
        payed: formData.payed ?? false
      };

      if (this.registration === null) {
        this.registrationService.addRegistration(registration).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            console.log('Registration successfully created');
            this.registerForm.reset();
            this.router.navigate(['/tournament']);
          },
          error: (error) => {
            console.error('Error registering to tournament', error);
          }
        });
      } else {
        this.registrationService.updateRegistration(registration).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            console.log('Registration successfully updated');
            this.registerForm.reset();
            this.router.navigate(['/tournament']);
          },
          error: (error) => {
            console.error('Error updating registration', error);
          }
        });
      }
    } else {
      console.error('Invalid form');
    }
  }

  onCancel() {
    this.registerForm.reset();
    this.router.navigate(['/tournament']);
  }

  get selectableDays(): FormArray {
    return this.registerForm.get('selectableDays') as FormArray;
  }

  get selectableTypes(): FormArray {
    return this.registerForm.get('selectableTypes') as FormArray;
  }

  // --

  private addDayGroup(day: TournamentDay): void {
    const availableTimes = [day.time1, day.time2, day.time3].filter(t => !!t) as string[];

    const timesArray = this.fb.array(
      availableTimes.map(time => this.fb.group({ time: [time], selected: [false] }))
    );

    const dayGroup = this.fb.group({
      date: [day.date],
      times: timesArray
    });

    this.selectableDays.push(dayGroup);
  }

  getTimesArray(dayIndex: number): FormArray {
    return this.selectableDays.at(dayIndex).get('times') as FormArray;
  }

  private addTypeGroup(type: TournamentType): void {
    const typeGroup = this.fb.group({
      type: [type],
      label: this.getLabelForType(type),
      selected: [false]
    });
    this.selectableTypes.push(typeGroup);
  }

  private getLabelForType(type: TournamentType): string {
    switch (type.toUpperCase()) {
      case TournamentType.SINGLE:
        return 'Einzel';
      case TournamentType.DOUBLE:
        return 'Doppel';
      case TournamentType.MIXED:
        return 'Mixed';
      default:
        return 'Unbekannt';
    }
  }
}
