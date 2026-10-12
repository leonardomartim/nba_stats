import type { Context } from "hono";
import { SSEHub, type SSEClient } from "../../infrastructure/sse/sse-hub";

export class EventsController {
  private hub: SSEHub;

  constructor() {
    this.hub = SSEHub.getInstance();
  }

  public streamGameEvents = (c: Context) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Create a ReadableStream for the SSE response
    let streamController: ReadableStreamDefaultController<Uint8Array>;
    const textEncoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        streamController = controller;

        const sseClient: SSEClient = {
          id: clientId,
          send: (msg: string) => {
            try {
              controller.enqueue(textEncoder.encode(msg));
            } catch {
              this.hub.removeClient(clientId);
            }
          },
          close: () => {
            try {
              controller.close();
            } catch {}
          },
          connectedAt: new Date(),
        };

        this.hub.addClient(sseClient);
      },
      cancel: () => {
        this.hub.removeClient(clientId);
      },
    });

    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache, no-transform");
    c.header("Connection", "keep-alive");
    c.header("X-Accel-Buffering", "no");

    return c.body(stream);
  };

  public getStreamStatus = (c: Context) => {
    return c.json({
      success: true,
      data: {
        activeConnections: this.hub.getConnectedClientsCount(),
        heartbeatIntervalMs: 15000,
        transport: "Server-Sent Events (SSE)",
        supportedEvents: [
          "game.started",
          "game.score.updated",
          "game.period.changed",
          "game.finished",
          "system.ping",
        ],
      },
    });
  };
}
