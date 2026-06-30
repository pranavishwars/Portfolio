# Pranav Ishwar S — Portfolio

## Overview
Full-stack 3D portfolio: Express.js + MongoDB Atlas backend, Three.js interactive 3D world frontend. Hosted on Vercel at `pranavishwars.vercel.app`.

## Project Structure
```
/
├── vercel.json              # Vercel config: routes all → Express serverless function
├── .env                     # Local env vars (gitignored)
├── .gitignore               # node_modules, .env, server/data/
├── client/                  # Frontend (served by Express static)
│   ├── index.html           # Entry: 3D world with Three.js + GSAP
│   ├── vault-7c3f9a.html    # Admin panel (password-protected)
│   ├── hire.html            # Standalone hire page (self-contained CSS)
│   ├── about.html           # About page
│   ├── projects.html        # Projects grid
│   ├── resume.html          # Resume page
│   ├── contact.html         # Contact page
│   ├── blog.html / blog-2.html
│   ├── experience.html / skills.html
│   ├── xxx.html             # Legacy admin (unused, keep for reference)
│   ├── css/style.css        # Global styles (dark theme, nav, grids)
│   └── js/
│       ├── data.js          # Data layer: DEFAULT_DATA, getData(), saveData(), API_BASE='/api'
│       ├── main.js          # Three.js 3D engine: planets, rooms, navigation, overlays
│       ├── admin-auth.js    # Auth gate: session/token mgmt, POST /api/auth
│       └── admin.js         # Admin CRUD panels, inquiry management
└── server/                  # Express backend
    ├── index.js             # Server entry: routes, static serving, MongoDB connect
    ├── package.json         # express, cors, dotenv, jsonwebtoken, mongoose
    ├── db.js                # Mongoose models (Portfolio, HireInquiry, ContactMessage)
    ├── middleware/auth.js   # JWT verify middleware
    └── routes/
        ├── auth.js          # POST /api/auth, POST /api/auth/verify
        ├── data.js          # GET/PUT /api/data (PUT requires auth)
        ├── contact.js       # POST /api/contact
        └── hire.js          # POST /api/hire (public), GET /api/hire (auth), PUT /:id/read (auth)
```

## Key URLs
- **Live site:** https://pranavishwars.vercel.app
- **Admin panel:** https://pranavishwars.vercel.app/vault-7c3f9a.html
- **GitHub:** https://github.com/pranavishwars/Portfolio
- **Vercel dashboard:** https://vercel.com/pranavishwars-3991s-projects/pranavishwars

## Admin Credentials
- **Password:** `portfolio2026`
- **SHA-256 hash:** `9881928f60e14fcbd7a28d2166ee4e8ba456daa9df696159dcae35050762895b`

## Vercel Environment Variables (must be set in dashboard)
| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://ishwarpranav:ishwarpranav@cluster0.uhhajsv.mongodb.net/portfolio?retryWrites=true&w=majority&appName=Cluster0` |
| `JWT_SECRET` | `portfolio_jwt_secret_change_in_production_2026` |
| `ADMIN_PASSWORD_HASH` | `9881928f60e14fcbd7a28d2166ee4e8ba456daa9df696159dcae35050762895b` |
| `NODE_ENV` | `production` |

## Local Development
```bash
cd server && npm install && npm start
# Site at http://localhost:3001
```

## 3D World Features
- **6 rooms** (planets) orbiting an octahedral structure:
  - Services (top), Projects (front), Skills (right), Experience (back), Contact (bottom), About (left)
- **Navigation:** Arrow keys / drag / scroll / nav buttons / HUD dots
- **Room overlay:** Click a planet or press Space to enter, Space to exit
- **Services room:** Service cards + inline hire form
- Each planet has procedural/real texture, rotation animation, outer labels

## Icons
All icons use **Font Awesome 6** (CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css`). No emoji characters anywhere.

## Chat History Summary
1. Built full-stack portfolio: Express + MongoDB Atlas + static frontend + 3D world
2. Migrated from SQLite → MongoDB Atlas
3. Created admin panel, hire page, contact form, blog pages
4. Replaced all emojis with Font Awesome icons (fa-globe, fa-envelope, fa-user, etc.)
5. Deployed to Vercel: fixed submodule issue in server/, added path fallback for static files
6. Configured Vercel env vars for MongoDB/JWT/auth
7. Changed page title to "Pranav Ishwar S"

## Known Issues
- `server/db.js` DEFAULT_DATA still has old emoji icon strings (`⚙️`, `📐`) — these are fallback data only, the client-side `data.js` has the correct FA HTML icons. The DB data on Atlas is what actually renders.
