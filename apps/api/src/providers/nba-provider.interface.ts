import type {
  Team,
  Player,
  Game,
  TeamStanding,
  PlayerGameStats,
} from "@nba-live/shared";

export interface ProviderHealth {
  name: string;
  isAvailable: boolean;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
  lastChecked: string;
  errorMessage?: string;
}

export interface NBADataProvider {
  readonly name: string;
  readonly isMock: boolean;

  getHealth(): Promise<ProviderHealth>;
  getTeams(): Promise<Team[]>;
  getTeamById(id: string | number): Promise<Team | null>;
  getPlayers(search?: string, teamId?: string, page?: number, limit?: number): Promise<{ players: Player[]; total: number }>;
  getPlayerById(id: string | number): Promise<Player | null>;
  getGames(date?: string, season?: number, status?: string): Promise<Game[]>;
  getLiveGames(): Promise<Game[]>;
  getGameById(id: string | number): Promise<Game | null>;
  getGameStats(gameId: string | number): Promise<PlayerGameStats[]>;
  getStandings(season?: number): Promise<TeamStanding[]>;
}
