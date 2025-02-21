export enum TournamentType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  MIXED = 'MIXED'
}

export class Tournament {
  id?: number;
  name: string;
  description?: string;
  additionalNotes?: string;
  startDate: Date;
  endDate: Date;
  selectedDays: Date[];
  tournamentTypes: TournamentType[];

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.additionalNotes = data.additionalNotes;
    this.startDate = new Date(data.startDate);
    this.endDate = new Date(data.endDate);
    this.selectedDays = data.selectedDays.map((day: string) => new Date(day));
    this.tournamentTypes = data.tournamentTypes;
  }
}
