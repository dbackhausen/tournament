import { AbstractControl, ValidationErrors, ValidatorFn, FormArray } from '@angular/forms';

export const selectedDateTimeValidator: ValidatorFn = (formArray: AbstractControl): ValidationErrors | null => {
  const invalidControls = (formArray as FormArray).controls.filter(group => {
    const selected = group.get('selected')?.value;
    const selectedTime = group.get('selectedTime')?.value;
    return selected && !selectedTime;
  });

  return invalidControls.length > 0 ? { dateWithoutTime: true } : null;
};
