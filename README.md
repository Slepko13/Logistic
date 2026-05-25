# Logistic

Fullstack-додаток: **React** (Vite) + **NestJS** + **PostgreSQL**.

При відкритті сайту потрібна **реєстрація** або **вхід** (телефон, імʼя, прізвище, пароль).

План наступного продуктового етапу описаний у [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md).

У системі є дві ролі:
- `admin` — адміністратор;
- `driver` — водій.

## Структура проекту

```
.
├── docker-compose.yml
├── backend/
│   └── src/
│       ├── auth/          # JWT, register, login
│       ├── users/         # користувачі, ролі, адмін-дії
│       ├── database/
│       └── health/
└── frontend/
    └── src/
        ├── api/
        ├── components/
        │   ├── ui/        # shadcn/ui
        │   ├── auth/
        │   ├── layout/
        │   └── users/
        ├── context/
        ├── routes/
        └── pages/
```

## Запуск через Docker

```bash
docker compose up --build
```

| Сервіс   | URL                    |
|----------|------------------------|
| Frontend | http://localhost:8080  |
| Backend  | http://localhost:3001  |
| Postgres | localhost:5432         |

## API

### Публічні
- `GET /api/health`
- `POST /api/auth/register` — `{ phone, first_name, last_name, password }`, створює користувача з роллю `driver`
- `POST /api/auth/login` — `{ phone, password }`

### З JWT (`Authorization: Bearer <token>`)
- `GET /api/auth/me`

### Лише адмін (`role: admin`)
- `GET /api/users` — список користувачів (з роллю)
- `PATCH /api/users/:id` — редагувати телефон, імʼя та прізвище користувача
- `DELETE /api/users/:id` — видалити користувача (не адміна)
- `PATCH /api/users/:id/promote-admin` — зробити адміністратором

Користувач з телефоном `0503733160` (`+380503733160`) автоматично отримує роль **admin** при старті БД.

## Локальна розробка

```bash
docker compose up db -d
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm run dev
```

Frontend dev: http://localhost:5173

## Міграції БД

Backend застосовує міграції автоматично при старті. Історія виконаних міграцій
зберігається в таблиці `schema_migrations`.

Нові міграції додаються в `backend/src/database/migrations.ts` як запис з
унікальним `id` та SQL-командою.
