import React from 'react';

export default function KaratecaMascot({ state = 'idle', modality = 'kata' }) {
  // state can be: 'idle', 'thinking', 'success', 'failure'
  // modality can be: 'kata', 'kumite'
  
  const leftFistColor = modality === 'kumite' ? '#ff4b4b' : '#fcd5b4';
  const rightFistColor = modality === 'kumite' ? '#1cb0f6' : '#fcd5b4';
  
  const isKumiteSuccess = state === 'success' && modality === 'kumite';
  const isKataSuccess = state === 'success' && modality === 'kata';
  const svgViewBox = isKumiteSuccess ? "0 0 320 230" : "0 0 200 220";
  
  return (
    <div className={`mascot-container mascot-state-${state} mascot-modality-${modality} ${isKumiteSuccess ? 'kumite-success-wide' : ''}`}>
      <svg
        viewBox={svgViewBox}
        className="karateca-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ========= WKF REFEREE (only in Kumite Success) ========= */}
        {isKumiteSuccess && (
          <g className="wkf-referee">
            {/* Referee Shadow */}
            <ellipse cx="60" cy="210" rx="30" ry="6" fill="rgba(0,0,0,0.12)" />

            {/* Referee Body */}
            <g className="referee-body-group">
              {/* Pants (dark navy) */}
              <path d="M 43,160 L 38,200 L 52,200 L 55,172 L 65,172 L 68,200 L 82,200 L 77,160 Z" fill="#1a2744" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
              {/* Shoes */}
              <path d="M 36,200 Q 30,200 30,205 L 52,205 L 52,200 Z" fill="#333" stroke="#111" strokeWidth="2.5" />
              <path d="M 68,200 L 68,205 L 90,205 Q 90,200 84,200 Z" fill="#333" stroke="#111" strokeWidth="2.5" />

              {/* Blazer (dark navy) */}
              <path d="M 38,110 L 82,110 L 77,165 L 43,165 Z" fill="#1a2744" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
              {/* Shirt (light blue) visible in V-shape */}
              <path d="M 52,110 L 60,140 L 68,110" fill="#b3d4fc" stroke="#6a9fd8" strokeWidth="2" />
              {/* Red tie */}
              <path d="M 58,114 L 56,142 L 60,145 L 64,142 L 62,114 Z" fill="#e74c3c" stroke="#c0392b" strokeWidth="1.5" />

              {/* Left Arm (down, relaxed) */}
              <g className="referee-left-arm">
                <path d="M 38,112 L 20,130 L 26,142 L 40,126 Z" fill="#1a2744" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
                <circle cx="22" cy="136" r="7" fill="#fcd5b4" stroke="#333" strokeWidth="3" />
              </g>

              {/* Right Arm (raised high for IPPON!) */}
              <g className="referee-right-arm">
                <path d="M 82,112 L 94,80 L 86,74 L 78,108 Z" fill="#1a2744" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
                {/* Hand raised */}
                <circle cx="90" cy="72" r="7" fill="#fcd5b4" stroke="#333" strokeWidth="3" />
                {/* Flag / signal marker (red) */}
                <rect x="86" y="42" width="8" height="30" rx="2" fill="#e74c3c" stroke="#c0392b" strokeWidth="2" />
                <path d="M 94,42 L 114,36 L 114,52 L 94,48 Z" fill="#e74c3c" stroke="#c0392b" strokeWidth="1.5" />
              </g>

              {/* Referee Head */}
              <rect x="54" y="100" width="12" height="12" fill="#fcd5b4" stroke="#333" strokeWidth="3" />
              <circle cx="60" cy="80" r="25" fill="#fcd5b4" stroke="#333" strokeWidth="3" />
              {/* Hair (short, dark, neat) */}
              <path d="M 38,68 Q 60,48 82,68 Q 72,58 60,58 Q 48,58 38,68 Z" fill="#2d3748" />
              {/* Eyes (serious / focused) */}
              <circle cx="52" cy="78" r="3" fill="#2d3748" />
              <circle cx="68" cy="78" r="3" fill="#2d3748" />
              <circle cx="51" cy="77" r="1" fill="#fff" />
              <circle cx="67" cy="77" r="1" fill="#fff" />
              {/* Eyebrows (stern) */}
              <path d="M 46,72 L 56,73" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 64,73 L 74,72" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
              {/* Mouth (serious thin line) */}
              <line x1="55" y1="86" x2="65" y2="86" stroke="#2d3748" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* ========= ¡IPPON! Banner (only in Kumite Success) ========= */}
        {isKumiteSuccess && (
          <g className="ippon-banner">
            <rect x="85" y="8" width="100" height="36" rx="12" fill="#ffc800" stroke="#e6b400" strokeWidth="3" />
            <text x="135" y="32" textAnchor="middle" fontFamily="Outfit, sans-serif" fontWeight="800" fontSize="18" fill="#1a1a1a">¡IPPON!</text>
          </g>
        )}

        {/* ========= KIAI! Banner (only in Kata Success) ========= */}
        {isKataSuccess && (
          <g className="kiai-banner">
            <rect x="50" y="5" width="100" height="36" rx="12" fill="#e74c3c" stroke="#c0392b" strokeWidth="3" />
            <text x="100" y="30" textAnchor="middle" fontFamily="Outfit, sans-serif" fontWeight="800" fontSize="20" fill="#fff" style={{ letterSpacing: '2px' }}>KIAI!!!</text>
          </g>
        )}

        {/* Shadow */}
        <ellipse cx={isKumiteSuccess ? 220 : 100} cy={isKumiteSuccess ? 210 : 205} rx="45" ry="8" fill="rgba(0,0,0,0.15)" className="mascot-shadow" />

        {/* Mascot Body Group */}
        <g className="mascot-body-group" transform={isKumiteSuccess ? "translate(120, 0)" : undefined}>
          
          {/* === LEGS: Normal or High Kick === */}
          {isKumiteSuccess ? (
            <>
              {/* Supporting left leg (slightly bent) */}
              <path d="M 80,150 L 75,195 L 95,195 L 95,160 Z" fill="#ffffff" stroke="#333" strokeWidth="4" strokeLinejoin="round" />
              <path d="M 73,195 Q 63,195 63,201 L 95,201 L 95,195 Z" fill="#e9c46a" stroke="#333" strokeWidth="4" />
              
              {/* Kicking right leg (extended high to the right) */}
              <path d="M 100,150 L 160,85 L 170,95 L 115,155 Z" fill="#ffffff" stroke="#333" strokeWidth="4" strokeLinejoin="round" />
              {/* Kicking foot */}
              <path d="M 160,85 L 175,78 L 178,88 L 170,95 Z" fill="#e9c46a" stroke="#333" strokeWidth="4" strokeLinejoin="round" />
            </>
          ) : isKataSuccess ? (
            <>
              {/* Kiba Dachi (Horse stance) */}
              <path d="M 75,150 L 50,195 L 70,195 L 95,160 L 105,160 L 130,195 L 150,195 L 125,150 Z" fill="#ffffff" stroke="#333" strokeWidth="4" strokeLinejoin="round" />
              <path d="M 48,195 Q 38,195 38,201 L 72,201 L 72,195 Z" fill="#e9c46a" stroke="#333" strokeWidth="4" />
              <path d="M 128,195 L 128,201 L 162,201 Q 162,195 152,195 Z" fill="#e9c46a" stroke="#333" strokeWidth="4" />
            </>
          ) : (
            <>
              {/* Normal standing legs */}
              <path d="M 75,150 L 70,195 L 90,195 L 95,165 L 105,165 L 110,195 L 130,195 L 125,150 Z" fill="#ffffff" stroke="#333" strokeWidth="4" strokeLinejoin="round" />
              <path d="M 68,195 Q 58,195 58,201 L 90,201 L 90,195 Z" fill="#e9c46a" stroke="#333" strokeWidth="4" />
              <path d="M 110,195 L 110,201 L 142,201 Q 142,195 132,195 Z" fill="#e9c46a" stroke="#333" strokeWidth="4" />
            </>
          )}

          {/* Karate Gi Torso */}
          <path d={isKumiteSuccess ? "M 65,110 L 135,110 L 125,155 L 75,155 Z" : "M 65,110 L 135,110 L 125,160 L 75,160 Z"} fill="#ffffff" stroke="#333" strokeWidth="4" strokeLinejoin="round" />
          
          {/* Gi Lapels (V neck) */}
          <path d="M 85,110 L 100,145 L 115,110" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
          <path d="M 78,110 L 100,145" fill="none" stroke="#dcdcdc" strokeWidth="3" />
          <path d="M 122,110 L 100,145" fill="none" stroke="#dcdcdc" strokeWidth="3" />

          {/* Black Belt */}
          <rect x="73" y="148" width="54" height="12" rx="4" fill="#1a1a1a" stroke="#333" strokeWidth="3" />
          {/* Belt Knots hanging down */}
          <path d="M 94,158 L 90,180 Q 86,183 80,175" fill="none" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" className="belt-tie-left" />
          <path d="M 103,158 L 108,182 Q 112,185 118,177" fill="none" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" className="belt-tie-right" />

          {/* Left Arm */}
          <g className="mascot-left-arm">
            {/* Gi sleeve */}
            <path d="M 65,112 L 40,125 L 48,140 L 68,125 Z" fill="#ffffff" stroke="#333" strokeWidth="4" strokeLinejoin="round" />
            {/* Chibi Fist - Aka Glove (Red) in Kumite */}
            <circle cx="38" cy="132" r="10" fill={leftFistColor} stroke="#333" strokeWidth="4" />
            {modality === 'kumite' && (
              <rect x="33" y="128" width="10" height="4" fill="#ffffff" rx="1.5" stroke="#333" strokeWidth="2.5" />
            )}
          </g>

          {/* Right Arm */}
          <g className="mascot-right-arm">
            {/* Gi sleeve */}
            <path d="M 135,112 L 160,125 L 152,140 L 132,125 Z" fill="#ffffff" stroke="#333" strokeWidth="4" strokeLinejoin="round" />
            {/* Chibi Fist - Ao Glove (Blue) in Kumite */}
            <circle cx="162" cy="132" r="10" fill={rightFistColor} stroke="#333" strokeWidth="4" />
            {modality === 'kumite' && (
              <rect x="157" y="128" width="10" height="4" fill="#ffffff" rx="1.5" stroke="#333" strokeWidth="2.5" />
            )}
          </g>

          {/* Head & Neck */}
          <rect x="92" y="98" width="16" height="15" fill="#fcd5b4" stroke="#333" strokeWidth="4" />
          
          {/* Mascot Head Group */}
          <g className="mascot-head-group">
            {/* Face */}
            <circle cx="100" cy="70" r="42" fill="#fcd5b4" stroke="#333" strokeWidth="4" />
            
            {/* Red Karate Headband (Hachimaki) */}
            <path d="M 61,48 C 75,34 125,34 139,48 L 137,60 C 125,48 75,48 63,60 Z" fill="#e76f51" stroke="#333" strokeWidth="4" strokeLinejoin="round" />
            {/* Headband Ties on the side */}
            <g className="headband-ties">
              <path d="M 137,54 Q 155,54 158,68 Q 160,78 152,80" fill="none" stroke="#e76f51" strokeWidth="6" strokeLinecap="round" />
              <path d="M 137,54 Q 150,45 162,48" fill="none" stroke="#e76f51" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* Hair (Black spiky top) */}
            <path d="M 68,40 Q 100,10 132,40 Q 120,32 100,32 Q 80,32 68,40 Z" fill="#2d3748" />

            {/* Cheeks (Blushing pink) */}
            <ellipse cx="72" cy="80" rx="6" ry="4" fill="rgba(244,164,96,0.5)" className="mascot-blush" />
            <ellipse cx="128" cy="80" rx="6" ry="4" fill="rgba(244,164,96,0.5)" className="mascot-blush" />

            {/* Eyes */}
            <g className="mascot-eyes">
              {state === 'idle' && (
                <>
                  <circle cx="85" cy="72" r="5" fill="#2d3748" className="eye-left-ball" />
                  <circle cx="115" cy="72" r="5" fill="#2d3748" className="eye-right-ball" />
                  {/* Highlights */}
                  <circle cx="83.5" cy="70.5" r="1.5" fill="#ffffff" />
                  <circle cx="113.5" cy="70.5" r="1.5" fill="#ffffff" />
                </>
              )}
              {state === 'thinking' && (
                <>
                  {/* Eyes looking to the side/up */}
                  <circle cx="88" cy="70" r="5" fill="#2d3748" className="eye-think-left" />
                  <circle cx="118" cy="70" r="5" fill="#2d3748" className="eye-think-right" />
                  <circle cx="87" cy="68.5" r="1.5" fill="#ffffff" />
                  <circle cx="117" cy="68.5" r="1.5" fill="#ffffff" />
                </>
              )}
              {state === 'success' && (
                <>
                  {/* Happy closed arched eyes ^ ^ */}
                  <path d="M 77,74 Q 85,64 93,74" fill="none" stroke="#2d3748" strokeWidth="5" strokeLinecap="round" />
                  <path d="M 107,74 Q 115,64 123,74" fill="none" stroke="#2d3748" strokeWidth="5" strokeLinecap="round" />
                </>
              )}
              {state === 'failure' && (
                <>
                  {/* Sad or squished eyes > < */}
                  <path d="M 77,68 L 91,76 M 77,76 L 91,68" fill="none" stroke="#2d3748" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M 109,68 L 123,76 M 109,76 L 123,68" fill="none" stroke="#2d3748" strokeWidth="4.5" strokeLinecap="round" />
                </>
              )}
            </g>

            {/* Eyebrows */}
            <g className="mascot-eyebrows">
              {state === 'idle' && (
                <>
                  <path d="M 75,61 Q 85,59 91,64" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 125,61 Q 115,59 109,64" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
                </>
              )}
              {state === 'thinking' && (
                <>
                  <path d="M 77,59 Q 85,57 93,64" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 123,63 Q 115,59 107,61" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
                </>
              )}
              {state === 'success' && (
                <>
                  <path d="M 74,58 Q 84,54 92,60" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 126,58 Q 116,54 108,60" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
                </>
              )}
              {state === 'failure' && (
                <>
                  {/* Worried slanted brows */}
                  <path d="M 76,64 Q 84,59 92,57" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 124,64 Q 116,59 108,57" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
                </>
              )}
            </g>

            {/* Mouth */}
            <g className="mascot-mouth">
              {state === 'idle' && (
                <path d="M 94,85 Q 100,90 106,85" fill="none" stroke="#2d3748" strokeWidth="3" strokeLinecap="round" />
              )}
              {state === 'thinking' && (
                <line x1="94" y1="84" x2="106" y2="84" stroke="#2d3748" strokeWidth="3" strokeLinecap="round" />
              )}
              {state === 'success' && (
                // Happy open mouth (smiling)
                <path d="M 90,82 Q 100,96 110,82 Z" fill="#e76f51" stroke="#2d3748" strokeWidth="3" strokeLinejoin="round" />
              )}
              {state === 'failure' && (
                // Sad mouth curve
                <path d="M 94,88 Q 100,80 106,88" fill="none" stroke="#2d3748" strokeWidth="3" strokeLinecap="round" />
              )}
            </g>
            
            {/* Sweat Drop for Failure state */}
            {state === 'failure' && (
              <path d="M 132,58 C 132,58 138,62 136,68 C 134,72 128,72 128,68 C 128,64 132,58 132,58 Z" fill="#64b5f6" className="sweat-drop" />
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
