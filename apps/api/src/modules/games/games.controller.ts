import type { Context } from "hono";
import type { GamesService } from "./games.service";
import { SSEHub } from "../../infrastructure/sse/sse-hub";

export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  public getGames = async (c: Context) => {
    const date = c.req.query("date");
    const season = c.req.query("season") ? parseInt(c.req.query("season")!, 10) : undefined;
    const status = c.req.query("status");
    const teamId = c.req.query("teamId");
    const isLive = c.req.query("isLive") !== undefined ? c.req.query("isLive") === "true" : undefined;
    const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20", 10)));

    const result = await this.gamesService.getGames({
      date,
      season,
      status,
      teamId,
      isLive,
      page,
      limit,
    });

    return c.json({
      success: true,
      data: result.games,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  };

  public getLiveGames = async (c: Context) => {
    const games = await this.gamesService.getLiveGames();

    return c.json({
      success: true,
      data: games,
      meta: {
        total: games.length,
        isLiveStreamAvailable: true,
        streamUrl: "/api/v1/events/games",
      },
    });
  };

  public getGameById = async (c: Context) => {
    const id = c.req.param("id");
    const game = await this.gamesService.getGameById(id);

    if (!game) {
      return c.json(
        {
          success: false,
          error: {
            code: "GAME_NOT_FOUND",
            message: `Game with id '${id}' not found.`,
          },
        },
        404
      );
    }

    return c.json({
      success: true,
      data: game,
    });
  };

  public getGameStats = async (c: Context) => {
    const id = c.req.param("id");
    const result = await this.gamesService.getGameStats(id);

    if (!result.game) {
      return c.json(
        {
          success: false,
          error: {
            code: "GAME_NOT_FOUND",
            message: `Game with id '${id}' not found.`,
          },
        },
        404
      );
    }

    return c.json({
      success: true,
      data: {
        game: result.game,
        players: result.players,
        teamComparison: result.teamComparison,
      },
    });
  };

  /**
   * Interactive testing endpoint to simulate scoring play on demand
   */
  public simulateScore = async (c: Context) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const team = body.team === "visitor" ? "visitor" : "home";
    const points = typeof body.points === "number" ? body.points : 2;

    const game = await this.gamesService.getGameById(id);
    if (!game) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: "Game not found" } }, 404);
    }

    if (team === "home") {
      game.homeTeamScore += points;
      if (game.scores) game.scores.home.q4 += points;
    } else {
      game.visitorTeamScore += points;
      if (game.scores) game.scores.visitor.q4 += points;
    }

    // Broadcast SSE update instantly
    const sseHub = SSEHub.getInstance();
    sseHub.broadcast("game.score.updated", {
      gameId: game.id,
      period: game.period,
      clock: game.clock,
      homeTeamScore: game.homeTeamScore,
      visitorTeamScore: game.visitorTeamScore,
      scores: game.scores,
      lastPlay: `Simulated +${points} pts for ${team === "home" ? game.homeTeam?.abbreviation : game.visitorTeam?.abbreviation}`,
      timestamp: new Date().toISOString(),
    });

    return c.json({
      success: true,
      data: game,
      message: `Score updated (+${points} to ${team}). SSE event broadcasted.`,
    });
  };
}
