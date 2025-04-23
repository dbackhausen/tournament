import { Component, OnInit } from '@angular/core';
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
import { atLeastOneDaySelectedValidator } from "src/app/validator/at-least-one-day-selected.validator";
import { atLeastOneTypeSelectedValidator } from "src/app/validator/at-least-one-type-selected.validator";
import { selectedDateTimeValidator } from "src/app/validator/selected-date-time-validator";
import { AuthService } from "src/app/services/auth.service";
import { forkJoin, map, of, switchMap } from "rxjs";
import { tap } from "rxjs/operators";
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
    Select
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

  constructor(
    private authService: AuthService,
    private tournamentService: TournamentService,
    private registrationService: RegistrationService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      selectableDays: this.fb.array([], [atLeastOneDaySelectedValidator, selectedDateTimeValidator]),
      selectableTypes: this.fb.array([], atLeastOneTypeSelectedValidator),
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const url = this.route.snapshot.url.map(segment => segment.path).join('/');
      const tournamentId = params.get('tournamentId');

      if (tournamentId) {
        this.tournamentId = +tournamentId;

        if (url.includes('registration/edit')) {
          const registrationId = params.get('registrationId');
          if (registrationId) {
            this.registrationService.getRegistration(Number(registrationId)).subscribe({
              next: (data) => {
                this.registration = data;
                this.restoreRegistrationData();
              },
              error: (error) => {
                console.error('Error loading tournaments');
              },
              complete: () => {
                console.log('Tournaments successfully loaded')
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
    if (this.user && this.user) {
      this.registrationService.getRegistrationByTournamentAndUser(tournamentId, this.user.id).pipe(
        map(registration => {
          if (!registration) {
            return { registration: null, tournament: null, user: null };
          }
          return {
            registration,
            tournament: registration.tournament,
            user: registration.user
          };
        }),
        tap(result => console.log(result.registration ? 'Existing registration found' : 'No existing registration found')),
        switchMap((result) => {
          if (result.registration === null) {
            return forkJoin({
              tournament: this.tournamentService.getTournament(tournamentId),
            }).pipe(
              map(({ tournament }) => ({
                registration: null,
                tournament,
                user: this.user
              }))
            );
          } else {
            return of(result);
          }
        })
      ).subscribe({
        next: (result) => {
          this.registration = result.registration;
          this.tournament = result.tournament;

          if (this.tournament?.tournamentDays?.length > 0) {
            this.tournament.tournamentDays.forEach(day => {
              this.addDayGroup(day);
            })
          }

          if (this.tournament?.tournamentTypes?.length > 0) {
            this.tournament.tournamentTypes.forEach(type => {
              this.addTypeGroup(type);
            })
          }

          if (this.registration) {
            this.restoreRegistrationData();
          }
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

      daysArray.controls.forEach(dayGroup => {
        const date = dayGroup.get('date')?.value;
        const match = selectedDays.find(d => d.date === date);

        if (match) {
          let time = new Date(`1970-01-01T${match.time}`);
          const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          dayGroup.get('selected')?.setValue(true);
          dayGroup.get('selectedTime')?.setValue(timeString);
        } else {
          dayGroup.get('selected')?.setValue(false);
          dayGroup.get('selectedTime')?.setValue('');
        }
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

  onSubmit() {
    if (this.user && this.user &&  this.tournamentId && this.tournament && this.registerForm.valid) {
      const formData = this.registerForm.value;

      const registration: Registration = {
        id: this.registration?.id ?? this.tournamentId,
        tournament: this.tournament,
        user: this.user,
        selectedDays: formData.selectableDays
          .filter((day: { selected: any; }) => day.selected)
          .map((day: { date: any; selectedTime: any; }) => ({
            date: day.date,
            time: day.selectedTime
          })),
        selectedTypes: formData.selectableTypes
          .filter((type: { selected: any; }) => type.selected)
          .map((type: { type: any; }) => type.type),
        notes: formData.notes
      };

      if (this.registration === null) {
        this.registrationService.addRegistration(registration).subscribe({
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
        this.registrationService.updateRegistration(registration).subscribe({
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
    const timeslots = this.getTimeslots(day.startTime, day.endTime, 60);
    const dayGroup = this.fb.group({
      date: [day.date],
      selected: [false],
      selectedTime: [''],
      timeslots: [timeslots]
    });

    const selectedControl = dayGroup.get('selected') as FormControl;
    selectedControl.valueChanges.subscribe((isSelected: boolean) => {
      if (!isSelected) {
        dayGroup.get('selectedTime')?.reset();
      }
    });

    const selectedTimeControl = dayGroup.get('selectedTime') as FormControl;
    selectedTimeControl.valueChanges.subscribe((selectedTime: string) => {
      if (selectedTime) {
        dayGroup.get('selected')?.setValue(true, { emitEvent: false });
      }
    });

    this.selectableDays.push(dayGroup);
  }

  private getTimeslots(startTime: string, endTime: string, intervalMinutes: number) {
    const slots = [];
    let start = new Date(`1970-01-01T${startTime}`);
    let end = new Date(`1970-01-01T${endTime}`);

    while (start <= end) {
      const timeString = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      slots.push({ label: timeString, value: timeString });
      start.setMinutes(start.getMinutes() + intervalMinutes);
    }

    return slots;
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
