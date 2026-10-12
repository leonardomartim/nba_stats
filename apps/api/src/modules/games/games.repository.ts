import type { Game, PlayerGameStats, GameScoreBreakdown } from "@nba-live/shared";
import { getDb, isDbConnected } from "../../infrastructure/db";
import * as schema from "../../infrastructure/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { SEED_GAMES, SEED_PLAYER_STATS } from "../../infrastructure/db/seed-data";

export interface IGameRepository {
  findMany(filters?: {
    date?: string;
    season?: number;
    status?: string;
    teamId?: string;
    isLive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ games: Game[]; total: number }>;
  findLive(): Promise<Game[]>;
  findById(id: string): Promise<Game | null>;
  findStatsByGameId(gameId: string): Promise<PlayerGameStats[]>;
  upsertGame(game: Game): Promise<Game>;
  upsertScore(gameId: string, scores: GameScoreBreakdown): Promise<void>;
  upsertPlayerStats(stats: PlayerGameStats[]): Promise<void>;
}

export class GameRepository implements IGameRepository {
  private memoryGames: Map<string, Game> = new Map();
  private memoryStats: Map<string, PlayerGameStats[]> = new Map();

  constructor() {
    SEED_GAMES.forEach((g) => this.memoryGames.set(g.id, JSON.parse(JSON.stringify(g))));
    
    // Group seed player stats by gameId
    SEED_PLAYER_STATS.forEach((s) => {
      const list = this.memoryStats.get(s.gameId) || [];
      list.push(s);
      this.memoryStats.set(s.gameId, list);
    });
  }

  public async findMany(filters: {
    date?: string;
    season?: number;
    status?: string;
    teamId?: string;
    isLive?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ games: Game[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    let items = Array.from(this.memoryGames.values());

    if (filters.date) {
      items = items.filter((g) => g.date === filters.date);
    }
    if (filters.season) {
      items = items.filter((g) => g.season === filters.season);
    }
    if (filters.status) {
      items = items.filter((g) => g.status === filters.status);
    }
    if (filters.isLive !== undefined) {
      items = items.filter((g) => g.isLive === filters.isLive);
    }
    if (filters.teamId) {
      items = items.filter(
        (g) => g.homeTeamId === filters.teamId || g.visitorTeamId === filters.teamId
      );
    }

    const total = items.length;
    const start = (page - 1) * limit;

    return {
      games: items.slice(start, start + limit),
      total,
    };
  }

  public async findLive(): Promise<Game[]> {
    return Array.from(this.memoryGames.values()).filter((g) => g.isLive);
  }

  public async findById(id: string): Promise<Game | null> {
    return this.memoryGames.get(id) || null;
  }

  public async findStatsByGameId(gameId: string): Promise<PlayerGameStats[]> {
    return this.memoryStats.get(gameId) || [];
  }

  public async upsertGame(game: Game): Promise<Game> {
    this.memoryGames.set(game.id, game);

    if (isDbConnected()) {
      try {
        const db = getDb()!;
        await db
          .insert(schema.games)
          .values({
            id: game.id,
            externalId: game.externalId,
            date: game.date,
            season: game.season,
            status: game.status,
            statusDetail: game.statusDetail,
            period: game.period,
            clock: game.clock,
            homeTeamId: game.homeTeamId,
            homeTeamScore: game.homeTeamScore,
            visitorTeamId: game.visitorTeamId,
            visitorTeamScore: game.visitorTeamScore,
            arena: game.arena,
            city: game.city,
            isLive: game.isLive,
          })
          .onConflictDoUpdate({
            target: schema.games.id,
            set: {
              homeTeamScore: game.homeTeamScore,
              visitorTeamScore: game.visitorTeamScore,
              status: game.status,
              statusDetail: game.statusDetail,
              period: game.period,
              clock: game.clock,
              isLive: game.isLive,
              lastSyncedAt: new Date(),
            },
          });
      } catch (err) {
        console.warn(`[GameRepository] DB upsert failed for game ${game.id}:`, err);
      }
    }

    return game;
  }

  public async upsertScore(gameId: string, scores: GameScoreBreakdown): Promise<void> {
    const game = this.memoryGames.get(gameId);
    if (game) {
      game.scores = scores;
    }
  }

  public async upsertPlayerStats(stats: PlayerGameStats[]): Promise<void> {
    if (stats.length === 0) return;
    const gameId = stats[0].gameId;
    this.memoryStats.set(gameId, stats);
  }
}
