# Mockly

**AI-powered mock interviews that score every answer and track your readiness.**

Mockly is a mobile app that simulates technical job interviews using AI. You answer questions by typing or voice, get instant structured feedback with scores and improvement tips, and track your readiness over time across topics like JavaScript, React, React Native, Backend, and System Design.

---

## Features

- **Adaptive AI interviews** — Groq LLM generates questions tuned to your role (Frontend, Backend, React Native) and experience level (Junior, Middle, Senior). Difficulty adjusts dynamically based on your previous answers.
- **Three session modes** — Text (type at your own pace), Voice (speak your answer, AI transcribes), and Rapid Drill (fast-fire short answers).
- **Instant per-answer feedback** — every answer is scored 0–10 across Structure, Technical accuracy, and Clarity, with a list of strengths and concrete improvement points.
- **Readiness score** — a personal interview readiness index that grows as you practice. Each session updates your score and shows the delta.
- **Topic mastery tracking** — Progress screen shows your score trend over time and per-topic mastery (Excellent / Developing / Weak).
- **Session history** — filterable log of every session with type, topic, question count, duration, and score.
- **Question bank** — browse all questions that appeared in your sessions, filterable by topic.
- **Daily reminder** — configurable push notification to keep your streak going.

---

## Tech Stack

| Layer            | Technology                                                                             |
| ---------------- | -------------------------------------------------------------------------------------- |
| Mobile           | Expo 56 / React Native 0.85                                                            |
| Navigation       | Expo Router (file-based)                                                               |
| State            | Zustand + React Query                                                                  |
| Backend          | Node.js / Express (TypeScript)                                                         |
| Database         | Supabase (PostgreSQL + Row Level Security)                                             |
| Auth             | Supabase Auth — JWKS local JWT verification (RS256/ES256, no network call per request) |
| AI               | Groq API (LLaMA 3)                                                                     |
| Error monitoring | Sentry (`@sentry/node` + `@sentry/react-native`)                                       |
| Shared types     | `@mockly/shared` (internal monorepo package)                                           |
| Monorepo         | npm workspaces                                                                         |
| Code quality     | ESLint + Prettier + Husky pre-commit                                                   |

---

## Project Structure

```
Mockly/
├── apps/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   └── config/
│   │   └── Dockerfile    # Multi-stage production build
│   └── mobile/           # Expo app
│       ├── app/          # Expo Router screens
│       │   ├── (tabs)/   # Home, History, Progress, Profile
│       │   └── session/  # Interview flow
│       ├── components/
│       ├── hooks/
│       ├── stores/       # Zustand stores
│       └── utils/
├── packages/
│   └── shared/           # Shared TypeScript types & Zod schemas
├── eslint.config.js      # ESLint flat config (backend + mobile)
├── prettier.config.js    # Prettier config
└── .husky/               # Git hooks (pre-commit: lint + format)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- Supabase project
- Groq API key

### Environment Variables

**`apps/backend/.env`**

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_JWT_SECRET=
GROQ_API_KEY=
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
SENTRY_DSN=                    # optional — get from sentry.io
MAX_AUDIO_SIZE_MB=25
```

**`apps/mobile/.env`**

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SENTRY_DSN=        # optional — can share with backend DSN
```

### Install & Run

```bash
# Install all dependencies (also activates Husky git hooks)
npm install

# Build the shared package (required before first backend start)
npm run build -w @mockly/shared

# Start the backend
npm run backend

# Start the mobile app (new terminal)
npm run mobile
```

### Code Quality

```bash
# Lint all workspaces
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format all files
npm run format

# Check formatting without writing
npm run format:check
```

The pre-commit hook runs lint + format automatically on staged files via Husky.

---

## Deploying the Backend

The backend ships with a production-ready multi-stage Dockerfile:

```bash
# Build from monorepo root
docker build -f apps/backend/Dockerfile -t mockly-backend .

# Run
docker run -p 3000:3000 --env-file apps/backend/.env mockly-backend
```

The image:

- Compiles TypeScript in a builder stage, copies only the compiled output to the runtime stage
- Runs as non-root (`node` user)
- Exposes `GET /health` for container health checks (Docker `HEALTHCHECK` configured)

---

## Error Monitoring (Sentry)

Set `SENTRY_DSN` in `apps/backend/.env` and `EXPO_PUBLIC_SENTRY_DSN` in `apps/mobile/.env` to enable Sentry. Both values can point to the same Sentry project or separate ones.

Get your DSN from **sentry.io → Project Settings → Client Keys**.

---

## App Walkthrough

### 1. Sign In

Email/password login with Supabase Auth.

<img src="screenshots/01-login.png" width="280">

---

### 2. Email Verification

On first sign-up, a one-time code is sent to confirm the email address.

<img src="screenshots/02-email-verification.png" width="280">

---

### 3. Onboarding — Set Your Target

Pick your role and experience level. The AI uses this to calibrate question difficulty and topic mix for every session.

<img src="screenshots/03-onboarding-target.png" width="280">

---

### 4. Home

Your interview readiness score at a glance, today's weakest topic to drill, and a log of recent sessions.

<img src="screenshots/07-home.png" width="280">

---

### 5. Start a New Session

Choose the session mode (Text / Voice / Rapid Drill), pick a topic, and set how many questions you want.

<img src="screenshots/12-new-session.png" width="280">

---

### 6. Answer a Question

The AI generates a question with tags and an estimated answer time. A progress bar and timer keep you on track.

<img src="screenshots/04-session-active.png" width="280">

---

### 7. AI Feedback

After each answer you get an instant score (0–10) broken down into Structure, Technical, and Clarity, plus bullet-point strengths and one area to improve.

<img src="screenshots/05-ai-feedback.png" width="280">

---

### 8. Session Results

When the session ends you see your overall score, readiness delta, and per-question scores as a bar chart.

<img src="screenshots/06-session-results.png" width="280">

---

### 9. History

A full log of every session, filterable by mode (Text / Voice / Rapid). Tap any row to review it.

<img src="screenshots/08-history.png" width="280">

---

### 10. Progress

Score trend over your last sessions and topic mastery breakdown — shows which subjects are strong and which need work.

<img src="screenshots/09-progress.png" width="280">

---

### 11. Question Bank

Browse all questions from your sessions, filterable by topic. Save a question to revisit it later.

<img src="screenshots/10-question-bank.png" width="280">

---

### 12. Profile

Your role, level, daily streak, and average score. Configure daily reminders and navigate to Settings.

<img src="screenshots/11-profile.png" width="280">
