import React, { useState } from 'react';

export default function ProgressBar({ current, total, onExit, onJumpToId, maxId }) {
  const [jumpInput, setJumpInput] = useState('');
  const [hasError, setHasError] = useState(false);

  const percentage = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    if (!jumpInput || !onJumpToId) return;
    const success = onJumpToId(jumpInput);
    if (!success) {
      setHasError(true);
      setTimeout(() => setHasError(false), 2000);
    } else {
      setJumpInput('');
      setHasError(false);
    }
  };
  
  return (
    <div className="progress-bar-container">
      {onExit && (
        <button className="progress-bar-exit-btn" onClick={onExit} aria-label="Salir" title="Salir de la práctica">
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

      {onJumpToId && (
        <form onSubmit={handleJumpSubmit} className="quiz-header-jump-form">
          <span className="quiz-header-jump-label">Ir a #</span>
          <input
            type="number"
            min="1"
            max={maxId}
            value={jumpInput}
            onChange={(e) => {
              setJumpInput(e.target.value);
              setHasError(false);
            }}
            placeholder="ID"
            className={`quiz-header-jump-input ${hasError ? 'error' : ''}`}
            title={`Ingresa el ID de la pregunta (1 - ${maxId || ''})`}
          />
          <button type="submit" className="quiz-header-jump-btn" title="Ir a la pregunta">
            ➔
          </button>
        </form>
      )}
    </div>
  );
}

