export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "NBA Live REST API",
    version: "1.0.0",
    description:
      "Enterprise-grade, real-time NBA tracking API powered by Bun, Hono, Drizzle ORM, and Server-Sent Events (SSE).",
    contact: {
      name: "NBA Live Engineering",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "Default API Gateway",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "System Health & Provider Status",
        tags: ["System"],
        responses: {
          "200": {
            description: "System health check response",
          },
        },
      },
    },
    "/games": {
      get: {
        summary: "List NBA games with filters and pagination",
        tags: ["Games"],
        parameters: [
          { name: "date", in: "query", schema: { type: "string" }, description: "Date in YYYY-MM-DD" },
          { name: "season", in: "query", schema: { type: "integer" }, description: "Season year (e.g. 2024)" },
          { name: "status", in: "query", schema: { type: "string", enum: ["SCHEDULED", "IN_PROGRESS", "FINISHED"] } },
          { name: "teamId", in: "query", schema: { type: "string" }, description: "Filter by team ID" },
          { name: "isLive", in: "query", schema: { type: "boolean" }, description: "Filter live games only" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Paginated list of games" },
        },
      },
    },
    "/games/live": {
      get: {
        summary: "Get all games currently in progress",
        tags: ["Games"],
        responses: {
          "200": { description: "Active live games" },
        },
      },
    },
    "/games/{id}": {
      get: {
        summary: "Get specific game details by ID",
        tags: ["Games"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Game details" },
          "404": { description: "Game not found" },
        },
      },
    },
    "/games/{id}/stats": {
      get: {
        summary: "Get game box score and team comparative statistics",
        tags: ["Games"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Box score and team aggregate comparison" },
          "404": { description: "Game not found" },
        },
      },
    },
    "/teams": {
      get: {
        summary: "List NBA teams",
        tags: ["Teams"],
        parameters: [
          { name: "conference", in: "query", schema: { type: "string", enum: ["East", "West"] } },
          { name: "division", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "List of teams" },
        },
      },
    },
    "/teams/{id}": {
      get: {
        summary: "Get team profile by ID",
        tags: ["Teams"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Team details" },
          "404": { description: "Team not found" },
        },
      },
    },
    "/teams/{id}/games": {
      get: {
        summary: "Get games schedule and results for a team",
        tags: ["Teams"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Team games" },
        },
      },
    },
    "/players": {
      get: {
        summary: "Search and paginate NBA players",
        tags: ["Players"],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "teamId", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Paginated players" },
        },
      },
    },
    "/players/{id}": {
      get: {
        summary: "Get player bio and profile by ID",
        tags: ["Players"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Player profile" },
          "404": { description: "Player not found" },
        },
      },
    },
    "/standings": {
      get: {
        summary: "Get conference standings (East and West)",
        tags: ["Standings"],
        parameters: [
          { name: "season", in: "query", schema: { type: "integer", default: 2024 } },
          { name: "conference", in: "query", schema: { type: "string", enum: ["East", "West"] } },
        ],
        responses: {
          "200": { description: "Conference standings tables" },
        },
      },
    },
    "/events/games": {
      get: {
        summary: "Server-Sent Events (SSE) live game stream",
        tags: ["Real-Time"],
        description:
          "Connects to real-time event stream broadcasting `game.started`, `game.score.updated`, `game.period.changed`, and `game.finished` events with 15-second heartbeat ping.",
        responses: {
          "200": {
            description: "Event stream (text/event-stream)",
          },
        },
      },
    },
  },
};

export function renderSwaggerHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>NBA Live API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background-color: #0c0e17; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
      });
    };
  </script>
</body>
</html>`;
}
