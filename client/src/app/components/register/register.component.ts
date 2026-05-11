import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Message } from "primeng/message";
import { UserRegistration } from "src/app/models/user-registration.model";
import { Select } from "primeng/select";
import { SelectItem } from "primeng/api";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    Message,
    Select
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']

})
export class RegisterComponent {
  registerForm: FormGroup;
  genders: SelectItem[];
  message = '';
  successMessage = '';
  loading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      gender: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      mobile: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.genders = [
      { label: 'Herr', value: 'MALE' },
      { label: 'Frau', value: 'FEMALE' }
    ];
  }

  onSubmit() {
    if (this.registerForm.invalid || this.loading) return;

    const registrationData: UserRegistration = {
      gender: this.registerForm.value.gender,
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
      mobile: this.registerForm.value.mobile,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
    };

    this.loading = true;
    this.message = '';
    this.registerForm.disable();

    this.authService.register(registrationData).subscribe({
      next: () => {
        this.successMessage = 'Vielen Dank! Deine Registrierung war erfolgreich. Du erhältst in Kürze eine E-Mail zur Bestätigung.';
        setTimeout(() => this.router.navigate(['/login']), 5000);
      },
      error: (err: { error: any }) => {
        this.message = `Fehler: ${err.error}`;
        this.loading = false;
        this.registerForm.enable();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/tournament']);
  }
}
