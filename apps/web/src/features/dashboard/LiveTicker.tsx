import React from "react";
import type { Game } from "@nba-live/shared";
import { Badge } from "@/components/ui/Badge";
import { formatGameClock } from "@/lib/utils";
import { Radio, Zap } from "lucide-react";

interface LiveTickerProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
}

export function LiveTicker({ games, onSelectGame }: LiveTickerProps) {
  if (games.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-border/80 text-center flex flex-col items-center justify-center my-6">
        <Radio className="w-8 h-8 text-slate-500 mb-2 stroke-1" />
        <h4 className="text-slate-300 font-semibold text-sm">Nenhum jogo em andamento no momento</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Acompanhe os jogos agendados para hoje na seção abaixo ou utilize o botão de simulação para testar o streaming SSE.
        </p>
      </div>
    );
  }

  return (
    <div className="my-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-nba-red animate-ping" />
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Placares Ao Vivo <span className="text-xs text-red-400 font-mono font-normal">({games.length} JOGOS)</span>
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
          <Zap className="w-3.5 h-3.5 text-nba-red" />
          SSE Streaming Ativo
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() => onSelectGame(game)}
            className="glass-panel glass-card-hover rounded-xl p-5 border border-nba-red/30 relative overflow-hidden cursor-pointer shadow-lg shadow-black/40"
          >
            {/* Top Red Glow Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-nba-red via-red-500 to-amber-500 animate-pulse" />

            <div className="flex items-center justify-between mb-4">
              <Badge variant="live">
                AO VIVO • {formatGameClock(game.period, game.clock)}
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                {game.arena || "Arena Principal"}
              </span>
            </div>

            {/* Matchup Banner */}
            <div className="grid grid-cols-5 items-center gap-2 py-2">
              {/* Visitor Team */}
              <div className="col-span-2 flex items-center gap-3">
                {game.visitorTeam?.logoUrl ? (
                  <img
                    src={game.visitorTeam.logoUrl}
                    alt={game.visitorTeam.abbreviation}
                    className="w-10 h-10 object-contain drop-shadow"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: game.visitorTeam?.primaryColor || "#222" }}
                  >
                    {game.visitorTeam?.abbreviation?.substring(0, 2)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-white text-base leading-tight">
                    {game.visitorTeam?.abbreviation || "VIS"}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[90px]">
                    {game.visitorTeam?.city}
                  </div>
                </div>
              </div>

              {/* Central Score Display */}
              <div className="col-span-1 text-center">
                <div className="text-3xl score-font tracking-tight text-white flex items-center justify-center gap-1.5">
                  <span className="animate-score-bump text-red-400">{game.visitorTeamScore}</span>
                  <span className="text-slate-600 text-lg">-</span>
                  <span className="animate-score-bump text-red-400">{game.homeTeamScore}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                  {game.clock || "EM JOGO"}
                </div>
              </div>

              {/* Home Team */}
              <div className="col-span-2 flex items-center justify-end gap-3 text-right">
                <div>
                  <div className="font-bold text-white text-base leading-tight">
                    {game.homeTeam?.abbreviation || "HOM"}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[90px]">
                    {game.homeTeam?.city}
                  </div>
                </div>
                {game.homeTeam?.logoUrl ? (
                  <img
                    src={game.homeTeam.logoUrl}
                    alt={game.homeTeam.abbreviation}
                    className="w-10 h-10 object-contain drop-shadow"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: game.homeTeam?.primaryColor || "#222" }}
                  >
                    {game.homeTeam?.abbreviation?.substring(0, 2)}
                  </div>
                )}
              </div>
            </div>

            {/* Quarter Breakdown Mini Bar */}
            {game.scores && (
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Q1: {game.scores.visitor.q1}-{game.scores.home.q1}</span>
                <span>Q2: {game.scores.visitor.q2}-{game.scores.home.q2}</span>
                <span>Q3: {game.scores.visitor.q3}-{game.scores.home.q3}</span>
                <span>Q4: {game.scores.visitor.q4}-{game.scores.home.q4}</span>
                <span className="text-red-400 font-semibold">Ver Box Score →</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
