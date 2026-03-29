# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Overview

You are a senior UI designer and frontend developer.
Build premium, dark-themed interfaces.
Use subtle animations, proper spacing, and visual hierarchy.
No emoji icons. No inline styles. No generic gradients.

Claude Code to behave the way I want.
Each feature does one thing, the code is easy to follow, and the app is easy to run locally and deploy.

---

# Development Rules

**Climb Squad** is a Next.js 14 App Router app for finding climbing partners. Firebase handles all backend concerns — there is no API layer, no server actions, and no database other than Firestore.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Type-check and build — run this to catch TS errors before committing
npm run lint     # ESLint
```

There are no tests. `npm run build` is the verification step.

## Environment

All env vars are `NEXT_PUBLIC_*` (client-side only). Copy `.env.local.example` to `.env.local`. The app will not boot without valid Firebase and Google Maps keys. Firestore security rules must be deployed separately — paste `firestore.rules` into the Firebase Console Rules editor or run `firebase deploy --only firestore:rules`.

## Architecture

### Data flow
Every page fetches or subscribes directly to Firestore via helpers in `lib/firestore.ts`. There is no Redux, no Zustand, no context beyond Firebase auth. Real-time features use `onSnapshot` listeners wrapped in hooks that return state and clean up on unmount.

### Auth
`useAuth` (`hooks/useAuth.ts`) wraps `onAuthStateChanged` and is the single source of truth for the current user. Protected pages import `AuthGuard` which redirects to `/auth/login` if `user` is null. The auth state is never stored in localStorage — Firebase SDK handles persistence.

### Hooks pattern
Each hook subscribes to one Firestore query and returns `{ data, loading }`. They all follow the same pattern: `useEffect` → subscribe → `setState` → return unsubscribe. Never call `onSnapshot` directly in a page component.

### `updateUserProfile`
Uses `setDoc(..., { merge: true })` — not `updateDoc`. This means it creates the document if missing and merges fields otherwise. Safe to call with partial data.

### Firestore collections
| Collection | Key fields | Notes |
|---|---|---|
| `users/{uid}` | `isAvailableNow`, `availabilityExpiresAt`, `disciplines`, `climbingLevel`, `username` | `username` must be unique — enforced client-side via `getUserByUsername` query |
| `matches/{matchId}` | `participants: [uid, uid]`, `status`, `sessionType` | `participants` is always a 2-element array; queried with `array-contains` |
| `messages/{matchId}/messages/{msgId}` | `senderId`, `text`, `createdAt` | Subcollection under matches |
| `friendships/{id}` | `participants`, `status`, `initiatedBy` | Same `array-contains` pattern as matches |
| `groups/{id}` | `members: uid[]`, `createdBy` | Members can include more than 2 |

### Map
`MapView` wraps `@vis.gl/react-google-maps`. It receives `parents: UserProfile[]`, `gyms: Gym[]`, and `currentUserId`. Gym data is hardcoded in `lib/gyms.ts` — not stored in Firestore. The map uses a custom muted stone-toned style passed via `options={{ styles: MAP_STYLE }}`.

### Availability
`isAvailableNow` is toggled on the map page. When turned on, `availabilityExpiresAt` is set to `now + 2h`. `useNearbyParents` filters out climbers whose expiry has passed. The map page also auto-clears stale availability on load.

## Design system
- **Auth pages**: dark `from-stone-900 via-stone-800 to-amber-900` gradient, `bg-stone-800/80 backdrop-blur` cards
- **App pages**: `bg-stone-50` background, white cards with `border-stone-100`
- **Primary colour**: amber-500 / amber-600
- **Nav**: `bg-white/80 backdrop-blur-xl border-t border-stone-200/50` (frosted glass)
- **Inputs**: `bg-stone-50 border-stone-200 focus:ring-amber-400`
- **Headings**: `font-black tracking-tight`
- **Buttons**: `active:scale-95 transition-all shadow-md rounded-2xl`

## Firestore rules
Rules are in `firestore.rules` and must be deployed manually. The local file is the source of truth. `permission-denied` errors in the console always mean the rules haven't been deployed yet.

## Composite indexes
Defined in `firestore.indexes.json`. Required for queries that combine `array-contains` with `orderBy` or a second `where`. Deploy with `firebase deploy --only firestore:indexes`.
