/**
 * Almacén en memoria para limitación de tasa (Rate Limiting) en endpoints de Next.js.
 * Previene ataques de denegación de servicio (DoS) y scripts automatizados contra la base de datos.
 */
const rateLimitMap = new Map();

// Limpieza periódica cada 2 minutos para evitar acumulación en memoria
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 120000);
}

/**
 * Obtiene la dirección IP real del cliente a partir de cabeceras de proxy o socket.
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Valida la tasa de solicitudes de un cliente en una ventana de tiempo.
 *
 * @param {object} req - Request de Next.js
 * @param {object} res - Response de Next.js
 * @param {object} options
 * @param {number} options.limit - Cantidad máxima permitida de solicitudes en la ventana
 * @param {number} options.windowMs - Duración de la ventana en milisegundos (default 60000 = 1 min)
 * @param {string} options.prefix - Prefijo para aislar endpoints ('record', 'questions', etc.)
 * @param {string} [options.identifier] - Identificador adicional (ej: correo del usuario autenticado)
 * @returns {boolean} - true si la solicitud está permitida; false si superó el límite (emite 429)
 */
export function checkRateLimit(req, res, { limit = 20, windowMs = 60000, prefix = 'api', identifier = '' } = {}) {
  const ip = getClientIp(req);
  const key = `${prefix}:${ip}:${identifier || ''}`;
  const now = Date.now();

  let record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitMap.set(key, record);
  } else {
    record.count += 1;
  }

  const remaining = Math.max(0, limit - record.count);
  const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

  // Inyectar cabeceras estándar HTTP de Rate Limiting
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetSeconds);

  if (record.count > limit) {
    res.setHeader('Retry-After', resetSeconds);
    res.status(429).json({
      success: false,
      error: `Demasiadas solicitudes. Límite de ${limit} peticiones por minuto alcanzado. Por favor espera ${resetSeconds} segundos.`,
      retryAfter: resetSeconds,
    });
    return false;
  }

  return true;
}
