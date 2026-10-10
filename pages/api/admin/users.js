import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

const ADMIN_EMAIL = 'david.artavia.rodriguez@gmail.com'.toLowerCase();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ success: false, error: 'No autenticado' });
  }

  const isSuperAdmin = session.user.email?.toLowerCase() === ADMIN_EMAIL;
  if (!isSuperAdmin && session.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Acceso denegado: Se requiere rol de administrador' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const users = await User.find({}).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, users });
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { userId, role, status } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId es requerido' });
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }

      // Proteger la cuenta del superadministrador principal
      if (targetUser.email.toLowerCase() === ADMIN_EMAIL) {
        if (role && role !== 'admin') {
          return res.status(400).json({ success: false, error: 'No es posible modificar el rol del administrador principal' });
        }
        if (status && status !== 'aprobado') {
          return res.status(400).json({ success: false, error: 'No es posible bloquear al administrador principal' });
        }
      }

      if (role && ['admin', 'editor', 'visitante'].includes(role)) {
        targetUser.role = role;
      }

      if (status && ['pendiente', 'aprobado', 'bloqueado'].includes(status)) {
        targetUser.status = status;
      }

      await targetUser.save();

      return res.status(200).json({
        success: true,
        message: 'Usuario actualizado correctamente',
        user: targetUser,
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      return res.status(500).json({ success: false, error: 'Error al actualizar usuario' });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}
