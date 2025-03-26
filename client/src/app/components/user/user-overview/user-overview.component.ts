import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { DataView } from "primeng/dataview";
import { Router } from "@angular/router";
import { Card } from "primeng/card";
import { Message } from "primeng/message";
import { AuthService } from "src/app/services/auth.service";
import { UserService } from "src/app/services/user.service";
import { User } from "src/app/models/user.model";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ToggleSwitch } from "primeng/toggleswitch";

@Component({
  selector: 'app-tournament',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    DataView,
    Card,
    Message,
    FormsModule,
    ToggleSwitch,
    ReactiveFormsModule,
  ],
  templateUrl: './user-overview.component.html',
  styleUrl: './user-overview.component.scss'
})
export class UserOverviewComponent implements OnInit {
  users: any[] = [];
  isMobile: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.checkViewport();
    this.loadData();
  }

  loadData(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (error) => {
        console.error('Error loading users');
      },
      complete: () => {
        console.log('Users successfully loaded')
      }
    });
  }

  editUser(id: number) {
    this.router.navigate(['/user', id]);
  }

  deleteUser(id: number) {
    if (confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          alert('Benutzer erfolgreich gelöscht.');
          this.loadData();
        },
        error: (error) => {
          alert(error.message);
        }
      });
    }
  }

  toggleActive(user: User, newValue: boolean) {
    user.active = newValue;
    this.userService.updateUser(user).subscribe({
      next: () => {
        console.log(`User ${user.email} erfolgreich aktualisiert.`);
      },
      error: (err) => {
        console.error('Fehler beim Aktualisieren des Status', err);
      }
    });
  }

  checkViewport(): void {
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkViewport();
  }
}
