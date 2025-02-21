import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  user = { username: '', email: '', password: '' };
  message = '';

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    this.authService.register(this.user).subscribe({
      next: () => {
        this.message = 'Registrierung erfolgreich! Bitte logge dich ein.';
        this.router.navigate(['/login']);
      },
      error: (err: { error: any; }) => this.message = `Fehler: ${err.error}`
    });
  }
}
