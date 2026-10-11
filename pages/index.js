import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { kataQuestions, kumiteQuestions, refereeQuestions } from '../data/questions';
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
  const [timerEnabled, setTimerEnabled] = useState(false); // false = Sin límite, true = 30s Contrarreloj
  const [timeLeft, setTimeLeft] = useState(30);
  const [timeoutToast, setTimeoutToast] = useState('');

  // Referencias mutables para evitar cierres obsoletos (stale closures) dentro del temporizador
  const selectedAnswerRef = useRef(selectedAnswer);
  selectedAnswerRef.current = selectedAnswer;

  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  currentQuestionIndexRef.current = currentQuestionIndex;

  const activeQuestionsRef = useRef(activeQuestions);
  activeQuestionsRef.current = activeQuestions;

  const userAnswersRef = useRef(userAnswers);
  userAnswersRef.current = userAnswers;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const timerEnabledRef = useRef(timerEnabled);
  timerEnabledRef.current = timerEnabled;

  const currentPool = selectedRole === 'referee'
    ? refereeQuestions
    : (modality === 'kata' ? kataQuestions : modality === 'kumite' ? kumiteQuestions : refereeQuestions);

  // Manejo de expiración de tiempo (30 segundos por pregunta)
  const handleTimeExpired = () => {
    const questions = activeQuestionsRef.current;
    const currIdx = currentQuestionIndexRef.current;
    const currentQ = questions[currIdx];
    if (!currentQ) return;

    const chosenAnswer = selectedAnswerRef.current;
    const hasChosen = chosenAnswer !== null;
    const isCorrect = hasChosen ? chosenAnswer === currentQ.answer : false;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    const newAnswerItem = {
      questionId: currentQ.id,
      text: currentQ.text,
      text_en: currentQ.text_en,
      userAnswer: chosenAnswer,
      correctAnswer: currentQ.answer,
      isCorrect,
      justification: currentQ.justification,
      ref: currentQ.ref,
      section: currentQ.section,
    };

    const updatedAnswers = [...userAnswersRef.current, newAnswerItem];
    setUserAnswers(updatedAnswers);

    const isLast = currIdx === questions.length - 1;

    if (isLast) {
      setGameState('results');
      const totalQ = questions.length;
      const correctCount = updatedAnswers.filter((a) => a.isCorrect).length;
      const correctPct = Math.round((correctCount / totalQ) * 100);
      const incorrectPct = Math.max(0, 100 - correctPct);
      const isPassed = correctPct >= 80;

      setMascotState(isPassed ? 'success' : 'idle');

      fetch('/api/exams/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole || 'coach',
          modality: selectedRole === 'referee' || modality === 'reglamento' ? 'arbitro' : modality,
          totalQuestions: totalQ,
          orderMode,
          timerMode: '30s',
          userAnswers: updatedAnswers,
          finalScore: correctCount,
          percentage: correctPct,
          correctPercentage: correctPct,
          incorrectPercentage: incorrectPct,
          passed: isPassed,
          isFinished: true,
        }),
      }).catch((err) => console.error('Error al guardar nota final en base de datos:', err));
    } else {
      setTimeoutToast('⏱️ ¡Tiempo agotado (30s)! Pregunta registrada automáticamente.');
      setTimeout(() => setTimeoutToast(''), 2500);
      setSelectedAnswer(null);
      setIsSubmitted(false);
      setTimeLeft(30);
      setCurrentQuestionIndex((prev) => prev + 1);
      setMascotState('thinking');
    }
  };

  // Efecto del temporizador de 30 segundos
  useEffect(() => {
    if (!timerEnabled || gameState !== 'quiz' || isSubmitted) return;

    setTimeLeft(30);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, currentQuestionIndex, isSubmitted, timerEnabled]);

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
    const pool = selectedRole === 'referee'
      ? refereeQuestions
      : (modality === 'kata' ? kataQuestions : modality === 'kumite' ? kumiteQuestions : refereeQuestions);
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
    setTimeLeft(30);
    setTimeoutToast('');
    setGameState('quiz');
    setMascotState('thinking');
    setJumpError('');
  };

  const handleJumpToId = (idToFind) => {
    const pool = selectedRole === 'referee'
      ? refereeQuestions
      : (modality === 'kata' ? kataQuestions : modality === 'kumite' ? kumiteQuestions : refereeQuestions);
    const num = parseInt(idToFind, 10);

    if (isNaN(num) || num <= 0) {
      setJumpError('Por favor ingresa un número de ID válido.');
      return false;
    }

    const targetQuestion = pool.find(q => q.id === num);
    if (!targetQuestion) {
      const label = selectedRole === 'referee' || modality === 'reglamento' ? 'ÁRBITRO' : modality.toUpperCase();
      setJumpError(`⚠️ No existe la pregunta #${num} en ${label} (rango disponible: 1 a ${pool.length}).`);
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
        setTimeLeft(30);
        setTimeoutToast('');
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
  };

  const nextQuestion = () => {
    const isLast = currentQuestionIndex === activeQuestions.length - 1;
    
    if (isLast) {
      setGameState('results');
      const totalQ = activeQuestions.length;
      const allAnswers = userAnswers;
      const correctCount = allAnswers.filter((a) => a.isCorrect).length;
      const incorrectCount = totalQ - correctCount;
      const correctPct = Math.round((correctCount / totalQ) * 100);
      const incorrectPct = Math.max(0, 100 - correctPct);
      const isPassed = correctPct >= 80;

      setMascotState(isPassed ? 'success' : 'idle');

      // Guardar una única línea por intento de examen completado en MongoDB
      fetch('/api/exams/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole || 'coach',
          modality: selectedRole === 'referee' || modality === 'reglamento' ? 'arbitro' : modality,
          totalQuestions: totalQ,
          orderMode,
          timerMode: timerEnabled ? '30s' : 'off',
          userAnswers: allAnswers,
          finalScore: correctCount,
          percentage: correctPct,
          correctPercentage: correctPct,
          incorrectPercentage: incorrectPct,
          passed: isPassed,
          isFinished: true,
        }),
      }).catch((err) => console.error('Error al guardar nota final en base de datos:', err));
    } else {
      setSelectedAnswer(null);
      setIsSubmitted(false);
      setTimeLeft(30);
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
            : selectedRole === 'referee' || modality === 'reglamento'
            ? 'Examen de Árbitro WKF 2026 - Práctica Oficial'
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
      {!MAINTENANCE_MODE && (selectedRole === 'coach' || selectedRole === 'referee') && gameState === 'quiz' && (
        <ProgressBar 
          current={currentQuestionIndex + (isSubmitted ? 1 : 0)} 
          total={activeQuestions.length} 
          onExit={exitQuiz}
          onJumpToId={handleJumpToId}
          maxId={currentPool.length}
          timerEnabled={timerEnabled}
          timeLeft={timeLeft}
          isSubmitted={isSubmitted}
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
                  Banco completo de 235 preguntas oficiales para Entrenadores WKF en Kata (115) y Kumite (120), con práctica interactiva y explicaciones oficiales.
                </p>
                <span className="role-action-label role-action-coach">
                  Ingresar a examen ➔
                </span>
              </button>

              {/* Tarjeta: Examen de Árbitro */}
              <button
                type="button"
                className="role-card-btn referee-role"
                onClick={() => {
                  if (!session) {
                    signIn('google');
                    return;
                  }
                  setSelectedRole('referee');
                  setGameState('welcome');
                  setMascotState('idle');
                }}
              >
                <span className="role-badge role-badge-active">Disponible • Oficial 2026</span>
                <div className="role-icon-box">⚖️</div>
                <h2 className="role-title">Examen de Árbitro</h2>
                <p className="role-description">
                  Banco completo de 246 preguntas oficiales para Árbitros y Jueces WKF, con artículos reglamentarios y justificaciones oficiales.
                </p>
                <span className="role-action-label role-action-referee">
                  Ingresar a examen ➔
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
        ) : (
          /* ================= FLUJO DE EXAMEN: COACH Y ÁRBITRO ================= */
          <>
            {/* ================= PANTALLA DE BIENVENIDA ================= */}
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
                  {selectedRole === 'referee' || modality === 'reglamento' ? (
                    <RefereeMascot state={mascotState} />
                  ) : (
                    <KaratecaMascot state={mascotState} modality={modality} />
                  )}
                </div>
                
                <h1 className="welcome-title">
                  {selectedRole === 'referee'
                    ? 'Examen Oficial de Árbitro WKF 2026'
                    : 'Examen de Entrenador (Coach) WKF 2026'}
                </h1>
                <p className="welcome-subtitle">
                  {selectedRole === 'referee'
                    ? 'Banco oficial de 246 preguntas del Reglamento de Arbitraje WKF 2026. Nuestro Sensei Árbitro te evaluará con casos reales y referencias a cada artículo oficial.'
                    : 'Practica de forma divertida, interactiva y dinámica. Nuestro Sensei Chibi te guiará en cada pregunta del reglamento oficial.'}
                </p>

                <div className="options-container">
                  {selectedRole === 'referee' ? (
                    <div className="modality-referee-info-box">
                      <div className="modality-referee-info-title">
                        <span>⚖️</span> Banco Oficial de Arbitraje WKF (246 Preguntas)
                      </div>
                      <p className="modality-referee-info-desc">
                        Evaluación integral de 6 secciones del reglamento: Artículos 1 al 15, Video Review y Apéndices con referencias normativas WKF 2026.01.
                      </p>
                    </div>
                  ) : (
                    <>
                      <h2 className="options-title">Elige la modalidad de examen:</h2>
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
                          <span>KATA (115)</span>
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
                          <span>KUMITE (120)</span>
                        </button>
                        <button
                          type="button"
                          className={`modality-option ${modality === 'reglamento' ? 'selected' : ''}`}
                          onClick={() => {
                            setModality('reglamento');
                            setJumpError('');
                          }}
                        >
                          <span className="modality-icon">⚖️</span>
                          <span>ÁRBITROS (246)</span>
                        </button>
                      </div>
                    </>
                  )}

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

                  <h2 className="options-title">⏱️ Temporizador por pregunta:</h2>
                  <div className="order-selector">
                    <button
                      type="button"
                      className={`order-option ${!timerEnabled ? 'selected' : ''}`}
                      onClick={() => setTimerEnabled(false)}
                    >
                      <span className="order-icon">⏳</span>
                      <span>Sin límite (A tu ritmo)</span>
                    </button>
                    <button
                      type="button"
                      className={`order-option ${timerEnabled ? 'selected' : ''}`}
                      onClick={() => setTimerEnabled(true)}
                    >
                      <span className="order-icon">⚡</span>
                      <span>30s Contrarreloj (Simulador)</span>
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
                      🎯 Ir directamente a una pregunta por ID <span style={{ color: 'var(--color-blue)', fontWeight: 800 }}>({selectedRole === 'referee' || modality === 'reglamento' ? '⚖️ ÁRBITRO WKF' : modality === 'kata' ? '🥋 KATA' : '🥊 KUMITE'})</span>:
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
                
                {/* Temporizador barra animada de 30 segundos */}
                {timerEnabled && (
                  <div className="question-timer-bar-wrapper">
                    <div
                      className={`question-timer-bar-fill ${
                        timeLeft <= 5 ? 'urgent' : timeLeft <= 10 ? 'warning' : ''
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (timeLeft / 30) * 100))}%` }}
                    />
                  </div>
                )}

                {/* Aviso visual cuando la pregunta anterior pasó por tiempo agotado */}
                {timeoutToast && (
                  <div className="timeout-toast-banner">
                    {timeoutToast}
                  </div>
                )}

                {/* Mascot speech bubble */}
                <div className="bubble-container">
                  <div style={{ flexShrink: 0 }}>
                    {selectedRole === 'referee' || modality === 'reglamento' ? (
                      <RefereeMascot state={mascotState} />
                    ) : (
                      <KaratecaMascot state={mascotState} modality={modality} />
                    )}
                  </div>
                  <div className="bubble-content">
                    <span className="question-badge">
                      {selectedRole === 'referee' || modality === 'reglamento'
                        ? `⚖️ ÁRBITRO WKF • ${currentQuestion.section}`
                        : `${modality === 'kata' ? '🥋 KATA' : '🥊 KUMITE'} • ${currentQuestion.section.split(':')[0]}`}
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
                  {selectedRole === 'referee' || modality === 'reglamento' ? (
                    <RefereeMascot state={mascotState} />
                  ) : (
                    <KaratecaMascot state={mascotState} modality={modality} />
                  )}
                </div>

                <div className="score-container">
                  <span className="score-badge">
                    {Math.round((score / activeQuestions.length) * 100)}%
                  </span>
                  {timerEnabled && (
                    <span className="timer-badge-active">⚡ Modo Contrarreloj (30s)</span>
                  )}
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
                        key={answer.questionId || index} 
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
                          <strong>Tu respuesta:</strong>{' '}
                          {answer.userAnswer === null || answer.userAnswer === undefined ? (
                            <span style={{ color: '#dc2626', fontWeight: 800 }}>⏱️ No respondida (Tiempo agotado)</span>
                          ) : answer.userAnswer ? (
                            'Verdadero'
                          ) : (
                            'Falso'
                          )}{' '}
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
                    type="button"
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
