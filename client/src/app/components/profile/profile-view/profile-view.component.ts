import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from "primeng/card";
import { Location } from '@angular/common';
import { UserService } from "src/app/services/user.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Button } from "primeng/button";
import {User} from "src/app/models/user.model"; //

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, Card, Button],
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.scss']
})
export class ProfileViewComponent implements OnInit {
  protected userId: number | undefined;
  protected user: User | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private userService: UserService,
  ) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.userId = +id;
        this.loadData(this.userId);
      } else {
        this.router.navigate([`/tournament`])
      }
    });
  }

  loadData(id: number): void {
    this.userService.getUser(id).subscribe({
      next: (data) => {
        this.user = data;
      },
      error: (error) => {
        console.error('Error loading profile');
      },
      complete: () => {
        console.log('Profile successfully loaded')
      }
    });
  }

  goBack() {
    this.location.back(); // Zurück zur vorherigen Seite
  }
}
