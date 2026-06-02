# Mockly — Build Plan

Design reference: `/design/` (Mockly.html, MocklyKit.jsx, MocklyTabs.jsx, MocklySession.jsx)

**Stack:** React Native (Expo SDK 56) · Supabase · Node.js + Express · Groq API  
**Monorepo:** npm workspaces — `apps/mobile`, `apps/backend`, `packages/shared`

---

## Phase 1 — Monorepo Scaffold ✅
- [x] Init `package.json` at root with npm workspaces
- [x] Create `apps/mobile` via `create-expo-app` (TypeScript template, Expo 56 + React 19)
- [x] Create `apps/backend` with `package.json` + Express + TypeScript
- [x] Create `packages/shared` with Zod schemas + shared types
- [x] Configure `tsconfig.json` per-package
- [x] Create `.gitignore` covering `node_modules`, `.env`, `dist`, `.expo`
- [x] Install all dependencies (npm workspaces)

---

## Phase 2 — Design System (apps/mobile) ✅
> Translated from `MocklyKit.jsx` — deep navy + Mulish + score scale

- [x] `constants/colors.ts` — M token palette (blue800, blue700, green, amber, red, neutrals)
- [x] `constants/typography.ts` — Mulish font weight constants
- [x] `lib/score.ts` — `scoreColor()` and `scoreLabel()` helpers
- [x] `components/ui/Icon.tsx` — 35 SVG icons via react-native-svg
- [x] `components/ui/Button.tsx` — primary / secondary / ghost / success / light variants
- [x] `components/ui/Card.tsx` — white card with border + optional onPress
- [x] `components/ui/Badge.tsx` — 7 toned pill badges incl. onDark
- [x] `components/ui/Chip.tsx` — active/inactive toggle chip
- [x] `components/ui/ScoreRing.tsx` — animated circular progress (readiness ring)
- [x] `components/ui/ScoreBar.tsx` — animated horizontal score bar
- [x] `components/ui/ListRow.tsx` — icon + title + subtitle + meta row
- [x] `components/ui/SectionHeader.tsx` — uppercase section label with action slot
- [x] `components/ui/index.ts` — barrel re-export

---

## Phase 3 — Navigation Structure (Expo Router) ✅
- [x] `app/_layout.tsx` — root layout with Supabase auth listener, font loading, auth guard
- [x] `app/(auth)/_layout.tsx`
- [x] `app/(tabs)/_layout.tsx` — custom TabBar with FAB play button (2-left / FAB / 2-right)
- [x] `app/session/_layout.tsx` — `slide_from_bottom` animation
- [x] `app/session/result/_layout.tsx`

---

## Phase 4 — State Management ✅
- [x] `lib/supabase.ts` — Supabase client (anon key, auto refresh)
- [x] `lib/api.ts` — typed fetch wrapper injecting Bearer token from active session
- [x] `lib/queryClient.ts` — React Query client (retry 1, 60s staleTime)
- [x] `stores/authStore.ts` — user, profile, isAuthenticated, signOut
- [x] `stores/sessionStore.ts` — ephemeral active session state (never persisted)
- [x] `stores/settingsStore.ts` — persisted preferences via AsyncStorage

---

## Phase 5 — Auth Screens ✅
- [x] `app/(auth)/login.tsx` — navy hero, Mockly logo + sparkle, email/password, Supabase signIn
- [x] `app/(auth)/register.tsx` — same shell, full name + email + password, Supabase signUp
- [x] `app/(auth)/onboarding.tsx` — role chips + level chips → POST /api/auth/profile → tabs

---

## Phase 6 — Tab Screens ✅
- [x] `app/(tabs)/index.tsx` — HomeScreen: readiness ring hero, streak, start CTA, focus area, recent sessions
- [x] `app/(tabs)/history.tsx` — HistoryScreen: filter chips, SectionList grouped by Today/Yesterday/Earlier
- [x] `app/(tabs)/analytics.tsx` — AnalyticsScreen: readiness ring + stats grid, SVG trend chart, topic mastery
- [x] `app/(tabs)/profile.tsx` — ProfileScreen: user hero, mini stats, interview target, settings with Switch

---

## Phase 7 — Session Flow Screens ✅
- [x] `app/session/setup.tsx` — mode cards (Text/Voice/Rapid), topic chips, question count stepper
- [x] `app/session/[id].tsx` — navy progress bar + timer dots, question card, text/voice input, "Analyzing…" spinner, inline FeedbackCard with sub-score bars
- [x] `app/session/result/[sessionId].tsx` — large ScoreRing in navy header, readiness delta card, per-question breakdown, Done/Again buttons

---

## Phase 8 — Backend ✅
- [x] `apps/backend/src/lib/` — logger (Winston), supabase (service role), groq (client + models)
- [x] `apps/backend/src/middleware/` — auth (JWKS JWT), validate (Zod), error handler
- [x] `apps/backend/src/services/groq.service.ts` — generateQuestion, analyzeFeedback, streamFeedback (async generator), transcribeAudio (Whisper)
- [x] `apps/backend/src/services/analytics.service.ts` — calcReadinessScore formula, upsertDailySnapshot
- [x] `apps/backend/src/routes/` — auth, sessions, questions, answers, analytics
- [x] `apps/backend/src/app.ts` — Express app with CORS, routes, error handler
- [x] `apps/backend/src/index.ts` — HTTP server + WebSocketServer on /ws for streaming feedback
- [x] `apps/backend/.env.example`, `Dockerfile`, `tsconfig.json`

---

## Phase 9 — Shared Package ✅
- [x] `packages/shared/src/types/index.ts` — UserRole, DifficultyLevel, SessionMode, all interfaces
- [x] `packages/shared/src/schemas/` — Zod schemas for user, session, question, answer
- [x] `packages/shared/src/constants/` — ROLES, LEVELS, TOPICS, SESSION_MODES arrays
- [x] `packages/shared/src/index.ts` — barrel export
- [x] `packages/shared/tsconfig.json`

---

## Pending / Next Steps

- [ ] **Supabase setup** — run SQL schema from `docs/OVERVIEW.md` §5, enable Auth, create storage buckets
- [ ] **Environment files** — copy `.env.example` → `.env` and fill in real keys (Supabase, Groq)
- [ ] **Wire React Query hooks** — replace mock data in tab screens with `apiGet` calls
- [ ] **expo-av voice recording** — wire `useVoiceRecorder` hook in `VoicePanel` component
- [ ] **Push notifications** — register Expo push token, save to `profiles.expo_push_token`
- [ ] **Offline SQLite cache** — implement local session cache for History tab
- [ ] **CI/CD** — GitHub Actions workflows for mobile type-check and backend tests

---

## Legend
- `[x]` = done
- `[ ]` = pending
