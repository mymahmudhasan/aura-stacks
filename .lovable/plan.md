## Plan — 4 dashboard / site polish fixes

### 1. Show 6 decimal digits on dashboard amounts
File: `src/routes/dashboard.tsx`

- Update the 5 Stat cards (Total Balance, Portfolio Equity, Earnings Today, Earnings + Invested, Pending Withdrawals) to format with 6 fraction digits: `toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })`.
- Apply the same 6‑digit formatting to the "+$X earned" live accrual badge inside the featured Active Package card (line 294) so the ticker visibly increments cent‑by‑cent.

### 2. Make the Active Package sub‑line understandable
File: `src/routes/dashboard.tsx` (line 277‑279)

Current: `Staking · $50 @ 1.000% / Day`
New, plain‑English, multi‑chip layout:
> **Staking plan** • **Invested:** $50 • **Daily profit:** 1.000% • **Duration:** 30 days
Render the labels in `text-muted-foreground` and the values in `text-foreground font-semibold`, wrapped with `flex-wrap gap-x-2`. Pull duration from `ends_at − started_at`.

### 3. Color the auto‑invest package details green
File: `src/components/QuickInvestModal.tsx`

- Change the ROI line (line 218) from `text-primary` to `text-success` and add a subtle `bg-success/10` chip wrapper.
- Change the min/max + duration row (line 219‑222) from `text-muted-foreground` to `text-success/80` so each package card's stats clearly stand out in green.
- Update the small recap under the amount input (line 255‑258) icon + text to all `text-success`.

### 4. Remove Bangladesh office, replace with a European country
File: `src/components/Layout.tsx` (line 118)

Replace the Bangladesh entry with **Germany — Berlin Hub**:
```
{ country: "Germany", city: "Berlin Hub", flag: "🇩🇪",
  address: "Friedrichstraße 68, 10117 Berlin", phone: "+49 30 994 0088" }
```
(No other office entries change.)

### 5. Add Google voice input to the live chat widget
File: `src/components/WhatsAppWidget.tsx`

- Add a microphone button beside the text input that uses the browser's Web Speech API (`window.SpeechRecognition || window.webkitSpeechRecognition`, the engine Chrome ships powered by Google).
- Behavior:
  - Click mic → request mic permission, start recognition (`lang = navigator.language`, `interimResults = true`).
  - Live‑append the interim transcript into the message textbox; on `onresult` final, keep the text so the user can review/edit before sending.
  - Click mic again (or auto‑stop on silence) to stop.
  - Visual states: idle (muted), listening (red pulsing ring + `Mic` icon swap to `MicOff`).
  - Gracefully hide the button if the API is unavailable (e.g. Firefox/iOS) and show a tooltip "Voice input not supported in this browser".
- No backend changes; everything runs client‑side.

### Out of scope
No DB migrations, no changes to investment logic, no changes to other routes.
