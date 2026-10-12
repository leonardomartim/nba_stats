import type { Team } from "@nba-live/shared";
import type { ITeamRepository } from "./teams.repository";
import type { NBADataProvider } from "../../providers/nba-provider.interface";

export class TeamsService {
  constructor(
    private readonly teamRepo: ITeamRepository,
    private readonly provider: NBADataProvider
  ) {}

  public async getAllTeams(): Promise<Team[]> {
    let teams = await this.teamRepo.findAll();
    if (teams.length === 0) {
      teams = await this.provider.getTeams();
      for (const t of teams) {
        await this.teamRepo.upsert(t);
      }
    }
    return teams;
  }

  public async getTeamById(id: string): Promise<Team | null> {
    let team = await this.teamRepo.findById(id);
    if (!team) {
      team = await this.provider.getTeamById(id);
      if (team) {
        await this.teamRepo.upsert(team);
      }
    }
    return team;
  }
}
