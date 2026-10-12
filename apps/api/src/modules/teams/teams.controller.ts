import type { Context } from "hono";
import type { TeamsService } from "./teams.service";
import type { GamesService } from "../games/games.service";

export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly gamesService?: GamesService
  ) {}

  public getAll = async (c: Context) => {
    const conference = c.req.query("conference");
    const division = c.req.query("division");

    let teams = await this.teamsService.getAllTeams();

    if (conference) {
      teams = teams.filter(
        (t) => t.conference.toLowerCase() === conference.toLowerCase()
      );
    }
    if (division) {
      teams = teams.filter(
        (t) => t.division.toLowerCase() === division.toLowerCase()
      );
    }

    return c.json({
      success: true,
      data: teams,
      meta: {
        total: teams.length,
      },
    });
  };

  public getById = async (c: Context) => {
    const id = c.req.param("id");
    const team = await this.teamsService.getTeamById(id);

    if (!team) {
      return c.json(
        {
          success: false,
          error: {
            code: "TEAM_NOT_FOUND",
            message: `Team with id '${id}' not found.`,
          },
        },
        404
      );
    }

    return c.json({
      success: true,
      data: team,
    });
  };

  public getTeamGames = async (c: Context) => {
    const id = c.req.param("id");
    const team = await this.teamsService.getTeamById(id);

    if (!team) {
      return c.json(
        {
          success: false,
          error: {
            code: "TEAM_NOT_FOUND",
            message: `Team with id '${id}' not found.`,
          },
        },
        404
      );
    }

    if (!this.gamesService) {
      return c.json({ success: true, data: [] });
    }

    const teamGames = await this.gamesService.getGamesByTeam(team.id);

    return c.json({
      success: true,
      data: teamGames,
      meta: {
        total: teamGames.length,
      },
    });
  };
}
