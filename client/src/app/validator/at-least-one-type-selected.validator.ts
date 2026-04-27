import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const atLeastOneTypeSelectedValidator: ValidatorFn = (formArray: AbstractControl): ValidationErrors | null => {
  const selectedTypes = (formArray.value as Array<any>).filter(type =>
    typeof type === 'boolean' ? type : type?.selected === true
  );
  return selectedTypes.length > 0 ? null : { noTypeSelected: true };
};
