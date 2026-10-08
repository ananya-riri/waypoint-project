# Waypoint

Waypoint is a project and task manager for web and Android. Both clients use the same Express API, PostgreSQL database, and account system.

## Features

- Account registration, login, logout, expiring JWT sessions, and password hashing.
- Projects and tasks with ownership checks, due dates, statuses, and priorities.
- User-specific dashboard counts and searchable/filterable lists.
- Responsive React web client and Android Expo client; Android stores the token with Expo SecureStore (Android Keystore backed).
- Shared API, PostgreSQL schema/migration, Docker Compose setup, API documentation, and ER diagram.

## Structure

- `apps/api` — Express API, Prisma schema and migrations.
- `apps/web` — React + Vite web app.
- `apps/mobile` — Expo React Native mobile app.
- `packages/shared` — shared TypeScript types.
- `docs/api-and-data-model.md` — API reference, data model, and ER diagram.

## Local setup

Prerequisites: Node.js 20+, npm 10+, and Docker Desktop (or PostgreSQL 15+).

1. Copy `.env.example` to `.env` in the repository root and set a random `JWT_SECRET` of at least 32 characters.
2. Start PostgreSQL: `docker compose up db -d`.
3. Install packages: `npm install`.
4. Copy `apps/api/.env.example` to `apps/api/.env`. For local PostgreSQL use `DATABASE_URL="postgresql://waypoint:waypoint_dev_only@localhost:5432/waypoint?schema=public"`, set the same `JWT_SECRET`, and set `CORS_ORIGIN="http://localhost:5173"`.
5. Run `npm run db:generate` and `npm run db:migrate`.
6. In separate terminals, run `npm run dev:api` and `npm run dev:web`.
7. Open the web URL shown by Vite (normally `http://localhost:5173`).

## Android

Run `npm run dev:mobile` and open the app in Expo Go or an Android emulator. The default API URL is `http://10.0.2.2:4000` for the Android emulator. For a physical device, set `EXPO_PUBLIC_API_URL` to the API's reachable LAN or HTTPS address before starting Expo. On Windows PowerShell: `$env:EXPO_PUBLIC_API_URL="http://192.168.1.20:4000"; npm run dev:mobile`. Use HTTPS for distributed builds.

To make an internal APK, install EAS CLI, sign in to Expo, then run `cd apps/mobile`, `eas build:configure`, and `eas build --platform android --profile preview`. For a public release, use the `production` profile and distribute through Play or an approved internal channel.

## API and database

See [the API and data model guide](docs/api-and-data-model.md) for routes, request/response shapes, auth rules, and the ER diagram. See [environment variable documentation](apps/api/ENVIRONMENT.md) for the API settings.

## Docker deployment

The root `docker-compose.yml` runs a local PostgreSQL database, API, and web app. Put a random `JWT_SECRET` in root `.env` first, then run `docker compose up --build`. The app is at `http://localhost:5173`, API at `http://localhost:4000`. Compose credentials are for local development only.

For a hosted deployment, deploy PostgreSQL as a managed service, build the API using `apps/api/Dockerfile`, and set `DATABASE_URL`, `JWT_SECRET`, `PORT`, and `CORS_ORIGIN`. The container applies committed migrations at startup. Build the web app using `apps/web/Dockerfile` with `VITE_API_URL` set to the deployed API origin. Set the API CORS origin to the exact deployed web origin. Build the mobile app with `EXPO_PUBLIC_API_URL` set to the deployed HTTPS API URL. Hosting accounts and release artifacts must be created by the project owner; this repository does not contain a public repository URL or deployed site.

## Implementation notes

The backend owns validation and authorization even when the clients validate forms. Project queries are scoped to the signed-in user; task reads and writes scope through the owning project. Password hashes never leave the server. JWTs expire after one hour and logout revokes the current token. Web stores its bearer token in localStorage; Android stores it with Expo SecureStore.
