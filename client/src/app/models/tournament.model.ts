import { User } from "src/app/models/user.model";

export enum TournamentType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  MIXED = 'MIXED'
}

export interface TournamentDay {
  date: string;
  time1: string | null;
  time2: string | null;
  time3: string | null;
}

export interface ParticipationRequest {
  date: string;
  time: string;
}

export interface Registration {
  id: number
  tournament: Tournament;
  user: User;
  notes?: string;
  payed: boolean;
  selectedDays: ParticipationRequest[];
  selectedTypes: TournamentType[];
}

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  additionalNotes?: string;
  entryFee: number;
  startDate: Date;
  endDate: Date;
  deadline: Date;
  tournamentDays: TournamentDay[];
  tournamentTypes: TournamentType[];
  registrationCount: number;
}
