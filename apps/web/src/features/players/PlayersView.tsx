import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Modal } from "@/components/ui/Modal";
import type { Player } from "@nba-live/shared";
import { Search, User, Award, Shield } from "lucide-react";

export function PlayersView() {
  const [search, setSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players", search],
    queryFn: () => api.getPlayers({ search: search || undefined, limit: 30 }),
  });

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-nba-red" />
            Atletas da NBA
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pesquise estrelas da liga, estatísticas físicas e elencos
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome do jogador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-100 text-slate-200 border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-nba-red placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Players Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">Buscando atletas...</div>
      ) : players.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm">
          Nenhum atleta encontrado para os critérios de busca.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {players.map((player) => (
            <div
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              className="glass-panel glass-card-hover rounded-xl p-5 border border-border/80 cursor-pointer relative overflow-hidden group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-3">
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.fullName}
                      className="w-14 h-14 rounded-full object-cover bg-surface-100 border border-border"
                      onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center font-bold text-base text-slate-300">
                      {player.firstName[0]}
                      {player.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-red-400 transition-colors leading-tight">
                      {player.fullName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      #{player.jerseyNumber || "-"} • {player.position || "G-F"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-300 mt-2">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span>{player.team?.fullName || "Equipe NBA"}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{player.height ? `Alt: ${player.height}` : "Altura: N/D"}</span>
                <span>{player.country || "EUA"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Player Bio Modal */}
      {selectedPlayer && (
        <Modal
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          title={selectedPlayer.fullName}
          subtitle={`Camisa #${selectedPlayer.jerseyNumber || "-"} • ${selectedPlayer.team?.fullName}`}
          maxWidth="md"
        >
          <div className="space-y-6 text-center">
            {selectedPlayer.avatarUrl && (
              <img
                src={selectedPlayer.avatarUrl}
                alt={selectedPlayer.fullName}
                className="w-28 h-28 rounded-full object-cover mx-auto bg-surface-100 border-2 border-nba-red shadow-xl shadow-nba-red/20"
              />
            )}
            <div>
              <h3 className="text-xl font-bold text-white">{selectedPlayer.fullName}</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                {selectedPlayer.team?.fullName} ({selectedPlayer.team?.abbreviation})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left font-mono text-xs">
              <div className="p-3 rounded-lg bg-surface-100 border border-border">
                <span className="text-slate-500 block text-[10px]">POSIÇÃO</span>
                <span className="text-white font-semibold">{selectedPlayer.position || "G-F"}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-100 border border-border">
                <span className="text-slate-500 block text-[10px]">NÚMERO</span>
                <span className="text-white font-semibold">#{selectedPlayer.jerseyNumber || "-"}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-100 border border-border">
                <span className="text-slate-500 block text-[10px]">ALTURA</span>
                <span className="text-white font-semibold">{selectedPlayer.height || "N/D"}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-100 border border-border">
                <span className="text-slate-500 block text-[10px]">PESO</span>
                <span className="text-white font-semibold">{selectedPlayer.weight ? `${selectedPlayer.weight} lbs` : "N/D"}</span>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-surface-100 border border-border">
                <span className="text-slate-500 block text-[10px]">UNIVERSIDADE / ORIGEM</span>
                <span className="text-white font-semibold">{selectedPlayer.college || selectedPlayer.country || "Estados Unidos"}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
