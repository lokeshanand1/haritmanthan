import { useEffect, useMemo, useRef, useState } from 'react';

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

export default function VerificationModal({
  open,
  onClose,
  quest,
  userPosition,
  onSubmitSuccess,
  onSubmitFail,
}) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [starting, setStarting] = useState(false);

  const within50m = useMemo(() => {
    if (!quest?.location || !userPosition) return false;
    const d = distanceMetres([quest.location.lat, quest.location.lng], userPosition);
    return d <= 50;
  }, [quest, userPosition]);

  useEffect(() => {
    if (!open) return;
    setPhotoDataUrl(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [open, stream]);

  const startCamera = async () => {
    setStarting(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch {
      // Camera might be blocked; we’ll allow file upload fallback via input below.
    } finally {
      setStarting(false);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.85));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  if (!open || !quest) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal glass">
        <div className="modal-header">
          <h3>Verification Bounty</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-row">
            <div><strong>Reward</strong>: {quest.rewardPoints} pts</div>
            <div><strong>Status</strong>: {quest.status}</div>
          </div>
          <div className="modal-row">
            <div><strong>Distance gate</strong>: {within50m ? '✅ within 50m' : '⛔ move within 50m to verify'}</div>
          </div>

          {!photoDataUrl && (
            <div className="verify-cam">
              <div className="verify-actions">
                <button className="btn btn-primary" onClick={startCamera} disabled={starting}>
                  {starting ? 'Starting…' : 'Open Camera'}
                </button>
                <button className="btn btn-secondary" onClick={capture} disabled={!stream}>
                  Capture
                </button>
              </div>
              <video ref={videoRef} className="verify-video" playsInline muted />
              <div className="verify-upload">
                <label className="btn btn-ghost btn-sm" htmlFor="verify-upload">Or upload photo</label>
                <input id="verify-upload" type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
              </div>
            </div>
          )}

          {photoDataUrl && (
            <div className="verify-preview">
              <img src={photoDataUrl} alt="Verification" />
              <div className="verify-actions">
                <button className="btn btn-ghost" onClick={() => setPhotoDataUrl(null)}>Retake</button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button
            className="btn btn-secondary"
            onClick={() => onSubmitFail({ questId: quest.questId, reportId: quest.reportId })}
          >
            Not Fixed
          </button>
          <button
            className="btn btn-primary"
            disabled={!within50m || !photoDataUrl}
            onClick={() => onSubmitSuccess({ questId: quest.questId, reportId: quest.reportId, photoDataUrl })}
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}

