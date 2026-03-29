# Climb Squad

Climb Squad is a community platform for finding climbing partners nearby. Climbers can sign up, set their availability, appear on a live map, send and receive session requests, and chat with confirmed climbing partners — all from a mobile-first web app.

## Features

- Email/password and Google authentication via Firebase Auth
- Onboarding: climbing level, disciplines, home gym, profile photo, location
- Live map of available climbers within 5km with muted stone-toned style
- Hardcoded Oslo/Norway gym markers (Klatreverket, Oslo Klatresenter, Bergsprekken, etc.)
- Session request system with type (gym / outdoor / bouldering / multi-pitch), time, and location
- Discipline and availability filter on the map
- Accept/decline incoming session requests
- Real-time chat between confirmed climbing partners
- Friends system: search by @username, friend requests, "At the wall" live badge
- Walking groups → Climbing Crews
- Availability toggle with 2-hour auto-expiry
- Profile editing

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
2. **Authentication**: Enable Email/Password and Google sign-in under Authentication → Sign-in method.
3. **Firestore**: Create a Firestore database. Deploy the security rules from `firestore.rules` by pasting into the Firestore Rules editor in the console, or via CLI:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
4. **Storage**: Enable Firebase Storage (used for profile photo uploads).
5. In Project Settings → General, find your web app config and copy the values into `.env.local`.

## Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Enable the **Maps JavaScript API**.
3. Create an API key under Credentials and copy it to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

## Running Locally

```bash
cp .env.local.example .env.local
# Fill in .env.local with your credentials
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying

Deploy to [Vercel](https://vercel.com) by connecting your GitHub repository and adding all environment variables in the Vercel project settings. After deploying, add your Vercel domain to Firebase → Authentication → Settings → Authorized domains so Google Sign-In works.
