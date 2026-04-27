import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { UserService } from "src/app/services/user.service";
import { AuthService } from "src/app/services/auth.service";
import { CardModule } from 'primeng/card';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { SelectItem } from "primeng/api";
import { Button } from "primeng/button";
import { DatePicker } from "primeng/datepicker";
import { Router } from "@angular/router";
import { Message } from "primeng/message";
import { User } from "src/app/models/user.model";

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    FloatLabel,
    InputText,
    Select,
    DatePicker,
    Button,
    Message
  ],
  templateUrl: './profile-form.component.html',
  styleUrl: './profile-form.component.scss',
  providers: [DatePipe]
})
export class ProfileFormComponent implements OnInit {
  profileForm: FormGroup;
  genders: SelectItem[];
  message = '';
  severity = 'success';
  profileImageUrl: string | null = null;
  pendingImageFile: File | null = null;
  pendingImagePreview: string | null = null;
  private currentUser: User | null = null;
  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private datePipe: DatePipe
  ) {
    this.profileForm = this.fb.group({
      gender: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      mobile: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      birthdate: ['', Validators.required]
    });

    this.genders = [];
    this.genders.push({ label: 'Herr', value: 'MALE' });
    this.genders.push({ label: 'Frau', value: 'FEMALE' });
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    this.currentUser = this.authService.getUser();

    if (this.currentUser) {
      this.profileImageUrl = this.userService.getProfileImageUrl(this.currentUser.id) + '?t=' + Date.now();

      this.userService.getUser(this.currentUser.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => {
          this.profileForm.patchValue(data);
        },
        error: (error) => {
          console.error('Error loading profile');
        }
      });
    }
  }

  get avatarInitials(): string {
    const first = this.profileForm.value.firstName || this.currentUser?.firstName || '';
    const last = this.profileForm.value.lastName || this.currentUser?.lastName || '';
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;

    this.pendingImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.pendingImagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  triggerImageInput(): void {
    document.getElementById('profileImageInput')?.click();
  }

  onSubmit(): void {
    this.message = '';

    if (!this.profileForm.valid || !this.currentUser) {
      this.message = 'Ungültige bzw. fehlende Angaben.';
      return;
    }

    let birthdate: string | null = null;
    if (this.profileForm.value.birthdate) {
      const birthdateObj = new Date(this.profileForm.value.birthdate);
      birthdate = this.datePipe.transform(birthdateObj, 'yyyy-MM-dd') || null;
    }

    const userData: User = {
      id: this.currentUser.id,
      gender: this.profileForm.value.gender,
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      email: this.profileForm.value.email,
      mobile: this.profileForm.value.mobile,
      birthdate: birthdate,
      roles: this.currentUser.roles,
      performanceClass: this.currentUser.performanceClass,
      active: this.currentUser.active
    };

    this.userService.updateUser(userData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.pendingImageFile && this.currentUser) {
          this.userService.uploadProfileImage(this.currentUser.id, this.pendingImageFile)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.pendingImageFile = null;
                this.profileImageUrl = this.userService.getProfileImageUrl(this.currentUser!.id) + '?t=' + Date.now();
                this.message = 'Profil erfolgreich aktualisiert.';
                this.severity = 'success';
              },
              error: () => {
                this.message = 'Profil gespeichert, aber Bild konnte nicht hochgeladen werden.';
                this.severity = 'warn';
              }
            });
        } else {
          this.message = 'Profil erfolgreich aktualisiert.';
          this.severity = 'success';
        }
      },
      error: () => {
        this.message = 'Fehler beim Speichern des Profils.';
        this.severity = 'error';
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
