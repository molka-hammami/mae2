import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import logoMae from "../../assets/mae.png";

function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside style={styles.sidebar}>
      <div>
        <div style={styles.brandBlock}>
          <img src={logoMae} alt="MAE Logo" style={styles.logoImage} />
        </div>

        <nav style={styles.nav}>
          <NavLink
            to="/dashboard"
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.activeLink : {}),
            })}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/complaints"
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.activeLink : {}),
            })}
          >
            Réclamations
          </NavLink>

          {user?.role === "ADMIN" && (
            <NavLink
              to="/users"
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              Utilisateurs
            </NavLink>
          )}
        </nav>
      </div>

      <div style={styles.footerBlock}>
        <div style={styles.userBox}>
          <p style={styles.userName}>{user?.name || "Utilisateur"}</p>
          <p style={styles.userRole}>{user?.role || "ADMIN"}</p>
        </div>

        <button onClick={handleLogout} style={styles.button}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "280px",
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #166534 0%, #14532d 55%, #0f4d29 100%)",
    color: "#ffffff",
    padding: "26px 18px 20px 18px",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    justifyContent: "space-between",
    overflowY: "auto",
    boxSizing: "border-box",
    boxShadow: "6px 0 24px rgba(15, 23, 42, 0.08)",
  },

  brandBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    marginBottom: "34px",
    paddingTop: "4px",
  },

  logoImage: {
    width: "92px",
    height: "92px",
    objectFit: "contain",
    backgroundColor: "transparent",
    padding: 0,
    display: "block",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "10px",
  },

  link: {
    display: "block",
    textDecoration: "none",
    color: "#ffffff",
    padding: "14px 16px",
    borderRadius: "14px",
    fontWeight: "600",
    fontSize: "16px",
    transition: "all 0.2s ease",
  },

  activeLink: {
    backgroundColor: "#15803d",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
  },

  footerBlock: {
    marginTop: "20px",
  },

  userBox: {
    background: "rgba(21, 128, 61, 0.95)",
    borderRadius: "14px",
    padding: "14px 14px",
    marginBottom: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },

  userName: {
    margin: 0,
    fontWeight: "700",
    fontSize: "15px",
    color: "#ffffff",
  },

  userRole: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#dcfce7",
    letterSpacing: "0.3px",
  },

  button: {
    width: "100%",
    padding: "13px 14px",
    border: "none",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
    color: "#166534",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(0, 0, 0, 0.08)",
  },
};

export default Sidebar;