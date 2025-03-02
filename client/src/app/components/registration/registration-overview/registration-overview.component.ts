import { Component, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { TournamentService } from "src/app/services/tournament.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Registration } from "src/app/models/tournament.model";
import {DataView} from "primeng/dataview";
import {TableModule} from "primeng/table";

@Component({
  selector: 'app-registration-overview',
  standalone: true,
  imports: [
    CommonModule,
    Card,
    Button,
    DataView,
    TableModule
  ],
  templateUrl: './registration-overview.component.html',
  styleUrl: './registration-overview.component.scss'
})
export class RegistrationOverviewComponent implements OnInit {
  tournamentId: number | null = null;
  protected registrations: Registration[] = [];

  constructor(
    private tournamentService: TournamentService,
    private route: ActivatedRoute,
  ) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.tournamentId = +id;
        this.loadData(this.tournamentId);
      }
    });
  }

  loadData(id: number): void {
    this.tournamentService.getRegistrations(id).subscribe({
      next: (data) => {
        this.registrations = data;
      },
      error: (error) => {
        console.error('Error loading registrations');
      },
      complete: () => {
        console.log('Registrations successfully loaded')
      }
    });
  }
}
