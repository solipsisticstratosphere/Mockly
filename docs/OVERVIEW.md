# Mockly — AI-Powered Interview Preparation App

> Single source of truth for all AI coding agents building this project.
> Keep this document updated as architecture decisions evolve.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [API Design](#6-api-design)
7. [Supabase Integration](#7-supabase-integration)
8. [Groq AI Integration](#8-groq-ai-integration)
9. [State Management](#9-state-management)
10. [Environment Variables](#10-environment-variables)
11. [Development Setup](#11-development-setup)
12. [Key Implementation Notes](#12-key-implementation-notes)

---

## 1. Project Overview

**Mockly** is a React Native mobile application that simulates realistic technical job interviews for software developers using AI-generated questions and real-time AI feedback. It targets developers preparing for Junior, Middle, or Senior roles across specializations including Frontend, Backend, React Native, and General Full Stack.

### Value Proposition

| Problem | Mockly Solution |
|---|---|
| Generic question lists with no feedback | AI generates role/level-specific questions and scores answers 0–10 |
| No way to practice voice answers | Voice mode with Groq Whisper transcription gives a real interview feel |
| No progress visibility | Analytics dashboard shows readiness score, weak topics, and trends over time |
| Irregular practice | Streak system + push notifications enforce daily practice habits |

### Target Users

- Junior developers preparing for their first roles
- Mid-level developers targeting senior positions
- Developers switching specializations (e.g., web → React Native)

### Key Differentiators

- Fast AI inference via Groq (sub-second question/feedback latency)
- Three session modes: text, voice, rapid drill
- STAR methodology for behavioral questions
- Adaptive difficulty based on answer quality
- Offline-capable session cache (SQLite)

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   React Native App (Expo)                │
│  Expo Router │ Zustand │ React Query │ Expo AV/Notif    │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / WebSocket
                           ▼
┌─────────────────────────────────────────────────────────┐
│               Express Backend (Node.js)                  │
│  REST API │ WebSocket (ws) │ Supabase Client │ Groq SDK │
└──────┬───────────────────────┬────────────────────────┬─┘
       │                       │                        │
       ▼                       ▼                        ▼
┌─────────────┐   ┌────────────────────────┐  ┌────────────────┐
│  Supabase   │   │       Groq API          │  │   Firebase     │
│ PostgreSQL  │   │  llama-3.1-70b-versatile│  │ Cloud Messaging│
│ Auth (JWT)  │   │  whisper-large-v3       │  │  (Push notif.) │
│ Storage     │   └────────────────────────┘  └────────────────┘
│ RLS Policies│
└─────────────┘
```

### Data Flow — Interview Session

```
App                    Backend                 Groq              Supabase
 │                        │                     │                   │
 │── POST /sessions ──────►│                     │                   │
 │                        │── INSERT session ───────────────────────►│
 │                        │◄── session_id ──────────────────────────│
 │◄── { session_id } ─────│                     │                   │
 │                        │                     │                   │
 │── GET /questions/next ─►│                     │                   │
 │                        │── chat.completions ─►│                   │
 │                        │◄── question text ───│                   │
 │◄── { question } ───────│                     │                   │
 │                        │                     │                   │
 │── POST /answers ────────►│                     │                   │
 │  (text or audio file)  │── chat.completions ─►│                   │
 │                        │◄── feedback JSON ───│                   │
 │                        │── INSERT answer ────────────────────────►│
 │◄── { feedback } ───────│                     │                   │
```

### WebSocket Usage

WebSockets are used exclusively for streaming AI feedback in real time (token-by-token). The REST API handles all session control (create, end, skip). This keeps HTTP semantics clean while providing a responsive UX during AI processing.

---

## 3. Tech Stack

### Mobile (apps/mobile)

| Package | Version | Rationale |
|---|---|---|
| expo | ~53.0.0 | Managed workflow, OTA updates, unified native APIs |
| react-native | 0.76.x | LTS, expo-compatible |
| typescript | ^5.3.0 | Type safety across monorepo |
| expo-router | ~4.0.0 | File-based routing, deep linking, tab/stack support |
| zustand | ^5.0.0 | Minimal boilerplate global state, no context hell |
| @tanstack/react-query | ^5.0.0 | Server state caching, background refetch, optimistic updates |
| react-hook-form | ^7.50.0 | Performant form handling, minimal re-renders |
| zod | ^3.22.0 | Runtime validation, shared with backend |
| expo-av | ~15.0.0 | Audio recording for voice mode |
| expo-notifications | ~0.29.0 | Push notification scheduling + FCM integration |
| expo-sqlite | ~14.0.0 | Offline session cache |
| @supabase/supabase-js | ^2.45.0 | Direct auth token management on device |
| sentry-expo | ~8.0.0 | Mobile crash reporting |

### Backend (apps/backend)

| Package | Version | Rationale |
|---|---|---|
| node | 20 LTS | LTS, native fetch, crypto, performance |
| express | ^4.19.0 | Mature, well-understood REST framework |
| ws | ^8.17.0 | Lightweight WebSocket server |
| @supabase/supabase-js | ^2.45.0 | Service role client for DB operations |
| groq-sdk | ^0.5.0 | Official Groq SDK with streaming support |
| zod | ^3.22.0 | Request body validation, shared schemas |
| jsonwebtoken | ^9.0.0 | JWT verification (Supabase JWTs) |
| jwks-rsa | ^3.1.0 | JWKS key fetching for local JWT verification |
| multer | ^1.4.5 | Audio file upload handling |
| winston | ^3.13.0 | Structured logging |
| @sentry/node | ^8.0.0 | Backend error tracking |
| dotenv | ^16.4.0 | Env var loading |

### Infrastructure

| Service | Purpose |
|---|---|
| Supabase | PostgreSQL DB, Auth, Storage buckets, RLS |
| Groq | Fast LLM inference (questions + feedback) and Whisper STT |
| Firebase Cloud Messaging | Push notification delivery |
| Docker | Backend containerization |
| GitHub Actions | CI/CD pipeline |
| Sentry | Error tracking (mobile + backend) |

---

## 4. Project Structure

### Monorepo Root

```
mockly/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── backend/         # Express API server
├── packages/
│   └── shared/          # Shared Zod schemas, TypeScript types, constants
├── docker-compose.yml   # Local backend + optional local Supabase
├── .github/
│   └── workflows/
│       ├── mobile-ci.yml
│       └── backend-ci.yml
├── doc.md               # This file
└── .env                 # Root-level env (never committed)
```

### apps/mobile

```
apps/mobile/
├── app/                          # Expo Router pages (file = route)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx        # Role/level selection after register
│   ├── (tabs)/
│   │   ├── index.tsx             # Home Dashboard
│   │   ├── history.tsx           # Session history list
│   │   ├── analytics.tsx         # Progress graphs + readiness score
│   │   └── profile.tsx           # User profile settings
│   ├── session/
│   │   ├── setup.tsx             # Mode + topic selection
│   │   ├── [id].tsx              # Active interview screen
│   │   └── result/[id].tsx       # End screen with score breakdown
│   └── _layout.tsx               # Root layout (auth guard)
├── components/
│   ├── ui/                       # Reusable primitives (Button, Card, Badge…)
│   ├── session/
│   │   ├── QuestionCard.tsx
│   │   ├── AnswerInput.tsx       # Handles both text and voice mode
│   │   ├── FeedbackCard.tsx
│   │   ├── TimerBar.tsx
│   │   └── VoiceRecorder.tsx
│   ├── analytics/
│   │   ├── ScoreChart.tsx
│   │   ├── WeakTopicsGrid.tsx
│   │   └── ReadinessGauge.tsx
│   └── common/
│       ├── ScreenWrapper.tsx
│       ├── LoadingOverlay.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useSession.ts             # Session lifecycle React Query hooks
│   ├── useVoiceRecorder.ts       # Expo AV abstraction
│   ├── useAuth.ts                # Supabase auth helpers
│   └── useNotifications.ts      # Expo Notifications setup
├── stores/
│   ├── authStore.ts              # Zustand: user, token, profile
│   ├── sessionStore.ts           # Zustand: active session state (ephemeral)
│   └── settingsStore.ts          # Zustand: app preferences (persisted)
├── lib/
│   ├── supabase.ts               # Supabase client init
│   ├── api.ts                    # Fetch wrapper with auth headers
│   ├── queryClient.ts            # React Query client config
│   └── websocket.ts              # WebSocket client for streaming feedback
├── constants/
│   ├── roles.ts                  # Role + level enum values
│   └── topics.ts                 # Question category constants
├── types/
│   └── index.ts                  # Re-exports from packages/shared
├── assets/
│   ├── fonts/
│   └── images/
├── app.json
├── babel.config.js
├── expo-env.d.ts
└── tsconfig.json
```

### apps/backend

```
apps/backend/
├── src/
│   ├── index.ts                  # Entry: Express app + WebSocket server init
│   ├── app.ts                    # Express app config (middleware, routes)
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── sessions.routes.ts
│   │   ├── questions.routes.ts
│   │   ├── answers.routes.ts
│   │   └── analytics.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── sessions.controller.ts
│   │   ├── questions.controller.ts
│   │   ├── answers.controller.ts
│   │   └── analytics.controller.ts
│   ├── services/
│   │   ├── groq.service.ts       # All Groq API calls (core AI engine)
│   │   ├── supabase.service.ts   # DB read/write helpers
│   │   ├── voice.service.ts      # Whisper transcription
│   │   └── analytics.service.ts # Score aggregation + readiness formula
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT verification via Supabase JWKS
│   │   ├── validate.middleware.ts# Zod schema validation
│   │   ├── upload.middleware.ts  # Multer config for audio files
│   │   └── error.middleware.ts   # Global error handler
│   ├── websocket/
│   │   ├── wsServer.ts           # ws server setup
│   │   └── feedbackStream.ts    # Streams Groq tokens to client
│   ├── schemas/
│   │   ├── session.schema.ts
│   │   ├── answer.schema.ts
│   │   └── question.schema.ts
│   ├── lib/
│   │   ├── groq.ts               # Groq SDK client instance
│   │   ├── supabase.ts           # Supabase service-role client
│   │   └── logger.ts             # Winston logger
│   └── types/
│       └── index.ts
├── Dockerfile
├── tsconfig.json
└── package.json
```

### packages/shared

```
packages/shared/
├── src/
│   ├── schemas/
│   │   ├── user.schema.ts
│   │   ├── session.schema.ts
│   │   ├── question.schema.ts
│   │   └── answer.schema.ts
│   ├── types/
│   │   └── index.ts              # UserRole, DifficultyLevel, SessionMode…
│   └── constants/
│       ├── roles.ts
│       └── topics.ts
└── package.json
```

---

## 5. Database Schema

All tables live in Supabase PostgreSQL. Enable Row Level Security (RLS) on every table. Use `uuid` primary keys with `gen_random_uuid()` default. All timestamps are `timestamptz`.

### Table: profiles

Extends Supabase `auth.users` with app-specific data. Created via trigger on `auth.users` INSERT.

```sql
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text UNIQUE,
  full_name     text,
  avatar_url    text,
  role          text NOT NULL DEFAULT 'general',  -- 'frontend'|'backend'|'react_native'|'general'
  level         text NOT NULL DEFAULT 'junior',   -- 'junior'|'middle'|'senior'
  streak_count  integer NOT NULL DEFAULT 0,
  last_active   timestamptz,
  expo_push_token text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self" ON public.profiles
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

### Table: sessions

Represents a single interview session.

```sql
CREATE TABLE public.sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode             text NOT NULL,   -- 'text'|'voice'|'rapid'
  topic            text NOT NULL,   -- 'react'|'react_native'|'javascript'|'system_design'|'behavioral'|'mixed'
  role             text NOT NULL,   -- snapshot of user role at session time
  level            text NOT NULL,   -- snapshot of user level at session time
  status           text NOT NULL DEFAULT 'active',  -- 'active'|'completed'|'abandoned'
  total_score      numeric(4,2),    -- 0.00–10.00, set on completion
  readiness_delta  numeric(4,2),    -- change in readiness score this session
  question_count   integer NOT NULL DEFAULT 0,
  duration_seconds integer,
  started_at       timestamptz NOT NULL DEFAULT now(),
  ended_at         timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_owner" ON public.sessions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Table: questions

Stores both bank/template questions and AI-generated session questions.

```sql
CREATE TABLE public.questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  -- NULL session_id = bank/template question
  topic           text NOT NULL,
  category        text NOT NULL,    -- 'technical'|'behavioral'|'system_design'
  role            text NOT NULL,
  level           text NOT NULL,
  text            text NOT NULL,
  follow_up_of    uuid REFERENCES public.questions(id),
  is_template     boolean NOT NULL DEFAULT false,
  order_index     integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX questions_session_idx ON public.questions(session_id);
CREATE INDEX questions_topic_idx   ON public.questions(topic, role, level);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_read_template" ON public.questions
  FOR SELECT USING (is_template = true AND auth.role() = 'authenticated');
CREATE POLICY "questions_read_session" ON public.questions
  FOR SELECT USING (
    is_template = false AND
    session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid())
  );
-- Backend service role bypasses RLS for all inserts
```

### Table: answers

Stores a user's answer to one question within a session.

```sql
CREATE TABLE public.answers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  question_id         uuid NOT NULL REFERENCES public.questions(id),
  user_id             uuid NOT NULL REFERENCES public.profiles(id),
  text                text,
  audio_url           text,                  -- Supabase Storage path if voice mode
  transcript          text,                  -- Whisper output before user edits
  score               numeric(3,1),          -- 0.0–10.0
  score_structure     numeric(3,1),
  score_technical     numeric(3,1),
  score_clarity       numeric(3,1),
  feedback_summary    text,
  feedback_strengths  text[],
  feedback_weaknesses text[],
  ai_recommendation   text,
  skipped             boolean NOT NULL DEFAULT false,
  time_taken_seconds  integer,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX answers_session_idx ON public.answers(session_id);
CREATE INDEX answers_user_idx    ON public.answers(user_id);

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers_owner" ON public.answers
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Table: analytics_snapshots

Daily aggregate for progress charts. Written by backend on session completion.

```sql
CREATE TABLE public.analytics_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date    date NOT NULL,
  avg_score        numeric(4,2),
  sessions_count   integer NOT NULL DEFAULT 0,
  questions_count  integer NOT NULL DEFAULT 0,
  readiness_score  numeric(4,2),
  weak_topics      text[],
  UNIQUE (user_id, snapshot_date)
);

CREATE INDEX analytics_user_date_idx ON public.analytics_snapshots(user_id, snapshot_date DESC);

ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_owner" ON public.analytics_snapshots
  USING (auth.uid() = user_id);
```

### Trigger: auto-create profile on sign-up

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 6. API Design

Base path: `/api`. All endpoints require `Authorization: Bearer <supabase_jwt>` unless marked public.

### 6.1 Auth — `/api/auth`

Auth is handled client-side via `@supabase/supabase-js`. The backend exposes only supplemental profile endpoints.

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/api/auth/profile` | `{ role, level, full_name }` | `{ profile }` | Called after onboarding |
| GET | `/api/auth/profile` | — | `{ profile }` | Fetch current user profile |
| PUT | `/api/auth/profile` | `{ role?, level?, full_name? }` | `{ profile }` | Update profile |

### 6.2 Sessions — `/api/sessions`

| Method | Path | Body / Params | Response | Notes |
|---|---|---|---|---|
| POST | `/api/sessions` | `{ mode, topic }` | `{ session_id, first_question }` | Creates session + generates first question |
| GET | `/api/sessions` | `?page&limit` | `{ sessions[], total }` | Session history, paginated |
| GET | `/api/sessions/:id` | — | `{ session, questions[], answers[] }` | Full session detail |
| PATCH | `/api/sessions/:id/end` | `{ duration_seconds }` | `{ session, analytics }` | Marks session complete, triggers snapshot |
| DELETE | `/api/sessions/:id` | — | `204` | Soft delete (sets status to abandoned) |

### 6.3 Questions — `/api/questions`

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/api/questions/next` | `{ session_id, previous_answer_score? }` | `{ question }` | Generates next question (adaptive difficulty) |
| POST | `/api/questions/followup` | `{ session_id, question_id, answer_text }` | `{ question }` | AI generates follow-up |
| GET | `/api/questions/bank` | `?topic&role&level&page` | `{ questions[], total }` | Browse question bank |

### 6.4 Answers — `/api/answers`

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/api/answers` | `{ session_id, question_id, text }` | `{ answer, feedback }` | Text answer — triggers AI analysis |
| POST | `/api/answers/voice` | multipart: `audio` + `session_id`, `question_id` | `{ answer, feedback, transcript }` | Voice answer — Whisper first, then analysis |
| PUT | `/api/answers/:id` | `{ text }` | `{ answer }` | Edit transcript before final submit |
| POST | `/api/answers/:id/skip` | — | `{ answer }` | Mark question as skipped |

### 6.5 Analytics — `/api/analytics`

| Method | Path | Params | Response | Notes |
|---|---|---|---|---|
| GET | `/api/analytics/summary` | — | `{ readiness_score, avg_score, streak, sessions_count }` | Dashboard summary |
| GET | `/api/analytics/history` | `?days=30` | `{ snapshots[] }` | Daily snapshots for chart |
| GET | `/api/analytics/weak-topics` | — | `{ topics[{ name, avg_score, count }] }` | Topics needing improvement |
| GET | `/api/analytics/progress` | `?from&to` | `{ data[] }` | Score over time, date-ranged |

### 6.6 WebSocket — `ws://host/ws`

```
Client → connect with header  Authorization: Bearer <jwt>
Server → validates JWT, associates socket with user_id

Client → { type: "STREAM_FEEDBACK", payload: { session_id, question_id, answer_text } }
Server → { type: "TOKEN",           payload: "word " }          (repeated per token)
Server → { type: "DONE",            payload: { full_feedback } } (final structured object)
Server → { type: "ERROR",           payload: { message } }
```

The `full_feedback` in the DONE message matches the answer feedback shape: `{ score, score_structure, score_technical, score_clarity, feedback_summary, feedback_strengths, feedback_weaknesses, ai_recommendation }`.

---

## 7. Supabase Integration

### What Supabase Handles Directly (mobile client calls)

| Concern | Mechanism |
|---|---|
| Sign up / Sign in | `supabase.auth.signUp()`, `supabase.auth.signInWithPassword()` |
| Session refresh | `supabase.auth.onAuthStateChange()` — auto-refresh built-in |
| Password reset | `supabase.auth.resetPasswordForEmail()` |
| Avatar upload | `supabase.storage.from('avatars').upload()` |
| Audio file upload (voice) | `supabase.storage.from('audio').upload()` — then pass URL to backend |

### What the Express Backend Handles (service role)

The backend uses the **service role key** (bypasses RLS) for all writes involving AI-generated data:

- INSERT questions, answers, analytics_snapshots
- PATCH sessions (status, score, ended_at)
- All aggregation queries for analytics

### JWT Verification Pattern

The backend verifies JWTs locally using Supabase's JWKS endpoint — it does NOT call `supabase.auth.getUser()` on every request (network overhead on every request).

```typescript
// apps/backend/src/middleware/auth.middleware.ts
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const client = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600_000, // 10 minutes
});

export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const decoded = await verifyJwt(token, client);
    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Storage Buckets

| Bucket | Read Access | Contents |
|---|---|---|
| `avatars` | Public | User profile pictures |
| `audio` | Private (signed URLs only) | Voice answer recordings |

---

## 8. Groq AI Integration

### Model Selection

| Task | Model | Rationale |
|---|---|---|
| Question generation | `llama-3.1-70b-versatile` | Best quality for nuanced role-specific questions |
| Answer feedback/scoring | `llama-3.1-70b-versatile` | Consistent rubric adherence, structured JSON output |
| Follow-up questions | `llama-3.1-8b-instant` | Speed priority, lower complexity |
| Rapid drill mode | `llama-3.1-8b-instant` | Sub-200ms latency requirement |
| Speech-to-text | `whisper-large-v3` | Best accuracy on technical vocabulary |

### Groq Client Configuration

```typescript
// apps/backend/src/lib/groq.ts
import Groq from 'groq-sdk';

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const GROQ_DEFAULTS = {
  question: { max_tokens: 256, temperature: 0.8 },
  feedback:  { max_tokens: 512, temperature: 0.3 }, // low temp = consistent scoring
  followup:  { max_tokens: 128, temperature: 0.9 },
};
```

### Prompt Patterns

#### Question Generation

```typescript
// apps/backend/src/services/groq.service.ts

const QUESTION_SYSTEM_PROMPT = `You are a senior technical interviewer at a top-tier tech company.
Generate exactly one interview question. Return ONLY valid JSON, no markdown.

Response format:
{
  "text": "<the interview question>",
  "category": "technical|behavioral|system_design",
  "estimated_answer_minutes": <1-5>,
  "key_concepts": ["concept1", "concept2"]
}`;

function buildQuestionUserPrompt(params: {
  role: string;
  level: string;
  topic: string;
  previousTopics: string[];
  lastScore?: number;
}): string {
  const difficulty =
    params.lastScore === undefined ? 'appropriate' :
    params.lastScore < 4 ? 'simpler' :
    params.lastScore > 7 ? 'harder' : 'similar difficulty';

  return `Generate a ${difficulty} ${params.level} ${params.role} developer interview question
about ${params.topic}.
Previously asked topics to avoid: ${params.previousTopics.join(', ') || 'none'}.
The question should be realistic for a ${params.level} ${params.role} position.`;
}
```

#### Answer Feedback / Scoring

```typescript
const FEEDBACK_SYSTEM_PROMPT = `You are an expert technical interviewer evaluating a candidate's answer.
Score the answer and return ONLY valid JSON, no markdown, no explanation outside JSON.

Response format:
{
  "score": <0.0-10.0>,
  "score_structure": <0.0-10.0>,
  "score_technical": <0.0-10.0>,
  "score_clarity": <0.0-10.0>,
  "feedback_summary": "<2-3 sentences>",
  "feedback_strengths": ["<point>", "<point>"],
  "feedback_weaknesses": ["<point>", "<point>"],
  "ai_recommendation": "<one actionable improvement>"
}

Scoring rubric:
- score_structure: Is the answer well-organized? (STAR for behavioral, clear flow for technical)
- score_technical: Is the technical content accurate and complete?
- score_clarity: Is the answer clear and concise without unnecessary filler?
- score: Weighted average (structure 20%, technical 50%, clarity 30%)`;

// For behavioral questions, append:
const BEHAVIORAL_ADDENDUM = `
For behavioral questions enforce STAR format:
- Situation: Did they set context?
- Task: Did they clarify their responsibility?
- Action: Did they explain specific actions taken?
- Result: Did they quantify or describe the outcome?
Penalize missing STAR components in score_structure.`;
```

### Streaming Feedback (WebSocket path)

```typescript
// apps/backend/src/websocket/feedbackStream.ts
const stream = await groq.chat.completions.create({
  model: 'llama-3.1-70b-versatile',
  messages: [
    { role: 'system', content: FEEDBACK_SYSTEM_PROMPT },
    { role: 'user',   content: `Question: ${question}\n\nAnswer: ${answerText}` },
  ],
  stream: true,
  ...GROQ_DEFAULTS.feedback,
});

let fullText = '';
for await (const chunk of stream) {
  const token = chunk.choices[0]?.delta?.content ?? '';
  fullText += token;
  ws.send(JSON.stringify({ type: 'TOKEN', payload: token }));
}

const parsed = parseGroqJson(fullText); // see note 12.4
ws.send(JSON.stringify({ type: 'DONE', payload: parsed }));
```

### Error Handling for Groq

- JSON parse failure → retry once with stricter prompt (add `"IMPORTANT: Return ONLY raw JSON, no markdown"`)
- Non-JSON response → log to Sentry, return fallback object with `score: null` and message `"Feedback unavailable"`
- Rate limit 429 → exponential backoff, max 3 retries (1s, 2s, 4s)
- Timeout → 15s hard timeout on all Groq calls; surface error to user

---

## 9. State Management

### Zustand Stores

#### authStore (`stores/authStore.ts`)

```typescript
interface AuthState {
  user: User | null;               // Supabase User object
  profile: Profile | null;         // public.profiles row
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
}
```

Hydrated from `supabase.auth.onAuthStateChange()` in the root `_layout.tsx`. Profile is fetched via React Query immediately after auth is confirmed.

#### sessionStore (`stores/sessionStore.ts`)

```typescript
interface SessionState {
  activeSessionId: string | null;
  mode: 'text' | 'voice' | 'rapid' | null;
  topic: string | null;
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;          // 5–15, set at session start
  isRecording: boolean;
  timerSeconds: number;
  setSession: (id: string, mode: SessionMode, topic: string, total: number) => void;
  setCurrentQuestion: (q: Question) => void;
  setRecording: (v: boolean) => void;
  tickTimer: () => void;
  resetSession: () => void;
}
```

Ephemeral — reset on session end. Does NOT persist to AsyncStorage.

#### settingsStore (`stores/settingsStore.ts`)

```typescript
interface SettingsState {
  notificationsEnabled: boolean;
  reminderTime: string;            // "09:00"
  darkMode: boolean;
  questionCount: number;           // 5–15
  setNotifications: (v: boolean) => void;
  setReminderTime: (t: string) => void;
  setDarkMode: (v: boolean) => void;
  setQuestionCount: (n: number) => void;
}
```

Persisted via `zustand/middleware` `persist` with `AsyncStorage`.

### React Query Strategy

| Query Key | Stale Time | Cache Time | Invalidation Trigger |
|---|---|---|---|
| `['profile']` | 5 min | 30 min | Profile PUT |
| `['sessions']` | 1 min | 10 min | POST session, PATCH session/end |
| `['session', id]` | 0 | 5 min | Always refetch on mount |
| `['analytics', 'summary']` | 10 min | 1 hour | PATCH session/end |
| `['analytics', 'history']` | 10 min | 1 hour | PATCH session/end |
| `['weak-topics']` | 10 min | 1 hour | PATCH session/end |
| `['question-bank']` | 30 min | 2 hours | Rarely changes |

**Mutation patterns:**
- `POST /sessions` → on success: invalidate `['sessions']` and `['analytics', 'summary']`
- `POST /answers` → set `sessionStore.currentQuestion` in `onSuccess`, no cache invalidation needed
- `PATCH /sessions/:id/end` → invalidate `['sessions']`, `['analytics', 'summary']`, `['analytics', 'history']`

---

## 10. Environment Variables

### apps/backend/.env

```dotenv
# Server
PORT=3000
NODE_ENV=development

# Supabase (service role — NEVER expose to mobile)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase anon key — used only to construct JWKS URL for local JWT verification
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Groq
GROQ_API_KEY=gsk_...

# Sentry
SENTRY_DSN=https://...@sentry.io/...

# Upload limits
MAX_AUDIO_SIZE_MB=25

# CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

### apps/mobile/.env

Expo requires the `EXPO_PUBLIC_` prefix for all client-accessible env vars.

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000/ws
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

> **CRITICAL:** `SUPABASE_SERVICE_ROLE_KEY` must NEVER appear in the mobile app. The mobile app only holds the anon key. The service role key lives exclusively in the backend `.env`.

### Production Secrets (GitHub Actions)

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
GROQ_API_KEY
SENTRY_DSN_BACKEND
SENTRY_DSN_MOBILE
EXPO_TOKEN               # EAS Build
FCM_SERVER_KEY           # Firebase Admin SDK
DOCKER_REGISTRY_TOKEN
```

---

## 11. Development Setup

### Prerequisites

- Node.js 20 LTS
- pnpm 9+ (monorepo package manager)
- Expo CLI (`npm install -g expo-cli`)
- Docker Desktop (for backend local run)
- Supabase account + project created
- Groq account + API key

### Step 1: Clone and install

```bash
git clone https://github.com/solipsisticstratosphere/Mockly.git
cd mockly
pnpm install
```

### Step 2: Configure environment

```bash
cp apps/backend/.env.example apps/backend/.env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY

cp apps/mobile/.env.example apps/mobile/.env
# Fill in EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_API_URL
```

### Step 3: Set up Supabase

1. Create a new project at supabase.com
2. Run the SQL from Section 5 in the Supabase SQL Editor (order: profiles → sessions → questions → answers → analytics_snapshots → trigger)
3. Enable Email Auth in Authentication → Providers
4. Create storage buckets: `avatars` (public) and `audio` (private)
5. Confirm all RLS policies are applied

### Step 4: Start the backend

```bash
# Option A: direct
pnpm --filter backend dev

# Option B: Docker Compose
docker-compose up backend
```

Backend runs on `http://localhost:3000`.

### Step 5: Start the mobile app

```bash
pnpm --filter mobile start
# Press 'i' for iOS simulator, 'a' for Android emulator
```

### Step 6: Verify the stack

1. Register a user in the app → check `public.profiles` in Supabase Table Editor
2. Start a session → check `public.sessions` for a new row
3. Answer a question → check `public.answers` for score and feedback
4. Check backend logs for successful Groq API calls

### Running Tests

```bash
pnpm --filter backend test   # Jest unit tests
pnpm --filter mobile test    # Jest + React Native Testing Library
pnpm test                    # All tests
```

### docker-compose.yml (minimal)

```yaml
version: '3.9'
services:
  backend:
    build: ./apps/backend
    ports:
      - "3000:3000"
    env_file: ./apps/backend/.env
    volumes:
      - ./apps/backend/src:/app/src
    command: npm run dev
```

---

## 12. Key Implementation Notes

Non-obvious decisions and gotchas that AI agents must know.

### 12.1 Auth Token Flow

The mobile app gets a JWT from Supabase Auth. Attach it to every Express request as `Authorization: Bearer <token>`. The backend verifies it using `jsonwebtoken` + `jwks-rsa` against Supabase's JWKS endpoint — never call `supabase.auth.getUser()` on each request (adds network latency to every API call).

On the mobile side, always get the current token from `supabase.auth.getSession()` inside the `api.ts` request interceptor. Do not cache the JWT string in Zustand — it may expire between calls.

### 12.2 Voice Mode Audio Format

Expo AV records `.m4a` (AAC) by default on both iOS and Android. Groq Whisper accepts: `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, `webm`. Do NOT transcode — send the `.m4a` directly. Use `RecordingOptionsPresets.HIGH_QUALITY` for best Whisper accuracy. Hard limit: 25 MB (Groq API). A 3-minute HIGH_QUALITY recording is ~2–4 MB — well within limits.

### 12.3 Adaptive Difficulty Logic

The `POST /questions/next` endpoint accepts `previous_answer_score`. Apply this logic in `groq.service.ts` as a natural-language modifier in the user prompt:

```
score < 4.0   → "Generate a simpler question, reduce conceptual depth"
score 4.0–7.0 → "Generate a question of similar difficulty"
score > 7.0   → "Generate a harder question, add edge cases or scale considerations"
```

Do not use separate model parameters for this — prompt engineering is sufficient.

### 12.4 JSON Parsing Safety for Groq Outputs

Groq models occasionally wrap JSON in markdown code fences. Always strip them before `JSON.parse()`:

```typescript
function parseGroqJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}
```

Follow with Zod validation to confirm the shape matches the expected schema before using the result.

### 12.5 React Query vs Zustand Boundary

- **React Query** owns all server state: sessions list, session detail, analytics, question bank
- **Zustand** owns UI and ephemeral state: active session progress, recording state, auth user object, settings

Never store server data in Zustand. Never store active session UI state in React Query. The `currentQuestion` in `sessionStore` comes from the mutation response of `POST /questions/next` — set it in the mutation's `onSuccess` callback.

### 12.6 Expo Router Auth Guard

Implement auth protection in `app/_layout.tsx` using `useSegments()` and `useRouter()`. Do NOT use middleware files.

```typescript
// app/_layout.tsx
const { isAuthenticated, isLoading } = useAuthStore();
const segments = useSegments();
const router = useRouter();

useEffect(() => {
  if (isLoading) return;
  const inAuthGroup = segments[0] === '(auth)';
  if (!isAuthenticated && !inAuthGroup) {
    router.replace('/(auth)/login');
  } else if (isAuthenticated && inAuthGroup) {
    router.replace('/(tabs)');
  }
}, [isAuthenticated, isLoading, segments]);
```

### 12.7 Offline SQLite Cache

Use `expo-sqlite` to cache:
- The last 10 completed sessions (questions + answers + feedback)
- The user's profile and current streak

Write to SQLite only after `PATCH /sessions/:id/end` succeeds — never cache active sessions mid-flight. On app launch with no network, read from SQLite for the History tab and show an "Offline mode — showing cached data" banner.

### 12.8 Notifications and Streak System

- Schedule daily reminder notifications client-side via `expo-notifications` — no server required for basic reminders
- The streak is calculated server-side: on `PATCH /sessions/:id/end`, check if the user had a session yesterday; if yes, increment `streak_count`; if no (or more than 1 day gap), reset to 1
- FCM (Firebase Cloud Messaging) is used for server-triggered pushes (e.g., "You've been away 2 days!"). Save the Expo push token to `profiles.expo_push_token` on app launch

### 12.9 Monorepo Shared Schemas

Use `pnpm workspaces`. The `packages/shared` Zod schemas are imported by both apps:

```json
// apps/backend/package.json and apps/mobile/package.json
{ "dependencies": { "@mockly/shared": "workspace:*" } }
```

A single Zod schema change (e.g., adding a field to `AnswerSchema`) propagates to both the API validator and the mobile type system simultaneously.

### 12.10 Sentry Integration

- Mobile: wrap the Expo root in `Sentry.wrap()` via `sentry-expo`
- Backend: call `Sentry.init()` before Express app setup; add `Sentry.Handlers.requestHandler()` and `Sentry.Handlers.errorHandler()` as Express middleware
- Tag every Sentry event with `user_id` and `session_id` for traceability
- Add Sentry breadcrumbs in the Groq retry logic to track retry attempts

### 12.11 Readiness Score Formula

The readiness score (0–100) on the analytics dashboard is calculated in `analytics.service.ts`:

```
readiness = (
  (avg_score_last_7_sessions / 10) * 60 +   // 60%: recent performance
  (min(streak_count, 30) / 30)   * 20 +     // 20%: consistency (capped at 30 days)
  (min(sessions_last_30_days, 20) / 20) * 20 // 20%: volume (capped at 20 sessions)
) * 100
```

Cap result at 100. Recalculate on every `PATCH /sessions/:id/end`.

### 12.12 Question Count Is Client-Controlled

The session question count (5–15) is set at session creation and stored only in `sessionStore.totalQuestions`. The backend does NOT enforce a question count limit. The mobile app decides when to call `PATCH /sessions/:id/end`. This is intentional — it allows an "unlimited mode" in the future without a schema migration.

---

## Implementation Order for Agents

1. Scaffold monorepo with pnpm workspaces (`packages/shared`, `apps/mobile`, `apps/backend`)
2. Implement `packages/shared` Zod schemas and TypeScript types — everything else depends on these
3. Apply SQL schema to Supabase (Section 5): tables, RLS policies, trigger
4. Build Express backend skeleton: middleware stack, route registration, Supabase service-role client, Groq client
5. Implement `groq.service.ts` with prompt patterns from Section 8 — this is the core value driver
6. Implement REST controllers domain by domain: auth → sessions → questions → answers → analytics
7. Add WebSocket server for streaming feedback
8. Build the mobile app: Supabase client, auth store, auth guard in `_layout.tsx`, tab screens
9. Build session flow screens: setup → active interview → result
10. Build analytics screens last (requires completed session data)

---

*Last updated: 2026-06-01 — Mockly v1.0 architecture*
