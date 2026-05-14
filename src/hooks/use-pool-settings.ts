import { useEffect, useState, useCallback } from "react";

export type PoolSettings = {
  poolTotal: number;
  winners: number;
};

const STORAGE_KEY = "novatrad.poolSettings";
const EVENT = "novatrad:pool-settings-changed";

export const DEFAULT_POOL_SETTINGS: PoolSettings = {
  poolTotal: 820000,
  winners: 100,
};

function read(): PoolSettings {
  if (typeof window === "undefined") return DEFAULT_POOL_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POOL_SETTINGS;
    const parsed = JSON.parse(raw);
    const poolTotal = Number(parsed.poolTotal);
    const winners = Number(parsed.winners);
    return {
      poolTotal: Number.isFinite(poolTotal) && poolTotal > 0 ? poolTotal : DEFAULT_POOL_SETTINGS.poolTotal,
      winners: Number.isFinite(winners) && winners > 0 ? Math.floor(winners) : DEFAULT_POOL_SETTINGS.winners,
    };
  } catch {
    return DEFAULT_POOL_SETTINGS;
  }
}

export function usePoolSettings() {
  const [settings, setSettings] = useState<PoolSettings>(DEFAULT_POOL_SETTINGS);

  useEffect(() => {
    setSettings(read());
    const onChange = () => setSettings(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = useCallback((next: Partial<PoolSettings>) => {
    const merged = { ...read(), ...next };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event(EVENT));
    setSettings(merged);
    return merged;
  }, []);

  const perWinner = settings.winners > 0 ? settings.poolTotal / settings.winners : 0;

  return { settings, update, perWinner };
}
