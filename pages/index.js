import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { kataQuestions, kumiteQuestions } from '../data/questions';
import KaratecaMascot from '../components/KaratecaMascot';
import RefereeMascot from '../components/RefereeMascot';
import ProgressBar from '../components/ProgressBar';
import UserAuthBar from '../components/UserAuthBar';

// =========================================================================
// MODO MANTENIMIENTO / OFFLINE
// =========================================================================
// Set to `true` to show the maintenance/offline card in production.
// Set to `false` to put the app back online instantly!
const MAINTENANCE_MODE = false;
// =========================================================================

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [selectedRole, setSelectedRole] = useState(null); // null (selección de examen), 'coach', 'referee'
  const [gameState, setGameState] = useState('welcome'); // welcome, quiz, results

  const isSuperAdmin = session?.user?.email?.toLowerCase() === 'david.artavia.rodriguez@gmail.com';
  const isAdmin = isSuperAdmin || session?.user?.role === 'admin';
  const isApproved = isAdmin || session?.user?.status === 'aprobado';
  const isPending = session && !isAdmin && session?.user?.status === 'pendiente';
  const isBlocked = session && !isAdmin && session?.user?.status === 'bloqueado';
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
  const [currentAttemptId, setCurrentAttemptId] = useState(null);
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
    setCurrentAttemptId(null);
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

    const newAnswerItem = {
      questionId: currentQuestion.id,
      text: currentQuestion.text,
      text_en: currentQuestion.text_en,
      userAnswer: selectedAnswer,
      correctAnswer: currentQuestion.answer,
      isCorrect,
      justification: currentQuestion.justification,
      ref: currentQuestion.ref,
      section: currentQuestion.section,
    };

    setUserAnswers(prev => [...prev, newAnswerItem]);
    setIsSubmitted(true);

    // Registrar en MongoDB en tiempo real
    fetch('/api/exams/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: currentAttemptId,
        role: selectedRole || 'coach',
        modality,
        totalQuestions: activeQuestions.length,
        orderMode,
        answer: newAnswerItem,
        isFinished: false,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.attemptId && !currentAttemptId) {
          setCurrentAttemptId(data.attemptId);
        }
      })
      .catch((err) => console.error('Error al registrar respuesta en base de datos:', err));
  };

  const nextQuestion = () => {
    const isLast = currentQuestionIndex === activeQuestions.length - 1;
    
    if (isLast) {
      setGameState('results');
      const finalScore = score + (selectedAnswer === activeQuestions[currentQuestionIndex].answer ? 1 : 0);
      const ratio = finalScore / activeQuestions.length;
      setMascotState(ratio >= 0.8 ? 'success' : 'idle');

      // Finalizar intento en MongoDB con nota y calificación obtenida
      fetch('/api/exams/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: currentAttemptId,
          role: selectedRole || 'coach',
          modality,
          totalQuestions: activeQuestions.length,
          orderMode,
          finalScore,
          percentage: Math.round(ratio * 100),
          passed: ratio >= 0.8,
          isFinished: true,
        }),
      }).catch((err) => console.error('Error al guardar nota final en base de datos:', err));
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
        <title>
          {MAINTENANCE_MODE
            ? 'Examen WKF 2026 - Próximamente'
            : selectedRole === null
            ? 'Exámenes Oficiales WKF 2026 - Portal de Estudio'
            : selectedRole === 'referee'
            ? 'Examen de Árbitro WKF 2026 - En Construcción'
            : `Examen Entrenador WKF 2026 - Práctica de ${modality === 'kata' ? 'Kata' : 'Kumite'}`}
        </title>
        <meta name="description" content="Practica con el banco de preguntas oficial de la WKF 2026. ¡Aprende con animaciones y justificaciones en español!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Barra de perfil y autenticación con Google */}
      {!MAINTENANCE_MODE && gameState !== 'quiz' && (
        <div className="auth-bar-wrapper">
          <UserAuthBar />
        </div>
      )}

      {/* Header bar only if in Quiz Mode and not in maintenance mode */}
      {!MAINTENANCE_MODE && selectedRole === 'coach' && gameState === 'quiz' && (
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
              <KaratecaMascot state="bye" modality="kumite" />
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
        ) : isPending ? (
          /* ================= PANTALLA: CUENTA PENDIENTE DE APROBACIÓN ================= */
          <div className="pending-card">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <KaratecaMascot state="thinking" modality="kata" />
            </div>

            <span className="pending-badge">⏳ Acceso Pendiente de Aprobación</span>

            <h1 className="pending-title">¡Hola, {session?.user?.name || 'Sensei'}!</h1>
            <p className="pending-subtitle">
              Tu cuenta de Google (<strong>{session?.user?.email}</strong>) ha sido registrada exitosamente con rol de <strong>Visitante</strong>.
            </p>

            <div className="pending-info-box">
              <div className="pending-info-item">
                <span className="pending-info-icon">🛡️</span>
                <div>
                  <strong>Activación requerida por el Administrador:</strong>
                  <p>Para proteger el banco oficial de preguntas WKF 2026, un administrador debe activar tu cuenta para que puedas acceder a la práctica.</p>
                </div>
              </div>
              <div className="pending-info-item">
                <span className="pending-info-icon">👤</span>
                <div>
                  <strong>Administrador del Sistema:</strong>
                  <p>La solicitud será revisada por <code>david.artavia.rodriguez@gmail.com</code>.</p>
                </div>
              </div>
            </div>

            <div className="pending-actions">
              <button
                type="button"
                className="btn-3d btn-green"
                onClick={() => window.location.reload()}
              >
                🔄 Comprobar si ya fue activada
              </button>
              <button
                type="button"
                className="btn-3d btn-white"
                onClick={() => signOut()}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : isBlocked ? (
          /* ================= PANTALLA: CUENTA SUSPENDIDA ================= */
          <div className="pending-card">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <KaratecaMascot state="failure" modality="kumite" />
            </div>
            <span className="pending-badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' }}>
              ✕ Acceso Suspendido
            </span>
            <h1 className="pending-title">Acceso Temporalmente Bloqueado</h1>
            <p className="pending-subtitle">
              El administrador ha pausado el acceso para la cuenta <strong>{session?.user?.email}</strong>.
            </p>
            <div style={{ marginTop: '20px' }}>
              <button type="button" className="btn-3d btn-white" onClick={() => signOut()}>
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : selectedRole === null ? (
          /* ================= PORTAL PRINCIPAL: SELECCIÓN DE EXAMEN ================= */
          <div className="portal-card">
            <div className="portal-mascots-duo">
              <KaratecaMascot state="idle" modality="kata" />
              <RefereeMascot state="idle" size="small" />
            </div>

            <h1 className="portal-title">Exámenes Oficiales WKF 2026</h1>
            <p className="portal-subtitle">
              Elige el examen oficial que deseas practicar según tu rol federativo:
            </p>

            {/* Si no ha iniciado sesión con Google, mostrar aviso en el portal */}
            {!session && (
              <div className="portal-login-prompt-box">
                <div className="login-prompt-title">🔐 Inicia sesión para guardar tu progreso</div>
                <p className="login-prompt-desc">
                  Conéctate con tu cuenta de Google. Tu cuenta quedará registrada y lista para ser activada por el administrador.
                </p>
                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="google-signin-btn-large"
                >
                  <svg className="google-icon" viewBox="0 0 24 24" width="22" height="22">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continuar con Google</span>
                </button>
              </div>
            )}

            <div className="roles-grid">
              {/* Tarjeta: Examen de Coach */}
              <button
                type="button"
                className="role-card-btn coach-role"
                onClick={() => {
                  if (!session) {
                    signIn('google');
                    return;
                  }
                  setSelectedRole('coach');
                }}
              >
                <span className="role-badge role-badge-active">Disponible • Oficial 2026</span>
                <div className="role-icon-box">🥋</div>
                <h2 className="role-title">Examen de Coach</h2>
                <p className="role-description">
                  Banco completo de 230 preguntas para Entrenadores WKF en Kata y Kumite, con práctica interactiva y explicaciones oficiales.
                </p>
                <span className="role-action-label role-action-coach">
                  Ingresar a examen ➔
                </span>
              </button>

              {/* Tarjeta: Examen de Árbitro */}
              <button
                type="button"
                className="role-card-btn referee-role"
                onClick={() => setSelectedRole('referee')}
              >
                <span className="role-badge role-badge-construction">🚧 En Construcción</span>
                <div className="role-icon-box">⚖️</div>
                <h2 className="role-title">Examen de Árbitro</h2>
                <p className="role-description">
                  Reglamento de arbitraje para Jueces y Árbitros WKF. Criterios de señalización, banderas y faltas reglamentarias.
                </p>
                <span className="role-action-label role-action-referee">
                  Ver detalles (Próximamente) ➔
                </span>
              </button>
            </div>

            {/* Acceso directo al panel para el Administrador */}
            {isAdmin && (
              <div className="portal-admin-shortcut">
                <Link href="/admin" className="btn-admin-shortcut">
                  🛡️ Panel de Administración (Gestionar y Activar Usuarios) ➔
                </Link>
              </div>
            )}
          </div>
        ) : selectedRole === 'referee' ? (
          /* ================= EXAMEN DE ÁRBITRO: EN CONSTRUCCIÓN ================= */
          <div className="construction-card">
            <button
              type="button"
              className="back-nav-btn"
              onClick={() => setSelectedRole(null)}
            >
              ← Volver al menú de exámenes
            </button>

            <RefereeMascot state="idle" />

            <div style={{ marginTop: '12px' }}>
              <span className="construction-badge">
                <span>🚧</span> Módulo en Construcción
              </span>
            </div>

            <h1 className="construction-title">Examen de Árbitro WKF 2026</h1>
            <p className="construction-subtitle">
              Estamos preparando el banco oficial de preguntas y casos de estudio para <strong>Árbitros y Jueces WKF</strong>.
            </p>

            <div className="construction-features-box">
              <div className="construction-features-title">
                <span>📋</span> Próximamente disponible en este módulo:
              </div>
              <ul className="construction-features-list">
                <li>
                  <span>⚖️</span>
                  <span><strong>Cuestionario oficial WKF:</strong> Evaluación teórica para Árbitros y Jueces de Kata y Kumite.</span>
                </li>
                <li>
                  <span>🚩</span>
                  <span><strong>Mecánica de arbitraje y banderas:</strong> Gestos oficiales de señalización (Aka / Ao) y mandos de voz.</span>
                </li>
                <li>
                  <span>⚠️</span>
                  <span><strong>Faltas y penalizaciones:</strong> Clasificación y aplicaciones de faltas Categoría 1 y 2.</span>
                </li>
                <li>
                  <span>🥋</span>
                  <span><strong>Criterios de evaluación Kata:</strong> Rendimiento técnico y atlético según las normas 2026.</span>
                </li>
              </ul>
            </div>

            <div className="construction-actions">
              <button
                type="button"
                className="btn-3d btn-green"
                onClick={() => setSelectedRole('coach')}
              >
                🥋 Ir al Examen de Coach (Disponible)
              </button>
              <button
                type="button"
                className="btn-3d btn-white"
                onClick={() => setSelectedRole(null)}
              >
                Volver a la selección
              </button>
            </div>
          </div>
        ) : (
          /* ================= FLUJO DE EXAMEN DE COACH ================= */
          <>
            {/* ================= PANTALLA DE BIENVENIDA DE COACH ================= */}
            {gameState === 'welcome' && (
              <div className="welcome-card">
                <button
                  type="button"
                  className="back-nav-btn"
                  onClick={() => setSelectedRole(null)}
                  title="Volver a la selección de examen"
                >
                  ← Cambiar de examen
                </button>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <KaratecaMascot state={mascotState} modality={modality} />
                </div>
                
                <h1 className="welcome-title">Examen de Entrenador (Coach) WKF 2026</h1>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button
                className="btn-3d btn-green"
                onClick={restartGame}
              >
                Volver a practicar
              </button>
              <button
                type="button"
                className="btn-3d btn-white"
                onClick={() => {
                  setGameState('welcome');
                  setSelectedRole(null);
                }}
              >
                ← Cambiar de examen
              </button>
            </div>
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
