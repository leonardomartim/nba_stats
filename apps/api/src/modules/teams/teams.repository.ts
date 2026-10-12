import type { Team } from "@nba-live/shared";
import { getDb, isDbConnected } from "../../infrastructure/db";
import * as schema from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { SEED_TEAMS } from "../../infrastructure/db/seed-data";

export interface ITeamRepository {
  findAll(): Promise<Team[]>;
  findById(id: string): Promise<Team | null>;
  upsert(team: Team): Promise<Team>;
}

export class TeamRepository implements ITeamRepository {
  private memoryCache: Map<string, Team> = new Map();

  constructor() {
    // Initialize in-memory fallback cache with seed teams
    SEED_TEAMS.forEach((t) => this.memoryCache.set(t.id, t));
  }

  public async findAll(): Promise<Team[]> {
    if (isDbConnected()) {
      const db = getDb()!;
      const rows = await db.select().from(schema.teams);
      if (rows.length > 0) {
        return rows.map(this.mapRowToTeam);
      }
    }
    return Array.from(this.memoryCache.values());
  }

  public async findById(id: string): Promise<Team | null> {
    if (isDbConnected()) {
      const db = getDb()!;
      const rows = await db.select().from(schema.teams).where(eq(schema.teams.id, id));
      if (rows.length > 0) {
        return this.mapRowToTeam(rows[0]);
      }
    }
    return this.memoryCache.get(id) || null;
  }

  public async upsert(team: Team): Promise<Team> {
    this.memoryCache.set(team.id, team);

    if (isDbConnected()) {
      const db = getDb()!;
      await db
        .insert(schema.teams)
        .values({
          id: team.id,
          externalId: team.externalId,
          name: team.name,
          city: team.city,
          fullName: team.fullName,
          abbreviation: team.abbreviation,
          conference: team.conference,
          division: team.division,
          logoUrl: team.logoUrl,
          primaryColor: team.primaryColor,
          secondaryColor: team.secondaryColor,
        })
        .onConflictDoUpdate({
          target: schema.teams.id,
          set: {
            fullName: team.fullName,
            logoUrl: team.logoUrl,
            primaryColor: team.primaryColor,
          },
        });
    }

    return team;
  }

  private mapRowToTeam(row: any): Team {
    return {
      id: row.id,
      externalId: row.externalId,
      name: row.name,
      city: row.city,
      fullName: row.fullName,
      abbreviation: row.abbreviation,
      conference: row.conference,
      division: row.division,
      logoUrl: row.logoUrl,
      primaryColor: row.primaryColor,
      secondaryColor: row.secondaryColor,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
    };
  }
}
