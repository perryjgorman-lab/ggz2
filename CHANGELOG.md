# all_day v6 - Changelog

## Summary

The original hardening attempt broke the strategy by introducing logic that blocked all entries. This revision takes a different approach:

- **Phase A**: Pure v5→v6 conversion with ZERO logic changes
- **Phase B**: Same as Phase A, but with opt-in hardening toggles (all OFF by default)

---

## Phase A: Pure v5 to v6 Conversion

**File:** `all_day_v6_phaseA.pine`

**Changes:**
- Changed `//@version=5` to `//@version=6`
- That's it. No other changes.

**Expected Behavior:**
- Should produce identical trade count and metrics as v5
- If it doesn't match v5, report specific discrepancies

---

## Phase B: v6 with Opt-In Hardening

**File:** `all_day_v6_phaseB.pine`

**New Inputs (all OFF by default):**

| Toggle | Default | Description |
|--------|---------|-------------|
| `enforceFlatOnlyEntries` | OFF | Only enter when position_size == 0 |
| `oneEntryPerBarLock` | OFF | Prevent multiple entries on same bar |
| `mutualExclusionLongShort` | OFF | Block if both long and short signals fire |
| `preventSameBarReversal` | OFF | Block exit+reverse on same candle |
| `useExitCaching` | OFF | Only re-issue exits when parameters change |
| `enableDebugTable` | OFF | Show debug table (has overhead when ON) |

**With all toggles OFF:**
- Behavior is identical to Phase A (and v5)
- No performance overhead from hardening logic

**With toggles ON:**
- Each guard is applied independently
- Can be tested individually to see impact on trade frequency

---

## What Was Wrong With The Original Hardening

The original v6 hardening had this broken logic:

```pine
// BROKEN - blocked all entries when not flat:
bool longCondition = ... and (isFlat or (isShortPos and allowSameBarReversal))
```

Since `allowSameBarReversal` defaulted to `false`:
- `(isShortPos and false)` = always false
- So entries only worked when flat
- Strategy could never reverse positions → zero trades after first exit

**The fix:** Make all hardening opt-in with toggles that default to OFF.

---

## Files

| File | Purpose |
|------|---------|
| `all_day_v6_phaseA.pine` | Pure v6 conversion, should match v5 exactly |
| `all_day_v6_phaseB.pine` | v6 with opt-in hardening toggles |
| `all_day_v6.pine` | (Old broken version - can be deleted) |
