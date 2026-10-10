import React from 'react';

export default function RefereeMascot({ state = 'idle', size = 'normal' }) {
  // state: 'idle', 'working', 'bye'
  return (
    <div className={`referee-mascot-container referee-state-${state} ${size === 'small' ? 'referee-small' : ''}`}>
      <svg
        viewBox="0 0 220 220"
        className="referee-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sombra */}
        <ellipse cx="110" cy="205" rx="42" ry="8" fill="rgba(0,0,0,0.12)" className="referee-shadow" />

        {/* Grupo principal del cuerpo */}
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
          <path d="M 75,195 Q 66,195 66,202 L 96,202 L 96,195 Z" fill="#222" stroke="#111" strokeWidth="3" />
          <path d="M 124,195 L 124,202 L 154,202 Q 154,195 145,195 Z" fill="#222" stroke="#111" strokeWidth="3" />

          {/* Torso: Saco azul marino oficial WKF */}
          <path
            d="M 72,108 L 148,108 L 140,162 L 80,162 Z"
            fill="#1a2744"
            stroke="#111"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Camisa celeste WKF cuello en V */}
          <polygon points="96,108 124,108 110,138" fill="#b3d4fc" stroke="#6a9fd8" strokeWidth="2" />

          {/* Corbata roja oficial WKF */}
          <path
            d="M 107,112 L 104,138 L 110,146 L 116,138 L 113,112 Z"
            fill="#e74c3c"
            stroke="#c0392b"
            strokeWidth="2"
          />

          {/* Solapas del saco */}
          <path d="M 72,108 L 96,140 L 98,162" fill="none" stroke="#10192e" strokeWidth="3" />
          <path d="M 148,108 L 124,140 L 122,162" fill="none" stroke="#10192e" strokeWidth="3" />

          {/* Escudo WKF en el bolsillo izquierdo */}
          <rect x="80" y="126" width="14" height="14" rx="2" fill="#23355b" stroke="#3d568c" strokeWidth="1.5" />
          <circle cx="87" cy="133" r="3.5" fill="#e74c3c" />

          {/* Brazo Izquierdo (sosteniendo tablilla de notas / reglamento) */}
          <g className="referee-left-arm">
            <path
              d="M 72,110 L 48,135 L 58,145 L 80,126 Z"
              fill="#1a2744"
              stroke="#111"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Mano */}
            <circle cx="48" cy="140" r="9" fill="#fcd5b4" stroke="#333" strokeWidth="3" />
            {/* Tablilla / libreta de arbitraje */}
            <rect x="28" y="130" width="24" height="34" rx="3" fill="#e2e8f0" stroke="#475569" strokeWidth="2.5" />
            <rect x="33" y="126" width="14" height="6" rx="2" fill="#94a3b8" />
            <line x1="33" y1="140" x2="47" y2="140" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
            <line x1="33" y1="147" x2="47" y2="147" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
            <line x1="33" y1="154" x2="43" y2="154" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Brazo Derecho con banderas WKF (roja y azul) o silbato */}
          <g className="referee-right-arm">
            <path
              d="M 148,110 L 172,128 L 165,140 L 140,126 Z"
              fill="#1a2744"
              stroke="#111"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Mano */}
            <circle cx="172" cy="134" r="9" fill="#fcd5b4" stroke="#333" strokeWidth="3" />

            {/* Vara de banderas */}
            <line x1="172" y1="155" x2="172" y2="85" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
            {/* Bandera Roja (AKA) */}
            <path d="M 172,88 L 198,96 L 198,112 L 172,106 Z" fill="#ff4b4b" stroke="#d63030" strokeWidth="1.5" />
            {/* Bandera Azul (AO) */}
            <path d="M 172,110 L 198,118 L 198,134 L 172,128 Z" fill="#1cb0f6" stroke="#1588be" strokeWidth="1.5" />
          </g>

          {/* Cuello */}
          <rect x="104" y="98" width="12" height="12" fill="#fcd5b4" stroke="#333" strokeWidth="3" />

          {/* Cabeza Chibi del Árbitro */}
          <g className="referee-head-group">
            <circle cx="110" cy="72" r="38" fill="#fcd5b4" stroke="#333" strokeWidth="3.5" />

            {/* Cabello formal peinado */}
            <path
              d="M 76,64 C 84,40 136,40 144,64 C 130,50 90,50 76,64 Z"
              fill="#2d3748"
              stroke="#1a202c"
              strokeWidth="1.5"
            />
            <path
              d="M 80,55 Q 110,25 140,55 Q 128,42 110,42 Q 92,42 80,55 Z"
              fill="#2d3748"
            />

            {/* Mejillas sonrojadas */}
            <ellipse cx="85" cy="82" rx="5" ry="3.5" fill="rgba(244,164,96,0.5)" />
            <ellipse cx="135" cy="82" rx="5" ry="3.5" fill="rgba(244,164,96,0.5)" />

            {/* Ojos */}
            <circle cx="95" cy="74" r="4.5" fill="#2d3748" />
            <circle cx="125" cy="74" r="4.5" fill="#2d3748" />
            <circle cx="93.5" cy="72.5" r="1.5" fill="#ffffff" />
            <circle cx="123.5" cy="72.5" r="1.5" fill="#ffffff" />

            {/* Cejas */}
            <path d="M 87,64 Q 96,62 101,66" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 133,64 Q 124,62 119,66" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />

            {/* Sonrisa amable */}
            <path d="M 104,86 Q 110,91 116,86" fill="none" stroke="#2d3748" strokeWidth="2.5" strokeLinecap="round" />

            {/* Silbato en el cuello */}
            <path d="M 107,92 L 105,102 L 115,102 L 113,92 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
            <circle cx="114" cy="102" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}
