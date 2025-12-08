import React from "react";

export default function Loader() {
    return (
        <div style={styles.container}>
            <img
                src="images/eclogo.png"
                alt="Easy Coders Loader"
                style={styles.logo}
            />
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#050505",
    },
    "@keyframes pulse": {
        "0%": { opacity: 0.4, transform: "scale(0.9)" },
        "100%": { opacity: 1, transform: "scale(1.1)" }
    },
    logo: {
        width: "150px",
        animation: "pulse 1.2s ease-in-out infinite alternate",
    }
};
