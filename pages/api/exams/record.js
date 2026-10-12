import { requireApprovedUser } from '../../../lib/guard';
import { checkRateLimit } from '../../../lib/rate-limit';
import ExamResult from '../../../models/ExamResult';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  // Rate limiting anti-inundación: Máximo 15 registros por minuto por cliente
  if (!checkRateLimit(req, res, { limit: 15, windowMs: 60000, prefix: 'record' })) {
    return;
  }

  try {
    const auth = await requireApprovedUser(req, res);
    if (!auth) return;

    const {
      attemptId,
      role = 'coach',
      modality = 'kata',
      totalQuestions = 10,
      orderMode = 'random',
      timerMode = 'off',
      answer, // objeto de respuesta individual
      userAnswers, // array completo de respuestas (si se envían todas juntas al terminar)
      isFinished = false,
      finalScore,
      percentage,
      passed,
    } = req.body;

    const userEmail = auth.email;
    const userName = auth.user?.name || auth.session.user.name || 'Usuario Registrado';
    const userImage = auth.user?.image || auth.session.user.image || '';
    const userId = auth.user?._id || null;

    let examDoc;

    if (attemptId) {
      examDoc = await ExamResult.findById(attemptId);
    }

    if (!examDoc) {
      // Crear nuevo registro de intento
      const initialAnswers = userAnswers && Array.isArray(userAnswers)
        ? userAnswers.map((a) => ({
            questionId: a.questionId,
            questionText: a.text || a.questionText || '',
            questionTextEn: a.text_en || a.questionTextEn || '',
            userAnswer: typeof a.userAnswer === 'boolean' ? a.userAnswer : null,
            correctAnswer: Boolean(a.correctAnswer),
            isCorrect: Boolean(a.isCorrect),
            justification: a.justification || '',
            ref: a.ref || '',
            section: a.section || '',
            answeredAt: a.answeredAt ? new Date(a.answeredAt) : new Date(),
          }))
        : answer
        ? [
            {
              questionId: answer.questionId,
              questionText: answer.text || answer.questionText || '',
              questionTextEn: answer.text_en || answer.questionTextEn || '',
              userAnswer: typeof answer.userAnswer === 'boolean' ? answer.userAnswer : null,
              correctAnswer: Boolean(answer.correctAnswer),
              isCorrect: Boolean(answer.isCorrect),
              justification: answer.justification || '',
              ref: answer.ref || '',
              section: answer.section || '',
              answeredAt: new Date(),
            },
          ]
        : [];

      const calculatedScore = typeof finalScore === 'number'
        ? finalScore
        : initialAnswers.filter((a) => a.isCorrect).length;

      const calcTotal = totalQuestions || initialAnswers.length || 1;
      const calcPct = typeof percentage === 'number'
        ? percentage
        : Math.round((calculatedScore / calcTotal) * 100);

      const calcCorrectPct = typeof req.body.correctPercentage === 'number'
        ? req.body.correctPercentage
        : calcPct;

      const calcIncorrectPct = typeof req.body.incorrectPercentage === 'number'
        ? req.body.incorrectPercentage
        : Math.max(0, 100 - calcCorrectPct);

      const calcPassed = typeof passed === 'boolean'
        ? passed
        : calcPct >= 80;

      examDoc = await ExamResult.create({
        userId,
        userName,
        userEmail,
        userImage,
        role,
        modality,
        score: calculatedScore,
        totalQuestions: calcTotal,
        percentage: calcPct,
        correctPercentage: calcCorrectPct,
        incorrectPercentage: calcIncorrectPct,
        passed: calcPassed,
        status: isFinished ? 'completado' : 'en_progreso',
        orderMode,
        timerMode,
        userAnswers: initialAnswers,
      });
    } else {
      // Actualizar intento existente
      if (answer) {
        // Evitar duplicar la misma pregunta si se reenvía
        const existingAnsIdx = examDoc.userAnswers.findIndex(
          (a) => a.questionId === answer.questionId
        );

        const formattedAns = {
          questionId: answer.questionId,
          questionText: answer.text || answer.questionText || '',
          questionTextEn: answer.text_en || answer.questionTextEn || '',
          userAnswer: typeof answer.userAnswer === 'boolean' ? answer.userAnswer : null,
          correctAnswer: Boolean(answer.correctAnswer),
          isCorrect: Boolean(answer.isCorrect),
          justification: answer.justification || '',
          ref: answer.ref || '',
          section: answer.section || '',
          answeredAt: new Date(),
        };

        if (existingAnsIdx >= 0) {
          examDoc.userAnswers[existingAnsIdx] = formattedAns;
        } else {
          examDoc.userAnswers.push(formattedAns);
        }
      }

      if (userAnswers && Array.isArray(userAnswers)) {
        examDoc.userAnswers = userAnswers.map((a) => ({
          questionId: a.questionId,
          questionText: a.text || a.questionText || '',
          questionTextEn: a.text_en || a.questionTextEn || '',
          userAnswer: typeof a.userAnswer === 'boolean' ? a.userAnswer : null,
          correctAnswer: Boolean(a.correctAnswer),
          isCorrect: Boolean(a.isCorrect),
          justification: a.justification || '',
          ref: a.ref || '',
          section: a.section || '',
          answeredAt: a.answeredAt ? new Date(a.answeredAt) : new Date(),
        }));
      }

      const calculatedScore = typeof finalScore === 'number'
        ? finalScore
        : examDoc.userAnswers.filter((a) => a.isCorrect).length;

      const calcTotal = totalQuestions || examDoc.totalQuestions || 1;
      const calcPct = typeof percentage === 'number'
        ? percentage
        : Math.round((calculatedScore / calcTotal) * 100);

      const calcCorrectPct = typeof req.body.correctPercentage === 'number'
        ? req.body.correctPercentage
        : calcPct;

      const calcIncorrectPct = typeof req.body.incorrectPercentage === 'number'
        ? req.body.incorrectPercentage
        : Math.max(0, 100 - calcCorrectPct);

      const calcPassed = typeof passed === 'boolean'
        ? passed
        : calcPct >= 80;

      examDoc.score = calculatedScore;
      examDoc.totalQuestions = calcTotal;
      examDoc.percentage = calcPct;
      examDoc.correctPercentage = calcCorrectPct;
      examDoc.incorrectPercentage = calcIncorrectPct;
      examDoc.passed = calcPassed;
      if (isFinished) {
        examDoc.status = 'completado';
      }

      await examDoc.save();
    }

    return res.status(200).json({
      success: true,
      attemptId: examDoc._id,
      score: examDoc.score,
      percentage: examDoc.percentage,
      passed: examDoc.passed,
      status: examDoc.status,
    });
  } catch (error) {
    console.error('Error al registrar examen:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error del servidor' });
  }
}
