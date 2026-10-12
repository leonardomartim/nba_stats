import type { TeamStanding } from "@nba-live/shared";
import type { IStandingsRepository } from "./standings.repository";
import type { ITeamRepository } from "../teams/teams.repository";
import type { NBADataProvider } from "../../providers/nba-provider.interface";

export class StandingsService {
  constructor(
    private readonly standingsRepo: IStandingsRepository,
    private readonly teamRepo: ITeamRepository,
    private readonly provider: NBADataProvider
  ) {}

  public async getStandings(season = 2024, conference?: string): Promise<{
    east: TeamStanding[];
    west: TeamStanding[];
  }> {
    let standings = await this.standingsRepo.findBySeason(season);

    if (standings.length === 0) {
      standings = await this.provider.getStandings(season);
      for (const s of standings) {
        await this.standingsRepo.upsert(s);
      }
    }

    const teams = await this.teamRepo.findAll();
    const teamMap = new Map(teams.map((t) => [t.id, t]));

    const enriched = standings.map((s) => ({
      ...s,
      team: teamMap.get(s.teamId),
    }));

    const east = enriched
      .filter((s) => s.conference === "East")
      .sort((a, b) => a.conferenceRank - b.conferenceRank);

    const west = enriched
      .filter((s) => s.conference === "West")
      .sort((a, b) => a.conferenceRank - b.conferenceRank);

    if (conference === "East") return { east, west: [] };
    if (conference === "West") return { east: [], west };

    return { east, west };
  }
}
