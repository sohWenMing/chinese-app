# Bobo's Chinese Writing App - Implementation Plan

## Project Overview
An interactive, playful Chinese character writing app for 8-year-old learners. The app captures handwriting strokes for stroke order validation and future LLM integration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Perfect    │  │   Bobo       │  │  Stroke Data    │   │
│  │  Freehand   │→ │   Character  │→ │  Capture &      │   │
│  │  Canvas     │  │   (SVG/PNG)  │  │  Export (JSON)  │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│                                                             │
│  CSS: Separate .css files (component-scoped)               │
│  Colors: Pink, purple, soft pastels                        │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│  Stroke Data Structure (for future LLM integration)        │
│  {                                                           │
│    sessionId: string,                                        │
│    timestamp: number,                                        │
│    characters: [                                             │
│      {                                                       │
│        charIndex: 0,                                         │
│        strokes: [                                            │
│          { points: [{x, y, pressure, timestamp}],            │
│            startTime, endTime }, ...                         │
│        ]                                                     │
│      }                                                       │
│    ]                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Phase Breakdown

### Phase 1: Foundation (Basic React app with canvas) ✅ COMPLETE - March 10, 2026
- [x] 1.1: Create React + Vite project structure
- [x] 1.2: Set up CSS folder structure (separate files)
- [x] 1.3: Create basic layout component (header, main, footer)
- [x] 1.4: Integrate Perfect Freehand canvas (single stroke test)
- [x] 1.5: Add stroke capture & console logging
- [x] 1.6: Test on iPad (touch + Apple Pencil)

**Deliverable**: Empty canvas that captures strokes + logs to console ✅

### Phase 2: Multi-Character Support (1-4 characters) ✅ COMPLETE - March 10, 2026
- [x] 2.1: Create character cell component (4 boxes)
- [x] 2.2: Auto-advance to next cell after pause/completion
- [x] 2.3: Add "clear" button per cell
- [x] 2.4: Add "back/forward" navigation between cells
- [x] 2.5: Stroke data structure per character
- [x] 2.6: Export button (download JSON)

**Deliverable**: 4-box canvas, exports stroke data as JSON ✅

### Phase 3: Bobo Character Integration
- [ ] 3.1: Create Bobo SVG character (simple version)
- [ ] 3.2: Add Bobo to sidebar/corner of canvas
- [ ] 3.3: Bobo idle animations (breathing, blinking)
- [ ] 3.4: Speech bubble component
- [ ] 3.5: Bobo reacts to writing (happy when strokes detected)
- [ ] 3.6: CSS animations for Bobo

**Deliverable**: Bobo visible + animated while writing

### Phase 4: Stroke Validation (Hanzi Writer)
- [ ] 4.1: Integrate Hanzi Writer library
- [ ] 4.2: Load character data (test with 10 common chars)
- [ ] 4.3: Compare user strokes vs. correct stroke order
- [ ] 4.4: Bobo gives feedback (correct/incorrect)
- [ ] 4.5: Visual feedback on canvas (green/red stroke overlay)
- [ ] 4.6: "Show answer" button

**Deliverable**: App validates stroke order, Bobo reacts

### Phase 5: Gamification & Polish
- [ ] 5.1: Pink/pastel color theme throughout
- [ ] 5.2: Bobo's personality (encouraging messages)
- [ ] 5.3: Sound effects (optional toggle)
- [ ] 5.4: Session summary (what she wrote)
- [ ] 5.5: iPad responsiveness testing
- [ ] 5.6: Deploy to Vercel (free tier)

**Deliverable**: Polished, deployable app

### Phase 6: Backend Prep (Future LLM integration)
- [ ] 6.1: API endpoint structure (Go backend prep)
- [ ] 6.2: Stroke data format standardization
- [ ] 6.3: Local storage (save sessions)
- [ ] 6.4: Session history view
- [ ] 6.5: Export all sessions as JSON

**Deliverable**: Ready for Go backend + LLM integration

## File Structure

```
chinese_app/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── Canvas.jsx
│   │   │   ├── Canvas.css
│   │   │   ├── CharacterCell.jsx
│   │   │   └── CharacterCell.css
│   │   ├── Bobo/
│   │   │   ├── Bobo.jsx
│   │   │   ├── Bobo.css
│   │   │   └── Bobo.svg
│   │   ├── Layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Header.css
│   │   │   ├── Footer.jsx
│   │   │   └── Footer.css
│   │   └── UI/
│   │       ├── Button.jsx
│   │       ├── Button.css
│   │       └── SpeechBubble.jsx
│   ├── hooks/
│   │   ├── useStrokeCapture.js
│   │   └── useBoboFeedback.js
│   ├── utils/
│   │   ├── strokeData.js
│   │   └── export.js
│   └── styles/
│       ├── variables.css (colors, fonts)
│       ├── global.css
│       └── theme.css (pink theme)
├── public/
│   └── bobo/ (character assets)
└── tests/ (Vitest + React Testing Library)
```

## Color Palette (Pink/Girly Theme)

```css
/* src/styles/variables.css */
--color-primary: #FFB6C1;      /* Light pink */
--color-secondary: #FF69B4;    /* Hot pink */
--color-accent: #DDA0DD;       /* Plum/purple */
--color-background: #FFF0F5;   /* Lavender blush */
--color-canvas: #FFFFFF;       /* White */
--color-text: #4A4A4A;         /* Soft gray */
--color-success: #98FB98;      /* Pale green (correct) */
--color-error: #FFB6C1;        /* Light red (try again) */
```

## Tech Stack Summary

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | React 18 + Vite | Fast, modern, great ecosystem |
| Styling | Plain CSS (separate files) | You're familiar, easy to maintain |
| Canvas | Perfect Freehand | Pressure-sensitive, smooth strokes |
| Character Data | Hanzi Writer | 9000+ chars, stroke order data |
| Testing | Vitest + React Testing Library | Fast, React-native |
| Deployment | Vercel | Free tier, supports Go backend later |
| State | React Context + localStorage | Simple, no over-engineering |

## Testing Strategy (Each Phase)

**Unit Tests:**
- Stroke capture hooks
- Data export utilities
- Bobo feedback logic

**Component Tests:**
- Canvas renders correctly
- Character cell navigation
- Bobo animations trigger

**E2E Tests (Playwright):**
- Full writing flow (1-4 chars)
- Export functionality
- iPad touch simulation

**Manual Testing:**
- iPad + Apple Pencil (each phase)
- Touch vs. pencil differentiation
- Palm rejection

## Deployment Path

**Now (Frontend only):**
- Vercel free tier
- Static site hosting
- Custom domain support

**Later (Go backend):**
- Vercel Functions (Go serverless)
- OR: Railway/Render (free tier, Go support)
- API endpoints for stroke recognition → LLM