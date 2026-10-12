import { EventEmitter } from "events";
import type { SSEEventType, SSEMessage } from "@nba-live/shared";

export type SSEClient = {
  id: string;
  send: (msg: string) => void;
  close: () => void;
  connectedAt: Date;
};

export class SSEHub {
  private static instance: SSEHub;
  private clients: Map<string, SSEClient> = new Map();
  private emitter: EventEmitter = new EventEmitter();
  private heartbeatInterval: Timer | null = null;
  private recentEvents: Map<string, number> = new Map(); // Event deduplication (hash -> timestamp)

  private constructor() {
    this.startHeartbeat();
  }

  public static getInstance(): SSEHub {
    if (!SSEHub.instance) {
      SSEHub.instance = new SSEHub();
    }
    return SSEHub.instance;
  }

  public addClient(client: SSEClient): void {
    this.clients.set(client.id, client);
    console.log(`📡 [SSEHub] Client connected: ${client.id} (Total: ${this.clients.size})`);

    // Initial greeting event
    this.sendToClient(client, {
      event: "system.ping",
      data: {
        message: "Connected to NBA Live Real-Time Stream",
        connectedClients: this.clients.size,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public removeClient(clientId: string): void {
    if (this.clients.delete(clientId)) {
      console.log(`🔌 [SSEHub] Client disconnected: ${clientId} (Remaining: ${this.clients.size})`);
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Broadcast an event to all connected clients with deduplication.
   */
  public broadcast<T = unknown>(event: SSEEventType, data: T, customId?: string): void {
    const eventId = customId || `${event}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Deduplication check: ignore if identical event payload sent in last 500ms
    const payloadHash = `${event}:${JSON.stringify(data)}`;
    const now = Date.now();
    const lastSent = this.recentEvents.get(payloadHash);
    if (lastSent && now - lastSent < 500) {
      return;
    }
    this.recentEvents.set(payloadHash, now);
    this.cleanupDeduplicationCache(now);

    const message: SSEMessage<T> = {
      event,
      data,
      id: eventId,
    };

    const formatted = this.formatSSE(message);

    for (const [clientId, client] of this.clients.entries()) {
      try {
        client.send(formatted);
      } catch (err) {
        console.warn(`Failed to send SSE to ${clientId}, removing client:`, err);
        this.removeClient(clientId);
      }
    }
  }

  private sendToClient(client: SSEClient, message: SSEMessage): void {
    try {
      client.send(this.formatSSE(message));
    } catch {
      this.removeClient(client.id);
    }
  }

  private formatSSE(msg: SSEMessage): string {
    let out = "";
    if (msg.id) out += `id: ${msg.id}\n`;
    out += `event: ${msg.event}\n`;
    out += `data: ${JSON.stringify(msg.data)}\n\n`;
    return out;
  }

  private startHeartbeat(): void {
    // Send ping every 15 seconds to keep HTTP connections alive
    this.heartbeatInterval = setInterval(() => {
      if (this.clients.size === 0) return;

      const pingMsg = this.formatSSE({
        event: "system.ping",
        data: {
          timestamp: new Date().toISOString(),
          activeClients: this.clients.size,
        },
      });

      for (const [clientId, client] of this.clients.entries()) {
        try {
          client.send(pingMsg);
        } catch {
          this.removeClient(clientId);
        }
      }
    }, 15000);
  }

  private cleanupDeduplicationCache(now: number): void {
    if (this.recentEvents.size > 200) {
      for (const [key, timestamp] of this.recentEvents.entries()) {
        if (now - timestamp > 10000) {
          this.recentEvents.delete(key);
        }
      }
    }
  }

  public destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    for (const client of this.clients.values()) {
      client.close();
    }
    this.clients.clear();
  }
}
