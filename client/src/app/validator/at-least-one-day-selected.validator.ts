import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const atLeastOneDaySelectedValidator: ValidatorFn = (formArray: AbstractControl): ValidationErrors | null => {
  const selectedDays = (formArray.value as Array<any>).filter(day => day.selected && day.selectedTime);
  return selectedDays.length > 0 ? null : { noDaySelected: true };
};
