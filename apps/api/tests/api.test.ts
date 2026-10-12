import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("REST API Integration Tests", () => {
  it("GET /health should return 200 with status ok", async () => {
    const res = await app.fetch(new Request("http://localhost:3001/health"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.provider).toBeDefined();
  });

  it("GET /api/v1/openapi.json should return OpenAPI schema", async () => {
    const res = await app.fetch(new Request("http://localhost:3001/api/v1/openapi.json"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.openapi).toBe("3.0.3");
    expect(json.paths["/games"]).toBeDefined();
  });

  it("GET /api/v1/teams should return teams list", async () => {
    const res = await app.fetch(new Request("http://localhost:3001/api/v1/teams"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/games/live should return live games list", async () => {
    const res = await app.fetch(new Request("http://localhost:3001/api/v1/games/live"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it("GET /api/v1/standings should return East and West conferences", async () => {
    const res = await app.fetch(new Request("http://localhost:3001/api/v1/standings"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.east).toBeDefined();
    expect(json.data.west).toBeDefined();
  });

  it("POST /api/v1/games/:id/simulate-score should update score and return success", async () => {
    const req = new Request("http://localhost:3001/api/v1/games/game_live_1/simulate-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: "home", points: 3 }),
    });
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain("SSE event broadcasted");
  });
});
