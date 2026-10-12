import type { Context } from "hono";
import type { StandingsService } from "./standings.service";

export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  public getStandings = async (c: Context) => {
    const season = c.req.query("season") ? parseInt(c.req.query("season")!, 10) : 2024;
    const conference = c.req.query("conference");

    const data = await this.standingsService.getStandings(season, conference);

    return c.json({
      success: true,
      data,
      meta: {
        season,
        totalEast: data.east.length,
        totalWest: data.west.length,
      },
    });
  };
}
