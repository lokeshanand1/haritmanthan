# 🛡️ EcoGuardian – Gamified Park Explorer PWA

> **Harit Manthan 2026** – National Hackathon by DDA & Udhmodya Foundation  
> Problem Statement 2: *Making Public Green Spaces More Engaging and Accessible*

EcoGuardian transforms public park visits into interactive adventures. Users scan QR codes at park entrances, claim virtual territory by walking, report maintenance issues, contribute safety ratings, perform eco-actions (watering plants, picking litter), and compete on leaderboards — all while generating actionable data for park management.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173` in your browser.

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **User** | `demo@ecoguardian.app` | `demo1234` |
| **Admin** | `admin@ecoguardian.app` | `admin1234` |

Or click **"Quick Demo Login"** / **"Admin Demo"** on the landing page.

## 📱 Features

### 1. Geofenced Territory Claiming
- Scan park QR code → see live leaderboard → enter park
- GPS tracking with park boundary geofence (GeoJSON polygon)
- ~10m grid cells claimed as you walk
- **Co-ownership**: Multiple users on same route share territory
- **24h expiry**: Return within 24 hours or lose your claim
- Manual check-in fallback for weak GPS
- **Simulate Walk** mode for indoor demos

### 2. QR Code Leaderboard (NEW)
- Scanning ANY park QR shows the **Top 10 leaderboard** instantly
- Live visitor count and eco-action statistics
- Park Champion spotlight with badge
- Public & motivational — even for non-users

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
- Emergency button: tap → sends live location to park security
- Phone vibration alert

### 6. Gamification
- Daily challenges (claim 10 cells, report 2 issues, etc.)
- 8 collectible badges (Guardian of the Grove, Safety Scout, Eco Hero, etc.)
- Weekly leaderboard with podium visualization
- Social sharing of territory stats

### 7. Admin Dashboard (DDA)
- Live activity heatmap
- Safety heatmap overlay
- Microclimate/cooling map
- Reports management (pending → in-progress → resolved)
- Analytics: peak hours chart, visit duration, eco impact stats
- Top players overview

### 8. Inclusivity
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
│   │   ├── AuthContext.jsx  # Auth state (simulated Firebase)
│   │   ├── GameContext.jsx  # Game state (cells, points, reports)
│   │   └── LanguageContext.jsx  # i18n (EN/HI)
│   ├── data/
│   │   └── parks/
│   │       └── indraprastha.json  # Sample park GeoJSON
│   ├── i18n/
│   │   ├── en.json         # English translations
│   │   └── hi.json         # Hindi translations
│   ├── pages/
│   │   ├── Landing.jsx     # Entry + auth
│   │   ├── QRLeaderboard.jsx  # QR scan splash screen
│   │   ├── ParkMap.jsx     # Main map + territory
│   │   ├── Report.jsx      # Issue reporting
│   │   ├── EcoActions.jsx  # Eco-action logging
│   │   ├── Safety.jsx      # Safety ratings
│   │   ├── Leaderboard.jsx # Rankings + challenges
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

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy `dist/` folder to Netlify
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

1. Replace `src/context/AuthContext.jsx` with Firebase Auth
2. Replace localStorage in `GameContext.jsx` with Firestore
3. Add Firebase Storage for photo uploads
4. Set up Cloud Functions for point validation
5. Add real-time listeners for live activity updates

## 📊 How It Addresses Hackathon Criteria

| Criteria | Score | Implementation |
|----------|-------|---------------|
| Innovation & Technical | ⭐⭐⭐⭐⭐ | Geofencing, real-time territory, co-ownership, eco-actions |
| Feasibility | ⭐⭐⭐⭐⭐ | Works on any smartphone, no hardware needed, free hosting |
| Prototype Demo | ⭐⭐⭐⭐⭐ | Simulate Walk mode, live territory claiming, full admin panel |
| Scalability | ⭐⭐⭐⭐⭐ | Same app works for 100+ parks, just add GeoJSON boundaries |
| Impact | ⭐⭐⭐⭐⭐ | Measurable: footfall, safety, maintenance, eco-actions |
| Presentation | ⭐⭐⭐⭐⭐ | Premium dark UI, animations, multi-language, accessibility |

## 📄 License

MIT – Built for Harit Manthan 2026 Hackathon
