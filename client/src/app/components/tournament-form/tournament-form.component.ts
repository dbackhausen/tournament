import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { differenceInCalendarDays } from 'date-fns';
import { CommonModule, DatePipe} from "@angular/common";
import { TournamentService } from "src/app/services/tournament.service";

@Component({
    selector: 'app-tournament-form',
    imports: [
        DatePipe,
        ReactiveFormsModule,
        CommonModule
    ],
    templateUrl: './tournament-form.component.html',
    styleUrl: './tournament-form.component.scss'
})
export class TournamentFormComponent implements OnInit {
  tournamentForm: FormGroup;
  daysArray: { date: Date, control: FormControl }[] = [];
  tournamentTypes = [
    { label: 'Einzel', value: 'SINGLE' },
    { label: 'Doppel', value: 'DOUBLE' },
    { label: 'Mixed', value: 'MIXED' }
  ];

  constructor(
    private fb: FormBuilder,
    private tournamentService: TournamentService
  ) {
    this.tournamentForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      additionalNotes: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      selectedDays: [this.fb.array([]), Validators.required],
      tournamentTypes: [this.fb.array([]), Validators.required]
    });
  }

  ngOnInit(): void {
    this.tournamentForm.get('startDate')?.valueChanges.subscribe(() => this.updateDaysArray());
    this.tournamentForm.get('endDate')?.valueChanges.subscribe(() => this.updateDaysArray());
  }

  updateDaysArray(): void {
    const startDate = this.tournamentForm.get('startDate')?.value;
    const endDate = this.tournamentForm.get('endDate')?.value;

    if (startDate && endDate && startDate <= endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = differenceInCalendarDays(end, start) + 1;

      this.daysArray = [];
      const selectedDaysFormArray = this.tournamentForm.get('selectedDays') as FormArray;
      selectedDaysFormArray.clear();

      for (let i = 0; i < daysDiff; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const control = new FormControl(false);
        this.daysArray.push({ date, control });
        selectedDaysFormArray.push(control);
      }
    }
  }

  onTournamentTypeChange(event: any): void {
    const tournamentTypesFormArray = this.tournamentForm.get('tournamentTypes') as FormArray;
    if (event.target.checked) {
      tournamentTypesFormArray.push(new FormControl(event.target.value));
    } else {
      const index = tournamentTypesFormArray.controls.findIndex(x => x.value === event.target.value);
      tournamentTypesFormArray.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.tournamentForm.valid) {
      const formValue = this.tournamentForm.value;
      const selectedDays = this.daysArray
        .filter((day, index) => formValue.selectedDays[index])
        .map(day => day.date.toISOString().split('T')[0]);

      const tournamentData = {
        ...formValue,
        selectedDays
      };

      console.log(tournamentData);
      this.tournamentService.createTournament(tournamentData).subscribe({
          next: (response) => {
            console.log('Tournament successfully created', response);
          },
          error: (error) => {
            console.error('Error creating tournament', error);
          }
        }
      )
    } else {
      console.log('Invalid form');
    }
  }
}
