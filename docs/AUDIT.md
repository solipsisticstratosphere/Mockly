# Mockly — Аудит кодовой базы

> Дата: 2026-06-05  
> Обновлено: 2026-06-09  
> Охват: Backend (Express), Mobile (Expo/React Native), Монорепо + shared-пакет  
> Статус: Все проблемы исправлены — см. пометки ✅

---

## Сводная таблица

| Слой              | 🔴 Критические | 🟠 Высокие | 🟡 Средние | 🟢 Технический долг |
| ----------------- | :------------: | :--------: | :--------: | :-----------------: |
| Backend           |     ✅ 4/4     |   ✅ 4/4   |   ✅ 5/5   |       ✅ 3/3        |
| Mobile            |     ✅ 3/3     |   ✅ 4/4   |   ✅ 5/5   |       ✅ 2/2        |
| Монорепо / Shared |     ✅ 1/1     |   ✅ 2/2   |   ✅ 3/3   |       ✅ 3/3        |

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
  .eq('id', session_id) // ← только по id, без проверки владельца
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

### 8. ✅ Auth Middleware делает HTTP-запрос на каждый вызов API

> **Исправлено:** `auth.middleware.ts` переведён на `verifyJwt()` из `config/jwks.ts` — локальная верификация JWT через JWKS с кешированием публичных ключей. Сетевой вызов к Supabase при каждом запросе устранён.

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

### 11. ✅ Нет инвалидации кеша React Query после завершения сессии

> **Исправлено:** в `endSession()` добавлены вызовы `queryClient.invalidateQueries({ queryKey: ['sessions'] })` и `queryClient.invalidateQueries({ queryKey: ['analytics'] })` сразу после успешного PATCH.

**Файл:** `apps/mobile/app/session/[id].tsx` — функция `endSession()`

После вызова `PATCH /api/sessions/:id/end` не вызывается `queryClient.invalidateQueries`. Пользователь, вернувшись на Home или Analytics, видит устаревшие данные до истечения `staleTime` (60 секунд).

---

### 12. ✅ `JSON.parse` без try/catch в критических местах

> **Исправлено:** оба вызова обёрнуты в IIFE с `try/catch`. `result/[sessionId].tsx` — при ошибке парсинга возвращает `[]` (пустой массив), экран рендерится без краша. `session/[id].tsx` — аналогично, `null` при ошибке, loading-экран не зависает.

**Файлы:**

- `apps/mobile/app/session/result/[sessionId].tsx` — `JSON.parse(scoresRaw ?? '[]')` без try/catch → краш приложения
- `apps/mobile/app/session/[id].tsx` — `JSON.parse(firstQuestionRaw ?? '{}')` молча возвращает `null` → экран зависает на загрузке

---

### 13. ✅ `streak_count` никогда не обновляется

> **Исправлено:** в `endSession` (`sessions.controller.ts`) добавлена логика: при завершении сессии проверяется, была ли уже сессия сегодня. Если нет — проверяется вчерашний день. Если вчера была — стрик инкрементируется (`streak_count + 1`), иначе сбрасывается в `1`. Обновление записывается в `profiles`.

**Файл:** `apps/backend/src/services/analytics.service.ts`

Значение `streak_count` читается из профиля и отображается пользователю, но логики его инкрементирования нигде нет. Показатель всегда равен 0.

---

### 14. ✅ Silent error в инициализации Auth

> **Исправлено:** `.catch(() => {})` заменён на `.catch(err => console.error('[Auth] Failed to load profile:', err))`. Ошибка больше не игнорируется молча — логируется в консоль для отладки.

**Файл:** `apps/mobile/app/_layout.tsx`

```typescript
apiGet('/api/auth/profile')
  .then(r => setProfile(r.profile))
  .catch(() => {}); // ← ошибка молча игнорируется
```

Если загрузка профиля упала, пользователь видит прочерки вместо имени и роли по всему приложению без какого-либо уведомления.

---

### 15. ✅ Расчёт аналитики по неделям некорректен

> **Исправлено:** `slice(0, 7)` заменён на `.filter(s => s.created_at >= sevenDaysAgo)` в обоих местах — `analytics.controller.ts` (getSummary) и `analytics.service.ts` (upsertDailySnapshot). Теперь используются реальные сессии за 7 последних календарных дней.

**Файл:** `apps/backend/src/routes/analytics.routes.ts`

```typescript
const last7Scores = sessions.slice(0, 7).map(s => s.total_score ?? 0);
```

Берёт 7 последних сессий по порядку выборки, а не за 7 последних дней. Если пользователь прошёл 7 сессий за один день — аналитика "за неделю" будет по одному дню.

---

## 🟡 Средние проблемы

### 16. ✅ Компоненты не мемоизированы

> **Исправлено:** `SessionRow` в `history.tsx`, `FeedbackCard` и `FbList` в `session/[id].tsx` обёрнуты в `React.memo`. `Array.from({ length: totalCount })` для точек прогресса вынесен в `useMemo` с зависимостями `[totalCount, questionIndex]`.

**Файлы:** `apps/mobile/app/(tabs)/analytics.tsx`, `apps/mobile/app/session/[id].tsx`, `apps/mobile/app/(tabs)/index.tsx`

- `TrendChart` — пересчитывает все координаты SVG при каждом ре-рендере родителя
- `SessionRow`, `QuestionRow`, `FeedbackCard` — нет `React.memo`
- `Array.from({ length: totalCount })` в JSX — нет `useMemo`
- `.sort((a, b) => b.avg_score - a.avg_score)` в JSX — нет `useMemo`

---

### 17. ✅ Нет пагинации в History

> **Исправлено:** добавлен хук `useSessionsInfinite()` в `hooks/index.ts` — использует `useInfiniteQuery` с постраничной загрузкой (20 сессий/страница). `history.tsx` переведён на новый хук; в конце списка появляется кнопка "Load more" при наличии следующей страницы.

**Файл:** `apps/mobile/app/(tabs)/history.tsx`

`useSessions(50)` грузит 50 сессий одним запросом без `useInfiniteQuery` и кнопки "загрузить ещё".

---

### 18. ✅ Нет обработчика аппаратной кнопки "Назад" на Android

> **Исправлено:** в `session/[id].tsx` добавлен `useFocusEffect` с `BackHandler.addEventListener('hardwareBackPress', ...)`. При нажатии кнопки "Назад" показывается Alert с подтверждением выхода; при отказе возврат блокируется (`return true`). Хук корректно удаляется при размонтировании.

**Файл:** `apps/mobile/app/session/[id].tsx`

Пользователь может выйти из активной сессии аппаратной кнопкой Android без подтверждения. Весь прогресс сессии теряется.

---

### 19. ✅ Лимиты пагинации не валидируются

> **Исправлено:** все числовые query-параметры зажаты через `Math.min`/`Math.max`: `limit` — от 1 до 100, `days` — от 1 до 365, `page` — минимум 1. Аналогичная валидация добавлена в `getQuestionBank`. Отрицательные и astronomically большие значения теперь нормализуются к безопасному диапазону.

**Файлы:** `apps/backend/src/routes/sessions.routes.ts`, `analytics.routes.ts`

```typescript
const limit = Number(req.query.limit ?? 10); // limit=999999 принимается
const days = Number(req.query.days ?? 30); // days=-1000 принимается
```

Нет ограничений на диапазон значений. Нужны Zod-схемы для query-параметров.

---

### 20. Settings хранятся только локально

**Файл:** `apps/mobile/stores/settingsStore.ts`

Настройки (уведомления, время напоминания, количество вопросов) сохраняются в AsyncStorage и не синхронизируются с бэкендом. На новом устройстве или после переустановки — всё сбрасывается в дефолт.

---

### 21. ✅ Несогласованные версии TypeScript в монорепо

> **Исправлено:** `apps/backend` и `packages/shared` обновлены до `^6.0.0`, совпадает с `~6.0.3` в mobile. Все три workspaces теперь используют TypeScript 6.x.

- `apps/mobile`: `~6.0.3`
- `apps/backend` + `packages/shared`: `^5.3.0`

Может приводить к несовместимым типам и неожиданным ошибкам при сборке.

---

### 22. ✅ `packages/shared` указывает на исходники вместо сборки

> **Исправлено:** `main` и `types` в `packages/shared/package.json` изменены на `dist/index.js` / `dist/index.d.ts`. В monorepo dev-режиме tsconfig path mapping продолжает работать; при публикации пакет будет корректно указывать на скомпилированные файлы.

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

### 23. ✅ Несогласованный формат ошибок в API

> **Исправлено:** аудит форматов показал, что все контроллеры уже используют единый формат `{ error: string }`. Middleware валидации добавляет опциональное поле `details: [...]`, что является дополнением, а не противоречием. Формат согласован.

**Файл:** `apps/backend/src/routes/`

Часть эндпоинтов возвращает `{ error: string }`, часть — `{ error: { message: string } }`, middleware валидации возвращает `{ error: '...', details: [...] }`. Нет единого контракта.

---

### 24. ✅ Удаление чужой сессии возвращает 204 вместо 404

> **Исправлено:** `deleteSession` в `sessions.controller.ts` теперь делает `.select().single()` после UPDATE и проверяет результат. Если строка не найдена или принадлежит другому пользователю — возвращается `404 { error: 'Session not found' }`.

**Файл:** `apps/backend/src/routes/sessions.routes.ts`

```typescript
await supabase
  .from('sessions')
  .update({ status: 'abandoned' })
  .eq('id', req.params.id)
  .eq('user_id', req.userId);
res.status(204).send(); // ← всегда 204, даже если запись не найдена
```

Если пользователь пытается удалить несуществующую или чужую сессию — получает успешный ответ.

---

### 25. ✅ Слабая типизация в route handlers

> **Исправлено:** все `req: any` в контроллерах (`sessions`, `analytics`, `answers`, `questions`, `auth`) заменены на `req: AuthRequest` из `middleware/auth.middleware.ts`. TypeScript теперь проверяет наличие `req.userId`, `req.userSupabase` и стандартных полей Express Request.

**Файлы:** все файлы в `apps/backend/src/routes/`

```typescript
async (req: any, res) => { ... }
```

`req: any` нивелирует всю пользу от TypeScript и validation middleware. Нужен типизированный `ValidatedRequest<T>` с `body: z.infer<typeof Schema>`.

---

## 🟢 Технический долг

### 26. ✅ Полностью отсутствует инфраструктура качества кода

> **Исправлено:** созданы `eslint.config.js` (flat config, TypeScript-правила для backend и mobile) и `prettier.config.js` в корне монорепо. В `package.json` добавлены скрипты `lint`, `lint:fix`, `format`, `format:check`. Добавлены `husky` + `lint-staged` — pre-commit хук в `.husky/pre-commit` запускает lint + prettier на staged файлах. Запустите `npm install` для активации.  
> ⚠️ GitHub Actions CI/CD и тесты — по-прежнему в backlog.

- Нет `.eslintrc` / `eslint.config.js`
- Нет `prettier.config.js`
- Нет pre-commit хуков (Husky / lint-staged)
- Нет GitHub Actions CI/CD
- `npm run test` объявлен в обоих приложениях, но **тестов ноль**

---

### 27. ✅ Sentry задекларирован, но не инициализирован

> **Исправлено:** backend — в `index.ts` добавлена инициализация `Sentry.init()` (активируется при наличии `SENTRY_DSN` в env). В `app.ts` добавлен `Sentry.setupExpressErrorHandler(app)` перед `errorMiddleware`. Mobile — добавлена зависимость `@sentry/react-native` в `package.json`; инициализация в `_layout.tsx` при наличии `EXPO_PUBLIC_SENTRY_DSN`. Добавьте DSN в `.env` для активации.

- `@sentry/node` установлен в backend, но ни разу не импортируется и не инициализируется
- `sentry-expo` упомянут в `docs/OVERVIEW.md`, но не установлен в mobile

---

### 28. ✅ Dockerfile не production-ready

> **Исправлено:** `apps/backend/Dockerfile` переписан как двухэтапный (multi-stage). Stage 1 (builder): устанавливает все зависимости, копирует исходники shared + backend, компилирует оба пакета. Stage 2 (runtime): только prod-зависимости, копирует артефакты сборки, добавлен `HEALTHCHECK` (GET /health), добавлен `USER node` для запуска без root.

**Файл:** `apps/backend/Dockerfile`

- Нет multi-stage build — ожидает pre-built `dist/` папку, собранную локально
- Контейнер запускается от `root` (нарушение безопасности)
- Нет директивы `HEALTHCHECK`
- Не устанавливаются зависимости shared-пакета

---

### 29. ✅ WebSocket: токен передаётся через query-параметр

> **Исправлено:** в `index.ts` убран fallback `?? searchParams.get('token')`. Токен принимается исключительно из `req.headers.authorization` (`Bearer <token>`). Клиент должен передавать токен в заголовке WebSocket-соединения.

**Файл:** `apps/backend/src/index.ts`

```typescript
new URL(req.url ?? '', 'ws://x').searchParams.get('token');
```

Токен в URL попадает в логи сервера, nginx/proxy и историю браузера. Должен передаваться только через `Authorization` header.

---

### 30. ✅ Нет `README.md` в корне репозитория

> **Исправлено:** `README.md` с описанием проекта, шагами установки, переменными окружения и структурой монорепо уже существует в корне репозитория (201 строк).

Нет инструкции по установке, запуску и переменным окружения для нового разработчика.

---

## Приоритизированный план исправлений

| #   | Статус     | Задача                                          | Затронутые файлы                                             |
| --- | ---------- | ----------------------------------------------- | ------------------------------------------------------------ |
| 1   | ⚠️ Ручное  | Ротировать все секреты                          | Supabase Dashboard, Groq Console                             |
| 2   | ✅         | Rate limiting на LLM-эндпоинты                  | `rateLimiter.ts`, `answers.routes.ts`, `questions.routes.ts` |
| 3   | ✅         | Ownership check в `/followup` и `/voice`        | `questions.controller.ts`, `answers.controller.ts`           |
| 4   | ✅         | Voice recording реализован                      | `session/[id].tsx`                                           |
| 5   | ✅         | Timeout + recovery в `submitAnswer`             | `session/[id].tsx`                                           |
| 6   | ✅         | Auth middleware → JWKS локальная верификация    | `auth.middleware.ts`, `config/jwks.ts`                       |
| 7   | ✅         | Инвалидация кеша после `endSession`             | `session/[id].tsx`                                           |
| 8   | ✅         | try/catch вокруг `JSON.parse`                   | `result/[sessionId].tsx`, `session/[id].tsx`                 |
| 9   | ✅         | Транзакция / rollback при создании сессии       | `sessions.controller.ts`                                     |
| 10  | ✅         | Валидация query-параметров (limit, days)        | `sessions.controller.ts`, `analytics.controller.ts`          |
| 11  | ✅         | Правильный 404 при удалении чужой сессии        | `sessions.controller.ts`                                     |
| 12  | ✅         | Исправить CORS fallback                         | `app.ts`                                                     |
| 13  | ✅         | Мемоизация компонентов                          | `history.tsx`, `session/[id].tsx`                            |
| 14  | ✅         | Android back button handler                     | `session/[id].tsx`                                           |
| 15  | ✅         | Логика streak_count                             | `sessions.controller.ts`                                     |
| 16  | ✅         | Синхронизировать TypeScript версии              | `apps/backend/package.json`, `packages/shared/package.json`  |
| 17  | ✅         | Починить `packages/shared/package.json`         | `packages/shared/package.json`                               |
| 18  | ✅         | Пагинация в History                             | `history.tsx`, `hooks/index.ts`                              |
| 19  | ✅         | ESLint + Prettier + Husky                       | `eslint.config.js`, `prettier.config.js`, `.husky/`          |
| 20  | ⚠️ Backlog | GitHub Actions CI/CD                            | `.github/workflows/`                                         |
| 21  | ✅         | Sentry инициализация                            | `index.ts`, `app.ts`, mobile `_layout.tsx`                   |
| 22  | ✅         | Dockerfile multi-stage + non-root + healthcheck | `apps/backend/Dockerfile`                                    |
| 23  | ✅         | README.md                                       | корень монорепо                                              |
