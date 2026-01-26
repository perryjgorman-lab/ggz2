# Verification Checklist

## Phase A: v5 vs v6 Comparison

**Goal:** Confirm Phase A produces identical results to v5

### Setup
1. [ ] Load original v5 script in TradingView
2. [ ] Apply to US30, same timeframe (e.g., 30min)
3. [ ] Set date range: Jan 1, 2025 - Jan 26, 2026
4. [ ] Record v5 metrics:

| Metric | v5 Value | Phase A Value | Match? |
|--------|----------|---------------|--------|
| Total Trades | 669 | | |
| Total P&L | +40,698.60 | | |
| Profit Factor | 7.558 | | |
| Win Rate | 88.34% | | |
| Max Drawdown | 431.11 | | |

5. [ ] Load `all_day_v6_phaseA.pine`
6. [ ] Apply same settings
7. [ ] Compare metrics

**Expected:** All values should match exactly or be within 0.1%

---

## Phase B: Toggle Testing

**Goal:** Verify each toggle works independently

### Baseline (All toggles OFF)
1. [ ] Load `all_day_v6_phaseB.pine`
2. [ ] Confirm all hardening toggles are OFF
3. [ ] Verify trade count matches Phase A: ______

### Test Each Toggle Individually

| Toggle | Trades (OFF) | Trades (ON) | Change | Notes |
|--------|-------------|-------------|--------|-------|
| enforceFlatOnlyEntries | | | | |
| oneEntryPerBarLock | | | | |
| mutualExclusionLongShort | | | | |
| preventSameBarReversal | | | | |
| useExitCaching | | | | |

### Debug Table Test
1. [ ] Enable `enableDebugTable`
2. [ ] Verify table appears in top-right
3. [ ] Verify shows: Position, Base signals, Final signals, Components, Guard status
4. [ ] Disable `enableDebugTable`
5. [ ] Verify table disappears

---

## Specific Behavior Tests

### Test: No Double Entry Same Bar
1. [ ] Enable `oneEntryPerBarLock`
2. [ ] Use Bar Replay through volatile period
3. [ ] Verify max 1 entry per bar

### Test: No Long+Short Same Bar
1. [ ] Enable `mutualExclusionLongShort`
2. [ ] Check if trade count decreases
3. [ ] If no change, signals probably never overlap

### Test: Same-Bar Reversal Prevention
1. [ ] Enable `preventSameBarReversal`
2. [ ] Find a reversal in trade list
3. [ ] Verify exit and re-entry are on different bars

### Test: Exit Caching
1. [ ] Enable `useExitCaching`
2. [ ] Note: This changes exit anchoring from `close` to `position_avg_price`
3. [ ] May affect P&L slightly - document difference

---

## Sign-Off

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| Phase A matches v5 | | |
| Phase B baseline matches Phase A | | |
| Each toggle testable individually | | |
| Debug table works | | |
| No compilation errors | | |

**Tester:** _________________
**Date:** _________________
**Status:** [ ] APPROVED / [ ] NEEDS REVISION
