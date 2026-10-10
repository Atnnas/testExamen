import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: Number,
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      default: '',
    },
    questionTextEn: {
      type: String,
      default: '',
    },
    userAnswer: {
      type: Boolean,
      required: true,
    },
    correctAnswer: {
      type: Boolean,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      index: true,
    },
    justification: {
      type: String,
      default: '',
    },
    ref: {
      type: String,
      default: '',
    },
    section: {
      type: String,
      default: '',
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ExamResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    userName: {
      type: String,
      required: true,
      default: 'Usuario Registrado',
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    userImage: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['coach', 'referee'],
      default: 'coach',
    },
    modality: {
      type: String,
      enum: ['kata', 'kumite'],
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 10,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    passed: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ['en_progreso', 'completado'],
      default: 'completado',
      index: true,
    },
    orderMode: {
      type: String,
      default: 'random',
    },
    userAnswers: [AnswerSchema],
  },
  {
    timestamps: true,
  }
);

ExamResultSchema.index({ createdAt: -1 });
ExamResultSchema.index({ userEmail: 1, createdAt: -1 });

export default mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema);
