# all_day_v6.pine - Changelog

## HOTFIX: Entry Condition Bug (Post-Initial Release)

**Issue:** No trades were executing in backtesting.

**Root Cause:** Lines 199-200 had overly restrictive logic:
```pine
// BROKEN:
bool longCondition = ... and (isFlat or (isShortPos and allowSameBarReversal))
```

Since `allowSameBarReversal` defaults to `false`, the condition `(isShortPos and false)` always evaluates to `false`. This meant entries were ONLY allowed when flat - the strategy could never reverse positions.

**Fix:** Removed the unnecessary position check. The `allowSameBarReversal` guard already prevents same-bar close+reverse via `exitedThisBar` tracking. `strategy.entry()` automatically handles position reversals, and `pyramiding=0` prevents same-direction additions.

```pine
// FIXED:
bool longCondition = longSignalValid and canEnterThisBar and reversalAllowed
bool shortCondition = shortSignalValid and canEnterThisBar and reversalAllowed
```

**Additional Improvements:**
- Added warmup status and ATR_NA check to debug block reasons
- Added "Final Long/Short Cond" rows to debug table showing actual gated status
- Shortened debug labels to fit better in table

---

## PASS 0: v5 to v6 Migration

**Changes:**
- Updated version directive from `//@version=5` to `//@version=6`
- Added explicit type declarations for all variable definitions (`float`, `bool`, `int`, `string`, `color`) for v6 clarity and type safety
- No functional logic changes in this pass
- Verified all namespaces (`ta.*`, `math.*`, `strategy.*`, `barstate.*`, `request.*`) remain compatible with v6

**Notes:**
- Pine Script v6 is largely backward compatible with v5 for this script's features
- The `request.security()` call signature is unchanged
- All `input.*()` functions maintain the same syntax

---

## PASS 1: Bug Audit & Determinism

**New Inputs:**
- `allowSameBarReversal` (default: false) - Controls whether close+reverse can occur on the same candle
- `enableDebug` (default: false) - Enables debug table display

**Entry Lock System:**
- Added `lastEntryBar` tracking variable to prevent multiple entries on the same bar
- Added `lastExitBar` tracking to enable same-bar reversal control
- Added `lastEntryDir` to track direction of last entry

**Mutual Exclusion:**
- Long and short signals are now mutually exclusive - if both somehow fire simultaneously, neither will execute
- `longSignalValid = baseLongSignal and not baseShortSignal`
- `shortSignalValid = baseShortSignal and not baseLongSignal`

**Same-Bar Reversal Control:**
- When `allowSameBarReversal = false`, the strategy will not enter a new position on the same bar where it closed an existing position
- Prevents whipsaw behavior and "same candle chaos"

**VIX Filter Hardening:**
- Added `safeFloat()` helper function for NA coalescing
- `vixDataValid` now explicitly checks `not na(vixRaw)`
- `vixConditionPasses` has three-tier logic:
  1. If VIX filter disabled (`not useVIX`): passes
  2. If VIX data available and below threshold (or threshold is NA during warmup): passes
  3. If VIX data not available: passes (fail-open to not block trades)
- Early bar NA protection: When SMA hasn't warmed up, condition passes rather than blocking trades silently

**Indicator Warmup Check:**
- Added `indicatorsWarmedUp` check before any entry
- Requires `bar_index > max(atrLength, tsiVolatilityLookback, vwmaLength, volLookback, retestLookback) + 5`
- Prevents entries during indicator warmup period where values may be unreliable

---

## PASS 2: Exit Management Refactor

**Exit Order Caching:**
- Added cache variables for all Long exit parameters:
  - `cachedLongStop`, `cachedLongLimit`, `cachedLongTrailPrice`, `cachedLongTrailOffset`
- Added cache variables for all Short exit parameters:
  - `cachedShortStop`, `cachedShortLimit`, `cachedShortTrailPrice`, `cachedShortTrailOffset`

**Change Detection:**
- Added `tickChanged(newVal, oldVal)` helper function
- Returns true if values differ by at least 1 tick OR if old value is NA
- Exit orders only re-issued when parameters actually change

**In-Position Exit Management:**
- Moved exit order placement from entry block to "while in position" block
- Exit parameters are recalculated each bar but only sent to broker when changed
- Eliminates "exit spam" where identical orders were being resent every bar

**Kill Switch Caching:**
- Existing kill stop caching logic preserved and integrated with new architecture
- `lastKillStopLong` and `lastKillStopShort` continue to prevent redundant kill orders

**Cache Reset:**
- All caches reset to `na` when position becomes flat
- All caches reset when new entry occurs (ensures fresh exit calculations)

---

## PASS 3: Debug Instrumentation

**Debug Toggle:**
- All debug code is gated behind `if enableDebug` checks
- When `enableDebug = false`, no tables, labels, or expensive string operations execute
- Zero performance impact when debug is off

**Debug Table:**
- Position: top-right corner
- 12 rows of diagnostic information
- Displays:
  1. Current position state (LONG/SHORT/FLAT)
  2. Base Long Signal (YES/NO)
  3. Base Short Signal (YES/NO)
  4. Long signal component breakdown (Retest/Trend/Mom/MomVal/Vol/VIX)
  5. Short signal component breakdown
  6. Entry block reasons (EntryLock/NoSameBarRev/MutualExclusion)
  7. Last entry bar index
  8. Last exit bar index
  9. Last exit reason
  10. VIX raw value (or "NA")
  11. VIX threshold value (or "NA (pass)")

**Reason Tracking:**
- `debugLongReasons` / `debugShortReasons`: Shows Y/N for each signal component
- `debugEntryBlockReason`: Shows which guards blocked entry
- `lastExitReason`: Tracks reason for most recent exit (e.g., "Long Reversal")

---

## Summary of Key Behavioral Changes

| Behavior | v5 Original | v6 Hardened |
|----------|-------------|-------------|
| Multiple entries same bar | Possible | Blocked (max 1) |
| Long + Short same bar | Possible | Blocked (mutual exclusion) |
| Same-bar close+reverse | Possible | Blocked by default (toggle available) |
| Exit order spam | Every bar | Only when parameters change |
| VIX NA on early bars | Could silently block | Fails open (passes) |
| Indicator warmup | No protection | 5+ bars beyond longest lookback |
| Debug visibility | None | Full diagnostic table (optional) |
