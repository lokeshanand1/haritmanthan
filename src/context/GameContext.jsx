import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import parkData from '../data/parks/indraprastha.json';

const GameContext = createContext();

// ─── Geometry Utilities ───────────────────────────────────────

// Ray-casting point-in-polygon (lng, lat order)
function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Distance between two [lat,lng] points in metres (Haversine)
function distanceMetres(a, b) {
  const R = 6371000;
  const toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Polygon area in m² using the Shoelace formula on projected coords
function polygonAreaM2(coords) {
  // coords = [[lat,lng], ...]
  const R = 6371000;
  const toRad = v => (v * Math.PI) / 180;
  // project to flat x,y in metres
  const refLat = coords[0][0];
  const refLng = coords[0][1];
  const points = coords.map(([lat, lng]) => {
    const x = (lng - refLng) * toRad(1) * R * Math.cos(toRad(refLat));
    const y = (lat - refLat) * toRad(1) * R;
    return [x, y];
  });
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]);
  }
  return Math.abs(area / 2);
}

// Simplify a path by removing points that are too close (skip < minDist metres)
function simplifyPath(path, minDist = 5) {
  if (path.length < 2) return path;
  const result = [path[0]];
  for (let i = 1; i < path.length; i++) {
    if (distanceMetres(result[result.length - 1], path[i]) >= minDist) {
      result.push(path[i]);
    }
  }
  return result;
}

// Detect if a new point closes a loop in the path
// Returns the sub-path forming the loop, or null
function detectLoop(path, newPoint, closeThreshold = 20, minLoopPoints = 8) {
  // Check if newPoint is within closeThreshold metres of any point
  // at least minLoopPoints back in the path
  for (let i = 0; i < path.length - minLoopPoints; i++) {
    if (distanceMetres(path[i], newPoint) < closeThreshold) {
      // Found a loop: from path[i] to newPoint
      const loopCoords = [...path.slice(i), newPoint];
      // Require minimum area (50 m²)
      const area = polygonAreaM2(loopCoords);
      if (area > 50) {
        return { loopCoords, startIndex: i, area };
      }
    }
  }
  return null;
}

// Check if two polygons overlap (simplified: check if any vertex of A is inside B or vice versa)
function polygonsOverlap(polyA, polyB) {
  // Convert [lat,lng] to [lng,lat] for isPointInPolygon
  const polyBLngLat = polyB.map(([lat, lng]) => [lng, lat]);
  const polyALngLat = polyA.map(([lat, lng]) => [lng, lat]);
  for (const [lat, lng] of polyA) {
    if (isPointInPolygon([lng, lat], polyBLngLat)) return true;
  }
  for (const [lat, lng] of polyB) {
    if (isPointInPolygon([lng, lat], polyALngLat)) return true;
  }
  return false;
}

// ─── Simulated Data ──────────────────────────────────────────────

// Simulated pre-existing territories from other users
const INITIAL_TERRITORIES = [
  {
    id: 'terr-other-1',
    polygon: [
      [28.6185, 77.2460], [28.6190, 77.2462], [28.6193, 77.2468],
      [28.6191, 77.2474], [28.6186, 77.2472], [28.6183, 77.2466], [28.6185, 77.2460],
    ],
    owners: [{ userId: 'user-002', displayName: 'Green Walker', claimedAt: Date.now() - 3600000, expiresAt: Date.now() + 20 * 3600000 }],
    area_m2: 3200,
  },
  {
    id: 'terr-other-2',
    polygon: [
      [28.6195, 77.2485], [28.6200, 77.2488], [28.6202, 77.2494],
      [28.6198, 77.2498], [28.6193, 77.2495], [28.6192, 77.2489], [28.6195, 77.2485],
    ],
    owners: [{ userId: 'user-003', displayName: 'Nature Scout', claimedAt: Date.now() - 7200000, expiresAt: Date.now() + 16 * 3600000 }],
    area_m2: 2800,
  },
  {
    id: 'terr-other-3',
    polygon: [
      [28.6170, 77.2478], [28.6174, 77.2475], [28.6178, 77.2479],
      [28.6176, 77.2485], [28.6171, 77.2484], [28.6170, 77.2478],
    ],
    owners: [{ userId: 'user-004', displayName: 'Park Ranger', claimedAt: Date.now() - 1200000, expiresAt: Date.now() + 22 * 3600000 }],
    area_m2: 1600,
  },
];

const INITIAL_LEADERBOARD = [
  { uid: 'user-002', displayName: 'Green Walker', avatar: '🌳', points: 2450, areaClaimed: 8700, badges: 5 },
  { uid: 'user-003', displayName: 'Nature Scout', avatar: '🦋', points: 1890, areaClaimed: 6400, badges: 4 },
  { uid: 'user-004', displayName: 'Park Ranger', avatar: '🏕️', points: 1560, areaClaimed: 5200, badges: 3 },
  { uid: 'user-005', displayName: 'Eco Warrior', avatar: '♻️', points: 1230, areaClaimed: 4100, badges: 3 },
  { uid: 'user-006', displayName: 'Tree Hugger', avatar: '🌲', points: 980, areaClaimed: 3300, badges: 2 },
  { uid: 'user-007', displayName: 'Flora Fan', avatar: '🌸', points: 750, areaClaimed: 2500, badges: 2 },
  { uid: 'user-008', displayName: 'Bird Watcher', avatar: '🐦', points: 620, areaClaimed: 2100, badges: 1 },
  { uid: 'user-009', displayName: 'Garden Guru', avatar: '🌻', points: 480, areaClaimed: 1600, badges: 1 },
  { uid: 'user-010', displayName: 'Leaf Lover', avatar: '🍃', points: 340, areaClaimed: 1100, badges: 1 },
  { uid: 'user-011', displayName: 'Sprout Star', avatar: '🌱', points: 210, areaClaimed: 700, badges: 0 },
];

const INITIAL_REPORTS = [
  { id: 'r1', type: 'litter', description: 'Plastic bottles near pond', lat: 28.6180, lng: 77.2470, photo: null, userId: 'user-002', userName: 'Green Walker', timestamp: Date.now() - 3600000, status: 'pending' },
  { id: 'r2', type: 'broken_bench', description: 'Bench broken near gate', lat: 28.6172, lng: 77.2458, photo: null, userId: 'user-003', userName: 'Nature Scout', timestamp: Date.now() - 7200000, status: 'in_progress' },
  { id: 'r3', type: 'unsafe_lighting', description: 'No lights near amphitheatre', lat: 28.6190, lng: 77.2485, photo: null, userId: 'user-004', userName: 'Park Ranger', timestamp: Date.now() - 14400000, status: 'pending' },
  { id: 'r4', type: 'dry_tree', description: 'Large tree looks dead', lat: 28.6185, lng: 77.2492, photo: null, userId: 'user-005', userName: 'Eco Warrior', timestamp: Date.now() - 86400000, status: 'resolved' },
];

const BADGES = [
  { id: 'guardian', name: 'Guardian of the Grove', nameHi: 'वन का संरक्षक', icon: '🛡️', desc: 'Claim 5000 m² territory', requirement: { type: 'area', value: 5000 } },
  { id: 'scout', name: 'Safety Scout', nameHi: 'सुरक्षा स्काउट', icon: '🔍', desc: 'Rate 20 zones for safety', requirement: { type: 'safety', value: 20 } },
  { id: 'reporter', name: 'Issue Spotter', nameHi: 'समस्या खोजक', icon: '📋', desc: 'Report 10 issues', requirement: { type: 'reports', value: 10 } },
  { id: 'cool', name: 'Cool Contributor', nameHi: 'कूल योगदानकर्ता', icon: '❄️', desc: 'Log 5 microclimate readings', requirement: { type: 'microclimate', value: 5 } },
  { id: 'eco_hero', name: 'Eco Hero', nameHi: 'इको हीरो', icon: '🦸', desc: 'Complete 20 eco actions', requirement: { type: 'eco_actions', value: 20 } },
  { id: 'marathoner', name: 'Park Marathoner', nameHi: 'पार्क मैराथनर', icon: '🏃', desc: 'Spend 5 hours in the park', requirement: { type: 'time', value: 300 } },
  { id: 'social', name: 'Social Butterfly', nameHi: 'सामाजिक तितली', icon: '🦋', desc: 'Share territory 5 times', requirement: { type: 'shares', value: 5 } },
  { id: 'green_thumb', name: 'Green Thumb', nameHi: 'हरा अंगूठा', icon: '👍', desc: 'Water 10 plants', requirement: { type: 'water_plant', value: 10 } },
];

const DAILY_CHALLENGES = [
  { id: 'dc1', title: 'Claim 500m² of territory', titleHi: '500m² क्षेत्र दावा करें', icon: '🗺️', target: 500, type: 'area', reward: 100 },
  { id: 'dc2', title: 'Report 2 issues', titleHi: '2 समस्याएं रिपोर्ट करें', icon: '📋', target: 2, type: 'reports', reward: 75 },
  { id: 'dc3', title: 'Complete 3 eco actions', titleHi: '3 इको कार्रवाइयाँ पूरी करें', icon: '🌱', target: 3, type: 'eco_actions', reward: 80 },
  { id: 'dc4', title: 'Close 2 territory loops', titleHi: '2 क्षेत्र लूप बंद करें', icon: '🔁', target: 2, type: 'loops', reward: 120 },
  { id: 'dc5', title: 'Spend 30 min in park', titleHi: 'पार्क में 30 मिन बिताएं', icon: '⏱️', target: 30, type: 'time', reward: 60 },
];

// ─── Provider ────────────────────────────────────────────────

export function GameProvider({ children }) {
  const [park] = useState(parkData);

  // Territories: array of { id, polygon: [[lat,lng],...], owners: [...], area_m2 }
  const [territories, setTerritories] = useState(() => {
    const saved = localStorage.getItem('eco_territories');
    if (saved) try { return JSON.parse(saved); } catch { }
    return INITIAL_TERRITORIES;
  });

  // Current walking trail (not yet closed into a loop)
  const [currentPath, setCurrentPath] = useState([]);

  // Safety ratings keyed by a rough grid id
  const [safetyRatings, setSafetyRatings] = useState(() => {
    const saved = localStorage.getItem('eco_safety');
    if (saved) try { return JSON.parse(saved); } catch { }
    return {};
  });

  const [userStats, setUserStats] = useState(() => {
    const saved = localStorage.getItem('eco_stats');
    if (saved) try { return JSON.parse(saved); } catch { }
    return {
      points: 320,
      areaClaimed: 1200,
      loopsCompleted: 2,
      reportsFiled: 1,
      ecoActions: 3,
      safetyRatings: 2,
      timeInPark: 45,
      visitCount: 3,
      badges: ['eco_hero'],
      challengeProgress: { area: 300, reports: 0, eco_actions: 1, loops: 0, time: 12 },
    };
  });

  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('eco_reports');
    if (saved) try { return JSON.parse(saved); } catch { }
    return INITIAL_REPORTS;
  });

  const [ecoActions, setEcoActions] = useState(() => {
    const saved = localStorage.getItem('eco_eco_actions');
    if (saved) try { return JSON.parse(saved); } catch { }
    return [];
  });

  const [leaderboard] = useState(INITIAL_LEADERBOARD);
  const [isInsidePark, setIsInsidePark] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [toast, setToast] = useState(null);
  const [sessionStart, setSessionStart] = useState(null);

  // Persist
  useEffect(() => { localStorage.setItem('eco_territories', JSON.stringify(territories)); }, [territories]);
  useEffect(() => { localStorage.setItem('eco_stats', JSON.stringify(userStats)); }, [userStats]);
  useEffect(() => { localStorage.setItem('eco_reports', JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem('eco_eco_actions', JSON.stringify(ecoActions)); }, [ecoActions]);
  useEffect(() => { localStorage.setItem('eco_safety', JSON.stringify(safetyRatings)); }, [safetyRatings]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── Add a point to the current walking path ───────────────
  const addPathPoint = useCallback((lat, lng, user) => {
    setCurrentPath(prev => {
      const newPath = [...prev, [lat, lng]];

      // Check for loop closure
      const loop = detectLoop(newPath, [lat, lng], 20, 8);
      if (loop) {
        // Loop closed! Create a territory
        const simplified = simplifyPath(loop.loopCoords, 3);
        const area = polygonAreaM2(simplified);
        const points = Math.round(area / 100); // 1 point per 100m²

        const newTerritory = {
          id: 'terr-' + Date.now(),
          polygon: simplified,
          owners: [{
            userId: user.uid,
            displayName: user.displayName,
            claimedAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          }],
          area_m2: Math.round(area),
        };

        // Check for co-ownership with overlapping territories
        setTerritories(prevTerr => {
          const now = Date.now();
          const updated = prevTerr.map(t => {
            // Remove expired owners
            const activeOwners = t.owners.filter(o => o.expiresAt > now);
            if (activeOwners.length === 0) return null; // expired territory
            // Check overlap
            if (polygonsOverlap(simplified, t.polygon)) {
              // Add current user as co-owner if not already
              if (!activeOwners.some(o => o.userId === user.uid)) {
                return {
                  ...t,
                  owners: [...activeOwners, {
                    userId: user.uid,
                    displayName: user.displayName,
                    claimedAt: Date.now(),
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                  }]
                };
              }
              return { ...t, owners: activeOwners };
            }
            return { ...t, owners: activeOwners };
          }).filter(Boolean);

          return [...updated, newTerritory];
        });

        setUserStats(prev => ({
          ...prev,
          areaClaimed: prev.areaClaimed + Math.round(area),
          loopsCompleted: prev.loopsCompleted + 1,
          points: prev.points + points,
          challengeProgress: {
            ...prev.challengeProgress,
            area: (prev.challengeProgress.area || 0) + Math.round(area),
            loops: (prev.challengeProgress.loops || 0) + 1,
          }
        }));

        showToast(`🔁 Loop closed! +${points} pts (${Math.round(area)}m²)`, 'success');

        // Reset path after the loop start index
        return newPath.slice(loop.startIndex + newPath.length - loop.loopCoords.length);
      }

      return newPath;
    });
  }, [showToast]);

  // Clear the current path
  const clearPath = useCallback(() => setCurrentPath([]), []);

  // ─── Reports ───────────────────────────────────────────────
  const addReport = useCallback((report, user) => {
    const newReport = {
      id: 'r-' + Date.now(),
      ...report,
      userId: user.uid,
      userName: user.displayName,
      timestamp: Date.now(),
      status: 'pending',
    };
    setReports(prev => [newReport, ...prev]);
    setUserStats(prev => ({
      ...prev,
      reportsFiled: prev.reportsFiled + 1,
      points: prev.points + 50,
      challengeProgress: {
        ...prev.challengeProgress,
        reports: (prev.challengeProgress.reports || 0) + 1,
      }
    }));
    showToast('+50 points for reporting!', 'success');
    return newReport;
  }, [showToast]);

  // ─── Eco Actions ───────────────────────────────────────────
  const addEcoAction = useCallback((action, user) => {
    const POINTS = { water_plant: 30, pick_litter: 40, plant_sapling: 100, clean_bench: 25, wildlife_spot: 20 };
    const newAction = {
      id: 'ea-' + Date.now(),
      ...action,
      userId: user.uid,
      userName: user.displayName,
      timestamp: Date.now(),
      status: 'pending',
      points: POINTS[action.type] || 20,
    };
    setEcoActions(prev => [newAction, ...prev]);
    setUserStats(prev => ({
      ...prev,
      ecoActions: prev.ecoActions + 1,
      points: prev.points + newAction.points,
      challengeProgress: {
        ...prev.challengeProgress,
        eco_actions: (prev.challengeProgress.eco_actions || 0) + 1,
      }
    }));
    showToast(`+${newAction.points} points for eco action!`, 'success');
    return newAction;
  }, [showToast]);

  // ─── Safety ────────────────────────────────────────────────
  const rateSafety = useCallback((lat, lng, rating) => {
    // Use a rough grid key for aggregation
    const key = `${(lat * 1000).toFixed(0)}_${(lng * 1000).toFixed(0)}`;
    setSafetyRatings(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { rating, timestamp: Date.now() }]
    }));
    setUserStats(prev => ({
      ...prev,
      safetyRatings: prev.safetyRatings + 1,
      points: prev.points + 5,
    }));
    showToast('+5 points for safety rating!', 'success');
  }, [showToast]);

  // ─── Geofence ──────────────────────────────────────────────
  const checkInsidePark = useCallback((lat, lng) => {
    const coords = park.boundary.geometry.coordinates[0];
    return isPointInPolygon([lng, lat], coords);
  }, [park]);

  // ─── Rankings ──────────────────────────────────────────────
  const getUserRank = useCallback((userId) => {
    const allPlayers = [...leaderboard, {
      uid: userId,
      points: userStats.points,
      areaClaimed: userStats.areaClaimed,
    }].sort((a, b) => b.points - a.points);
    return allPlayers.findIndex(p => p.uid === userId) + 1;
  }, [leaderboard, userStats]);

  // Get territory ownership status for coloring
  const getTerritoryStatus = useCallback((territory, userId) => {
    const now = Date.now();
    const active = territory.owners.filter(o => o.expiresAt > now);
    if (active.length === 0) return 'expired';
    if (active.length === 1 && active[0].userId === userId) return 'owned';
    if (active.some(o => o.userId === userId)) return 'co-owned';
    return 'other';
  }, []);

  // Update report status (admin)
  const updateReportStatus = useCallback((reportId, status) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  }, []);

  return (
    <GameContext.Provider value={{
      park, territories, currentPath, safetyRatings,
      userStats, reports, ecoActions, leaderboard,
      isInsidePark, userPosition, toast, sessionStart,
      badges: BADGES, dailyChallenges: DAILY_CHALLENGES,
      setIsInsidePark, setUserPosition, setSessionStart,
      addPathPoint, clearPath,
      addReport, addEcoAction, rateSafety,
      checkInsidePark, getUserRank, getTerritoryStatus,
      showToast, updateReportStatus,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
