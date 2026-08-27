# Бэклог: простой блог (Handlebars + HTMX)

Тестовый блог в этом NestJS-репозитории. Фичи делаются **по одной**, каждая — отдельный Agent-чат: вставить промпт ниже, закрыть через `/ship-pr`. Merge только человеком при зелёном CI.

Этот файл — спека и промпты. Он **не** запускает разработку сам по себе.

## Стек

- NestJS как есть в репозитории
- **Prisma 6 + SQLite** (не Prisma 7: там driver adapters)
- **Handlebars (`hbs`)**
- **HTMX 2 с CDN**
- Без авторизации: формы открыты всем

## Модель данных (конечное состояние)

- `Post`: `id` (int autoincrement), `title`, `body`, `createdAt`, `updatedAt`, `comments`
- `Comment`: `id`, `body`, `postId` (index + `onDelete: Cascade`), `createdAt`, `updatedAt`

Модель `Comment` появляется **только** в Feature 7.

## Маршруты (конечное состояние)

| Method | Path | Что делает |
| --- | --- | --- |
| GET | `/` | список постов + форма создания |
| GET | `/health` | JSON `{ ok: true }` — не менять смысл |
| GET | `/posts/:id` | пост + комментарии + форма комментария |
| GET | `/posts/:id/edit` | форма редактирования |
| POST | `/posts` | создать (HTMX) |
| PUT | `/posts/:id` | обновить (HTMX) |
| DELETE | `/posts/:id` | удалить (HTMX) |
| POST | `/posts/:id/comments` | добавить комментарий (HTMX) |
| DELETE | `/comments/:id` | удалить комментарий (HTMX) |

## Порядок фич

Строго F1 → F7. Каждая фича стартует от **свежего `main` после мержа предыдущей**. Не делать две фичи параллельно.

## Общие правила для каждого промпта

- Ветка от `main`, не коммитить в `main`
- Тесты + lint зелёные, потом `/ship-pr`, не мержить
- Менять только то, что указано. `GET /health` всегда JSON
- Код и коммиты на английском. Conventional commit

## Как гонять

На каждую фичу: новый чат → вставить промпт → дождаться PR и `READY FOR REVIEW` → ревью в другом чате («проведи ревью» + ссылка на PR, skill `code-review`) → merge человеком при зелёном CI → следующая фича от обновлённого `main`.

Локально после F1: скопировать `.env.example` в `.env`, `pnpm install`, `pnpm exec prisma migrate deploy`, `pnpm run start:dev`.

---

## Feature 1 — Prisma 6 + SQLite + модель Post

**Зачем:** хранилище без UI.

**Сделать:** Prisma **6** (`prisma@6`, `@prisma/client@6`), не 7. SQLite, `prisma/schema.prisma`, только `Post`. `.env.example` с `DATABASE_URL="file:./dev.db"`. gitignore `*.db`. `postinstall`: `prisma generate`. Миграция `init` в git. `PrismaService` + global `PrismaModule`. CI: `DATABASE_URL=file:./test.db`, перед unit и e2e — `prisma migrate deploy`. Unit-тест create+find.

**Не делать:** HTML, HTMX, HTTP постов, Comment.

**Проверка:** `pnpm test`, `pnpm lint`. `GET /` по-прежнему `Hello World!`.

### Промпт для LLM

```
Implement Feature 1: Prisma 6 + SQLite + Post model.

Work on a new branch from main. Use the ship-pr skill when done. Do not merge.

Goal: add persistence only. No HTML, no HTMX, no post HTTP routes, no Comment model.

Requirements:
- Use Prisma 6 (prisma@6 and @prisma/client@6), NOT Prisma 7.
- SQLite. schema in prisma/schema.prisma with datasource url = env("DATABASE_URL") and generator prisma-client-js.
- Model Post: id Int @id @default(autoincrement()), title String, body String, createdAt DateTime @default(now()), updatedAt DateTime @updatedAt.
- Create initial migration and commit it.
- Add .env.example with DATABASE_URL="file:./dev.db". Gitignore sqlite db files.
- Add PrismaService + global PrismaModule (connect on init, disconnect on destroy). Import PrismaModule in AppModule.
- package.json postinstall: prisma generate.
- CI (.github/workflows/ci.yml): set DATABASE_URL=file:./test.db for jobs that need DB; run `pnpm exec prisma migrate deploy` before unit tests and e2e.
- Unit test: PrismaService can create a post and find it. Set process.env.DATABASE_URL to a file sqlite DB in the test.
- Do not change GET / or GET /health behavior.

Run pnpm test and pnpm lint. Then commit, push, gh pr create. Reply with PR URL and READY FOR REVIEW.
```

---

## Feature 2 — Handlebars + HTMX shell

**Зачем:** MVC-инфраструктура. Страницы ещё без постов.

**Сделать:** пакет `hbs`; `src/configure-app.ts` (views, hbs, `public/`, partials); вызов из `main.ts` и e2e; `views/partials/head.hbs` (HTMX 2 CDN), footer, `home.hbs` с заголовком Blog; `public/styles.css` без фреймворка; `GET /` HTML; `GET /health` JSON. Обновить unit/e2e.

**Не делать:** Prisma на `/`, CRUD, комментарии.

### Промпт для LLM

```
Implement Feature 2: Handlebars + HTMX shell.

Work on a new branch from main. Use the ship-pr skill when done. Do not merge.

Goal: Nest can render HTML. Homepage is a static Blog shell. No posts UI yet.

Requirements:
- Add package `hbs`.
- Create src/configure-app.ts that configures NestExpressApplication: views dir = join(__dirname, '..', 'views'), view engine hbs, static assets from public/, register Handlebars partials from views/partials.
- Call configureApp from src/main.ts AND from test/app.e2e-spec.ts before app.init().
- views/partials/head.hbs: charset, title, link to /styles.css, HTMX 2 from CDN (unpkg or jsdelivr).
- views/partials/footer.hbs, views/home.hbs using those partials. Visible heading "Blog".
- public/styles.css: small readable layout, no CSS framework.
- AppController GET / renders home (HTML). GET /health stays JSON { ok: true }.
- Update unit + e2e tests: GET / is text/html and contains Blog and htmx; GET /health unchanged.

Do not add post routes, forms, or Prisma queries on GET /.

Run pnpm test and pnpm lint. Then commit, push, gh pr create. Reply with PR URL and READY FOR REVIEW.
```

---

## Feature 3 — Список и страница поста (read-only)

**Зачем:** чтение из SQLite в шаблоны.

**Сделать:** PostsModule/Service/Controller; `findAll` / `findOne`; `GET /` список, empty `No posts yet`; `GET /posts/:id` + `ParseIntPipe`; 404 HTML не JSON; шаблоны index/show.

**Не делать:** формы, POST/PUT/DELETE, комментарии.

**Важно:** `GET /posts/new` ещё нет, но когда появится — объявить **раньше** `GET /posts/:id`. В этой фиче параметра `new` нет.

### Промпт для LLM

```
Implement Feature 3: read-only post list and detail.

Work on a new branch from main. Use the ship-pr skill when done. Do not merge.

Goal: render posts from SQLite. No create/edit/delete, no comments.

Requirements:
- Add PostsModule, PostsService, PostsController.
- PostsService.findAll() and findOne(id) via PrismaService. Order by createdAt desc.
- GET / renders the post list (move this off AppController if needed). Empty state text: "No posts yet".
- GET /posts/:id uses ParseIntPipe. Show title, body, createdAt. Unknown id: HTTP 404 HTML page (views/not-found.hbs), not JSON.
- Templates: views/posts/index.hbs and views/posts/show.hbs, both using head/footer partials. List items link to /posts/:id.
- Keep GET /health as JSON.
- E2E: insert a post with Prisma in beforeEach; GET / contains the title; GET /posts/:id contains the body; GET /posts/99999 returns 404 HTML.
- Unit-test PostsService with Prisma (real sqlite file).

Do not add forms or POST/PUT/DELETE routes.

Run pnpm test and pnpm lint. Then commit, push, gh pr create. Reply with PR URL and READY FOR REVIEW.
```

---

## Feature 4 — Создание поста (HTMX)

**Зачем:** первый мутирующий HTMX-поток.

**Сделать:** форма на `/`; `hx-post="/posts"`; успех — `HX-Redirect: /posts/:id`; пустые поля — 400 и `Title and body are required`. Без class-validator.

**Не делать:** edit/delete/comments.

### Промпт для LLM

```
Implement Feature 4: create post with HTMX.

Work on a new branch from main. Use the ship-pr skill when done. Do not merge.

Goal: visitors can create a post from the homepage form. No edit, delete, or comments.

Requirements:
- Add a form on GET / with fields title and body.
- Form uses HTMX: hx-post="/posts". After success, redirect to the new post page via response header HX-Redirect: /posts/:id (and a 201 or 200).
- POST /posts: trim title and body. If either is empty, HTTP 400, re-render the list page (full HTML) with error text "Title and body are required".
- Do not add class-validator. Validate in the service or controller.
- Keep list empty state when there are no posts; form still visible.
- E2E: POST /posts with title+body creates a row in SQLite and returns HX-Redirect to /posts/:id. POST with empty fields returns 400 and the error text.
- Unit-test PostsService.create.

Do not add edit, delete, or comments.

Run pnpm test and pnpm lint. Then commit, push, gh pr create. Reply with PR URL and READY FOR REVIEW.
```

---

## Feature 5 — Редактирование поста (HTMX)

**Сделать:** `GET /posts/:id/edit` **до** `:id`; `hx-put`; та же валидация; 404 HTML.

**Не делать:** delete, comments.

### Промпт для LLM

```
Implement Feature 5: edit post with HTMX.

Work on a new branch from main. Use the ship-pr skill when done. Do not merge.

Goal: edit an existing post. No delete, no comments.

Requirements:
- On the post show page, add an "Edit" link to /posts/:id/edit.
- GET /posts/:id/edit must be declared BEFORE GET /posts/:id so "edit" is not parsed as an id. Render a form with current title and body. Unknown id: 404 HTML.
- Form: hx-put="/posts/:id". Success: HX-Redirect to /posts/:id.
- PUT /posts/:id: same validation as create ("Title and body are required" + 400). Unknown id: 404 HTML.
- E2E: create a post via Prisma, PUT new title, then GET show page contains new title. Empty PUT returns 400.
- Unit-test PostsService.update.

Do not add delete or comments.

Run pnpm test and pnpm lint. Then commit, push, gh pr create. Reply with PR URL and READY FOR REVIEW.
```

---

## Feature 6 — Удаление поста (HTMX)

**Сделать:** кнопка Delete, `hx-confirm`; `HX-Redirect: /`.

**Не делать:** comments.

### Промпт для LLM

```
Implement Feature 6: delete post with HTMX.

Work on a new branch from main. Use the ship-pr skill when done. Do not merge.

Goal: delete a post from the show page. No comments yet.

Requirements:
- On the post show page, add a Delete button: hx-delete="/posts/:id", hx-confirm="Delete this post?".
- DELETE /posts/:id: delete the row, respond with HX-Redirect: /. Unknown id: 404 HTML.
- E2E: insert a post, DELETE /posts/:id, assert it is gone in SQLite. Second DELETE returns 404.
- Unit-test PostsService.remove.

Do not add comments.

Run pnpm test and pnpm lint. Then commit, push, gh pr create. Reply with PR URL and READY FOR REVIEW.
```

---

## Feature 7 — Комментарии (модель + HTMX)

**Сделать:** миграция Comment; фрагмент `#comments`; add/delete через HTMX; cascade.

**Не делать:** users, markdown, tags, pagination.

### Промпт для LLM

```
Implement Feature 7: comments on a post (Prisma + HTMX).

Work on a new branch from main. Use the ship-pr skill when done. Do not merge.

Goal: list, add, and delete comments on the post show page. No auth.

Requirements:
- Add Prisma model Comment: id Int @id @default(autoincrement()), body String, postId Int, createdAt, updatedAt. Relation Post.comments. onDelete Cascade. @@index([postId]). Create a new migration.
- Post show page: section #comments. Empty text: "No comments yet". Form field body, hx-post="/posts/:id/comments", hx-target="#comments", hx-swap="innerHTML".
- POST /posts/:id/comments: empty body -> 400 and message "Comment cannot be empty". Success: return HTML fragment views/partials/comments.hbs (no layout/head/footer) with the full comment list including the new one. Unknown post: 404 HTML.
- Each comment has Delete: hx-delete="/comments/:id", hx-target="#comments", hx-swap="innerHTML", hx-confirm="Delete this comment?". Response is the same comments fragment. Unknown comment: 404.
- Deleting a post must cascade-delete its comments (already guaranteed by schema; add an e2e or unit assertion).
- E2E: create post via Prisma; POST comment; GET show contains comment text; DELETE comment; GET show shows "No comments yet".

Do not add users, markdown, tags, or pagination.

Run pnpm test and pnpm lint. Then commit, push, gh pr create. Reply with PR URL and READY FOR REVIEW.
```
