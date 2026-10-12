import { z } from "zod";

// ==========================================
// ENUMS & CONSTANTS
// ==========================================
export const GameStatusEnum = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "FINISHED",
  "POSTPONED",
]);
export type GameStatus = z.infer<typeof GameStatusEnum>;

export const ConferenceEnum = z.enum(["East", "West"]);
export type Conference = z.infer<typeof ConferenceEnum>;

export const DivisionEnum = z.enum([
  "Atlantic",
  "Central",
  "Southeast",
  "Northwest",
  "Pacific",
  "Southwest",
]);
export type Division = z.infer<typeof DivisionEnum>;

// ==========================================
// TEAMS
// ==========================================
export const TeamSchema = z.object({
  id: z.string(),
  externalId: z.number().nullable().optional(),
  name: z.string(),
  city: z.string(),
  fullName: z.string(),
  abbreviation: z.string(),
  conference: ConferenceEnum,
  division: DivisionEnum,
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Team = z.infer<typeof TeamSchema>;

// ==========================================
// PLAYERS
// ==========================================
export const PlayerSchema = z.object({
  id: z.string(),
  externalId: z.number().nullable().optional(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  position: z.string().nullable().optional(),
  jerseyNumber: z.string().nullable().optional(),
  height: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  team: TeamSchema.optional(),
  avatarUrl: z.string().optional(),
  college: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Player = z.infer<typeof PlayerSchema>;

// ==========================================
// GAME SCORES & DETAILS
// ==========================================
export const QuarterScoresSchema = z.object({
  q1: z.number().default(0),
  q2: z.number().default(0),
  q3: z.number().default(0),
  q4: z.number().default(0),
  ot: z.number().default(0),
});
export type QuarterScores = z.infer<typeof QuarterScoresSchema>;

export const GameScoreBreakdownSchema = z.object({
  home: QuarterScoresSchema,
  visitor: QuarterScoresSchema,
});
export type GameScoreBreakdown = z.infer<typeof GameScoreBreakdownSchema>;

// ==========================================
// GAMES
// ==========================================
export const GameSchema = z.object({
  id: z.string(),
  externalId: z.number().nullable().optional(),
  date: z.string(), // ISO string date
  season: z.number(),
  status: GameStatusEnum,
  statusDetail: z.string().optional(), // e.g. "Q4 02:45", "Final", "7:30 PM ET"
  period: z.number().default(0), // 1 to 4, 5+ for OTs
  clock: z.string().nullable().optional(), // "10:24", "00:32"
  homeTeamId: z.string(),
  homeTeamScore: z.number().default(0),
  visitorTeamId: z.string(),
  visitorTeamScore: z.number().default(0),
  homeTeam: TeamSchema.optional(),
  visitorTeam: TeamSchema.optional(),
  scores: GameScoreBreakdownSchema.optional(),
  arena: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  isLive: z.boolean().default(false),
  lastSyncedAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Game = z.infer<typeof GameSchema>;

// ==========================================
// PLAYER GAME STATS
// ==========================================
export const PlayerGameStatsSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  playerId: z.string(),
  player: PlayerSchema.optional(),
  teamId: z.string(),
  team: TeamSchema.optional(),
  min: z.string().nullable().optional(), // "34:12"
  pts: z.number().default(0),
  reb: z.number().default(0),
  ast: z.number().default(0),
  stl: z.number().default(0),
  blk: z.number().default(0),
  turnover: z.number().default(0),
  fgm: z.number().default(0),
  fga: z.number().default(0),
  fgPct: z.number().default(0),
  fg3m: z.number().default(0),
  fg3a: z.number().default(0),
  fg3Pct: z.number().default(0),
  ftm: z.number().default(0),
  fta: z.number().default(0),
  ftPct: z.number().default(0),
  plusMinus: z.number().default(0),
});
export type PlayerGameStats = z.infer<typeof PlayerGameStatsSchema>;

// ==========================================
// TEAM GAME STATS (Aggregate)
// ==========================================
export const TeamGameStatsSchema = z.object({
  teamId: z.string(),
  team: TeamSchema.optional(),
  pts: z.number().default(0),
  fgm: z.number().default(0),
  fga: z.number().default(0),
  fgPct: z.number().default(0),
  fg3m: z.number().default(0),
  fg3a: z.number().default(0),
  fg3Pct: z.number().default(0),
  ftm: z.number().default(0),
  fta: z.number().default(0),
  ftPct: z.number().default(0),
  reb: z.number().default(0),
  ast: z.number().default(0),
  stl: z.number().default(0),
  blk: z.number().default(0),
  turnovers: z.number().default(0),
  fastBreakPts: z.number().default(0),
  pointsInPaint: z.number().default(0),
});
export type TeamGameStats = z.infer<typeof TeamGameStatsSchema>;

// ==========================================
// STANDINGS
// ==========================================
export const TeamStandingSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  team: TeamSchema.optional(),
  season: z.number(),
  conference: ConferenceEnum,
  division: DivisionEnum,
  conferenceRank: z.number(),
  divisionRank: z.number().optional(),
  wins: z.number(),
  losses: z.number(),
  winPct: z.number(),
  gamesBehind: z.number().default(0),
  homeRecord: z.string().default("0-0"),
  awayRecord: z.string().default("0-0"),
  lastTen: z.string().default("0-0"),
  streak: z.string().default("W1"),
  pointDifferential: z.number().default(0),
  updatedAt: z.string().optional(),
});
export type TeamStanding = z.infer<typeof TeamStandingSchema>;

// ==========================================
// SSE EVENT TYPES & SCHEMAS
// ==========================================
export const SSEEventTypeEnum = z.enum([
  "game.started",
  "game.score.updated",
  "game.period.changed",
  "game.finished",
  "system.ping",
]);
export type SSEEventType = z.infer<typeof SSEEventTypeEnum>;

export const ScoreUpdatePayloadSchema = z.object({
  gameId: z.string(),
  period: z.number(),
  clock: z.string().nullable().optional(),
  homeTeamScore: z.number(),
  visitorTeamScore: z.number(),
  scores: GameScoreBreakdownSchema.optional(),
  lastPlay: z.string().optional(),
  timestamp: z.string(),
});
export type ScoreUpdatePayload = z.infer<typeof ScoreUpdatePayloadSchema>;

export const PeriodChangePayloadSchema = z.object({
  gameId: z.string(),
  period: z.number(),
  periodName: z.string(), // "End of 1st Quarter", "Halftime", etc.
  homeTeamScore: z.number(),
  visitorTeamScore: z.number(),
  timestamp: z.string(),
});
export type PeriodChangePayload = z.infer<typeof PeriodChangePayloadSchema>;

export const GameLifecyclePayloadSchema = z.object({
  gameId: z.string(),
  game: GameSchema,
  timestamp: z.string(),
});
export type GameLifecyclePayload = z.infer<typeof GameLifecyclePayloadSchema>;

export interface SSEMessage<T = unknown> {
  event: SSEEventType;
  data: T;
  id?: string;
  retry?: number;
}

// ==========================================
// API REQUEST & RESPONSE TYPES
// ==========================================
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const GamesQuerySchema = PaginationQuerySchema.extend({
  date: z.string().optional(), // YYYY-MM-DD
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  season: z.coerce.number().optional(),
  teamId: z.string().optional(),
  status: GameStatusEnum.optional(),
  isLive: z.enum(["true", "false"]).optional(),
});
export type GamesQuery = z.infer<typeof GamesQuerySchema>;

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    meta: z
      .object({
        page: z.number().optional(),
        limit: z.number().optional(),
        total: z.number().optional(),
        totalPages: z.number().optional(),
        source: z.string().optional(), // e.g. "balldontlie" | "cache" | "mock"
        providerStatus: z.string().optional(),
      })
      .optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      })
      .optional(),
  });

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    source?: string;
    providerStatus?: string;
    lastSyncedAt?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
