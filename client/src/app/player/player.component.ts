import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlayerService } from "../services/player.service";

@Component({
  selector: 'app-players',
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss'
})
export class PlayerComponent implements OnInit, OnDestroy {

  players: any[] = [];
  constructor(
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
   this.playerService.getPlayers()
     .pipe()
     .subscribe((data) => {
       console.log(JSON.stringify(data));
       this.players = data;
     });
  }


  ngOnDestroy(): void {
  }
}
