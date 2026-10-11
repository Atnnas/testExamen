import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import ExamResult from '../../../models/ExamResult';

const ADMIN_EMAIL = 'david.artavia.rodriguez@gmail.com'.toLowerCase();

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    const isSuperAdmin = session.user.email?.toLowerCase() === ADMIN_EMAIL;
    if (!isSuperAdmin && session.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Acceso denegado: Se requiere rol de administrador' });
    }

    await dbConnect();

    // =========================================================================
    // BORRADO DE LOGS (INDIVIDUAL O TOTAL)
    // =========================================================================
    if (req.method === 'DELETE') {
      const { examId, clearAll } = req.body || req.query;

      if (clearAll) {
        const result = await ExamResult.deleteMany({});
        return res.status(200).json({
          success: true,
          message: `Se vació el log de exámenes con éxito (${result.deletedCount} registros eliminados).`,
          deletedCount: result.deletedCount,
        });
      }

      if (examId) {
        const deleted = await ExamResult.findByIdAndDelete(examId);
        if (!deleted) {
          return res.status(404).json({ success: false, error: 'Registro de examen no encontrado' });
        }
        return res.status(200).json({
          success: true,
          message: 'Intento de examen eliminado con éxito',
          examId,
        });
      }

      return res.status(400).json({ success: false, error: 'Parámetro inválido: examId o clearAll requerido' });
    }

    // =========================================================================
    // CONSULTA DE LOGS (GET)
    // =========================================================================
    const {
      search = '',
      modality = 'all',
      answerStatus = 'all', // 'all', 'correct', 'incorrect'
      limit = 200,
    } = req.query;

    const filter = {};
    if (modality && modality !== 'all') {
      filter.modality = modality;
    }

    // Consultar todos los exámenes más recientes
    const rawExams = await ExamResult.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 200)
      .lean();

    const searchQuery = search.toLowerCase().trim();

    // Formatear cada intento de examen garantizando porcentajes de aciertos y errores
    const formattedExams = rawExams.map((exam) => {
      const answers = exam.userAnswers || [];
      const totalQ = exam.totalQuestions || answers.length || 1;
      const calcScore = typeof exam.score === 'number'
        ? exam.score
        : answers.filter((a) => a.isCorrect).length;

      const calcPct = typeof exam.percentage === 'number'
        ? exam.percentage
        : Math.round((calcScore / totalQ) * 100);

      const correctPct = typeof exam.correctPercentage === 'number'
        ? exam.correctPercentage
        : calcPct;

      const incorrectPct = typeof exam.incorrectPercentage === 'number'
        ? exam.incorrectPercentage
        : Math.max(0, 100 - correctPct);

      return {
        ...exam,
        score: calcScore,
        totalQuestions: totalQ,
        percentage: calcPct,
        correctPercentage: correctPct,
        incorrectPercentage: incorrectPct,
        passed: typeof exam.passed === 'boolean' ? exam.passed : calcPct >= 80,
      };
    });

    // Filtrar por término de búsqueda si se proporciona (nombre o correo)
    const filteredExams = searchQuery
      ? formattedExams.filter((ex) => {
          return (
            ex.userName?.toLowerCase().includes(searchQuery) ||
            ex.userEmail?.toLowerCase().includes(searchQuery)
          );
        })
      : formattedExams;

    // Estadísticas globales sobre los intentos de examen
    let totalCompleted = 0;
    let totalPassed = 0;
    let sumPercentage = 0;
    let sumCorrectPct = 0;
    let sumIncorrectPct = 0;

    filteredExams.forEach((exam) => {
      totalCompleted += 1;
      if (exam.passed) totalPassed += 1;
      sumPercentage += exam.percentage || 0;
      sumCorrectPct += exam.correctPercentage || 0;
      sumIncorrectPct += exam.incorrectPercentage || 0;
    });

    const totalExams = filteredExams.length;
    const avgScore = totalExams > 0 ? Math.round(sumPercentage / totalExams) : 0;
    const avgCorrectPct = totalExams > 0 ? Math.round(sumCorrectPct / totalExams) : 0;
    const avgIncorrectPct = totalExams > 0 ? Math.round(sumIncorrectPct / totalExams) : 0;
    const passRate = totalExams > 0 ? Math.round((totalPassed / totalExams) * 100) : 0;

    return res.status(200).json({
      success: true,
      summary: {
        totalExams,
        totalCompleted,
        totalPassed,
        passRate,
        avgScore,
        avgCorrectPct,
        avgIncorrectPct,
      },
      exams: filteredExams,
    });
  } catch (error) {
    console.error('Error al gestionar log de exámenes:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error del servidor' });
  }
}
