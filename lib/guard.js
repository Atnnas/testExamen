import { getServerSession } from 'next-auth/next';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import dbConnect from './mongodb';
import User from '../models/User';

export const ADMIN_EMAIL = 'david.artavia.rodriguez@gmail.com'.toLowerCase();

/**
 * Obtiene la sesión autenticada y el registro del usuario en MongoDB en tiempo real.
 * Retorna null si no hay sesión activa de Google.
 */
export async function getAuthContext(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return null;
  }

  const email = session.user.email.toLowerCase().trim();
  const isSuperAdmin = email === ADMIN_EMAIL;

  await dbConnect();
  const dbUser = await User.findOne({ email }).lean();

  const isAdmin = isSuperAdmin || dbUser?.role === 'admin';
  const isApproved = isAdmin || dbUser?.status === 'aprobado';
  const isBlocked = !isAdmin && dbUser?.status === 'bloqueado';

  return {
    session,
    email,
    user: dbUser,
    isSuperAdmin,
    isAdmin,
    isApproved,
    isBlocked,
    status: dbUser?.status || (isAdmin ? 'aprobado' : 'pendiente'),
    role: dbUser?.role || (isAdmin ? 'admin' : 'visitante'),
  };
}

/**
 * Guardia de acceso: Requiere sesión activa de Google.
 * Responde 401 Unauthorized si no está autenticado.
 */
export async function requireAuth(req, res) {
  const ctx = await getAuthContext(req, res);
  if (!ctx) {
    res.status(401).json({
      success: false,
      error: 'No autenticado: Es indispensable iniciar sesión con Google.',
    });
    return null;
  }
  return ctx;
}

/**
 * Guardia de acceso: Requiere que la cuenta esté activa/aprobada por el administrador en la base de datos.
 * Responde 403 Forbidden si está pendiente o bloqueada.
 */
export async function requireApprovedUser(req, res) {
  const ctx = await requireAuth(req, res);
  if (!ctx) return null;

  if (!ctx.isApproved) {
    res.status(403).json({
      success: false,
      error: 'Acceso denegado: Tu cuenta no ha sido aprobada por el administrador en la base de datos.',
      status: ctx.status,
    });
    return null;
  }

  return ctx;
}

/**
 * Guardia de acceso: Requiere rol de administrador federativo.
 * Responde 403 Forbidden si no es administrador.
 */
export async function requireAdmin(req, res) {
  const ctx = await requireAuth(req, res);
  if (!ctx) return null;

  if (!ctx.isAdmin) {
    res.status(403).json({
      success: false,
      error: 'Acceso denegado: Se requieren permisos de administrador federativo.',
    });
    return null;
  }

  return ctx;
}
