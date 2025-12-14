'use client';

export default function Loader() {
    return (
        <div className="loader-root">
            <div className="logo-wrapper">
                {/* CENTER GROUP */}
                <div className="center-group">
                    {/* SVG LOGO */}
                    <svg
                        width="140"
                        height="140"
                        viewBox="0 0 140 140"
                        className="logo-svg"
                    >
                        <polygon
                            points="70,5 125,37 125,103 70,135 15,103 15,37"
                            className="hexagon"
                        />
                        <circle cx="70" cy="70" r="34" className="core-glow" />
                        <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="logo-text"
                        >
                            EC
                        </text>
                    </svg>

                    {/* ORBITS */}
                    <span className="orbit orbit-1" />
                    <span className="orbit orbit-2" />
                    <span className="orbit orbit-3" />
                </div>
            </div>

            {/* TEXT */}
            <div className="brand-text">
                <span className="brand-main">Easy Coders</span>
                <span className="brand-sub">Learn • Build • Grow</span>
            </div>

            <style>{`
                .loader-root {
                    min-height: 100vh;
                    background: #050505;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }

                .logo-wrapper {
                    width: 160px;
                    height: 160px;
                    position: relative;
                }

                .center-group {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 160px;
                    height: 160px;
                }

                /* SVG */
                .logo-svg {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }

                .hexagon {
                    fill: none;
                    stroke: #00c2ff;
                    stroke-width: 2;
                    filter: drop-shadow(0 0 12px rgba(0,194,255,0.6));
                    animation: pulse 2.4s ease-in-out infinite;
                }

                .core-glow {
                    fill: rgba(0,194,255,0.18);
                    filter: blur(8px);
                    animation: glow 2s ease-in-out infinite;
                }

                .logo-text {
                    fill: #14f4ff;
                    font-size: 32px;
                    font-weight: 800;
                    font-family: system-ui;
                    text-shadow: 0 0 12px rgba(20,244,255,0.8);
                }

                /* ORBITS */
                .orbit {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    transform-origin: center;
                }

                .orbit::before {
                    content: '';
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: currentColor;
                    box-shadow: 0 0 12px currentColor;
                }

                .orbit-1 {
                    color: #00ff9d;
                    animation: orbit1 1.8s linear infinite;
                }

                .orbit-2 {
                    color: #00c2ff;
                    animation: orbit2 2.4s linear infinite reverse;
                }

                .orbit-3 {
                    color: #ffb703;
                    animation: orbit3 3s linear infinite;
                }

                /* TEXT */
                .brand-text {
                    margin-top: 26px;
                    text-align: center;
                    animation: fade-up 1.6s ease forwards;
                }

                .brand-main {
                    display: block;
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #00c2ff;
                    letter-spacing: 1px;
                }

                .brand-sub {
                    font-size: 0.85rem;
                    color: #9ca3af;
                }

                /* ANIMATIONS */
                @keyframes orbit1 {
                    from { transform: translate(-50%, -50%) rotate(0deg) translateX(70px); }
                    to   { transform: translate(-50%, -50%) rotate(360deg) translateX(70px); }
                }

                @keyframes orbit2 {
                    from { transform: translate(-50%, -50%) rotate(0deg) translateX(55px); }
                    to   { transform: translate(-50%, -50%) rotate(360deg) translateX(55px); }
                }

                @keyframes orbit3 {
                    from { transform: translate(-50%, -50%) rotate(0deg) translateX(85px); }
                    to   { transform: translate(-50%, -50%) rotate(360deg) translateX(85px); }
                }

                @keyframes pulse {
                    0%,100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }

                @keyframes glow {
                    0%,100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }

                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
