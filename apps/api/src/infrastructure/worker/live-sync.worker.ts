import type { NBADataProvider } from "../../providers/nba-provider.interface";
import type { IGameRepository } from "../../modules/games/games.repository";
import { SSEHub } from "../sse/sse-hub";
import type { Game } from "@nba-live/shared";

export class LiveSyncWorker {
  private timer: Timer | null = null;
  private isRunning = false;
  private lastKnownGames: Map<string, Game> = new Map();

  constructor(
    private readonly provider: NBADataProvider,
    private readonly gameRepo: IGameRepository,
    private readonly sseHub: SSEHub,
    private readonly intervalMs: number = 10000
  ) {}

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(
      `🔄 [LiveSyncWorker] Started polling provider (${this.provider.name}) every ${this.intervalMs}ms`
    );

    // Initial sync
    await this.syncCycle();

    this.timer = setInterval(async () => {
      try {
        await this.syncCycle();
      } catch (err) {
        console.error("❌ [LiveSyncWorker] Error during sync cycle:", err);
      }
    }, this.intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log("🛑 [LiveSyncWorker] Stopped.");
  }

  public async syncCycle(): Promise<void> {
    const startTime = Date.now();
    try {
      const liveGames = await this.provider.getLiveGames();

      for (const fresh of liveGames) {
        const prev = this.lastKnownGames.get(fresh.id);

        if (!prev) {
          // First time seeing this game in memory
          this.lastKnownGames.set(fresh.id, JSON.parse(JSON.stringify(fresh)));
          await this.gameRepo.upsertGame(fresh);
          continue;
        }

        // 1. Detect game started
        if (!prev.isLive && fresh.isLive) {
          console.log(`📣 [LiveSync] Game Started: ${fresh.id}`);
          this.sseHub.broadcast("game.started", {
            gameId: fresh.id,
            game: fresh,
            timestamp: new Date().toISOString(),
          });
        }

        // 2. Detect period change
        if (prev.period !== fresh.period) {
          console.log(`📣 [LiveSync] Period changed: ${fresh.id} (Q${prev.period} -> Q${fresh.period})`);
          this.sseHub.broadcast("game.period.changed", {
            gameId: fresh.id,
            period: fresh.period,
            periodName: `Quarter ${fresh.period}`,
            homeTeamScore: fresh.homeTeamScore,
            visitorTeamScore: fresh.visitorTeamScore,
            timestamp: new Date().toISOString(),
          });
        }

        // 3. Detect score updates
        if (
          prev.homeTeamScore !== fresh.homeTeamScore ||
          prev.visitorTeamScore !== fresh.visitorTeamScore ||
          prev.clock !== fresh.clock
        ) {
          console.log(
            `📣 [LiveSync] Score updated: ${fresh.homeTeamScore} - ${fresh.visitorTeamScore} (${fresh.clock})`
          );
          this.sseHub.broadcast("game.score.updated", {
            gameId: fresh.id,
            period: fresh.period,
            clock: fresh.clock,
            homeTeamScore: fresh.homeTeamScore,
            visitorTeamScore: fresh.visitorTeamScore,
            scores: fresh.scores,
            timestamp: new Date().toISOString(),
          });
        }

        // 4. Detect game finished
        if (fresh.status === "FINISHED" && prev.status !== "FINISHED") {
          console.log(`🏆 [LiveSync] Game Finished: ${fresh.id}`);
          this.sseHub.broadcast("game.finished", {
            gameId: fresh.id,
            game: fresh,
            timestamp: new Date().toISOString(),
          });
        }

        // Update database and in-memory cache
        await this.gameRepo.upsertGame(fresh);
        this.lastKnownGames.set(fresh.id, JSON.parse(JSON.stringify(fresh)));
      }
    } catch (err: any) {
      console.warn(`[LiveSyncWorker] Sync poll warning: ${err.message}`);
    }
  }
}
