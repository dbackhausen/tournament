import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  message = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.credentials).subscribe({
      next: (response: { token: string; }) => {
        localStorage.setItem('token', response.token);
        this.message = 'Login erfolgreich!';
        this.router.navigate(['/dashboard']);
      },
      error: () => this.message = 'Ungültige Anmeldedaten.'
    });
  }
}
