# Skill: debug-log-interpreter

## Description
Interprets debug logs from the Chinese Writing App to diagnose Apple Pencil stroke tracking issues, identify root causes of jams, and recommend fixes.

## When to Use

Use this skill when the user provides debug logs from the Chinese Writing App (copied from the in-app debug panel). The logs will show pointer events, stroke data, and system events.

**Trigger phrases:**
- "Here are the logs..."
- "Debug log output:"
- "Can you analyze these logs?"
- "Stroke jamming, here's the log:"
- Any message containing Chinese Writing App debug data

## How to Use

1. **Identify the log format** - Check if it's the compact JSON format or human-readable format
2. **Parse the events** - Extract pointer events, state transitions, and timing
3. **Analyze the sequence** - Look for patterns that indicate the root cause
4. **Provide diagnosis** - Explain what went wrong in plain language
5. **Recommend fix** - Suggest specific code changes or configurations

## Analysis Patterns

### Pattern 1: State Not Reset After POINTERUP
**Symptoms:**
- POINTERUP logged
- Next POINTERDOWN blocked with "isAnyCellDrawing=true"
- No DRAWING-END event between them

**Root Cause:** `handlePointerUp` not properly calling `onDrawingEnd` or state not updating

**Fix:** Check that `handleForceReset` is always called, even on error paths

### Pattern 2: POINTERCANCEL Interruption
**Symptoms:**
- POINTERCANCEL appears in logs
- State reset follows
- But subsequent strokes still jam

**Root Cause:** Pointer cancel handler not properly releasing all state

**Fix:** Ensure `handlePointerCancel` calls complete cleanup sequence

### Pattern 3: LOSTPOINTERCAPTURE
**Symptoms:**
- LOSTPOINTERCAPTURE event appears
- May or may not have partial stroke data

**Root Cause:** iPadOS reclaimed pointer, possibly due to:
- System gesture (Control Center, Notification Center)
- Palm rejection too aggressive
- App going to background

**Fix:** Implement more aggressive state recovery in lost capture handler

### Pattern 4: Cross-Pointer Interference
**Symptoms:**
- Multiple different pointerIds in sequence
- POINTERDOWN blocked with "pointerId mismatch"
- Events referencing wrong cell

**Root Cause:** Not validating pointerId in all handlers

**Fix:** Add pointerId validation to all event handlers

### Pattern 5: Ghost Touch (Zero Pressure)
**Symptoms:**
- POINTERDOWN with pressure: 0 or undefined
- Event type is "pen" but no tilt data
- Stroke immediately cancels

**Root Cause:** Apple Pencil hover detected as touch, or palm rejection triggering

**Fix:** Filter out events with pressure === 0 and no actual button press

## Log Format Reference

### Event Types
- `POINTERDOWN` - User started touching/drawing
- `POINTERMOVE` - User moved pointer while drawing
- `POINTERUP` - User lifted pointer
- `POINTERCANCEL` - System cancelled the pointer event
- `LOSTPOINTERCAPTURE` - Browser lost pointer capture
- `DRAWING-START` - App recognized start of stroke
- `DRAWING-END` - App recognized end of stroke
- `STROKE-COMPLETE` - Stroke was successfully saved
- `AUTO-RECOVERY` - Automatic state reset after timeout
- `STATE-RESET` - Forced state reset (cleanup)
- `POINTERDOWN-BLOCKED` - New stroke prevented due to existing state

### Key Fields
- `pointerId` - Unique identifier for each pointer (finger/pencil)
- `pointerType` - "pen" (Apple Pencil), "touch" (finger), "mouse"
- `cellIndex` - Which grid cell (0-3)
- `pressure` - 0-1 range, Apple Pencil pressure
- `isAnyCellDrawing` - Global lock state

## Analysis Workflow

When user provides logs:

1. **Scan for errors**
   - Look for "BLOCKED", "CANCEL", "JAMMED"
   - Note timestamps of issues

2. **Trace the sequence**
   - Find last successful stroke
   - Find first failed stroke
   - Identify what happened between them

3. **Check state consistency**
   - Every POINTERDOWN should have matching POINTERUP or CANCEL
   - Every DRAWING-START should have DRAWING-END
   - isAnyCellDrawing should be false after DRAWING-END

4. **Identify specific event**
   - What was the last event before the jam?
   - Was there an unexpected event type?
   - Were there multiple rapid events?

5. **Formulate diagnosis**
   - State the pattern number (1-5 above)
   - Explain what the logs show
   - Suggest the specific code fix needed

## Example Analysis

**User provides:**
```
[10:30:45] POINTERDOWN - cell: 2, type: pen, pressure: 0.85
[10:30:45] DRAWING-START - cell: 2
[10:30:47] POINTERUP - cell: 2, points: 45
[10:30:47] STROKE-COMPLETE - cell: 2
[10:30:50] POINTERDOWN-BLOCKED - reason: isAnyCellDrawing=true
[10:30:53] AUTO-RECOVERY
[10:30:53] STATE-RESET
```

**Analysis:**
- **Pattern:** State Not Reset After POINTERUP (Pattern 1)
- **Issue:** POINTERUP at 10:30:47 did not trigger DRAWING-END
- **Root Cause:** `handlePointerUp` not calling `handleForceReset` or `onDrawingEnd`
- **Fix:** Ensure `handlePointerUp` always calls cleanup, check error handling in success path

## Tips

- Look for gaps in timestamps (>100ms) that might indicate missed events
- Check if pointerId changes between strokes (should be new each stroke)
- Note if pressure drops to 0 during stroke (indicates lift-off)
- Multiple POINTERCANCEL events suggest aggressive palm rejection

## Output Format

Always respond with:

1. **Quick Diagnosis** (1 sentence)
2. **Pattern Match** (Which pattern above)
3. **Detailed Analysis** (What the logs show)
4. **Root Cause** (Why it's happening)
5. **Recommended Fix** (Specific code change)
6. **Confidence Level** (High/Medium/Low based on log clarity)