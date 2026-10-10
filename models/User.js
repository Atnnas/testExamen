import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'visitante'],
      default: 'visitante',
    },
    status: {
      type: String,
      enum: ['pendiente', 'aprobado', 'bloqueado'],
      default: 'pendiente',
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
