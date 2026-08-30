import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { kataQuestions, kumiteQuestions } from '../data/questions';
import KaratecaMascot from '../components/KaratecaMascot';
import ProgressBar from '../components/ProgressBar';

// =========================================================================
// MODO MANTENIMIENTO / OFFLINE
// =========================================================================
// Set to `true` to show the maintenance/offline card in production.
// Set to `false` to put the app back online instantly!
export const MAINTENANCE_MODE = true;
// =========================================================================

export default function Home() {
  const [gameState, setGameState] = useState('welcome'); // welcome, quiz, results
  const [modality, setModality] = useState('kata'); // kata or kumite
  const [questionLimit, setQuestionLimit] = useState(10);
  const [orderMode, setOrderMode] = useState('random'); // 'random' (aleatorio) or 'asc' (orden ascendente)
  const [jumpIdInput, setJumpIdInput] = useState('');
  const [jumpError, setJumpError] = useState('');

  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // true, false, null
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [mascotState, setMascotState] = useState('idle'); // idle, thinking, success, failure, rei
  const [shakeActive, setShakeActive] = useState(false);

  const currentPool = modality === 'kata' ? kataQuestions : kumiteQuestions;

  // Set initial mascot state on welcome screen
  useEffect(() => {
    if (gameState === 'welcome') {
      setMascotState('idle');
    }
  }, [gameState]);

  // Shuffle helper (Durstenfeld Shuffle)
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const startQuiz = (limit = questionLimit, targetId = null, selectedOrder = orderMode) => {
    const pool = modality === 'kata' ? kataQuestions : kumiteQuestions;
    let orderedPool = [...pool];

    const effectiveOrder = targetId !== null ? 'asc' : selectedOrder;
    if (targetId !== null) {
      setOrderMode('asc');
    }

    if (effectiveOrder === 'asc') {
      orderedPool.sort((a, b) => a.id - b.id);
    } else {
      orderedPool = shuffleArray(orderedPool);
    }

    let selected = limit === 'all' ? orderedPool : orderedPool.slice(0, Math.min(limit, orderedPool.length));

    let startIndex = 0;
    if (targetId !== null) {
      const foundIdx = orderedPool.findIndex(q => q.id === targetId);
      if (foundIdx !== -1) {
        selected = orderedPool;
        startIndex = foundIdx;
      }
    }

    setActiveQuestions(selected);
    setCurrentQuestionIndex(startIndex);
    setScore(0);
    setUserAnswers([]);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setGameState('quiz');
    setMascotState('thinking');
    setJumpError('');
  };

  const handleJumpToId = (idToFind) => {
    const pool = modality === 'kata' ? kataQuestions : kumiteQuestions;
    const num = parseInt(idToFind, 10);

    if (isNaN(num) || num <= 0) {
      setJumpError('Por favor ingresa un número de ID válido.');
      return false;
    }

    const targetQuestion = pool.find(q => q.id === num);
    if (!targetQuestion) {
      setJumpError(`⚠️ No existe la pregunta #${num} en ${modality.toUpperCase()} (rango disponible: 1 a ${pool.length}).`);
      return false;
    }

    setJumpError('');
    setOrderMode('asc');

    if (gameState === 'quiz') {
      const sortedPool = [...pool].sort((a, b) => a.id - b.id);
      const foundIdx = sortedPool.findIndex(q => q.id === num);
      if (foundIdx !== -1) {
        setActiveQuestions(sortedPool);
        setCurrentQuestionIndex(foundIdx);
        setSelectedAnswer(null);
        setIsSubmitted(false);
        setMascotState('thinking');
      }
    } else {
      startQuiz('all', num, 'asc');
    }
    return true;
  };

  const handleJumpFormSubmit = (e) => {
    e.preventDefault();
    if (!jumpIdInput) return;
    handleJumpToId(jumpIdInput);
  };

  const handleAnswerSelect = (answer) => {
    if (isSubmitted) return;
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null || isSubmitted) return;

    const currentQuestion = activeQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.answer;

    if (isCorrect) {
      setScore(prev => prev + 1);
      setMascotState('success');
    } else {
      setMascotState('failure');
      setShakeActive(true);
      // Remove shake class after animation finishes
      setTimeout(() => setShakeActive(false), 500);
    }

    setUserAnswers(prev => [
      ...prev,
      {
        questionId: currentQuestion.id,
        text: currentQuestion.text,
        text_en: currentQuestion.text_en,
        userAnswer: selectedAnswer,
        correctAnswer: currentQuestion.answer,
        isCorrect,
        justification: currentQuestion.justification,
        ref: currentQuestion.ref,
        section: currentQuestion.section
      }
    ]);

    setIsSubmitted(true);
  };

  const nextQuestion = () => {
    const isLast = currentQuestionIndex === activeQuestions.length - 1;
    
    if (isLast) {
      setGameState('results');
      const ratio = (score + (selectedAnswer === activeQuestions[currentQuestionIndex].answer ? 1 : 0)) / activeQuestions.length;
      setMascotState(ratio >= 0.8 ? 'success' : 'idle');
    } else {
      setSelectedAnswer(null);
      setIsSubmitted(false);
      setCurrentQuestionIndex(prev => prev + 1);
      setMascotState('thinking');
    }
  };

  const exitQuiz = () => {
    if (window.confirm('¿Seguro que quieres salir de la práctica? Perderás tu progreso actual.')) {
      setGameState('welcome');
    }
  };

  const restartGame = () => {
    setGameState('welcome');
  };

  const currentQuestion = activeQuestions[currentQuestionIndex];
  const isSelectedCorrect = isSubmitted && selectedAnswer === currentQuestion?.answer;

  return (
    <div className="app-container">
      <Head>
        <title>Examen Entrenador WKF 2026 - {MAINTENANCE_MODE ? 'Próximamente' : `Práctica de ${modality === 'kata' ? 'Kata' : 'Kumite'}`}</title>
        <meta name="description" content="Practica con el banco de preguntas oficial de la WKF 2026. ¡Aprende con animaciones y justificaciones en español!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header bar only if in Quiz Mode and not in maintenance mode */}
      {!MAINTENANCE_MODE && gameState === 'quiz' && (
        <ProgressBar 
          current={currentQuestionIndex + (isSubmitted ? 1 : 0)} 
          total={activeQuestions.length} 
          onExit={exitQuiz}
          onJumpToId={handleJumpToId}
          maxId={currentPool.length}
        />
      )}

      <main className="main-content">
        {/* ================= PANTALLA DE MANTENIMIENTO / OFFLINE ================= */}
        {MAINTENANCE_MODE ? (
          <div className="maintenance-card">
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '10px' }}>
              <KaratecaMascot state="rei" modality="kumite" />
            </div>

            <h1 className="maintenance-title">¡Volveremos pronto!</h1>

            <div className="maintenance-box">
              <p className="maintenance-message">
                "Volveremos pronto, gracias por toda la ayuda probando esta aplicación. Fue de grandísima ayuda, y ayudas a que el karate en CR crezca."
              </p>
              <div className="maintenance-flag-row">
                <span>🇨🇷</span> Sensei Chibi & Árbitro WKF <span>🥋</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ================= PANTALLA DE BIENVENIDA ================= */}
            {gameState === 'welcome' && (
              <div className="welcome-card">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <KaratecaMascot state={mascotState} modality={modality} />
            </div>
            
            <h1 className="welcome-title">Examen de Entrenador WKF 2026</h1>
            <p className="welcome-subtitle">
              Practica de forma divertida, interactiva y dinámica. Nuestro Sensei Chibi te guiará en cada pregunta del reglamento oficial.
            </p>

            <div className="options-container">
              <h2 className="options-title">Elige la modalidad:</h2>
              <div className="modality-selector">
                <button
                  type="button"
                  className={`modality-option ${modality === 'kata' ? 'selected' : ''}`}
                  onClick={() => {
                    setModality('kata');
                    setJumpError('');
                  }}
                >
                  <span className="modality-icon">🥋</span>
                  <span>KATA</span>
                </button>
                <button
                  type="button"
                  className={`modality-option ${modality === 'kumite' ? 'selected' : ''}`}
                  onClick={() => {
                    setModality('kumite');
                    setJumpError('');
                  }}
                >
                  <span className="modality-icon">🥊</span>
                  <span>KUMITE</span>
                </button>
              </div>

              <h2 className="options-title">Orden de las preguntas:</h2>
              <div className="order-selector">
                <button
                  type="button"
                  className={`order-option ${orderMode === 'random' ? 'selected' : ''}`}
                  onClick={() => setOrderMode('random')}
                >
                  <span className="order-icon">🔀</span>
                  <span>Aleatorio</span>
                </button>
                <button
                  type="button"
                  className={`order-option ${orderMode === 'asc' ? 'selected' : ''}`}
                  onClick={() => setOrderMode('asc')}
                >
                  <span className="order-icon">🔢</span>
                  <span>Ascendente</span>
                </button>
              </div>

              <h2 className="options-title">Elige la cantidad de preguntas:</h2>
              <div className="quantity-selector">
                {[10, 25, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`quantity-option ${questionLimit === num ? 'selected' : ''}`}
                    onClick={() => setQuestionLimit(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  style={{ gridColumn: '1 / -1' }}
                  className={`quantity-option ${questionLimit === 'all' ? 'selected' : ''}`}
                  onClick={() => setQuestionLimit('all')}
                >
                  Todas ({currentPool.length} preguntas)
                </button>
              </div>

              <button
                type="button"
                className="btn-3d btn-green"
                onClick={() => startQuiz(questionLimit)}
              >
                ¡Comenzar práctica!
              </button>

              {/* Direct Jump to Specific Question ID Box */}
              <div className="jump-id-card">
                <h3 className="jump-id-title">
                  🎯 Ir directamente a una pregunta por ID <span style={{ color: 'var(--color-blue)', fontWeight: 800 }}>({modality === 'kata' ? '🥋 KATA' : '🥊 KUMITE'})</span>:
                </h3>
                <form onSubmit={handleJumpFormSubmit} className="jump-id-form">
                  <div className="jump-id-input-group">
                    <span className="jump-id-hashtag">#</span>
                    <input
                      type="number"
                      min="1"
                      max={currentPool.length}
                      placeholder={`ID (1 - ${currentPool.length})`}
                      value={jumpIdInput}
                      onChange={(e) => {
                        setJumpIdInput(e.target.value);
                        setJumpError('');
                      }}
                      className="jump-id-input"
                    />
                  </div>
                  <button type="submit" className="btn-3d btn-blue jump-id-submit-btn">
                    Ir a pregunta
                  </button>
                </form>
                {jumpError && <div className="jump-id-error-msg">{jumpError}</div>}
              </div>
            </div>
          </div>
        )}

        {/* ================= PANTALLA DE QUIZ ================= */}
        {gameState === 'quiz' && currentQuestion && (
          <div className={`quiz-section ${shakeActive ? 'shake' : ''}`}>
            
            {/* Mascot speech bubble */}
            <div className="bubble-container">
              <div style={{ flexShrink: 0 }}>
                <KaratecaMascot state={mascotState} modality={modality} />
              </div>
              <div className="bubble-content">
                <span className="question-badge">
                  {modality === 'kata' ? '🥋 KATA' : '🥊 KUMITE'} • {currentQuestion.section.split(':')[0]}
                </span>
                <p className="question-text"><span className="flag-icon">🇪🇸</span> {currentQuestion.id}. {currentQuestion.text}</p>
                {currentQuestion.text_en && <p className="question-text-en"><span className="flag-icon">🇬🇧</span> {currentQuestion.id}. {currentQuestion.text_en}</p>}
              </div>
            </div>

            {/* Answer Options */}
            <div className="answer-choices">
              <button
                className={`btn-3d ${
                  selectedAnswer === true
                    ? 'btn-blue'
                    : 'btn-white'
                }`}
                style={{
                  opacity: isSubmitted && selectedAnswer !== true ? 0.6 : 1,
                  pointerEvents: isSubmitted ? 'none' : 'auto',
                  borderColor: isSubmitted && currentQuestion.answer === true ? 'var(--color-green)' : '',
                  borderWidth: isSubmitted && currentQuestion.answer === true ? '3px' : '2px',
                }}
                onClick={() => handleAnswerSelect(true)}
              >
                Verdadero
              </button>
              
              <button
                className={`btn-3d ${
                  selectedAnswer === false
                    ? 'btn-red'
                    : 'btn-white'
                }`}
                style={{
                  opacity: isSubmitted && selectedAnswer !== false ? 0.6 : 1,
                  pointerEvents: isSubmitted ? 'none' : 'auto',
                  borderColor: isSubmitted && currentQuestion.answer === false ? 'var(--color-green)' : '',
                  borderWidth: isSubmitted && currentQuestion.answer === false ? '3px' : '2px',
                }}
                onClick={() => handleAnswerSelect(false)}
              >
                Falso
              </button>
            </div>

            {/* If not submitted, show checking button at the bottom */}
            {!isSubmitted && (
              <button
                className={`btn-3d ${selectedAnswer !== null ? 'btn-green' : 'btn-white'}`}
                disabled={selectedAnswer === null}
                style={{
                  opacity: selectedAnswer === null ? 0.5 : 1,
                  cursor: selectedAnswer === null ? 'not-allowed' : 'pointer'
                }}
                onClick={submitAnswer}
              >
                Comprobar
              </button>
            )}
          </div>
        )}

        {/* ================= PANTALLA DE RESULTADOS ================= */}
        {gameState === 'results' && (
          <div className="results-card">
            <h1 className="welcome-title" style={{ marginTop: 0 }}>¡Práctica Finalizada!</h1>
            
            <div className="results-mascot-row">
              <KaratecaMascot state={mascotState} modality={modality} />
            </div>

            <div className="score-container">
              <span className="score-badge">
                {Math.round((score / activeQuestions.length) * 100)}%
              </span>
              <p style={{ color: 'var(--color-text-main)', fontWeight: 600, fontSize: '1.1rem' }}>
                {score >= activeQuestions.length * 0.8
                  ? '¡Excelente trabajo! Has aprobado la práctica.'
                  : 'Sigue estudiando el reglamento para aprobar el examen.'}
              </p>
            </div>

            <div className="score-stats">
              <div className="stat-item">
                <div className="stat-val good">{score}</div>
                <div className="stat-lbl">Correctas</div>
              </div>
              <div className="stat-item">
                <div className="stat-val bad">{activeQuestions.length - score}</div>
                <div className="stat-lbl">Incorrectas</div>
              </div>
            </div>

            {/* Review list */}
            <div className="review-section">
              <h2 className="review-title">Revisión de Preguntas</h2>
              <div className="review-list">
                {userAnswers.map((answer, index) => (
                  <div 
                    key={index} 
                    className={`review-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}
                  >
                    <div className="review-header-row">
                      <span className="review-q-num">Pregunta #{answer.questionId}</span>
                      <span className="review-badge">
                        {answer.isCorrect ? 'Correcta' : 'Incorrecta'}
                      </span>
                    </div>
                    <p className="review-q-text"><span className="flag-icon">🇪🇸</span> {answer.questionId}. {answer.text}</p>
                    {answer.text_en && <p className="review-q-text-en"><span className="flag-icon">🇬🇧</span> {answer.questionId}. {answer.text_en}</p>}
                    <div className="review-answers">
                      <strong>Tu respuesta:</strong> {answer.userAnswer ? 'Verdadero' : 'Falso'}{' '}
                      | <strong>Correcta:</strong> {answer.correctAnswer ? 'Verdadero' : 'Falso'}
                    </div>
                    <div className="review-justification">
                      <strong>Explicación:</strong> {answer.justification}
                      <span className="review-ref">{answer.ref}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="btn-3d btn-green"
              onClick={restartGame}
            >
              Volver a jugar
            </button>
          </div>
        )}
        </>
        )}
      </main>

      {/* Slide up feedback footer inside Quiz mode when answer is submitted */}
      {gameState === 'quiz' && isSubmitted && (
        <div className={`feedback-footer visible ${isSelectedCorrect ? 'correct' : 'incorrect'}`}>
          <div className="feedback-footer-inner">
            <div className="feedback-header">
              <div className="feedback-icon">
                {isSelectedCorrect ? '✓' : '✕'}
              </div>
              <h3 className="feedback-title">
                {isSelectedCorrect ? '¡Excelente!' : 'Respuesta incorrecta'}
              </h3>
            </div>

            <div className="feedback-message">
              <div className="feedback-message-title">Explicación Oficial:</div>
              {currentQuestion.justification}
              <span className="feedback-ref">{currentQuestion.ref}</span>
            </div>

            <button
              className={`btn-3d ${isSelectedCorrect ? 'btn-green' : 'btn-red'}`}
              onClick={nextQuestion}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
