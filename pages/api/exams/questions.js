import { requireApprovedUser } from '../../../lib/guard';
import { kataQuestions, kumiteQuestions, refereeQuestions } from '../../../data/questions';

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
    // Verificar autorización estricta en tiempo real (Fail-closed)
    const auth = await requireApprovedUser(req, res);
    if (!auth) return;

    // Servir el banco de preguntas según el filtro o completo
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
