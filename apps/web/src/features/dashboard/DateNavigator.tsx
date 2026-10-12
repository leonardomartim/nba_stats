import React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DateNavigatorProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  gameCount?: number;
}

export function DateNavigator({ currentDate, onDateChange, gameCount }: DateNavigatorProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    onDateChange(todayStr);
  };

  const formatDisplayDate = (dStr: string) => {
    try {
      const [y, m, d] = dStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border/80">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-bold text-white capitalize">
          {formatDisplayDate(currentDate)}
        </h3>
        {gameCount !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-slate-300 font-mono border border-border">
            {gameCount} {gameCount === 1 ? "jogo" : "jogos"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {currentDate !== todayStr && (
          <Button variant="secondary" size="sm" onClick={handleToday}>
            Hoje
          </Button>
        )}
        <Button variant="outline" size="icon" onClick={handlePrevDay} title="Dia anterior">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="relative">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="bg-surface-100 text-slate-200 border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-nba-red cursor-pointer font-mono"
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleNextDay} title="Próximo dia">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
