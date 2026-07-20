import { AbstractControl, ValidationErrors } from '@angular/forms';

export function deadlineBeforeFirstDayValidator(control: AbstractControl): ValidationErrors | null {
  const deadline = control.get('deadline')?.value;
  const tournamentDays = control.get('tournamentDays')?.value;

  if (!deadline || !tournamentDays || tournamentDays.length === 0) {
    return null;
  }

  const deadlineDate = new Date(deadline);
  const lastDay = new Date(Math.max(...tournamentDays.map((d: any) => new Date(d.date).getTime())));
  lastDay.setHours(23, 59, 59, 999);

  if (deadlineDate > lastDay) {
    return { deadlineAfterFirstDay: true };
  }

  return null;
}
