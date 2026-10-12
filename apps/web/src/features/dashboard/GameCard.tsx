import React from "react";
import type { Game } from "@nba-live/shared";
import { Badge } from "@/components/ui/Badge";
import { formatGameClock } from "@/lib/utils";
import { MapPin, ChevronRight } from "lucide-react";

interface GameCardProps {
  game: Game;
  onClick?: () => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  const isLive = game.isLive;
  const isFinished = game.status === "FINISHED";
  const isScheduled = game.status === "SCHEDULED";

  const homeWinning = game.homeTeamScore > game.visitorTeamScore;
  const visitorWinning = game.visitorTeamScore > game.homeTeamScore;

  return (
    <div
      onClick={onClick}
      className={`glass-panel glass-card-hover rounded-xl p-4 cursor-pointer relative overflow-hidden transition-all border ${
        isLive ? "border-nba-red/50 shadow-[0_0_20px_rgba(238,26,59,0.15)]" : "border-border"
      }`}
    >
      {/* Top Header: Status & Clock */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          {isLive ? (
            <Badge variant="live">LIVE • {formatGameClock(game.period, game.clock)}</Badge>
          ) : isFinished ? (
            <Badge variant="outline" className="text-slate-400 bg-surface-100">
              Final
            </Badge>
          ) : (
            <Badge variant="secondary">{game.statusDetail || "Agendado"}</Badge>
          )}
        </div>
        {game.arena && (
          <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-[130px]">
            <MapPin className="w-3 h-3 text-slate-500" />
            {game.arena}
          </span>
        )}
      </div>

      {/* Teams and Scores Matrix */}
      <div className="space-y-2.5 my-2">
        {/* Visitor Team (Away) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {game.visitorTeam?.logoUrl ? (
              <img
                src={game.visitorTeam.logoUrl}
                alt={game.visitorTeam.abbreviation}
                className="w-7 h-7 object-contain drop-shadow"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: game.visitorTeam?.primaryColor || "#333" }}
              >
                {game.visitorTeam?.abbreviation?.substring(0, 2)}
              </div>
            )}
            <div>
              <span className={`text-sm font-semibold ${visitorWinning && (isLive || isFinished) ? "text-white" : "text-slate-300"}`}>
                {game.visitorTeam?.fullName || "Visitante"}
              </span>
              <span className="text-[11px] text-slate-500 ml-1.5 font-mono">
                {game.visitorTeam?.conference === "East" ? "LESTE" : "OESTE"}
              </span>
            </div>
          </div>
          <span
            className={`text-xl score-font transition-all ${
              isLive ? "text-red-400 font-extrabold" : visitorWinning && isFinished ? "text-white" : "text-slate-400"
            }`}
          >
            {isScheduled ? "-" : game.visitorTeamScore}
          </span>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {game.homeTeam?.logoUrl ? (
              <img
                src={game.homeTeam.logoUrl}
                alt={game.homeTeam.abbreviation}
                className="w-7 h-7 object-contain drop-shadow"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: game.homeTeam?.primaryColor || "#333" }}
              >
                {game.homeTeam?.abbreviation?.substring(0, 2)}
              </div>
            )}
            <div>
              <span className={`text-sm font-semibold ${homeWinning && (isLive || isFinished) ? "text-white" : "text-slate-300"}`}>
                {game.homeTeam?.fullName || "Mandante"}
              </span>
              <span className="text-[11px] text-slate-500 ml-1.5 font-mono">
                {game.homeTeam?.conference === "East" ? "LESTE" : "OESTE"}
              </span>
            </div>
          </div>
          <span
            className={`text-xl score-font transition-all ${
              isLive ? "text-red-400 font-extrabold" : homeWinning && isFinished ? "text-white" : "text-slate-400"
            }`}
          >
            {isScheduled ? "-" : game.homeTeamScore}
          </span>
        </div>
      </div>

      {/* Footer Info / Action */}
      <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-slate-400">
        <span>{isLive ? "Atualizado em tempo real via SSE" : isFinished ? "Partida Encerrada" : "Horário Local"}</span>
        <span className="flex items-center gap-0.5 text-slate-300 hover:text-white font-medium">
          Ver Estatísticas <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
