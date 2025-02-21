import {Component, OnDestroy, OnInit} from '@angular/core';
import {TournamentService} from "../services/tournament.service";
import {GameService} from "../services/game.service";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {

  games: any[] = [];

  constructor(
    private gameService: GameService
) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.gameService.getGames()
      .pipe()
      .subscribe((data) => {
        console.log(JSON.stringify(data));
        this.games = data;
      });
  }


  ngOnDestroy(): void {
  }
}
