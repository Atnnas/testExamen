import mongoose from 'mongoose';

const ExamResultSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['coach', 'referee'],
      default: 'coach',
    },
    modality: {
      type: String,
      enum: ['kata', 'kumite'],
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    orderMode: {
      type: String,
      default: 'random',
    },
    userAnswers: [
      {
        questionId: Number,
        userAnswer: Boolean,
        correctAnswer: Boolean,
        isCorrect: Boolean,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema);
