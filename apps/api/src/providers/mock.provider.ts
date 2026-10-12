import type { NBADataProvider, ProviderHealth } from "./nba-provider.interface";
import type {
  Team,
  Player,
  Game,
  TeamStanding,
  PlayerGameStats,
} from "@nba-live/shared";
import {
  SEED_TEAMS,
  SEED_PLAYERS,
  SEED_GAMES,
  SEED_PLAYER_STATS,
  SEED_STANDINGS,
} from "../infrastructure/db/seed-data";

export class MockNBAProvider implements NBADataProvider {
  public readonly name = "mock";
  public readonly isMock = true;

  // In-memory state of games that progress over time
  private gamesState: Game[];
  private lastTick: number = Date.now();

  constructor() {
    // Deep clone initial games
    this.gamesState = JSON.parse(JSON.stringify(SEED_GAMES));
    this.enrichGamesWithTeams();
  }

  private enrichGamesWithTeams() {
    const teamsMap = new Map(SEED_TEAMS.map((t) => [t.id, t]));
    this.gamesState.forEach((g) => {
      g.homeTeam = teamsMap.get(g.homeTeamId);
      g.visitorTeam = teamsMap.get(g.visitorTeamId);
    });
  }

  public async getHealth(): Promise<ProviderHealth> {
    return {
      name: "MockNBAProvider (Development & Test Demo)",
      isAvailable: true,
      rateLimitRemaining: 9999,
      rateLimitReset: 0,
      lastChecked: new Date().toISOString(),
    };
  }

  public async getTeams(): Promise<Team[]> {
    return SEED_TEAMS;
  }

  public async getTeamById(id: string | number): Promise<Team | null> {
    const strId = String(id);
    return (
      SEED_TEAMS.find((t) => t.id === strId || t.externalId === Number(id) || t.abbreviation.toLowerCase() === strId.toLowerCase()) || null
    );
  }

  public async getPlayers(
    search?: string,
    teamId?: string,
    page = 1,
    limit = 20
  ): Promise<{ players: Player[]; total: number }> {
    let result = [...SEED_PLAYERS];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.fullName.toLowerCase().includes(q));
    }
    if (teamId) {
      result = result.filter((p) => p.teamId === teamId);
    }
    const start = (page - 1) * limit;
    return {
      players: result.slice(start, start + limit),
      total: result.length,
    };
  }

  public async getPlayerById(id: string | number): Promise<Player | null> {
    const strId = String(id);
    return SEED_PLAYERS.find((p) => p.id === strId || p.externalId === Number(id)) || null;
  }

  public async getGames(date?: string, season?: number, status?: string): Promise<Game[]> {
    this.tickSimulation();
    let res = [...this.gamesState];
    if (date) {
      res = res.filter((g) => g.date === date);
    }
    if (season) {
      res = res.filter((g) => g.season === season);
    }
    if (status) {
      res = res.filter((g) => g.status === status);
    }
    return res;
  }

  public async getLiveGames(): Promise<Game[]> {
    this.tickSimulation();
    return this.gamesState.filter((g) => g.isLive);
  }

  public async getGameById(id: string | number): Promise<Game | null> {
    this.tickSimulation();
    const strId = String(id);
    return this.gamesState.find((g) => g.id === strId || g.externalId === Number(id)) || null;
  }

  public async getGameStats(gameId: string | number): Promise<PlayerGameStats[]> {
    const strId = String(gameId);
    const stats = SEED_PLAYER_STATS.filter((s) => s.gameId === strId);
    const playerMap = new Map(SEED_PLAYERS.map((p) => [p.id, p]));
    const teamMap = new Map(SEED_TEAMS.map((t) => [t.id, t]));

    return stats.map((s) => ({
      ...s,
      player: playerMap.get(s.playerId),
      team: teamMap.get(s.teamId),
    }));
  }

  public async getStandings(_season?: number): Promise<TeamStanding[]> {
    const teamMap = new Map(SEED_TEAMS.map((t) => [t.id, t]));
    return SEED_STANDINGS.map((st) => ({
      ...st,
      team: teamMap.get(st.teamId),
    }));
  }

  /**
   * Advances the simulation clock and scores for in-progress games
   * to provide realistic, exciting real-time SSE broadcasts.
   */
  public tickSimulation(): void {
    const now = Date.now();
    // Only tick at most once every 3 seconds
    if (now - this.lastTick < 3000) return;
    this.lastTick = now;

    for (const game of this.gamesState) {
      if (!game.isLive) continue;

      // 70% chance of a score update on tick
      if (Math.random() < 0.7) {
        const isHomeScoring = Math.random() > 0.48;
        const pts = Math.random() < 0.35 ? 3 : 2; // 2-pointer or 3-pointer

        if (isHomeScoring) {
          game.homeTeamScore += pts;
          if (game.scores) {
            const currentPeriodKey = (`q${Math.min(game.period, 4)}` as "q1" | "q2" | "q3" | "q4");
            game.scores.home[currentPeriodKey] += pts;
          }
        } else {
          game.visitorTeamScore += pts;
          if (game.scores) {
            const currentPeriodKey = (`q${Math.min(game.period, 4)}` as "q1" | "q2" | "q3" | "q4");
            game.scores.visitor[currentPeriodKey] += pts;
          }
        }

        // Decrement game clock
        if (game.clock) {
          const parts = game.clock.split(":");
          let min = parseInt(parts[0], 10);
          let sec = parseInt(parts[1], 10);

          sec -= Math.floor(Math.random() * 12) + 8;
          if (sec < 0) {
            min -= 1;
            sec += 60;
          }

          if (min < 0) {
            // Period ended!
            if (game.period >= 4) {
              game.status = "FINISHED";
              game.statusDetail = "Final";
              game.isLive = false;
              game.clock = "00:00";
            } else {
              game.period += 1;
              game.clock = "12:00";
              game.statusDetail = `Q${game.period} 12:00`;
            }
          } else {
            game.clock = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
            game.statusDetail = `Q${game.period} ${game.clock}`;
          }
        }
      }
    }
  }

  /**
   * Helper to manually trigger score bump for demonstration
   */
  public triggerManualScoreUpdate(gameId: string, team: "home" | "visitor", points: number): Game | null {
    const game = this.gamesState.find((g) => g.id === gameId);
    if (!game) return null;

    if (team === "home") {
      game.homeTeamScore += points;
      if (game.scores) game.scores.home.q4 += points;
    } else {
      game.visitorTeamScore += points;
      if (game.scores) game.scores.visitor.q4 += points;
    }
    return game;
  }
}
