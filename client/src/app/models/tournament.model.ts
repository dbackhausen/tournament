import { User } from "src/app/models/user.model";

export enum TournamentType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  MIXED = 'MIXED'
}

export interface TournamentDay {
  date: string;
  startTime: string;
  endTime: string;
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
  selectedDays: ParticipationRequest[];
  selectedTypes: TournamentType[];
}

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  additionalNotes?: string;
  startDate: Date;
  endDate: Date;
  deadline: Date;
  tournamentDays: TournamentDay[];
  tournamentTypes: TournamentType[];
  registrationCount: number;
}
