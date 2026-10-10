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

    // Estadísticas globales acumuladas
    let totalExams = rawExams.length;
    let totalCompleted = 0;
    let totalPassed = 0;
    let sumPercentage = 0;
    let totalQuestionsAnswered = 0;
    let totalCorrectAnswers = 0;

    // Desglose aplanado de respuestas por pregunta individual
    const questionLogs = [];

    const searchQuery = search.toLowerCase().trim();

    rawExams.forEach((exam) => {
      if (exam.status === 'completado') {
        totalCompleted += 1;
        if (exam.passed) totalPassed += 1;
        sumPercentage += exam.percentage || 0;
      }

      const answers = exam.userAnswers || [];
      answers.forEach((ans, idx) => {
        totalQuestionsAnswered += 1;
        if (ans.isCorrect) totalCorrectAnswers += 1;

        // Filtro por estado de respuesta (correcta / errónea)
        if (answerStatus === 'correct' && !ans.isCorrect) return;
        if (answerStatus === 'incorrect' && ans.isCorrect) return;

        // Filtro de búsqueda
        if (searchQuery) {
          const matchUser = exam.userName?.toLowerCase().includes(searchQuery);
          const matchEmail = exam.userEmail?.toLowerCase().includes(searchQuery);
          const matchQId = String(ans.questionId) === searchQuery || `#${ans.questionId}` === searchQuery;
          const matchText = ans.questionText?.toLowerCase().includes(searchQuery);

          if (!matchUser && !matchEmail && !matchQId && !matchText) {
            return;
          }
        }

        questionLogs.push({
          rowId: `${exam._id}_${ans.questionId}_${idx}`,
          examId: exam._id,
          date: ans.answeredAt || exam.createdAt,
          userName: exam.userName,
          userEmail: exam.userEmail,
          userImage: exam.userImage,
          modality: exam.modality,
          questionId: ans.questionId,
          questionText: ans.questionText,
          questionTextEn: ans.questionTextEn,
          userAnswer: ans.userAnswer,
          correctAnswer: ans.correctAnswer,
          isCorrect: ans.isCorrect,
          justification: ans.justification,
          ref: ans.ref,
          section: ans.section,
          examScore: exam.score,
          examTotal: exam.totalQuestions,
          examPercentage: exam.percentage,
          examPassed: exam.passed,
          examStatus: exam.status,
        });
      });
    });

    const avgScore = totalCompleted > 0 ? Math.round(sumPercentage / totalCompleted) : 0;
    const passRate = totalCompleted > 0 ? Math.round((totalPassed / totalCompleted) * 100) : 0;
    const accuracy = totalQuestionsAnswered > 0
      ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      summary: {
        totalExams,
        totalCompleted,
        totalPassed,
        passRate,
        avgScore,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        totalIncorrectAnswers: totalQuestionsAnswered - totalCorrectAnswers,
        accuracy,
      },
      questionLogs,
      exams: rawExams,
    });
  } catch (error) {
    console.error('Error al gestionar log de exámenes:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error del servidor' });
  }
}
