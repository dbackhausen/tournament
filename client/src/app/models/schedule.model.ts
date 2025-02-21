import {Tournament} from "./tournament.model";
import {Game} from "./game.model";

export interface Schedule {
  id: number,
  tournament: Tournament,
  date: Date,
  games: Game[]
}
