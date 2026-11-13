# Skillora — AI-powered learning roadmap platform

A polished, gamified learning web app starter. It includes Google sign-in, server-side AI roadmap generation, a per-user daily quota, saved progress, in-app lessons/tasks/quizzes, PDF export via browser print, themes, fonts and a help chatbot.

## What works in this build

- Responsive glassmorphism dashboard and sidebar navigation.
- Four themes: Sunrise, Forest, Lavender and Midnight.
- Three typography choices, including a pixel-like mono option.
- Google authentication using Firebase Authentication.
- AI roadmap generation using Gemini, with a default limit of 10 per account per Bangladesh calendar day.
- Roadmap levels, lesson reading, AI-reviewed in-app practice tasks, 10-question quizzes and pass threshold. Every lesson task in a level must receive an AI approval before its quiz unlocks.
- Progress and streak tracking saved to SQLite.
- PDF export through the browser's Print → Save as PDF.
- Help chatbot for common product questions.

## Important product note

AI reviews practice responses for relevance and understanding, but they do **not** prove mastery. The quiz is the scored checkpoint and is currently graded in the browser against its AI-generated answer key; it is not tamper-resistant. For stronger assessment integrity, move quiz attempts and completion records to the server, add randomized question pools and timed attempts, and use practical sandboxes for programming topics. Never treat an AI-generated review or score as definitive proof of skill.

The sound toggle creates a gentle wind bed and original synthesized chime melody with the Web Audio API. Audio starts only after the learner turns it on and is not stored as an autoplay preference.

The tree's blossom/apple/butterfly choice is a cosmetic setting, not tied to gender.

## Requirements

- Node.js 22 or newer
- A Firebase project with Google provider enabled
- A Gemini API key

## Run locally

1. Extract this folder.
2. Open a terminal in the `skillora` folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env`.
5. Configure Firebase and Gemini as described below.
6. Start the app:

   ```bash
   npm start
   ```

7. Open `http://localhost:3000`.

## Firebase Google sign-in setup

1. Open the Firebase Console: https://console.firebase.google.com/
2. Create a project.
3. Add a Web App and copy its `apiKey`, `authDomain`, `projectId`, and `appId` into `.env`.
4. In Authentication → Sign-in method, enable Google.
5. In Authentication → Settings → Authorized domains, add `localhost` for local testing and your deployed domain later.
6. In Project settings → Service accounts, generate a private key.
7. Put the complete service-account JSON on one line in `FIREBASE_SERVICE_ACCOUNT_JSON`. Keep it secret. Do not upload it to GitHub or put it in the `public` folder.

## Gemini setup

1. Create an API key from https://aistudio.google.com/app/apikey
2. Set `GEMINI_API_KEY` in `.env`.
3. The default model is `gemini-2.0-flash`; change `GEMINI_MODEL` if your account uses another supported model.

## Environment variables

```env
PORT=3000
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
DAILY_ROADMAP_LIMIT=10
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_APP_ID=...
FIREBASE_SERVICE_ACCOUNT_JSON=...
```

The quota is enforced by the backend, not the browser. The date boundary is midnight in `Asia/Dhaka`. Generation failures do not consume a quota.

## Database

SQLite is created automatically as `skillora.db` in the project directory. Back it up regularly. For a larger production deployment, use managed PostgreSQL (for example Supabase) and add migrations/backups.

## Deploy

This app needs a persistent Node.js host because it uses Express and SQLite. For a first deployment, use a Node-capable host with persistent disk. If deploying to an ephemeral serverless host, replace SQLite with managed PostgreSQL first. Set all `.env` values in the host's secret/environment settings. Never expose `GEMINI_API_KEY` or the Firebase service-account JSON in frontend code.

## Before public launch

- Add privacy policy, terms, account deletion and data export.
- Add rate limiting and abuse monitoring to all API endpoints.
- Add CSRF/origin protections and stronger input validation.
- Use a managed database with backups.
- Add AI output validation and safe URL allowlisting for generated resources.
- Add accessible keyboard/focus states and test with screen readers.
- Add server-side quiz attempt records and anti-replay controls.
- Consider age-appropriate safeguards if minors will use the app.
- Add original/licensed audio and user-controlled sound settings.
- Have a human review AI-generated learning content and resource links.
