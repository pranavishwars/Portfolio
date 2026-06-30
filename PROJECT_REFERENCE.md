# Portfolio Project Reference

Use this file to recreate the same architecture, styling, and patterns for similar projects.

---

## 1. Architecture Overview

```
client/           → Static frontend (served by Express)
server/           → Express.js backend (deployed as Vercel serverless function)
vercel.json       → Vercel config (routes everything through Express)
.env              → Local env vars (gitignored, set in Vercel dashboard for prod)
```

### Tech Stack
- **Frontend:** Vanilla JS, Three.js (r128), GSAP (3.12), Font Awesome 6
- **Backend:** Express.js, Mongoose, MongoDB Atlas, JWT auth
- **Deployment:** Vercel (single serverless function)
- **Fonts:** Cinzel (display), Inter (body) — via Google Fonts
- **Icons:** Font Awesome 6 Free via CDN (`fa-solid` only)

### Vercel Config (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    { "src": "server/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "server/index.js" }
  ]
}
```
No separate static build — Express serves everything.

### Server Entry Pattern (`server/index.js`)
```js
// Load .env only if it exists (local dev; Vercel provides env vars natively)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath });

// Detect client dir: try relative to __dirname first, fallback to cwd
let clientDir = path.join(__dirname, '..', 'client');
if (!fs.existsSync(clientDir)) clientDir = path.join(process.cwd(), 'client');

// Static + API + SPA fallback
app.use(express.static(clientDir));
app.get('*', (req, res) => { res.sendFile(path.join(clientDir, 'index.html')); });

// Only listen locally; on Vercel the exported `app` is the handler
connectDB().then(() => {
  if (!process.env.VERCEL) app.listen(PORT, ...);
});
module.exports = app;
```

### Environment Variables (Vercel + local `.env`)
| Name | Purpose |
|------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret |
| `ADMIN_PASSWORD_HASH` | SHA-256 of admin password |
| `NODE_ENV` | `development` or `production` |

---

## 2. CSS Conventions

### Variables (`:root` in `style.css`)
```css
--bg: #080612;             --bg-alt: #0c0a1a;       --bg-card: #101024;
--text: #eeeef8;           --text-muted: #9090b8;   --text-dim: #58589a;
--gold: #4488ff;            --accent: #00ccff;
--border-light: rgba(0, 204, 255, 0.1);
--radius: 8px;              --radius-sm: 4px;
--font-display: 'Cinzel', serif;
--font-body: 'Inter', sans-serif;
--transition: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
```

### Light Theme Override
```css
[data-theme="light"] { --bg: #f5f0eb; --bg-alt: #eae4de; --bg-card: #ffffff; --text: #1a1a24; ... }
```

### Key Patterns
- `body { overflow: hidden; }` on 3D page; standalone pages override with `body { overflow-y: auto; }`
- Navbar: fixed top, `backdrop-filter: blur(12px)`, height 68px
- Buttons: `.btn` base, `.btn-primary` (gold bg), `.btn-secondary` (ghost), `.btn-sm` variant
- Cards: `.admin-card`, `.item-card`, `.project-card`, `.room-card` (in overlays)
- Grid: `.projects-grid` with `repeat(3, 1fr)`, responsive breakpoints at 1024px (2-col) and 768px (1-col)
- Section labels: uppercase, letter-spaced, 0.65-0.75rem
- Mobile: hamburger menu, stacked grids, hidden HUD elements at ≤768px

### Self-Contained Pages
Standalone pages (hire.html, admin panel) should NOT link to style.css — inline all CSS to avoid `overflow: hidden` clipping and other conflicts.

---

## 3. Frontend Patterns

### Data Layer (`client/js/data.js`)
- `DEFAULT_DATA` — complete fallback with all sections (personal, skills, services, projects, experience, contact)
- `getData()` — fetches from `/api/data` with auth header, falls back to localStorage → DEFAULT_DATA
- `saveData(data)` — PUTs to `/api/data`, stores in localStorage as backup
- `API_BASE = '/api'` (single source of truth for API prefix)
- `getAdminToken()` — reads `portfolio_admin_token` from sessionStorage

### All icons must use Font Awesome 6 via CDN
CDN link: `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">`
- No emoji characters anywhere in code
- Use `<i class="fa-solid fa-ICONNAME"></i>` format
- Common icon mappings:
  - `fa-globe` (web), `fa-cubes` (3D/services), `fa-gear` (backend/settings)
  - `fa-palette` (design), `fa-layer-group` (fullstack), `fa-handshake` (consulting)
  - `fa-envelope` (email/contact), `fa-location-dot` (location), `fa-shield-halved` (availability)
  - `fa-user` (profile), `fa-briefcase` (experience), `fa-graduation-cap` (education)
  - `fa-bolt` (skills), `fa-cube` (projects), `fa-file-lines` (documents)
  - `fa-floppy-disk` (save/data), `fa-inbox` (inquiries), `fa-right-from-bracket` (logout)
  - `fa-lock` (auth), `fa-star` (featured/ratings), `fa-check` (success)
  - `fa-plus` (add), `fa-xmark` (close/delete), `fa-download`/`fa-upload` (import/export)
  - `fa-print` (print), `fa-sun` (theme toggle), `fa-arrow-right` (links)
  - `fa-chevron-left/up/down/right` (navigation arrows), `fa-play` (enter prompt)
  - `fa-code-branch` (source), `fa-crosshairs` (purpose), `fa-code` (clean code)
  - `fa-chart-line` (growth), `fa-puzzle-piece` (hobbies), `fa-pen` (blog)

### Admin Auth (`client/js/admin-auth.js`)
- Session stored in sessionStorage with 2hr TTL
- `initAdminGate(callback)` — shows auth gate, verifies existing session, calls callback on success
- `adminLogout()` — clears session, reloads page
- Auth UI: dark card with lock icon, password input, shake animation on error

### 3D Engine (`client/js/main.js`)
- **6 planets** arranged on octahedron vertices (top/front/right/back/bottom/left)
- Each planet: SphereGeometry + procedural/generated texture + rotation animation + enter hotspot
- Navigation: Arrow keys / WASD / scroll / swipe / nav arrows
- Room entry: camera dolly to planet surface, overlay appears with content
- Content rendered dynamically by `injectContentForRoom()` based on `contentType`
- Services room: renders service cards (3-column grid with gradient images, icons, badges, tags) + inline hire form
- `addCard(body, html, hex, delay)` — reusable animated card with staggered entrance
- `esc(str)` — HTML escape helper; `hexToRgb(hex)` — color conversion
- `showRoomContentOverlay(cfg)` / `hideRoomContentOverlay()` — overlay enter/exit

### Service Helper Functions (main.js + hire.html)
```js
function getServiceIcon(name)      // returns FA icon HTML based on name keyword match
function serviceGradient(name)     // returns gradient CSS from name hash
function serviceKeywords(name)     // returns tag array from name keyword match
```

---

## 4. Backend Patterns

### MongoDB Models (`server/db.js`)
- `Portfolio` — single doc (`{ key: 'main', data: {...} }`) holding all portfolio content
- `HireInquiry` — name, email, phone, service, description, read boolean, timestamps
- `ContactMessage` — name, email, message, read boolean, timestamps
- `connectDB()` — connects to Atlas, seeds DEFAULT_DATA if collection empty
- `getPortfolioData()` / `savePortfolioData(data)` — read/write the single portfolio doc

### Route Structure
- `GET /api/data` — public, returns portfolio data
- `PUT /api/data` — auth required, updates portfolio data
- `POST /api/auth` — login, returns JWT token
- `POST /api/auth/verify` — verifies token validity
- `POST /api/contact` — public, saves contact message
- `POST /api/hire` — public, saves hire inquiry
- `GET /api/hire` — auth required, returns all inquiries
- `PUT /api/hire/:id/read` — auth required, marks inquiry as read

### Auth Middleware (`server/middleware/auth.js`)
```js
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ success: false, error: 'Authentication required' });
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  if (decoded.exp && Date.now() > decoded.exp)
    return res.status(401).json({ ... });
  req.user = decoded;
  next();
}
```

### All route handlers use `async` with try/catch
```js
router.get('/', async (req, res) => {
  try { ... res.json({ success: true, data }); }
  catch (err) { res.status(500).json({ success: false, error: '...' }); }
});
```

### All API responses follow `{ success: Boolean, ... }` format
- Success: `{ success: true, data: ... }` or `{ success: true, message: '...' }`
- Error: `{ success: false, error: '...' }`

---

## 5. GitHub Setup

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git push -u origin main --force   # force if repo has existing files
```

### .gitignore
```
node_modules/
.env
server/data/
.DS_Store
```

### If server/ has its own .git (nested repo):
```bash
rm -rf server/.git
git rm --cached server
git add -A
git commit -m "Fix server submodule"
git push
```

---

## 6. Vercel Deployment

1. Go to https://vercel.com/new, import GitHub repo
2. Root Directory: `./` (default)
3. Framework Preset: **Other**
4. Add environment variables in Vercel dashboard at `/settings/environment-variables`
5. Deploy — auto-deploys on every push to main branch
6. Admin page: `https://SITE.vercel.app/vault-7c3f9a.html`
7. MongoDB Atlas: set Network Access to `0.0.0.0/0` (allows Vercel's dynamic IPs)

---

## 7. Key Conventions Summary

- No emojis anywhere — use Font Awesome icons
- All API responses: `{ success, data/error }` format
- Template literals for HTML in JS — use `esc()` helper for user content
- Inline styles in JS template strings (no separate CSS files for dynamic content)
- CSS variables for theming (dark mode default, `data-theme="light"` override)
- Self-contained pages for admin and hire (no external CSS dependency)
- Async route handlers with try/catch
- `module.exports = app` at end of server/index.js for Vercel compatibility
