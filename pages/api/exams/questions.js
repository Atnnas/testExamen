import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { kataQuestions, kumiteQuestions, refereeQuestions } from '../../../data/questions';

const ADMIN_EMAIL = 'david.artavia.rodriguez@gmail.com'.toLowerCase();

export default async function handler(req, res) {
  // Solo permitir solicitudes GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  // Deshabilitar almacenamiento en caché para datos confidenciales
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // 1. Verificar sesión activa de NextAuth (Google)
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado: Es obligatorio iniciar sesión con Google para acceder al banco de preguntas.',
      });
    }

    const userEmail = session.user.email.toLowerCase().trim();
    const isSuperAdmin = userEmail === ADMIN_EMAIL;

    // 2. Conectar a MongoDB y verificar en tiempo real el estado del usuario en la base de datos
    await dbConnect();
    const dbUser = await User.findOne({ email: userEmail }).lean();

    const isAdmin = isSuperAdmin || dbUser?.role === 'admin';
    const isApproved = isAdmin || dbUser?.status === 'aprobado';

    // 3. Regla de lista blanca estricta: Si no está aprobado ni es admin, se bloquea rotundamente
    if (!isApproved) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: Tu cuenta se encuentra en revisión o no ha sido activada en la base de datos.',
        status: dbUser?.status || 'pendiente',
      });
    }

    // 4. Si el usuario está aprobado o es admin, servir el banco de preguntas según el filtro o completo
    const { role, modality } = req.query;

    if (role === 'referee') {
      return res.status(200).json({
        success: true,
        role: 'referee',
        count: refereeQuestions.length,
        questions: refereeQuestions,
      });
    }

    if (role === 'coach') {
      if (modality === 'kata') {
        return res.status(200).json({
          success: true,
          role: 'coach',
          modality: 'kata',
          count: kataQuestions.length,
          questions: kataQuestions,
        });
      }
      if (modality === 'kumite') {
        return res.status(200).json({
          success: true,
          role: 'coach',
          modality: 'kumite',
          count: kumiteQuestions.length,
          questions: kumiteQuestions,
        });
      }
      // Si no especifica modalidad de coach, entregar ambas
      return res.status(200).json({
        success: true,
        role: 'coach',
        questions: {
          kata: kataQuestions,
          kumite: kumiteQuestions,
        },
      });
    }

    // Por defecto para precarga completa autorizada: entregar los 3 bancos
    return res.status(200).json({
      success: true,
      questions: {
        kata: kataQuestions,
        kumite: kumiteQuestions,
        referee: refereeQuestions,
      },
    });
  } catch (error) {
    console.error('Error en API segura /api/exams/questions:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al procesar el banco de preguntas.',
    });
  }
}
