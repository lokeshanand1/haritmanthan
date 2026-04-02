# 🛡️ EcoGuardian – Gamified Park Explorer PWA

> **Harit Manthan 2026** – National Hackathon by DDA & Udhmodya Foundation  
> Problem Statement 2: *Making Public Green Spaces More Engaging and Accessible*

EcoGuardian transforms public park visits into interactive adventures. Users scan QR codes at park entrances, walk through the park to claim territory using **topological geospatial slicing**, report maintenance issues with photos, contribute safety ratings, and interact with **3D Augmented Reality (AR) Eco Pods**—all while generating actionable spatial data for park management.

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

---

## 📱 Core Features

### 1. Advanced Territory Claiming (Topological Slicing)
- **Live Path Drawing**: GPS tracking with geofencing. Your path is a live-drawn dashed line.
- **Topological Intersections (Turf.js)**: Unlike simple overlaps, we use true geospatial math to slice areas:
    - 🟢 **Owned**: Your exclusive territory.
    - 🔵 **Others**: Exclusively claimed by others.
    - 🟣 **Co-owned**: Precise intersection chunks (dashed purple) where multiple users' loops overlap.
- **24h Expiry**: Dynamic logic ensures territories remain competitive and active.
- **Loop Detection**: Haversine distance and Shoelace area calculations for loop closure.

### 2. 3D AR Eco Pod Scanning
- **Advanced Scanner**: Built-in QR scanner handles JSON, raw IDs, and Deep Links.
- **3D Visualization**: Using **Three.js (@react-three/fiber)**, users can view detailed AR models of "Pods" (Trees, Benches, Air Quality Sensors).
- **Gamified Scans**: Scanning physical assets awards points and displays real-time ecological impact data (e.g., CO2 absorption, PM2.5).

### 3. Progressive Web App (PWA) Discovery Flow
- **Zero-friction Flow**: No App Store download required. 
- **Scan-to-Web**: Physical QR codes in the park open directly in the mobile browser.
- **Installable**: Full manifest support allowing "Add to Home Screen" for a native app feel.
- **Offline Ready**: Service Worker support for smooth performance on spotty park Wi-Fi/data.

### 4. Women's Safety & Emergency Layer
- **Safety Rating Grid**: Users contribute to a safety heatmap: Safe ✅ / Neutral 😐 / Unsafe ⚠️.
- **Emergency SOS**: Immediate "One-Tap" SOS sends live GPS position to security with haptic feedback (vibration).

### 5. Issue Reporting & Eco-Actions
- **Citizen Reporting**: 8 report types with camera capture and GPS stamps (+50 pts).
- **Eco-Actions**: Log physical acts like watering plants (+30 pts) or picking litter (+40 pts).
- **Admin Dashboard**: Real-time management for DDA officials to track reports and territory density.

### 6. Inclusivity & Localization
- 🌐 **Full Hindi + English**: Seamless toggle for accessibility.
- 👁️ **Design**: High-contrast dark mode with premium glassmorphism.

---

## 🛠️ Technical Stack

| Category | Technology |
|-----------|---------|
| **UI Framework** | React 19 + Vite 8 |
| **3D Rendering** | Three.js + @react-three/fiber |
| **Maps** | Leaflet + react-leaflet |
| **Geospatial Math** | @turf/turf (Intersections & Unions) |
| **Scanner** | @yudiel/react-qr-scanner |
| **PWA** | Web Manifest + Service Worker |
| **State/Auth** | React Context + Simulated Firebase |

---

## 🏗️ Project Structure

```bash
haritmanthan/
├── public/
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx   # Tab navigation
│   │   ├── PodModels.jsx   # Three.js 3D/AR component
│   │   └── Toast.jsx       # Global notifications
│   ├── context/
│   │   ├── AuthContext.jsx  # Auth (Simulated)
│   │   ├── GameContext.jsx  # The "Engine": Loop detection, territory storage
│   │   └── LanguageContext.jsx # EN/HI Toggle
│   ├── pages/
│   │   ├── ParkMap.jsx      # Leaflet map + Turf.js intersection logic
│   │   ├── EcoScanner.jsx   # QR Scanner page
│   │   ├── PodARView.jsx    # AR 3D Experience
│   │   ├── Safety.jsx       # Safety grid & SOS
│   │   └── admin/
│   │       └── Dashboard.jsx # DDA Admin Panel
│   ├── App.jsx              # Router & Global Layers
│   └── index.css            # Pro Design System
```

---

## 🧠 Technical Deep Dive: The Geospatial Engine

To solve the complexity of overlapping user territories, we moved away from simple "layering". When two polygons overlap:
1. **Turf Union**: All your owned polygons are merged into a single geometric feature.
2. **Turf Intersection**: We calculate `turf.intersect(mine, others)` to derive the "Co-owned" zone.
3. **Turf Difference**: We use `turf.difference` to subtract the intersection from both layers, ensuring that **rendered pixels never overlap stacks**, which improves performance and visual clarity on mobile devices.

---

## 📊 Impact & Scalability
- **Actionable Data**: Provides DDA with thermal maps (microclimates) and maintenance heatmaps.
- **Scalable**: Adding a new park is as simple as dropping a 1KB GeoJSON boundary file in `src/data/parks/`.

## 📄 License
MIT – Built for Harit Manthan 2026 Hackathon
