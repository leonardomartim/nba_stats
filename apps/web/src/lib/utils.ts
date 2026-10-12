import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGameClock(period: number, clock?: string | null): string {
  if (clock && clock !== "00:00") {
    return `Q${period} ${clock}`;
  }
  if (period > 4) {
    return `OT${period - 4}`;
  }
  if (period > 0) {
    return `Q${period}`;
  }
  return "Agendado";
}

export function formatDateToLocal(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}
