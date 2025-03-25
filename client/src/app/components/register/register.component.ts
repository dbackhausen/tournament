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

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      gender: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      mobile: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    })

    this.genders = [];
    this.genders.push({ label: 'Herr', value: 'MALE' });
    this.genders.push({ label: 'Frau', value: 'FEMALE' });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const registrationData: UserRegistration = {
        gender: this.registerForm.value.gender,
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        mobile: this.registerForm.value.mobile,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
      };

      this.authService.register(registrationData).subscribe({
        next: () => {
          this.message = 'Danke für deine Registrierung! Du erhältst in Kürze eine E-Mail zwecks Bestätigung.';
          this.router.navigate(['/login']);
        },
        error: (err: { error: any; }) => this.message = `Fehler: ${err.error}`
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/tournament']);
  }
}
