import React, { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { api } from "./services/api";
import { useGameEvents } from "./hooks/use-game-events";
import { Navbar } from "./components/layout/Navbar";
import { LiveTicker } from "./features/dashboard/LiveTicker";
import { GameCard } from "./features/dashboard/GameCard";
import { DateNavigator } from "./features/dashboard/DateNavigator";
import { GameDetailModal } from "./features/games/GameDetailModal";
import { StandingsTable } from "./features/standings/StandingsTable";
import { TeamsView } from "./features/teams/TeamsView";
import { PlayersView } from "./features/players/PlayersView";
import type { Game } from "@nba-live/shared";
import { Calendar, Radio, Flame, Sparkles } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

function MainDashboardContent() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "teams" | "players" | "standings">("dashboard");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>(() => new Date().toISOString().split("T")[0]);

  // Hook up real-time SSE events
  const sseState = useGameEvents();

  // Query Live Games
  const { data: liveGames = [] } = useQuery({
    queryKey: ["games", "live"],
    queryFn: () => api.getLiveGames(),
    refetchInterval: 12000,
  });

  // Query Games by chosen Date
  const { data: dateGames = [], isLoading: isLoadingGames } = useQuery({
    queryKey: ["games", "list", currentDate],
    queryFn: () => api.getGames({ date: currentDate }),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-nba-red selection:text-white">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} sseState={sseState} />

      {/* Real-time SSE Notification Banner */}
      {sseState.recentEvent && (
        <div className="bg-nba-red/10 border-b border-nba-red/30 py-2 px-4 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-2 h-2 rounded-full bg-nba-red animate-ping" />
              <span className="font-semibold text-red-400 uppercase font-mono">
                SSE Live Broadcast:
              </span>
              <span>{sseState.recentEvent.summary}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              {new Date(sseState.recentEvent.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Hero Live Matches Ticker */}
            <LiveTicker
              games={liveGames}
              onSelectGame={(g) => setSelectedGameId(g.id)}
            />

            {/* Date-based Games Schedule & Results */}
            <div className="space-y-4">
              <DateNavigator
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                gameCount={dateGames.length}
              />

              {isLoadingGames ? (
                <div className="py-16 text-center text-slate-400">
                  Carregando partidas...
                </div>
              ) : dateGames.length === 0 ? (
                <div className="glass-panel p-10 rounded-xl text-center text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="font-medium text-sm">Nenhuma partida registrada para esta data.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Navegue pelos botões anteriores/próximos para visualizar os jogos e resultados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dateGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onClick={() => setSelectedGameId(game.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "teams" && <TeamsView />}
        {activeTab === "players" && <PlayersView />}
        {activeTab === "standings" && <StandingsTable />}
      </main>

      {/* Modal for Game Details & Box Score */}
      <GameDetailModal
        gameId={selectedGameId}
        onClose={() => setSelectedGameId(null)}
      />

      {/* Footer */}
      <footer className="border-t border-border/60 bg-surface-300 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">NBA LIVE ARCHITECTURE</span>
            <span>•</span>
            <span>Bun + Hono + Drizzle ORM + PostgreSQL + SSE + React + Vite</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/docs" target="_blank" className="hover:text-slate-300">
              OpenAPI Swagger
            </a>
            <a href="/health" target="_blank" className="hover:text-slate-300">
              Health Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainDashboardContent />
    </QueryClientProvider>
  );
}
