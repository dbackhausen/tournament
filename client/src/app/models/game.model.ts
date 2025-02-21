import {Player} from "./player.model";
import {Tournament} from "./tournament.model";
import {Team} from "./team.model";

export interface Game {
  id: number,
  type: 'SINGLE' | 'DOUBLE' | 'MIXED',
  date: Date,
  tournament: Tournament,
  homeTeam: Team,
  awayTeam: Team,
  results: string[]
}

export interface SingleGame extends Game {
  firstPlayer: Player,
  secondPlayer: Player
}

export interface DoubleGame extends Game {
  firstPlayer: Player,
  secondPlayer: Player,
  thirdPlayer: Player,
  fourthPlayer: Player
}

export interface MixedGame extends Game {
  firstPlayer: Player,
  secondPlayer: Player,
  thirdPlayer: Player,
  fourthPlayer: Player
}
