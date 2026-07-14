import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

export const atLeastOneDaySelectedValidator: ValidatorFn = (formArray: AbstractControl): ValidationErrors | null => {
  const rawValue = (formArray as FormArray).getRawValue();
  const hasSelection = (rawValue as Array<any>).some(
    day => Array.isArray(day.times) && day.times.some((t: any) => t.selected === true)
  );
  return hasSelection ? null : { noDaySelected: true };
};
