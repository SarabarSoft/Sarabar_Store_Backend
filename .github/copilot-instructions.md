# Copilot / AI Agent Instructions for Sarabar_Store_Backend

Purpose: give an AI coding agent exactly the repository facts and patterns needed to make correct, minimal, and safe changes.

- **Entry point**: server.js — the Express app, route mounting, and public vs protected route split. See [server.js](server.js).
- **DB**: Mongoose connection in [config/db.js](config/db.js). Primary env var: `MONGO_URI` (present in README).
- **Auth**: JWT-based middleware at [middleware/authtoken.js](middleware/authtoken.js). Protected routes are mounted with `authMiddleware` in `server.js` (admin/management APIs).

Key patterns and local conventions
- CommonJS modules (`require`/`module.exports`) — do not convert to ESM.
- Route structure: `routes/` contains both mobile (public) and admin (protected) routers. Mobile endpoints are mounted under `/api/mobile/*`; admin/management endpoints under `/api/*` and usually protected by `authMiddleware`.
- Controllers live in `Controller/` (note the capitalized folder name) and route handlers sometimes call utility functions directly from the routes — prefer small, focused edits when modifying behavior.
- Models are in `models/` and use Mongoose schemas (e.g., `Product.js`, `Order.js`). Use existing schema fields when creating queries or updates.

Running & developer commands
- Install: `npm install`
- Dev server: `npm run dev` (uses `nodemon server.js`)
- Production start: `npm start` (runs `node server.js`)

Environment & secrets (discoverable in repo)
- `MONGO_URI` is documented in `README`.
- `JWT_SECRET` is required by `middleware/authtoken.js` (not in README) — ensure it's present in the environment for protected routes to work.
- `config/cloudinary.js` currently contains hard-coded Cloudinary credentials. Be cautious: changes to public commits must not leak new secrets. `config/razorpay.js` expects `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in env.

Common change examples
- Add a new protected route:

```js
// routes/myAdminRoute.js
const express = require('express');
const router = express.Router();
// handler implementation (keep small & use existing models)
module.exports = router;

// In server.js, mount with auth:
app.use('/api/myadmin', authMiddleware, require('./routes/myAdminRoute'));
```

- Add a public mobile route similarly under `/api/mobile` without `authMiddleware`.

Review checklist for PRs
- Does the change respect CommonJS imports/exports?
- Are database models used consistently (no ad-hoc schema fields)?
- If touching protected routes, is token flow preserved (see `middleware/authtoken.js`)?
- No new secrets should be added to source files; prefer env vars and document them in `README`.

Files to inspect for context when modifying behavior
- [server.js](server.js) — routing and middleware mounting
- [config/db.js](config/db.js) — DB connection
- [middleware/authtoken.js](middleware/authtoken.js) — auth expectations
- [config/cloudinary.js](config/cloudinary.js) and [config/razorpay.js](config/razorpay.js) — third-party integration points

If any part of the codebase is ambiguous (naming, expected request body shape, or model fields), ask for a short example request/response or a preferred schema change before implementing large refactors.

If you want me to iterate on tone, length, or add quick code snippets for specific tasks (for example: "Add product search endpoint"), tell me the target file and I will produce a focused patch.
