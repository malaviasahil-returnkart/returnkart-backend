# ReturnKart.in — API Specification

## Base URL
- Dev: `http://localhost:8000`
- Production: `https://return-kart-tracker.replit.app`

## Authentication
All endpoints except `/api/health` and `/api/auth/*` require a valid Supabase JWT in the `Authorization: Bearer <token>` header.

---

## Endpoints

### Health
`GET /api/health`
Returns 200 if the backend is running.
```json
{ "status": "ok", "env": "production" }
```

### Auth
`GET /api/auth/google` — Initiates Gmail OAuth flow. Redirects to Google consent screen.
`GET /api/auth/callback` — OAuth callback. Exchanges code for token, saves to Supabase.
`DELETE /api/auth/revoke` — Revokes Gmail access and deletes token from DB. (DPDP: Right to Withdraw)

### Orders
`GET /api/orders` — Returns all orders for the authenticated user.
`POST /api/orders/sync` — Triggers Gmail sync: fetches new invoice emails, runs Gemini extraction, saves to Supabase.
`PATCH /api/orders/:id` — Updates order status (kept / returned).

---

## Vite Proxy Configuration
In dev, Vite proxies `/api/*` to `http://localhost:8000` so the frontend never needs the backend URL hardcoded.

```js
// frontend/vite.config.js
proxy: {
  '/api': { target: 'http://localhost:8000', changeOrigin: true }
}
```
