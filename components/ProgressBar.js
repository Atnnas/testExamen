import React from 'react';

export default function ProgressBar({ current, total, onExit }) {
  const percentage = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  
  return (
    <div className="progress-bar-container">
      {onExit && (
        <button className="progress-bar-exit-btn" onClick={onExit} aria-label="Salir">
          ✕
        </button>
      )}
      
      <div className="progress-bar-wrapper">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        >
          <div className="progress-bar-shine" />
        </div>
      </div>
      
      <span className="progress-bar-text">
        {current} / {total}
      </span>
    </div>
  );
}
