import type { Context } from "hono";
import type { PlayersService } from "./players.service";

export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  public getPlayers = async (c: Context) => {
    const search = c.req.query("search");
    const teamId = c.req.query("teamId");
    const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20", 10)));

    const result = await this.playersService.getPlayers(search, teamId, page, limit);

    return c.json({
      success: true,
      data: result.players,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  };

  public getById = async (c: Context) => {
    const id = c.req.param("id");
    const player = await this.playersService.getPlayerById(id);

    if (!player) {
      return c.json(
        {
          success: false,
          error: {
            code: "PLAYER_NOT_FOUND",
            message: `Player with id '${id}' not found.`,
          },
        },
        404
      );
    }

    return c.json({
      success: true,
      data: player,
    });
  };
}
