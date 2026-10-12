import type { NBADataProvider, ProviderHealth } from "./nba-provider.interface";
import type {
  Team,
  Player,
  Game,
  TeamStanding,
  PlayerGameStats,
  GameStatus,
} from "@nba-live/shared";

interface BallDontLieTeam {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

interface BallDontLiePlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string;
  weight: string;
  jersey_number: string;
  college: string;
  country: string;
  team: BallDontLieTeam;
}

interface BallDontLieGame {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  home_team: BallDontLieTeam;
  visitor_team: BallDontLieTeam;
}

interface BallDontLieStats {
  id: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  game: { id: number };
  player: BallDontLiePlayer;
  team: BallDontLieTeam;
}

export class BallDontLieProvider implements NBADataProvider {
  public readonly name = "balldontlie";
  public readonly isMock = false;

  private readonly baseUrl = "https://api.balldontlie.io/v1";
  private readonly apiKey: string;
  private rateLimitRemaining: number = 60;
  private rateLimitReset: number = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithRetry<T>(
    endpoint: string,
    params?: Record<string, string | number | undefined>,
    retries = 3,
    delayMs = 1000
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) {
          url.searchParams.append(k, String(v));
        }
      });
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(this.apiKey ? { Authorization: this.apiKey } : {}),
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(url.toString(), {
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // Update rate limits from headers
        const rem = response.headers.get("x-ratelimit-remaining");
        if (rem) this.rateLimitRemaining = parseInt(rem, 10);

        if (response.status === 429) {
          console.warn(`[BallDontLie] Rate limit exceeded (429). Attempt ${attempt}/${retries}`);
          if (attempt === retries) {
            throw new Error("BallDontLie API rate limit exceeded (HTTP 429).");
          }
          const retryAfter = response.headers.get("retry-after");
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delayMs * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, waitTime));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`BallDontLie HTTP ${response.status}: ${errText}`);
        }

        return (await response.json()) as T;
      } catch (err: any) {
        clearTimeout(timeout);
        if (attempt === retries) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
      }
    }

    throw new Error(`Max retries reached for ${endpoint}`);
  }

  public async getHealth(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return {
        name: this.name,
        isAvailable: false,
        lastChecked: new Date().toISOString(),
        errorMessage: "BALLDONTLIE_API_KEY is not configured.",
      };
    }

    try {
      await this.fetchWithRetry<{ data: any[] }>("/teams", { per_page: 1 }, 1);
      return {
        name: this.name,
        isAvailable: true,
        rateLimitRemaining: this.rateLimitRemaining,
        rateLimitReset: this.rateLimitReset,
        lastChecked: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        name: this.name,
        isAvailable: false,
        lastChecked: new Date().toISOString(),
        errorMessage: err.message,
      };
    }
  }

  public async getTeams(): Promise<Team[]> {
    const res = await this.fetchWithRetry<{ data: BallDontLieTeam[] }>("/teams");
    return res.data.map(this.normalizeTeam);
  }

  public async getTeamById(id: string | number): Promise<Team | null> {
    try {
      const res = await this.fetchWithRetry<{ data: BallDontLieTeam }>(`/teams/${id}`);
      return this.normalizeTeam(res.data);
    } catch {
      return null;
    }
  }

  public async getPlayers(
    search?: string,
    teamId?: string,
    page = 1,
    limit = 25
  ): Promise<{ players: Player[]; total: number }> {
    const params: Record<string, any> = {
      per_page: limit,
      cursor: (page - 1) * limit,
    };
    if (search) params.search = search;
    if (teamId) params["team_ids[]"] = teamId;

    const res = await this.fetchWithRetry<{ data: BallDontLiePlayer[]; meta?: { total_count?: number } }>(
      "/players",
      params
    );

    return {
      players: res.data.map(this.normalizePlayer),
      total: res.meta?.total_count ?? res.data.length,
    };
  }

  public async getPlayerById(id: string | number): Promise<Player | null> {
    try {
      const res = await this.fetchWithRetry<{ data: BallDontLiePlayer }>(`/players/${id}`);
      return this.normalizePlayer(res.data);
    } catch {
      return null;
    }
  }

  public async getGames(date?: string, season?: number): Promise<Game[]> {
    const params: Record<string, any> = { per_page: 100 };
    if (date) params["dates[]"] = date;
    if (season) params["seasons[]"] = season;

    const res = await this.fetchWithRetry<{ data: BallDontLieGame[] }>("/games", params);
    return res.data.map((g) => this.normalizeGame(g));
  }

  public async getLiveGames(): Promise<Game[]> {
    const today = new Date().toISOString().split("T")[0];
    const games = await this.getGames(today);
    return games.filter((g) => g.isLive);
  }

  public async getGameById(id: string | number): Promise<Game | null> {
    try {
      const res = await this.fetchWithRetry<{ data: BallDontLieGame }>(`/games/${id}`);
      return this.normalizeGame(res.data);
    } catch {
      return null;
    }
  }

  public async getGameStats(gameId: string | number): Promise<PlayerGameStats[]> {
    try {
      const res = await this.fetchWithRetry<{ data: BallDontLieStats[] }>("/stats", {
        "game_ids[]": gameId,
        per_page: 100,
      });

      return res.data.map(this.normalizeStats);
    } catch {
      return [];
    }
  }

  public async getStandings(season = 2024): Promise<TeamStanding[]> {
    try {
      const res = await this.fetchWithRetry<{ data: any[] }>("/standings", { season });
      return res.data.map(this.normalizeStanding);
    } catch {
      // If balldontlie tier does not support standings, return empty array cleanly
      return [];
    }
  }

  // ==========================================
  // NORMALIZATION
  // ==========================================

  private normalizeTeam = (t: BallDontLieTeam): Team => {
    return {
      id: `team_${t.abbreviation.toLowerCase()}`,
      externalId: t.id,
      name: t.name,
      city: t.city,
      fullName: t.full_name,
      abbreviation: t.abbreviation,
      conference: (t.conference === "East" ? "East" : "West") as any,
      division: t.division as any,
      logoUrl: `https://cdn.nba.com/logos/nba/${t.id}/primary/L/logo.svg`,
      primaryColor: "#1d70b8",
      secondaryColor: "#ffffff",
    };
  };

  private normalizePlayer = (p: BallDontLiePlayer): Player => {
    return {
      id: `player_${p.id}`,
      externalId: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      fullName: `${p.first_name} ${p.last_name}`,
      position: p.position || "G-F",
      jerseyNumber: p.jersey_number || "-",
      height: p.height || "-",
      weight: p.weight || "-",
      teamId: p.team ? `team_${p.team.abbreviation?.toLowerCase()}` : undefined,
      team: p.team ? this.normalizeTeam(p.team) : undefined,
      college: p.college,
      country: p.country,
      avatarUrl: `https://cdn.nba.com/headshots/nba/latest/1040x760/${p.id}.png`,
    };
  };

  private normalizeGame = (g: BallDontLieGame): Game => {
    const rawStatus = (g.status || "").trim();
    let status: GameStatus = "SCHEDULED";
    let isLive = false;

    if (rawStatus.toLowerCase().includes("final")) {
      status = "FINISHED";
      isLive = false;
    } else if (g.period > 0 || rawStatus.includes("Q") || rawStatus.includes("Halftime")) {
      status = "IN_PROGRESS";
      isLive = true;
    }

    const homeTeam = this.normalizeTeam(g.home_team);
    const visitorTeam = this.normalizeTeam(g.visitor_team);

    return {
      id: `game_${g.id}`,
      externalId: g.id,
      date: g.date.split("T")[0],
      season: g.season,
      status,
      statusDetail: rawStatus,
      period: g.period || 0,
      clock: g.time || null,
      homeTeamId: homeTeam.id,
      homeTeamScore: g.home_team_score || 0,
      visitorTeamId: visitorTeam.id,
      visitorTeamScore: g.visitor_team_score || 0,
      homeTeam,
      visitorTeam,
      isLive,
      scores: {
        home: { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 },
        visitor: { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 },
      },
    };
  };

  private normalizeStats = (s: BallDontLieStats): PlayerGameStats => {
    return {
      id: `stat_${s.id}`,
      gameId: `game_${s.game.id}`,
      playerId: `player_${s.player.id}`,
      player: this.normalizePlayer(s.player),
      teamId: `team_${s.team.abbreviation.toLowerCase()}`,
      team: this.normalizeTeam(s.team),
      min: s.min,
      pts: s.pts || 0,
      reb: s.reb || 0,
      ast: s.ast || 0,
      stl: s.stl || 0,
      blk: s.blk || 0,
      turnover: s.turnover || 0,
      fgm: s.fgm || 0,
      fga: s.fga || 0,
      fgPct: s.fg_pct ? Number((s.fg_pct * 100).toFixed(1)) : 0,
      fg3m: s.fg3m || 0,
      fg3a: s.fg3a || 0,
      fg3Pct: s.fg3_pct ? Number((s.fg3_pct * 100).toFixed(1)) : 0,
      ftm: s.ftm || 0,
      fta: s.fta || 0,
      ftPct: s.ft_pct ? Number((s.ft_pct * 100).toFixed(1)) : 0,
      plusMinus: 0,
    };
  };

  private normalizeStanding = (st: any): TeamStanding => {
    return {
      id: `std_${st.team.id}_${st.season}`,
      teamId: `team_${st.team.abbreviation?.toLowerCase()}`,
      season: st.season,
      conference: st.conference,
      division: st.division,
      conferenceRank: st.conference_rank || 1,
      divisionRank: st.division_rank || 1,
      wins: st.wins || 0,
      losses: st.losses || 0,
      winPct: st.win_pct || 0,
      gamesBehind: st.games_behind || 0,
      homeRecord: st.home_record || "0-0",
      awayRecord: st.away_record || "0-0",
      lastTen: st.last_ten || "0-0",
      streak: st.streak || "W1",
      pointDifferential: st.point_differential || 0,
    };
  };
}
