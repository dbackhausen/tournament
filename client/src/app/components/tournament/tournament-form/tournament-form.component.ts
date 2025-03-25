import {Component, OnInit} from '@angular/core';
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
import {Message} from "primeng/message";

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
    Message
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
      tournamentDays: this.fb.array([this.createTournamentDay()]),
      tournamentTypes: this.fb.array([], Validators.required)
    });
  }

  ngOnInit(): void {
    // Initialize the form array for the selectable tournament types
    this.initializeTournamentTypes();

    // Check, if EDIT MODE is present
    this.route.paramMap.subscribe((params) => {
      const id = params.get('tournamentId');
      if (id) {
        this.editMode = true;
        this.tournamentId = +id;
        this.loadTournament(this.tournamentId);
      }
    });
  }

  loadTournament(id: number): void {
    this.tournamentService.getTournament(id).subscribe((tournament) => {
      this.tournament = tournament;

      this.tournamentForm.patchValue({
        name: tournament.name,
        description: tournament.description,
        additionalNotes: tournament.additionalNotes,
        startDate: tournament.startDate,
        endDate: tournament.endDate
      });

      // Set the tournament dates
      const daysFormArray = this.tournamentForm.get('tournamentDays') as FormArray;
      daysFormArray.clear();

      if (tournament.tournamentDays?.length) {
        tournament.tournamentDays.forEach(day => {
          daysFormArray.push(this.fb.group({
            date: [new Date(day.date)],
            startTime: [day.startTime],
            endTime: [day.endTime]
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
        tournamentDays.forEach(day => {
          const dateObj = Date.parse(day.date);
          const startTimeObj = Date.parse('1970-01-01T' + day.startTime);
          const endTimeObj = Date.parse('1970-01-01T' + day.endTime);
          day.date = <string>this.datePipe.transform(dateObj, 'yyyy-MM-dd');
          day.startTime = <string>this.datePipe.transform(startTimeObj, 'HH:mm');
          day.endTime = <string>this.datePipe.transform(endTimeObj, 'HH:mm');
        });

        const startDate = tournamentDays[0].date;
        const endDate = tournamentDays[tournamentDays.length - 1].date;

        const tournamentData = {
          ...formValue,
          tournamentTypes: selectedTypes,
          startDate,
          endDate
        };

        if (this.editMode && this.tournamentId) {
          // Update an existing tournament
          this.tournamentService.updateTournament(this.tournamentId, tournamentData).subscribe({
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
          this.tournamentService.addTournament(tournamentData).subscribe({
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
      startTime: [this.getDefaultTime(17, 0), Validators.required],
      endTime: [this.getDefaultTime(20, 0), Validators.required]
    });
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

  getDefaultTime(hours: number, minutes: number): Date {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
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
