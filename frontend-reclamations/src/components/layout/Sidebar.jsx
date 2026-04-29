import { useContext, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import logoMae from "../../assets/mae.png";

function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);

      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="sidebar-wrapper">
      <button
        className="sidebar-menu-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        style={{
          ...styles.menuToggle,
          display: isMobile ? "flex" : "none",
        }}
        aria-label="Open menu"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          style={styles.overlay}
          onClick={closeMobileMenu}
        />
      )}

      <aside
        className={isMobileOpen ? "mobile-open" : ""}
        style={{
          ...styles.sidebar,
          ...(isMobile && !isMobileOpen
            ? { transform: "translateX(-100%)" }
            : {}),
        }}
      >
        <div>
          <div className="brand-block" style={styles.brandBlock}>
            <div className="logo-container" style={styles.logoContainer}>
              <img src={logoMae} alt="MAE Logo" style={styles.logoImage} />
            </div>

            <p style={styles.userEmail}>{user?.email || "user@mae.tn"}</p>

            <div style={styles.divider} />
          </div>

          <nav style={styles.nav}>
            <NavLink
              to="/dashboard"
              onClick={closeMobileMenu}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              <svg style={styles.icon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/complaints"
              onClick={closeMobileMenu}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              <svg style={styles.icon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" />
              </svg>
              <span>Réclamations</span>
            </NavLink>

            {user?.role === "ADMIN" && (
              <NavLink
                to="/users"
                onClick={closeMobileMenu}
                style={({ isActive }) => ({
                  ...styles.link,
                  ...(isActive ? styles.activeLink : {}),
                })}
              >
                <svg
                  style={styles.icon}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
                <span>Utilisateurs</span>
              </NavLink>
            )}
          </nav>
        </div>

        <div className="footer-block" style={styles.footerBlock}>
          <button onClick={handleLogout} style={styles.button}>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

const styles = {
  menuToggle: {
    position: "fixed",
    top: "20px",
    left: "20px",
    zIndex: 1001,
    background: "#166534",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 998,
  },

  sidebar: {
    width: "280px",
    height: "100vh",
    boxSizing: "border-box",
    background:
      "linear-gradient(180deg, #166534 0%, #14532d 55%, #0f4d29 100%)",
    color: "#ffffff",
    padding: "26px 18px 20px 18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    overflow: "hidden",
    boxShadow: "4px 0 24px rgba(0, 0, 0, 0.15)",
    transition: "transform 0.3s ease",
    zIndex: 999,
  },

  brandBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    marginBottom: "34px",
  },

  logoContainer: {
    position: "relative",
    width: "92px",
    height: "92px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.1)",
    padding: "8px",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer",
  },

  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: "50%",
  },

  userEmail: {
    marginTop: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#dcfce7",
    textAlign: "center",
    wordBreak: "break-all",
  },

  divider: {
    width: "80%",
    height: "1px",
    background: "linear-gradient(to right, transparent, #bbf7d0, transparent)",
    marginTop: "16px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  link: {
    position: "relative",
    textDecoration: "none",
    color: "#ffffff",
    padding: "14px 16px",
    borderRadius: "14px",
    fontWeight: "600",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    overflow: "hidden",
  },

  activeLink: {
    backgroundColor: "#15803d",
    boxShadow: "0 4px 16px rgba(21, 128, 61, 0.4)",
  },

  icon: {
    width: "20px",
    height: "20px",
    flexShrink: 0,
  },

  footerBlock: {
    marginTop: "20px",
  },

  button: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
    color: "#166534",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "15px",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
  },
};

export default Sidebar;