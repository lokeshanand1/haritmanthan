import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Canvas, useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { Environment, ContactShadows, OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { TreeModel, BenchModel, AirModel, PondModel, EnergyModel } from '../components/PodModels';

/* Smooth camera rig — follows pointer/touch for parallax AR feel */
function ParallaxRig() {
  useFrame((state) => {
    state.camera.position.x = MathUtils.lerp(state.camera.position.x, state.pointer.x * 1.5, 0.025);
    state.camera.position.y = MathUtils.lerp(state.camera.position.y, 1.5 + state.pointer.y * 1, 0.025);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function PodARView() {
  const { podId } = useParams();
  const navigate = useNavigate();
  const { pods, scanPod } = useGame();

  const [pod, setPod] = useState(null);
  const [stream, setStream] = useState(null);
  const [arMode, setArMode] = useState(false); // false = VR dark mode (better visuals), true = camera AR
  const videoRef = useRef(null);

  useEffect(() => {
    const curPod = pods.find(p => p.id === podId);
    if (!curPod) {
      navigate('/map');
      return;
    }
    setPod(curPod);
    scanPod(podId);

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn('Camera not available for AR background, using fallback', err);
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line
  }, [podId]);

  if (!pod) return null;

  const renderModel = () => {
    switch(pod.type) {
      case 'tree': return <TreeModel />;
      case 'bench': return <BenchModel />;
      case 'air': return <AirModel />;
      case 'pond': return <PondModel />;
      case 'energy': return <EnergyModel />;
      default: return <TreeModel />;
    }
  };

  const renderLabels = () => {
    if (pod.type === 'tree') {
      return (
        <>
          <div className="ar-label-item"><span>CO₂ absorbed:</span> <strong>{pod.currentCO2Absorbed} kg</strong></div>
          <div className="ar-label-item"><span>Equiv. phone charges:</span> <strong>~350</strong></div>
        </>
      );
    }
    if (pod.type === 'bench') {
      return (
        <>
          <div className="ar-label-item"><span>Bench surface temp:</span> <strong>{pod.currentTemp}°C</strong></div>
          <div className="ar-label-item"><span>Surrounding temp:</span> <strong>38°C</strong></div>
          <div className="ar-label-item"><span>Cooling effect:</span> <strong>-10°C</strong></div>
        </>
      );
    }
    if (pod.type === 'pond') {
      return (
        <>
          <div className="ar-label-item"><span>Water Temperature:</span> <strong>{pod.currentTemp}°C</strong></div>
          <div className="ar-label-item"><span>Biodiversity index:</span> <strong>{pod.biodiversity}/10</strong></div>
        </>
      );
    }
    if (pod.type === 'air') {
      return (
        <>
          <div className="ar-label-item"><span>PM2.5 Level:</span> <strong>{pod.currentPM25} µg/m³</strong></div>
          <div className="ar-label-item"><span>Local Air Quality:</span> <strong>Moderate</strong></div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="fullscreen-view">
      {/* Background: either camera feed (dimmed) or dark gradient */}
      {arMode && stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1
            }}
          />
          {/* Dim overlay so bloom glows pop against camera */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 2
          }} />
        </>
      ) : (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at 50% 50%, #111827 0%, #0a0f1a 50%, #020617 100%)',
          zIndex: 1
        }} />
      )}

      {/* Header */}
      <div className="ar-header">
        <button className="ar-close-btn" onClick={() => navigate('/map')}>✕</button>
        <span className="ar-title">{pod.type.toUpperCase()} POD ({pod.id})</span>
        <button
          className="ar-close-btn"
          onClick={() => setArMode(!arMode)}
          title={arMode ? 'Switch to VR mode' : 'Switch to AR camera'}
        >
          {arMode ? '🌙' : '📸'}
        </button>
      </div>

      {/* 3D Canvas with Post-Processing */}
      <div className="ar-canvas-container" style={{ zIndex: 10 }}>
        <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, toneMapping: 0 }}>
          <color attach="background" args={[arMode ? 'transparent' : '#050a15']} />

          {/* Lighting */}
          <ambientLight intensity={0.15} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
          <pointLight position={[-3, 4, -3]} intensity={0.8} color="#10b981" />
          <pointLight position={[3, 2, 3]} intensity={0.5} color="#3b82f6" />
          <spotLight position={[0, 6, 0]} angle={0.5} penumbra={1} intensity={0.6} color="#ffffff" />
          <Environment preset="night" />

          {/* Background stars when no camera */}
          {!stream && <Stars radius={50} depth={50} count={2000} factor={3} saturation={0.5} speed={1} />}

          {/* Parallax camera rig */}
          <ParallaxRig />

          {/* The 3D model */}
          <group position={[0, 0, 0]}>
            {renderModel()}
          </group>

          {/* Ground shadow */}
          <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={12} blur={3} far={6} color="#000000" />

          {/* OrbitControls for drag interaction */}
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            autoRotate
            autoRotateSpeed={1}
            minDistance={2}
            maxDistance={8}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
          />

          {/* Bloom glow + Slight chromatic aberration for cinematic feel */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.4}
              luminanceSmoothing={0.6}
              intensity={0.8}
              mipmapBlur
            />
            <ChromaticAberration offset={[0.0003, 0.0003]} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Info Overlay */}
      <div className="ar-overlay">
        <div className="ar-labels">
          <div className="ar-label-item" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            <span>Total Scans:</span> <strong>{pod.totalScans}</strong>
          </div>
          {renderLabels()}
        </div>

        <div className="ar-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/report')} style={{ flex: 1 }}>
            Report Issue
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/map')} style={{ flex: 1 }}>
            Collect & Return
          </button>
        </div>
      </div>
    </div>
  );
}
