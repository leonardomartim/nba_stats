CREATE TABLE "game_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"team_id" text NOT NULL,
	"is_home" boolean NOT NULL,
	"q1" integer DEFAULT 0 NOT NULL,
	"q2" integer DEFAULT 0 NOT NULL,
	"q3" integer DEFAULT 0 NOT NULL,
	"q4" integer DEFAULT 0 NOT NULL,
	"ot" integer DEFAULT 0 NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"external_id" integer,
	"date" text NOT NULL,
	"season" integer NOT NULL,
	"status" text NOT NULL,
	"status_detail" text,
	"period" integer DEFAULT 0 NOT NULL,
	"clock" text,
	"home_team_id" text NOT NULL,
	"home_team_score" integer DEFAULT 0 NOT NULL,
	"visitor_team_id" text NOT NULL,
	"visitor_team_score" integer DEFAULT 0 NOT NULL,
	"arena" text,
	"city" text,
	"is_live" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "games_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "player_game_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"player_id" text NOT NULL,
	"team_id" text NOT NULL,
	"min" text DEFAULT '00:00',
	"pts" integer DEFAULT 0 NOT NULL,
	"reb" integer DEFAULT 0 NOT NULL,
	"ast" integer DEFAULT 0 NOT NULL,
	"stl" integer DEFAULT 0 NOT NULL,
	"blk" integer DEFAULT 0 NOT NULL,
	"turnover" integer DEFAULT 0 NOT NULL,
	"fgm" integer DEFAULT 0 NOT NULL,
	"fga" integer DEFAULT 0 NOT NULL,
	"fg_pct" numeric(5, 2) DEFAULT '0.00',
	"fg3m" integer DEFAULT 0 NOT NULL,
	"fg3a" integer DEFAULT 0 NOT NULL,
	"fg3_pct" numeric(5, 2) DEFAULT '0.00',
	"ftm" integer DEFAULT 0 NOT NULL,
	"fta" integer DEFAULT 0 NOT NULL,
	"ft_pct" numeric(5, 2) DEFAULT '0.00',
	"plus_minus" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"external_id" integer,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"full_name" text NOT NULL,
	"position" text,
	"jersey_number" text,
	"height" text,
	"weight" text,
	"team_id" text,
	"avatar_url" text,
	"college" text,
	"country" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "players_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"entity_type" text NOT NULL,
	"records_synced" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"error_message" text,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_standings" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"season" integer NOT NULL,
	"conference" text NOT NULL,
	"division" text NOT NULL,
	"conference_rank" integer NOT NULL,
	"division_rank" integer DEFAULT 1,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"win_pct" numeric(5, 3) DEFAULT '0.000' NOT NULL,
	"games_behind" numeric(4, 1) DEFAULT '0.0' NOT NULL,
	"home_record" text DEFAULT '0-0' NOT NULL,
	"away_record" text DEFAULT '0-0' NOT NULL,
	"last_ten" text DEFAULT '0-0' NOT NULL,
	"streak" text DEFAULT 'W1' NOT NULL,
	"point_differential" numeric(5, 1) DEFAULT '0.0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"external_id" integer,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"full_name" text NOT NULL,
	"abbreviation" text NOT NULL,
	"conference" text NOT NULL,
	"division" text NOT NULL,
	"logo_url" text,
	"primary_color" text,
	"secondary_color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_visitor_team_id_teams_id_fk" FOREIGN KEY ("visitor_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_game_stats" ADD CONSTRAINT "player_game_stats_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_game_stats" ADD CONSTRAINT "player_game_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_game_stats" ADD CONSTRAINT "player_game_stats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_standings" ADD CONSTRAINT "team_standings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_game_team_score" ON "game_scores" USING btree ("game_id","team_id");--> statement-breakpoint
CREATE INDEX "idx_game_scores_game_id" ON "game_scores" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_games_date" ON "games" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_games_status" ON "games" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_games_is_live" ON "games" USING btree ("is_live");--> statement-breakpoint
CREATE INDEX "idx_games_home_team" ON "games" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "idx_games_visitor_team" ON "games" USING btree ("visitor_team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_player_game_stats" ON "player_game_stats" USING btree ("game_id","player_id");--> statement-breakpoint
CREATE INDEX "idx_stats_game_id" ON "player_game_stats" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_stats_player_id" ON "player_game_stats" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_stats_team_id" ON "player_game_stats" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_players_team" ON "players" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_players_name" ON "players" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "idx_sync_logs_created" ON "sync_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_team_season_standings" ON "team_standings" USING btree ("team_id","season");--> statement-breakpoint
CREATE INDEX "idx_standings_conf_rank" ON "team_standings" USING btree ("conference","conference_rank");--> statement-breakpoint
CREATE INDEX "idx_teams_conference" ON "teams" USING btree ("conference");--> statement-breakpoint
CREATE INDEX "idx_teams_abbrev" ON "teams" USING btree ("abbreviation");