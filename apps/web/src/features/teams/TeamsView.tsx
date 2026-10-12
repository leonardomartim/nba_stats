import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Team, Game } from "@nba-live/shared";
import { Search, Shield, Calendar, Users } from "lucide-react";

export function TeamsView() {
  const [search, setSearch] = useState("");
  const [conferenceFilter, setConferenceFilter] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => api.getTeams(),
  });

  const { data: teamGames = [] } = useQuery({
    queryKey: ["team", "games", selectedTeam?.id],
    queryFn: () => (selectedTeam ? api.getTeamGames(selectedTeam.id) : []),
    enabled: !!selectedTeam,
  });

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.city.toLowerCase().includes(search.toLowerCase()) ||
      t.abbreviation.toLowerCase().includes(search.toLowerCase());
    const matchesConf = conferenceFilter === "all" || t.conference === conferenceFilter;
    return matchesSearch && matchesConf;
  });

  return (
    <div className="space-y-6">
      {/* Header and Search Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-nba-red" />
            Franquias da NBA
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Explore as 30 equipes oficiais da NBA, suas divisões e históricos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por equipe, cidade ou sigla..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-100 text-slate-200 border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-nba-red placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl border border-border">
            <button
              onClick={() => setConferenceFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                conferenceFilter === "all" ? "bg-nba-red text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setConferenceFilter("East")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                conferenceFilter === "East" ? "bg-nba-red text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Leste
            </button>
            <button
              onClick={() => setConferenceFilter("West")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                conferenceFilter === "West" ? "bg-nba-red text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Oeste
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Teams */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">Carregando equipes...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="glass-panel glass-card-hover rounded-xl p-5 border border-border/80 cursor-pointer relative overflow-hidden group"
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 transition-opacity group-hover:opacity-25"
                style={{ backgroundColor: team.primaryColor || "#333" }}
              />

              <div className="flex items-center gap-4 mb-4">
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt={team.fullName}
                    className="w-12 h-12 object-contain drop-shadow"
                    onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                    style={{ backgroundColor: team.primaryColor || "#222" }}
                  >
                    {team.abbreviation}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-red-400 transition-colors">
                    {team.fullName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {team.city} • {team.abbreviation}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{team.conference === "East" ? "Conferência Leste" : "Conferência Oeste"}</span>
                <span className="text-[11px] text-slate-500">{team.division}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <Modal
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
          title={selectedTeam.fullName}
          subtitle={`${selectedTeam.city} • Conferência ${selectedTeam.conference} (${selectedTeam.division})`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-4 rounded-xl bg-surface-100 border border-border">
              {selectedTeam.logoUrl && (
                <img
                  src={selectedTeam.logoUrl}
                  alt={selectedTeam.fullName}
                  className="w-20 h-20 object-contain"
                />
              )}
              <div>
                <h4 className="text-lg font-bold text-white">{selectedTeam.fullName}</h4>
                <p className="text-xs text-slate-400">Sigla: {selectedTeam.abbreviation}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: selectedTeam.primaryColor || "#333" }}
                    title="Cor Primária"
                  />
                  <span className="text-xs text-slate-300 font-mono">
                    Divisão {selectedTeam.division}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Games */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-nba-red" />
                Histórico & Calendário Recente
              </h4>
              {teamGames.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Nenhuma partida recente registrada para esta franquia.
                </div>
              ) : (
                <div className="space-y-2">
                  {teamGames.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-lg bg-surface-100 border border-border/60 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-slate-400">{g.date}</span>
                      <span className="font-semibold text-white">
                        {g.visitorTeam?.abbreviation} {g.visitorTeamScore} @ {g.homeTeam?.abbreviation} {g.homeTeamScore}
                      </span>
                      <span className="text-slate-400">{g.statusDetail || g.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
