import logo from "../../assets/mae.png";
function PageLoader() {
  return (
    <div style={styles.overlay}>
      <div style={styles.loaderBox}>
        <img src={logo} alt="MAE" style={styles.logo} />
        <p style={styles.text}>Chargement...</p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(3px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  loaderBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
  },

  logo: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  text: {
    color: "#166534",
    fontWeight: "700",
  },
};

export default PageLoader;