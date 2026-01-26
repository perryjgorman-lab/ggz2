# Verification Checklist for all_day_v6.pine

## Pre-Testing Setup

1. [ ] Open TradingView and create new Pine Script
2. [ ] Paste the `all_day_v6.pine` code
3. [ ] Verify script compiles without errors
4. [ ] Apply to US30 chart (recommended: 30min or 1h timeframe)
5. [ ] Open Strategy Tester panel

---

## Test 1: No Same-Bar Double Entry

**Objective:** Verify that only 1 entry can occur per bar

**Steps:**
1. [ ] Enable debug mode: Set "Enable Debug Display" = true
2. [ ] Run backtest on full date range
3. [ ] Review "List of Trades" in Strategy Tester
4. [ ] Check that no two entries have the exact same timestamp

**Verification Method:**
- Export trade list to CSV if available
- Sort by entry time
- Confirm no duplicate entry timestamps

**Expected Result:** No two entries share the same bar/timestamp

---

## Test 2: No Long + Short Same Bar

**Objective:** Verify Long and Short cannot both execute on same bar

**Steps:**
1. [ ] With debug enabled, use Bar Replay to find volatile periods
2. [ ] Step through bars manually around potential reversal zones
3. [ ] Observe the debug table for "Mutual Exclusion" in entry blocked reasons
4. [ ] Check trade list for any bar with both Long and Short entries

**Verification Method:**
- In Strategy Tester, sort trades by time
- Look for consecutive Long/Short pairs with same timestamp

**Expected Result:** Never see Long and Short entries on identical bar

---

## Test 3: Same-Bar Reversal Toggle Behavior

**Objective:** Verify `allowSameBarReversal` toggle works correctly

### Test 3A: Toggle = FALSE (default)
1. [ ] Ensure "Allow Same-Bar Reversal" = false
2. [ ] Use Bar Replay on a period with reversals
3. [ ] When position closes, check debug table
4. [ ] If signal fires on same bar, verify "NoSameBarRev" appears in blocked reasons
5. [ ] Verify no new entry occurs until next bar

### Test 3B: Toggle = TRUE
1. [ ] Set "Allow Same-Bar Reversal" = true
2. [ ] Run same backtest period
3. [ ] Verify that close+reverse can now occur on same bar when signal is valid
4. [ ] Compare trade counts between settings

**Expected Results:**
- FALSE: Close and re-entry never on same bar
- TRUE: Close and re-entry allowed on same bar (when signal valid)

---

## Test 4: No Exit Order Spam

**Objective:** Verify exit orders only update when parameters change

**Steps:**
1. [ ] Enable "Enable Debug Display" = true
2. [ ] Use Browser Developer Tools (F12) > Network tab while chart loads (advanced)
3. [ ] Alternatively, check TradingView alerts/logs if available
4. [ ] Observe that during a single position, exit levels remain stable

**Verification Method (Visual):**
1. [ ] Enter a position via replay
2. [ ] Watch the price action for several bars while in position
3. [ ] Exit levels (visible on chart if using strategy.exit) should not flicker/change unless ATR changes significantly

**Expected Result:** Exit orders are stable; no constant re-issuing

---

## Test 5: VIX Filter Behavior on Early Bars

**Objective:** Verify VIX filter doesn't block trades during warmup

**Steps:**
1. [ ] Set chart to a short date range (e.g., 10-20 bars from VIX data start)
2. [ ] Enable "Use VIX Filter" = true
3. [ ] Enable debug display
4. [ ] Observe "VIX Raw" and "VIX Threshold" in debug table

### Early Bars (< VIX SMA period):
1. [ ] VIX Threshold should show "NA (pass)"
2. [ ] Entries should NOT be blocked by VIX filter
3. [ ] Debug should show "VIX:Y" in signal components

### After Warmup:
1. [ ] VIX Threshold should show numeric value
2. [ ] VIX filter should block entries when VIX > threshold
3. [ ] Debug should show "VIX:N" when blocked

**Expected Result:**
- Early bars: VIX filter passes (fail-open)
- After warmup: VIX filter enforces threshold correctly

---

## Test 6: Debug Table Completeness

**Objective:** Verify all debug information displays correctly

**Steps:**
1. [ ] Enable "Enable Debug Display" = true
2. [ ] Verify table appears in top-right corner
3. [ ] Check all 12 rows populate with data:

| Row | Label | Expected Content |
|-----|-------|-----------------|
| 0 | Header | "Metric" / "Value" |
| 1 | Position | LONG/SHORT/FLAT |
| 2 | Base Long Signal | YES/NO |
| 3 | Base Short Signal | YES/NO |
| 4 | Long Reasons | Retest:Y/N Trend:Y/N etc |
| 5 | Short Reasons | Retest:Y/N Trend:Y/N etc |
| 6 | Entry Blocked By | None or reason codes |
| 7 | Last Entry Bar | Bar number |
| 8 | Last Exit Bar | Bar number or -1 |
| 9 | Last Exit Reason | Empty or reason string |
| 10 | VIX Raw | Number or "NA" |
| 11 | VIX Threshold | Number or "NA (pass)" |

**Expected Result:** All rows display appropriate values that update in real-time

---

## Test 7: Debug Off = No Performance Impact

**Objective:** Verify debug toggle properly gates expensive operations

**Steps:**
1. [ ] Set "Enable Debug Display" = false
2. [ ] Verify no debug table appears on chart
3. [ ] Compare backtest execution speed (rough timing):
   - [ ] Run backtest with debug = true, note time
   - [ ] Run backtest with debug = false, note time
4. [ ] Debug = false should be noticeably faster on large datasets

**Expected Result:** No visual debug elements; faster execution

---

## Test 8: Performance Comparison with v5

**Objective:** Verify v6 changes don't materially degrade backtest performance

**Steps:**
1. [ ] Run v5 original script on same symbol/timeframe/date range
2. [ ] Record key metrics:
   - Total P&L
   - Profit Factor
   - Win Rate
   - Max Drawdown
   - Total Trades
3. [ ] Run v6 script with same settings
4. [ ] Compare metrics

**Acceptable Variance:**
- P&L: Within 5% (minor differences expected due to entry locks)
- Profit Factor: Within 0.3
- Win Rate: Within 2%
- Trade Count: May be slightly lower (due to same-bar entry prevention)

**Red Flags:**
- P&L drops more than 10%
- Profit Factor drops below 5.0 (was 7.558)
- Significantly fewer trades (more than 20% reduction)

---

## Sign-Off

**Tester:** _________________
**Date:** _________________
**TradingView Version:** _________________
**Symbol Tested:** _________________
**Timeframe:** _________________

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| Test 1: No Double Entry | | |
| Test 2: No Long+Short Same Bar | | |
| Test 3A: Reversal Toggle FALSE | | |
| Test 3B: Reversal Toggle TRUE | | |
| Test 4: No Exit Spam | | |
| Test 5: VIX Early Bars | | |
| Test 6: Debug Completeness | | |
| Test 7: Debug Off Performance | | |
| Test 8: Performance Comparison | | |

**Overall Status:** [ ] APPROVED / [ ] NEEDS REVISION
