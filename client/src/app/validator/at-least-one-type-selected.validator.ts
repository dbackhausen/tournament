import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const atLeastOneTypeSelectedValidator: ValidatorFn = (formArray: AbstractControl): ValidationErrors | null => {
  const selectedTypes = (formArray.value as Array<any>).filter(type => type.selected);
  return selectedTypes.length > 0 ? null : { noTypeSelected: true };
};
