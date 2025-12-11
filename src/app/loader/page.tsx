import React, { CSSProperties } from "react";
import Image from "next/image";
export default function Loader() {
    return (
        <div style={styles.container}>
            <div style={styles.loaderWrapper}>
                {/* Circular border */}
                <div style={styles.circle}>
                    {/* Logo in center */}
                    <img
                        src="images/eclogo.png"
                        alt="Easy Coders Loader"
                        style={styles.logo}
                    />
                </div>

                {/* Rotating dots with tails */}
                <div style={styles.dotContainer}>
                    <div style={{ ...styles.dot, ...styles.dot1 }}>
                        <div style={styles.tail}></div>
                    </div>
                    <div style={{ ...styles.dot, ...styles.dot2 }}>
                        <div style={styles.tail}></div>
                    </div>
                    <div style={{ ...styles.dot, ...styles.dot3 }}>
                        <div style={styles.tail}></div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; transform: scale(0.95); }
                    50% { opacity: 1; transform: scale(1.05); }
                }
                
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3); }
                    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.5); }
                }
            `}</style>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#050505",
    },
    loaderWrapper: {
        position: "relative",
        width: "200px",
        height: "200px",
    },
    circle: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "180px",
        height: "180px",
        borderRadius: "50%",
        border: "2px solid rgba(59, 130, 246, 0.2)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(10, 10, 10, 0.5)",
        animation: "pulse 2s ease-in-out infinite",
    },
    logo: {
        width: "100px",
        height: "100px",
        objectFit: "contain",
    },
    dotContainer: {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        animation: "rotate 3s linear infinite",
    },
    dot: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        animation: "glow 1.5s ease-in-out infinite",
    },
    dot1: {
        transform: "translate(-50%, -50%) translateY(-100px)",
    },
    dot2: {
        transform: "translate(-50%, -50%) translateY(-100px) rotate(120deg)",
        transformOrigin: "0 100px",
        animationDelay: "0.5s",
    },
    dot3: {
        transform: "translate(-50%, -50%) translateY(-100px) rotate(240deg)",
        transformOrigin: "0 100px",
        animationDelay: "1s",
    },
    tail: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "40px",
        height: "2px",
        background: "linear-gradient(90deg, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 0.6) 50%, rgba(59, 130, 246, 0) 100%)",
        transform: "translate(-100%, -50%)",
        borderRadius: "2px",
        filter: "blur(1px)",
    }
};