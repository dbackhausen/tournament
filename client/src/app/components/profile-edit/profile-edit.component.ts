import {Component, OnInit} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlayerService } from "src/app/services/player.service";
import { AuthService } from "src/app/services/auth.service";
import { CardModule } from 'primeng/card';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { SelectItem } from "primeng/api";
import { Button, ButtonDirective } from "primeng/button";
import { DatePicker } from "primeng/datepicker";
import {Password} from "primeng/password";
import {Router} from "@angular/router";

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
    ButtonDirective,
    Button,
    Password
  ],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss'
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  genders: SelectItem[];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private playerService: PlayerService
  ) {
    this.profileForm = this.fb.group({
      gender: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
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
    const currentUser = this.authService.getUser();

    this.playerService.getPlayer(currentUser.id).subscribe({
      next: (data) => {
        console.log(JSON.stringify(data));
        this.profileForm.patchValue(data);
      },
      error: (error) => {
        console.error('Error loading profile');
      },
      complete: () => {
        console.log('Profile successfully loaded')
      }
    });
  }

  toggleEdit(name: string) {

  }

  onSubmit(): void {
    var currentUser = this.authService.getUser();

    if (this.profileForm.valid) {
      this.playerService.updatePlayer(currentUser.id, this.profileForm.value).subscribe({
          next: (response) => {
            console.log('Profile successfully updated', response);
          },
          error: (error) => {
            console.error('Error updating profile data', error);
          }
        }
      )
    } else {
      console.log('Invalid form');
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
