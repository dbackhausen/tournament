import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { DataView } from "primeng/dataview";
import { Router, RouterLink } from "@angular/router";
import { Card } from "primeng/card";
import { Message } from "primeng/message";
import { AuthService } from "src/app/services/auth.service";
import { UserService } from "src/app/services/user.service";
import { User } from "src/app/models/user.model";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Dialog } from "primeng/dialog";
import {InputText} from "primeng/inputtext";

@Component({
  selector: 'app-tournament',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    DataView,
    RouterLink,
    Card,
    Message,
    FormsModule,
    ToggleSwitch,
    Dialog,
    ReactiveFormsModule,
    InputText
  ],
  templateUrl: './user-overview.component.html',
  styleUrl: './user-overview.component.scss'
})
export class UserOverviewComponent implements OnInit {
  users: any[] = [];
  isMobile: boolean = false;
  isAdmin: boolean = false;
  editDialogVisible = false;
  editForm!: FormGroup;
  selectedUser!: User;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    this.editForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['']
    // ggf. weitere Felder
  });}

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
    this.router.navigate([`/tournament/edit/${id}`])
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

  openEditDialog(user: User): void {
    this.selectedUser = { ...user }; // Kopie für Bearbeitung

    this.editForm.patchValue({
      firstName: this.selectedUser.firstName,
      lastName: this.selectedUser.lastName,
      email: this.selectedUser.email,
      mobile: this.selectedUser.mobile
    });
    this.editDialogVisible = true;

    console.log(this.selectedUser);
  }

  onSaveEdit(): void {
    if (this.editForm.valid) {
      const updatedUser = {
        ...this.selectedUser,
        ...this.editForm.value
      };

      this.userService.updateUser(updatedUser).subscribe({
        next: () => {
          console.log('Benutzer gespeichert');
          this.editDialogVisible = false;
          const index = this.users.findIndex(u => u.id === updatedUser.id);
          if (index > -1) {
            this.users[index] = updatedUser;
          }
        },
        error: (err) => {
          console.error('Fehler beim Speichern', err);
        }
      });
    }
  }

  checkViewport(): void {
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkViewport();
  }
}
