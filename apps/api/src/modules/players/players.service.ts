import type { Player } from "@nba-live/shared";
import type { IPlayerRepository } from "./players.repository";
import type { ITeamRepository } from "../teams/teams.repository";
import type { NBADataProvider } from "../../providers/nba-provider.interface";

export class PlayersService {
  constructor(
    private readonly playerRepo: IPlayerRepository,
    private readonly teamRepo: ITeamRepository,
    private readonly provider: NBADataProvider
  ) {}

  public async getPlayers(
    search?: string,
    teamId?: string,
    page = 1,
    limit = 20
  ): Promise<{ players: Player[]; total: number; totalPages: number }> {
    let result = await this.playerRepo.findMany(search, teamId, page, limit);

    if (result.players.length === 0 && !search && !teamId) {
      const externalRes = await this.provider.getPlayers(search, teamId, page, limit);
      for (const p of externalRes.players) {
        await this.playerRepo.upsert(p);
      }
      result = await this.playerRepo.findMany(search, teamId, page, limit);
    }

    // Attach team object to each player
    const teams = await this.teamRepo.findAll();
    const teamMap = new Map(teams.map((t) => [t.id, t]));

    const enriched = result.players.map((p) => ({
      ...p,
      team: p.teamId ? teamMap.get(p.teamId) : undefined,
    }));

    return {
      players: enriched,
      total: result.total,
      totalPages: Math.ceil(result.total / limit) || 1,
    };
  }

  public async getPlayerById(id: string): Promise<Player | null> {
    let player = await this.playerRepo.findById(id);
    if (!player) {
      player = await this.provider.getPlayerById(id);
      if (player) {
        await this.playerRepo.upsert(player);
      }
    }

    if (player && player.teamId) {
      const team = await this.teamRepo.findById(player.teamId);
      if (team) {
        player = { ...player, team };
      }
    }

    return player;
  }
}
