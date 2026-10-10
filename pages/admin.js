import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import KaratecaMascot from '../components/KaratecaMascot';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'

  // Estados de Gestión de Usuarios
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Estados de Log de Respuestas y Exámenes
  const [examLogs, setExamLogs] = useState([]);
  const [rawExams, setRawExams] = useState([]);
  const [examSummary, setExamSummary] = useState({
    totalExams: 0,
    totalCompleted: 0,
    totalPassed: 0,
    passRate: 0,
    avgScore: 0,
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    totalIncorrectAnswers: 0,
    accuracy: 0,
  });
  const [logsLoading, setLogsLoading] = useState(false);
  const [logViewMode, setLogViewMode] = useState('questions'); // 'questions' or 'exams'
  const [logSearch, setLogSearch] = useState('');
  const [logModality, setLogModality] = useState('all');
  const [logAnswerStatus, setLogAnswerStatus] = useState('all');
  const [selectedExamModal, setSelectedExamModal] = useState(null);

  const isAdmin =
    session?.user?.role === 'admin' ||
    session?.user?.email?.toLowerCase() === 'david.artavia.rodriguez@gmail.com';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        showToast('Error: ' + (data.error || 'No se pudieron cargar los usuarios'));
      }
    } catch (err) {
      showToast('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchExamLogs = async () => {
    try {
      setLogsLoading(true);
      const query = new URLSearchParams({
        search: logSearch,
        modality: logModality,
        answerStatus: logAnswerStatus,
      }).toString();

      const res = await fetch(`/api/admin/exam-logs?${query}`);
      const data = await res.json();
      if (data.success) {
        setExamLogs(data.questionLogs || []);
        setRawExams(data.exams || []);
        setExamSummary(data.summary || {});
      } else {
        showToast('Error: ' + (data.error || 'No se pudieron cargar los logs'));
      }
    } catch (err) {
      showToast('Error de conexión al cargar el log');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'logs') {
        fetchExamLogs();
      }
    }
  }, [status, isAdmin, activeTab, logModality, logAnswerStatus]);

  // Manejo de búsqueda en logs con debounce simple
  useEffect(() => {
    if (activeTab !== 'logs' || !isAdmin) return;
    const timeout = setTimeout(() => {
      fetchExamLogs();
    }, 300);
    return () => clearTimeout(timeout);
  }, [logSearch]);

  // Accesibilidad: cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedExamModal(null);
      }
    };
    if (selectedExamModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedExamModal]);

  const handleUpdateUser = async (userId, newFields) => {
    try {
      setActionLoading(userId);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...newFields }),
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, ...data.user } : u))
        );
        showToast('✓ Usuario actualizado con éxito');
      } else {
        showToast('⚠️ ' + (data.error || 'Error al actualizar usuario'));
      }
    } catch (err) {
      showToast('Error de conexión al actualizar');
    } finally {
      setActionLoading(null);
    }
  };

  // Descarga y exportación a CSV
  const handleExportCsv = () => {
    if (!examLogs.length) {
      showToast('No hay datos disponibles para exportar con los filtros actuales');
      return;
    }

    const headers = [
      'Fecha',
      'Nombre Alumno',
      'Correo',
      'Modalidad',
      'ID Pregunta',
      'Pregunta',
      'Respuesta Alumno',
      'Resultado',
      'Respuesta Correcta',
      'Nota Examen (%)',
      'Aciertos Examen',
      'Total Preguntas Examen',
      'Estado Examen',
    ];

    const rows = examLogs.map((log) => [
      `"${new Date(log.date).toLocaleString('es-ES')}"`,
      `"${log.userName || ''}"`,
      `"${log.userEmail || ''}"`,
      `"${log.modality?.toUpperCase() || ''}"`,
      `"${log.questionId || ''}"`,
      `"${(log.questionText || '').replace(/"/g, '""')}"`,
      `"${log.userAnswer ? 'Verdadero' : 'Falso'}"`,
      `"${log.isCorrect ? 'Correcta' : 'Errónea'}"`,
      `"${log.correctAnswer ? 'Verdadero' : 'Falso'}"`,
      `"${log.examPercentage || 0}%"`,
      `"${log.examScore || 0}"`,
      `"${log.examTotal || 0}"`,
      `"${log.examPassed ? 'Aprobado' : 'Reprobado'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `log_respuestas_wkf_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Archivo CSV descargado con éxito');
  };

  // Eliminar un intento de examen específico
  const handleDeleteExam = async (examId, userName) => {
    if (
      !window.confirm(
        `¿Eliminar permanentemente el intento de examen de "${userName || 'este usuario'}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/exam-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Intento de examen eliminado');
        if (selectedExamModal?._id === examId) {
          setSelectedExamModal(null);
        }
        fetchExamLogs();
      } else {
        showToast('⚠️ Error: ' + (data.error || 'No se pudo eliminar el examen'));
      }
    } catch (err) {
      showToast('Error de conexión al eliminar');
    }
  };

  // Vaciar completamente el log de exámenes y respuestas
  const handleClearAllLogs = async () => {
    if (
      !window.confirm(
        '⚠️ ATENCIÓN: ¿Estás seguro de que deseas eliminar TODOS los registros de exámenes y respuestas de la base de datos? Esta acción es irreversible.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/exam-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAll: true }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Todos los registros de exámenes han sido eliminados');
        setSelectedExamModal(null);
        fetchExamLogs();
      } else {
        showToast('⚠️ Error: ' + (data.error || 'No se pudo vaciar el log'));
      }
    } catch (err) {
      showToast('Error de conexión al vaciar el log');
    }
  };

  if (status === 'loading') {
    return (
      <div className="admin-loading-screen">
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="app-container">
        <Head>
          <title>Acceso Restringido - Examen WKF</title>
        </Head>
        <main className="main-content">
          <div className="welcome-card" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <KaratecaMascot state="failure" modality="kumite" />
            </div>
            <h1 className="welcome-title" style={{ color: 'var(--color-red)' }}>
              Acceso Restringido
            </h1>
            <p className="welcome-subtitle">
              Este módulo es exclusivo para el administrador del sistema (<strong>david.artavia.rodriguez@gmail.com</strong>).
            </p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <Link href="/">
                <button type="button" className="btn-3d btn-blue">
                  Volver al inicio
                </button>
              </Link>
              {session && (
                <button type="button" onClick={() => signOut()} className="btn-3d btn-white">
                  Cerrar sesión
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Filtrado de usuarios
  const filteredUsers = users.filter((u) => {
    const matchesFilter = filterStatus === 'all' || u.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = users.filter((u) => u.status === 'pendiente').length;
  const approvedCount = users.filter((u) => u.status === 'aprobado').length;

  // Filtrado reactivo de exámenes para vista por intento
  const filteredExams = rawExams.filter((ex) => {
    const matchesModality = logModality === 'all' || ex.modality === logModality;
    const query = logSearch.toLowerCase().trim();
    if (!query) return matchesModality;
    return (
      matchesModality &&
      (ex.userName?.toLowerCase().includes(query) ||
        ex.userEmail?.toLowerCase().includes(query))
    );
  });

  return (
    <div className="admin-page-container">
      <Head>
        <title>Panel de Administración - Examen WKF 2026</title>
      </Head>

      {/* Header superior */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-header-left">
            <Link href="/" className="admin-back-btn">
              ← Volver a la App
            </Link>
            <h1 className="admin-title">Panel de Administración</h1>
            <span className="admin-badge-super">Super Admin</span>
          </div>

          <div className="admin-user-pill">
            {session.user.image && (
              <img src={session.user.image} alt={session.user.name} className="admin-avatar" />
            )}
            <span>{session.user.email}</span>
            <button type="button" onClick={() => signOut()} className="admin-logout-btn">
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Pestañas Principales */}
      <div className="admin-nav-tabs-wrapper">
        <div className="admin-nav-tabs">
          <button
            type="button"
            className={`admin-nav-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Gestión de Usuarios
            {pendingCount > 0 && <span className="tab-counter-badge">{pendingCount}</span>}
          </button>
          <button
            type="button"
            className={`admin-nav-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            📊 Log de Respuestas y Exámenes
          </button>
        </div>
      </div>

      <main className="admin-content">
        {/* Toast Notificación */}
        {toastMessage && <div className="admin-toast">{toastMessage}</div>}

        {/* ========================================================================= */}
        {/* TAB 1: GESTIÓN DE USUARIOS                                               */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <>
            {/* Tarjetas de Métricas */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <span className="admin-stat-num">{users.length}</span>
                <span className="admin-stat-label">Usuarios Totales</span>
              </div>
              <div className="admin-stat-card" style={{ borderColor: 'var(--color-green-border)' }}>
                <span className="admin-stat-num" style={{ color: 'var(--color-green-text)' }}>
                  {approvedCount}
                </span>
                <span className="admin-stat-label">Cuentas Aprobadas</span>
              </div>
              <div
                className={`admin-stat-card ${pendingCount > 0 ? 'admin-stat-alert' : ''}`}
                style={{ borderColor: pendingCount > 0 ? 'var(--color-yellow-border)' : 'var(--color-border)' }}
              >
                <span className="admin-stat-num" style={{ color: '#b45309' }}>
                  {pendingCount}
                </span>
                <span className="admin-stat-label">Pendientes por Aprobar</span>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="admin-toolbar">
              <div className="admin-search-box">
                <input
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
              </div>

              <div className="admin-filters-group">
                <button
                  type="button"
                  className={`admin-filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  Todos ({users.length})
                </button>
                <button
                  type="button"
                  className={`admin-filter-pill ${filterStatus === 'pendiente' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('pendiente')}
                >
                  ⏳ Pendientes ({pendingCount})
                </button>
                <button
                  type="button"
                  className={`admin-filter-pill ${filterStatus === 'aprobado' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('aprobado')}
                >
                  ✓ Aprobados ({approvedCount})
                </button>
                <button
                  type="button"
                  className={`admin-filter-pill ${filterStatus === 'bloqueado' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('bloqueado')}
                >
                  ✕ Bloqueados
                </button>
              </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="admin-table-card">
              {loading ? (
                <div className="admin-loading-box">
                  <p>Cargando lista de usuarios de MongoDB...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="admin-empty-box">
                  <p>No se encontraron usuarios con los filtros seleccionados.</p>
                </div>
              ) : (
                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Correo</th>
                        <th>Rol en el Sistema</th>
                        <th>Estado de Acceso</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isSuper = u.email?.toLowerCase() === 'david.artavia.rodriguez@gmail.com';
                        const isBusy = actionLoading === u._id;

                        return (
                          <tr key={u._id} className={`user-row status-${u.status}`}>
                            <td>
                              <div className="user-profile-cell">
                                {u.image ? (
                                  <img src={u.image} alt={u.name} className="user-table-avatar" />
                                ) : (
                                  <div className="user-table-avatar-placeholder">
                                    {(u.name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="user-table-names">
                                  <span className="user-table-name">{u.name}</span>
                                  {isSuper && <span className="super-admin-tag">👑 Admin Principal</span>}
                                </div>
                              </div>
                            </td>

                            <td className="user-email-cell">{u.email}</td>

                            <td>
                              {isSuper ? (
                                <span className="badge-role role-admin">Administrador</span>
                              ) : (
                                <select
                                  value={u.role}
                                  disabled={isBusy}
                                  onChange={(e) => handleUpdateUser(u._id, { role: e.target.value })}
                                  className="admin-select"
                                >
                                  <option value="visitante">Visitante</option>
                                  <option value="editor">Editor</option>
                                  <option value="admin">Administrador</option>
                                </select>
                              )}
                            </td>

                            <td>
                              <span className={`badge-status status-${u.status}`}>
                                {u.status === 'aprobado'
                                  ? '✓ Aprobado'
                                  : u.status === 'pendiente'
                                  ? '⏳ Pendiente'
                                  : '✕ Bloqueado'}
                              </span>
                            </td>

                            <td>
                              {isSuper ? (
                                <span className="admin-protected-text">Protegido</span>
                              ) : (
                                <div className="user-actions-group">
                                  {u.status === 'pendiente' && (
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleUpdateUser(u._id, { status: 'aprobado' })}
                                      className="btn-action btn-action-approve"
                                      title="Aprobar acceso a la app"
                                    >
                                      ✓ Aprobar
                                    </button>
                                  )}

                                  {u.status === 'aprobado' && (
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleUpdateUser(u._id, { status: 'bloqueado' })}
                                      className="btn-action btn-action-block"
                                      title="Suspender acceso"
                                    >
                                      Bloquear
                                    </button>
                                  )}

                                  {u.status === 'bloqueado' && (
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleUpdateUser(u._id, { status: 'aprobado' })}
                                      className="btn-action btn-action-reactivate"
                                      title="Reactivar acceso"
                                    >
                                      Reactivar
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LOG DE RESPUESTAS Y EXÁMENES                                       */}
        {/* ========================================================================= */}
        {activeTab === 'logs' && (
          <>
            {/* Tarjetas de Métricas de Exámenes */}
            <div className="admin-stats-grid admin-stats-grid-5">
              <div className="admin-stat-card">
                <span className="admin-stat-num">{examSummary.totalQuestionsAnswered || 0}</span>
                <span className="admin-stat-label">Respuestas Totales</span>
              </div>
              <div className="admin-stat-card" style={{ borderColor: 'var(--color-green-border)' }}>
                <span className="admin-stat-num" style={{ color: 'var(--color-green-text)' }}>
                  {examSummary.accuracy || 0}%
                </span>
                <span className="admin-stat-label">
                  Aciertos ({examSummary.totalCorrectAnswers || 0} de {examSummary.totalQuestionsAnswered || 0})
                </span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-num">{examSummary.totalExams || 0}</span>
                <span className="admin-stat-label">Exámenes Iniciados</span>
              </div>
              <div className="admin-stat-card" style={{ borderColor: '#bfdbfe' }}>
                <span className="admin-stat-num" style={{ color: 'var(--color-blue)' }}>
                  {examSummary.passRate || 0}%
                </span>
                <span className="admin-stat-label">
                  Tasa de Aprobación ({examSummary.totalPassed || 0} ganados)
                </span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-num" style={{ color: '#7c3aed' }}>
                  {examSummary.avgScore || 0}%
                </span>
                <span className="admin-stat-label">Nota Promedio</span>
              </div>
            </div>

            {/* Barra de Filtros, Modo de Vista y Exportación */}
            <div className="admin-toolbar admin-toolbar-split">
              <div className="admin-search-box">
                <input
                  type="text"
                  placeholder="Buscar por alumno, correo, o ID (#42)..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>

              {/* Botones de acción derecha */}
              <div className="admin-actions-right">
                <button
                  type="button"
                  onClick={fetchExamLogs}
                  className="btn-action-refresh"
                  title="Recargar datos de MongoDB"
                >
                  🔄 Actualizar
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="btn-action-export"
                  title="Descargar registro completo en Excel/CSV"
                >
                  📥 Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={handleClearAllLogs}
                  className="btn-action-delete-all"
                  title="Borrar todo el historial de exámenes y respuestas de MongoDB"
                >
                  🗑️ Vaciar Todo el Log
                </button>
              </div>
            </div>

            <div className="admin-toolbar" style={{ marginTop: '0', paddingTop: '0' }}>
              <div className="admin-filters-group">
                <span className="filter-label">Modalidad:</span>
                <button
                  type="button"
                  className={`admin-filter-pill ${logModality === 'all' ? 'active' : ''}`}
                  onClick={() => setLogModality('all')}
                >
                  Todas
                </button>
                <button
                  type="button"
                  className={`admin-filter-pill ${logModality === 'kata' ? 'active' : ''}`}
                  onClick={() => setLogModality('kata')}
                >
                  🥋 Kata
                </button>
                <button
                  type="button"
                  className={`admin-filter-pill ${logModality === 'kumite' ? 'active' : ''}`}
                  onClick={() => setLogModality('kumite')}
                >
                  🥊 Kumite
                </button>
              </div>

              {logViewMode === 'questions' && (
                <div className="admin-filters-group">
                  <span className="filter-label">Resultado:</span>
                  <button
                    type="button"
                    className={`admin-filter-pill ${logAnswerStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setLogAnswerStatus('all')}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    className={`admin-filter-pill ${logAnswerStatus === 'correct' ? 'active' : ''}`}
                    onClick={() => setLogAnswerStatus('correct')}
                  >
                    ✅ Correctas
                  </button>
                  <button
                    type="button"
                    className={`admin-filter-pill ${logAnswerStatus === 'incorrect' ? 'active' : ''}`}
                    onClick={() => setLogAnswerStatus('incorrect')}
                  >
                    ❌ Erróneas
                  </button>
                </div>
              )}

              {/* Alternar entre vista por pregunta individual o intento completo */}
              <div className="admin-view-switcher">
                <button
                  type="button"
                  className={`switcher-btn ${logViewMode === 'questions' ? 'active' : ''}`}
                  onClick={() => setLogViewMode('questions')}
                >
                  📋 Por Pregunta ({examLogs.length})
                </button>
                <button
                  type="button"
                  className={`switcher-btn ${logViewMode === 'exams' ? 'active' : ''}`}
                  onClick={() => setLogViewMode('exams')}
                >
                  🎓 Por Examen ({rawExams.length})
                </button>
              </div>
            </div>

            {/* Contenido Principal de Logs */}
            <div className="admin-table-card">
              {logsLoading ? (
                <div className="admin-loading-box">
                  <p>Consultando base de datos MongoDB Atlas...</p>
                </div>
              ) : logViewMode === 'questions' ? (
                /* VISTA DETALLADA POR PREGUNTA INDIVIDUAL */
                examLogs.length === 0 ? (
                  <div className="admin-empty-box">
                    <p>No hay respuestas registradas aún que coincidan con la búsqueda.</p>
                  </div>
                ) : (
                  <div className="admin-table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Fecha y Hora</th>
                          <th>Alumno</th>
                          <th>Correo</th>
                          <th>Mod.</th>
                          <th>ID Pregunta</th>
                          <th>Pregunta WKF</th>
                          <th>Respuesta Alumno</th>
                          <th>Evaluación</th>
                          <th>Resp. Correcta</th>
                          <th>Nota Examen</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examLogs.map((log) => {
                          const dateObj = new Date(log.date);
                          const dateStr = dateObj.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                          });
                          const timeStr = dateObj.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <tr key={log.rowId} className={`log-row ${log.isCorrect ? 'row-correct' : 'row-incorrect'}`}>
                              <td className="log-date-cell">
                                <span className="date-main">{dateStr}</span>
                                <span className="date-time">{timeStr}</span>
                              </td>

                              <td>
                                <div className="user-profile-cell">
                                  {log.userImage ? (
                                    <img src={log.userImage} alt={log.userName} className="user-table-avatar" />
                                  ) : (
                                    <div className="user-table-avatar-placeholder">
                                      {(log.userName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="user-table-name" style={{ fontSize: '0.9rem' }}>
                                    {log.userName}
                                  </span>
                                </div>
                              </td>

                              <td className="user-email-cell" style={{ fontSize: '0.82rem' }}>
                                {log.userEmail}
                              </td>

                              <td>
                                <span className={`badge-modality ${log.modality}`}>
                                  {log.modality === 'kata' ? 'Kata' : 'Kumite'}
                                </span>
                              </td>

                              <td>
                                <span className="badge-qid">#{log.questionId}</span>
                              </td>

                              <td className="log-question-cell" title={log.justification ? `Justificación: ${log.justification}` : ''}>
                                <p className="log-question-text">{log.questionText || 'Pregunta oficial WKF'}</p>
                                {log.ref && <span className="log-question-ref">Ref: {log.ref}</span>}
                              </td>

                              <td>
                                <span className={`badge-ans-choice ${log.userAnswer ? 'ans-true' : 'ans-false'}`}>
                                  {log.userAnswer ? 'Verdadero' : 'Falso'}
                                </span>
                              </td>

                              <td>
                                {log.isCorrect ? (
                                  <span className="badge-eval badge-eval-correct">
                                    ✓ Correcta
                                  </span>
                                ) : (
                                  <span className="badge-eval badge-eval-incorrect">
                                    ✕ Errónea
                                  </span>
                                )}
                              </td>

                              <td>
                                <span className="badge-ans-correct-expected">
                                  {log.correctAnswer ? 'Verdadero' : 'Falso'}
                                </span>
                              </td>

                              <td>
                                <div className="log-exam-score-box">
                                  <span
                                    className={`badge-exam-score ${
                                      log.examPassed ? 'score-passed' : 'score-failed'
                                    }`}
                                  >
                                    {log.examPercentage}%
                                  </span>
                                  <span className="log-exam-points">
                                    {log.examScore}/{log.examTotal}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExam(log.examId, log.userName)}
                                  className="btn-action-delete"
                                  title="Eliminar este intento de examen"
                                  style={{ margin: 0 }}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* VISTA AGRUPADA POR EXAMEN / INTENTO */
                filteredExams.length === 0 ? (
                  <div className="admin-empty-box">
                    <p>No se encontraron intentos de examen con los filtros seleccionados.</p>
                  </div>
                ) : (
                  <div className="admin-table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Alumno</th>
                          <th>Correo</th>
                          <th>Modalidad</th>
                          <th>Nota Ganada</th>
                          <th>Puntos</th>
                          <th>Resultado</th>
                          <th>Preguntas Respondidas</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExams.map((ex) => {
                          const dateObj = new Date(ex.createdAt);
                          const dateStr = dateObj.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          });
                          const timeStr = dateObj.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <tr key={ex._id}>
                              <td className="log-date-cell">
                                <span className="date-main">{dateStr}</span>
                                <span className="date-time">{timeStr}</span>
                              </td>

                              <td>
                                <div className="user-profile-cell">
                                  {ex.userImage ? (
                                    <img src={ex.userImage} alt={ex.userName} className="user-table-avatar" />
                                  ) : (
                                    <div className="user-table-avatar-placeholder">
                                      {(ex.userName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="user-table-name">{ex.userName}</span>
                                </div>
                              </td>

                              <td className="user-email-cell">{ex.userEmail}</td>

                              <td>
                                <span className={`badge-modality ${ex.modality}`}>
                                  {ex.modality === 'kata' ? 'Kata' : 'Kumite'}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={`badge-exam-score score-large ${
                                    ex.passed ? 'score-passed' : 'score-failed'
                                  }`}
                                >
                                  {ex.percentage}%
                                </span>
                              </td>

                              <td>
                                <span className="badge-points">
                                  {ex.score} de {ex.totalQuestions}
                                </span>
                              </td>

                              <td>
                                <span className={`badge-status ${ex.passed ? 'status-aprobado' : 'status-bloqueado'}`}>
                                  {ex.passed ? '🏆 Aprobado' : '❌ Reprobado'}
                                </span>
                              </td>

                              <td>
                                <span className="badge-ans-count">
                                  {ex.userAnswers?.length || 0} preguntas
                                </span>
                              </td>

                              <td>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedExamModal(ex)}
                                    className="btn-action btn-action-view"
                                  >
                                    👁️ Ver Respuestas
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteExam(ex._id, ex.userName)}
                                    className="btn-action-delete"
                                    title="Eliminar este intento de examen"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </main>

      {/* Modal para ver el desglose completo de un examen */}
      {selectedExamModal && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedExamModal(null)}>
          <div
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-exam-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h2 id="modal-exam-title" className="admin-modal-title">
                  Desglose de Examen ({selectedExamModal.modality?.toUpperCase()})
                </h2>
                <p className="admin-modal-subtitle">
                  Alumno: <strong>{selectedExamModal.userName}</strong> ({selectedExamModal.userEmail})
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                aria-label="Cerrar ventana"
                onClick={() => setSelectedExamModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-score-banner">
              <div className="modal-score-item">
                <span className="modal-score-label">Nota Final</span>
                <span className={`modal-score-val ${selectedExamModal.passed ? 'color-pass' : 'color-fail'}`}>
                  {selectedExamModal.percentage}%
                </span>
              </div>
              <div className="modal-score-item">
                <span className="modal-score-label">Aciertos</span>
                <span className="modal-score-val">
                  {selectedExamModal.score} / {selectedExamModal.totalQuestions}
                </span>
              </div>
              <div className="modal-score-item">
                <span className="modal-score-label">Resultado</span>
                <span className="modal-score-val">
                  {selectedExamModal.passed ? '🏆 Aprobado' : '❌ Reprobado'}
                </span>
              </div>
            </div>

            <div className="admin-modal-body">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>
                Respuestas Registradas ({selectedExamModal.userAnswers?.length || 0})
              </h3>
              <div className="admin-modal-questions-list">
                {selectedExamModal.userAnswers?.map((ans, idx) => (
                  <div
                    key={idx}
                    className={`modal-question-item ${ans.isCorrect ? 'item-correct' : 'item-incorrect'}`}
                  >
                    <div className="modal-q-top">
                      <span className="badge-qid">Pregunta #{ans.questionId}</span>
                      <span className={`badge-eval ${ans.isCorrect ? 'badge-eval-correct' : 'badge-eval-incorrect'}`}>
                        {ans.isCorrect ? '✓ Correcta' : '✕ Errónea'}
                      </span>
                    </div>

                    <p className="modal-q-text">{ans.questionText || `Pregunta WKF #${ans.questionId}`}</p>

                    <div className="modal-q-answers-row">
                      <span>
                        Respuesta Alumno:{' '}
                        <strong>{ans.userAnswer ? 'Verdadero' : 'Falso'}</strong>
                      </span>
                      <span>
                        Respuesta Correcta:{' '}
                        <strong>{ans.correctAnswer ? 'Verdadero' : 'Falso'}</strong>
                      </span>
                    </div>

                    {ans.justification && (
                      <div className="modal-q-justification">
                        <strong>Justificación WKF:</strong> {ans.justification}
                        {ans.ref && <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b' }}>Referencia: {ans.ref}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-modal-delete"
                onClick={() => handleDeleteExam(selectedExamModal._id, selectedExamModal.userName)}
              >
                🗑️ Eliminar este Intento
              </button>
              <button
                type="button"
                className="btn-3d btn-blue"
                onClick={() => setSelectedExamModal(null)}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
