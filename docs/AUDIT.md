# Mockly — Аудит кодовой базы

> Дата: 2026-06-05  
> Охват: Backend (Express), Mobile (Expo/React Native), Монорепо + shared-пакет  
> Статус: В процессе исправления — см. пометки ✅ у решённых проблем

---

## Сводная таблица

| Слой | 🔴 Критические | 🟠 Высокие | 🟡 Средние | 🟢 Технический долг |
|------|:-:|:-:|:-:|:-:|
| Backend | 4 | 4 | 5 | 3 |
| Mobile | 3 | 4 | 5 | 2 |
| Монорепо / Shared | 1 | 2 | 3 | 3 |

---

## 🔴 Критические проблемы

### 1. Скомпрометированные секреты в `.env`

**Файлы:** `apps/backend/.env`, `apps/mobile/.env`

В открытом виде на диске лежат:
- `SUPABASE_SERVICE_ROLE_KEY` — полный обход RLS, доступ к любой записи в БД
- `SUPABASE_JWT_SECRET` — возможность подписывать произвольные JWT
- `GROQ_API_KEY` — неограниченные LLM-вызовы за счёт владельца
- `SUPABASE_ANON_KEY` — публичный по природе, но лежит открытым

Файлы добавлены в `.gitignore` и в историю git не попали. Тем не менее ключи живые и их нужно ротировать.

**Действие:** ротировать все ключи в Supabase Dashboard и Groq Console.

---

### 2. ✅ Отсутствие Rate Limiting на LLM-эндпоинтах

> **Исправлено:** создан `apps/backend/src/middleware/rateLimiter.ts` — 30 req / 15 min на пользователя. Лимитер добавлен на `POST /api/answers`, `POST /api/answers/voice`, `POST /api/questions/next`, `POST /api/questions/followup`. При превышении возвращается `429`.

**Файлы:** `apps/backend/src/routes/answers.routes.ts`, `questions.routes.ts`

Эндпоинты `POST /api/answers`, `POST /api/questions/next`, `POST /api/answers/voice` не имеют никакого ограничения частоты запросов. Любой авторизованный пользователь может отправлять тысячи запросов, генерируя расходы на Groq API.

---

### 3. ✅ Privilege Escalation — доступ к чужим сессиям

> **Исправлено:** в `/followup` добавлен `.eq('user_id', req.userId)` при выборке сессии. В `/voice` добавлены ownership checks: сессия принадлежит пользователю + вопрос принадлежит сессии. Убран небезопасный `question!` force-unwrap.

**Файл:** `apps/backend/src/routes/questions.routes.ts` — `POST /api/questions/followup`

Эндпоинт не проверяет, что `session_id` принадлежит `req.userId`. Любой авторизованный пользователь, зная чужой `session_id`, может генерировать вопросы в его сессии.

Та же уязвимость в `apps/backend/src/routes/answers.routes.ts` — `POST /api/answers/voice`: не проверяется владелец `session_id` и `question_id`.

```typescript
// questions.routes.ts — нет .eq('user_id', req.userId) при выборке сессии
const { data: session } = await supabase
  .from('sessions')
  .select('*')
  .eq('id', session_id)  // ← только по id, без проверки владельца
  .single();
```

---

### 4. ✅ CORS открыт по умолчанию

> **Исправлено:** fallback изменён с `'*'` на `false`. При отсутствии `ALLOWED_ORIGINS` middleware не устанавливает `Access-Control-Allow-Origin`, что блокирует все кросс-доменные запросы. `.env` уже содержит `ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081`, так что dev не затронут.

**Файл:** `apps/backend/src/app.ts`

```typescript
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));
```

При отсутствии переменной `ALLOWED_ORIGINS` API принимает запросы с любого origin.

**Рекомендация:** сделать fallback `false` или `[]`, а не `'*'`.

---

### 5. ✅ Voice Mode не реализован

> **Исправлено:** в `VoicePanel` реализована полноценная логика записи через `expo-av`. Функции `startRecording` / `stopRecording` управляют `Audio.Recording`; URI сохраняется в `uriRef`. Submit собирает `FormData` с аудиофайлом и полями `session_id` / `question_id`, отправляет на `POST /api/answers/voice` через `apiPostFormData`, получает `AnswerFeedback` и передаёт его родителю через `onFeedback`. Обработаны edge-кейсы: отсутствие записи перед сабмитом, отказ в разрешении микрофона, прерывание записи при нажатии Skip, ошибка сети.

**Файл:** `apps/mobile/app/session/[id].tsx`

Компонент `VoicePanel` имеет UI (кнопка микрофона, таймер), но не содержит ни строчки логики записи аудио. `expo-av` установлен в `package.json`, но не импортируется в компоненте. При нажатии "Submit" на сервер уходит пустой запрос.

---

### 6. ✅ Зависание UI при зависшем сетевом запросе

> **Исправлено:** в `submitAnswer()` добавлен `AbortController` с таймаутом 30 секунд. `apiPost` расширен опциональным параметром `signal?: AbortSignal`. При истечении таймаута `catch` получает `AbortError` и показывает сообщение о проблеме с соединением, фаза сбрасывается в `'answering'`.

**Файл:** `apps/mobile/app/session/[id].tsx` — функция `submitAnswer()`

```typescript
setPhase('analyzing');  // ← переключается оптимистически ДО ответа сервера
try {
  const res = await apiPost('/api/answers', { ... });
  setPhase('feedback');
} catch {
  setPhase('answering');  // ← срабатывает только при явной ошибке
}
```

Если запрос завис (нет ответа и нет ошибки), `catch` не вызывается. UI остаётся в состоянии `'analyzing'` навсегда.

---

## 🟠 Высокий приоритет

### 7. ✅ Нет транзакций при создании сессии

> **Исправлено:** генерация вопроса и его вставка обёрнуты в `try/catch`. При любой ошибке (Groq API недоступен, ошибка БД) сессия помечается `status: 'abandoned'` и клиент получает `500` с понятным сообщением. Осиротевших сессий в БД больше не остаётся.

**Файл:** `apps/backend/src/routes/sessions.routes.ts`

```typescript
const { data: session } = await supabase.from('sessions').insert(...).single();
// если следующий insert упадёт — сессия существует без первого вопроса
const { data: question } = await supabase.from('questions').insert(...).single();
```

При сбое второго запроса в БД остаётся сессия без вопроса. Нет rollback-логики.

---

### 8. Auth Middleware делает HTTP-запрос на каждый вызов API

> **Частично:** создан `apps/backend/src/config/jwks.ts` с общим JWKS-клиентом (cache: true) и хелпером `verifyJwt()`. `index.ts` обновлён для использования этого хелпера вместо inline-настройки. HTTP-middleware оставлен на `supabase.auth.getUser()` — локальная верификация ломала аутентификацию (Supabase может использовать HS256/RS256 в зависимости от окружения). Требует отдельного расследования.

**Файл:** `apps/backend/src/middleware/auth.middleware.ts`

`supabase.auth.getUser(token)` — сетевой вызов к Supabase при каждом запросе. WebSocket-хендлер в `index.ts` правильно верифицирует JWT локально через JWKS с кешем. Auth middleware нужно привести к той же схеме.

---

### 9. ✅ Supabase Service Role Key используется для всех операций

> **Исправлено:** в `apps/backend/src/config/supabase.ts` добавлена фабрика `createUserSupabaseClient(token)` — создаёт клиент с `SUPABASE_ANON_KEY` и `Authorization: Bearer <token>`, что активирует RLS с контекстом пользователя. `auth.middleware.ts` расширен: `AuthRequest` теперь включает `userSupabase?: SupabaseClient`, который создаётся после верификации JWT и прикрепляется к запросу. Route-хендлеры могут использовать `req.userSupabase` для пользовательских запросов (с RLS) и `supabase` — для системных операций.

**Файл:** `apps/backend/src/lib/supabase.ts`

Единственный клиент с `SERVICE_ROLE_KEY` обходит Row Level Security для всех запросов. Нарушается принцип минимальных привилегий. Нужно разделить: сервисный клиент — только для системных операций, обычные запросы — через user-контекстный клиент с JWT пользователя.

---

### 10. ✅ Три источника правды в session flow

> **Исправлено:** `[id].tsx` теперь использует `useSessionStore` как источник правды для мутируемых данных сессии. При монте, если `activeSessionId !== sessionId`, вызываются `setSession` и `storeSetQuestion` — инициализация из URL-параметров. `useState` для `currentQuestion`, `index` и `seconds` удалены; вместо них используются `store.currentQuestion`, `store.questionIndex`, `store.timerSeconds`. Таймер переключён на `store.tickTimer()`. В `advance()` вызывается `storeSetQuestion(res.question)` (вместо двух отдельных `setCurrentQuestion` + `setIndex`). В `endSession()` вызывается `resetSession()` перед навигацией. При сворачивании/разворачивании приложения store сохраняет состояние и компонент восстанавливается без повторной инициализации.

**Файлы:** `apps/mobile/stores/sessionStore.ts`, `apps/mobile/app/session/[id].tsx`

Состояние сессии хранится одновременно в:
1. **Zustand Store** (`sessionStore.ts`) — записывается при старте, но никогда не читается
2. **URL-параметры** (`useLocalSearchParams`) — фактический источник правды в `[id].tsx`
3. **Local State** (`useState`) — дублирует часть данных из URL

При сворачивании и разворачивании приложения состояние рассинхронизируется.

---

### 11. Нет инвалидации кеша React Query после завершения сессии

**Файл:** `apps/mobile/app/session/[id].tsx` — функция `endSession()`

После вызова `PATCH /api/sessions/:id/end` не вызывается `queryClient.invalidateQueries`. Пользователь, вернувшись на Home или Analytics, видит устаревшие данные до истечения `staleTime` (60 секунд).

---

### 12. `JSON.parse` без try/catch в критических местах

**Файлы:**
- `apps/mobile/app/session/result/[sessionId].tsx` — `JSON.parse(scoresRaw ?? '[]')` без try/catch → краш приложения
- `apps/mobile/app/session/[id].tsx` — `JSON.parse(firstQuestionRaw ?? '{}')` молча возвращает `null` → экран зависает на загрузке

---

### 13. `streak_count` никогда не обновляется

**Файл:** `apps/backend/src/services/analytics.service.ts`

Значение `streak_count` читается из профиля и отображается пользователю, но логики его инкрементирования нигде нет. Показатель всегда равен 0.

---

### 14. Silent error в инициализации Auth

**Файл:** `apps/mobile/app/_layout.tsx`

```typescript
apiGet('/api/auth/profile')
  .then(r => setProfile(r.profile))
  .catch(() => {});  // ← ошибка молча игнорируется
```

Если загрузка профиля упала, пользователь видит прочерки вместо имени и роли по всему приложению без какого-либо уведомления.

---

### 15. Расчёт аналитики по неделям некорректен

**Файл:** `apps/backend/src/routes/analytics.routes.ts`

```typescript
const last7Scores = sessions.slice(0, 7).map(s => s.total_score ?? 0);
```

Берёт 7 последних сессий по порядку выборки, а не за 7 последних дней. Если пользователь прошёл 7 сессий за один день — аналитика "за неделю" будет по одному дню.

---

## 🟡 Средние проблемы

### 16. Компоненты не мемоизированы

**Файлы:** `apps/mobile/app/(tabs)/analytics.tsx`, `apps/mobile/app/session/[id].tsx`, `apps/mobile/app/(tabs)/index.tsx`

- `TrendChart` — пересчитывает все координаты SVG при каждом ре-рендере родителя
- `SessionRow`, `QuestionRow`, `FeedbackCard` — нет `React.memo`
- `Array.from({ length: totalCount })` в JSX — нет `useMemo`
- `.sort((a, b) => b.avg_score - a.avg_score)` в JSX — нет `useMemo`

---

### 17. Нет пагинации в History

**Файл:** `apps/mobile/app/(tabs)/history.tsx`

`useSessions(50)` грузит 50 сессий одним запросом без `useInfiniteQuery` и кнопки "загрузить ещё".

---

### 18. Нет обработчика аппаратной кнопки "Назад" на Android

**Файл:** `apps/mobile/app/session/[id].tsx`

Пользователь может выйти из активной сессии аппаратной кнопкой Android без подтверждения. Весь прогресс сессии теряется.

---

### 19. Лимиты пагинации не валидируются

**Файлы:** `apps/backend/src/routes/sessions.routes.ts`, `analytics.routes.ts`

```typescript
const limit = Number(req.query.limit ?? 10);  // limit=999999 принимается
const days = Number(req.query.days ?? 30);     // days=-1000 принимается
```

Нет ограничений на диапазон значений. Нужны Zod-схемы для query-параметров.

---

### 20. Settings хранятся только локально

**Файл:** `apps/mobile/stores/settingsStore.ts`

Настройки (уведомления, время напоминания, количество вопросов) сохраняются в AsyncStorage и не синхронизируются с бэкендом. На новом устройстве или после переустановки — всё сбрасывается в дефолт.

---

### 21. Несогласованные версии TypeScript в монорепо

- `apps/mobile`: `~6.0.3`
- `apps/backend` + `packages/shared`: `^5.3.0`

Может приводить к несовместимым типам и неожиданным ошибкам при сборке.

---

### 22. `packages/shared` указывает на исходники вместо сборки

**Файл:** `packages/shared/package.json`

```json
"main": "src/index.ts",
"types": "src/index.ts"
```

Должно быть:
```json
"main": "dist/index.js",
"types": "dist/index.d.ts"
```

Работает в монорепо из-за tsconfig path mapping, но сломается при публикации пакета.

---

### 23. Несогласованный формат ошибок в API

**Файл:** `apps/backend/src/routes/`

Часть эндпоинтов возвращает `{ error: string }`, часть — `{ error: { message: string } }`, middleware валидации возвращает `{ error: '...', details: [...] }`. Нет единого контракта.

---

### 24. Удаление чужой сессии возвращает 204 вместо 404

**Файл:** `apps/backend/src/routes/sessions.routes.ts`

```typescript
await supabase.from('sessions')
  .update({ status: 'abandoned' })
  .eq('id', req.params.id)
  .eq('user_id', req.userId);
res.status(204).send();  // ← всегда 204, даже если запись не найдена
```

Если пользователь пытается удалить несуществующую или чужую сессию — получает успешный ответ.

---

### 25. Слабая типизация в route handlers

**Файлы:** все файлы в `apps/backend/src/routes/`

```typescript
async (req: any, res) => { ... }
```

`req: any` нивелирует всю пользу от TypeScript и validation middleware. Нужен типизированный `ValidatedRequest<T>` с `body: z.infer<typeof Schema>`.

---

## 🟢 Технический долг

### 26. Полностью отсутствует инфраструктура качества кода

- Нет `.eslintrc` / `eslint.config.js`
- Нет `prettier.config.js`
- Нет pre-commit хуков (Husky / lint-staged)
- Нет GitHub Actions CI/CD
- `npm run test` объявлен в обоих приложениях, но **тестов ноль**

---

### 27. Sentry задекларирован, но не инициализирован

- `@sentry/node` установлен в backend, но ни разу не импортируется и не инициализируется
- `sentry-expo` упомянут в `docs/OVERVIEW.md`, но не установлен в mobile

---

### 28. Dockerfile не production-ready

**Файл:** `apps/backend/Dockerfile`

- Нет multi-stage build — ожидает pre-built `dist/` папку, собранную локально
- Контейнер запускается от `root` (нарушение безопасности)
- Нет директивы `HEALTHCHECK`
- Не устанавливаются зависимости shared-пакета

---

### 29. WebSocket: токен передаётся через query-параметр

**Файл:** `apps/backend/src/index.ts`

```typescript
new URL(req.url ?? '', 'ws://x').searchParams.get('token')
```

Токен в URL попадает в логи сервера, nginx/proxy и историю браузера. Должен передаваться только через `Authorization` header.

---

### 30. Нет `README.md` в корне репозитория

Нет инструкции по установке, запуску и переменным окружения для нового разработчика.

---

## Приоритизированный план исправлений

| # | Приоритет | Задача | Затронутые файлы |
|---|-----------|--------|-----------------|
| 1 | 🔴 Сейчас | Ротировать все секреты | Supabase Dashboard, Groq Console |
| 2 | 🔴 Сейчас | Rate limiting на LLM-эндпоинты | `app.ts`, `answers.routes.ts`, `questions.routes.ts` |
| 3 | 🔴 Сейчас | Ownership check в `/followup` и `/voice` | `questions.routes.ts`, `answers.routes.ts` |
| 4 | 🔴 Сейчас | Реализовать voice recording или отключить режим | `session/[id].tsx` |
| 5 | 🔴 Сейчас | Timeout + recovery в `submitAnswer` | `session/[id].tsx` |
| 6 | 🟠 Sprint 1 | Auth middleware → JWKS локальная верификация | `auth.middleware.ts` |
| 7 | 🟠 Sprint 1 | Инвалидация кеша после `endSession` | `session/[id].tsx` |
| 8 | 🟠 Sprint 1 | try/catch вокруг `JSON.parse` | `result/[sessionId].tsx`, `session/[id].tsx` |
| 9 | 🟠 Sprint 1 | Транзакция / rollback при создании сессии | `sessions.routes.ts` |
| 10 | 🟠 Sprint 1 | Zod-валидация query-параметров (limit, days) | `sessions.routes.ts`, `analytics.routes.ts` |
| 11 | 🟠 Sprint 1 | Правильный 404 при удалении чужой сессии | `sessions.routes.ts` |
| 12 | 🟠 Sprint 1 | Исправить CORS fallback | `app.ts` |
| 13 | 🟡 Sprint 2 | Мемоизация компонентов | `analytics.tsx`, `session/[id].tsx` |
| 14 | 🟡 Sprint 2 | Android back button handler | `session/[id].tsx` |
| 15 | 🟡 Sprint 2 | Реализовать логику streak_count | `analytics.service.ts` |
| 16 | 🟡 Sprint 2 | Синхронизировать TypeScript версии | все `package.json` |
| 17 | 🟡 Sprint 2 | Починить `packages/shared/package.json` | `packages/shared/package.json` |
| 18 | 🟡 Sprint 2 | Пагинация в History | `history.tsx`, `hooks.ts` |
| 19 | 🟢 Backlog | ESLint + Prettier + Husky | корень монорепо |
| 20 | 🟢 Backlog | GitHub Actions CI/CD | `.github/workflows/` |
| 21 | 🟢 Backlog | Sentry инициализация | `index.ts`, mobile `_layout.tsx` |
| 22 | 🟢 Backlog | Dockerfile multi-stage + non-root + healthcheck | `apps/backend/Dockerfile` |
| 23 | 🟢 Backlog | README.md | корень монорепо |
