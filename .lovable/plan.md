## Goal
Make the LiveForexChart tall enough to display the full TradingView toolbar and all indicator features without cramping.

## Change
In `src/components/LiveForexChart.tsx` (line 85), replace the container height:

- From: `h-[480px] md:h-[560px] lg:h-[620px]`
- To: `h-[640px] md:h-[760px] lg:h-[860px]`

This gives enough vertical room for the top toolbar, side drawing tools, main candle area, EMA/RSI sub-panels, and the bottom timeframe bar to all render fully.

## Out of scope
- No changes to colors, layout, surrounding section, or chart configuration.
- Section height stays auto — it grows naturally with the new chart height.
