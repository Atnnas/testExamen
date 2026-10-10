import mongoose from 'mongoose';
import dns from 'dns';

// Solución para Windows/Node DNS SRV resolution con MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignorar si el entorno no permite configurar DNS
}

const DIRECT_REPLICA_FALLBACK =
  'mongodb://davidartaviarodriguez_db_user:UYUNlKLuR1rSoTsu@ac-cxc8kvq-shard-00-00.jodngjz.mongodb.net:27017,ac-cxc8kvq-shard-00-01.jodngjz.mongodb.net:27017,ac-cxc8kvq-shard-00-02.jodngjz.mongodb.net:27017/ExamenWKF?ssl=true&replicaSet=atlas-p0tcts-shard-0&authSource=admin&retryWrites=true&w=majority';

const MONGODB_URI = process.env.MONGODB_URI || DIRECT_REPLICA_FALLBACK;

/**
 * Cache global para mantener la conexión activa en Next.js
 * durante el Hot Reload en desarrollo o ejecuciones serverless en producción (Vercel).
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
      dbName: targetDb,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .catch((err) => {
        if (
          err.message &&
          (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED'))
        ) {
          console.warn('⚠️ querySrv falló, conectando mediante réplicas directas de Atlas...');
          return mongoose.connect(DIRECT_REPLICA_FALLBACK, opts);
        }
        throw err;
      })
      .then((mongooseInstance) => {
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
