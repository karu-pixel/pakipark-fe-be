# PakiPark Mobile Combined Notes

Target app: `Pakipark-Mobile`.

What was combined:

- Kept `pakipark-mobile` as the project you should open.
- Applied the `pakipark-main` backend route surface to `pakipark-be-nestjs` using the existing NestJS BFF pattern.
- Preserved the API-driven flow: React Native mobile app -> NestJS backend/BFF -> Supabase API/PostgREST -> PostgreSQL/RLS.
- Added a web-compatible mobile service layer in `pakipark-fe/src/services` so mobile code can share the same service names and endpoint logic as the PakiPark web app.
- Expanded backend compatibility handlers for auth, password reset, profile, 2FA, bookings, locations, parking slots, notifications, reviews, settings/rates, payment methods, payments, analytics, logs, and uploads.

Validation performed:

```bash
cd pakipark-be-nestjs && npm run build
cd pakipark-fe && npm run typecheck
```

Both completed successfully.

Environment files:

- `.env` files are excluded from this handoff zip for safety.
- Use `pakipark-be-nestjs/.env.example` and `pakipark-fe/.env.example` as templates, then copy your local values back into `.env` files before running.

Run locally:

```bash
cd pakipark-be-nestjs
npm install
npm run start:dev
```

In another terminal:

```bash
cd pakipark-fe
npm install
npm run start
```

Make sure `EXPO_PUBLIC_API_BASE_URL` points to your backend with `/api`, for example:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:5000/api
```

## 2026-05-22 Review schema fix
- Fixed Rate & Review submission by routing review CRUD to `partner.reviews` instead of the non-existent `reservation.reviews` table.
- Review handlers now use the request user's Supabase JWT via `supabaseService.forUser(accessToken)` so review Select/Insert requests go through Supabase PostgREST with RLS.
- No direct database connection, ORM, public schema, or join table was introduced.
