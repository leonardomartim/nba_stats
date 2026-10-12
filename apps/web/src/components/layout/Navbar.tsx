import React, { useState } from "react";
import { Activity, Radio, Sparkles, ExternalLink } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { api } from "@/services/api";
import type { SSEConnectionState } from "@/hooks/use-game-events";

interface NavbarProps {
  activeTab: "dashboard" | "teams" | "players" | "standings";
  onTabChange: (tab: "dashboard" | "teams" | "players" | "standings") => void;
  sseState: SSEConnectionState;
}

export function Navbar({ activeTab, onTabChange, sseState }: NavbarProps) {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleTriggerSimulate = async () => {
    try {
      setIsSimulating(true);
      // Trigger 3 points for live game 1 (LAL vs GSW)
      await api.simulateScore("game_live_1", "home", 3);
    } catch (err) {
      console.error("Simulation trigger failed:", err);
    } finally {
      setTimeout(() => setIsSimulating(false), 500);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => onTabChange("dashboard")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-nba-red to-red-500 flex items-center justify-center shadow-lg shadow-nba-red/30 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-white text-base tracking-tighter score-font">
                NBA
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-lg tracking-tight">LIVE</span>
                <span className="text-xs px-1.5 py-0.2 font-semibold uppercase bg-surface-100 text-nba-red rounded border border-nba-red/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block">
                Server-Sent Events & API Engine
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-surface-50 text-white font-semibold shadow-inner border border-border"
                  : "text-slate-400 hover:text-white hover:bg-surface-100/50"
              }`}
            >
              Jogos & Placares
            </button>
            <button
              onClick={() => onTabChange("teams")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "teams"
                  ? "bg-surface-50 text-white font-semibold shadow-inner border border-border"
                  : "text-slate-400 hover:text-white hover:bg-surface-100/50"
              }`}
            >
              Equipes
            </button>
            <button
              onClick={() => onTabChange("players")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "players"
                  ? "bg-surface-50 text-white font-semibold shadow-inner border border-border"
                  : "text-slate-400 hover:text-white hover:bg-surface-100/50"
              }`}
            >
              Jogadores
            </button>
            <button
              onClick={() => onTabChange("standings")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "standings"
                  ? "bg-surface-50 text-white font-semibold shadow-inner border border-border"
                  : "text-slate-400 hover:text-white hover:bg-surface-100/50"
              }`}
            >
              Classificação
            </button>
          </nav>
        </div>

        {/* Right Controls: SSE Status, Simulate Button, API Swagger */}
        <div className="flex items-center gap-3">
          {/* SSE Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100/90 border border-border/80 text-xs">
            <Radio
              className={`w-3.5 h-3.5 ${
                sseState.isConnected
                  ? "text-emerald-400 animate-pulse"
                  : "text-amber-400 animate-spin"
              }`}
            />
            <span className="font-mono text-[11px] text-slate-300">
              {sseState.isConnected ? "SSE Ativo" : "Reconectando..."}
            </span>
          </div>

          {/* Instant Simulation Trigger Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTriggerSimulate}
            disabled={isSimulating}
            className="border-nba-red/40 hover:border-nba-red text-xs hover:text-white"
            title="Dispara um lance ao vivo na API para testar atualização em tempo real via SSE"
          >
            <Sparkles className="w-3.5 h-3.5 text-nba-red" />
            <span className="hidden sm:inline">Testar Lance (+3 PTS)</span>
            <span className="sm:hidden">+3 PTS</span>
          </Button>

          {/* Swagger API Link */}
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-100 transition-colors"
            title="Abrir documentação OpenAPI / Swagger"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-border/60 bg-surface-300 py-2 px-2 text-xs">
        <button
          onClick={() => onTabChange("dashboard")}
          className={`px-2 py-1 rounded ${activeTab === "dashboard" ? "text-nba-red font-bold" : "text-slate-400"}`}
        >
          Jogos
        </button>
        <button
          onClick={() => onTabChange("teams")}
          className={`px-2 py-1 rounded ${activeTab === "teams" ? "text-nba-red font-bold" : "text-slate-400"}`}
        >
          Equipes
        </button>
        <button
          onClick={() => onTabChange("players")}
          className={`px-2 py-1 rounded ${activeTab === "players" ? "text-nba-red font-bold" : "text-slate-400"}`}
        >
          Jogadores
        </button>
        <button
          onClick={() => onTabChange("standings")}
          className={`px-2 py-1 rounded ${activeTab === "standings" ? "text-nba-red font-bold" : "text-slate-400"}`}
        >
          Tabela
        </button>
      </div>
    </header>
  );
}
