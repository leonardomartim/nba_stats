import type { Player } from "@nba-live/shared";
import { getDb, isDbConnected } from "../../infrastructure/db";
import * as schema from "../../infrastructure/db/schema";
import { eq, ilike } from "drizzle-orm";
import { SEED_PLAYERS } from "../../infrastructure/db/seed-data";

export interface IPlayerRepository {
  findMany(search?: string, teamId?: string, page?: number, limit?: number): Promise<{ players: Player[]; total: number }>;
  findById(id: string): Promise<Player | null>;
  upsert(player: Player): Promise<Player>;
}

export class PlayerRepository implements IPlayerRepository {
  private memoryCache: Map<string, Player> = new Map();

  constructor() {
    SEED_PLAYERS.forEach((p) => this.memoryCache.set(p.id, p));
  }

  public async findMany(
    search?: string,
    teamId?: string,
    page = 1,
    limit = 20
  ): Promise<{ players: Player[]; total: number }> {
    if (isDbConnected()) {
      const db = getDb()!;
      let query = db.select().from(schema.players);

      // Simple db filtering
      const rows = await query;
      let mapped = rows.map(this.mapRowToPlayer);

      if (search) {
        const q = search.toLowerCase();
        mapped = mapped.filter((p) => p.fullName.toLowerCase().includes(q));
      }
      if (teamId) {
        mapped = mapped.filter((p) => p.teamId === teamId);
      }

      const total = mapped.length;
      const start = (page - 1) * limit;
      return {
        players: mapped.slice(start, start + limit),
        total,
      };
    }

    let items = Array.from(this.memoryCache.values());
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((p) => p.fullName.toLowerCase().includes(q));
    }
    if (teamId) {
      items = items.filter((p) => p.teamId === teamId);
    }

    const total = items.length;
    const start = (page - 1) * limit;
    return {
      players: items.slice(start, start + limit),
      total,
    };
  }

  public async findById(id: string): Promise<Player | null> {
    if (isDbConnected()) {
      const db = getDb()!;
      const rows = await db.select().from(schema.players).where(eq(schema.players.id, id));
      if (rows.length > 0) {
        return this.mapRowToPlayer(rows[0]);
      }
    }
    return this.memoryCache.get(id) || null;
  }

  public async upsert(player: Player): Promise<Player> {
    this.memoryCache.set(player.id, player);

    if (isDbConnected()) {
      const db = getDb()!;
      await db
        .insert(schema.players)
        .values({
          id: player.id,
          externalId: player.externalId,
          firstName: player.firstName,
          lastName: player.lastName,
          fullName: player.fullName,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          height: player.height,
          weight: player.weight,
          teamId: player.teamId,
          avatarUrl: player.avatarUrl,
          college: player.college,
          country: player.country,
        })
        .onConflictDoUpdate({
          target: schema.players.id,
          set: {
            position: player.position,
            jerseyNumber: player.jerseyNumber,
            avatarUrl: player.avatarUrl,
          },
        });
    }

    return player;
  }

  private mapRowToPlayer(row: any): Player {
    return {
      id: row.id,
      externalId: row.externalId,
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: row.fullName,
      position: row.position,
      jerseyNumber: row.jerseyNumber,
      height: row.height,
      weight: row.weight,
      teamId: row.teamId,
      avatarUrl: row.avatarUrl,
      college: row.college,
      country: row.country,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
    };
  }
}
