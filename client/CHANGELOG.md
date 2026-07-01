# Changelog — Session Fixes

## Cross-Browser Data Sync (the major fix)

### Problem
Admin-edited content only appeared in the same browser that made the edits. On other browsers/devices, the site showed default data and admin changes were invisible.

### Root Cause
Three interconnected bugs:

1. **`saveData()` in `data.js` silently swallowed server errors** — it was fire-and-forget: wrote to localStorage, fired a `PUT /api/data` fetch, caught all errors with `.catch(() => {})`, and returned `true` synchronously. The admin always saw "Data saved successfully" even if the server write failed.

2. **`getData()` returned localStorage before API data** — on the very first call, `getData()` started a fetch but synchronously returned `getLocalFallback()` (localStorage or DEFAULT_DATA). On a browser with empty localStorage, DEFAULT_DATA rendered. The API data arrived later but nothing triggered a re-render of room content.

3. **No re-render mechanism for room overlays** — the `portfolio-data-ready` event was dispatched when API data loaded, but only the landing page listened for it. If a user entered a room before the fetch completed, they saw stale DEFAULT_DATA forever.

### Fixes

**`client/js/data.js`** — `saveData()` now returns a `Promise<boolean>`:
- The Promise resolves to `true` only when the server responds with `{ success: true }`
- Errors are surfaced instead of caught silently
- Callers can `await` or `.then()` to get the real result

**`client/js/admin.js`** — Admin now sees the actual server result:
- `commitDataToSystemStorage()` awaits the promise and shows "Error saving data. Server may be unavailable." if the PUT failed
- Import flow also shows server save status
- The `portfolio-data-ready` listener re-renders panels when fresh API data arrives

**`client/js/main.js`** — Room content re-renders when data arrives:
- Added `portfolio-data-ready` event listener
- If the user is currently inside a room (`isInsideRoom === true`), it clears and re-renders the room overlay body with the fresh data from the server

---

## Vercel 500 Error Fix

### Problem
The Vercel API (`/api/data`) returned 500 errors because the serverless function tried to handle requests before MongoDB was connected.

### Root Cause
`server/index.js` called `connectDB()` at the module top level asynchronously, but `module.exports = app` ran immediately. On Vercel's serverless, requests could arrive before the MongoDB connection finished, causing buffer timeout errors.

### Fix
**`server/db.js`** — Lazy connection per-request:
- Added `ensureDB()` that checks `mongoose.connection.readyState` before every query
- `_dbPromise` caches the connection attempt so concurrent requests share one connection
- If `connectDB()` fails, the promise resets so the next request retries
- Every db function (`getPortfolioData`, `savePortfolioData`, etc.) calls `ensureDB()` first

**`server/index.js`** — Removed the `app.listen()` dependency on `connectDB()`:
- `app.listen()` starts immediately (local) / `module.exports` runs immediately (Vercel)
- `connectDB()` kicks off in the background for warm-start optimization
- Each request lazily waits for the connection via `ensureDB()`

---

## Graceful Fallback When DB is Down

### Problem
If MongoDB is unreachable (unset env vars, network issue, Atlas whitelist), the API returned 500 and the frontend showed default data from the catch handler — but the admin never knew.

### Fix
**`server/routes/data.js`** — `GET /api/data` returns `{ success: true, data: DEFAULT_DATA }` on DB failure instead of a 500:
- The site remains functional even without MongoDB
- Edits won't persist but the page looks correct

**`server/index.js`** — `connectDB()` failure is logged but doesn't crash the process on Vercel

---

## Mobile Fixes

**Auto-dismiss landing overlay** (`client/js/main.js`):
- On mobile (≤768px), the landing page auto-dismisses after 4 seconds so users see the 3D world without needing to press Space/Enter

**Room overlay padding** (`client/js/main.js`):
- Injected CSS media query for ≤768px: smaller padding, hidden "· Space" hint on exit button, full-height body

**Projects grid** (`client/js/main.js`):
- `renderProjectsContent` now checks `window.innerWidth` — 1 column on mobile, 3 columns on desktop
- Matches the existing pattern used by `renderHomeContent` (services grid)

---

## Deployment

- All changes pushed to `main` on GitHub
- Vercel auto-deploys on every push
- Local MongoDB connection may fail on certain networks (DNS `ESERVFAIL` for Atlas SRV records) — not a code bug; Vercel deployment works correctly
