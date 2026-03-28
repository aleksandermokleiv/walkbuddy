# WalkBuddy

WalkBuddy is a community platform for new parents to find walking companions nearby. Parents can sign up, set their availability, appear on a live map, send and receive walk requests, and chat with confirmed walk partners — all from a mobile-first web app.

## Features

- Email/password authentication via Firebase Auth
- Onboarding flow: baby info, profile photo upload, location sharing
- Live map showing available parents within 5 km (Google Maps)
- Walk request system with proposed time and meeting spot
- Accept/decline incoming requests
- Real-time chat between confirmed walk partners
- Availability toggle to appear/disappear from the map

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- Firebase (Authentication, Firestore, Storage)
- Tailwind CSS
- @vis.gl/react-google-maps
- @heroicons/react
- date-fns

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project.
2. **Authentication**: Enable Email/Password sign-in under Authentication > Sign-in method.
3. **Firestore**: Create a Firestore database in production mode. Deploy the security rules from `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```
   Or paste the contents of `firestore.rules` into the Firestore Rules editor in the console.
4. **Storage**: Enable Firebase Storage (used for profile photo uploads).
5. In Project Settings > General, find your web app config and copy the values into `.env.local`.

## Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create or select a project.
3. Enable the **Maps JavaScript API**.
4. Create an API key under Credentials and copy it to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
5. Optionally restrict the key to your domain for production.

## Running Locally

```bash
# 1. Clone and enter the directory
cd "Cursor test 2"

# 2. Copy and fill in environment variables
cp .env.local.example .env.local
# Edit .env.local with your Firebase and Google Maps credentials

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
  page.tsx                  # Landing page (redirects to dashboard if logged in)
  layout.tsx                # Root layout
  auth/
    login/page.tsx          # Sign-in page
    signup/page.tsx         # Registration page
  onboarding/page.tsx       # 3-step profile setup after sign-up
  dashboard/page.tsx        # Home/profile page with availability toggle
  map/page.tsx              # Live map of nearby available parents
  matches/page.tsx          # Walk request management (pending/accepted/past)
  chat/
    page.tsx                # Chat list (accepted matches only)
    [matchId]/page.tsx      # Individual chat window

components/
  AuthGuard.tsx             # Redirects unauthenticated users to login
  Navbar.tsx                # Fixed bottom navigation bar
  ParentCard.tsx            # Profile card shown on map marker click
  WalkRequestModal.tsx      # Modal to propose a walk (date, time, location)
  MapView.tsx               # Google Maps view with parent markers
  ChatWindow.tsx            # Real-time chat UI

hooks/
  useAuth.ts                # Firebase auth state
  useMatches.ts             # Real-time Firestore matches subscription
  useMessages.ts            # Real-time Firestore messages subscription
  useNearbyParents.ts       # Fetches available parents filtered by radius

lib/
  types.ts                  # TypeScript interfaces (UserProfile, Match, Message)
  firebase.ts               # Firebase app initialization
  auth.ts                   # Auth helper functions
  firestore.ts              # Firestore CRUD and real-time helpers

firestore.rules             # Firestore security rules
```

## Deploying

The easiest deployment is [Vercel](https://vercel.com). Connect your repository and add all environment variables in the Vercel project settings.
