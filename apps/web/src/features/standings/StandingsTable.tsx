import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/Badge";
import type { TeamStanding } from "@nba-live/shared";
import { Trophy, TrendingUp } from "lucide-react";

export function StandingsTable() {
  const [conferenceTab, setConferenceTab] = useState<"all" | "East" | "West">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["standings", 2024],
    queryFn: () => api.getStandings(2024),
  });

  const east = data?.east || [];
  const west = data?.west || [];

  const renderConferenceTable = (title: string, list: TeamStanding[]) => (
    <div className="glass-panel rounded-xl border border-border/80 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-border/70 bg-surface-100/60 flex items-center justify-between">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          {title}
        </h3>
        <span className="text-xs text-slate-400 font-mono">Temporada 2024-25</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-surface-300/80 text-slate-400 border-b border-border text-center">
              <th className="py-3 px-3 text-left font-sans"># Equipe</th>
              <th className="py-3 px-2 font-bold text-white">V</th>
              <th className="py-3 px-2">D</th>
              <th className="py-3 px-2">%</th>
              <th className="py-3 px-2">DIF</th>
              <th className="py-3 px-2 hidden sm:table-cell">Casa</th>
              <th className="py-3 px-2 hidden sm:table-cell">Fora</th>
              <th className="py-3 px-2 hidden md:table-cell">Últ. 10</th>
              <th className="py-3 px-2">Seq</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-center">
            {list.map((st, idx) => {
              const rank = st.conferenceRank || idx + 1;
              const isPlayoffDirect = rank <= 6;
              const isPlayIn = rank > 6 && rank <= 10;

              return (
                <tr
                  key={st.id}
                  className={`hover:bg-surface-100/40 transition-colors ${
                    isPlayoffDirect
                      ? "border-l-2 border-l-emerald-500"
                      : isPlayIn
                      ? "border-l-2 border-l-amber-500"
                      : "border-l-2 border-l-transparent"
                  }`}
                >
                  <td className="py-3 px-3 text-left font-sans flex items-center gap-3">
                    <span
                      className={`text-xs font-bold w-4 text-center ${
                        isPlayoffDirect ? "text-emerald-400" : isPlayIn ? "text-amber-400" : "text-slate-500"
                      }`}
                    >
                      {rank}
                    </span>
                    {st.team?.logoUrl ? (
                      <img
                        src={st.team.logoUrl}
                        alt={st.team.abbreviation}
                        className="w-5 h-5 object-contain"
                        onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                      />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px]"
                        style={{ backgroundColor: st.team?.primaryColor || "#333" }}
                      >
                        {st.team?.abbreviation?.substring(0, 2)}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-white block text-sm leading-tight">
                        {st.team?.fullName || st.teamId}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {st.division} • {st.team?.abbreviation}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-bold text-white text-sm">{st.wins}</td>
                  <td className="py-3 px-2 text-slate-400">{st.losses}</td>
                  <td className="py-3 px-2 font-bold text-slate-200">
                    {st.winPct ? st.winPct.toFixed(3) : ".000"}
                  </td>
                  <td className="py-3 px-2 text-slate-400">
                    {st.gamesBehind === 0 ? "-" : st.gamesBehind}
                  </td>
                  <td className="py-3 px-2 text-slate-400 hidden sm:table-cell">{st.homeRecord}</td>
                  <td className="py-3 px-2 text-slate-400 hidden sm:table-cell">{st.awayRecord}</td>
                  <td className="py-3 px-2 text-slate-400 hidden md:table-cell">{st.lastTen}</td>
                  <td className="py-3 px-2 font-semibold">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        st.streak.startsWith("W")
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60"
                          : "bg-rose-950/60 text-rose-400 border border-rose-900/60"
                      }`}
                    >
                      {st.streak}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-surface-200 border-t border-border/40 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            1-6 Playoffs Diretos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            7-10 Torneio Play-In
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-nba-red" />
            Classificação da NBA
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tabela de aproveitamento e chaveamento para os Playoffs por conferência
          </p>
        </div>

        <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl border border-border">
          <button
            onClick={() => setConferenceTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              conferenceTab === "all" ? "bg-nba-red text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Ambas Conferências
          </button>
          <button
            onClick={() => setConferenceTab("East")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              conferenceTab === "East" ? "bg-nba-red text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Leste
          </button>
          <button
            onClick={() => setConferenceTab("West")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              conferenceTab === "West" ? "bg-nba-red text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Oeste
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400">Carregando classificação oficial...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(conferenceTab === "all" || conferenceTab === "East") &&
            renderConferenceTable("Conferência Leste", east)}
          {(conferenceTab === "all" || conferenceTab === "West") &&
            renderConferenceTable("Conferência Oeste", west)}
        </div>
      )}
    </div>
  );
}
