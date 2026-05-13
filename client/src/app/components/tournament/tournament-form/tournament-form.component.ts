import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  FormsModule, FormControl
} from '@angular/forms';
import { CommonModule } from "@angular/common";
import { TournamentService } from "src/app/services/tournament.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { FloatLabel } from "primeng/floatlabel";
import { InputText } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";
import { DatePicker } from "primeng/datepicker";
import { Checkbox } from "primeng/checkbox";
import { Tournament, TournamentDay, TournamentType } from "src/app/models/tournament.model";
import { DatePipe } from '@angular/common';
import { Message } from "primeng/message";
import { InputNumber } from "primeng/inputnumber";
import { deadlineBeforeFirstDayValidator } from "src/app/validator/deadlineBeforeFirstDay.validator";
import { atLeastOneTypeSelectedValidator } from "src/app/validator/at-least-one-type-selected.validator";

@Component({
  selector: 'app-tournament-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    Card,
    Button,
    FloatLabel,
    InputText,
    Textarea,
    DatePicker,
    Checkbox,
    FormsModule,
    Message,
    InputNumber
  ],
  templateUrl: './tournament-form.component.html',
  styleUrl: './tournament-form.component.scss',
  providers: [DatePipe]
})
export class TournamentFormComponent implements OnInit {
  tournamentForm: FormGroup;
  today: Date = new Date();
  editMode = false;
  tournamentId: number | null = null;
  tournament: Tournament | null = null;
  private destroyRef = inject(DestroyRef);

  availableTournamentTypes = [
    {label: 'Einzel', value: 'SINGLE'},
    {label: 'Doppel', value: 'DOUBLE'},
    {label: 'Mixed', value: 'MIXED'}
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private tournamentService: TournamentService,
    private datePipe: DatePipe
  ) {
    // Initialize the form
    this.tournamentForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      additionalNotes: [''],
      entryFee: [null, [Validators.required, Validators.min(0), Validators.pattern('^[0-9]+$')]],
      tournamentDays: this.fb.array([this.createTournamentDay()]),
      tournamentTypes: this.fb.array([], atLeastOneTypeSelectedValidator),
      deadline: ['', Validators.required],
    }, { validators: deadlineBeforeFirstDayValidator });
  }

  ngOnInit(): void {
    // Initialize the form array for the selectable tournament types
    this.initializeTournamentTypes();

    // When deadline changes: force time to 23:59 and (in create mode) auto-set first tournament day to deadline + 1 day
    this.tournamentForm.get('deadline')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(deadlineValue => {
        if (!deadlineValue) return;

        const deadline = new Date(deadlineValue);
        if (deadline.getHours() !== 23 || deadline.getMinutes() !== 59) {
          deadline.setHours(23, 59, 0, 0);
          this.tournamentForm.get('deadline')!.setValue(deadline, { emitEvent: false });
        }

        if (!this.editMode) {
          const nextDay = new Date(deadline);
          nextDay.setDate(nextDay.getDate() + 1);
          nextDay.setHours(0, 0, 0, 0);
          this.tournamentDays.at(0).get('date')!.setValue(nextDay, { emitEvent: false });
        }
      });

    // Check, if EDIT MODE is present
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('tournamentId');
      if (id) {
        this.editMode = true;
        this.tournamentId = +id;
        this.loadTournament(this.tournamentId);
      }
    });
  }

  loadTournament(id: number): void {
    this.tournamentService.getTournament(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tournament) => {
      this.tournament = tournament;
      console.log(JSON.stringify(tournament));

      const deadlineDate = tournament.deadline ? new Date(tournament.deadline) : null;

      this.tournamentForm.patchValue({
        name: tournament.name,
        description: tournament.description,
        additionalNotes: tournament.additionalNotes,
        entryFee: tournament.entryFee,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        deadline: deadlineDate
      });

      // Set the tournament dates
      const daysFormArray = this.tournamentForm.get('tournamentDays') as FormArray;
      daysFormArray.clear();

      if (tournament.tournamentDays?.length) {
        tournament.tournamentDays.forEach(day => {
          daysFormArray.push(this.fb.group({
            date: [new Date(day.date)],
            time1: [day.time1 ? this.convertTimeStringToDate(day.time1) : null],
            time2: [day.time2 ? this.convertTimeStringToDate(day.time2) : null],
            time3: [day.time3 ? this.convertTimeStringToDate(day.time3) : null]
          }));
        });
      }

      // Set the tournament types
      const typesFormArray = this.tournamentForm.get('tournamentTypes') as FormArray;
      this.availableTournamentTypes.forEach((typeObj, index) => {
        const isSelected = tournament.tournamentTypes?.includes(<TournamentType>typeObj.value.toLowerCase());
        typesFormArray.at(index).setValue(isSelected);
      });
    });
  }

  onSubmit(): void {
    if (this.tournamentForm.valid) {
      const formValue = this.tournamentForm.value;

      const selectedTypes = formValue.tournamentTypes
        .map((checked: boolean, index: number) => {
          if (index >= 0 && index < this.availableTournamentTypes.length) {
            return checked ? this.availableTournamentTypes[index].value : null;
          } else {
            return null;
          }
        })
        .filter((type: string | null) => type !== null);

      const tournamentDays: TournamentDay[] = formValue.tournamentDays;

      if (tournamentDays && tournamentDays.length > 0) {
        tournamentDays.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        });
        tournamentDays.forEach((day: any) => {
          day.date = this.datePipe.transform(day.date, 'yyyy-MM-dd');
          day.time1 = day.time1 ? this.datePipe.transform(day.time1, 'HH:mm') : null;
          day.time2 = day.time2 ? this.datePipe.transform(day.time2, 'HH:mm') : null;
          day.time3 = day.time3 ? this.datePipe.transform(day.time3, 'HH:mm') : null;
        });

        const startDate = tournamentDays[0].date;
        const endDate = tournamentDays[tournamentDays.length - 1].date;

        const deadlineDate = new Date(formValue.deadline);
        const deadline = <string>this.datePipe.transform(deadlineDate, 'yyyy-MM-dd HH:mm');
        console.log('Formatted Deadline:', deadline);

        const tournamentData = {
          ...formValue,
          tournamentTypes: selectedTypes,
          startDate,
          endDate,
          deadline
        };

        console.log(tournamentData);

        if (this.editMode && this.tournamentId) {
          // Update an existing tournament
          this.tournamentService.updateTournament(this.tournamentId, tournamentData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
              next: (response) => {
                if (response != undefined) {
                  console.log('Tournament successfully updated', response);
                  this.tournamentForm.reset();
                  this.router.navigate(['/tournament']);
                } else {
                  console.error('Something wrong happened!');
                }
              },
              error: (error) => {
                console.error('Error creating tournament', error);
              }
            }
          )
        } else {
          // Create a new tournament
          this.tournamentService.addTournament(tournamentData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
              next: (response) => {
                if (response != undefined) {
                  console.log('Tournament successfully created', response);
                  this.tournamentForm.reset();
                  this.router.navigate(['/tournament']);
                } else {
                  console.error('Something wrong happened!');
                }
              },
              error: (error) => {
                console.error('Error creating tournament', error);
              }
            }
          )
        }
      }
    } else {
      console.error('Invalid form');
    }
  }

  onCancel(): void {
    this.router.navigate(['/tournament']);
  }

  // ------------------ TOURNAMENT DAYS ------------------

  createTournamentDay(): FormGroup {
    const nextDay = this.getNextDay();

    return this.fb.group({
      date: [nextDay, Validators.required],
      time1: [this.getDefaultTime(18, 0)],
      time2: [this.getDefaultTime(19, 30)],
      time3: [this.getDefaultTime(21, 0)]
    });
  }

  getDefaultTime(hours: number, minutes: number): Date {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  get tournamentDays(): FormArray {
    return this.tournamentForm.get('tournamentDays') as FormArray;
  }

  addTournamentDay(): void {
    this.tournamentDays.push(this.createTournamentDay());
  }

  removeTournamentDay(index: number): void {
    this.tournamentDays.removeAt(index);
  }

  getNextDay(): Date | null {
    if (this.tournamentForm) {
      const days = this.tournamentForm.get('tournamentDays') as FormArray;

      if (days.length > 0) {
        const lastDay = days.at(days.length - 1).value;
        if (lastDay.date) {
          const nextDate = new Date(lastDay.date);
          nextDate.setDate(nextDate.getDate() + 1); // Ein Tag weiter
          return nextDate;
        }
      }
    }

    return null;
  }

  private convertTimeStringToDate(timeString: string): Date {
    const parts = timeString.split(':');
    const d = new Date();
    d.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
    return d;
  }

  // ------------------ TOURNAMENT TYPES ------------------

  initializeTournamentTypes(): void {
    const typesFormArray = this.tournamentForm.get('tournamentTypes') as FormArray;
    typesFormArray.clear();
    this.availableTournamentTypes.forEach(() => {
      typesFormArray.push(new FormControl(false));
    });
  }

  get tournamentTypes(): FormArray {
    return this.tournamentForm.get('tournamentTypes') as FormArray;
  }

  toggleTournamentType(type: { label: string; value: string }, checked: boolean): void {
    const index = this.tournamentTypes.value.findIndex((t: string) => t === type.value);
    if (checked && index === -1) {
      this.tournamentTypes.push(new FormControl(type.value));
    } else if (!checked && index !== -1) {
      this.tournamentTypes.removeAt(index);
    }
  }

}
