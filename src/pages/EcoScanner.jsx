import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useGame } from '../context/GameContext';
import { useLang } from '../context/LanguageContext';

export default function EcoScanner() {
  const navigate = useNavigate();
  const { isInsidePark, showToast, pods } = useGame();
  const { t } = useLang();
  const [error, setError] = useState(null);

  // Parse QR text, which might be a URL (https://app/pod/T001) or simple JSON ({"id":"T001"}) or just "T001"
  const handleScan = (detectedCodes) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const text = detectedCodes[0].rawValue;
    
    // We already found a code, process it once
    let podId = null;

    try {
      // Is it JSON?
      if (text.startsWith('{')) {
        const data = JSON.parse(text);
        if (data.id) podId = data.id;
      }
      // Is it a URL?
      else if (text.includes('/pod/')) {
        const parts = text.split('/pod/');
        if (parts.length > 1) {
          podId = parts[1].replace('/', '');
        }
      }
      // Or just a raw ID like T001
      else {
        podId = text.trim();
      }
    } catch (e) {
      console.warn("Scan parse error", e);
    }

    if (podId && pods.some(p => p.id === podId)) {
      navigate(`/pod/${podId}`, { replace: true });
    } else {
      showToast('Invalid Pod QR Code', 'error');
    }
  };

  const handleError = (error) => {
    console.warn(error);
    setError(error?.message || "Failed to start camera");
  };

  if (!isInsidePark) {
    return (
      <div className="fullscreen-view" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
        <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌳</span>
        <h2 style={{ color: 'white', marginBottom: '1rem' }}>Outside Park</h2>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          You must be physically inside the park geofence to scan Eco Pods.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/map')}>
          Back to Map
        </button>
      </div>
    );
  }

  return (
    <div className="fullscreen-view">
      <div className="ar-header">
        <button className="ar-close-btn" onClick={() => navigate('/map')}>✕</button>
        <span className="ar-title">Scan Eco Pod</span>
        <div style={{ width: 40 }} /> {/* balance flex */}
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {error ? (
          <div style={{ padding: '2rem', color: '#f87171', textAlign: 'center', marginTop: '50%' }}>
            <p>Camera Error: {error}</p>
          </div>
        ) : (
          <Scanner 
            onScan={handleScan}
            onError={handleError}
            formats={['qr_code']}
            components={{ tracker: false, audio: false }}
            styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
          />
        )}
        
        {/* Viewfinder overlay */}
        <div className="scanner-viewfinder">
          <div className="scanner-scanline"></div>
          <div className="scanner-hint">Align QR code within box</div>
        </div>
      </div>

      <div className="ar-overlay">
        <button className="btn btn-primary" onClick={() => navigate('/pod/T001')}>
          Simulate Demo Scan (Tree)
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/pod/B001')} style={{ marginTop: '0.5rem' }}>
          Simulate Demo Scan (Bench)
        </button>
      </div>
    </div>
  );
}
