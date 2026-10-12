import { describe, expect, it } from "bun:test";
import { MockNBAProvider } from "../src/providers/mock.provider";
import { TeamRepository } from "../src/modules/teams/teams.repository";
import { TeamsService } from "../src/modules/teams/teams.service";
import { GameRepository } from "../src/modules/games/games.repository";
import { GamesService } from "../src/modules/games/games.service";
import { StandingsRepository } from "../src/modules/standings/standings.repository";
import { StandingsService } from "../src/modules/standings/standings.service";

describe("Application Services (Clean Architecture)", () => {
  const provider = new MockNBAProvider();
  const teamRepo = new TeamRepository();
  const gameRepo = new GameRepository();
  const standingsRepo = new StandingsRepository();

  it("TeamsService should retrieve and cache all teams", async () => {
    const teamsService = new TeamsService(teamRepo, provider);
    const teams = await teamsService.getAllTeams();

    expect(teams.length).toBeGreaterThan(0);
    const bos = await teamsService.getTeamById("team_bos");
    expect(bos?.fullName).toBe("Boston Celtics");
  });

  it("GamesService should return enriched games and compute team aggregates", async () => {
    const gamesService = new GamesService(gameRepo, teamRepo, provider);
    const liveGames = await gamesService.getLiveGames();

    expect(liveGames.length).toBeGreaterThan(0);
    expect(liveGames[0].homeTeam).toBeDefined();
    expect(liveGames[0].visitorTeam).toBeDefined();

    const stats = await gamesService.getGameStats(liveGames[0].id);
    expect(stats.teamComparison).toBeDefined();
    expect(stats.teamComparison.home.fgPct).toBeGreaterThan(0);
  });

  it("StandingsService should divide standings into East and West", async () => {
    const standingsService = new StandingsService(standingsRepo, teamRepo, provider);
    const standings = await standingsService.getStandings(2024);

    expect(standings.east.length).toBeGreaterThan(0);
    expect(standings.west.length).toBeGreaterThan(0);
    expect(standings.east[0].conference).toBe("East");
    expect(standings.west[0].conference).toBe("West");
  });
});
