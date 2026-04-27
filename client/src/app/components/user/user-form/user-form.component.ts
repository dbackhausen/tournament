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
import { User } from "src/app/models/user.model";
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
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  userId!: number;
  user!: User;
  userForm!: FormGroup;
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
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadUser();
  }

  private initializeForm() {
    this.userForm = this.fb.group({
      gender: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: [''],
      strength: [null],
      active: [false]
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
        active: user.active
      });
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const updatedUser: User = {
        ...this.user,
        ...this.userForm.value
      };

      this.userService.updateUser(updatedUser).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.router.navigate(['/user']); //
      });
    }
  }
}
