import {Component, OnInit} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlayerService } from "src/app/services/player.service";
import {AuthService} from "src/app/services/auth.service";

@Component({
    selector: 'app-profile-edit',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile-edit.component.html',
    styleUrl: './profile-edit.component.scss'
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private playerService: PlayerService
  ) {
    this.profileForm = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      gender: ['', Validators.required],
      birthdate: ['', Validators.required],
      mobile: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    var currentUser = this.authService.getUser();

    this.playerService.getPlayer(currentUser.id).subscribe({
      next: (data) => {
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
}
