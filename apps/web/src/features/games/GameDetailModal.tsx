import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatGameClock } from "@/lib/utils";
import type { Game } from "@nba-live/shared";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Radio, PlusCircle, Activity } from "lucide-react";

interface GameDetailModalProps {
  gameId: string | null;
  onClose: () => void;
}

export function GameDetailModal({ gameId, onClose }: GameDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"boxscore" | "stats" | "comparison">("boxscore");

  const { data, isLoading } = useQuery({
    queryKey: ["game", "stats", gameId],
    queryFn: () => (gameId ? api.getGameStats(gameId) : null),
    enabled: !!gameId,
    refetchInterval: 10000,
  });

  if (!gameId) return null;

  const game = data?.game;
  const players = data?.players || [];
  const teamComparison = data?.teamComparison;

  const handleSimulateGameScore = async (team: "home" | "visitor", pts: number) => {
    try {
      await api.simulateScore(gameId, team, pts);
    } catch (e) {
      console.error(e);
    }
  };

  // Prepare chart comparison data
  const comparisonData = teamComparison
    ? [
        {
          name: "Aprov. FG %",
          [game?.visitorTeam?.abbreviation || "Visitante"]: teamComparison.visitor.fgPct,
          [game?.homeTeam?.abbreviation || "Mandante"]: teamComparison.home.fgPct,
        },
        {
          name: "Aprov. 3PT %",
          [game?.visitorTeam?.abbreviation || "Visitante"]: teamComparison.visitor.fg3Pct,
          [game?.homeTeam?.abbreviation || "Mandante"]: teamComparison.home.fg3Pct,
        },
        {
          name: "Aprov. LL %",
          [game?.visitorTeam?.abbreviation || "Visitante"]: teamComparison.visitor.ftPct,
          [game?.homeTeam?.abbreviation || "Mandante"]: teamComparison.home.ftPct,
        },
      ]
    : [];

  return (
    <Modal
      isOpen={!!gameId}
      onClose={onClose}
      title={game ? `${game.visitorTeam?.fullName} @ ${game.homeTeam?.fullName}` : "Detalhes da Partida"}
      subtitle={game ? `${game.arena || "NBA Arena"} • Temporada ${game.season}` : undefined}
      maxWidth="4xl"
    >
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Carregando estatísticas detalhadas...</div>
      ) : game ? (
        <div className="space-y-6">
          {/* Main Scoreboard Header */}
          <div className="glass-panel p-6 rounded-2xl border border-border/80 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Visitor Team */}
            <div className="flex items-center gap-4 text-center md:text-left">
              {game.visitorTeam?.logoUrl ? (
                <img
                  src={game.visitorTeam.logoUrl}
                  alt={game.visitorTeam.abbreviation}
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl"
                  style={{ backgroundColor: game.visitorTeam?.primaryColor || "#333" }}
                >
                  {game.visitorTeam?.abbreviation}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{game.visitorTeam?.fullName}</h3>
                <p className="text-xs text-slate-400 font-mono">Conferência {game.visitorTeam?.conference}</p>
                {game.isLive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSimulateGameScore("visitor", 2)}
                    className="text-[11px] text-red-400 hover:text-red-300 mt-1 p-0 h-auto"
                  >
                    +2 PTS Visitante (Simular)
                  </Button>
                )}
              </div>
            </div>

            {/* Score Centerpiece */}
            <div className="text-center px-4">
              <div className="text-4xl score-font tracking-tight text-white mb-1 flex items-center justify-center gap-3">
                <span className="text-red-400">{game.visitorTeamScore}</span>
                <span className="text-slate-600">-</span>
                <span className="text-red-400">{game.homeTeamScore}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                {game.isLive ? (
                  <Badge variant="live">AO VIVO • {formatGameClock(game.period, game.clock)}</Badge>
                ) : (
                  <Badge variant="outline">{game.statusDetail || "Final"}</Badge>
                )}
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center gap-4 text-center md:text-right flex-row-reverse">
              {game.homeTeam?.logoUrl ? (
                <img
                  src={game.homeTeam.logoUrl}
                  alt={game.homeTeam.abbreviation}
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl"
                  style={{ backgroundColor: game.homeTeam?.primaryColor || "#333" }}
                >
                  {game.homeTeam?.abbreviation}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{game.homeTeam?.fullName}</h3>
                <p className="text-xs text-slate-400 font-mono">Conferência {game.homeTeam?.conference}</p>
                {game.isLive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSimulateGameScore("home", 2)}
                    className="text-[11px] text-red-400 hover:text-red-300 mt-1 p-0 h-auto"
                  >
                    +2 PTS Mandante (Simular)
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Quarter Breakdown Table */}
          {game.scores && (
            <div className="glass-panel p-4 rounded-xl border border-border/80">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-nba-red" />
                Pontuação Por Quarto
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-sm font-mono">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-border/60">
                      <th className="text-left py-2 px-3 font-medium">Equipe</th>
                      <th className="py-2 px-3">Q1</th>
                      <th className="py-2 px-3">Q2</th>
                      <th className="py-2 px-3">Q3</th>
                      <th className="py-2 px-3">Q4</th>
                      {game.scores.home.ot > 0 && <th className="py-2 px-3">OT</th>}
                      <th className="py-2 px-3 font-bold text-white">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr>
                      <td className="text-left py-2 px-3 font-semibold text-slate-200">
                        {game.visitorTeam?.abbreviation}
                      </td>
                      <td className="py-2 px-3">{game.scores.visitor.q1}</td>
                      <td className="py-2 px-3">{game.scores.visitor.q2}</td>
                      <td className="py-2 px-3">{game.scores.visitor.q3}</td>
                      <td className="py-2 px-3">{game.scores.visitor.q4}</td>
                      {game.scores.home.ot > 0 && <td className="py-2 px-3">{game.scores.visitor.ot}</td>}
                      <td className="py-2 px-3 font-bold text-red-400">{game.visitorTeamScore}</td>
                    </tr>
                    <tr>
                      <td className="text-left py-2 px-3 font-semibold text-slate-200">
                        {game.homeTeam?.abbreviation}
                      </td>
                      <td className="py-2 px-3">{game.scores.home.q1}</td>
                      <td className="py-2 px-3">{game.scores.home.q2}</td>
                      <td className="py-2 px-3">{game.scores.home.q3}</td>
                      <td className="py-2 px-3">{game.scores.home.q4}</td>
                      {game.scores.home.ot > 0 && <td className="py-2 px-3">{game.scores.home.ot}</td>}
                      <td className="py-2 px-3 font-bold text-red-400">{game.homeTeamScore}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-border gap-2">
            <button
              onClick={() => setActiveTab("boxscore")}
              className={`pb-2.5 px-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "boxscore"
                  ? "border-nba-red text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Box Score dos Atletas
            </button>
            <button
              onClick={() => setActiveTab("comparison")}
              className={`pb-2.5 px-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "comparison"
                  ? "border-nba-red text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Comparativo de Estatísticas
            </button>
          </div>

          {/* Tab 1: Box Score */}
          {activeTab === "boxscore" && (
            <div className="space-y-4">
              {players.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Box score individual em processamento ou aguardando sincronização da súmula.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/80">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-100 text-slate-400 font-mono text-center border-b border-border">
                        <th className="text-left py-2.5 px-3 font-semibold">Jogador</th>
                        <th className="py-2.5 px-2">MIN</th>
                        <th className="py-2.5 px-2 font-bold text-white">PTS</th>
                        <th className="py-2.5 px-2">REB</th>
                        <th className="py-2.5 px-2">AST</th>
                        <th className="py-2.5 px-2">STL</th>
                        <th className="py-2.5 px-2">BLK</th>
                        <th className="py-2.5 px-2">FG</th>
                        <th className="py-2.5 px-2">3PT</th>
                        <th className="py-2.5 px-2">LL</th>
                        <th className="py-2.5 px-2">+/-</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-center">
                      {players.map((p) => (
                        <tr key={p.id} className="hover:bg-surface-100/50">
                          <td className="text-left py-2.5 px-3 font-sans font-medium text-slate-200 flex items-center gap-2">
                            {p.player?.avatarUrl && (
                              <img
                                src={p.player.avatarUrl}
                                alt={p.player.fullName}
                                className="w-6 h-6 rounded-full object-cover bg-surface-50"
                                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                              />
                            )}
                            <div>
                              <span>{p.player?.fullName || "Atleta"}</span>
                              <span className="text-[10px] text-slate-500 block">
                                #{p.player?.jerseyNumber || "-"} • {p.team?.abbreviation}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-slate-400">{p.min || "00:00"}</td>
                          <td className="py-2.5 px-2 font-bold text-white text-sm">{p.pts}</td>
                          <td className="py-2.5 px-2">{p.reb}</td>
                          <td className="py-2.5 px-2">{p.ast}</td>
                          <td className="py-2.5 px-2">{p.stl}</td>
                          <td className="py-2.5 px-2">{p.blk}</td>
                          <td className="py-2.5 px-2 text-slate-300">
                            {p.fgm}/{p.fga} ({p.fgPct}%)
                          </td>
                          <td className="py-2.5 px-2 text-slate-300">
                            {p.fg3m}/{p.fg3a} ({p.fg3Pct}%)
                          </td>
                          <td className="py-2.5 px-2 text-slate-300">
                            {p.ftm}/{p.fta}
                          </td>
                          <td
                            className={`py-2.5 px-2 font-bold ${
                              p.plusMinus > 0 ? "text-emerald-400" : p.plusMinus < 0 ? "text-rose-400" : "text-slate-400"
                            }`}
                          >
                            {p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Recharts Team Comparison */}
          {activeTab === "comparison" && teamComparison && (
            <div className="space-y-6">
              <div className="glass-panel p-5 rounded-xl border border-border/80">
                <h4 className="text-sm font-semibold text-white mb-4">
                  Eficiência de Arremessos (Porcentagem de Conversão)
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#11131c",
                          borderColor: "#1f2438",
                          borderRadius: 8,
                          color: "#fff",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey={game.visitorTeam?.abbreviation || "Visitante"}
                        fill={game.visitorTeam?.primaryColor || "#3b82f6"}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey={game.homeTeam?.abbreviation || "Mandante"}
                        fill={game.homeTeam?.primaryColor || "#ee1a3b"}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Side by Side Key Stats */}
              <div className="grid grid-cols-2 gap-4 text-center font-mono">
                <div className="glass-panel p-4 rounded-xl border border-border">
                  <span className="text-xs text-slate-400 block mb-1">Rebotes Totais</span>
                  <div className="text-lg font-bold text-white flex items-center justify-center gap-4">
                    <span>{teamComparison.visitor.reb}</span>
                    <span className="text-xs text-slate-500">vs</span>
                    <span>{teamComparison.home.reb}</span>
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-border">
                  <span className="text-xs text-slate-400 block mb-1">Assistências</span>
                  <div className="text-lg font-bold text-white flex items-center justify-center gap-4">
                    <span>{teamComparison.visitor.ast}</span>
                    <span className="text-xs text-slate-500">vs</span>
                    <span>{teamComparison.home.ast}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-slate-400">Partida não encontrada.</div>
      )}
    </Modal>
  );
}
