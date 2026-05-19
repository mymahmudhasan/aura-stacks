import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";

const PAIRS = [
  { symbol: "FX:EURUSD", label: "EUR / USD" },
  { symbol: "FX:GBPUSD", label: "GBP / USD" },
  { symbol: "FX:USDJPY", label: "USD / JPY" },
  { symbol: "OANDA:XAUUSD", label: "Gold / USD" },
  { symbol: "BINANCE:BTCUSDT", label: "BTC / USDT" },
  { symbol: "BINANCE:ETHUSDT", label: "ETH / USDT" },
];

/**
 * Live market chart powered by TradingView's public advanced-chart widget.
 * No API key required. Streams real-time forex + crypto data.
 */
export function LiveForexChart() {
  const [symbol, setSymbol] = useState(PAIRS[0].symbol);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      backgroundColor: "rgba(10, 14, 23, 0)",
      gridColor: "rgba(120, 140, 180, 0.08)",
      allow_symbol_change: true,
      hide_side_toolbar: false,
      studies: ["STD;EMA", "STD;RSI"],
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div className="rounded-3xl glass-strong border border-primary/20 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Live Market · Real-time</span>
          <Activity className="w-4 h-4 text-primary ml-1" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PAIRS.map((p) => (
            <button
              key={p.symbol}
              onClick={() => setSymbol(p.symbol)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                symbol === p.symbol
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "glass hover:bg-primary/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full h-[480px] md:h-[560px] lg:h-[620px]"
      />
      <p className="text-[10px] text-muted-foreground text-center py-2 border-t border-border/40">
        Market data by TradingView · 15-min candles · EMA &amp; RSI overlays
      </p>
    </div>
  );
}
