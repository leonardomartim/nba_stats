import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ==========================================
// TEAMS
// ==========================================
export const teams = pgTable(
  "teams",
  {
    id: text("id").primaryKey(),
    externalId: integer("external_id").unique(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    fullName: text("full_name").notNull(),
    abbreviation: text("abbreviation").notNull(),
    conference: text("conference").notNull(), // 'East' | 'West'
    division: text("division").notNull(),
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color"),
    secondaryColor: text("secondary_color"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_teams_conference").on(table.conference),
    index("idx_teams_abbrev").on(table.abbreviation),
  ]
);

// ==========================================
// PLAYERS
// ==========================================
export const players = pgTable(
  "players",
  {
    id: text("id").primaryKey(),
    externalId: integer("external_id").unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    fullName: text("full_name").notNull(),
    position: text("position"),
    jerseyNumber: text("jersey_number"),
    height: text("height"),
    weight: text("weight"),
    teamId: text("team_id").references(() => teams.id),
    avatarUrl: text("avatar_url"),
    college: text("college"),
    country: text("country"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_players_team").on(table.teamId),
    index("idx_players_name").on(table.fullName),
  ]
);

// ==========================================
// GAMES
// ==========================================
export const games = pgTable(
  "games",
  {
    id: text("id").primaryKey(),
    externalId: integer("external_id").unique(),
    date: text("date").notNull(), // YYYY-MM-DD
    season: integer("season").notNull(),
    status: text("status").notNull(), // 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'POSTPONED'
    statusDetail: text("status_detail"),
    period: integer("period").default(0).notNull(),
    clock: text("clock"),
    homeTeamId: text("home_team_id")
      .references(() => teams.id)
      .notNull(),
    homeTeamScore: integer("home_team_score").default(0).notNull(),
    visitorTeamId: text("visitor_team_id")
      .references(() => teams.id)
      .notNull(),
    visitorTeamScore: integer("visitor_team_score").default(0).notNull(),
    arena: text("arena"),
    city: text("city"),
    isLive: boolean("is_live").default(false).notNull(),
    lastSyncedAt: timestamp("last_synced_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_games_date").on(table.date),
    index("idx_games_status").on(table.status),
    index("idx_games_is_live").on(table.isLive),
    index("idx_games_home_team").on(table.homeTeamId),
    index("idx_games_visitor_team").on(table.visitorTeamId),
  ]
);

// ==========================================
// GAME SCORES (Quarter by quarter)
// ==========================================
export const gameScores = pgTable(
  "game_scores",
  {
    id: text("id").primaryKey(),
    gameId: text("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    teamId: text("team_id")
      .references(() => teams.id)
      .notNull(),
    isHome: boolean("is_home").notNull(),
    q1: integer("q1").default(0).notNull(),
    q2: integer("q2").default(0).notNull(),
    q3: integer("q3").default(0).notNull(),
    q4: integer("q4").default(0).notNull(),
    ot: integer("ot").default(0).notNull(),
    totalScore: integer("total_score").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uidx_game_team_score").on(table.gameId, table.teamId),
    index("idx_game_scores_game_id").on(table.gameId),
  ]
);

// ==========================================
// PLAYER GAME STATS (Box Score)
// ==========================================
export const playerGameStats = pgTable(
  "player_game_stats",
  {
    id: text("id").primaryKey(),
    gameId: text("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    playerId: text("player_id")
      .references(() => players.id)
      .notNull(),
    teamId: text("team_id")
      .references(() => teams.id)
      .notNull(),
    min: text("min").default("00:00"),
    pts: integer("pts").default(0).notNull(),
    reb: integer("reb").default(0).notNull(),
    ast: integer("ast").default(0).notNull(),
    stl: integer("stl").default(0).notNull(),
    blk: integer("blk").default(0).notNull(),
    turnover: integer("turnover").default(0).notNull(),
    fgm: integer("fgm").default(0).notNull(),
    fga: integer("fga").default(0).notNull(),
    fgPct: numeric("fg_pct", { precision: 5, scale: 2 }).default("0.00"),
    fg3m: integer("fg3m").default(0).notNull(),
    fg3a: integer("fg3a").default(0).notNull(),
    fg3Pct: numeric("fg3_pct", { precision: 5, scale: 2 }).default("0.00"),
    ftm: integer("ftm").default(0).notNull(),
    fta: integer("fta").default(0).notNull(),
    ftPct: numeric("ft_pct", { precision: 5, scale: 2 }).default("0.00"),
    plusMinus: integer("plus_minus").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uidx_player_game_stats").on(table.gameId, table.playerId),
    index("idx_stats_game_id").on(table.gameId),
    index("idx_stats_player_id").on(table.playerId),
    index("idx_stats_team_id").on(table.teamId),
  ]
);

// ==========================================
// TEAM STANDINGS
// ==========================================
export const teamStandings = pgTable(
  "team_standings",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .references(() => teams.id)
      .notNull(),
    season: integer("season").notNull(),
    conference: text("conference").notNull(),
    division: text("division").notNull(),
    conferenceRank: integer("conference_rank").notNull(),
    divisionRank: integer("division_rank").default(1),
    wins: integer("wins").default(0).notNull(),
    losses: integer("losses").default(0).notNull(),
    winPct: numeric("win_pct", { precision: 5, scale: 3 }).default("0.000").notNull(),
    gamesBehind: numeric("games_behind", { precision: 4, scale: 1 }).default("0.0").notNull(),
    homeRecord: text("home_record").default("0-0").notNull(),
    awayRecord: text("away_record").default("0-0").notNull(),
    lastTen: text("last_ten").default("0-0").notNull(),
    streak: text("streak").default("W1").notNull(),
    pointDifferential: numeric("point_differential", { precision: 5, scale: 1 }).default("0.0").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uidx_team_season_standings").on(table.teamId, table.season),
    index("idx_standings_conf_rank").on(table.conference, table.conferenceRank),
  ]
);

// ==========================================
// SYNC LOGS
// ==========================================
export const syncLogs = pgTable(
  "sync_logs",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    entityType: text("entity_type").notNull(),
    recordsSynced: integer("records_synced").default(0).notNull(),
    status: text("status").notNull(), // 'SUCCESS' | 'ERROR' | 'PARTIAL'
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_sync_logs_created").on(table.createdAt),
  ]
);
