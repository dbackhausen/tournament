import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent implements OnInit {
  loading = true;
  error = '';

  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading = false;
      this.error = 'Ungültiger oder abgelaufener Link.';
      return;
    }

    this.http.get(`${environment.apiUrl}/auth/confirm`, { params: { token }, responseType: 'text' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/login'], { queryParams: { confirmed: 'true' } }),
        error: (err) => {
          this.loading = false;
          this.error = err.error || 'Link ungültig oder abgelaufen. Bitte registriere dich erneut.';
        }
      });
  }
}
