# API configuration

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: random secret of at least 32 characters (example: generate with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`). Never commit `.env`.
- `PORT`: API port; defaults to 4000.
- `CORS_ORIGIN`: comma-separated allowed web origins.

For local root `.env` generation in PowerShell, run `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"` and paste the result into `JWT_SECRET`.

Auth endpoints return a bearer token valid for one hour. Logout revokes the presented token in the database. The web/mobile clients must discard the token after logout and clear it after a 401 response.
