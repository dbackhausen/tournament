import { Component, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { DataView } from "primeng/dataview";
import { Card } from "primeng/card";
import { Message } from "primeng/message";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ToggleSwitch } from "primeng/toggleswitch";
import { User } from "src/app/models/user.model";
import { ActivatedRoute, Router } from "@angular/router";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: 'app-user-form',
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
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  userId!: number;
  user!: User;
  userForm!: FormGroup;

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
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: [''],
      active: [false]
    });
  }

  loadUser(): void {
    this.userService.getUser(this.userId).subscribe(user => {
      this.user = user;
      this.userForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
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

      this.userService.updateUser(updatedUser).subscribe(() => {
        this.router.navigate(['/user']); //
      });
    }
  }
}
