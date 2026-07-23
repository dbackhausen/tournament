import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AuthService } from "src/app/services/auth.service";
import { DashboardService } from "src/app/services/dashboard.service";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { Textarea } from "primeng/textarea";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    Card,
    Button,
    Textarea,
    FormsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  username: string = '';
  message: string = '';
  editedMessage: string = '';
  isAdmin: boolean = false;
  isEditing: boolean = false;
  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    const user = this.authService.getUser();
    if (user) {
      this.username = user.firstName;
    }
    this.isAdmin = this.authService.isAdmin();

    this.dashboardService.getMessage().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.message = data.message;
      },
      error: (error) => {
        console.error('Error loading dashboard message', error);
      }
    });
  }

  onEdit(): void {
    this.editedMessage = this.message;
    this.isEditing = true;
  }

  onCancel(): void {
    this.isEditing = false;
  }

  onSave(): void {
    this.dashboardService.updateMessage(this.editedMessage).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.message = data.message;
        this.isEditing = false;
      },
      error: (error) => {
        alert(error.error?.message ?? 'Die Nachricht konnte nicht gespeichert werden.');
      }
    });
  }
}
