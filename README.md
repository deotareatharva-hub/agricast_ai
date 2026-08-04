# AgriCast AI

**AI-Powered Precision Agriculture Decision Support Platform**

> This repository currently contains **Phase 1: Foundation** only. Feature
> modules (Weather, AI Advisory, Sentinel/Satellite, Farms, Analytics,
> Reports, Notifications) are intentionally **not** implemented yet — see
> [`Phase1Guide.md`](./Phase1Guide.md) for the full breakdown, setup
> instructions, and the Phase 2 preview.

## What's in Phase 1

- A working **React (Vite) frontend** with routing, layouts, i18n
  (English / Hindi / Marathi), and a design system foundation.
- A working **Express.js backend** with a feature-based modular monolith
  architecture (`routes → controller → service → repository → database`).
- **JWT authentication** (register, login, protected routes) on both ends.
- **PostgreSQL + Drizzle ORM**, with migrations and a seed script.
- Security middleware (Helmet, CORS, input validation), structured logging,
  and centralized error handling.

## Monorepo structure

```
agricast-ai/
├── frontend/     React + Vite + Tailwind CSS app
├── backend/      Express.js + Drizzle ORM + PostgreSQL API
├── Phase1Guide.md
└── README.md
```

## Quick start

Full step-by-step instructions (including installing Node, PostgreSQL,
pgAdmin, and VS Code extensions) live in **[Phase1Guide.md](./Phase1Guide.md)**.
The short version, assuming Node.js 20+ and PostgreSQL are already installed:

```bash
# 1. Backend
cd backend
cp .env.example .env        # then edit DATABASE_URL and JWT_SECRET
npm install
npm run db:generate         # generate SQL migrations from the schema
npm run db:migrate          # apply migrations to your database
npm run db:seed             # create a demo user (demo@agricast.ai / Demo@12345)
npm run dev                 # starts the API on http://localhost:5000

# 2. Frontend (in a second terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # starts the app on http://localhost:5173
```

Open http://localhost:5173, register a new account (or log in with the
seeded demo user), and you should land on a dashboard that confirms a live
connection to the backend.

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React, Vite, Tailwind CSS, React Router DOM, Axios, TanStack Query, React Hook Form, React Toastify, react-i18next |
| Backend   | Node.js, Express.js, JWT, bcrypt, Express Validator, Helmet, Morgan, CORS |
| Database  | PostgreSQL, Drizzle ORM |

## License

Unlicensed / private — internal project scaffold.
