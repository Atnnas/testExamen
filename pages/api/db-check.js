import dbConnect from '../../lib/mongodb';

export default async function handler(req, res) {
  try {
    const mongoose = await dbConnect();
    const readyState = mongoose.connection.readyState;
    
    // Estados de conexión en Mongoose: 0 = desconectado, 1 = conectado, 2 = conectando, 3 = desconectando
    const isConnected = readyState === 1;

    // Obtener información básica de la base de datos
    const dbName = mongoose.connection.name;

    return res.status(200).json({
      success: true,
      message: 'Conexión a MongoDB Atlas establecida correctamente.',
      database: dbName,
      connectionState: isConnected ? 'Conectado (Ready)' : readyState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al conectar con MongoDB Atlas',
      error: error.message
    });
  }
}
