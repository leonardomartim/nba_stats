import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./infrastructure/config/env";
import { initDb, closeDb } from "./infrastructure/db";
import { SSEHub } from "./infrastructure/sse/sse-hub";
import { LiveSyncWorker } from "./infrastructure/worker/live-sync.worker";
import { ProviderFactory } from "./providers/provider.factory";

import { TeamRepository } from "./modules/teams/teams.repository";
import { TeamsService } from "./modules/teams/teams.service";
import { TeamsController } from "./modules/teams/teams.controller";

import { PlayerRepository } from "./modules/players/players.repository";
import { PlayersService } from "./modules/players/players.service";
import { PlayersController } from "./modules/players/players.controller";

import { GameRepository } from "./modules/games/games.repository";
import { GamesService } from "./modules/games/games.service";
import { GamesController } from "./modules/games/games.controller";

import { StandingsRepository } from "./modules/standings/standings.repository";
import { StandingsService } from "./modules/standings/standings.service";
import { StandingsController } from "./modules/standings/standings.controller";

import { EventsController } from "./modules/events/events.controller";

import { requestLogger } from "./middleware/request-logger";
import { rateLimiter } from "./middleware/rate-limiter";
import { errorHandler } from "./middleware/error-handler";
import { openApiSpec, renderSwaggerHtml } from "./infrastructure/docs/openapi";

const app = new Hono();

// ==========================================
// DEPENDENCY INJECTION & COMPOSITION ROOT
// ==========================================
const provider = ProviderFactory.getProvider();
const sseHub = SSEHub.getInstance();

const teamRepo = new TeamRepository();
const playerRepo = new PlayerRepository();
const gameRepo = new GameRepository();
const standingsRepo = new StandingsRepository();

const teamsService = new TeamsService(teamRepo, provider);
const gamesService = new GamesService(gameRepo, teamRepo, provider);
const playersService = new PlayersService(playerRepo, teamRepo, provider);
const standingsService = new StandingsService(standingsRepo, teamRepo, provider);

const teamsController = new TeamsController(teamsService, gamesService);
const gamesController = new GamesController(gamesService);
const playersController = new PlayersController(playersService);
const standingsController = new StandingsController(standingsService);
const eventsController = new EventsController();

// Background Live Sync Worker
const liveWorker = new LiveSyncWorker(provider, gameRepo, sseHub, env.SYNC_INTERVAL_MS);

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Accept"],
    exposeHeaders: ["Content-Length", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
    maxAge: 86400,
  })
);

app.use("*", requestLogger());
app.use("*", rateLimiter());
app.onError(errorHandler);

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/health", async (c) => {
  const providerHealth = await provider.getHealth();
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    provider: providerHealth,
    sseConnections: sseHub.getConnectedClientsCount(),
    database: {
      connected: true,
      mode: env.DATABASE_URL ? "PostgreSQL" : "In-Memory Resilient Store",
    },
  });
});

// ==========================================
// DOCUMENTATION (OPENAPI & SWAGGER UI)
// ==========================================
app.get("/api/v1/openapi.json", (c) => c.json(openApiSpec));
app.get("/docs", (c) => c.html(renderSwaggerHtml()));
app.get("/", (c) => c.redirect("/docs"));

// ==========================================
// REST API v1 ROUTES
// ==========================================
const v1 = new Hono();

// Games endpoints
v1.get("/games", gamesController.getGames);
v1.get("/games/live", gamesController.getLiveGames);
v1.get("/games/:id", gamesController.getGameById);
v1.get("/games/:id/stats", gamesController.getGameStats);
v1.post("/games/:id/simulate-score", gamesController.simulateScore);

// Teams endpoints
v1.get("/teams", teamsController.getAll);
v1.get("/teams/:id", teamsController.getById);
v1.get("/teams/:id/games", teamsController.getTeamGames);

// Players endpoints
v1.get("/players", playersController.getPlayers);
v1.get("/players/:id", playersController.getById);

// Standings endpoint
v1.get("/standings", standingsController.getStandings);

// Real-Time Events (Server-Sent Events)
v1.get("/events/games", eventsController.streamGameEvents);
v1.get("/events/status", eventsController.getStreamStatus);

app.route("/api/v1", v1);

// ==========================================
// SERVER INITIALIZATION & GRACEFUL SHUTDOWN
// ==========================================
async function startServer() {
  await initDb();
  await liveWorker.start();

  console.log(`
  🏀 ==============================================
  🏀  NBA LIVE API SERVER RUNNING (Bun + Hono)
  🏀 ==============================================
  📡 REST API & SSE:  http://localhost:${env.PORT}/api/v1
  📖 OpenAPI Swagger: http://localhost:${env.PORT}/docs
  ❤️  Health Check:    http://localhost:${env.PORT}/health
  ⚡ Provider:        ${provider.name} ${provider.isMock ? "(Demo Data)" : "(Live)"}
  ==============================================
  `);
}

startServer();

// Graceful shutdown handling
const shutdown = async () => {
  console.log("\n🛑 Gracefully shutting down NBA Live API...");
  liveWorker.stop();
  sseHub.destroy();
  await closeDb();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
