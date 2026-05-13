import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import logoMae from "../../assets/mae.png";
import { FiHome, FiFileText, FiUsers } from "react-icons/fi";

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
        <div style={styles.logoBlock}>
          <img src={logoMae} alt="MAE Logo" style={styles.logoImage} />
          <p style={styles.appName}>Gestion Réclamations</p>
        </div>

        <div style={styles.sectionTitle}>Menu principal</div>

        <nav style={styles.nav}>
          <MenuLink to="/dashboard" icon={<FiHome />} label="Tableau de bord" />
          <MenuLink to="/complaints" icon={<FiFileText />} label="Réclamations" />

          {user?.role === "ADMIN" && (
            <MenuLink to="/users" icon={<FiUsers />} label="Utilisateurs" />
          )}
        </nav>
      </div>

      <div style={styles.footerBlock}>
        <NavLink to="/profile" style={styles.userBox}>
          <div style={styles.avatar}>
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>

          <div>
            <p style={styles.userName}>{user?.name || "Utilisateur"}</p>
            <p style={styles.userRole}>{user?.role || "ADMIN"}</p>
          </div>
        </NavLink>

        <button onClick={handleLogout} style={styles.button}>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}

function MenuLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...styles.link,
        ...(isActive ? styles.activeLink : {}),
      })}
    >
      <span style={styles.icon}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

const styles = {
 sidebar: {
  width: "270px",
  minHeight: "100vh",
  background: "#0f5a33",
  color: "#ffffff",
  padding: "24px 18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  flexShrink: 0,
  position: "sticky",
  top: 0,
  boxSizing: "border-box",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "2px 0 12px rgba(0,0,0,0.25)",
},

  logoBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "32px",
  },

  logoImage: {
    width: "92px",
    height: "92px",
    objectFit: "contain",
    marginBottom: "10px",
  },

  appName: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "600",
    color: "#d1fae5",
    letterSpacing: "0.3px",
  },

  sectionTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#9be7bd",
    textTransform: "uppercase",
    letterSpacing: "1px",
    margin: "0 0 12px 10px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  link: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textDecoration: "none",
    color: "#d1fae5",
    padding: "13px 14px",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "15px",
    transition: "0.2s ease",
  },

  activeLink: {
    backgroundColor: "rgba(255,255,255,0.1)", // léger highlight
    color: "#ffffff",
    borderLeft: "4px solid #22c55e", // effet pro
  },

  icon: {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  color: "#bbf7d0",
  },

  footerBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  userBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "13px",
    border: "1px solid rgba(255,255,255,0.1)",
    textDecoration: "none",
    color: "#ffffff",
    cursor: "pointer",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    color: "#0b4f2f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "17px",
  },

  userName: {
    margin: 0,
    fontWeight: "700",
    fontSize: "14px",
    color: "#ffffff",
    textTransform: "capitalize",
  },

  userRole: {
    margin: "3px 0 0",
    fontSize: "12px",
    color: "#bbf7d0",
  },

  button: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#f8fafc",
    color: "#0b4f2f",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
  },
};

export default Sidebar;
