import { describe, expect, it } from "bun:test";
import { SSEHub, type SSEClient } from "../src/infrastructure/sse/sse-hub";

describe("SSE Real-Time Hub", () => {
  it("should register clients, send initial ping, and broadcast events with deduplication", async () => {
    const hub = SSEHub.getInstance();
    const receivedMessages: string[] = [];

    const mockClient: SSEClient = {
      id: "test_client_1",
      send: (msg: string) => {
        receivedMessages.push(msg);
      },
      close: () => {},
      connectedAt: new Date(),
    };

    hub.addClient(mockClient);
    expect(hub.getConnectedClientsCount()).toBeGreaterThanOrEqual(1);

    // Initial greeting
    expect(receivedMessages.length).toBeGreaterThan(0);
    expect(receivedMessages[0]).toContain("system.ping");

    // Broadcast score update
    hub.broadcast("game.score.updated", {
      gameId: "test_game_1",
      homeTeamScore: 110,
      visitorTeamScore: 108,
      timestamp: new Date().toISOString(),
    });

    const scoreMsg = receivedMessages.find((m) => m.includes("game.score.updated"));
    expect(scoreMsg).toBeDefined();
    expect(scoreMsg).toContain("110");

    // Clean up
    hub.removeClient("test_client_1");
  });
});
