import { AbstractControl, ValidationErrors } from '@angular/forms';

export function deadlineBeforeFirstDayValidator(control: AbstractControl): ValidationErrors | null {
  const deadline = control.get('deadline')?.value;
  const tournamentDays = control.get('tournamentDays')?.value;

  if (!deadline || !tournamentDays || tournamentDays.length === 0) {
    return null;
  }

  const deadlineDate = new Date(deadline);
  const firstDay = new Date(tournamentDays[0].date);

  if (deadlineDate >= firstDay) {
    return { deadlineAfterFirstDay: true };
  }

  return null;
}
