import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { InputText } from "primeng/inputtext";
import { InputNumber } from "primeng/inputnumber";
import { FloatLabel } from "primeng/floatlabel";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Select } from "primeng/select";
import { SelectItem } from "primeng/api";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { PasswordModule } from "primeng/password";
import { User } from "src/app/models/user.model";
import { Role } from "src/app/models/role.model";
import { ActivatedRoute, Router } from "@angular/router";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Card,
    Button,
    InputText,
    InputNumber,
    FloatLabel,
    ToggleSwitch,
    Select,
    PasswordModule,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  userId!: number;
  user!: User;
  userForm!: FormGroup;
  isNew = false;
  genders: SelectItem[] = [
    { label: 'Herr', value: 'MALE' },
    { label: 'Frau', value: 'FEMALE' }
  ];
  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private fb: FormBuilder,
    protected router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isNew = !idParam;

    if (this.isNew) {
      this.userForm.get('newPassword')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.userForm.get('active')?.setValue(true);
    } else {
      this.userId = Number(idParam);
      this.loadUser();
    }
    this.userForm.get('newPassword')?.updateValueAndValidity();
  }

  private initializeForm() {
    this.userForm = this.fb.group({
      gender: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: [''],
      strength: [null],
      active: [false],
      admin: [false],
      newPassword: ['', Validators.minLength(8)]
    });
  }

  loadUser(): void {
    this.userService.getUser(this.userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      this.user = user;
      this.userForm.patchValue({
        gender: user.gender,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        strength: user.strength ?? null,
        active: user.active,
        admin: user.roles.includes('ADMIN')
      });
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    const { admin, newPassword, ...formValue } = this.userForm.value;

    if (this.isNew) {
      const roles: Role[] = admin ? ['PLAYER', 'ADMIN'] : ['PLAYER'];
      const newUser = { ...formValue, roles, password: newPassword };

      this.userService.createUser(newUser).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.router.navigate(['/user']);
        },
        error: (error) => {
          alert(error.error?.error ?? 'Der Benutzer konnte nicht angelegt werden.');
        }
      });
    } else {
      const roles = [...this.user.roles];
      const adminIndex = roles.indexOf('ADMIN');
      if (admin) {
        if (adminIndex === -1) roles.push('ADMIN');
      } else {
        if (adminIndex > -1) roles.splice(adminIndex, 1);
      }

      const updatedUser: User = {
        ...this.user,
        ...formValue,
        roles
      };

      this.userService.updateUser(updatedUser).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        if (newPassword) {
          this.userService.setPassword(this.userId, newPassword).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => this.router.navigate(['/user']),
            error: (error) => alert(error.error?.error ?? 'Das Passwort konnte nicht gesetzt werden.')
          });
        } else {
          this.router.navigate(['/user']);
        }
      });
    }
  }

  onDelete(): void {
    if (confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
      this.userService.deleteUser(this.userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          alert('Benutzer erfolgreich gelöscht.');
          this.router.navigate(['/user']);
        },
        error: (error) => {
          alert(error.message);
        }
      });
    }
  }
}
