import './Toast.css';

export default function Toast({ message, type = 'success' }) {
  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      <span className="toast-icon">
        {type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌'}
      </span>
      {message}
    </div>
  );
}
