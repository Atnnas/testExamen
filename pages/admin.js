import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import KaratecaMascot from '../components/KaratecaMascot';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const isAdmin = session?.user?.role === 'admin' || session?.user?.email?.toLowerCase() === 'david.artavia.rodriguez@gmail.com';

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

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      fetchUsers();
    }
  }, [status, isAdmin]);

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

      <main className="admin-content">
        {/* Toast Notificación */}
        {toastMessage && <div className="admin-toast">{toastMessage}</div>}

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
      </main>
    </div>
  );
}
