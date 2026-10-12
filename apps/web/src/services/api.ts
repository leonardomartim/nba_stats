import type {
  Game,
  Team,
  Player,
  TeamStanding,
  PlayerGameStats,
  TeamGameStats,
  ApiResponse,
} from "@nba-live/shared";

const BASE_URL = "/api/v1";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `HTTP error ${res.status}`);
  }

  const json: ApiResponse<T> = await res.json();
  return json.data;
}

export const api = {
  // Games
  getGames: async (params?: { date?: string; season?: number; status?: string; teamId?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.season) query.set("season", String(params.season));
    if (params?.status) query.set("status", params.status);
    if (params?.teamId) query.set("teamId", params.teamId);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<Game[]>(`/games${qs}`);
  },

  getLiveGames: async () => {
    return request<Game[]>("/games/live");
  },

  getGameById: async (id: string) => {
    return request<Game>(`/games/${id}`);
  },

  getGameStats: async (id: string) => {
    return request<{
      game: Game;
      players: PlayerGameStats[];
      teamComparison: { home: TeamGameStats; visitor: TeamGameStats };
    }>(`/games/${id}/stats`);
  },

  simulateScore: async (gameId: string, team: "home" | "visitor", points: number) => {
    return request<Game>(`/games/${gameId}/simulate-score`, {
      method: "POST",
      body: JSON.stringify({ team, points }),
    });
  },

  // Teams
  getTeams: async (conference?: string) => {
    const qs = conference ? `?conference=${conference}` : "";
    return request<Team[]>(`/teams${qs}`);
  },

  getTeamById: async (id: string) => {
    return request<Team>(`/teams/${id}`);
  },

  getTeamGames: async (id: string) => {
    return request<Game[]>(`/teams/${id}/games`);
  },

  // Players
  getPlayers: async (params?: { search?: string; teamId?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.teamId) query.set("teamId", params.teamId);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<Player[]>(`/players${qs}`);
  },

  getPlayerById: async (id: string) => {
    return request<Player>(`/players/${id}`);
  },

  // Standings
  getStandings: async (season = 2024) => {
    return request<{ east: TeamStanding[]; west: TeamStanding[] }>(`/standings?season=${season}`);
  },
};
