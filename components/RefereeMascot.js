import React, { useState, useEffect } from 'react';

export default function RefereeMascot({
  state = 'idle',
  size = 'normal',
  forcedVariant = null, // 'classic' | 'curly_glasses'
}) {
  const isDual = state === 'success' || state === 'failure';
  // viewBox ampliado a 360 de ancho para dar mucha más separación entre los dos árbitros
  const viewBox = isDual ? '0 0 360 220' : '0 0 220 220';

  // Selección al azar entre:
  // 1. 'classic': Sensei con cabellera completa (sin cola)
  // 2. 'curly_glasses': Sensei de tez morena suave (no tan morena) con pelo colocho y lentes
  const [randomVariant, setRandomVariant] = useState(() =>
    Math.random() < 0.5 ? 'classic' : 'curly_glasses'
  );

  useEffect(() => {
    if (state === 'success' || state === 'failure') {
      setRandomVariant(Math.random() < 0.5 ? 'classic' : 'curly_glasses');
    }
  }, [state]);

  const activeVariant = forcedVariant || randomVariant;
  const isCurly = activeVariant === 'curly_glasses';

  // Tez morena pero suave (no tan oscura)
  const reviewerSkin = isCurly ? '#cda077' : '#fcd5b4';
  const reviewerStroke = isCurly ? '#332211' : '#333333';

  return (
    <div
      className={`referee-mascot-container referee-state-${state} ${
        size === 'small' ? 'referee-small' : ''
      } ${isDual ? 'referee-dual-mode' : ''}`}
    >
      <svg
        viewBox={viewBox}
        className="referee-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ==============================================================
            MODO INDIVIDUAL (IDLE / THINKING)
            ============================================================== */}
        {!isDual && (
          <>
            {/* Sombra suelo */}
            <ellipse
              cx="110"
              cy="205"
              rx="42"
              ry="8"
              fill="rgba(0,0,0,0.12)"
              className="referee-shadow"
            />

            {/* Grupo principal del Árbitro con banderas */}
            <g className="referee-main-group">
              {/* Piernas / Pantalón azul marino oscuro WKF */}
              <path
                d="M 85,150 L 78,195 L 96,195 L 102,165 L 118,165 L 124,195 L 142,195 L 135,150 Z"
                fill="#1a2744"
                stroke="#111"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Zapatos formales negros */}
              <path
                d="M 75,195 Q 66,195 66,202 L 96,202 L 96,195 Z"
                fill="#222"
                stroke="#111"
                strokeWidth="3"
              />
              <path
                d="M 124,195 L 124,202 L 154,202 Q 154,195 145,195 Z"
                fill="#222"
                stroke="#111"
                strokeWidth="3"
              />

              {/* Torso: Saco azul marino oficial WKF */}
              <path
                d="M 72,108 L 148,108 L 140,162 L 80,162 Z"
                fill="#1a2744"
                stroke="#111"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Camisa celeste WKF cuello en V */}
              <polygon
                points="96,108 124,108 110,138"
                fill="#b3d4fc"
                stroke="#6a9fd8"
                strokeWidth="2"
              />

              {/* Corbata roja oficial WKF */}
              <path
                d="M 107,112 L 104,138 L 110,146 L 116,138 L 113,112 Z"
                fill="#e74c3c"
                stroke="#c0392b"
                strokeWidth="2"
              />

              {/* Solapas del saco */}
              <path
                d="M 72,108 L 96,140 L 98,162"
                fill="none"
                stroke="#10192e"
                strokeWidth="3"
              />
              <path
                d="M 148,108 L 124,140 L 122,162"
                fill="none"
                stroke="#10192e"
                strokeWidth="3"
              />

              {/* Escudo WKF en el bolsillo */}
              <rect
                x="80"
                y="126"
                width="14"
                height="14"
                rx="2"
                fill="#23355b"
                stroke="#3d568c"
                strokeWidth="1.5"
              />
              <circle cx="87" cy="133" r="3.5" fill="#e74c3c" />

              {/* Brazo Izquierdo (con tablilla de notas / reglamento) */}
              <g className="referee-left-arm">
                <path
                  d="M 72,110 L 48,135 L 58,145 L 80,126 Z"
                  fill="#1a2744"
                  stroke="#111"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <circle
                  cx="48"
                  cy="140"
                  r="9"
                  fill="#fcd5b4"
                  stroke="#333"
                  strokeWidth="3"
                />
                {/* Tablilla */}
                <rect
                  x="28"
                  y="130"
                  width="24"
                  height="34"
                  rx="3"
                  fill="#e2e8f0"
                  stroke="#475569"
                  strokeWidth="2.5"
                />
                <rect x="33" y="126" width="14" height="6" rx="2" fill="#94a3b8" />
                <line
                  x1="33"
                  y1="140"
                  x2="47"
                  y2="140"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="33"
                  y1="147"
                  x2="47"
                  y2="147"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="33"
                  y1="154"
                  x2="43"
                  y2="154"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>

              {/* Brazo Derecho con banderas WKF */}
              <g className="referee-right-arm">
                <path
                  d="M 148,110 L 172,128 L 165,140 L 140,126 Z"
                  fill="#1a2744"
                  stroke="#111"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <circle
                  cx="172"
                  cy="134"
                  r="9"
                  fill="#fcd5b4"
                  stroke="#333"
                  strokeWidth="3"
                />
                {/* Vara de banderas */}
                <line
                  x1="172"
                  y1="155"
                  x2="172"
                  y2="85"
                  stroke="#78350f"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Bandera Roja (AKA) */}
                <path
                  d="M 172,88 L 198,96 L 198,112 L 172,106 Z"
                  fill="#ff4b4b"
                  stroke="#d63030"
                  strokeWidth="1.5"
                />
                {/* Bandera Azul (AO) */}
                <path
                  d="M 172,110 L 198,118 L 198,134 L 172,128 Z"
                  fill="#1cb0f6"
                  stroke="#1588be"
                  strokeWidth="1.5"
                />
              </g>

              {/* Cuello */}
              <rect
                x="104"
                y="98"
                width="12"
                height="12"
                fill="#fcd5b4"
                stroke="#333"
                strokeWidth="3"
              />

              {/* Cabeza Chibi del Árbitro con cabellera completa */}
              <g className="referee-head-group">
                <path
                  d="M 72,74 C 70,44 90,32 110,32 C 130,32 150,44 148,74 C 142,56 128,48 110,48 C 92,48 78,56 72,74 Z"
                  fill="#2d3748"
                />
                <circle
                  cx="110"
                  cy="72"
                  r="38"
                  fill="#fcd5b4"
                  stroke="#333"
                  strokeWidth="3.5"
                />
                {/* Cabellera frontal completa */}
                <path
                  d="M 72,68 C 72,42 90,34 110,34 C 132,34 148,44 148,68 C 142,54 130,50 112,50 C 94,50 82,56 72,68 Z"
                  fill="#2d3748"
                  stroke="#1a202c"
                  strokeWidth="1.5"
                />
                <path d="M 72,65 Q 74,78 78,84 L 78,74 Z" fill="#2d3748" />
                <path d="M 148,65 Q 146,78 142,84 L 142,74 Z" fill="#2d3748" />

                {/* Mejillas */}
                <ellipse
                  cx="85"
                  cy="82"
                  rx="5"
                  ry="3.5"
                  fill="rgba(244,164,96,0.5)"
                />
                <ellipse
                  cx="135"
                  cy="82"
                  rx="5"
                  ry="3.5"
                  fill="rgba(244,164,96,0.5)"
                />

                {state === 'thinking' ? (
                  <>
                    {/* Ojos pensativos */}
                    <circle cx="95" cy="71" r="4.5" fill="#2d3748" />
                    <circle cx="125" cy="71" r="4.5" fill="#2d3748" />
                    <circle cx="96" cy="69.5" r="1.5" fill="#ffffff" />
                    <circle cx="126" cy="69.5" r="1.5" fill="#ffffff" />
                    <path
                      d="M 87,61 Q 96,56 101,61"
                      fill="none"
                      stroke="#333"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 133,65 Q 124,64 119,67"
                      fill="none"
                      stroke="#333"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <ellipse cx="110" cy="87" rx="3.5" ry="4" fill="#2d3748" />
                  </>
                ) : (
                  <>
                    {/* Ojos normales */}
                    <circle cx="95" cy="74" r="4.5" fill="#2d3748" />
                    <circle cx="125" cy="74" r="4.5" fill="#2d3748" />
                    <circle cx="93.5" cy="72.5" r="1.5" fill="#ffffff" />
                    <circle cx="123.5" cy="72.5" r="1.5" fill="#ffffff" />
                    <path
                      d="M 87,64 Q 96,62 101,66"
                      fill="none"
                      stroke="#333"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 133,64 Q 124,62 119,66"
                      fill="none"
                      stroke="#333"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 104,86 Q 110,91 116,86"
                      fill="none"
                      stroke="#2d3748"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Silbato en el cuello */}
                <path
                  d="M 107,92 L 105,102 L 115,102 L 113,92 Z"
                  fill="#94a3b8"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <circle
                  cx="114"
                  cy="102"
                  r="3"
                  fill="#cbd5e1"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
              </g>

              {/* Icono de bombilla / pregunta en Thinking */}
              {state === 'thinking' && (
                <g className="thinking-icon">
                  <circle
                    cx="155"
                    cy="38"
                    r="14"
                    fill="#fbbf24"
                    stroke="#d97706"
                    strokeWidth="2"
                  />
                  <text
                    x="155"
                    y="44"
                    textAnchor="middle"
                    fontFamily="Outfit, sans-serif"
                    fontWeight="900"
                    fontSize="16"
                    fill="#78350f"
                  >
                    ?
                  </text>
                </g>
              )}
            </g>
          </>
        )}

        {/* ==============================================================
            MODO INTERACCIÓN DUAL (SUCCESS / FAILURE)
            Dos árbitros separados con amplio espacio:
            1. Árbitro de banderas (Izquierda: X ~ 75)
            2. Árbitro evaluador (Derecha: X ~ 265)
               - Variante 'classic': Sensei con cabellera completa SIN COLA
               - Variante 'curly_glasses': Sensei de tez morena suave, pelo colocho y lentes
            ============================================================== */}
        {isDual && (
          <>
            {/* Sombras en el suelo con separación amplia */}
            <ellipse
              cx="75"
              cy="205"
              rx="38"
              ry="7"
              fill="rgba(0,0,0,0.12)"
              className="referee-shadow-left"
            />
            <ellipse
              cx="265"
              cy="205"
              rx="38"
              ry="7"
              fill="rgba(0,0,0,0.12)"
              className="referee-shadow-right"
            />

            {/* --------------------------------------------------------
                PERSONAJE 1: ÁRBITRO CON BANDERAS (LADO IZQUIERDO, X=75)
                -------------------------------------------------------- */}
            <g
              className={`flag-referee-group ${
                state === 'success' ? 'flag-referee-proud' : 'flag-referee-cower'
              }`}
            >
              {/* Piernas / Pantalón azul marino */}
              <path
                d="M 55,150 L 48,195 L 66,195 L 72,165 L 88,165 L 94,195 L 112,195 L 105,150 Z"
                fill="#1a2744"
                stroke="#111"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Zapatos negros */}
              <path
                d="M 45,195 Q 36,195 36,202 L 66,202 L 66,195 Z"
                fill="#222"
                stroke="#111"
                strokeWidth="3"
              />
              <path
                d="M 94,195 L 94,202 L 124,202 Q 124,195 115,195 Z"
                fill="#222"
                stroke="#111"
                strokeWidth="3"
              />

              {/* Torso: Saco WKF */}
              <path
                d="M 42,108 L 118,108 L 110,162 L 50,162 Z"
                fill="#1a2744"
                stroke="#111"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Camisa celeste y corbata roja */}
              <polygon
                points="66,108 94,108 80,138"
                fill="#b3d4fc"
                stroke="#6a9fd8"
                strokeWidth="2"
              />
              <path
                d="M 77,112 L 74,138 L 80,146 L 86,138 L 83,112 Z"
                fill="#e74c3c"
                stroke="#c0392b"
                strokeWidth="2"
              />
              {/* Solapas */}
              <path
                d="M 42,108 L 66,140 L 68,162"
                fill="none"
                stroke="#10192e"
                strokeWidth="3"
              />
              <path
                d="M 118,108 L 94,140 L 92,162"
                fill="none"
                stroke="#10192e"
                strokeWidth="3"
              />
              {/* Escudo WKF */}
              <rect
                x="50"
                y="126"
                width="13"
                height="13"
                rx="2"
                fill="#23355b"
                stroke="#3d568c"
                strokeWidth="1.5"
              />
              <circle cx="56.5" cy="132.5" r="3" fill="#e74c3c" />

              {/* Brazo Izquierdo (con libreta/tablilla) */}
              <g className="flag-referee-arm-left">
                <path
                  d="M 42,110 L 19,135 L 29,145 L 50,126 Z"
                  fill="#1a2744"
                  stroke="#111"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <circle
                  cx="19"
                  cy="140"
                  r="8.5"
                  fill="#fcd5b4"
                  stroke="#333"
                  strokeWidth="2.5"
                />
                <rect
                  x="3"
                  y="132"
                  width="20"
                  height="28"
                  rx="3"
                  fill="#e2e8f0"
                  stroke="#475569"
                  strokeWidth="2"
                />
                <line
                  x1="7"
                  y1="139"
                  x2="19"
                  y2="139"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="7"
                  y1="146"
                  x2="19"
                  y2="146"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>

              {/* Brazo Derecho con banderas WKF */}
              {state === 'success' ? (
                <g className="flag-referee-flags-raised">
                  <path
                    d="M 118,110 L 135,84 L 147,94 L 113,124 Z"
                    fill="#1a2744"
                    stroke="#111"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="139"
                    cy="86"
                    r="8.5"
                    fill="#fcd5b4"
                    stroke="#333"
                    strokeWidth="2.5"
                  />
                  {/* Vara de bandera levantada */}
                  <line
                    x1="139"
                    y1="120"
                    x2="139"
                    y2="38"
                    stroke="#78350f"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Bandera Roja (AKA) flameando */}
                  <path
                    d="M 139,42 L 167,50 L 167,66 L 139,60 Z"
                    fill="#ff4b4b"
                    stroke="#d63030"
                    strokeWidth="2"
                  />
                  {/* Bandera Azul (AO) flameando */}
                  <path
                    d="M 139,66 L 167,74 L 167,90 L 139,84 Z"
                    fill="#1cb0f6"
                    stroke="#1588be"
                    strokeWidth="2"
                  />
                </g>
              ) : (
                <g className="flag-referee-flags-drooped">
                  <path
                    d="M 118,110 L 131,140 L 120,148 L 106,124 Z"
                    fill="#1a2744"
                    stroke="#111"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="125"
                    cy="144"
                    r="8"
                    fill="#fcd5b4"
                    stroke="#333"
                    strokeWidth="2.5"
                  />
                  {/* Vara caída hacia el suelo */}
                  <line
                    x1="125"
                    y1="110"
                    x2="125"
                    y2="182"
                    stroke="#78350f"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Bandera Roja caída */}
                  <path
                    d="M 125,146 L 147,152 L 147,166 L 125,160 Z"
                    fill="#ff4b4b"
                    stroke="#d63030"
                    strokeWidth="1.5"
                  />
                  {/* Bandera Azul caída */}
                  <path
                    d="M 125,162 L 147,168 L 147,182 L 125,176 Z"
                    fill="#1cb0f6"
                    stroke="#1588be"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {/* Cabeza Chibi del Árbitro de banderas con cabellera completa */}
              <g className="flag-referee-head">
                <path
                  d="M 39,68 C 37,42 59,32 75,32 C 91,32 105,42 105,68 C 99,56 87,52 75,52 C 59,52 47,58 39,68 Z"
                  fill="#2d3748"
                />
                <circle
                  cx="75"
                  cy="72"
                  r="36"
                  fill="#fcd5b4"
                  stroke="#333"
                  strokeWidth="3.5"
                />
                {/* Cabellera frontal peinada completa */}
                <path
                  d="M 39,66 C 39,42 57,34 75,34 C 95,34 105,44 105,66 C 99,52 89,48 75,48 C 59,48 49,54 39,66 Z"
                  fill="#2d3748"
                  stroke="#1a202c"
                  strokeWidth="1.5"
                />
                <path d="M 39,62 Q 41,76 45,82 L 45,72 Z" fill="#2d3748" />
                <path d="M 105,62 Q 103,76 99,82 L 99,72 Z" fill="#2d3748" />

                {/* Silbato */}
                <path
                  d="M 72,92 L 70,102 L 80,102 L 78,92 Z"
                  fill="#94a3b8"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <circle
                  cx="79"
                  cy="102"
                  r="2.8"
                  fill="#cbd5e1"
                  stroke="#475569"
                  strokeWidth="1.5"
                />

                {/* Expresión facial según Success / Failure */}
                {state === 'success' ? (
                  <>
                    {/* Ojos felices (^ ^) */}
                    <path
                      d="M 57,74 Q 62,67 67,74"
                      fill="none"
                      stroke="#2d3748"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 85,74 Q 90,67 95,74"
                      fill="none"
                      stroke="#2d3748"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Cejas contentas */}
                    <path
                      d="M 54,61 Q 62,57 68,62"
                      fill="none"
                      stroke="#333"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 98,61 Q 90,57 84,62"
                      fill="none"
                      stroke="#333"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Sonrisa orgullosa y feliz */}
                    <path
                      d="M 67,84 Q 75,95 83,84 Z"
                      fill="#e74c3c"
                      stroke="#2d3748"
                      strokeWidth="2"
                    />
                    {/* Sonrojo */}
                    <ellipse
                      cx="53"
                      cy="82"
                      rx="5"
                      ry="3.5"
                      fill="rgba(244,164,96,0.5)"
                    />
                    <ellipse
                      cx="97"
                      cy="82"
                      rx="5"
                      ry="3.5"
                      fill="rgba(244,164,96,0.5)"
                    />
                  </>
                ) : (
                  <>
                    {/* Ojos cerrados de pena / vergüenza (> <) */}
                    <path
                      d="M 56,71 L 63,76 L 56,81"
                      fill="none"
                      stroke="#2d3748"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 94,71 L 87,76 L 94,81"
                      fill="none"
                      stroke="#2d3748"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Cejas caídas preocupadas */}
                    <path
                      d="M 53,66 Q 61,60 67,63"
                      fill="none"
                      stroke="#333"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 97,66 Q 89,60 83,63"
                      fill="none"
                      stroke="#333"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Boca ondulada avergonzada */}
                    <path
                      d="M 69,88 Q 72,85 75,88 Q 78,91 81,88"
                      fill="none"
                      stroke="#2d3748"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Gota gigante de sudor frío estilo manga goteando */}
                    <path
                      d="M 45,52 Q 38,61 38,68 A 7 7 0 0 0 52,68 Q 52,61 45,52 Z"
                      fill="#38bdf8"
                      stroke="#0284c7"
                      strokeWidth="1.8"
                      className="referee-sweat-drop"
                    />
                  </>
                )}
              </g>
            </g>

            {/* --------------------------------------------------------
                PERSONAJE 2: ÁRBITRO EVALUADOR (LADO DERECHO, X=265)
                Gran separación respecto al árbitro de banderas
                Variantes:
                A) 'classic': Sensei con cabellera completa natural (SIN COLA)
                B) 'curly_glasses': Sensei de tez morena suave, pelo colocho y lentes
                -------------------------------------------------------- */}
            <g className="ponytail-referee-group ponytail-enter-group">
              {/* Piernas / Pantalón azul marino oscuro WKF */}
              <path
                d="M 245,150 L 238,195 L 256,195 L 262,165 L 278,165 L 284,195 L 302,195 L 295,150 Z"
                fill="#1a2744"
                stroke="#111"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Zapatos formales negros */}
              <path
                d="M 235,195 Q 226,195 226,202 L 256,202 L 256,195 Z"
                fill="#222"
                stroke="#111"
                strokeWidth="3"
              />
              <path
                d="M 284,195 L 284,202 L 314,202 Q 314,195 305,195 Z"
                fill="#222"
                stroke="#111"
                strokeWidth="3"
              />

              {/* Torso: Saco azul marino oficial WKF */}
              <path
                d="M 232,108 L 308,108 L 300,162 L 240,162 Z"
                fill="#1a2744"
                stroke="#111"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Camisa celeste y corbata roja oficial */}
              <polygon
                points="256,108 284,108 270,138"
                fill="#b3d4fc"
                stroke="#6a9fd8"
                strokeWidth="2"
              />
              <path
                d="M 267,112 L 264,138 L 270,146 L 276,138 L 273,112 Z"
                fill="#e74c3c"
                stroke="#c0392b"
                strokeWidth="2"
              />
              {/* Solapas */}
              <path
                d="M 232,108 L 256,140 L 258,162"
                fill="none"
                stroke="#10192e"
                strokeWidth="3"
              />
              <path
                d="M 308,108 L 284,140 L 282,162"
                fill="none"
                stroke="#10192e"
                strokeWidth="3"
              />
              {/* Escudo WKF */}
              <rect
                x="282"
                y="126"
                width="13"
                height="13"
                rx="2"
                fill="#23355b"
                stroke="#3d568c"
                strokeWidth="1.5"
              />
              <circle cx="288.5" cy="132.5" r="3" fill="#e74c3c" />

              {/* ====================================================
                  BRAZOS Y GESTOS SEGÚN SUCCESS O FAILURE
                  ==================================================== */}
              {state === 'success' ? (
                /* ÉXITO: Da su aprobación con PULGAR ARRIBA (Thumbs Up) */
                <g className="ponytail-success-arms">
                  {/* Brazo Izquierdo (su izquierda, descansando al lado) */}
                  <path
                    d="M 308,110 L 321,132 L 311,144 L 298,126 Z"
                    fill="#1a2744"
                    stroke="#111"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="318"
                    cy="138"
                    r="8"
                    fill={reviewerSkin}
                    stroke={reviewerStroke}
                    strokeWidth="2.5"
                  />

                  {/* Brazo Derecho: Extendido hacia el árbitro con PULGAR ARRIBA 👍 */}
                  <g className="ponytail-thumbs-up-group">
                    <path
                      d="M 232,110 L 199,118 L 200,132 L 230,128 Z"
                      fill="#1a2744"
                      stroke="#111"
                      strokeWidth="3.5"
                      strokeLinejoin="round"
                    />
                    {/* Puño de la mano */}
                    <circle
                      cx="195"
                      cy="125"
                      r="9"
                      fill={reviewerSkin}
                      stroke={reviewerStroke}
                      strokeWidth="2.5"
                    />
                    {/* Dedo pulgar hacia arriba con aprobación 👍 */}
                    <path
                      d="M 190,123 L 190,105 Q 195,100 200,105 L 200,123 Z"
                      fill={reviewerSkin}
                      stroke={reviewerStroke}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    {/* Líneas de dinamismo en el pulgar */}
                    <path
                      d="M 195,97 L 195,91"
                      stroke="#16a34a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 186,101 L 181,97"
                      stroke="#16a34a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 204,101 L 209,97"
                      stroke="#16a34a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </g>
                </g>
              ) : (
                /* FALLO: Reprimenda con MANOS EN LAS CADERAS y SEÑALANDO CON EL DEDO como señora enojada */
                <g className="ponytail-reprimand-arms">
                  {/* Brazo Izquierdo: MANO FIRME EN LA CADERA (codo en ángulo hacia afuera) */}
                  <path
                    d="M 308,110 L 332,134 L 317,148 L 296,136 Z"
                    fill="#1a2744"
                    stroke="#111"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  {/* Mano en la cadera */}
                  <ellipse
                    cx="295"
                    cy="143"
                    rx="8.5"
                    ry="7.5"
                    fill={reviewerSkin}
                    stroke={reviewerStroke}
                    strokeWidth="2.5"
                  />

                  {/* Brazo Derecho: SEÑALANDO CON EL DEDO ÍNDICE hacia el árbitro a la distancia */}
                  <g className="ponytail-finger-scold">
                    <path
                      d="M 232,110 L 182,114 L 182,128 L 230,127 Z"
                      fill="#1a2744"
                      stroke="#111"
                      strokeWidth="3.5"
                      strokeLinejoin="round"
                    />
                    {/* Puño cerrado */}
                    <ellipse
                      cx="180"
                      cy="121"
                      rx="7.5"
                      ry="8"
                      fill={reviewerSkin}
                      stroke={reviewerStroke}
                      strokeWidth="2.5"
                    />
                    {/* Dedo índice extendido señalando acusadoramente */}
                    <path
                      d="M 178,115 L 150,115 Q 145,118 150,121 L 178,121 Z"
                      fill={reviewerSkin}
                      stroke={reviewerStroke}
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                    {/* Líneas de impacto del regaño (señalando con fuerza) */}
                    <path
                      d="M 144,112 L 137,108"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 142,118 L 134,118"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 144,124 L 137,128"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </g>
                </g>
              )}

              {/* Cuello */}
              <rect
                x="259"
                y="98"
                width="12"
                height="12"
                fill={reviewerSkin}
                stroke={reviewerStroke}
                strokeWidth="3"
              />

              {/* Cabeza Chibi del Árbitro Evaluador */}
              <g className="ponytail-referee-head">
                {/* ----------------------------------------------------
                    CABELLERA COMPLETA SEGÚN VARIANTE
                    ---------------------------------------------------- */}
                {!isCurly ? (
                  /* VARIANTE 1: Sensei con cabellera completa SIN COLA */
                  <>
                    {/* Cabello de fondo que cubre completamente la cabeza */}
                    <path
                      d="M 228,72 C 226,45 244,32 266,32 C 288,32 304,45 304,72 C 297,56 284,50 266,50 C 248,50 237,56 228,72 Z"
                      fill="#1e293b"
                    />
                    {/* Rostro */}
                    <circle
                      cx="265"
                      cy="72"
                      r="36"
                      fill={reviewerSkin}
                      stroke={reviewerStroke}
                      strokeWidth="3.5"
                    />
                    {/* Cabello frontal completo con peinado limpio (SIN COLA) */}
                    <path
                      d="M 229,66 C 229,42 247,32 267,32 C 290,32 303,42 303,66 C 296,54 285,50 268,50 C 252,50 240,56 229,66 Z"
                      fill="#1e293b"
                    />
                    {/* Mechones laterales que enmarcan la cara con naturalidad */}
                    <path
                      d="M 229,62 Q 231,76 235,82 L 235,70 Z"
                      fill="#1e293b"
                    />
                    <path
                      d="M 303,62 Q 301,76 297,82 L 297,70 Z"
                      fill="#1e293b"
                    />
                  </>
                ) : (
                  /* VARIANTE 2: Sensei de tez morena suave con PELO COLOCHO (rizado) y LENTES */
                  <>
                    {/* Cabello rizado / colocho abundante cubriendo toda la cabeza */}
                    <path
                      d="M 226,72 C 222,60 226,46 235,40 C 232,30 244,24 256,26 C 266,20 280,22 288,30 C 298,26 308,36 306,48 C 314,56 310,70 304,76 C 307,86 300,95 290,95 C 288,80 294,65 282,58 C 270,52 250,54 238,65 C 230,72 228,72 226,72 Z"
                      fill="#171717"
                      stroke="#0a0a0a"
                      strokeWidth="2"
                    />
                    {/* Rostro de tez morena suave */}
                    <circle
                      cx="265"
                      cy="72"
                      r="36"
                      fill={reviewerSkin}
                      stroke={reviewerStroke}
                      strokeWidth="3.5"
                    />
                    {/* Rizos / colochos en la frente (elevados para despejar frente y cejas) */}
                    <path
                      d="M 231,58 Q 237,48 245,53 Q 254,44 265,50 Q 275,44 284,50 Q 292,47 299,57"
                      fill="#171717"
                      stroke="#171717"
                      strokeWidth="2"
                    />
                    {/* Espirales y definición de pelo colocho */}
                    <path
                      d="M 247,36 Q 255,32 261,38"
                      fill="none"
                      stroke="#333333"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 271,32 Q 279,30 283,36"
                      fill="none"
                      stroke="#333333"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 257,46 Q 265,42 271,48"
                      fill="none"
                      stroke="#333333"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 286,48 Q 294,46 297,54"
                      fill="none"
                      stroke="#333333"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Silbato en el cuello */}
                <path
                  d="M 262,92 L 260,102 L 270,102 L 268,92 Z"
                  fill="#94a3b8"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <circle
                  cx="269"
                  cy="102"
                  r="2.8"
                  fill="#cbd5e1"
                  stroke="#475569"
                  strokeWidth="1.5"
                />

                {/* Expresión facial del Árbitro Evaluador */}
                {state === 'success' ? (
                  <>
                    {/* Ojos felices sonrientes (^ ^) */}
                    <path
                      d="M 247,74 Q 252,67 257,74"
                      fill="none"
                      stroke={reviewerStroke}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 275,74 Q 280,67 285,74"
                      fill="none"
                      stroke={reviewerStroke}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Cejas amables aprobando (más finas y estéticas en el árbitro moreno) */}
                    <path
                      d={isCurly ? "M 245,58 Q 251,55 256,59" : "M 244,61 Q 252,57 258,62"}
                      fill="none"
                      stroke={isCurly ? "#4a3525" : reviewerStroke}
                      strokeWidth={isCurly ? "1.8" : "2.2"}
                      strokeLinecap="round"
                    />
                    <path
                      d={isCurly ? "M 285,58 Q 279,55 274,59" : "M 288,61 Q 280,57 274,62"}
                      fill="none"
                      stroke={isCurly ? "#4a3525" : reviewerStroke}
                      strokeWidth={isCurly ? "1.8" : "2.2"}
                      strokeLinecap="round"
                    />
                    {/* Sonrisa cálida de felicitación */}
                    <path
                      d="M 257,84 Q 265,94 273,84 Z"
                      fill="#e74c3c"
                      stroke={reviewerStroke}
                      strokeWidth="2"
                    />
                    {/* Sonrojo */}
                    <ellipse
                      cx="243"
                      cy="82"
                      rx="5"
                      ry="3.5"
                      fill={isCurly ? 'rgba(168,85,24,0.35)' : 'rgba(244,164,96,0.5)'}
                    />
                    <ellipse
                      cx="287"
                      cy="82"
                      rx="5"
                      ry="3.5"
                      fill={isCurly ? 'rgba(168,85,24,0.35)' : 'rgba(244,164,96,0.5)'}
                    />
                  </>
                ) : (
                  <>
                    {/* Cejas fruncidas de regaño severo (delicadas y no prominentes para el árbitro moreno) */}
                    <path
                      d={isCurly ? "M 245,59 L 256,64" : "M 243,62 L 256,68"}
                      stroke={isCurly ? "#4a3525" : "#0f172a"}
                      strokeWidth={isCurly ? "1.8" : "2.6"}
                      strokeLinecap="round"
                    />
                    <path
                      d={isCurly ? "M 285,59 L 274,64" : "M 287,62 L 274,68"}
                      stroke={isCurly ? "#4a3525" : "#0f172a"}
                      strokeWidth={isCurly ? "1.8" : "2.6"}
                      strokeLinecap="round"
                    />
                    {/* Ojos mirando severos */}
                    <circle cx="251" cy="74" r="4.2" fill="#0f172a" />
                    <circle cx="279" cy="74" r="4.2" fill="#0f172a" />
                    <circle cx="249.5" cy="72.5" r="1.3" fill="#ffffff" />
                    <circle cx="277.5" cy="72.5" r="1.3" fill="#ffffff" />

                    {/* Boca abierta regañando como señora enojada */}
                    <path
                      d="M 258,84 Q 265,79 272,84 Q 272,94 265,94 Q 258,94 258,84 Z"
                      fill="#991b1b"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    <rect
                      x="260"
                      y="84"
                      width="10"
                      height="3"
                      rx="1"
                      fill="#ffffff"
                    />

                    {/* Vena de ira estilo manga (💢) palpitando */}
                    <g className="anger-vein">
                      <path
                        d="M 282,40 Q 286,42 290,40 M 290,40 Q 292,44 290,48 M 290,48 Q 286,46 282,48 M 282,48 Q 280,44 282,40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </g>
                  </>
                )}

                {/* ----------------------------------------------------
                    LENTES PARA LA VARIANTE CON LENTES ('curly_glasses')
                    ---------------------------------------------------- */}
                {isCurly && (
                  <g className="referee-glasses">
                    {/* Marco Izquierdo */}
                    <rect
                      x="240"
                      y="65"
                      width="20"
                      height="16"
                      rx="4"
                      fill="rgba(224, 242, 254, 0.22)"
                      stroke="#1e293b"
                      strokeWidth="2.5"
                    />
                    {/* Marco Derecho */}
                    <rect
                      x="270"
                      y="65"
                      width="20"
                      height="16"
                      rx="4"
                      fill="rgba(224, 242, 254, 0.22)"
                      stroke="#1e293b"
                      strokeWidth="2.5"
                    />
                    {/* Puente central */}
                    <path
                      d="M 260,72 Q 265,69 270,72"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="2.5"
                    />
                    {/* Patillas hacia las orejas */}
                    <line
                      x1="240"
                      y1="72"
                      x2="230"
                      y2="71"
                      stroke="#1e293b"
                      strokeWidth="2"
                    />
                    <line
                      x1="290"
                      y1="72"
                      x2="300"
                      y2="71"
                      stroke="#1e293b"
                      strokeWidth="2"
                    />
                    {/* Brillo en los cristales */}
                    <line
                      x1="244"
                      y1="68"
                      x2="254"
                      y2="78"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                    <line
                      x1="274"
                      y1="68"
                      x2="284"
                      y2="78"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  </g>
                )}
              </g>
            </g>

            {/* ==========================================================
                INSIGNIA FLOTANTE DE ACCIÓN (APROBADO vs REGAÑO)
                ========================================================== */}
            {state === 'success' && (
              <g className="approval-badge">
                <rect
                  x="125"
                  y="8"
                  width="110"
                  height="28"
                  rx="9"
                  fill="#16a34a"
                  stroke="#15803d"
                  strokeWidth="2"
                />
                <text
                  x="180"
                  y="26"
                  textAnchor="middle"
                  fontFamily="Outfit, sans-serif"
                  fontWeight="900"
                  fontSize="12.5"
                  fill="#ffffff"
                  letterSpacing="0.5"
                >
                  ✓ ¡APROBADO!
                </text>
                {/* Estrellitas de celebración ✨ */}
                <g className="sparkle-pop">
                  <path
                    d="M 112,20 Q 114,15 119,15 Q 114,15 112,10 Q 110,15 105,15 Q 110,15 112,20 Z"
                    fill="#eab308"
                  />
                  <path
                    d="M 248,20 Q 250,15 255,15 Q 250,15 248,10 Q 246,15 241,15 Q 246,15 248,20 Z"
                    fill="#eab308"
                  />
                </g>
              </g>
            )}

            {state === 'failure' && (
              <g className="reprimand-badge">
                <rect
                  x="205"
                  y="8"
                  width="120"
                  height="28"
                  rx="9"
                  fill="#dc2626"
                  stroke="#991b1b"
                  strokeWidth="2"
                />
                <text
                  x="265"
                  y="26"
                  textAnchor="middle"
                  fontFamily="Outfit, sans-serif"
                  fontWeight="900"
                  fontSize="11.5"
                  fill="#ffffff"
                  letterSpacing="0.3"
                >
                  💢 ¡A ESTUDIAR!
                </text>
              </g>
            )}
          </>
        )}
      </svg>
    </div>
  );
}
