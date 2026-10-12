import React, { useState } from 'react';

function ProgressBar({
  current,
  total,
  onExit,
  onJumpToId,
  maxId,
  timerEnabled = false,
  timeLeft = 30,
  isSubmitted = false,
}) {
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
        <button type="button" className="progress-bar-exit-btn" onClick={onExit} aria-label="Salir" title="Salir de la práctica">
          ✕
        </button>
      )}
      
      <div
        className="progress-bar-wrapper"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Progreso del examen: pregunta ${current} de ${total}`}
      >
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

      {timerEnabled && (
        <div
          className={`quiz-timer-pill ${timeLeft <= 5 ? 'urgent' : timeLeft <= 10 ? 'warning' : ''}`}
          title="Tiempo restante para responder esta pregunta"
          aria-label={`Tiempo restante: ${timeLeft} segundos`}
        >
          <span className="quiz-timer-icon" aria-hidden="true">⏱️</span>
          <span className="quiz-timer-seconds">
            {isSubmitted ? 'Pausado' : `${timeLeft}s`}
          </span>
        </div>
      )}

      {onJumpToId && (
        <form onSubmit={handleJumpSubmit} className="quiz-header-jump-form">
          <span className="quiz-header-jump-label" aria-hidden="true">Ir a #</span>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            spellCheck={false}
            min="1"
            max={maxId}
            value={jumpInput}
            onChange={(e) => {
              setJumpInput(e.target.value);
              setHasError(false);
            }}
            placeholder="ID"
            aria-label={`Ir a pregunta por ID del 1 al ${maxId || ''}`}
            className={`quiz-header-jump-input ${hasError ? 'error' : ''}`}
            title={`Ingresa el ID de la pregunta (1 - ${maxId || ''})`}
          />
          <button type="submit" className="quiz-header-jump-btn" aria-label="Ir a la pregunta" title="Ir a la pregunta">
            ➔
          </button>
        </form>
      )}
    </div>
  );
}

export default React.memo(ProgressBar);


