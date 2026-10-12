import { useEffect, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Game, SSEEventType, ScoreUpdatePayload } from "@nba-live/shared";

export interface SSEConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastPing: string | null;
  recentEvent: { type: string; summary: string; timestamp: string } | null;
  reconnectAttempts: number;
}

export function useGameEvents() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SSEConnectionState>({
    isConnected: false,
    isConnecting: true,
    lastPing: null,
    recentEvent: null,
    reconnectAttempts: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState((prev) => ({ ...prev, isConnecting: true }));

    const es = new EventSource("/api/v1/events/games");
    eventSourceRef.current = es;

    es.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
      }));
      console.log("⚡ [SSE] Connected to NBA Live real-time stream.");
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      reconnectAttemptsRef.current += 1;

      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        reconnectAttempts: reconnectAttemptsRef.current,
      }));

      // Exponential backoff reconnect: 2s, 4s, 8s, max 15s
      const delay = Math.min(15000, 2000 * Math.pow(1.5, reconnectAttemptsRef.current));
      console.warn(`⚠️ [SSE] Connection dropped. Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})...`);

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    // 1. Heartbeat
    es.addEventListener("system.ping", (event) => {
      try {
        const data = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          isConnected: true,
          lastPing: data.timestamp || new Date().toISOString(),
        }));
      } catch {}
    });

    // 2. Score Update
    es.addEventListener("game.score.updated", (event) => {
      try {
        const payload: ScoreUpdatePayload = JSON.parse(event.data);
        console.log("🏀 [SSE Event] game.score.updated:", payload);

        setState((prev) => ({
          ...prev,
          recentEvent: {
            type: "game.score.updated",
            summary: `Placar atualizado: ${payload.homeTeamScore} - ${payload.visitorTeamScore} (${payload.clock || "Q" + payload.period})`,
            timestamp: payload.timestamp,
          },
        }));

        // Granular TanStack Query cache mutation for Live Games
        queryClient.setQueryData<Game[]>(["games", "live"], (oldGames) => {
          if (!oldGames) return oldGames;
          return oldGames.map((g) => {
            if (g.id === payload.gameId) {
              return {
                ...g,
                homeTeamScore: payload.homeTeamScore,
                visitorTeamScore: payload.visitorTeamScore,
                period: payload.period,
                clock: payload.clock,
                scores: payload.scores || g.scores,
              };
            }
            return g;
          });
        });

        // Granular mutation for specific game query
        queryClient.setQueryData<Game>(["game", payload.gameId], (oldGame) => {
          if (!oldGame) return oldGame;
          return {
            ...oldGame,
            homeTeamScore: payload.homeTeamScore,
            visitorTeamScore: payload.visitorTeamScore,
            period: payload.period,
            clock: payload.clock,
            scores: payload.scores || oldGame.scores,
          };
        });

        // Softly invalidate generic games list
        queryClient.invalidateQueries({ queryKey: ["games", "list"], refetchType: "none" });
      } catch (err) {
        console.error("Failed to parse score update SSE:", err);
      }
    });

    // 3. Period Changed
    es.addEventListener("game.period.changed", (event) => {
      try {
        const payload = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          recentEvent: {
            type: "game.period.changed",
            summary: `Mudança de período: ${payload.periodName}`,
            timestamp: payload.timestamp,
          },
        }));
        queryClient.invalidateQueries({ queryKey: ["games"] });
      } catch {}
    });

    // 4. Game Started
    es.addEventListener("game.started", (event) => {
      try {
        const payload = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          recentEvent: {
            type: "game.started",
            summary: `Partida iniciada!`,
            timestamp: payload.timestamp,
          },
        }));
        queryClient.invalidateQueries({ queryKey: ["games"] });
      } catch {}
    });

    // 5. Game Finished
    es.addEventListener("game.finished", (event) => {
      try {
        const payload = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          recentEvent: {
            type: "game.finished",
            summary: `Partida encerrada!`,
            timestamp: payload.timestamp,
          },
        }));
        queryClient.invalidateQueries({ queryKey: ["games"] });
        queryClient.invalidateQueries({ queryKey: ["standings"] });
      } catch {}
    });
  }, [queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return state;
}
