# 🛡️ EcoGuardian – Gamified Park Explorer PWA

> **Harit Manthan 2026** – National Hackathon by DDA & Udhmodya Foundation  
> Problem Statement 2: *Making Public Green Spaces More Engaging and Accessible*

EcoGuardian transforms public park visits into interactive adventures. Users scan QR codes at park entrances, walk through the park to draw territory loops, report maintenance issues, contribute safety ratings, perform eco-actions (watering plants, picking litter), and compete on leaderboards — all while generating actionable spatial data for park management.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **User** | `demo@ecoguardian.app` | `demo1234` |
| **Admin** | `admin@ecoguardian.app` | `admin1234` |

Or click **"Quick Demo Login"** / **"Admin Demo"** on the landing page.

## 📱 Features

### 1. Polygon Territory Claiming (Walk → Loop → Claim)
- Scan park QR code → see live leaderboard → enter park
- GPS tracking with park boundary geofence (GeoJSON polygon)
- **Walk to draw a trail** — your path is shown as a dashed line on the map
- **Close the loop** — when you return within ~20m of an earlier point on your path, the enclosed area fills in as your claimed territory
- Territory is scored by **area in m²** (1 point per 100m²)
- **Co-ownership**: If your loop overlaps another user's territory, you both become co-owners (shown in purple)
- **24h expiry**: Return within 24 hours or lose your claim
- A **gold marker** at your trail start guides you back to close the loop
- Manual check-in fallback for weak GPS
- **Simulate Walk** mode for indoor hackathon demos

### 2. QR Code Leaderboard Splash
- Scanning ANY park QR shows the **Top 10 leaderboard** instantly
- Live visitor count and eco-action statistics
- Park Champion spotlight with badge
- Public & motivational — even for non-registered users

### 3. Eco-Actions (Points for Physical Actions)
- 🌱 Water a Plant (+30 pts)
- 🗑️ Pick Up Litter (+40 pts)
- 🌳 Plant a Sapling (+100 pts)
- 🪑 Clean a Bench (+25 pts)
- 🐦 Report Wildlife Sighting (+20 pts)
- Photo proof required for each action
- Admin approval system

### 4. Issue Reporting
- 8 report types (litter, broken bench, dry tree, unsafe lighting, etc.)
- Camera capture with GPS stamp
- +50 points per report  
- Reports sent to DDA dashboard with coordinates, photo, timestamp

### 5. Women's Safety Layer
- Rate zones: Safe ✅ / Neutral 😐 / Unsafe ⚠️
- Aggregated safety heatmap (green/yellow/red)
- Emergency SOS button: tap → sends live GPS location to park security
- Phone vibration alert on activation

### 6. Gamification
- Daily challenges (claim 500m² territory, report 2 issues, close 2 loops, etc.)
- 8 collectible badges (Guardian of the Grove, Safety Scout, Eco Hero, etc.)
- Weekly leaderboard with podium visualization
- Social sharing of territory stats

### 7. Admin Dashboard (DDA)
- Live territory map with claimed polygons
- Safety heatmap overlay
- Microclimate/cooling zone map
- Reports management (pending → in-progress → resolved)
- Analytics: peak hours chart, territory stats, eco impact
- Top players overview

### 8. Inclusivity & Accessibility
- 🌐 Hindi + English toggle (full translations)
- 👁️ High contrast mode for low vision
- ♿ Screen reader support (ARIA labels)
- 📴 Offline-ready (Service Worker + localStorage)
- 📱 Installable PWA

## 🏗️ Project Structure

```
haritmanthan/
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── favicon.svg         # App icon
│   └── sw.js               # Service worker
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx   # Bottom navigation
│   │   └── Toast.jsx       # Toast notifications
│   ├── context/
│   │   ├── AuthContext.jsx  # Auth (simulated Firebase)
│   │   ├── GameContext.jsx  # Territory engine, loop detection, scoring
│   │   └── LanguageContext.jsx  # i18n (EN/HI)
│   ├── data/
│   │   └── parks/
│   │       └── indraprastha.json  # Park GeoJSON boundary + POIs
│   ├── i18n/
│   │   ├── en.json         # English translations
│   │   └── hi.json         # Hindi translations
│   ├── pages/
│   │   ├── Landing.jsx     # Entry + auth
│   │   ├── QRLeaderboard.jsx  # QR scan leaderboard splash
│   │   ├── ParkMap.jsx     # Main map + territory + trail
│   │   ├── Report.jsx      # Issue reporting
│   │   ├── EcoActions.jsx  # Eco-action logging
│   │   ├── Safety.jsx      # Safety ratings + emergency
│   │   ├── Leaderboard.jsx # Rankings + challenges + badges
│   │   ├── Profile.jsx     # User profile + settings
│   │   └── admin/
│   │       └── Dashboard.jsx  # Admin panel
│   ├── App.jsx             # Router
│   ├── main.jsx            # Entry point
│   └── index.css           # Design system
├── index.html
├── vite.config.js
└── package.json
```

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite 8 | Build tool |
| React Router | Client-side routing |
| Leaflet + react-leaflet | Interactive maps |
| Vanilla CSS | Custom design system |
| localStorage | Offline data persistence |
| Service Worker | PWA offline support |
| Geolocation API | GPS tracking |

## 🧠 How Territory Claiming Works

```
1. User starts walking → GPS positions are recorded as a trail
2. Trail shown as a dashed green polyline on the map
3. Gold marker appears at trail start to guide loop closure
4. When user returns within ~20m of an earlier trail point:
   → Loop detected (minimum 8 points, minimum 50m² area)
   → Enclosed polygon is filled as claimed territory (green)
   → Points awarded: area_m² / 100
   → If the polygon overlaps another user's territory → co-ownership (purple)
5. All territories expire after 24 hours if user doesn't return
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase init hosting
npm run build
firebase deploy
```

## 🔄 Scaling to Production

The app is structured for easy migration to real Firebase:

1. Replace `AuthContext.jsx` with Firebase Auth
2. Replace localStorage in `GameContext.jsx` with Firestore
3. Add Firebase Storage for photo uploads
4. Set up Cloud Functions for point validation & loop verification
5. Add real-time listeners for live territory updates

## 📊 How It Addresses Hackathon Criteria

| Criteria | Implementation |
|----------|---------------|
| **Innovation & Technical** | Polygon loop-based territory claiming, Haversine distance, Shoelace area calculation, co-ownership engine |
| **Feasibility** | Works on any smartphone browser, no hardware needed, free to host |
| **Prototype Demo** | Simulate Walk mode auto-draws a loop and claims territory live |
| **Scalability** | Same app works for 100+ parks — just add GeoJSON boundaries |
| **Impact** | Measurable: footfall heatmaps, safety zones, maintenance reports, eco-actions |
| **Presentation** | Premium dark theme, glassmorphism, animations, Hindi/English, accessibility |

## 📄 License

MIT – Built for Harit Manthan 2026 Hackathon
