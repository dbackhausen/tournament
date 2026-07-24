export interface Match {
  id: number | null;
  date: Date | null;
  time: Date | null;
  court: number | null;
  mode: string | null;
  teamA: string | null;
  teamAPlayer1: string | null;
  teamAPlayer2: string | null;
  teamB: string | null;
  teamBPlayer1: string | null;
  teamBPlayer2: string | null;
  result: string | null;
  status: string | null;
}

export function createEmptyMatch(): Match {
  return {
    id: null,
    date: null,
    time: null,
    court: null,
    mode: null,
    teamA: null,
    teamAPlayer1: null,
    teamAPlayer2: null,
    teamB: null,
    teamBPlayer1: null,
    teamBPlayer2: null,
    result: null,
    status: null
  };
}
