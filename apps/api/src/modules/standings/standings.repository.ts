import type { TeamStanding } from "@nba-live/shared";
import { getDb, isDbConnected } from "../../infrastructure/db";
import * as schema from "../../infrastructure/db/schema";
import { eq, asc } from "drizzle-orm";
import { SEED_STANDINGS } from "../../infrastructure/db/seed-data";

export interface IStandingsRepository {
  findBySeason(season?: number): Promise<TeamStanding[]>;
  upsert(standing: TeamStanding): Promise<TeamStanding>;
}

export class StandingsRepository implements IStandingsRepository {
  private memoryCache: Map<string, TeamStanding> = new Map();

  constructor() {
    SEED_STANDINGS.forEach((s) => this.memoryCache.set(s.id, s));
  }

  public async findBySeason(season = 2024): Promise<TeamStanding[]> {
    if (isDbConnected()) {
      try {
        const db = getDb()!;
        const rows = await db
          .select()
          .from(schema.teamStandings)
          .where(eq(schema.teamStandings.season, season))
          .orderBy(asc(schema.teamStandings.conferenceRank));

        if (rows.length > 0) {
          return rows.map(this.mapRowToStanding);
        }
      } catch (err) {
        console.warn("[StandingsRepository] DB query failed, falling back to cache:", err);
      }
    }

    return Array.from(this.memoryCache.values()).filter((s) => s.season === season);
  }

  public async upsert(standing: TeamStanding): Promise<TeamStanding> {
    this.memoryCache.set(standing.id, standing);
    return standing;
  }

  private mapRowToStanding(row: any): TeamStanding {
    return {
      id: row.id,
      teamId: row.teamId,
      season: row.season,
      conference: row.conference,
      division: row.division,
      conferenceRank: row.conferenceRank,
      divisionRank: row.divisionRank,
      wins: row.wins,
      losses: row.losses,
      winPct: Number(row.winPct),
      gamesBehind: Number(row.gamesBehind),
      homeRecord: row.homeRecord,
      awayRecord: row.awayRecord,
      lastTen: row.lastTen,
      streak: row.streak,
      pointDifferential: Number(row.pointDifferential),
      updatedAt: row.updatedAt?.toISOString(),
    };
  }
}
