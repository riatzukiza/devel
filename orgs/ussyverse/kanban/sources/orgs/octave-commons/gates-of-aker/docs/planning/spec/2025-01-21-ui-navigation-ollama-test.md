# Splash Screen, Main Menu, and Ollama Connection Test

## Overview
Add a splash screen, main menu, and Ollama connection test page to the game. Currently the app directly loads into the simulation UI.

## Requirements

### 1. Backend Endpoint for Ollama Connection Test

**File:** `backend/src/fantasia/server.clj`

Create a new HTTP endpoint to test Ollama connection:

```
GET /api/ollama/test
POST /api/ollama/test (optional, with custom URL/model)
```

Response format:
```json
{
  "connected": true/false,
  "latency_ms": 123,
  "model": "qwen3:4b",
  "error": "error message if any"
}
```

Implementation notes:
- Use existing `call-ollama!` from `fantasia.sim.scribes`
- Test with a simple prompt like "test"
- Return connection status, latency, and model
- Handle timeouts and connection errors gracefully
- Add to the ring router in `app` handler

**References:**
- `backend/src/fantasia/sim/scribes.clj:51-74` - `call-ollama!` function
- `backend/src/fantasia/server.clj:9` - `ollama-url` constant
- `backend/src/fantasia/server.clj:11` - `ollama-model` constant

### 2. Splash Screen Component

**File:** `web/src/components/SplashScreen.tsx`

Requirements:
- Display game title "Gates of Aker" prominently
- Show loading animation or visual effect
- Auto-transition to main menu after 2-3 seconds
- Allow click-to-skip to dismiss immediately
- Clean, atmospheric design consistent with game theme
- No external assets required (use CSS animations)

Design considerations:
- Dark background with accent colors
- Fade in/out transitions
- Optional: simple particle or pattern effect using Canvas

### 3. Main Menu Component

**File:** `web/src/components/MainMenu.tsx`

Menu options:
1. **New Game** - Start simulation (current App functionality)
2. **Ollama Test** - Navigate to Ollama connection test page
3. **Settings** - Future: configuration options (optional for now, can be placeholder)
4. **Credits** - Future: credits page (optional for now, can be placeholder)

UI Requirements:
- Centered layout with large, clickable buttons
- Hover effects on buttons
- Keyboard navigation support (Enter to select, arrow keys)
- Responsive design
- Consistent styling with game theme

### 4. Ollama Test Page Component

**File:** `web/src/components/OllamaTestPage.tsx`

Features:
- Button to test Ollama connection
- Display connection status (Connected/Not Connected/Testing)
- Show latency and model information
- Display any error messages clearly
- "Back to Menu" button
- Optional: input fields to customize Ollama URL and model

State:
- `status`: "idle" | "testing" | "connected" | "error"
- `latency`: number | null
- `error`: string | null
- `model`: string (defaults to backend model)

### 5. App Navigation State

**File:** `web/src/App.tsx`

Add app-level navigation state:

```typescript
type AppState = "splash" | "menu" | "simulation" | "ollama-test";
```

Update App component:
- Add `appState` state variable
- Show SplashScreen when `appState === "splash"`
- Show MainMenu when `appState === "menu"`
- Show current simulation UI when `appState === "simulation"`
- Show OllamaTestPage when `appState === "ollama-test"`
- Provide callback props to navigate between states

### 6. Component Exports

**File:** `web/src/components/index.tsx`

Add exports:
```typescript
export { SplashScreen } from "./SplashScreen";
export { MainMenu } from "./MainMenu";
export { OllamaTestPage } from "./OllamaTestPage";
```

## Definition of Done

- [x] Backend `/api/ollama/test` endpoint created and functional
- [x] SplashScreen component with auto-transition after 2-3 seconds
- [x] SplashScreen allows click-to-skip
- [x] MainMenu component with "New Game" and "Ollama Test" buttons
- [x] OllamaTestPage component tests backend Ollama connection
- [x] OllamaTestPage displays status, latency, and model information
- [x] App.tsx navigates between all four states (splash, menu, simulation, ollama-test)
- [x] "New Game" in menu leads to simulation
- [x] "Back to Menu" in OllamaTestPage returns to menu
- [x] All components exported from `components/index.tsx`
- [x] No TypeScript errors
- [x] `npm run build` completes successfully
- [x] Manual testing confirms navigation flow works correctly

## Implementation Notes

### Phase 1: Backend
1. Add `/api/ollama/test` endpoint to `server.clj`
2. Test endpoint with curl/Postman
3. Run `npm run build` and ensure backend compiles

### Phase 2: Frontend Components
1. Create `SplashScreen.tsx`
2. Create `MainMenu.tsx`
3. Create `OllamaTestPage.tsx`
4. Update `components/index.tsx` exports

### Phase 3: App Integration
1. Add `AppState` type to App.tsx
2. Add state management for navigation
3. Render appropriate component based on state
4. Add navigation callbacks

### Phase 4: Testing
1. Test full navigation flow
2. Test Ollama connection functionality
3. Verify auto-transition from splash
4. Test click-to-skip on splash
5. Verify keyboard navigation on menu (optional)

## Testing Commands

```bash
# Backend
cd backend
lein test

# Frontend
cd web
npm run test
npm run build
```

## Files to Modify/Create

### Backend
- `backend/src/fantasia/server.clj` - Add `/api/ollama/test` endpoint

### Frontend - New Files
- `web/src/components/SplashScreen.tsx`
- `web/src/components/MainMenu.tsx`
- `web/src/components/OllamaTestPage.tsx`

### Frontend - Modify Files
- `web/src/App.tsx` - Add navigation state
- `web/src/components/index.tsx` - Export new components

## Changelog

### [2025-01-21] Initial spec
- Defined requirements for splash screen, main menu, and Ollama test
- Added backend endpoint specification
- Outlined component structure and navigation flow

### [2025-01-21] Implementation complete
- Created `/api/ollama/test` endpoint in `backend/src/fantasia/server.clj`
- Created `SplashScreen.tsx` with auto-transition after 2.5s and click-to-skip
- Created `MainMenu.tsx` with keyboard navigation and hover effects
- Created `OllamaTestPage.tsx` with connection testing and status display
- Updated `App.tsx` with AppState navigation system
- Exported new components in `components/index.tsx`
- Frontend builds successfully with no TypeScript errors
- Backend compiles successfully with no errors
