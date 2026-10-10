import mongoose from 'mongoose';
import dns from 'dns';

// Solución para Windows/Node DNS SRV resolution con MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignorar si el entorno no permite configurar DNS
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Por favor define la variable de entorno MONGODB_URI en .env.local');
}

/**
 * Cache global para mantener la conexión activa en Next.js
 * durante el Hot Reload en modo de desarrollo.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // ignorar
  }

  const targetDb = process.env.MONGODB_DB || 'ExamenWKF';

  if (cached.conn) {
    if (cached.conn.connection.name === targetDb) {
      return cached.conn;
    }
    try {
      await mongoose.disconnect();
    } catch (_) {}
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB || 'ExamenWKF',
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
