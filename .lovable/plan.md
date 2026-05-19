## Goal
The Live Market chart section is too tall because `LiveForexChart` forces huge viewport-based heights (`h-[85vh] min-h-[800px]` up to `min-h-[1200px]`). The wrapping section grows with it. Make the chart a reasonable fixed height so the section auto-fits.

## Change
Single file: `src/components/LiveForexChart.tsx`

Replace the chart container height classes:

- Before: `className="tradingview-widget-container w-full h-[85vh] min-h-[800px] sm:h-[90vh] sm:min-h-[950px] md:h-[92vh] md:min-h-[1100px] lg:h-[90vh] lg:min-h-[1200px]"`
- After: `className="tradingview-widget-container w-full h-[480px] md:h-[560px] lg:h-[620px]"`

This gives the chart a sensible bounded height; the surrounding section (header + chart + footer) will then size naturally to match. No other files need to change — the parent section in `src/routes/index.tsx` already uses auto height and just wraps the chart.

## Out of scope
No changes to colors, layout, or other sections.