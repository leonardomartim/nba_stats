import { describe, expect, it } from "bun:test";
import { MockNBAProvider } from "../src/providers/mock.provider";
import { BallDontLieProvider } from "../src/providers/balldontlie.provider";

describe("NBA Data Providers", () => {
  it("MockNBAProvider should return teams and valid health check", async () => {
    const provider = new MockNBAProvider();
    const health = await provider.getHealth();

    expect(health.isAvailable).toBe(true);
    expect(provider.isMock).toBe(true);

    const teams = await provider.getTeams();
    expect(teams.length).toBeGreaterThan(0);
    expect(teams[0]).toHaveProperty("fullName");
    expect(teams[0]).toHaveProperty("conference");
  });

  it("MockNBAProvider should return live games and advance scores", async () => {
    const provider = new MockNBAProvider();
    const liveGames = await provider.getLiveGames();

    expect(Array.isArray(liveGames)).toBe(true);
    expect(liveGames.length).toBeGreaterThan(0);
    expect(liveGames[0].isLive).toBe(true);

    const initialScore = liveGames[0].homeTeamScore;
    provider.triggerManualScoreUpdate(liveGames[0].id, "home", 3);
    const updated = await provider.getGameById(liveGames[0].id);

    expect(updated?.homeTeamScore).toBe(initialScore + 3);
  });

  it("BallDontLieProvider should identify as not mock and handle missing API key cleanly", async () => {
    const provider = new BallDontLieProvider("");
    expect(provider.isMock).toBe(false);
    expect(provider.name).toBe("balldontlie");

    const health = await provider.getHealth();
    expect(health.name).toBe("balldontlie");
  });
});
